# Residential Wiring Simulator

Static browser app for practicing residential outlet, switch, wire, box, and GFCI wiring behavior.

## Run

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173`.

For OpenAI-backed diagnostics chat, run the included local proxy instead of the plain static server:

```sh
OPENAI_API_KEY=your_key_here node server.mjs
```

The browser never stores the API key. Without the proxy, the chat panel falls back to the simulator's local verifier.

## Modeled Behavior

- Fixed upstream scenario: breaker panel -> upstream GFCI -> protected outlet -> independent 3-conductor power-in object.
- Palette items use visual thumbnails and can be dragged into the grid.
- Grid items can be selected, dragged around, and right-clicked for delete.
- Selected items can also be deleted with Delete or Backspace.
- Device screws and conductor ends are visible nodes on the grid. Drag wire-end to screw, source terminal, box ground screw, or wire nut to connect it; loose wire ends do not splice unless they are actually landed in a wire nut.
- Connected screws show a colored landing ring so successful wire terminations are visible on the diagram.
- The tool palette is limited to a 4x4 box, wire nut, power-in source, black hot, red hot, white neutral, and green ground wires.
- The 4x4 box is only an enclosure with one green ground screw. Devices do not automatically belong to boxes or ground through them.
- Outlets and switches float independently until dragged into a 4x4 box. A box can hold two outlets/switches, while a lightbulb occupies the whole box.
- Standard receptacles model top/bottom hot and neutral straps. The hot and neutral break-off tabs can be split independently.
- Half-hot receptacles start with the hot tab removed and the neutral tab intact.
- GFCI receptacles model LINE/LOAD direction, reset/test state, LOAD pass-through, reverse-feed lockout, and downstream ground-fault tripping.
- Single-pole switches close/open one hot leg and warn when neutral is switched.
- 3-way switches connect common to one traveler at a time.
- 4-way switches connect traveler pairs straight or crossed and are intended between two 3-way switches.
- Wired lightbulbs model a basic keyless lampholder with hot and neutral terminals only, and light only when both paths are present.
- Socket lightbulbs plug into the top or bottom receptacle of an outlet and light when that receptacle has hot and neutral.
- Hot-neutral shorts trip the breaker. Hot-ground faults trip GFCI protection first in the protected supply setup.
- Diagnostics chat can explain the current analyzer result. If the optional OpenAI proxy proposes a simulator-state correction, it waits for user acceptance before applying it.

This is an educational simulator, not installation advice.

## References Used

- [Leviton GFCI instruction sheet](https://leviton.com/content/dam/leviton/residential/product_documents/instruction_sheet/leviton-lever-edge-gfci-instruction-sheet-en.pdf): LINE/LOAD, reset, test, reverse-feed behavior.
- [Leviton duplex receptacle instruction sheet](https://leviton.com/content/dam/leviton/residential/product_documents/instruction_sheet/Instruction%20Sheet%20689.pdf): hot/neutral screws, grounding, split break-off tab behavior.
- [Leviton 5601/5603 switch instruction sheet](https://leviton.com/content/dam/leviton/residential/product_documents/instruction_sheet/5601-5603-Instruction-Sheet_EnFrSp.pdf): single-pole and 3-way common/traveler terminal behavior.
- [Leviton RE154 4-way switch instruction sheet](https://leviton.com/content/dam/leviton/residential/product_documents/instruction_sheet/DI-000-RE154-20A.pdf): 4-way traveler-pair usage.
- [Leviton 9874 lampholder instruction sheet](https://leviton.com/content/dam/leviton/residential/product_documents/instruction_sheet/9874-Instruction-Sheet_EnFrSp.pdf): keyless lampholder hot-to-brass and neutral-to-silver two-terminal wiring.
- [FDA GFCI overview](https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/inspection-guides/ground-fault-circuit-interrupter) and [OSHA electrical training material](https://obis.osha.gov/dte/library/electrical/electrical.html): GFCIs detect current imbalance and are not overcurrent breakers.
