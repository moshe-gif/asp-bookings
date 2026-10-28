"""
The video library (migration 0068, owner 2026-10-28: "Think Splice, but for performance videos").
Real end to end against production Supabase:

- the public page /videos/ (no login) lists the singers and opens a singer's page with its filters;
- an admin adds a throwaway singer, uploads a real (browser-made, 2-second) video into it through the
  drop zone (resumable upload straight to storage, thumbnail and length taken in the browser), tags
  it in the tagging table, and the public page shows it with its tags, filters it, plays it and serves
  the original file for download -- then the test removes the singer, which deletes its video and files.

Writes only the "Harness Test Singer" rows and files, and removes them before it ends (also if a
previous run left one behind).
"""
import base64
import urllib.request

from helpers import login_as, goto_nav, collect_console_errors

TEST_SINGER = "Harness Test Singer"


def _make_webm(page):
    # A 2-second WebM drawn on a canvas and recorded by the browser itself (no ffmpeg needed).
    b64 = page.evaluate("""async () => {
        const c = document.createElement('canvas'); c.width = 320; c.height = 180;
        const g = c.getContext('2d'); const rec = new MediaRecorder(c.captureStream(15), { mimeType:'video/webm' });
        const parts = []; rec.ondataavailable = e => parts.push(e.data);
        rec.start(200); const t0 = performance.now();
        await new Promise(res => { (function draw(){ const t = performance.now() - t0;
            g.fillStyle = `hsl(${(t/10)%360},70%,45%)`; g.fillRect(0,0,320,180); g.fillStyle = '#fff'; g.font = '28px sans-serif'; g.fillText('ASP ' + (t/1000).toFixed(1), 90, 100);
            if(t < 2000) requestAnimationFrame(draw); else res(); })(); });
        await new Promise(res => { rec.onstop = res; rec.stop(); });
        const buf = await new Blob(parts, { type:'video/webm' }).arrayBuffer();
        let s = ''; new Uint8Array(buf).forEach(b => s += String.fromCharCode(b)); return btoa(s);
    }""")
    return base64.b64decode(b64)


def _remove_test_singer(page):
    # Through the app, as an admin (the same path a person uses), so its videos and files go too.
    page.evaluate("""async (name) => {
        const { data } = await supabaseClient.from('library_singers').select('id, photo_path').eq('name', name);
        for (const s of data || []) {
            const { data: vids } = await supabaseClient.from('library_videos').select('video_path, thumb_path').eq('singer_id', s.id);
            const files = (vids || []).flatMap(v => [v.video_path, v.thumb_path]).concat([s.photo_path]).filter(Boolean);
            await supabaseClient.from('library_singers').delete().eq('id', s.id);
            if (files.length) await supabaseClient.storage.from('library').remove(files);
        }
    }""", TEST_SINGER)


def test_public_library_lists_singers(live_server, page):
    errors = collect_console_errors(page)
    page.goto(live_server + "/videos/")
    cards = page.locator('[data-testid="singer-card"]')
    cards.first.wait_for(state="visible", timeout=15000)
    assert cards.count() >= 1
    name = cards.first.locator("strong").inner_text()
    cards.first.click()
    page.locator("h1", has_text=name).wait_for(state="visible", timeout=10000)
    page.get_by_role("link", name="← All singers").click()
    cards.first.wait_for(state="visible", timeout=10000)
    assert not errors, f"console errors: {errors}"


def test_admin_uploads_tags_and_client_downloads(live_server, page, browser):
    page.goto(live_server)
    login_as(page, "admin_bookings")
    page.on("dialog", lambda d: d.accept())
    errors = collect_console_errors(page)
    _remove_test_singer(page)
    try:
        goto_nav(page, "videos")
        # The tab opens on the library itself (the client view); managing is on the other tabs.
        page.frame_locator('[data-testid="lib-browse"]').locator('[data-testid="singer-card"]').first.wait_for(state="visible", timeout=20000)
        page.locator('[data-action="lib-tab"][data-id="videos"]').click()
        page.locator('[data-testid="lib-upload"]').wait_for(state="visible", timeout=20000)

        # Add the singer.
        page.locator('[data-action="lib-tab"][data-id="singers"]').click()
        page.locator("[data-lib-new-singer]").fill(TEST_SINGER)
        page.locator('[data-action="lib-add-singer"]').click()
        page.locator(f'[data-lib-singer-name][value="{TEST_SINGER}"]').wait_for(state="attached", timeout=10000)

        # Upload a real video into them.
        page.locator('[data-action="lib-tab"][data-id="videos"]').click()
        page.locator("[data-lib-upload-singer]").select_option(label=TEST_SINGER)
        video = _make_webm(page)
        page.locator("[data-lib-files]").set_input_files({"name": "Harness_Wedding_Clip.webm", "mimeType": "video/webm", "buffer": video})
        row = page.locator('[data-testid="lib-row"]', has=page.locator('[data-lib-title][value="Harness Wedding Clip"]'))
        row.wait_for(state="visible", timeout=60000)

        # Tag it: Event = Wedding, Tempo = Fast.
        wedding = page.evaluate("() => S.lib.tags.find(t => t.category==='event' && t.name==='Wedding').id")
        fast = page.evaluate("() => S.lib.tags.find(t => t.category==='tempo' && t.name==='Fast').id")
        row.locator('[data-lib-tag="event"]').select_option(wedding)
        page.wait_for_function("id => S.lib.videos.some(v => v.title==='Harness Wedding Clip' && v.tagIds.includes(id))", arg=wedding, timeout=10000)
        row = page.locator('[data-testid="lib-row"]', has=page.locator('[data-lib-title][value="Harness Wedding Clip"]'))
        row.locator('[data-lib-tag="tempo"]').select_option(fast)
        page.wait_for_function("id => S.lib.videos.some(v => v.title==='Harness Wedding Clip' && v.tagIds.includes(id))", arg=fast, timeout=10000)
        v = page.evaluate("() => S.lib.videos.find(v => v.title==='Harness Wedding Clip')")
        assert v["thumb_path"], "the thumbnail was taken in the browser and uploaded"
        # (A browser recording states no length, so duration_s may be empty here; camera files have one.)
        assert v["duration_s"] is None or 1 <= float(v["duration_s"]) <= 4

        # A client (no login) finds it, filters it and downloads the original.
        client = browser.new_page()
        client.goto(live_server + "/videos/#/harness-test-singer")
        card = client.locator('[data-testid="video-card"]')
        card.first.wait_for(state="visible", timeout=15000)
        text = card.first.inner_text()
        assert "Harness Wedding Clip" in text and "Wedding" in text and "Fast" in text
        assert client.locator('.chip', has_text="Slow").count() == 0   # only the options this singer uses
        client.locator('.chip', has_text="Wedding").click()
        assert client.locator('[data-testid="video-card"]').count() == 1
        href = card.first.locator('[data-testid="download"]').get_attribute("href")
        with urllib.request.urlopen(urllib.request.Request(href, method="GET")) as r:
            assert r.status == 200 and r.read() == video, "the download is the original file"
            assert "attachment" in (r.headers.get("Content-Disposition") or "")
        client.locator('[data-play]').first.click()
        client.locator(".ov video").wait_for(state="visible", timeout=10000)
        client.close()
    finally:
        _remove_test_singer(page)
    assert not errors, f"console errors: {errors}"
