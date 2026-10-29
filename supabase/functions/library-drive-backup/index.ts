// Copies every Video Library video into Google Drive (migration 0074; owner 2026-10-29: "connect the video
// library to backup all footage in google drive backup", account office@aspmgmt.com).
//   (cron, x-cron-secret)  every 10 minutes: copy what isn't in Drive yet
//   {action:"run"}         a library admin: the same, now
//   {action:"status"}      a library admin: connected?, how many are backed up / waiting / failing
// Files land in "ASP Media Library / <singer>" as the original file. Big files go up in 32 MB pieces through
// Google's resumable upload; the place reached is saved after every piece, so a run that ends mid-file (each
// run stops after ~100 seconds) carries on next time. Deleting a video in the app never touches Drive.
// Access is Google's "drive.file": the app sees only the files and folders it made itself.
// JWT verification OFF (the schedule calls it with x-cron-secret); callers are checked here.
import { createClient } from "../_shared/deps.ts";
import { jsonFor, preflight, readJson } from "../_shared/http.ts";
import { serviceClient } from "../_shared/auth.ts";

const BUCKET = "library";
const ROOT_NAME = "ASP Media Library";
const CHUNK = 32 * 1024 * 1024;         // a multiple of 256 KB, as Google requires
const BUDGET_MS = 100_000;
const FOLDER = "application/vnd.google-apps.folder";
// deno-lint-ignore no-explicit-any
type Any = any;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight(req);
  const json = jsonFor(req);
  const cronSecret = Deno.env.get("CRON_SECRET");
  const fromCron = !!cronSecret && req.headers.get("x-cron-secret") === cronSecret;
  if (!fromCron) {
    const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ ok: false, error: "not authenticated" }, 401);
    const { data: ok } = await caller.rpc("is_library_admin");
    if (!ok) return json({ ok: false, error: "not authorized" }, 403);
  }
  const b = await readJson<Any>(req);
  const sb = serviceClient();
  if (b?.action === "status") return json(await status(sb));
  return json(await run(sb));
});

async function status(sb: Any) {
  const [{ data: cfg }, { data: vids }, { data: files }] = await Promise.all([
    sb.from("drive_backup").select("account_email, refresh_token, connected_at, last_run_at, last_error").eq("id", 1).maybeSingle(),
    sb.from("library_videos").select("id"),
    sb.from("library_drive_files").select("video_id, backed_up_at, error, uploaded_bytes, total_bytes"),
  ]);
  const byId = new Map((files || []).map((f: Any) => [f.video_id, f]));
  const live = (vids || []).map((v: Any) => byId.get(v.id) as Any);
  return {
    ok: true, connected: !!cfg?.refresh_token, email: cfg?.account_email || null, connectedAt: cfg?.connected_at || null,
    lastRunAt: cfg?.last_run_at || null, lastError: cfg?.last_error || null,
    total: live.length, backedUp: live.filter((f: Any) => f?.backed_up_at).length,
    failing: live.filter((f: Any) => f && !f.backed_up_at && f.error).length,
  };
}

