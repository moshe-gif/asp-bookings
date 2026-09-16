-- Additive-only: adds the wedding-only "band" fields to events, matching the shape the app's
-- own event object already uses (ev.band / ev.bandSize) -- see frontend/workspaces/asp.js's
-- doSubmitLead()/doSaveEditEvent(). The live app still runs on local mock data for events (see
-- the SUPABASE comment block in asp.js), so this keeps the real schema in sync with the object
-- model for whenever events move onto the real backend, same convention as every other field
-- added there (dress_code, payment_method, etc.).

alter table events add column if not exists band text;
alter table events add column if not exists band_size int;
