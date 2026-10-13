-- 0052: Clients sign contracts online (the HoneyBook-style "one link" flow, step 1 of 2; payments
-- are step 2). Applied: 2026-10-13 (supabase/run-sql.sh, verified)
--
-- One row per signing link. An admin creates it when a contract goes out: the row freezes the exact
-- contract HTML the client is shown, and the client opens app.aspmgmt.com/sign/#<token> -- no login.
-- The public `contract-sign` Edge Function is the only thing that reads or signs a row by token.
--
-- This table is the source of truth for "the client signed" (who, when, from where, and a SHA-256 of
-- the exact text they agreed to -- the record an e-signature needs under the ESIGN Act / UETA). It does
-- NOT change the contract itself: the app (applyClientSignatures in asp.js) marks a contract Signed,
-- because only the app can compare the signed terms with the contract's CURRENT terms (a client who
-- signed an older version gets a warning, not a Signed contract). A link belongs to one contract by
-- (contract_legacy_id, contract_created_at) -- ids can be reused after a delete or re-numbered by the
-- shared sync, the creation time can't -- and records the terms it was made from (terms_sha256).
--
-- Revised 2026-10-13 after review, before any real link existed (only harness rows), by dropping and
-- re-creating the table from this file.
--
-- Security: only a SHA-256 of the token is stored, so a database read can't produce working links.
-- Admins may create a row and revoke one, nothing else; every signer column is written by the Edge
-- Function (service role) alone, and the frozen HTML can never change after insert.

begin;

create table if not exists contract_sign_requests (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  contract_legacy_id text not null,            -- app_records contracts legacy_id, e.g. "CT-5001"
  contract_created_at text not null,            -- the contract's createdAt: with the id, its identity
  terms_sha256 text not null check (terms_sha256 ~ '^[0-9a-f]{64}$'),  -- SHA-256 of its approved terms fingerprint
  event_legacy_id text,                         -- the gig, e.g. "EV-1063" (for the activity log)
  brand_key text,
  client_name text,
  client_email text,
  rendered_html text not null check (length(rendered_html) <= 300000),
  html_sha256 text,                             -- set by trigger from rendered_html
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 days',
  revoked_at timestamptz,
  first_viewed_at timestamptz,
  signed_at timestamptz,
  signer_name text check (signer_name is null or length(signer_name) between 2 and 120),
  signer_email text,
  signer_ip text,
  signer_user_agent text,
  consent_text text,
  signed_html_sha256 text,
  check (signed_at is null or (signer_name is not null and signed_html_sha256 is not null))
);
create index if not exists contract_sign_requests_contract on contract_sign_requests (contract_legacy_id, contract_created_at);

-- Freeze the document: the hash is computed here (never trusted from the browser), and neither the
-- HTML nor the token can be changed afterwards. A signature can't be undone or rewritten either.
create or replace function contract_sign_requests_guard() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.html_sha256 := encode(sha256(convert_to(new.rendered_html, 'UTF8')), 'hex');
    new.signed_at := null; new.signer_name := null; new.signer_email := null; new.signer_ip := null;
    new.signer_user_agent := null; new.consent_text := null; new.signed_html_sha256 := null;
    new.first_viewed_at := null; new.revoked_at := null;
    -- A link to CHANGED wording replaces any unsigned older one (the client must not sign old
    -- terms); another link to the same wording leaves the emailed one working.
    update contract_sign_requests set revoked_at = now()
      where contract_legacy_id = new.contract_legacy_id and contract_created_at = new.contract_created_at
        and signed_at is null and revoked_at is null and html_sha256 is distinct from new.html_sha256;
    return new;
  end if;
  if new.rendered_html is distinct from old.rendered_html or new.html_sha256 is distinct from old.html_sha256
     or new.token_hash is distinct from old.token_hash or new.contract_legacy_id is distinct from old.contract_legacy_id
     or new.contract_created_at is distinct from old.contract_created_at or new.terms_sha256 is distinct from old.terms_sha256
     or new.event_legacy_id is distinct from old.event_legacy_id then
    raise exception 'a signing link''s document cannot be changed';
  end if;
  if old.revoked_at is not null and new.revoked_at is null then
    raise exception 'a cancelled signing link cannot be re-opened';
  end if;
  if old.signed_at is not null and (new.signed_at is distinct from old.signed_at
     or new.signer_name is distinct from old.signer_name or new.signed_html_sha256 is distinct from old.signed_html_sha256
     or new.revoked_at is distinct from old.revoked_at) then
    raise exception 'a signed contract cannot be changed or revoked';
  end if;
  return new;
end $$;
drop trigger if exists contract_sign_requests_guard on contract_sign_requests;
create trigger contract_sign_requests_guard before insert or update on contract_sign_requests
  for each row execute function contract_sign_requests_guard();

