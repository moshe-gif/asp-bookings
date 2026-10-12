"""
Static checks on frontend/workspaces/asp.js for bug classes the 2026-10-09 audit actually found,
plus one real-browser check of the local "today" helper.

- Duplicate top-level `function` names: a later declaration silently replaces an earlier one
  (a leftover mock doCheckFlightStatus shadowed the real FlightAware integration for weeks).
- Duplicate `case '...'` labels in the action switch: the second one can never run.
- "Today" via fmtISO(new Date()) is the UTC date -- after ~8pm US Eastern it is tomorrow.
- Activity-log lines and toasts must not claim a text or notification went out: the app has no SMS
  or internal-notification channel (2026-10-12; real emails log what was actually sent).
"""
import collections
import pathlib
import re

ASP_JS = pathlib.Path(__file__).parent.parent / "frontend" / "workspaces" / "asp.js"
SRC = ASP_JS.read_text()


def test_no_duplicate_top_level_function_names():
    names = re.findall(r"^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(", SRC, re.M)
    dupes = [n for n, c in collections.Counter(names).items() if c > 1]
    assert not dupes, f"duplicate top-level functions (later one silently wins): {dupes}"


def test_no_duplicate_action_case_labels():
    labels = re.findall(r"^\s*case '([^']+)':", SRC, re.M)
    dupes = [n for n, c in collections.Counter(labels).items() if c > 1]
    assert not dupes, f"duplicate case labels (second one is unreachable): {dupes}"


def test_today_is_never_computed_in_utc():
    assert "fmtISO(new Date())" not in SRC, "use todayISO() -- fmtISO(new Date()) is the UTC date"


def test_today_helper_uses_the_local_date_in_the_evening(browser):
    # Run the app's own helper source in a real browser set to New York time at 21:30 local,
    # when the UTC date has already rolled over to the next day.
    helper = re.search(r"^function localISO\(d\)\{.*\}$", SRC, re.M).group(0)
    ctx = browser.new_context(timezone_id="America/New_York")
    page = ctx.new_page()
    page.clock.set_fixed_time("2026-10-10T01:30:00Z")  # = 2026-10-09 21:30 in New York
    got = page.evaluate(f"() => {{ {helper}; return [localISO(new Date()), new Date().toISOString().slice(0,10)]; }}")
    ctx.close()
    assert got == ["2026-10-09", "2026-10-10"], got


def test_no_variable_shadows_the_function_it_calls():
    # `const total = total(x)` throws ReferenceError (temporal dead zone) and blanks the whole page.
    hits = re.findall(r"\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*\1\s*\(", SRC)
    assert not hits, f"variables shadowing the function they call: {hits}"


def test_registered_actions_are_not_also_switch_cases():
    registered = re.findall(r"^registerAction\('([^']+)'", SRC, re.M)
    cases = set(re.findall(r"^\s*case '([^']+)':", SRC, re.M))
    both = sorted(set(registered) & cases)
    assert not both, f"actions handled twice (registry wins, switch case is dead): {both}"
    assert len(registered) == len(set(registered)), "an action is registered twice"


def test_the_two_dark_palettes_stay_identical():
    css = (ASP_JS.parent.parent / "styles.css").read_text()
    def decls(start):
        i = css.index(start); j = css.index("{", i); k = css.index("}", j)
        return sorted(x.strip() for x in css[j + 1:k].replace("\n", " ").split(";") if x.strip())
    assert decls(':root:where(:not([data-theme="light"])){') == decls(':root[data-theme="dark"]{'), \
        "styles.css: the system-dark and user-dark palettes differ — keep them identical"


def test_no_fake_notification_claims():
    fake = re.findall(r"(?:logEvent|logProjectEvent|toast)\([^;]*?(?:texted|notified|Notified)[^;]*?\)", SRC)
    assert not fake, f"log/toast claims a notification nothing sent: {fake[:3]}"
    assert "logEvent(ev,'sms'" not in SRC, "an SMS log line, but no SMS provider is connected"
