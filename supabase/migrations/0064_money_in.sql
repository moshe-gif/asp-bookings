-- Money in from email (owner 2026-10-21: "i need all emails integrated into the app so it can moniter
-- money coming in"; 2026-10-22: "you be able to read the emails ... and can see when they are paid").
-- inbox-scan now reads EVERY connected Gmail mailbox, not just office@ -- e.g. the Zelle inbox the
-- bank's "you received money" alerts go to -- and, for a payment email, works out what it pays (an open
-- invoice, a gig's deposit, a gig's balance) and whether the amount matches exactly. The app shows each
-- one under Inbox -> Money in with a one-click confirm. A bank's own alert (DKIM-signed by the bank)
-- that matches exactly one thing is applied by the app on its own (once, via money_applied_at).
-- Applied: 2026-10-22 (Management API)

-- Each mailbox keeps its own read position; 'payments' mailboxes are only searched for payment mail.
alter table public.gmail_mailboxes drop constraint if exists gmail_mailboxes_mailbox_type_check;
alter table public.gmail_mailboxes add constraint gmail_mailboxes_mailbox_type_check
  check (mailbox_type in ('artist_payment','asp_sending','payments'));
alter table public.gmail_mailboxes add column if not exists scan_enabled boolean not null default true;
alter table public.gmail_mailboxes add column if not exists last_internal_date bigint not null default 0;
alter table public.gmail_mailboxes add column if not exists last_scan_at timestamptz;
alter table public.gmail_mailboxes add column if not exists last_scan_error text;
-- office@ carries on from where the single-mailbox scan stopped.
update public.gmail_mailboxes m set last_internal_date = s.last_internal_date
  from public.inbox_scan_state s where s.id = 1 and m.mailbox_type = 'asp_sending' and m.last_internal_date = 0;

-- Gmail message ids are per mailbox.
alter table public.inbox_items add column if not exists mailbox_email text;
update public.inbox_items set mailbox_email = 'office@aspmgmt.com' where mailbox_email is null;
alter table public.inbox_items drop constraint if exists inbox_items_gmail_message_id_key;
create unique index if not exists inbox_items_mailbox_message on public.inbox_items (mailbox_email, gmail_message_id);

-- money: { amount_cents, payer, method, date, memo, bank_verified, bank,
--          match: { kind:'invoice'|'deposit'|'balance', ref:'INV-3'|'EV-5020', due_cents, exact } | null }
alter table public.inbox_items add column if not exists money jsonb;
alter table public.inbox_items add column if not exists money_applied_at timestamptz;
create index if not exists inbox_items_money on public.inbox_items (received_at desc) where money is not null;
