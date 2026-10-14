// Receives Stripe's event notifications for online payments (migration 0056, ops/STRIPE_SETUP.md).
// The primary signal for bank transfers (ACH settles days after the client pays) and the backup for
// cards (client-pay records a card payment the moment it succeeds; this catches a closed tab).
//
// Deploy with JWT verification OFF (Stripe sends no Supabase token). The security boundary is the
// Stripe-Signature check against STRIPE_WEBHOOK_SECRET. The event body is only a hint: the payment
// is re-read from Stripe's API before anything is recorded.
//
// Events to subscribe (Stripe Dashboard -> Developers -> Webhooks): payment_intent.succeeded,
// payment_intent.processing, payment_intent.payment_failed, payment_intent.canceled, charge.refunded,
// charge.dispute.created.
import { serviceClient } from "../_shared/auth.ts";
import { dollars, recordChargeProblem, recordPaymentIntent, stripeApi, verifyStripeSignature } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const raw = await req.text();
  const ok = await verifyStripeSignature(raw, req.headers.get("stripe-signature"), Deno.env.get("STRIPE_WEBHOOK_SECRET") || "");
  if (!ok) { console.error("stripe-webhook: signature verification failed"); return new Response("invalid signature", { status: 400 }); }
  // deno-lint-ignore no-explicit-any
  let event: any;
  try { event = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
  const sb = serviceClient();
  const obj = event?.data?.object || {};
  try {
    if (String(event.type).startsWith("payment_intent.")) {
      // Only our payment links (metadata set by client-pay); anything else on the account is ignored.
      if (obj.metadata?.payment_request_id) {
        const pi = await stripeApi("GET", `/payment_intents/${obj.id}`);
        if (!pi.ok) throw new Error(`could not read ${obj.id}: ${pi.status}`);
        await recordPaymentIntent(sb, pi.data);
      }
    } else if (event.type === "charge.refunded" && obj.payment_intent) {
      const partial = (Number(obj.amount_refunded) || 0) < (Number(obj.amount) || 0);
      await recordChargeProblem(sb, obj.payment_intent, "refunded", `${dollars(Number(obj.amount_refunded) || 0)} of ${dollars(Number(obj.amount) || 0)} refunded`, partial);
    } else if (event.type === "charge.dispute.created" && obj.payment_intent) {
      await recordChargeProblem(sb, obj.payment_intent, "disputed", `${dollars(Number(obj.amount) || 0)}, reason: ${obj.reason || "not given"}`);
    }
  } catch (err) {
    // A non-2xx makes Stripe retry later (recording is idempotent).
    console.error("stripe-webhook:", event?.type, event?.id, String(err));
    return new Response("error", { status: 500 });
  }
  return new Response("ok", { status: 200 });
});
