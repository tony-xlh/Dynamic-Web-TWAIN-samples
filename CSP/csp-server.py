#!/usr/bin/env python3
"""
Strict (nonce-based) CSP demo server for Dynamic Web TWAIN.

Run:
    python csp-server.py

Then open:  http://127.0.0.1:8000/

What this demonstrates
----------------------
* A fresh random nonce is generated for EVERY response.
* The nonce is written into the Content-Security-Policy response
  header (script-src / style-src 'nonce-<value>') AND injected as
  nonce="<value>" on the <script>/<style> elements in the HTML.
* Any <script>/<style> that does NOT carry the matching nonce is
  blocked by the browser. There is no 'unsafe-inline' anywhere.
* This is exactly what a server-side template engine (Flask/Django/
  ASP.NET etc.) would do with a per-request nonce.

DWT-specific notes
------------------
* The DWT core + its resource scripts load from jsdelivr as external
  URLs, so they are allowed by `https://cdn.jsdelivr.net` and do NOT
  need a nonce. Nonces are for YOUR inline code and your app script.
* The scan/viewer CSS is loaded via <link rel="stylesheet">, so
  style-src needs no 'unsafe-inline' either.

How to verify
-------------
1. Open DevTools -> Network and reload. Each refresh shows a NEW
   nonce in the CSP response header (and in the served HTML).
2. In the console you should see "[csp-demo] inline script ran ..."
   -> proves the inline <script> was allowed by its nonce.
3. Add an inline script WITHOUT the nonce (or edit the header to a
   fixed value) and reload -> the browser blocks it with a CSP error.
"""

import re
import secrets
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
# 8000 is commonly occupied on Windows (http.sys); pick a less busy one.
PORT = 8123


def build_csp(nonce: str) -> str:
    """The strict policy. Only 'nonce-<value>' + URL sources — no unsafe-inline."""
    return (
        "default-src 'none'; "
        f"script-src 'self' 'nonce-{nonce}' blob: https://cdn.jsdelivr.net; "
        f"style-src 'self' 'nonce-{nonce}' https://cdn.jsdelivr.net; "
        "img-src 'self' data: blob: "
        "http://localhost:* https://localhost:* "
        "http://127.0.0.1:* https://127.0.0.1:*; "
        "font-src 'self' data:; "
        "connect-src 'self' blob: "
        "https://www.dynamsoft.com https://demo.dynamsoft.com "
        "https://mlds.dynamsoft.com https://sdls.dynamsoft.com "
        "http://localhost:* https://localhost:* ws://localhost:* wss://localhost:* "
        "http://127.0.0.1:* https://127.0.0.1:* ws://127.0.0.1:* wss://127.0.0.1:*; "
        "worker-src 'self' blob:; "
        "frame-src 'self' blob:; "
        "object-src 'none'; base-uri 'self'; form-action 'self'"
    )


def strip_meta_csp(html: str) -> str:
    """Remove the <meta> CSP from index.html so the response header is the
    ONLY policy in effect. (If both were present the browser would enforce
    the intersection, which would defeat the nonce demo.)"""
    return re.sub(
        r"<meta\b[^>]*http-equiv=[\"']Content-Security-Policy[\"'][^>]*>",
        "",
        html,
        flags=re.IGNORECASE,
    )


def inject_nonce(html: str, nonce: str) -> str:
    """Add nonce=\"...\" to every <script> / <style> opening tag."""
    def add_nonce(match):
        tag = match.group(0)
        return tag[:-1] + f' nonce="{nonce}"' + tag[-1]

    html = re.sub(r"<script[^>]*>", add_nonce, html)
    html = re.sub(r"<style[^>]*>", add_nonce, html)
    return html


# Demo-only inline snippets injected into the served page. They are placed
# under the SAME per-request nonce, proving inline code runs without
# 'unsafe-inline' when it carries the nonce.
DEMO_INLINE_STYLE = (
    '<style>'
    '#dwtcontrolContainer { border: 1px dashed #c0392b; padding: 4px; }'
    '</style>'
)
DEMO_INLINE_SCRIPT = (
    '<script>'
    'console.log("[csp-demo] inline script ran: it carries the per-request nonce");'
    '</script>'
)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: C901 - simple demo handler
        if self.path in ("/", "/index.html"):
            nonce = secrets.token_urlsafe(16)

            html = (ROOT / "index.html").read_text(encoding="utf-8")
            html = strip_meta_csp(html)
            html = html.replace(
                "</body>", DEMO_INLINE_STYLE + DEMO_INLINE_SCRIPT + "</body>"
            )
            html = inject_nonce(html, nonce)

            body = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Content-Security-Policy", build_csp(nonce))
            self.end_headers()
            self.wfile.write(body)
            print(f"[csp-demo] nonce={nonce}  served to {self.client_address[0]}")
            return

        if self.path == "/dwt-script.js":
            body = (ROOT / "dwt-script.js").read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        self.send_response(404)
        self.end_headers()

    def log_message(self, fmt, *args):
        # Keep the console clean; the nonce line above is what matters.
        pass


if __name__ == "__main__":
    print(f"DWT strict-CSP (nonce) demo server on http://127.0.0.1:{PORT}/")
    print("Press Ctrl+C to stop. Reload the page to see the nonce change.")
    HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
