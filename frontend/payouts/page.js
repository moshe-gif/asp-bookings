/* payouts/index.html's own code, kept in a file so the page's Content-Security-Policy can forbid inline scripts (2026-11-12 audit #7.2). */
(function(){
  const FN = 'https://psgpxbkncuavlnpplykf.supabase.co/functions/v1/payee-onboard';
  const root = document.getElementById('root');
  let token = '';
  try{ token = decodeURIComponent((location.hash||'').replace(/^#/, '')); }catch(e){}
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function call(action){
    try{
      const r = await fetch(FN, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ action, token }) });
      return await r.json().catch(()=>({ ok:false, error:'server' }));
    }catch(e){ return { ok:false, error:'network' }; }
  }
  function message(h, p){ root.innerHTML = `<h1>${esc(h)}</h1><p style="margin:0;">${esc(p)}</p>`; }
  async function load(){
    if(!/^[A-Za-z0-9_-]{43}$/.test(token)){ message('This link doesn’t work', 'Open the whole link from the email ASP sent you, or ask the office for a new one.'); return; }
    const v = await call('view');
    if(!v.ok){
      if(v.error==='expired') message('This link has expired', 'Ask the ASP office to send you a new setup link.');
      else if(v.error==='network') message('No connection', 'Check your internet connection and reload this page.');
      else if(v.error==='not_found') message('This link doesn’t work', 'It may have been replaced by a newer one. Ask the ASP office to send you a new setup link.');
      else message('Something went wrong', 'Please try again in a few minutes.');
      return;
    }
    const who = v.entityName ? ` for <strong>${esc(v.entityName)}</strong>` : '';
    const test = v.testMode ? '<p class="test">Test mode — use Stripe’s test details; nothing real is set up.</p>' : '';
    if(v.done){
      root.innerHTML = `<h1>Payouts are set up</h1>${test}<p class="done"><strong>All set.</strong> Balances that clients pay online${who} go straight to your bank account.</p>
        <p>To see your payouts or change the bank account, sign in to your Stripe dashboard (Stripe texts you a code).</p>
        <button class="btn" id="go" type="button">Sign in to Stripe</button><p class="err" id="err" role="alert"></p>`;
    } else if(v.pending){
      root.innerHTML = `<h1>Thanks — Stripe is checking your details</h1>${test}<p>This usually takes a few minutes, sometimes a day or two. If Stripe needs anything else, it will email you; you can also sign in to Stripe to add it.</p>
        <button class="btn" id="go" type="button">Sign in to Stripe</button><p class="err" id="err" role="alert"></p>`;
    } else {
      root.innerHTML = `<h1>Set up your payouts</h1>${test}<p>ASP Management takes balance payments online, and they go straight to your bank account${who}. Stripe, our payment processor, needs a few details first. It takes about 5 minutes; have these ready:</p>
        <ul><li>The bank account you want paid into</li><li>Your tax ID (EIN for a company, or SSN)</li><li>Your date of birth and address</li></ul>
        <button class="btn" id="go" type="button">Continue to Stripe</button><p class="err" id="err" role="alert"></p>
        <p class="foot">Your details go to Stripe directly; ASP never sees them.</p>`;
    }
    const btn = document.getElementById('go'), err = document.getElementById('err');
    btn.onclick = async ()=>{
      btn.disabled = true; err.textContent = '';
      const s = await call('start');
      if(s.ok && s.url && /^https:\/\/([a-z0-9-]+\.)*stripe\.com\//.test(s.url)){ location.href = s.url; return; }
      btn.disabled = false;
      err.textContent = s.error==='network' ? 'No connection — check your internet and try again.' : 'Stripe couldn’t be reached. Please try again in a minute.';
    };
  }
  load();
})();
