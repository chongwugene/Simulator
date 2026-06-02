# 3D Asset Accuracy Spec

This folder is the approval path for the 3D simulator. The original 2D simulator stays untouched.

## Visual Direction

All assets should look brand-new, clean, and fresh from the box:

- bright white nylon/plastic device faces
- clean galvanized mounting yokes and metal boxes
- bright brass, silver, green, black, and copper terminals
- no dust, scuffs, patina, scratches, oxidation, jobsite grime, or rugged used look
- no brand marks or manufacturer logos
- readable terminal geometry from the simulator camera angle

## Accuracy Rules

The image-generation moodboards are not geometry-approved. Any geometry-critical asset must match `data/asset-manifest.json`.

### Outlets

| Asset | Required terminals | Required tabs |
| --- | --- | --- |
| Standard Outlet | 2 brass hot screws, 2 silver neutral screws, 1 green ground screw | Hot tab intact, neutral tab intact |
| Half-Hot Outlet | 2 brass hot screws, 2 silver neutral screws, 1 green ground screw | Hot tab removed, neutral tab intact |
| GFCI Outlet | LINE/IN hot brass, LOAD/OUT hot brass, LINE/IN neutral silver, LOAD/OUT neutral silver, 1 green ground screw | No duplex break-off tabs |

GFCI model requirements:

- front face must show readable `RESET` and `TEST` button labels
- side/back model must include readable `LINE / IN` and `LOAD / OUT` markings at the correct terminal pairs
- the 3D asset should expose enough side/back geometry that a learner can tell which screws are incoming feed and which screws are downstream protected output

### Switches

| Asset | Required terminals | Explicitly not allowed |
| --- | --- | --- |
| Single-Pole Switch | 2 brass screws, 1 green ground screw | Neutral, traveler, or common screw |
| 3-Way Switch | 2 brass traveler screws, 1 black common screw, 1 green ground screw | Neutral screw, fourth traveler screw |
| 4-Way Switch | 4 traveler screws: 2 brass upper screws and 2 black lower screws, plus 1 green ground screw | Common screw, neutral screw |

Mounting screws and yoke holes are allowed, but they must not be mistaken for electrical terminals.

Physical switch layout requirements from the user-provided references:

- 3-way switch: green ground screw high on the left side/yoke; brass traveler screws at the upper-left and upper-right side positions; black common screw at the lower-right side position.
- 4-way switch: brass traveler screws at the upper-left and upper-right side positions; black traveler screws at the lower-left and lower-right side positions; green ground screw low on the left side/yoke; no common screw.
- The 3D model must follow this layout instead of a generic or older switch layout.

### Wires And Cables

| Asset | Required geometry |
| --- | --- |
| Black Hot Wire | Black insulation with bright stripped copper ends |
| Red Traveler/Hot Wire | Red insulation with bright stripped copper ends |
| White Neutral Wire | White insulation with bright stripped copper ends |
| Green Ground Wire | Green insulation with bright stripped copper ends |
| Wire Nut | Clean ribbed twist-on connector |
| 2-Wire NM-B Cable | Beige jacket with black, white, and bare copper ground conductors exposed at both IN and OUT ends |
| 3-Wire NM-B Cable | Beige jacket with black, red, white, and bare copper ground conductors exposed at both IN and OUT ends |

NM-B cable behavior requirements:

- matching conductor colors must be internally continuous from IN to OUT
- both ends must be connectable in the simulator
- exposed conductors must remain clean and freshly stripped

### Boxes, Source, And Lighting

| Asset | Required geometry |
| --- | --- |
| 4x4 Metal Box | Galvanized square box, knockouts, one green ground screw |
| Power Cable / Source Module | Simulator training source with black hot, white neutral, and green ground output terminals |
| Protected Outlet Source | Clean protected outlet / cord source representation |
| Keyless Lampholder | Two terminal screws only: brass hot and silver neutral |
| Plug-In Bulb | Small clean plug-in/receptacle test light asset with hot and neutral blades, no wireable screw terminals |

Plug-in bulb behavior requirements:

- drag onto either receptacle of an outlet to insert it
- drag away from the receptacle to detach it
- the lamp state follows the receptacle it is plugged into
- do not require attach/detach buttons or wire connections for this asset

## Reference Basis

The simulator behavior in the original 2D project remains the source of truth for function. Physical terminal counts are aligned to the project references listed in the 2D `README.md`:

- Leviton duplex receptacle instructions: brass hot screws, silver neutral screws, green grounding, break-off tabs.
- Leviton GFCI instructions: LINE/LOAD hot and neutral terminals, ground, reset/test behavior.
- Leviton single-pole and 3-way switch instructions: single-pole and 3-way terminal behavior.
- Leviton 4-way switch instructions: paired traveler behavior.
- Leviton keyless lampholder instructions: hot/brass and neutral/silver two-terminal wiring.

## Approval Rule

Before any 3D model is accepted, it should pass this checklist:

- every asset has a visible label
- terminal screw count matches the manifest
- terminal colors match the manifest
- break-off tab state matches the outlet type
- cable conductor count and colors match the manifest
- material finish is clean and new
- the object remains readable at the simulator camera distance
