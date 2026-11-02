"""
Shared fixtures for the asp-bookings real-browser test harness.
See README.md for the full registry of what's available and why.
"""
import http.server
import os
import socketserver
import threading
import pathlib
import pytest

FRONTEND_DIR = pathlib.Path(__file__).parent.parent / "frontend"
import socket


def _free_port(start=8791, tries=40):
    """The first port from 8791 that nothing listens on -- over IPv4 or IPv6. "localhost" can resolve to either, and
    another project's server on the same port (2026-11-02: a SET Tickets `http.server 8791` on IPv6) made the
    browser load the wrong site mid-run and 50 specs fail."""
    for port in range(start, start + tries):
        busy = False
        for fam, addr in ((socket.AF_INET, "127.0.0.1"), (socket.AF_INET6, "::1")):
            s = socket.socket(fam, socket.SOCK_STREAM)
            s.settimeout(0.2)
            try:
                busy = busy or s.connect_ex((addr, port)) == 0
            except OSError:
                pass
            finally:
                s.close()
        if not busy:
            return port
    raise RuntimeError("no free port for the test server")


PORT = int(os.environ.get("ASP_TEST_PORT") or _free_port())


def _load_dotenv():
    """
    Tiny manual .env loader (no python-dotenv dependency for two lines) -- populates
    ASP_TEST_HARNESS_EMAIL/ASP_TEST_HARNESS_PASSWORD for helpers.login_as_real() from
    test-harness/.env, which is gitignored and never committed. See README.md "Real-auth test
    account setup" for how that file gets created.
    """
    env_path = pathlib.Path(__file__).parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


_load_dotenv()


class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    """Same static handler as `python3 -m http.server`, just silent (pytest output is noisy
    enough already) and rooted at frontend/ regardless of cwd."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)

    def log_message(self, format, *args):
        pass


@pytest.fixture(scope="session")
def live_server():
    """
    Serves frontend/ over real http://localhost — not file://, not a build output — the exact
    static files that ship to GitHub Pages. Bound to localhost specifically (not 0.0.0.0 or a
    bare IP) so the app's service-worker registration behaves the same as it does on a real
    secure-context deploy.
    """
    # ThreadingTCPServer, not plain TCPServer: a real browser fires off several *concurrent*
    # requests for one page load (HTML, icons, manifest.json, sw.js) -- a single-threaded server
    # serializes those, which gets slow enough under this harness's back-to-back load to risk a
    # bare page.goto() timing out entirely. Threading handles them in parallel, like a real host.
    # allow_reuse_address: without it a run started right after the previous one fails with
    # "Address already in use" while the old socket sits in TIME_WAIT (audit 7.2).
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(("localhost", PORT), _QuietHandler)
    httpd.daemon_threads = True
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    yield f"http://localhost:{PORT}"
    httpd.shutdown()
    httpd.server_close()


# Test gigs must never reach the office's real shared gig list (the harness signs in to the
# PRODUCTION Supabase project as real test admins). The app skips its shared-gig sync when this
# flag is set; every page in the default `page` fixture's context gets it. Specs that open their
# own contexts call `no_shared_sync(ctx)` (helpers.py).
@pytest.fixture(autouse=True)
def _never_sync_test_gigs(context):
    context.add_init_script("window.ASP_DISABLE_EVENT_SYNC = true;")
    yield


# Playwright evaluates some test conditions as strings, which the app's Content-Security-Policy (index.html,
# 2026-11-02) rightly blocks. Ordinary specs run with it bypassed; test_every_button.py's own contexts keep it on
# and fail on any violation.
@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    return {**browser_context_args, "bypass_csp": os.environ.get("ASP_TEST_CSP") != "on"}
