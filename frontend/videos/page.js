/* videos/index.html's own code, kept in a file so the page's Content-Security-Policy can forbid inline scripts (2026-11-12 audit #7.2). */
(function(){
  const SUPABASE_URL = 'https://psgpxbkncuavlnpplykf.supabase.co';
  const KEY = 'sb_publishable_Orec7KI9Lwqd_ZfsKaEq9g__ewGiEiT';
  // The app's saved session (supabase-js keeps it under this key; the app refreshes it).
  const SESSION_KEY = 'sb-psgpxbkncuavlnpplykf-auth-token';
  function token(){
    try{ const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); return s && s.access_token && (!s.expires_at || s.expires_at*1000 > Date.now()) ? s.access_token : null; }catch(e){ return null; }
  }
  const SIGNED = {};
  const FILE = p => SIGNED[p] || '';
  const CATS = [['event','Event'],['tempo','Tempo'],['lifestyle','Crowd']];
  const root = document.getElementById('root');
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials = n => String(n||'?').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const dur = s => { s = Math.round(Number(s)||0); if(!s) return ''; const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0'); };
  const PLAY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>';
  const FILM = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/></svg>';
  const DL = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>';
  let D = null;                     // { singers, tags, videos }
  const F = { event:new Set(), tempo:new Set(), lifestyle:new Set(), singer:new Set(), q:'' };

  const auth = () => ({ apikey:KEY, Authorization:`Bearer ${token()}` });
  async function get(path){
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers:auth() });
    if(!r.ok) throw new Error('load ' + r.status);
    return r.json();
  }
  async function sign(paths){
    const todo = [...new Set(paths.filter(Boolean))];
    for(let i=0; i<todo.length; i+=500){
      const r = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/library`, { method:'POST', headers:{ ...auth(), 'Content-Type':'application/json' }, body:JSON.stringify({ expiresIn:6*3600, paths:todo.slice(i, i+500) }) });
      if(!r.ok) throw new Error('sign ' + r.status);
      (await r.json()).forEach(x=>{ if(x.signedURL) SIGNED[x.path] = `${SUPABASE_URL}/storage/v1${x.signedURL}`; });
    }
  }
  function locked(msg){
    root.innerHTML = `${header(false, true)}<div class="empty">${FILM}<strong>Private library</strong><span>${msg}</span>
      <a class="btn btn-gold" href="../" target="_top" style="margin-top:6px;">Open the ASP app</a></div>`;
  }
  async function load(){
    if(!token()) return 'signin';
    const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/can_view_library`, { method:'POST', headers:{ ...auth(), 'Content-Type':'application/json' }, body:'{}' });
    if(!r.ok || (await r.json()) !== true) return 'denied';
    const [singers, tags, videos] = await Promise.all([
      get('library_singers?select=id,slug,name,photo_path&active=eq.true&order=sort,name'),
      get('library_tags?select=id,category,name&order=category,sort,name'),
      get('library_videos?select=id,singer_id,title,songs,recorded_on,duration_s,video_path,thumb_path,file_name,mime,library_video_tags(tag_id)&published=eq.true&mime=not.like.image/*&order=recorded_on.desc.nullslast,created_at.desc'),
    ]);
    const tagById = new Map(tags.map(t=>[t.id,t]));
    videos.forEach(v=>{ v.tags = (v.library_video_tags||[]).map(x=>tagById.get(x.tag_id)).filter(Boolean); });
    await sign([...videos.flatMap(v=>[v.video_path, v.thumb_path]), ...singers.map(s=>s.photo_path)]);
    D = { singers, tags, videos };
    return 'ok';
  }

  function route(){
    stopPreviews();
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    if(!h) return home();
    if(h==='all') return library(null);
    const s = D.singers.find(x=>x.slug===h);
    return s ? library(s) : home();
  }
  function header(back, bare){
    return `<div class="top"><img class="logo" src="../assets/brand/asp-horizontal-light.png" alt="ASP Management" width="170" height="22"/>
      ${bare ? '' : back ? `<a class="btn" href="#/">← All singers</a>` : `<a class="btn" href="#/all">Search all videos</a>`}</div>`;
  }
  function home(){
    document.title = 'ASP Video Library';
    const count = id => D.videos.filter(v=>v.singer_id===id).length;
    root.innerHTML = `${header(false)}
      <div class="intro"><div class="label" style="margin-bottom:8px;">Performance videos</div>
        <h1>Choose a singer</h1><p>Watch live performances, filter by event, tempo and crowd, and download the original files.</p></div>
      ${D.singers.length ? `<div class="singers">${D.singers.map(s=>`<a class="singer" href="#/${encodeURIComponent(s.slug)}" data-testid="singer-card">
        <div class="ph">${s.photo_path ? `<img src="${esc(FILE(s.photo_path))}" alt="" loading="lazy"/>` : esc(initials(s.name))}</div>
        <div class="nm"><strong>${esc(s.name)}</strong><span class="muted">${count(s.id)} video${count(s.id)===1?'':'s'}</span></div></a>`).join('')}</div>`
        : `<div class="empty">${FILM}<strong>No singers yet</strong></div>`}`;
    window.scrollTo(0,0);
  }

  let current = null;
  function library(singer){
    if(current !== (singer ? singer.id : 'all')){ ['event','tempo','lifestyle','singer'].forEach(k=>F[k].clear()); F.q=''; current = singer ? singer.id : 'all'; }
    document.title = singer ? `${singer.name} — ASP Video Library` : 'All videos — ASP Video Library';
    const pool = singer ? D.videos.filter(v=>v.singer_id===singer.id) : D.videos;
    // Only the options this library actually uses (an empty chip would only ever show nothing).
    const used = new Set(pool.flatMap(v=>v.tags.map(t=>t.id)));
    const rows = CATS.map(([c,label])=>{ const opts = D.tags.filter(t=>t.category===c && used.has(t.id)); return opts.length ? `<div class="frow"><span class="label">${label}</span><div class="chips">${opts.map(t=>`<button class="chip" data-f="${c}" data-v="${esc(t.id)}" aria-pressed="${F[c].has(t.id)}">${esc(t.name)}</button>`).join('')}</div></div>` : ''; });
    if(!singer && D.singers.length > 1) rows.unshift(`<div class="frow"><span class="label">Singer</span><div class="chips">${D.singers.map(s=>`<button class="chip" data-f="singer" data-v="${esc(s.id)}" aria-pressed="${F.singer.has(s.id)}">${esc(s.name)}</button>`).join('')}</div></div>`);
    root.innerHTML = `${header(true)}
      <div class="hero">${singer ? `<div class="av">${singer.photo_path ? `<img src="${esc(FILE(singer.photo_path))}" alt=""/>` : esc(initials(singer.name))}</div>` : ''}
        <div style="min-width:0;"><div class="label" style="margin-bottom:4px;">Performance videos</div><h1>${esc(singer ? singer.name : 'All singers')}</h1></div></div>
      ${rows.join('') ? `<div class="filters">${rows.join('')}</div>` : ''}
      <div class="bar"><input class="search" type="search" placeholder="Search titles and songs" value="${esc(F.q)}" data-q/>
        <span style="display:flex;align-items:center;gap:10px;"><span class="muted" id="count"></span><button class="btn" data-clear>Clear all</button></span></div>
      <div id="results"></div>`;
    root.querySelectorAll('.chip').forEach(b=>b.addEventListener('click', ()=>{ const set = F[b.dataset.f]; set.has(b.dataset.v) ? set.delete(b.dataset.v) : set.add(b.dataset.v); b.setAttribute('aria-pressed', set.has(b.dataset.v)); results(pool); }));
    root.querySelector('[data-q]').addEventListener('input', e=>{ F.q = e.target.value; results(pool); });
    root.querySelector('[data-clear]').addEventListener('click', ()=>{ ['event','tempo','lifestyle','singer'].forEach(k=>F[k].clear()); F.q=''; library(singer); });
    results(pool);
  }
  // Within a filter any chosen option matches; across filters all must.
  function matches(v){
    for(const [c] of CATS){ if(F[c].size && !v.tags.some(t=>t.category===c && F[c].has(t.id))) return false; }
    if(F.singer.size && !F.singer.has(v.singer_id)) return false;
    const q = F.q.trim().toLowerCase();
    return !q || `${v.title} ${v.songs||''}`.toLowerCase().includes(q);
  }
  function results(pool){
    stopPreviews();
    const list = pool.filter(matches);
    const any = ['event','tempo','lifestyle','singer'].some(k=>F[k].size) || F.q.trim();
    document.getElementById('count').textContent = `${list.length} video${list.length===1?'':'s'}`;
    const singerName = id => (D.singers.find(s=>s.id===id)||{}).name || '';
    document.getElementById('results').innerHTML = list.length ? `<div class="grid">${list.map(v=>`<div class="vid" data-testid="video-card">
      <button class="thumb" data-play="${esc(v.id)}" aria-label="Play ${esc(v.title)}">${v.thumb_path ? `<img src="${esc(FILE(v.thumb_path))}" alt="" loading="lazy"/>` : ''}<span class="play">${PLAY}</span>${dur(v.duration_s) ? `<span class="dur">${dur(v.duration_s)}</span>` : ''}</button>
      <div class="vb"><div class="vt">${esc(v.title)}</div>${v.songs || current==='all' ? `<div class="vs">${esc([current==='all' ? singerName(v.singer_id) : '', v.songs].filter(Boolean).join(' · '))}</div>` : ''}
        ${v.tags.length ? `<div class="badges">${CATS.flatMap(([c])=>v.tags.filter(t=>t.category===c)).map(t=>`<span class="badge">${esc(t.name)}</span>`).join('')}</div>` : ''}
        <div class="vf"><span class="muted">${v.recorded_on ? esc(new Date(v.recorded_on+'T00:00:00').toLocaleDateString('en-US',{ month:'short', year:'numeric' })) : ''}</span>
          <a class="btn btn-gold" href="${esc(downloadUrl(v))}" data-testid="download">${DL} Download</a></div></div></div>`).join('')}</div>`
      : `<div class="empty">${FILM}${any ? '<strong>No videos match</strong><span>Try removing a filter.</span>' : '<strong>No videos here yet</strong><span>New performances will appear here soon.</span>'}</div>`;
    document.querySelectorAll('[data-play]').forEach(b=>{
      b.addEventListener('click', ()=>openPlayer(D.videos.find(v=>v.id===b.dataset.play)));
      // A preview on hover (mouse only; on a phone a tap opens the player).
      if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
        let t = null;
        b.addEventListener('mouseenter', ()=>{ t = setTimeout(()=>preview(b), 350); });
        b.addEventListener('mouseleave', ()=>{ clearTimeout(t); stopPreviews(); });
      }
    });
  }
  const downloadUrl = v => `${FILE(v.video_path)}&download=${encodeURIComponent(v.file_name || (v.title + '.mp4'))}`;
  function preview(btn){
    const v = D.videos.find(x=>x.id===btn.dataset.play); if(!v) return;
    stopPreviews();
    const el = document.createElement('video');
    el.muted = true; el.playsInline = true; el.preload = 'metadata'; el.setAttribute('data-preview','');
    el.src = FILE(v.video_path) + '#t=' + Math.max(0, Math.round((Number(v.duration_s)||0) * 0.2));
    el.addEventListener('loadeddata', ()=>{ el.play().catch(()=>{}); });
    btn.appendChild(el);
  }
  function stopPreviews(){ document.querySelectorAll('video[data-preview]').forEach(el=>{ el.pause(); el.removeAttribute('src'); el.load(); el.remove(); }); }
  function openPlayer(v){
    if(!v) return;
    stopPreviews();
    const ov = document.createElement('div');
    ov.className = 'ov';
    ov.innerHTML = `<div class="player" role="dialog" aria-label="${esc(v.title)}"><div class="ph-bar"><strong style="overflow-wrap:anywhere;min-width:0;">${esc(v.title)}</strong>
        <span style="display:flex;gap:8px;"><a class="btn btn-gold" href="${esc(downloadUrl(v))}">${DL} Download</a><button class="btn" data-close>Close</button></span></div>
      <video controls autoplay playsinline src="${esc(FILE(v.video_path))}"${v.thumb_path ? ` poster="${esc(FILE(v.thumb_path))}"` : ''}></video></div>`;
    const close = ()=>{ const el = ov.querySelector('video'); el.pause(); el.removeAttribute('src'); el.load(); ov.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = e=>{ if(e.key==='Escape') close(); };
    ov.addEventListener('click', e=>{ if(e.target===ov || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(ov);
  }

  // Shown inside the app (the Videos tab): the app has its own header, so no second logo.
  if(new URLSearchParams(location.search).has('embed')) document.body.classList.add('embed');
  window.addEventListener('hashchange', ()=>{ if(D) route(); });
  load().then(r=>{
    if(r==='signin') return locked('Sign in to the ASP app to watch the library.');
    if(r==='denied') return locked("Your account doesn't have access to the video library. Ask the office if you need it.");
    route();
  }).catch(()=>{ root.innerHTML = `${header(false, true)}<div class="empty">${FILM}<strong>The library couldn't load</strong><span>Please refresh the page.</span></div>`; });
})();
