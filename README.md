# Residential Wiring Simulators

This repository publishes two static simulator apps:

- `/2d/` - diagram-first residential wiring simulator
- `/3d/` - 3D residential wiring simulator

The root `index.html` is a launcher for both apps.

The hosted 3D app imports Three.js from a pinned CDN URL. The original local prototype can still keep a vendored Three.js file, but this deploy copy stays smaller for fast Cloudflare Pages builds.

## Cloudflare Pages

Recommended free hosting setup:

- Framework preset: `None`
- Build command: leave blank, or use `exit 0`
- Build output directory: `/`
- Production branch: `main`

After Cloudflare Pages is connected to `chongwugene/Simulator`, every push to `main` will redeploy the website automatically.

The `_headers` file intentionally disables browser/CDN caching so updates are visible immediately during active simulator development.

## Local Preview

From this folder:

```bash
python3 -m http.server 4174
```

Then open:

- `http://127.0.0.1:4174/`
- `http://127.0.0.1:4174/2d/`
- `http://127.0.0.1:4174/3d/`
