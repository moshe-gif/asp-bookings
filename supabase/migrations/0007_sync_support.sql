-- Additive-only: adds sync bookkeeping columns to events/projects so Axis can tell what
-- changed and when. Zero change to frontend/workspaces/asp.js or any user-visible behavior --
-- see ~/.claude/plans/eventual-snacking-globe.md, "ASP (migration 0007, additive only...)".
-- (Numbered 0007, not 0006 -- 0006 was already used by the company-scoping revert.)
--
-- Neither table had any "last changed" timestamp before this (confirmed by reading 0001), so
-- this is a real gap fix, not just plumbing for Axis.

alter table events add column if not exists updated_at timestamptz not null default now();
alter table events add column if not exists last_synced_at timestamptz;
alter table projects add column if not exists updated_at timestamptz not null default now();
alter table projects add column if not exists last_synced_at timestamptz;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on events;
create trigger events_set_updated_at
before update on events
for each row execute function set_updated_at();

drop trigger if exists projects_set_updated_at on projects;
create trigger projects_set_updated_at
before update on projects
for each row execute function set_updated_at();