async function run(sb: Any) {
  const started = Date.now();
  // One run at a time (the schedule and a "Back up now" click could meet).
  const until = new Date(Date.now() + 3 * 60_000).toISOString();
  const { data: lock } = await sb.from("drive_backup").update({ running_until: until })
    .eq("id", 1).or(`running_until.is.null,running_until.lt.${new Date().toISOString()}`).select("*").maybeSingle();
  if (!lock) return { ok: true, skipped: "a backup is already running" };
  let done = 0, lastError: string | null = null;
  try {
    if (!lock.refresh_token) return { ok: false, error: "Google Drive is not connected yet." };
    const token = await accessToken(sb, lock);
    const root = await ensureRoot(sb, token, lock);
    const [{ data: vids }, { data: files }, { data: singers }] = await Promise.all([
      sb.from("library_videos").select("id, singer_id, title, songs, recorded_on, video_path, file_name, size_bytes, mime").order("created_at"),
      sb.from("library_drive_files").select("*"),
      sb.from("library_singers").select("id, name, slug"),
    ]);
    // The test harness's throwaway singer never goes to Drive (its files are deleted minutes later).
    const harness = new Set((singers || []).filter((s: Any) => String(s.slug || "").startsWith("harness-test")).map((s: Any) => s.id));
    const state = new Map((files || []).map((f: Any) => [f.video_id, f]));
    // Waiting first, then the ones that failed before (fewest tries first), so one bad file can't block the rest.
    const todo = (vids || []).filter((v: Any) => !harness.has(v.singer_id) && !(state.get(v.id) as Any)?.backed_up_at)
      .sort((a: Any, c: Any) => ((state.get(a.id) as Any)?.attempts || 0) - ((state.get(c.id) as Any)?.attempts || 0));
    for (const v of todo) {
      if (Date.now() - started > BUDGET_MS) break;
      const singer = (singers || []).find((s: Any) => s.id === v.singer_id);
      try {
        const folder = await ensureSingerFolder(sb, token, root, singer);
        const finished = await uploadVideo(sb, token, folder, v, (state.get(v.id) as Any) || null, started);
        if (finished) done++;
      } catch (e) {
        lastError = `${v.title}: ${String((e as Error)?.message || e)}`.slice(0, 500);
        const prev = (state.get(v.id) as Any) || {};
        await sb.from("library_drive_files").upsert({ video_id: v.id, attempts: (prev.attempts || 0) + 1, error: lastError, updated_at: new Date().toISOString() }, { onConflict: "video_id" });
      }
    }
    return { ok: true, backedUp: done, error: lastError };
  } catch (e) {
    lastError = String((e as Error)?.message || e).slice(0, 500);
    return { ok: false, error: lastError };
  } finally {
    await sb.from("drive_backup").update({ running_until: null, last_run_at: new Date().toISOString(), last_error: lastError }).eq("id", 1);
  }
}

async function accessToken(sb: Any, cfg: Any): Promise<string> {
  if (cfg.access_token && cfg.access_token_expires_at && new Date(cfg.access_token_expires_at).getTime() > Date.now() + 5 * 60_000) return cfg.access_token;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: Deno.env.get("GMAIL_CLIENT_ID")!, client_secret: Deno.env.get("GMAIL_CLIENT_SECRET")!, refresh_token: cfg.refresh_token, grant_type: "refresh_token" }),
  });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token) throw new Error(`Google sign-in expired (${t.error || r.status}); connect Google Drive again`);
  await sb.from("drive_backup").update({ access_token: t.access_token, access_token_expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString() }).eq("id", 1);
  return t.access_token;
}

async function drive(token: string, path: string, init: RequestInit = {}): Promise<Any> {
  const r = await fetch(`https://www.googleapis.com/drive/v3/${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Google Drive ${r.status}: ${body?.error?.message || "error"}`);
  return body;
}
// A folder this app made that is still there (not trashed); else null.
async function folderAlive(token: string, id: string | null): Promise<boolean> {
  if (!id) return false;
  try { const f = await drive(token, `files/${encodeURIComponent(id)}?fields=id,trashed`); return !f.trashed; } catch { return false; }
}
async function makeFolder(token: string, name: string, parent?: string): Promise<string> {
  const f = await drive(token, "files?fields=id", { method: "POST", body: JSON.stringify({ name, mimeType: FOLDER, ...(parent ? { parents: [parent] } : {}) }) });
  return f.id;
}
async function ensureRoot(sb: Any, token: string, cfg: Any): Promise<string> {
  if (await folderAlive(token, cfg.root_folder_id)) return cfg.root_folder_id;
  const id = await makeFolder(token, ROOT_NAME);
  await sb.from("drive_backup").update({ root_folder_id: id }).eq("id", 1);
  await sb.from("library_drive_folders").delete().neq("folder_id", "");   // the old singer folders went with it
  return id;
}
const folderCache = new Map<string, string>();
async function ensureSingerFolder(sb: Any, token: string, root: string, singer: Any): Promise<string> {
  const key = singer?.id || "none";
  if (folderCache.has(key)) return folderCache.get(key)!;
  if (!singer) { folderCache.set(key, root); return root; }
  const { data: row } = await sb.from("library_drive_folders").select("folder_id").eq("singer_id", singer.id).maybeSingle();
  let id = row?.folder_id || null;
  if (!(await folderAlive(token, id))) {
    id = await makeFolder(token, String(singer.name || "Singer").slice(0, 120), root);
    await sb.from("library_drive_folders").upsert({ singer_id: singer.id, folder_id: id }, { onConflict: "singer_id" });
  }
  folderCache.set(key, id!);
  return id!;
}

