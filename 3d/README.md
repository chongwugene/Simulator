# Residential Wiring Simulator 3D

Separate 3D prototype for the residential wiring simulator. The original 2D simulator folder is used only as a behavior reference and is not modified by this project.

## Run

```sh
python3 -m http.server 5174
```

Open `http://localhost:5174/`.

The app vendors Three.js locally in `vendor/three.module.js`, so it does not need a CDN at runtime.

## Current Features

- Procedural 3D workbench with realistic clean/new electrical devices.
- Accurate labeled terminals for outlets, GFCI, switches, box ground, black/white/green source, two-ended NM-B cables, wire nut, lampholder, and plug-in bulb.
- GFCI front `TEST` / `RESET` labels plus `LINE / IN` and `LOAD / OUT` markings.
- User-reference terminal placement for 3-way and 4-way switches.
- Mouse interaction for selecting, dragging placed equipment, and a dedicated wiring mode for dragging from any screw or wire nut to another terminal.
- Default scene starts with only the movable protected power cable/source on the board.
- Plug-in bulb snaps into either receptacle of an outlet when dragged onto it, and detaches when dragged away.
- Larger terminal hit zones for easier wire nut and screw connections.
- Wire color palette for black, red, white, and green conductors.
- Circuit analyzer for direct hot-neutral shorts tripping the breaker, hot-ground faults tripping the protected source GFCI, receptacle power, GFCI reset/pass-through, switch continuity, 3-way throws, 4-way straight/crossed traveler behavior, NM-B pass-through continuity, and lamp/tester lighting.
- Inspector, diagnostics, event log, button help tooltips, fit view, bench resize, keyboard Delete, reset, and clear-wires controls.

## Accuracy Source

Geometry-critical requirements live in:

- `data/asset-manifest.json`
- `docs/asset-accuracy-spec.md`
- `concepts/accuracy-locked/`
