-- 0098: what the payment page saw when it couldn't take a payment (owner 2026-11-16: "it did not let me hit"
-- the button on a client's pay link; it works in every browser we can test, so the page now reports what
-- happened on the device it failed on). client-pay writes a row when the card form doesn't load, Stripe
-- refuses the details, or the server answers with an error: the link's row, the browser, and the page's
-- steps (no card data -- Stripe's card box is in its own frame the page can't read). At most 30 per link.
-- Service role only (RLS on, no policies). Applied: (run by supabase/run-sql.sh)

begin;
create table if not exists public.pay_page_reports (
  id bigserial primary key,
  payment_request_id uuid references public.payment_requests(id) on delete cascade,
  at timestamptz not null default now(),
  user_agent text,
  steps jsonb not null default '[]'::jsonb
);
create index if not exists pay_page_reports_link on public.pay_page_reports (payment_request_id, at desc);
alter table public.pay_page_reports enable row level security;
revoke all on public.pay_page_reports from anon, authenticated;
commit;
