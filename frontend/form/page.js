/* form/index.html's own code, kept in a file so the page's Content-Security-Policy can forbid inline scripts (2026-11-12 audit #7.2). */
(function(){
  const FN = 'https://psgpxbkncuavlnpplykf.supabase.co/functions/v1/gig-form';
  const root = document.getElementById('root');
  let token = '';
  // A WhatsApp button can't carry a #, so it opens ?t=<token>; move it back into the #.
  try{ const t = new URLSearchParams(location.search).get('t'); if (t && !location.hash) history.replaceState(null, '', location.pathname + '#' + encodeURIComponent(t)); }catch(e){}
  try{ token = decodeURIComponent((location.hash||'').replace(/^#/, '')); }catch(e){}
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const MESSAGES = {
    not_found: ['This link doesn’t work', 'Check that you opened the whole link, or ask us to send it again.'],
    expired:   ['This link has expired', 'Ask us and we’ll send a fresh link.'],
    server:    ['Something went wrong', 'Please try again in a minute.'],
    network:   ['No connection', 'Check your internet connection and reload this page.'],
  };
  const DRAFT = 'asp_gig_form_draft_' + token.slice(0, 12);
  const draftGet = ()=>{ try{ return JSON.parse(localStorage.getItem(DRAFT) || 'null'); }catch(e){ return null; } };
  const draftSet = v=>{ try{ localStorage.setItem(DRAFT, JSON.stringify(v)); }catch(e){} };
  const draftClear = ()=>{ try{ localStorage.removeItem(DRAFT); }catch(e){} };

  async function call(body){
    try{
      const r = await fetch(FN, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(Object.assign({ token }, body)) });
      return await r.json().catch(()=>({ ok:false, error:'server' }));
    }catch(e){ return { ok:false, error:'network' }; }
  }
  function showMessage(code){
    const [h, p] = MESSAGES[code] || MESSAGES.server;
    root.innerHTML = `<div class="msg"><h1>${esc(h)}</h1><p class="muted" style="margin:0;">${esc(p)}</p></div>`;
  }
  const fmtWhen = iso => new Date(iso).toLocaleString(undefined, { dateStyle:'medium', timeStyle:'short' });

  // 9:00 AM to 11:45 PM in 15-minute steps, then midnight to 2:00 AM (late events): [value "HH:MM", "6:30 PM"].
  const TIMES = [];
  for (let m = 9*60; m <= 26*60; m += 15){ const h = Math.floor(m/60) % 24, mm = m % 60;
    TIMES.push([`${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`, `${(h % 12) || 12}:${String(mm).padStart(2,'0')} ${h < 12 ? 'AM' : 'PM'}`]); }
  let D = null, answers = {}, dirty = false, sender = '';
  try{ sender = localStorage.getItem('aspFormSender') || ''; }catch(e){}

  // A song answer in one line (same as answerValue() in _shared/gigform.ts).
  const songValue = f => [[answers[f.k], answers[f.k+'~by']].filter(Boolean).join(' — '), answers[f.k+'~how'], answers[f.k+'~note']].filter(Boolean).join(' · ');
  function field(f){
    const v = f.t === 'song' ? songValue(f) : (answers[f.k] || '');
    const cls = 'f' + (f.half ? ' half' : '');
    if (D.closed) return v ? `<div class="${cls} ro"><span>${esc(f.label)}</span><div class="value">${esc(v)}</div></div>` : '';
    if (f.t === 'check'){
      const who = D.gig.singers && D.gig.singers !== 'your event' ? D.gig.singers : 'our singer';
      const sung = { chuppahOther: `The chuppah is sung by <strong>${esc(who)}</strong>.`, weddingOther: `The wedding is sung by <strong>${esc(who)}</strong>.` }[f.k];
      return `${sung ? `<p class="sungby">${sung}</p>` : ''}<label class="${cls} check"><input type="checkbox" data-check="${esc(f.k)}"${v==='Yes'?' checked':''}/> <span>${esc(f.label)}</span></label>`;
    }
    if (f.show && answers[f.show] !== 'Yes') return `<div class="f" data-showfor="${esc(f.show)}" hidden></div>`;
    if (f.t === 'song'){
      // One part of the chuppah / reception: the song, whose version, how it's played, a note for the singer.
      const how = answers[f.k+'~how'] || '';
      return `<div class="f song" role="group" aria-labelledby="q_${esc(f.k)}"><span id="q_${esc(f.k)}">${esc(f.label)}</span>
        <div class="songrow"><input type="text" data-k="${esc(f.k)}" value="${esc(answers[f.k]||'')}" placeholder="${esc(f.ph||'Song')}" maxlength="300" aria-label="${esc(f.label)}: song"/>
          <input type="text" data-k="${esc(f.k)}~by" value="${esc(answers[f.k+'~by']||'')}" placeholder="Whose version (optional)" maxlength="300" aria-label="${esc(f.label)}: whose version"/></div>
        <div class="yn">${['Sung','Instrumental',"We'll send a track"].map(o=>`<button type="button" data-yn="${esc(f.k)}~how" data-v="${esc(o)}" aria-pressed="${how===o}">${esc(o)}</button>`).join('')}</div>
        <input type="text" class="note" data-k="${esc(f.k)}~note" value="${esc(answers[f.k+'~note']||'')}" placeholder="Note for the singer (optional) — e.g. modulate for the high part" maxlength="300" aria-label="${esc(f.label)}: note"/>
      </div>`;
    }
    const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
    const ph = f.ph ? ` placeholder="${esc(f.ph)}"` : '';
    const id = 'q_' + f.k;
    if (f.t === 'yesno') return `<div class="${cls}" role="group" aria-labelledby="${id}"><span id="${id}">${esc(f.label)}</span><div class="yn">${['Yes','No','Not sure'].map(o=>`<button type="button" data-yn="${esc(f.k)}" data-v="${o}" aria-pressed="${v===o}">${o}</button>`).join('')}</div>${hint}</div>`;
    if (f.t === 'textarea') return `<label class="${cls}"><span>${esc(f.label)}</span><textarea data-k="${esc(f.k)}" rows="3"${ph} maxlength="4000">${esc(v)}</textarea>${hint}</label>`;
    if (f.t === 'time'){
      // A dropdown in 15-minute steps (owner 2026-11-09: "times on the sheet should have a dropdown").
      const opts = TIMES.map(([val, txt])=>`<option value="${val}"${val===v?' selected':''}>${txt}</option>`).join('');
      const odd = v && !TIMES.some(([val])=>val===v) ? `<option value="${esc(v)}" selected>${esc(v)}</option>` : '';
      return `<label class="${cls}"><span>${esc(f.label)}</span><select data-k="${esc(f.k)}"><option value="">Not sure yet</option>${odd}${opts}</select>${hint}</label>`;
    }
    const type = { tel:'tel', email:'email', url:'url' }[f.t] || 'text';
    if (f.to === 'band' && (D.bands||[]).length){
      return `<label class="${cls}"><span>${esc(f.label)}</span><input type="text" data-k="${esc(f.k)}" value="${esc(v)}"${ph} list="bandList" autocomplete="off" maxlength="300"/><datalist id="bandList">${D.bands.map(b=>`<option value="${esc(b)}"></option>`).join('')}</datalist>${hint}</label>`;
    }
    const ac = { tel:' autocomplete="tel"', email:' autocomplete="email"' }[f.t] || '';
    return `<label class="${cls}"><span>${esc(f.label)}</span><input type="${type}" data-k="${esc(f.k)}" value="${esc(v)}"${ph}${ac} maxlength="300"/>${hint}</label>`;
  }

  function render(){
    const g = D.gig, form = D.form;
    const gigLine = [g.singers, g.when, g.venue].filter(Boolean).join(' · ');
    let n = 0;
    const sections = form.sections.map(sec=>{
      const body = sec.fields.map(field).join('');
      if (D.closed && !body) return '';
      n++;
      return `<section class="sec"><div class="sec-head"><div class="num">${String(n).padStart(2,'0')}</div><h2>${esc(sec.title)}</h2>${sec.intro && !D.closed ? `<p class="intro">${esc(sec.intro)}</p>` : ''}</div><div class="grid">${body}</div></section>`;
    }).join('');
    const artist = g.singers && g.singers !== 'your event' ? g.singers : '';
    const who = document.getElementById('who'); if (who) who.textContent = [g.when, g.venue].filter(Boolean).join(' · ');
    root.innerHTML = `<div class="hero"><div class="eyebrow">${esc(form.title)}</div>
        <h1 ${artist ? 'data-testid="artist-name"' : ''}>${artist ? esc(artist) : (g.clientFirst ? `Hi ${esc(g.clientFirst)}` : 'Event details')}</h1>
        <p class="gig">${esc([g.clientFirst ? `For ${g.clientFirst}` : '', g.when, g.venue].filter(Boolean).join(' · '))}</p>
        <p class="intro">${D.closed ? 'This event has passed. Here is what you sent us.' : esc(form.intro)}</p>
        ${D.submittedAt && !D.closed ? `<div class="done" data-testid="form-saved">Saved ${esc(fmtWhen(D.submittedAt))}. Thank you! You can change anything below and save again.</div>` : ''}</div>
      <form id="f" novalidate>${sections || (D.closed ? '<div class="msg"><p class="muted" style="margin:0;">No details were filled in.</p></div>' : '')}</form>
      ${D.closed ? '' : `<section class="sec" data-testid="form-sender"><div class="sec-head"><div class="num">${String(n+1).padStart(2,'0')}</div><h2>Your email</h2><p class="intro">So we know the details came from you. Use the email we have for your booking.</p></div>
        <div class="grid"><label class="f"><span>Your email</span><input type="email" id="sender" autocomplete="email" maxlength="200" value="${esc(sender)}" placeholder="name@example.com"/></label></div></section>`}
      ${D.closed ? '' : `<div class="bar"><div class="in"><div class="status" id="status" role="status">${D.submittedAt ? '' : 'Fill in what you know; you can come back later.'}</div><button class="btn" id="save" type="button" data-testid="form-save">${D.submittedAt ? 'Save changes' : 'Send details'}</button></div></div>`}`;
    if (D.closed) return;
    const status = document.getElementById('status');
    const touch = ()=>{ dirty = true; draftSet(answers); status.className = 'status'; status.textContent = 'Not saved yet'; };
    root.querySelectorAll('[data-k]').forEach(el=>el.addEventListener('input', ()=>{ answers[el.dataset.k] = el.value; touch(); }));
    // A ticked box shows its follow-up question (redrawn; the draft keeps everything typed so far).
    root.querySelectorAll('[data-check]').forEach(el=>el.addEventListener('change', ()=>{ answers[el.dataset.check] = el.checked ? 'Yes' : ''; touch(); const y = window.scrollY; render(); window.scrollTo(0, y); }));
    root.querySelectorAll('[data-yn]').forEach(b=>b.addEventListener('click', ()=>{
      const k = b.dataset.yn, v = answers[k] === b.dataset.v ? '' : b.dataset.v;
      answers[k] = v;
      root.querySelectorAll(`[data-yn="${CSS.escape(k)}"]`).forEach(x=>x.setAttribute('aria-pressed', String(x.dataset.v === v)));
      touch();
      if (D.form.sections.some(sec=>sec.fields.some(fl=>fl.show===k))){ const y = window.scrollY; render(); window.scrollTo(0, y); }
    }));
    document.getElementById('save').addEventListener('click', save);
  }

  async function save(){
    const btn = document.getElementById('save'), status = document.getElementById('status');
    const em = (document.getElementById('sender') || {}).value || '';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.trim())){
      status.className = 'status err'; status.textContent = 'Enter your email at the bottom of the form, then send.';
      const el = document.getElementById('sender'); if (el){ el.focus(); el.scrollIntoView({ block:'center', behavior:'smooth' }); }
      return;
    }
    sender = em.trim(); try{ localStorage.setItem('aspFormSender', sender); }catch(e){}
    btn.disabled = true; btn.textContent = 'Saving…';
    const res = await call({ action:'submit', answers, submitterEmail: sender });
    if (!res.ok){
      btn.disabled = false; btn.textContent = D.submittedAt ? 'Save changes' : 'Send details';
      status.className = 'status err';
      status.textContent = res.error === 'network' ? 'No connection. Your answers are kept on this device; try again.' : res.error === 'closed' ? 'This event has passed, so the details can’t be changed.' : 'Something went wrong. Please try again.';
      return;
    }
    dirty = false; draftClear();
    D.submittedAt = res.submittedAt;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const s = document.getElementById('status'); if (s){ s.className = 'status ok'; s.textContent = 'Saved. Thank you!'; }
  }

  window.addEventListener('beforeunload', e=>{ if (dirty){ e.preventDefault(); e.returnValue = ''; } });

  async function load(){
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)){ showMessage('not_found'); return; }
    const d = await call({ action:'view' });
    if (!d.ok){ showMessage(d.error); return; }
    D = d;
    answers = Object.assign({}, d.answers || {});
    const draft = !d.closed && draftGet();
    if (draft && typeof draft === 'object'){ Object.assign(answers, draft); dirty = true; }
    render();
    if (dirty){ const s = document.getElementById('status'); if (s) s.textContent = 'Unsaved answers from before were brought back.'; }
  }
  load();
})();
