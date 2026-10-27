"""
Chat intake endpoint (intake-lead, owner 2026-10-23) against the REAL deployed function. Skipped until
the owner has applied migration 0065, deployed intake-lead and set INTAKE_SECRET -- then run it with the
secret in the environment (never in a file):  INTAKE_SECRET=... .venv/bin/python -m pytest test_intake_lead.py

Proves: no / wrong secret and browser calls are refused; one message creates one lead and a repeat of
its idempotency key creates nothing; the lead is an ordinary review-first lead (status lead, needsReview,
nothing trigger-happy set) that the app shows on Needs Review; and nothing was emailed, no reminder or
travel request was logged and no schedule was added. It deletes the test lead and its key afterwards.
Known side effect: the insert is also posted to the Axis project (axis_sync_events webhook, insert/update
only), which then keeps a copy of this fictional "Intake Harness Test" lead.
Needs the Supabase token in ~/.asp-secrets/supabase_token (database checks) and ANTHROPIC_API_KEY set
on the function (one real AI read per run).
"""
import json
import os
import pathlib
import time
import urllib.request
import urllib.error
import uuid

import pytest

from helpers import login_as, collect_console_errors, seed_events

REF = "psgpxbkncuavlnpplykf"
URL = f"https://{REF}.supabase.co/functions/v1/intake-lead"
SECRET = os.environ.get("INTAKE_SECRET", "")
TOKEN_FILE = pathlib.Path.home() / ".asp-secrets" / "supabase_token"
CLIENT_EMAIL = "intake-harness-test@example.com"
MESSAGE = f"Intake Harness Test Client\n{CLIENT_EMAIL}\nWedding, December 13 2099\nBenny Friedman\nTest Intake Hall, Lakewood NJ\n$1"

pytestmark = pytest.mark.skipif(len(SECRET) < 32 or not TOKEN_FILE.exists(),
                                reason="set INTAKE_SECRET (after deploying intake-lead + migration 0065) to run")


def _call(body, secret=SECRET, headers=None):
    data = body if isinstance(body, bytes) else json.dumps(body).encode()
    h = {"Content-Type": "application/json", **({"x-intake-secret": secret} if secret is not None else {}), **(headers or {})}
    req = urllib.request.Request(URL, data=data, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def _sql(query):
    req = urllib.request.Request(f"https://api.supabase.com/v1/projects/{REF}/database/query",
                                 data=json.dumps({"query": query}).encode(), method="POST",
                                 headers={"Authorization": f"Bearer {TOKEN_FILE.read_text().strip()}",
                                          "Content-Type": "application/json", "User-Agent": "asp-bookings-harness"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def test_intake_lead_is_a_quiet_review_first_lead(page, live_server):
    key = f"harness-{uuid.uuid4()}"
    started = _sql("select now() as t")[0]["t"]
    cron_before = _sql("select jobname, schedule, active from cron.job order by jobname")

    assert _call({"text": MESSAGE, "idempotency_key": key}, secret=None)[0] == 401
    assert _call({"text": MESSAGE, "idempotency_key": key}, secret="x" * 64)[0] == 401
    assert _call({"text": MESSAGE, "idempotency_key": key}, headers={"Origin": "https://evil.example"})[0] == 403
    assert _call(b"text=hi", headers={"Content-Type": "text/plain"})[0] == 415
    assert not _sql(f"select 1 from public.intake_requests where idempotency_key = '{key}'"), "a refused call created something"

    gig = None
    try:
        status, out = _call({"text": MESSAGE, "idempotency_key": key})
        assert status == 200 and out.get("ok") and out.get("created") is True, out
        gig = out["id"]
        assert set(out) == {"ok", "id", "open", "created"}, f"the answer must not echo gig data: {out}"
        status2, out2 = _call({"text": MESSAGE, "idempotency_key": key})
        assert status2 == 200 and out2["id"] == gig and out2["created"] is False, out2
        rows = _sql(f"select legacy_id, app_doc from public.events where app_doc->>'clientEmail' = '{CLIENT_EMAIL}'")
        assert len(rows) == 1, f"a repeated key must not create a second lead: {[r['legacy_id'] for r in rows]}"
        doc = rows[0]["app_doc"]
        assert doc["id"] == gig and doc["status"] == "lead" and doc["needsReview"] is True, doc
        assert doc["flightNeeded"] is False and doc["groundTransportNeeded"] is False and doc["charges"] == []
        assert doc["artistId"] == "benny" and doc["date"] == "2099-12-13", doc
        assert "From chat intake" in doc["importNotes"]

        time.sleep(5)   # let anything that might react to the insert run
        assert not _sql(f"select 1 from public.email_sends where sent_to = '{CLIENT_EMAIL}' and sent_at >= '{started}'"), "an email was sent"
        assert not _sql(f"select 1 from public.client_followups where event_legacy_id = '{gig}'"), "a follow-up was logged"
        assert not _sql(f"select 1 from public.app_records where collection = 'travel_requests' and app_doc->>'eventId' = '{gig}'"), "a travel request was made"
        assert _sql("select jobname, schedule, active from cron.job order by jobname") == cron_before, "the schedules changed"

        # The app shows it like any typed-in lead waiting for review (this browser doesn't sync; seed the real doc).
        errors = collect_console_errors(page)
        seed_events(page, [doc])
        page.goto(live_server)
        login_as(page, "admin_bookings")
        page.evaluate("() => { location.hash = '#/needs_review'; }")
        page.locator(f'[data-action="open-event"][data-id="{gig}"]').first.click()
        page.locator(".sheet").first.wait_for(state="visible")
        assert "Intake Harness Test Client" in page.locator(".sheet").first.inner_text()
        assert not errors, f"console errors: {errors}"
    finally:
        _sql(f"delete from public.events where app_doc->>'clientEmail' = '{CLIENT_EMAIL}'; "
             f"delete from public.intake_requests where idempotency_key = '{key}';")
