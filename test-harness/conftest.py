"""
Shared fixtures for the asp-bookings real-browser test harness.
See README.md for the full registry of what's available and why.
"""
import http.server
import socketserver
import threading
import pathlib
import pytest

FRONTEND_DIR = pathlib.Path(__file__).parent.parent / "frontend"
PORT = 8791


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
    httpd = socketserver.ThreadingTCPServer(("localhost", PORT), _QuietHandler)
    httpd.daemon_threads = True
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    yield f"http://localhost:{PORT}"
    httpd.shutdown()
    httpd.server_close()
