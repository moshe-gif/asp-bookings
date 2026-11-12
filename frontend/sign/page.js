/* sign/index.html's own code, kept in a file so the page's Content-Security-Policy can forbid inline scripts (2026-11-12 audit #7.2). */
(function(){
  const FN = 'https://psgpxbkncuavlnpplykf.supabase.co/functions/v1/contract-sign';
  const root = document.getElementById('root');
  let token = '';
  // A WhatsApp button can't carry a #, so it opens ?t=<token>; move it back into the # (kept out of the address bar's query).
  try{ const t = new URLSearchParams(location.search).get('t'); if (t && !location.hash) history.replaceState(null, '', location.pathname + '#' + encodeURIComponent(t)); }catch(e){}
  try{ token = decodeURIComponent((location.hash||'').replace(/^#/, '')); }catch(e){}
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = iso => new Date(iso).toLocaleString(undefined, { dateStyle:'long', timeStyle:'short' });
  const MESSAGES = {
    not_found: ['This link doesn’t work', 'Check that you opened the whole link from your email, or ask us to send it again.'],
    void:      ['This contract is no longer open for signing', 'It was cancelled or replaced. Please contact us if you think this is a mistake.'],
    revoked:   ['This link is no longer active', 'The contract was changed or withdrawn. Please use the link in the most recent email from us, or contact us.'],
    expired:   ['This link has expired', 'Ask us to send the contract again and we’ll send a fresh link.'],
    server:    ['Something went wrong', 'Please try again in a minute.'],
  };

  async function call(body){
    try{
      const r = await fetch(FN, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(Object.assign({ token }, body)) });
      return await r.json().catch(()=>({ ok:false, error:'server' }));
    }catch(e){ return { ok:false, error:'network' }; }
  }
  function showMessage(code){
    const [h, p] = MESSAGES[code] || (code==='network' ? ['No connection', 'Check your internet connection and reload this page.'] : MESSAGES.server);
    root.innerHTML = `<div class="card msg"><h1>${esc(h)}</h1><p class="muted" style="margin:0;">${esc(p)}</p></div>`;
  }

  // The contract shows in a sandboxed frame: its own styles stay intact and it can never run script.
  function frame(html){
    const f = document.createElement('iframe');
    f.setAttribute('sandbox', 'allow-same-origin');
    f.title = 'Contract';
    f.srcdoc = html;
    const fit = ()=>{ try{ f.style.height = (f.contentDocument.documentElement.scrollHeight + 4) + 'px'; }catch(e){} };
    f.addEventListener('load', ()=>{ fit(); setTimeout(fit, 300); });
    window.addEventListener('resize', fit);
    return f;
  }

  function render(d){
    root.innerHTML = `<div class="top"><div class="brandhead"><img class="logo" src="../assets/brand/asp-horizontal-dark.png" alt="${esc(d.brandName)}" width="120" height="16"/>${d.artistName ? `<div class="artist" data-testid="artist-name">${esc(d.artistName)}</div>` : ''}<div class="label">Contract ${esc(d.contractId)}</div></div>
      ${d.signed ? '<button class="btn btn-ghost" id="print">Print / Save PDF</button>' : ''}</div>
      ${d.signed ? `<div class="card done" data-testid="signed-banner"><div><strong>Signed by ${esc(d.signed.name)}</strong><br/>${esc(fmt(d.signed.at))}. Thank you! Use Print / Save PDF to keep a copy; this link keeps working too.</div></div>` : ''}
      <div id="doc"></div>
      ${d.signed ? '' : `<form class="card panel" id="signform" novalidate>
        <h2>Sign this contract</h2>
        <p class="muted">Please read the contract above. Type your full name to sign.</p>
        <label class="field"><span>Full name</span><input type="text" id="name" autocomplete="name" maxlength="120" value="${esc(d.clientName)}" required/></label>
        <div class="sigpreview" id="preview" aria-hidden="true">${esc(d.clientName)}</div>
        <label class="field"><span>Email for your signed copy <span style="font-weight:400;color:var(--ink-3);">(optional)</span></span><input type="email" id="email" autocomplete="email" maxlength="200"/></label>
        <label class="consent"><input type="checkbox" id="agree"/><span>${esc(d.consentText)}</span></label>
        <button class="btn btn-primary" id="signbtn" type="submit">Sign contract</button>
        <p class="err" id="err" role="alert"></p>
      </form>`}
      <div id="pay"></div>`;
    document.getElementById('doc').appendChild(frame(d.html));
    showPayment();
    const p = document.getElementById('print');
    // The page prints itself (its print styles hide everything but the contract); the sandboxed frame
    // isn't allowed to open a print dialog.
    if(p) p.onclick = ()=>window.print();
    const form = document.getElementById('signform');
    if(!form) return;
    const name = document.getElementById('name'), preview = document.getElementById('preview');
    name.addEventListener('input', ()=>{ preview.textContent = name.value; });
    form.addEventListener('submit', async ev=>{
      ev.preventDefault();
      const err = document.getElementById('err'), btn = document.getElementById('signbtn');
      const n = name.value.trim(), email = document.getElementById('email').value.trim();
      if(n.length < 2){ err.textContent = 'Type your full name to sign.'; name.focus(); return; }
      if(email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ err.textContent = 'That email address doesn’t look right.'; return; }
      if(!document.getElementById('agree').checked){ err.textContent = 'Tick the box to agree to sign electronically.'; return; }
      err.textContent = ''; btn.disabled = true; btn.textContent = 'Signing…';
      const res = await call({ action:'sign', name:n, email, agree:true });
      if(!res.ok){
        btn.disabled = false; btn.textContent = 'Sign contract';
        if(MESSAGES[res.error] && res.error!=='server'){ showMessage(res.error); return; }
        err.textContent = res.error==='network' ? 'No connection — check your internet and try again.' : 'Something went wrong — please try again.';
        return;
      }
      load();
    });
  }

  // The deposit, if this link has one. Best-effort: signing never waits on it.
  async function showPayment(){
    if(!window.ASPPay) return;
    const res = await window.ASPPay.call(token, { action:'view' });
    const el = document.getElementById('pay');
    if(el && res.ok && res.payment) window.ASPPay.mount(el, token, res.payment);
  }

  async function load(){
    if(!/^[A-Za-z0-9_-]{43}$/.test(token)){ showMessage('not_found'); return; }
    const d = await call({ action:'view' });
    if(!d.ok){ showMessage(d.error); return; }
    render(d);
  }
  load();
})();
