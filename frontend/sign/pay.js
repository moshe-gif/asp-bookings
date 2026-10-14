/* The client's "Pay" panel (migration 0056, Edge Function client-pay, ops/STRIPE_SETUP.md). Used by
   /sign/ (the deposit, once the contract is signed) and /pay/ (a custom invoice). Card and bank
   details go straight into Stripe's own fields (Stripe.js, loaded from js.stripe.com as Stripe
   requires) -- this page and ASP's servers never see a card number.

   The client always sees what they'll pay before paying: after they enter a card or bank, the server
   asks Stripe what it is and answers with the total -- a credit card adds the card fee (if any),
   debit/prepaid cards and bank transfers don't -- and Pay charges exactly that total.
   window.ASPPay.mount(element, token, payment) -- `payment` is client-pay's "view" answer. */
(function(){
  const FN = 'https://psgpxbkncuavlnpplykf.supabase.co/functions/v1/client-pay';
  const STRIPE_JS = 'https://js.stripe.com/endive/stripe.js';
  const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = c => '$' + (Number(c||0)/100).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
  const day = iso => new Date(iso).toLocaleDateString(undefined, { dateStyle:'long' });
  const pct = bps => (bps/100).toLocaleString('en-US', { maximumFractionDigits:2 }) + '%';
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  const css = `
    .pay-card{ padding:20px; margin-top:16px; }
    .pay-card h2{ margin:0 0 4px; font-size:1.15rem; font-weight:600; }
    .pay-amount{ font-size:1.6rem; font-weight:700; margin:2px 0 6px; font-variant-numeric:tabular-nums; }
    .pay-note{ color:var(--ink-2); font-size:13.5px; margin:0 0 14px; }
    .pay-test{ background:#FFF6DB; color:#7A5B00; border-radius:8px; padding:8px 12px; font-size:12.5px; margin:0 0 14px; }
    .pay-lines{ width:100%; border-collapse:collapse; margin:4px 0 14px; font-variant-numeric:tabular-nums; }
    .pay-lines td{ padding:8px 0; border-top:1px solid var(--border); }
    .pay-lines td:last-child{ text-align:right; }
    .pay-lines tr.total td{ font-weight:700; }
    .pay-method{ font-size:13.5px; color:var(--ink-2); margin:0 0 12px; }
    .pay-link{ background:none; border:0; padding:0; color:var(--accent); font:inherit; font-size:13.5px; cursor:pointer; text-decoration:underline; margin-top:12px; }
    .pay-done{ display:block; background:var(--good-wash); border-color:transparent; color:var(--ink); }
    .pay-done strong{ color:var(--good); }
    #pay-element{ margin-bottom:16px; min-height:40px; }`;
  function addStyle(){ if(document.getElementById('pay-css')) return; const s = document.createElement('style'); s.id = 'pay-css'; s.textContent = css; document.head.appendChild(s); }

  let stripeLoad = null;
  function loadStripe(){
    if(window.Stripe) return Promise.resolve();
    if(!stripeLoad) stripeLoad = new Promise((res, rej)=>{
      const s = document.createElement('script'); s.src = STRIPE_JS; s.onload = res; s.onerror = ()=>{ stripeLoad = null; rej(new Error('stripe.js')); };
      document.head.appendChild(s);
    });
    return stripeLoad;
  }
  async function call(token, body){
    try{
      const r = await fetch(FN, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(Object.assign({ token }, body)) });
      return await r.json().catch(()=>({ ok:false, error:'server' }));
    }catch(e){ return { ok:false, error:'network' }; }
  }
  const ERR = {
    network: 'No connection — check your internet and try again.',
    busy: 'A payment is already being processed for this — please wait a minute and reload the page.',
    bad_payment_details: 'Please check your payment details and try again.',
    unsupported_method: 'Please pay with a card or a US bank account.',
    unavailable: 'Online payment isn’t available right now. Please try again later.',
    unknown: 'We couldn’t confirm whether that payment went through. Please wait a minute and reload this page before trying again, so you aren’t charged twice.',
  };
  function methodText(q){
    if(q.method==='us_bank_account') return `Bank account${q.brand?` (${esc(q.brand)})`:''}${q.last4?` ending ${esc(q.last4)}`:''}`;
    const kind = q.funding==='credit' ? 'credit card' : q.funding==='debit' ? 'debit card' : q.funding==='prepaid' ? 'prepaid card' : 'card';
    return `${esc(cap(q.brand)||'Card')} ${kind}${q.last4?` ending ${esc(q.last4)}`:''}`;
  }

  function mount(el, token, p){
    addStyle();
    const what = p.kind==='invoice' ? 'invoice' : 'deposit';
    const title = p.kind==='invoice' ? 'Pay this invoice' : 'Pay your deposit';
    const contact = p.replyTo ? ` Questions? Email <a href="mailto:${esc(p.replyTo)}">${esc(p.replyTo)}</a>.` : '';
    const card = inner => { el.innerHTML = `<div class="card pay-card" data-testid="pay-panel">${inner}</div>`; };

    if(p.paid){
      const m = p.paid.method==='us_bank_account' ? 'bank transfer' : 'card';
      el.innerHTML = `<div class="card pay-card pay-done" data-testid="paid-banner"><strong>Paid — thank you!</strong><br/>${money(p.paid.totalCents)} paid by ${m}${p.paid.last4?` ending ${esc(p.paid.last4)}`:''} on ${esc(day(p.paid.at))}${p.paid.feeCents?` (includes a ${money(p.paid.feeCents)} credit card fee)`:''}. A receipt was emailed to you.${p.status==='refunded'?' This payment has since been refunded.':''}</div>`;
      return;
    }
    if(p.processing || p.blocked==='processing'){
      el.innerHTML = `<div class="card pay-card pay-done" data-testid="processing-banner"><strong>Bank payment received — processing</strong><br/>Bank transfers take a few business days to clear. We’ll email your receipt when it does; there’s nothing more to do.</div>`;
      return;
    }
    if(p.blocked==='unsigned'){ card(`<h2>${title}</h2><div class="pay-amount">${money(p.amountCents)}</div><p class="pay-note" style="margin:0;">Sign the contract above first; then you can pay the deposit here.</p>`); return; }
    if(p.blocked==='paid_elsewhere' || p.blocked==='paid'){ card(`<h2>Already paid</h2><p class="pay-note" style="margin:0;">Our records show this ${what} is paid. Thank you!${contact}</p>`); return; }
    if(p.blocked){ card(`<h2>Online payment closed</h2><p class="pay-note" style="margin:0;">This payment link is no longer active.${contact || ' Please contact us.'}</p>`); return; }
    if(!p.available || !p.publishableKey){ card(`<h2>${title}</h2><div class="pay-amount">${money(p.amountCents)}</div><p class="pay-note" style="margin:0;">Online payment isn’t available yet — please pay by Zelle or check.${contact}</p>`); return; }

    const feeNote = p.cardFeeBps>0
      ? `No fee for bank transfer or debit cards. Credit cards have a ${pct(p.cardFeeBps)} card fee — you’ll see the total before you pay.`
      : 'Pay by card or bank transfer. No fees.';
    card(`<h2>${title}</h2>
      <div class="pay-amount">${money(p.amountCents)}</div>
      <p class="pay-note">${esc(p.description)} · ${feeNote}</p>
      ${p.testMode?'<p class="pay-test">Test mode — no real money moves. Test card: 4242 4242 4242 4242, any future date, any CVC.</p>':''}
      ${p.failureMessage?`<p class="err" style="margin:0 0 12px;">Last attempt: ${esc(p.failureMessage)}</p>`:''}
      <div id="pay-step"></div>`);
    const step = el.querySelector('#pay-step');
    let stripe = null, elements = null;

    async function showForm(message){
      step.innerHTML = `<div id="pay-element"><p class="pay-note">Loading secure payment form…</p></div>
        <button class="btn btn-primary" id="pay-continue" type="button" disabled>Continue</button>
        <p class="err" id="pay-err" role="alert">${esc(message||'')}</p>`;
      const btn = step.querySelector('#pay-continue'), err = step.querySelector('#pay-err');
      try{ await loadStripe(); }catch(e){ err.textContent = 'The payment form couldn’t load. Check your connection and reload the page.'; return; }
      stripe = stripe || window.Stripe(p.publishableKey);
      elements = stripe.elements({
        mode:'payment', amount:p.amountCents, currency:'usd',
        allowedPaymentMethodTypes:['card', 'us_bank_account'],
        // Instant bank verification only (as the server confirms it): micro-deposits would strand the client.
        paymentMethodOptions:{ us_bank_account:{ verification_method:'instant' } },
        appearance:{ theme:'stripe', variables:{ colorPrimary:'#4C6FA5', fontFamily:'Inter, -apple-system, Segoe UI, Roboto, Arial, sans-serif', borderRadius:'8px' } },
      });
      // Wallets off: Apple/Google Pay show a fixed amount before the card's fee is known.
      const pe = elements.create('payment', { layout:'tabs', wallets:{ applePay:'never', googlePay:'never' }, defaultValues:{ billingDetails:{ name:p.clientName||'' } } });
      pe.on('ready', ()=>{ btn.disabled = false; });
      pe.mount(step.querySelector('#pay-element'));
      btn.onclick = async ()=>{
        err.textContent = ''; btn.disabled = true; btn.textContent = 'Checking…';
        const reset = msg=>{ btn.disabled = false; btn.textContent = 'Continue'; err.textContent = msg; };
        const sub = await elements.submit();
        if(sub.error){ reset(sub.error.message); return; }
        const made = await stripe.createConfirmationToken({ elements, params:{ return_url: location.href } });
        if(made.error){ reset(made.error.message); return; }
        const res = await call(token, { action:'quote', confirmationTokenId: made.confirmationToken.id });
        if(!res.ok){ if(ERR[res.error]) reset(ERR[res.error]); else reload(); return; }
        showReview(res.quote, made.confirmationToken.id);
      };
    }

    function showReview(q, ctId, message){
      step.innerHTML = `<table class="pay-lines" data-testid="pay-review">
          <tr><td>${esc(p.description)}</td><td>${money(q.amountCents)}</td></tr>
          ${q.feeCents?`<tr data-testid="fee-line"><td>Credit card fee (${pct(p.cardFeeBps)})</td><td>${money(q.feeCents)}</td></tr>`:''}
          <tr class="total"><td>Total</td><td data-testid="pay-total">${money(q.totalCents)}</td></tr>
        </table>
        <p class="pay-method">Paying with: ${methodText(q)}${q.method==='card' && q.funding!=='credit' && p.cardFeeBps>0 ? ' — no card fee' : ''}</p>
        <button class="btn btn-primary" id="pay-now" type="button">Pay ${money(q.totalCents)}</button>
        <button class="pay-link" id="pay-change" type="button">Use a different card or bank</button>
        <p class="err" id="pay-err" role="alert">${esc(message||'')}</p>`;
      const btn = step.querySelector('#pay-now'), err = step.querySelector('#pay-err');
      step.querySelector('#pay-change').onclick = ()=>showForm();
      btn.onclick = async ()=>{
        btn.disabled = true; btn.textContent = 'Paying…'; err.textContent = '';
        const res = await call(token, { action:'pay', confirmationTokenId: ctId, totalCents: q.totalCents });
        if(!res.ok){
          if(res.error==='quote_changed' && res.quote){ showReview(res.quote, ctId, 'The total changed — please review it and press Pay again.'); return; }
          if(res.error==='declined'){ showForm(res.message || 'The payment didn’t go through.'); return; }
          if(res.error==='unknown'){ step.innerHTML = `<p class="err" role="alert">${esc(ERR.unknown)}</p>`; return; }
          if(ERR[res.error]){ btn.disabled = false; btn.textContent = `Pay ${money(q.totalCents)}`; err.textContent = ERR[res.error]; return; }
          reload(); return;
        }
        if(res.status==='requires_action' && res.clientSecret){
          const act = await stripe.handleNextAction({ clientSecret: res.clientSecret });
          if(act.error){ await call(token, { action:'refresh' }); showForm(act.error.message); return; }
        }
        reload();
      };
    }

    async function reload(){
      const res = await call(token, { action:'refresh' });
      if(res.ok && res.payment) mount(el, token, res.payment);
      else step.innerHTML = `<p class="err">Something went wrong — please reload the page before trying again, so you aren’t charged twice.</p>`;
    }
    showForm();
  }
  window.ASPPay = { mount, call };
})();
