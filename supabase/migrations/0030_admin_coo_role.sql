-- Navigation/data-layer refactor: Moshe's real role is COO, not CEO -- the plan's placeholder
-- bootstrap insert (see ~/.claude/plans/eventual-snacking-globe.md "Single gated actions") used
-- admin_ceo as a stand-in since no COO role existed yet. Extends the role check constraint
-- (migration 0003) to add admin_coo, then fixes Moshe's row. COO gets the SAME unrestricted nav
-- access as admin_bookings/admin_bookkeeping (CEO_HIDDEN_NAV_VIEWS, asp.js, only ever restricted
-- admin_ceo specifically) -- not retroactively added to that restriction, since nothing in the
-- brief asked to restrict the COO's view and the safer default for a senior operational role is
-- full visibility, not less.
alter table admin_users drop constraint admin_users_role_check;
alter table admin_users add constraint admin_users_role_check
  check (role in ('admin_bookings','admin_bookkeeping','admin_ceo','admin_coo'));

update admin_users set role = 'admin_coo' where email = 'moshe@aspmgmt.com';
