"""
Static checks on frontend/workspaces/asp.js for bug classes the 2026-10-09 audit actually found,
plus one real-browser check of the local "today" helper.

- Duplicate top-level `function` names: a later declaration silently replaces an earlier one
  (a leftover mock doCheckFlightStatus shadowed the real FlightAware integration for weeks).
- Duplicate `case '...'` labels in the action switch: the second one can never run.
- "Today" via fmtISO(new Date()) is the UTC date -- after ~8pm US Eastern it is tomorrow.
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
