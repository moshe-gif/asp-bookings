/* pay/index.html's own code, kept in a file so the page's Content-Security-Policy can forbid inline scripts (2026-11-12 audit #7.2). */
(function(){
  const root = document.getElementById('root');
  let token = '';
  // A WhatsApp button can't carry a #, so it opens ?t=<token>; move it back into the # (kept out of the address bar's query).
  try{ const t = new URLSearchParams(location.search).get('t'); if (t && !location.hash) history.replaceState(null, '', location.pathname + '#' + encodeURIComponent(t)); }catch(e){}
  try{ token = decodeURIComponent((location.hash||'').replace(/^#/, '')); }catch(e){}
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function showMessage(h, p){ root.innerHTML = `<div class="card msg"><h1>${esc(h)}</h1><p class="muted" style="margin:0;">${esc(p)}</p></div>`; }
  function frame(html){
    const f = document.createElement('iframe');
    f.setAttribute('sandbox', 'allow-same-origin');
    f.title = 'Invoice';
    f.srcdoc = html;
    const fit = ()=>{ try{ f.style.height = (f.contentDocument.documentElement.scrollHeight + 4) + 'px'; }catch(e){} };
    f.addEventListener('load', ()=>{ fit(); setTimeout(fit, 300); });
    window.addEventListener('resize', fit);
    return f;
  }
  async function load(){
    if(!/^[A-Za-z0-9_-]{43}$/.test(token) || !window.ASPPay){ showMessage('This link doesn’t work', 'Check that you opened the whole link from your email, or ask us to send it again.'); return; }
    const res = await window.ASPPay.call(token, { action:'view' });
    if(!res.ok || !res.payment || !['invoice','event_balance'].includes(res.payment.kind)){
      if(res.error==='network') showMessage('No connection', 'Check your internet connection and reload this page.');
      else if(res.error==='server') showMessage('Something went wrong', 'Please try again in a minute.');
      else showMessage('This link doesn’t work', 'Check that you opened the whole link from your email, or ask us to send it again.');
      return;
    }
    const p = res.payment;
    if(p.kind==='event_balance'){
      // A balance has no document of its own: the client already has the contract.
      root.innerHTML = `<div class="top"><div class="brandhead"><img class="logo" src="../assets/brand/asp-horizontal-dark.png" alt="${esc(p.brandName)}" width="120" height="16"/>${p.artistName ? `<div class="artist" data-testid="artist-name">${esc(p.artistName)}</div>` : ''}<div class="label">Balance due</div></div></div><div id="pay"></div>`;
      window.ASPPay.mount(document.getElementById('pay'), token, p);
      return;
    }
    root.innerHTML = `<div class="top"><div class="brandhead"><img class="logo" src="../assets/brand/asp-horizontal-dark.png" alt="${esc(p.brandName)}" width="120" height="16"/>${p.artistName ? `<div class="artist" data-testid="artist-name">${esc(p.artistName)}</div>` : ''}<div class="label">Invoice ${esc(p.reference)}</div></div>
      <button class="btn btn-ghost" id="print" type="button">Print / Save PDF</button></div>
      <div id="doc"></div><div id="pay"></div>`;
    document.getElementById('doc').appendChild(frame(p.html));
    document.getElementById('print').onclick = ()=>window.print();
    window.ASPPay.mount(document.getElementById('pay'), token, p);
  }
  load();
})();