// Returns true when the video is fully in Drive; false when the time ran out part-way (it resumes next run).
async function uploadVideo(sb: Any, token: string, folder: string, v: Any, prev: Any, started: number): Promise<boolean> {
  const { data: signed, error } = await sb.storage.from(BUCKET).createSignedUrl(v.video_path, 3600);
  if (error || !signed?.signedUrl) throw new Error(`file not found in the library (${error?.message || "no link"})`);
  const src = signed.signedUrl;
  let total = Number(v.size_bytes) || 0;
  if (!total) {
    const h = await fetch(src, { method: "HEAD" });
    total = Number(h.headers.get("content-length")) || 0;
    if (!total) throw new Error("could not read the file's size");
  }
  const save = (patch: Any) => sb.from("library_drive_files").upsert({ video_id: v.id, total_bytes: total, updated_at: new Date().toISOString(), ...patch }, { onConflict: "video_id" });

  let session: string | null = prev?.upload_url || null, offset = 0;
  if (session) offset = await confirmedOffset(session, total);   // -1: the link expired, start over
  if (!session || offset < 0) {
    const name = v.file_name || `${v.title}.mp4`;
    const r = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": v.mime || "video/mp4", "X-Upload-Content-Length": String(total) },
      body: JSON.stringify({ name, parents: [folder], description: [v.title, v.songs, v.recorded_on].filter(Boolean).join(" · ") }),
    });
    session = r.headers.get("location");
    if (!r.ok || !session) throw new Error(`Google Drive ${r.status}: ${(await r.text()).slice(0, 200)}`);
    offset = 0;
    await save({ upload_url: session, uploaded_bytes: 0, error: null });
  }
  if (offset >= total) {                                          // it had arrived; only the note was missing
    await save({ upload_url: null, uploaded_bytes: total, backed_up_at: new Date().toISOString(), error: null });
    return true;
  }
  while (offset < total) {
    if (Date.now() - started > BUDGET_MS) return false;
    const end = Math.min(offset + CHUNK, total) - 1;
    const part = await fetch(src, { headers: { Range: `bytes=${offset}-${end}` } });
    if (part.status !== 206 && !(part.status === 200 && offset === 0 && end === total - 1)) throw new Error(`could not read the file (${part.status})`);
    const bytes = new Uint8Array(await part.arrayBuffer());
    if (bytes.length !== end - offset + 1) throw new Error("the file read came back short");
    const put = await fetch(session, { method: "PUT", headers: { "Content-Range": `bytes ${offset}-${end}/${total}` }, body: bytes });
    if (put.status === 200 || put.status === 201) {
      const f = await put.json().catch(() => ({}));
      await save({ drive_file_id: f.id || null, upload_url: null, uploaded_bytes: total, backed_up_at: new Date().toISOString(), error: null });
      return true;
    }
    if (put.status !== 308) throw new Error(`Google Drive ${put.status}: ${(await put.text()).slice(0, 200)}`);
    const range = put.headers.get("range");                     // "bytes=0-N": what Google has
    offset = range ? Number(range.split("-")[1]) + 1 : 0;
    await save({ uploaded_bytes: offset });
  }
  return false;
}
// Asks Google how much of an unfinished upload it has. -1 when the upload link is no longer valid.
async function confirmedOffset(session: string, total: number): Promise<number> {
  const r = await fetch(session, { method: "PUT", headers: { "Content-Range": `bytes */${total}` } });
  await r.body?.cancel();
  if (r.status === 308) { const range = r.headers.get("range"); return range ? Number(range.split("-")[1]) + 1 : 0; }
  if (r.status === 200 || r.status === 201) return total;
  return -1;
}
