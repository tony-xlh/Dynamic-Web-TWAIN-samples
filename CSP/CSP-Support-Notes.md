# Dynamic Web TWAIN — Content Security Policy (CSP) Support Notes

> 1. Strict CSP support
> - Is Dynamic Web TWAIN currently supported without > unsafe-inline in script-src and style-src?
> - Please answer Yes or No.
> - If Yes: provide exact product version, required > config steps, and a complete working CSP example.
> - If No: confirm this is not currently supported.

Yes. script-src and style-src without unsafe-inline is supported for the basic scanning flow. Although the inline script in the installation dialog is blocked, the user can still download the service installer.

> 2. Inline behavior dependency
>- If we remove/replace the default install dialog, does that eliminate all unsafe-inline requirements, or only install-dialog-related requirements?
>- Please identify any remaining components that still require inline styles or inline event handlers.

Yes.

> 3. Required CSP directives
> - Please provide the minimum required production CSP directives for scan functionality.
> - Mark each directive as Required or Optional and explain why each Required directive is needed.
> - Please confirm whether any eval-like behavior requires unsafe-eval.


| Directive | Status | Why |
|---|---|---|
| `script-src 'self' https://cdn.jsdelivr.net` | **Required** | Loads DWT core + resource scripts from jsdelivr. Add a nonce/hash for your own app scripts — no `'unsafe-inline'`/`'unsafe-eval'`/`'wasm-unsafe-eval'` needed. |
| `style-src 'self' https://cdn.jsdelivr.net` | **Required** | Load CSS files via CDN |
| `img-src 'self' data: blob: http://127.0.0.1:* https://127.0.0.1:*` | **Required** | Service serves scanned images from `http://127.0.0.1:18622/…/img`; viewer uses `data:`/`blob:` URLs. |
| `connect-src 'self' https://mlds.dynamsoft.com https://sdls.dynamsoft.com http://127.0.0.1:* https://127.0.0.1:* ws://127.0.0.1:* wss://127.0.0.1:*` | **Required** | License handshake (mlds/sdls, not required using offline license), service API (127.0.0.1), and WebSocket. Add your upload host if you use `HTTPUpload`. |


> 4. Local service endpoints
> - Your note referenced localhost WebSocket ports (for example 18622/> 18623/18625/18626).
> - Please confirm the authoritative list of required local HTTP/WS/WSS endpoints and ports for current versions.

Ports: 18622, 18623, 18625, 18626
Endpoints: 127.0.0.1, localhost

> 5. Roadmap
> - If strict CSP (nonce/hash-compatible, no unsafe-inline) is not supported today, please provide:
> - Planned support status (Yes/No)
> - Target release timeline (quarter/year)
> - Public issue or tracking reference we can monitor

Yes.

