-- Durable booking record architecture, PR 4 of 6. Fixes two real, already-shipped RLS leaks found
-- during the audit (direct code read, not speculative): every policy below that grants an artist
-- SELECT on events/contracts/contract_versions grants the FULL row, with no column scoping --
-- Postgres RLS is row-level only, so "artist sees own events" (0001:97) and "artist sees events
-- via event_artists" (0012:28-30) both hand over price/client_name/client_email/commission/balance
-- the moment an artist's own event read path moves off localStorage onto these tables (today's
-- blast radius is zero only because nothing queries these tables live yet -- see the audit). The
-- brief is explicit: an artist should see their own job/fee/ASP cut/net and safe logistics, never
-- the client's price or the contract itself.
--
-- Fix shape: revoke the artist's SELECT grant on events/contracts/contract_versions entirely (drop
-- every policy that granted it -- with none left, RLS default-denies all rows to a non-admin), then
-- expose only the safe columns through artist_booking_view. The view is deliberately NOT
-- security_invoker: a security_invoker view would inherit the querying artist's (now zero) access
-- to the base events table and return nothing. Instead the view runs with its owner's privileges
-- (the standard Postgres "security barrier view" pattern) and the access boundary moves INTO the
-- view's own join condition (ea.artist_id = current_artist_id()) -- so the view itself, not the
-- underlying table's RLS, is what scopes each artist to their own rows.

drop policy "artist sees own events" on events;
drop policy "artist sees events via event_artists" on events;

create view artist_booking_view as
select
  e.id,
  e.booking_type,
  e.title,
  e.type,
  e.date,
  e.time,
  e.end_time,
  e.venue,
  e.city,
  e.state,
  e.status,
  e.booking_status,
  e.dress_code,
  e.flight_needed,
  e.flight_booked,
  e.flight,
  e.ground_transport_needed,
  e.ground_transport_booked,
  e.ground_transport,
  e.artist_paid_out,
  e.artist_paid_out_date,
  e.created_at,
  ea.artist_id,
  ea.role,
  ea.fee_amount as own_fee,
  ea.asp_cut,
  ea.net_amount,
  ea.gross_fee,
  ea.expenses_charged
from events e
join event_artists ea on ea.event_id = e.id
where ea.artist_id = current_artist_id();

grant select on artist_booking_view to authenticated;

-- "Artists should never see the contract at all" -- zero current frontend call sites read these as
-- an artist (confirmed in the audit), so dropping outright has no live blast radius.
drop policy "artist sees own contracts" on contracts;
drop policy "artist sees own contract versions" on contract_versions;

-- itinerary_versions' old policy scoped by event membership only, so on a multi-artist booking one
-- shared itinerary snapshot could leak another artist's travel details to every artist on the same
-- event. Scope it per-artist instead. artist_id is nullable and unbackfilled on purpose: populating
-- it is a write-path change (who the itinerary is being sent to) that's separate, future scope --
-- until that lands, every row reads as NULL and the new policy (an exact match required) simply
-- shows artists nothing, which is the safe direction to fail in, never the leaky one.
alter table itinerary_versions add column artist_id uuid references artists(id);
drop policy "artist sees own itinerary versions" on itinerary_versions;
create policy "artist sees own itinerary versions" on itinerary_versions for select using (
  artist_id = current_artist_id()
);