alter table contract_sign_requests enable row level security;
create policy "admins read signing links" on contract_sign_requests for select using (is_admin());
create policy "admins create signing links" on contract_sign_requests for insert with check (is_admin());
create policy "admins revoke signing links" on contract_sign_requests for update using (is_admin()) with check (is_admin());

revoke all on contract_sign_requests from anon, authenticated;
grant select on contract_sign_requests to authenticated;
grant insert (token_hash, contract_legacy_id, contract_created_at, terms_sha256, event_legacy_id, brand_key, client_name, client_email, rendered_html, expires_at)
  on contract_sign_requests to authenticated;
grant update (revoked_at) on contract_sign_requests to authenticated;
grant select, insert, update on contract_sign_requests to service_role;

-- The signature itself, in one transaction: lock the link, check it is still open, that its contract
-- isn't void (or deleted), still has these terms approved, and has no signature to these terms yet,
-- then record the signer. Signing twice returns
-- the first signature. Only the contract-sign Edge Function (service role) may call it.
create or replace function sign_contract_request(p_token_hash text, p_name text, p_email text,
  p_ip text, p_user_agent text, p_consent text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r contract_sign_requests; other contract_sign_requests; doc jsonb; is_test boolean;
begin
  select * into r from contract_sign_requests where token_hash = p_token_hash;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  -- One signing at a time per contract (two links signed at the same moment would otherwise deadlock
  -- on each other's rows), then re-read the link under its row lock.
  perform pg_advisory_xact_lock(hashtext('contract-sign|' || r.contract_legacy_id || '|' || r.contract_created_at));
  select * into r from contract_sign_requests where id = r.id for update;
  if r.signed_at is not null then
    return jsonb_build_object('ok', true, 'already', true, 'id', r.id, 'signed_at', r.signed_at, 'signer_name', r.signer_name);
  end if;
  if r.revoked_at is not null then return jsonb_build_object('ok', false, 'error', 'revoked'); end if;
  if r.expires_at <= now() then return jsonb_build_object('ok', false, 'error', 'expired'); end if;
  is_test := r.contract_legacy_id like 'CT-TEST-%';
  if not is_test then
    select app_doc into doc from app_records where collection = 'contracts' and legacy_id = r.contract_legacy_id;
    if doc is null or doc->>'createdAt' is distinct from r.contract_created_at or doc->>'status' = 'void' then
      return jsonb_build_object('ok', false, 'error', 'void');
    end if;
    -- The link's terms must still be the approved ones (approval revoked, or re-approved with new
    -- terms, cancels it here even if the app's own cancel request never arrived).
    if encode(sha256(convert_to(coalesce(doc->>'approvedTermsFingerprint', ''), 'UTF8')), 'hex') is distinct from r.terms_sha256 then
      return jsonb_build_object('ok', false, 'error', 'revoked');
    end if;
  end if;
  -- One signature per contract and terms: the first stands.
  select * into other from contract_sign_requests where contract_legacy_id = r.contract_legacy_id
    and contract_created_at = r.contract_created_at and terms_sha256 = r.terms_sha256
    and signed_at is not null order by signed_at limit 1;
  if found then
    return jsonb_build_object('ok', true, 'already', true, 'id', other.id, 'signed_at', other.signed_at, 'signer_name', other.signer_name);
  end if;

  update contract_sign_requests set signed_at = now(), signer_name = p_name, signer_email = p_email,
    signer_ip = left(p_ip, 200), signer_user_agent = left(p_user_agent, 400), consent_text = p_consent,
    signed_html_sha256 = html_sha256
    where id = r.id returning * into r;

  -- One line on the gig's activity log (written here, once, rather than by every admin browser). Can be
  -- lost if an admin's unsent edit to that gig overwrites it; the signature itself can't be.
  if not is_test then
    update events set app_doc = jsonb_set(app_doc, '{log}', coalesce(app_doc->'log', '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object('ts', to_char(r.signed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'type', 'system',
          'text', r.signer_name || ' signed contract ' || r.contract_legacy_id || ' online.')))
      where legacy_id = r.event_legacy_id and app_doc is not null;
  end if;

  return jsonb_build_object('ok', true, 'already', false, 'id', r.id, 'signed_at', r.signed_at, 'signer_name', r.signer_name);
end $$;
revoke all on function sign_contract_request(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function sign_contract_request(text, text, text, text, text, text) to service_role;

-- Admins see a client's signature arrive live. Default replica identity: the app reloads signatures on
-- any change and never reads the payload, so the frozen HTML isn't broadcast with every update.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'contract_sign_requests') then
    alter publication supabase_realtime add table contract_sign_requests;
  end if;
end $$;

commit;
