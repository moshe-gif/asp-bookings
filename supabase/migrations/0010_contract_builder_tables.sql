-- Contract Builder v3 gets a real backend home. Mirrors the localStorage PAYEE_PROFILES/CONTRACTS
-- shape from frontend/workspaces/asp.js closely (jsonb for the deeply-nested bits that are never
-- queried independently -- travel_clause, discount, creative, barter, boilerplate, cancellation
-- policy -- per the "Single nested objects... stay as jsonb" design note in 0001), so the eventual
-- frontend wiring (Phase 2+) is close to a drop-in swap of loadContracts()/saveContracts() for
-- Supabase reads/writes rather than a redesign. Not yet wired to the frontend as of this migration
-- -- see ops/DATA_MIGRATION.md once it lands for the plan to move existing localStorage data in.

create table payee_profiles (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references artists(id), -- null = house profile (no specific artist)
  entity_name text not null,
  zelle text default '',
  check_payee text default '',
  check_address text default '',
  wire_bank_name text default '',
  wire_bank_address text default '',
  wire_account_name text default '',
  wire_account_number text default '',
  wire_routing_number text default '',
  wire_swift text default '',
  notes text default '',
  default_boilerplate jsonb not null default '{}'::jsonb,
  default_overtime_interval text not null default 'half_hour',
  default_travel_clause jsonb,
  default_cancellation jsonb,
  -- Zelle balance QR (item 5) -- image itself lives in Supabase Storage, this is just the
  -- reference + display metadata. is_active gates whether it's offered as a send-time payee.
  zelle_qr_storage_path text,
  zelle_recipient_label text default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table payee_profiles enable row level security;
create policy "read payee profiles" on payee_profiles for select using (auth.uid() is not null);
create policy "admin manages payee profiles" on payee_profiles for all using (is_admin()) with check (is_admin());

create table contracts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references events(id),
  template text not null check (template in ('standard','comedian','multiline','creative')),
  status text not null default 'draft' check (status in ('draft','sent','signed','void')),
  performer_artist_id uuid references artists(id),
  performer_label text default '',
  payee_profile_id uuid references payee_profiles(id),
  brand text not null default 'asp',
  bsd_header boolean not null default true,
  -- Everything below mirrors the JS record field-for-field. Deliberately jsonb, not normalized --
  -- these are edited as whole objects in the editor and rendered as whole documents, never queried
  -- by sub-field from SQL.
  snapshot jsonb not null default '{}'::jsonb,
  fee jsonb not null default '{"amount":0,"note":""}'::jsonb,
  deposit jsonb not null default '{"amount":0,"percent":0,"nonRefundable":false}'::jsonb,
  overtime jsonb not null default '{"rate":0,"interval":"half_hour"}'::jsonb,
  cancellation_policy jsonb not null default '{}'::jsonb,
  boilerplate jsonb not null default '{}'::jsonb,
  client_provides jsonb not null default '[]'::jsonb,
  line_items jsonb not null default '[]'::jsonb,
  add_ons jsonb not null default '[]'::jsonb,
  custom_clauses jsonb not null default '[]'::jsonb,
  hours_of_engagement text default '5 hours',
  balance_due_timing text not null default 'prior',
  artist_provides text default '',
  travel_clause jsonb,
  discount jsonb,
  performance_duration text default '',
  performance_type text default '',
  additional_expenses text default 'N/A',
  barter jsonb,
  creative jsonb,
  notes text default '',
  qbo_invoice_id text,
  qbo_invoice_doc_number text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table contracts enable row level security;
create policy "admin manages contracts" on contracts for all using (is_admin()) with check (is_admin());
create policy "artist sees own contracts" on contracts for select using (performer_artist_id = current_artist_id());

-- Immutable snapshot of exactly what was sent, per send -- "render/freeze the exact contract
-- snapshot being sent" (New Artist Event workflow, item 2). A contract can be edited after sending;
-- this table is what proves what the client actually received on a given date, never updated in
-- place once written.
create table contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  version_number int not null,
  snapshot jsonb not null, -- full contract record as of send time
  rendered_html text not null,
  sent_to text,
  sent_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  unique (contract_id, version_number)
);
alter table contract_versions enable row level security;
create policy "admin manages contract versions" on contract_versions for all using (is_admin()) with check (is_admin());
create policy "artist sees own contract versions" on contract_versions for select using (
  exists(select 1 from contracts c where c.id = contract_id and c.performer_artist_id = current_artist_id())
);
