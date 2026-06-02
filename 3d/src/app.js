import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.0/build/three.module.js";

const DEFAULT_BENCH = { width: 10, depth: 7 };
const BENCH_ORIGIN = { x: -DEFAULT_BENCH.width / 2, z: -DEFAULT_BENCH.depth / 2 };
const BENCH_LIMITS = { minWidth: 5, maxWidth: 60, minDepth: 5, maxDepth: 60, step: 1 };
const DEFAULT_ROMEX_ROTATION = -Math.PI / 2;
const STORAGE_KEY = "electrical-wiring-simulator-3d-state-v1";
const HISTORY_LIMIT = 80;
const DEVICE_MODEL_SCALE = 0.72;
const BOX_DEVICE_TYPES = new Set(["standardOutlet", "halfHotOutlet", "gfciOutlet", "switch", "threeWaySwitch", "fourWaySwitch"]);
const SAVELESS_NOTICE = "This 3D prototype is separate from the original 2D simulator.";

const WIRE_COLORS = [
  { id: "black", label: "Black", value: "#111318", role: "hot" },
  { id: "red", label: "Red", value: "#c72d2d", role: "hot" },
  { id: "white", label: "White", value: "#f7f7f0", role: "neutral" },
  { id: "green", label: "Green", value: "#1d8e55", role: "ground" }
];

const MATERIAL_COLORS = {
  plastic: 0xf7f8f7,
  metal: 0xb8c1c8,
  metalDark: 0x77838d,
  brass: 0xc89125,
  silver: 0xc8d0d8,
  green: 0x1e9659,
  black: 0x17191d,
  red: 0xc72d2d,
  white: 0xf7f7f0,
  copper: 0xc77532,
  porcelain: 0xfbfbf7,
  boxMetal: 0xaeb8c0,
  amber: 0xffb22d
};

const EQUIPMENT = [
  { type: "box", icon: "BX", label: "4x4 Metal Box", note: "Ground screw" },
  { type: "wireNut", icon: "WN", label: "Wire Nut", note: "Splice connector" },
  { type: "standardOutlet", icon: "OU", label: "Standard Outlet", note: "Tabs intact" },
  { type: "halfHotOutlet", icon: "HH", label: "Half-Hot Outlet", note: "Hot tab removed" },
  { type: "gfciOutlet", icon: "GF", label: "GFCI Outlet", note: "TEST / RESET" },
  { type: "switch", icon: "SP", label: "Single-Pole Switch", note: "2 brass + ground" },
  { type: "threeWaySwitch", icon: "3W", label: "3-Way Switch", note: "Reference layout" },
  { type: "fourWaySwitch", icon: "4W", label: "4-Way Switch", note: "Reference layout" },
  { type: "lightBulb", icon: "LB", label: "Keyless Lampholder", note: "Hot + neutral" },
  { type: "plugInBulb", icon: "PL", label: "Plug-In Bulb", note: "Outlet test lamp" },
  { type: "romex2", icon: "12", label: "2-Wire NM-B", note: "Black, white, ground" },
  { type: "romex3", icon: "13", label: "3-Wire NM-B", note: "Black, red, white, ground" }
];

const DEVICE_DEFS = {
  source: {
    label: "Power Cable / Source Module",
    terminals: [
      { id: "hot", label: "Hot", role: "hot", color: "black", pos: [-0.45, 0.22, 0.45] },
      { id: "neutral", label: "Neutral", role: "neutral", color: "white", pos: [0, 0.22, 0.45] },
      { id: "ground", label: "Ground", role: "ground", color: "green", pos: [0.45, 0.22, 0.45] }
    ]
  },
  box: {
    label: "4x4 Metal Box",
    terminals: [
      { id: "ground", label: "Ground", role: "ground", color: "green", pos: [1.18, 0.16, 0.72] }
    ]
  },
  wireNut: {
    label: "Wire Nut",
    terminals: [
      { id: "splice", label: "Splice", role: "splice", color: "amber", pos: [0, 0.44, 0] }
    ]
  },
  standardOutlet: {
    label: "Standard Outlet",
    terminals: [
      { id: "topHot", label: "Top hot", role: "hot", color: "brass", pos: [0.62, 0.25, -0.46] },
      { id: "bottomHot", label: "Bottom hot", role: "hot", color: "brass", pos: [0.62, 0.25, 0.46] },
      { id: "topNeutral", label: "Top neutral", role: "neutral", color: "silver", pos: [-0.62, 0.25, -0.46] },
      { id: "bottomNeutral", label: "Bottom neutral", role: "neutral", color: "silver", pos: [-0.62, 0.25, 0.46] },
      { id: "ground", label: "Ground", role: "ground", color: "green", pos: [-0.58, 0.25, 0.86] }
    ]
  },
  halfHotOutlet: {
    label: "Half-Hot Outlet",
    terminals: [
      { id: "topHot", label: "Top hot", role: "hot", color: "brass", pos: [0.62, 0.25, -0.46] },
      { id: "bottomHot", label: "Bottom hot", role: "hot", color: "brass", pos: [0.62, 0.25, 0.46] },
      { id: "topNeutral", label: "Top neutral", role: "neutral", color: "silver", pos: [-0.62, 0.25, -0.46] },
      { id: "bottomNeutral", label: "Bottom neutral", role: "neutral", color: "silver", pos: [-0.62, 0.25, 0.46] },
      { id: "ground", label: "Ground", role: "ground", color: "green", pos: [-0.58, 0.25, 0.86] }
    ]
  },
  gfciOutlet: {
    label: "GFCI Outlet",
    terminals: [
      { id: "lineHot", label: "LINE/IN hot", role: "hot", color: "brass", pos: [0.64, 0.25, -0.50] },
      { id: "loadHot", label: "LOAD/OUT hot", role: "hot", color: "brass", pos: [0.64, 0.25, 0.48] },
      { id: "lineNeutral", label: "LINE/IN neutral", role: "neutral", color: "silver", pos: [-0.64, 0.25, -0.50] },
      { id: "loadNeutral", label: "LOAD/OUT neutral", role: "neutral", color: "silver", pos: [-0.64, 0.25, 0.48] },
      { id: "ground", label: "Ground", role: "ground", color: "green", pos: [-0.58, 0.25, 0.86] }
    ]
  },
  switch: {
    label: "Single-Pole Switch",
    terminals: [
      { id: "line", label: "Line/feed", role: "hot", color: "brass", pos: [0.62, 0.25, -0.42] },
      { id: "load", label: "Switched leg", role: "hot", color: "brass", pos: [0.62, 0.25, 0.42] },
      { id: "ground", label: "Ground", role: "ground", color: "green", pos: [-0.58, 0.25, 0.86] }
    ]
  },
  threeWaySwitch: {
    label: "3-Way Switch",
    terminals: [
      { id: "travelerLeft", label: "Traveler", role: "traveler", color: "brass", pos: [-0.62, 0.25, -0.43] },
      { id: "travelerRight", label: "Traveler", role: "traveler", color: "brass", pos: [0.62, 0.25, -0.43] },
      { id: "common", label: "Common", role: "hot", color: "black", pos: [0.62, 0.25, 0.58] },
      { id: "ground", label: "Ground", role: "ground", color: "green", pos: [-0.58, 0.25, -0.86] }
    ]
  },
  fourWaySwitch: {
    label: "4-Way Switch",
    terminals: [
      { id: "upperLeft", label: "Traveler", role: "traveler", color: "brass", pos: [-0.62, 0.25, -0.45] },
      { id: "upperRight", label: "Traveler", role: "traveler", color: "brass", pos: [0.62, 0.25, -0.45] },
      { id: "lowerLeft", label: "Traveler", role: "traveler", color: "black", pos: [-0.62, 0.25, 0.58] },
      { id: "lowerRight", label: "Traveler", role: "traveler", color: "black", pos: [0.62, 0.25, 0.58] },
      { id: "ground", label: "Ground", role: "ground", color: "green", pos: [-0.58, 0.25, 0.86] }
    ]
  },
  lightBulb: {
    label: "Keyless Lampholder",
    terminals: [
      { id: "hot", label: "Hot", role: "hot", color: "brass", pos: [-0.52, 0.2, 0.54] },
      { id: "neutral", label: "Neutral", role: "neutral", color: "silver", pos: [0.52, 0.2, 0.54] }
    ]
  },
  plugInBulb: {
    label: "Plug-In Bulb",
    terminals: []
  },
  romex2: {
    label: "2-Wire NM-B",
    terminals: [
      { id: "blackIn", label: "Black IN", role: "hot", color: "black", pos: [-1.16, 0.16, -0.32] },
      { id: "whiteIn", label: "White IN", role: "neutral", color: "white", pos: [-1.06, 0.16, 0.00] },
      { id: "groundIn", label: "Ground IN", role: "ground", color: "copper", pos: [-1.16, 0.16, 0.32] },
      { id: "blackOut", label: "Black OUT", role: "hot", color: "black", pos: [1.16, 0.16, -0.32] },
      { id: "whiteOut", label: "White OUT", role: "neutral", color: "white", pos: [1.06, 0.16, 0.00] },
      { id: "groundOut", label: "Ground OUT", role: "ground", color: "copper", pos: [1.16, 0.16, 0.32] }
    ]
  },
  romex3: {
    label: "3-Wire NM-B",
    terminals: [
      { id: "blackIn", label: "Black IN", role: "hot", color: "black", pos: [-1.2, 0.16, -0.48] },
      { id: "redIn", label: "Red IN", role: "hot", color: "red", pos: [-1.12, 0.16, -0.16] },
      { id: "whiteIn", label: "White IN", role: "neutral", color: "white", pos: [-1.12, 0.16, 0.16] },
      { id: "groundIn", label: "Ground IN", role: "ground", color: "copper", pos: [-1.2, 0.16, 0.48] },
      { id: "blackOut", label: "Black OUT", role: "hot", color: "black", pos: [1.2, 0.16, -0.48] },
      { id: "redOut", label: "Red OUT", role: "hot", color: "red", pos: [1.12, 0.16, -0.16] },
      { id: "whiteOut", label: "White OUT", role: "neutral", color: "white", pos: [1.12, 0.16, 0.16] },
      { id: "groundOut", label: "Ground OUT", role: "ground", color: "copper", pos: [1.2, 0.16, 0.48] }
    ]
  }
};

const state = {
  objects: [],
  wires: [],
  nextObject: 1,
  nextWire: 1,
  selected: null,
  selectedObjectIds: new Set(),
  pendingTerminal: null,
  wireColor: WIRE_COLORS[0],
  mode: "build",
  bench: { ...DEFAULT_BENCH },
  breakerOn: true,
  breakerTripped: false,
  gfciProtectedTrip: false,
  history: { undo: [], redo: [], restoring: false },
  diagnosticFocus: null,
  renderedDiagnostics: [],
  log: []
};

const runtime = {
  scene: null,
  camera: null,
  renderer: null,
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(),
  plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  pickables: [],
  terminalPickables: [],
  wirePickables: [],
  terminalMeshes: new Map(),
  materials: {},
  benchMesh: null,
  gridGroup: null,
  selectionMarker: null,
  drag: null,
  orbit: null,
  marquee: null,
  marqueeEl: null,
  cameraTarget: new THREE.Vector3(0, 0, 0),
  cameraTheta: Math.PI * 0.25,
  cameraPhi: Math.PI * 0.32,
  cameraRadius: 8.5,
  animationFrame: null
};

const el = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  createMaterials();
  createScene();
  renderPalette();
  renderModeUI();
  bindEvents();
  const demoId = new URLSearchParams(window.location.search).get("demo");
  if (demoId) {
    loadDemo(demoId);
  } else {
    seedScene();
  }
  resize();
  analyzeAndRender();
  animate();
  addLog(SAVELESS_NOTICE);
  updateUndoRedoUI();
}

function cacheElements() {
  el.sceneMount = document.getElementById("sceneMount");
  el.equipmentPalette = document.getElementById("equipmentPalette");
  el.wirePalette = document.getElementById("wirePalette");
  el.selectionPanel = document.getElementById("selectionPanel");
  el.diagnostics = document.getElementById("diagnostics");
  el.eventLog = document.getElementById("eventLog");
  el.supplyStatus = document.getElementById("supplyStatus");
  el.modeHint = document.getElementById("modeHint");
  el.wiringModeButton = document.getElementById("wiringModeButton");
  el.benchSize = document.getElementById("benchSize");
  el.benchWidthInput = document.getElementById("benchWidth");
  el.benchDepthInput = document.getElementById("benchDepth");
  el.benchPanXInput = document.getElementById("benchPanX");
  el.benchPanZInput = document.getElementById("benchPanZ");
}

function createMaterials() {
  runtime.materials = {
    bench: new THREE.MeshStandardMaterial({ color: 0xd9dde0, roughness: 0.74, metalness: 0.04 }),
    benchLine: new THREE.LineBasicMaterial({ color: 0xb7c0c8, transparent: true, opacity: 0.62 }),
    plastic: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.plastic, roughness: 0.58, metalness: 0.02 }),
    porcelain: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.porcelain, roughness: 0.48, metalness: 0.02 }),
    metal: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.metal, roughness: 0.34, metalness: 0.72 }),
    metalDark: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.metalDark, roughness: 0.4, metalness: 0.74 }),
    boxMetal: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.boxMetal, roughness: 0.48, metalness: 0.78 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x17191d, roughness: 0.48, metalness: 0.18 }),
    brass: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.brass, roughness: 0.24, metalness: 0.76 }),
    silver: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.silver, roughness: 0.22, metalness: 0.82 }),
    green: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.green, roughness: 0.36, metalness: 0.36 }),
    black: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.black, roughness: 0.42, metalness: 0.28 }),
    red: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.red, roughness: 0.44, metalness: 0.06 }),
    white: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.white, roughness: 0.48, metalness: 0.02 }),
    copper: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.copper, roughness: 0.22, metalness: 0.82 }),
    amber: new THREE.MeshStandardMaterial({ color: MATERIAL_COLORS.amber, roughness: 0.38, metalness: 0.08 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 0.35, transparent: true, opacity: 0.34 }),
    glow: new THREE.MeshStandardMaterial({ color: 0xfff4b2, emissive: 0xffc857, emissiveIntensity: 1.4, roughness: 0.2 })
  };
}

function createScene() {
  runtime.scene = new THREE.Scene();
  runtime.scene.background = new THREE.Color(0x202a34);
  runtime.scene.fog = new THREE.Fog(0x202a34, 12, 22);

  runtime.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
  updateCamera();

  runtime.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  runtime.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  runtime.renderer.shadowMap.enabled = true;
  runtime.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.sceneMount.appendChild(runtime.renderer.domElement);
  createMarqueeOverlay();

  const hemi = new THREE.HemisphereLight(0xf7fbff, 0x3b4550, 2.2);
  runtime.scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(-4, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  runtime.scene.add(key);

  const fill = new THREE.DirectionalLight(0xbcd8ff, 1.1);
  fill.position.set(6, 5, -4);
  runtime.scene.add(fill);

  createBenchSurface();
  createSelectionMarker();
}

function createMarqueeOverlay() {
  const marquee = document.createElement("div");
  marquee.className = "marquee-select";
  marquee.hidden = true;
  el.sceneMount.appendChild(marquee);
  runtime.marqueeEl = marquee;
}

function createGridLines() {
  const group = new THREE.Group();
  const material = runtime.materials.benchLine;
  const bounds = benchBounds();
  for (let x = bounds.minX; x <= bounds.maxX + 0.001; x += 0.5) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.005, bounds.minZ),
      new THREE.Vector3(x, 0.005, bounds.maxZ)
    ]);
    group.add(new THREE.Line(geometry, material));
  }
  for (let z = bounds.minZ; z <= bounds.maxZ + 0.001; z += 0.5) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(bounds.minX, 0.006, z),
      new THREE.Vector3(bounds.maxX, 0.006, z)
    ]);
    group.add(new THREE.Line(geometry, material));
  }
  return group;
}

function createBenchSurface() {
  if (runtime.benchMesh) runtime.scene.remove(runtime.benchMesh);
  if (runtime.gridGroup) runtime.scene.remove(runtime.gridGroup);

  const bench = new THREE.Mesh(
    new THREE.BoxGeometry(state.bench.width + 0.5, 0.18, state.bench.depth + 0.5),
    runtime.materials.bench
  );
  const center = benchCenter();
  bench.position.set(center.x, -0.11, center.z);
  bench.receiveShadow = true;
  bench.name = "workbench";
  runtime.scene.add(bench);
  runtime.benchMesh = bench;

  runtime.gridGroup = createGridLines();
  runtime.scene.add(runtime.gridGroup);
  renderBenchSize();
}

function createSelectionMarker() {
  const marker = new THREE.Group();
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x1b78d0,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
    depthTest: false
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.55, 64), ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.name = "selection-ring";
  marker.add(ring);
  marker.visible = false;
  runtime.scene.add(marker);
  runtime.selectionMarker = marker;
}

function benchBounds(margin = 0) {
  return {
    minX: BENCH_ORIGIN.x + margin,
    maxX: BENCH_ORIGIN.x + state.bench.width - margin,
    minZ: BENCH_ORIGIN.z + margin,
    maxZ: BENCH_ORIGIN.z + state.bench.depth - margin
  };
}

function benchCenter() {
  const bounds = benchBounds();
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    z: (bounds.minZ + bounds.maxZ) / 2
  };
}

function renderPalette() {
  const equipmentLocked = state.mode === "wiring";
  el.equipmentPalette.innerHTML = EQUIPMENT.map((item) => `
    <button type="button" class="palette-button" data-equipment="${item.type}" title="${item.label}: ${item.note}"${equipmentLocked ? " disabled" : ""}>
      <span class="palette-icon">${item.icon}</span>
      <span>
        <span class="palette-label">${item.label}</span>
        <span class="palette-note">${item.note}</span>
      </span>
    </button>
  `).join("");

  el.wirePalette.innerHTML = WIRE_COLORS.map((wire) => `
    <button type="button" class="wire-option${wire.id === state.wireColor.id ? " active" : ""}" data-wire-color="${wire.id}">
      <span class="swatch" style="background:${wire.value}"></span>
      <span>${wire.label}</span>
    </button>
  `).join("");
}

function bindEvents() {
  el.equipmentPalette.addEventListener("click", (event) => {
    const button = event.target.closest("[data-equipment]");
    if (!button) return;
    if (state.mode === "wiring") {
      setHint("Wiring mode is active. Switch back to build mode to place equipment.");
      return;
    }
    const type = button.dataset.equipment;
    const position = nextSpawnPosition(type);
    pushUndoState();
    const object = addObject(type, position.x, position.z);
    selectItem({ type: "object", id: object.id });
    analyzeAndRender();
  });

  el.wirePalette.addEventListener("click", (event) => {
    const button = event.target.closest("[data-wire-color]");
    if (!button) return;
    state.wireColor = WIRE_COLORS.find((wire) => wire.id === button.dataset.wireColor) || WIRE_COLORS[0];
    renderPalette();
    setHint(`${state.wireColor.label} wire selected. Drag from one terminal to another to connect.`);
  });

  el.diagnostics.addEventListener("click", (event) => {
    const card = event.target.closest("[data-diagnostic-index]");
    if (!card) return;
    const entry = state.renderedDiagnostics[Number(card.dataset.diagnosticIndex)];
    focusDiagnostic(entry);
    if (entry?.detail) setHint(entry.detail);
  });

  document.body.addEventListener("click", handleActionClick);
  document.addEventListener("keydown", handleKeyDown);
  window.addEventListener("resize", resize);
  [el.benchWidthInput, el.benchDepthInput].forEach((input) => {
    input?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      applyCustomBenchSize();
    });
  });
  [el.benchPanXInput, el.benchPanZInput].forEach((input) => {
    input?.addEventListener("input", handleBenchPanInput);
  });

  const canvas = runtime.renderer.domElement;
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointerleave", handlePointerUp);
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("wheel", handleWheel, { passive: false });
}

function seedScene() {
  addObject("source", -3.1, -2.15);
  addLog("Workbench starts with only the movable protected power cable/source.");
}

function loadDemo(id) {
  state.bench = { width: 12, depth: 8 };
  createBenchSurface();
  if (id === "1") buildDemoOne();
  if (id === "2") buildDemoTwo();
  if (id === "3") buildDemoThree();
  if (id === "4") buildDemoFour();
  setHint(`Problem ${id} solution mockup. Use Wiring mode to inspect or adjust terminal connections.`);
}

function addDemoSource(x = -4.65, z = -2.8) {
  return addObject("source", x, z);
}

function addDemoBox(type, x, z, options = {}) {
  const box = addObject("box", x, z);
  const device = addObject(type, x + (options.offsetX || 0), z + (options.offsetZ || 0));
  if (options.rotation) rotateObjectTo(device, options.rotation);
  return { box, device };
}

function rotateObjectTo(object, rotation) {
  object.rotation = rotation;
  object.group.rotation.y = rotation;
  if (object.type === "romex2" || object.type === "romex3") refreshRomexLabels(object);
}

function addDemoWire(from, fromTerminal, to, toTerminal, color) {
  state.wireColor = WIRE_COLORS.find((wire) => wire.id === color) || WIRE_COLORS[0];
  connectTerminals(
    { objectId: from.id, terminalId: fromTerminal },
    { objectId: to.id, terminalId: toTerminal }
  );
}

function addDemoRomex2(x, z, rotation = DEFAULT_ROMEX_ROTATION) {
  const romex = addObject("romex2", x, z);
  rotateObjectTo(romex, rotation);
  return romex;
}

function addSourcePigtails(source, positions) {
  const hot = addObject("wireNut", positions.hot[0], positions.hot[1]);
  const neutral = addObject("wireNut", positions.neutral[0], positions.neutral[1]);
  const ground = addObject("wireNut", positions.ground[0], positions.ground[1]);
  addDemoWire(source, "hot", hot, "splice", "black");
  addDemoWire(source, "neutral", neutral, "splice", "white");
  addDemoWire(source, "ground", ground, "splice", "green");
  return { hot, neutral, ground };
}

function buildDemoOne() {
  const source = addDemoSource();
  const pigtails = addSourcePigtails(source, {
    hot: [-4.25, -1.55],
    neutral: [-3.55, -1.55],
    ground: [-2.85, -1.55]
  });
  const switchBox = addDemoBox("switch", -1.5, -0.25);
  const romex = addDemoRomex2(0.55, -0.25);
  const lampBox = addDemoBox("lightBulb", 2.75, -0.25);
  switchBox.device.on = true;

  addDemoWire(pigtails.hot, "splice", switchBox.device, "line", "black");
  addDemoWire(switchBox.device, "load", romex, "blackIn", "black");
  addDemoWire(pigtails.neutral, "splice", romex, "whiteIn", "white");
  addDemoWire(pigtails.ground, "splice", switchBox.device, "ground", "green");
  addDemoWire(switchBox.device, "ground", switchBox.box, "ground", "green");
  addDemoWire(switchBox.box, "ground", romex, "groundIn", "green");
  addDemoWire(romex, "blackOut", lampBox.device, "hot", "black");
  addDemoWire(romex, "whiteOut", lampBox.device, "neutral", "white");
  addDemoWire(romex, "groundOut", lampBox.box, "ground", "green");
  addLog("Problem 1: switch controls the downstream light; neutral bypasses the switch to the lamp.");
}

function buildDemoTwo() {
  const source = addDemoSource();
  const pigtails = addSourcePigtails(source, {
    hot: [-4.2, -1.55],
    neutral: [-3.5, -1.55],
    ground: [-2.8, -1.55]
  });
  const first = addDemoBox("standardOutlet", -1.55, -0.45);
  const romex = addDemoRomex2(0.5, -0.45);
  const second = addDemoBox("standardOutlet", 2.65, -0.45);

  addDemoWire(pigtails.hot, "splice", first.device, "topHot", "black");
  addDemoWire(pigtails.hot, "splice", romex, "blackIn", "black");
  addDemoWire(pigtails.neutral, "splice", first.device, "topNeutral", "white");
  addDemoWire(pigtails.neutral, "splice", romex, "whiteIn", "white");
  addDemoWire(pigtails.ground, "splice", first.device, "ground", "green");
  addDemoWire(pigtails.ground, "splice", first.box, "ground", "green");
  addDemoWire(first.box, "ground", romex, "groundIn", "green");
  addDemoWire(romex, "blackOut", second.device, "topHot", "black");
  addDemoWire(romex, "whiteOut", second.device, "topNeutral", "white");
  addDemoWire(romex, "groundOut", second.device, "ground", "green");
  addDemoWire(first.device, "ground", first.box, "ground", "green");
  addDemoWire(second.device, "ground", second.box, "ground", "green");
  addLog("Problem 2: feed-through outlet circuit; both receptacles are constant power.");
}

function buildDemoThree() {
  const source = addDemoSource();
  const pigtails = addSourcePigtails(source, {
    hot: [-4.2, -1.55],
    neutral: [-3.5, -1.55],
    ground: [-2.8, -1.55]
  });
  const comboBox = addObject("box", -1.55, -0.35);
  const outlet = addObject("standardOutlet", -1.95, -0.35);
  const switchDevice = addObject("switch", -1.1, -0.35);
  switchDevice.on = true;
  const romex = addDemoRomex2(0.55, -0.35);
  const lampBox = addDemoBox("lightBulb", 2.85, -0.35);

  addDemoWire(pigtails.hot, "splice", outlet, "topHot", "black");
  addDemoWire(pigtails.hot, "splice", switchDevice, "line", "black");
  addDemoWire(switchDevice, "load", romex, "blackIn", "black");
  addDemoWire(pigtails.neutral, "splice", outlet, "topNeutral", "white");
  addDemoWire(pigtails.neutral, "splice", romex, "whiteIn", "white");
  addDemoWire(pigtails.ground, "splice", outlet, "ground", "green");
  addDemoWire(outlet, "ground", switchDevice, "ground", "green");
  addDemoWire(switchDevice, "ground", comboBox, "ground", "green");
  addDemoWire(comboBox, "ground", romex, "groundIn", "green");
  addDemoWire(romex, "blackOut", lampBox.device, "hot", "black");
  addDemoWire(romex, "whiteOut", lampBox.device, "neutral", "white");
  addDemoWire(romex, "groundOut", lampBox.box, "ground", "green");
  addLog("Problem 3: outlet is constant power; switch leg controls only the downstream light.");
}

function buildDemoFour() {
  const source = addDemoSource();
  const pigtails = addSourcePigtails(source, {
    hot: [-4.2, -1.55],
    neutral: [-3.5, -1.55],
    ground: [-2.8, -1.55]
  });
  const gfci = addDemoBox("gfciOutlet", -1.55, -0.45);
  const romex = addDemoRomex2(0.55, -0.45);
  const outlet = addDemoBox("standardOutlet", 2.75, -0.45);

  addDemoWire(pigtails.hot, "splice", gfci.device, "lineHot", "black");
  addDemoWire(pigtails.neutral, "splice", gfci.device, "lineNeutral", "white");
  addDemoWire(pigtails.ground, "splice", gfci.device, "ground", "green");
  addDemoWire(gfci.device, "loadHot", romex, "blackIn", "black");
  addDemoWire(gfci.device, "loadNeutral", romex, "whiteIn", "white");
  addDemoWire(gfci.device, "ground", romex, "groundIn", "green");
  addDemoWire(romex, "blackOut", outlet.device, "topHot", "black");
  addDemoWire(romex, "whiteOut", outlet.device, "topNeutral", "white");
  addDemoWire(romex, "groundOut", outlet.device, "ground", "green");
  addDemoWire(gfci.device, "ground", gfci.box, "ground", "green");
  addDemoWire(outlet.device, "ground", outlet.box, "ground", "green");
  addLog("Problem 4: downstream outlet is fed from GFCI LOAD so it is protected.");
}

function nextSpawnPosition(type) {
  const margin = Math.max(0.85, spawnRadiusForType(type));
  const step = 0.75;
  const candidates = [];
  const bounds = benchBounds(margin);
  for (let x = bounds.minX; x <= bounds.maxX; x += step) {
    for (let z = bounds.minZ; z <= bounds.maxZ; z += step) {
      candidates.push({ x: Number(x.toFixed(2)), z: Number(z.toFixed(2)) });
    }
  }

  const ranked = candidates
    .map((candidate) => ({
      ...candidate,
      clearance: nearestObjectClearance(candidate, type),
      targetDistance: Math.hypot(candidate.x - runtime.cameraTarget.x, candidate.z - runtime.cameraTarget.z)
    }))
    .sort((a, b) => {
      const aOpen = a.clearance >= 0;
      const bOpen = b.clearance >= 0;
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      if (aOpen) return a.targetDistance - b.targetDistance;
      return b.clearance - a.clearance;
    });

  const best = ranked[0] || { x: 0, z: 0 };
  return {
    x: clamp(best.x, bounds.minX, bounds.maxX),
    z: clamp(best.z, bounds.minZ, bounds.maxZ)
  };
}

function nearestObjectClearance(candidate, type) {
  const radius = spawnRadiusForType(type);
  if (!state.objects.length) return Infinity;
  return Math.min(...state.objects.map((object) => (
    Math.hypot(candidate.x - object.x, candidate.z - object.z) - radius - spawnRadiusForType(object.type)
  )));
}

function spawnRadiusForType(type) {
  if (type === "box") return 1.7;
  if (type === "source") return 1.1;
  if (type === "lightBulb") return 1.1;
  if (type === "plugInBulb") return 0.8;
  if (type === "wireNut") return 0.7;
  if (type === "romex2" || type === "romex3") return 1.0;
  if (usesScaledDeviceModel(type)) return 0.95;
  return 0.9;
}

function addObject(type, x, z, options = {}) {
  const def = DEVICE_DEFS[type];
  const object = {
    id: options.id || `${type}_${state.nextObject++}`,
    type,
    label: def.label,
    x,
    z,
    rotation: options.rotation ?? defaultRotationForType(type),
    fixed: Boolean(options.fixed ?? def.fixed),
    on: Boolean(options.on),
    position: options.position || "A",
    crossed: Boolean(options.crossed),
    gfciReset: options.gfciReset ?? true,
    lit: false,
    pluggedInto: options.pluggedInto || null,
    terminalState: new Map(),
    group: null
  };

  object.group = createObjectGroup(object);
  object.group.position.set(x, 0, z);
  object.group.rotation.y = object.rotation;
  object.group.userData = { kind: "asset", id: object.id };
  state.objects.push(object);
  runtime.scene.add(object.group);
  collectPickables(object.group);
  if (!options.silent) addLog(`Added ${object.label}.`);
  return object;
}

function defaultRotationForType(type) {
  if (type === "romex2" || type === "romex3") return DEFAULT_ROMEX_ROTATION;
  return 0;
}

function createObjectGroup(object) {
  const group = new THREE.Group();
  const type = object.type;
  const modelGroup = usesScaledDeviceModel(type) ? new THREE.Group() : group;
  if (type === "source") buildSource(modelGroup, object);
  if (type === "box") buildMetalBox(modelGroup, object);
  if (type === "wireNut") buildWireNut(modelGroup, object);
  if (type === "standardOutlet" || type === "halfHotOutlet") buildOutlet(modelGroup, object, type === "halfHotOutlet");
  if (type === "gfciOutlet") buildGfci(modelGroup, object);
  if (type === "switch" || type === "threeWaySwitch" || type === "fourWaySwitch") buildSwitch(modelGroup, object);
  if (type === "lightBulb") buildLampholder(modelGroup, object);
  if (type === "plugInBulb") buildPlugInBulb(modelGroup, object);
  if (type === "romex2" || type === "romex3") buildRomex(modelGroup, object, type === "romex3");
  if (modelGroup !== group) {
    modelGroup.scale.setScalar(modelScaleForType(type));
    group.add(modelGroup);
  }
  addDeviceLabel(group, object);
  addTerminalMeshes(group, object);
  return group;
}

function buildSource(group) {
  addBox(group, 1.7, 0.22, 1.2, [0, 0.11, 0], runtime.materials.boxMetal, true);
  addBox(group, 0.84, 0.42, 0.58, [0, 0.36, -0.18], runtime.materials.dark, true);
  addBox(group, 0.18, 0.48, 0.38, [-0.16, 0.62, -0.18], runtime.materials.black, true);
  addBox(group, 0.18, 0.48, 0.38, [0.16, 0.62, -0.18], runtime.materials.black, true);
  addTextSprite(group, "HOT", [-0.45, 0.42, 0.72], 0.22);
  addTextSprite(group, "NEUTRAL", [0, 0.42, 0.72], 0.2);
  addTextSprite(group, "GROUND", [0.45, 0.42, 0.72], 0.2);
}

function buildMetalBox(group) {
  addBox(group, 3.05, 0.1, 2.34, [0, 0.05, 0], runtime.materials.boxMetal, true);
  addBox(group, 0.12, 0.28, 2.34, [-1.48, 0.18, 0], runtime.materials.boxMetal, true);
  addBox(group, 0.12, 0.28, 2.34, [1.48, 0.18, 0], runtime.materials.boxMetal, true);
  addBox(group, 3.05, 0.28, 0.12, [0, 0.18, -1.11], runtime.materials.boxMetal, true);
  addBox(group, 3.05, 0.28, 0.12, [0, 0.18, 1.11], runtime.materials.boxMetal, true);
  addBox(group, 2.58, 0.012, 1.78, [0, 0.075, 0], runtime.materials.bench, false);
}

function buildWireNut(group) {
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.72, 36), runtime.materials.amber);
  body.position.y = 0.38;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.23 - i * 0.018, 0.012, 8, 36), runtime.materials.brass);
    ring.position.y = 0.15 + i * 0.09;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  }
}

function buildOutlet(group, object, halfHot) {
  buildDeviceYoke(group);
  addBox(group, 1.0, 0.18, 1.9, [0, 0.18, 0], runtime.materials.plastic, true);
  addBox(group, 0.78, 0.06, 0.72, [0, 0.32, -0.48], runtime.materials.white, true);
  addBox(group, 0.78, 0.06, 0.72, [0, 0.32, 0.50], runtime.materials.white, true);
  addReceptacleSlots(group, -0.48);
  addReceptacleSlots(group, 0.50);
  addStrap(group, -0.62, halfHot ? "intact" : "intact", "silver");
  addStrap(group, 0.62, halfHot ? "split" : "intact", "brass");
  if (halfHot) addTextSprite(group, "HOT TAB REMOVED", [0, 0.58, 1.13], 0.18);
}

function buildGfci(group) {
  buildDeviceYoke(group);
  addBox(group, 1.04, 0.2, 1.92, [0, 0.18, 0], runtime.materials.plastic, true);
  addReceptacleSlots(group, -0.62);
  addBox(group, 0.62, 0.05, 0.2, [0, 0.34, -0.05], runtime.materials.white, true);
  addBox(group, 0.62, 0.05, 0.2, [0, 0.34, 0.25], runtime.materials.white, true);
  addTextSprite(group, "TEST", [0, 0.43, -0.05], 0.18);
  addTextSprite(group, "RESET", [0, 0.43, 0.25], 0.17);
  addReceptacleSlots(group, 0.72);
  addTextSprite(group, "LINE / IN", [0, 0.46, -1.12], 0.18);
  addTextSprite(group, "LOAD / OUT", [0, 0.46, 1.12], 0.17);
  addStrap(group, -0.66, "intact", "silver");
  addStrap(group, 0.66, "intact", "brass");
}

function buildSwitch(group, object) {
  buildDeviceYoke(group);
  const isReferenceSwitch = object.type === "threeWaySwitch" || object.type === "fourWaySwitch";
  if (isReferenceSwitch) {
    addBox(group, 1.08, 0.08, 1.78, [0, 0.31, 0], runtime.materials.metal, true);
  }
  addBox(group, 0.9, 0.2, 1.86, [0, 0.18, 0], runtime.materials.plastic, true);
  addBox(group, 0.48, 0.09, 0.86, [0, 0.37, 0], runtime.materials.silver, true);
  const toggle = addBox(group, 0.26, 0.18, 0.62, [0, 0.54, object.on ? -0.09 : 0.09], runtime.materials.white, true);
  toggle.rotation.x = object.on ? -0.22 : 0.22;
  toggle.name = "switch-toggle";
  const toggleHit = addBox(
    group,
    0.48,
    0.28,
    0.92,
    [0, 0.58, 0],
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    false
  );
  toggleHit.name = "switch-toggle";
  if (object.type === "threeWaySwitch") {
    addTextSprite(group, "3-WAY", [0, 0.58, -1.08], 0.18);
    addTextSprite(group, "COMMON", [0.96, 0.46, 0.58], 0.15);
  }
  if (object.type === "fourWaySwitch") {
    addTextSprite(group, "4-WAY", [0, 0.58, -1.08], 0.18);
    addTextSprite(group, "NO COMMON", [0, 0.58, 1.12], 0.16);
  }
}

function buildLampholder(group, object) {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.84, 0.18, 64), runtime.materials.porcelain);
  base.position.y = 0.14;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.42, 64), runtime.materials.porcelain);
  socket.position.y = 0.42;
  socket.castShadow = true;
  socket.receiveShadow = true;
  group.add(socket);

  const brassRing = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 12, 64), runtime.materials.brass);
  brassRing.position.y = 0.66;
  brassRing.rotation.x = Math.PI / 2;
  group.add(brassRing);

  const bulbMaterial = object.lit ? runtime.materials.glow : runtime.materials.glass;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 24), bulbMaterial);
  bulb.position.y = 1.0;
  bulb.name = "bulb-glass";
  bulb.castShadow = true;
  group.add(bulb);
}

function buildPlugInBulb(group, object) {
  addBox(group, 0.68, 0.2, 0.48, [0, 0.16, 0.18], runtime.materials.plastic, true);
  addBox(group, 0.16, 0.07, 0.54, [-0.16, 0.16, 0.58], runtime.materials.brass, true);
  addBox(group, 0.16, 0.07, 0.54, [0.16, 0.16, 0.58], runtime.materials.silver, true);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.22, 48), runtime.materials.porcelain);
  base.position.y = 0.34;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const bulbMaterial = object.lit ? runtime.materials.glow : runtime.materials.glass;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 24), bulbMaterial);
  bulb.position.y = 0.68;
  bulb.name = "bulb-glass";
  bulb.castShadow = true;
  group.add(bulb);
  addTextSprite(group, "PLUG-IN TESTER", [0, 0.44, -0.22], 0.14);
}

function buildRomex(group, object, hasRed) {
  addBox(group, 0.56, 0.18, 0.3, [0, 0.17, 0], new THREE.MeshStandardMaterial({ color: 0xe8dec8, roughness: 0.62 }), true);
  const wires = hasRed
    ? [["black", "black", -0.48, 1.2], ["red", "red", -0.16, 1.12], ["white", "white", 0.16, 1.12], ["ground", "copper", 0.48, 1.2]]
    : [["black", "black", -0.32, 1.16], ["white", "white", 0, 1.06], ["ground", "copper", 0.32, 1.16]];
  wires.forEach(([terminalBase, color, z, endX]) => {
    const inConductor = makeCylinderBetween(new THREE.Vector3(-0.16, 0.18, z), new THREE.Vector3(-endX, 0.18, z), 0.042, materialForColor(color));
    inConductor.userData = { kind: "terminal", objectId: object.id, terminalId: `${terminalBase}In` };
    inConductor.name = `romex-${terminalBase}-in-target`;
    group.add(inConductor);

    const outConductor = makeCylinderBetween(new THREE.Vector3(0.16, 0.18, z), new THREE.Vector3(endX, 0.18, z), 0.042, materialForColor(color));
    outConductor.userData = { kind: "terminal", objectId: object.id, terminalId: `${terminalBase}Out` };
    outConductor.name = `romex-${terminalBase}-out-target`;
    group.add(outConductor);
  });
  object.romexHasRed = hasRed;
  object.romexBadgeSprites = [];
  refreshRomexLabels(object, group);
}

function refreshRomexLabels(object, group = object.group) {
  if (!group) return;
  object.romexBadgeSprites?.forEach((sprite) => {
    group.remove(sprite);
    sprite.material.map?.dispose();
    sprite.material.dispose();
  });

  const conductors = romexConductorBadge(object);
  object.romexBadgeSprites = [
    addTextSprite(group, "IN", [-1.28, 0.38, -0.62], 0.095, { background: "rgba(255,255,255,0.94)" }),
    addTextSprite(group, conductors, [-1.28, 0.38, 0.62], 0.09, { background: "rgba(255,255,255,0.94)" }),
    addTextSprite(group, "OUT", [1.28, 0.38, -0.62], 0.095, { background: "rgba(255,255,255,0.94)" }),
    addTextSprite(group, conductors, [1.28, 0.38, 0.62], 0.09, { background: "rgba(255,255,255,0.94)" })
  ];
}

function romexConductorBadge(object) {
  const sequence = object.romexHasRed ? ["B", "R", "W", "G"] : ["B", "W", "G"];
  return romexIsReversed(object) ? sequence.reverse().join(" / ") : sequence.join(" / ");
}

function romexIsReversed(object) {
  return Math.cos(normalizeRotation(object.rotation - DEFAULT_ROMEX_ROTATION)) < -0.5;
}

function buildDeviceYoke(group) {
  addBox(group, 0.46, 0.08, 2.55, [0, 0.07, 0], runtime.materials.metal, true);
  addBox(group, 1.04, 0.06, 0.25, [0, 0.08, -1.22], runtime.materials.metal, true);
  addBox(group, 1.04, 0.06, 0.25, [0, 0.08, 1.22], runtime.materials.metal, true);
  for (const z of [-1.22, 1.22]) {
    for (const x of [-0.36, 0.36]) {
      const hole = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.014, 8, 32), runtime.materials.metalDark || runtime.materials.metal);
      hole.rotation.x = Math.PI / 2;
      hole.position.set(x, 0.13, z);
      group.add(hole);
    }
  }
}

function addReceptacleSlots(group, z) {
  addBox(group, 0.07, 0.03, 0.28, [-0.16, 0.38, z - 0.07], runtime.materials.dark, false);
  addBox(group, 0.07, 0.03, 0.28, [0.16, 0.38, z - 0.07], runtime.materials.dark, false);
  const ground = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 24), runtime.materials.dark);
  ground.rotation.x = Math.PI / 2;
  ground.position.set(0, 0.39, z + 0.24);
  group.add(ground);
}

function addStrap(group, x, stateName, materialName) {
  if (stateName === "split") {
    addBox(group, 0.035, 0.035, 0.42, [x, 0.36, -0.35], runtime.materials[materialName], true);
    addBox(group, 0.035, 0.035, 0.42, [x, 0.36, 0.46], runtime.materials[materialName], true);
    addTextSprite(group, "gap", [x + 0.16, 0.48, 0.04], 0.14);
  } else {
    addBox(group, 0.035, 0.035, 1.18, [x, 0.36, 0.05], runtime.materials[materialName], true);
  }
}

function addTerminalMeshes(group, object) {
  const def = DEVICE_DEFS[object.type];
  def.terminals.forEach((terminal) => {
    const material = materialForColor(terminal.color).clone();
    const position = scaledTerminalPosition(object.type, terminal.pos);
    const terminalRadius = isRomexType(object.type) ? 0.13 : 0.105;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(terminalRadius, 24, 18), material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.name = `terminal-${terminal.id}`;
    mesh.userData = { kind: "terminal", objectId: object.id, terminalId: terminal.id };
    group.add(mesh);

    const screwSlot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.012, 0.018), runtime.materials.white);
    screwSlot.position.copy(mesh.position).add(new THREE.Vector3(0, 0.11, 0));
    screwSlot.userData = mesh.userData;
    group.add(screwSlot);

    const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const hitMesh = object.type === "wireNut"
      ? new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), hitMaterial)
      : isRomexType(object.type)
        ? new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 14), hitMaterial)
        : new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), hitMaterial);
    hitMesh.position.copy(mesh.position);
    hitMesh.userData = mesh.userData;
    hitMesh.name = `terminal-hit-${terminal.id}`;
    group.add(hitMesh);

    if (terminal.label.length <= 12 && object.type !== "source" && object.type !== "romex2" && object.type !== "romex3") {
      const labelSprite = addTextSprite(group, terminal.label, [position[0] * 1.08, position[1] + 0.22, position[2]], 0.12);
      labelSprite.userData = { kind: "terminalLabel", objectId: object.id, terminalId: terminal.id };
      labelSprite.visible = false;
    }

    runtime.terminalMeshes.set(terminalRef(object.id, terminal.id), mesh);
  });
}

function addDeviceLabel(group, object) {
  const config = deviceLabelConfig(object.type);
  const sprite = addTextSprite(group, object.label, config.position, config.size, {
    background: "rgba(255,255,255,0.88)",
    color: "#16202a"
  });
  sprite.userData = { kind: "deviceLabel", objectId: object.id };
}

function deviceLabelConfig(type) {
  const defaults = { position: [0, 0.16, 1.02], size: 0.18 };
  const configs = {
    source: { position: [0, 0.48, 0.08], size: 0.16 },
    box: { position: [0, 0.20, 1.02], size: 0.17 },
    wireNut: { position: [0, 0.16, 0.54], size: 0.16 },
    standardOutlet: { position: [0, 0.15, 0.92], size: 0.16 },
    halfHotOutlet: { position: [0, 0.15, 0.92], size: 0.16 },
    gfciOutlet: { position: [0, 0.15, 0.92], size: 0.16 },
    switch: { position: [0, 0.15, 0.92], size: 0.16 },
    threeWaySwitch: { position: [0, 0.15, 0.92], size: 0.16 },
    fourWaySwitch: { position: [0, 0.15, 0.92], size: 0.16 },
    lightBulb: { position: [0, 0.16, 0.88], size: 0.17 },
    plugInBulb: { position: [0, 0.16, 0.62], size: 0.15 },
    romex2: { position: [0, 0.18, 0.58], size: 0.16 },
    romex3: { position: [0, 0.18, 0.58], size: 0.16 }
  };
  return configs[type] || defaults;
}

function addTextSprite(group, value, position, size = 0.18, options = {}) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const fontSize = 44;
  const padding = 18;
  context.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
  const metrics = context.measureText(value);
  canvas.width = Math.ceil(metrics.width + padding * 2);
  canvas.height = 78;
  context.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const background = options.background === false ? null : options.background || "rgba(255,255,255,0.92)";
  if (background) {
    roundRect(context, 2, 8, canvas.width - 4, canvas.height - 16, 16);
    context.fillStyle = background;
    context.fill();
    context.strokeStyle = "rgba(23,32,42,0.18)";
    context.lineWidth = 2;
    context.stroke();
  }
  context.fillStyle = options.color || "#1f2933";
  context.fillText(value, canvas.width / 2, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }));
  sprite.position.set(...position);
  sprite.scale.set((canvas.width / canvas.height) * size, size, 1);
  sprite.renderOrder = 80;
  group.add(sprite);
  return sprite;
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function addBox(group, width, height, depth, position, material, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(...position);
  mesh.castShadow = shadow;
  mesh.receiveShadow = shadow;
  group.add(mesh);
  return mesh;
}

function makeCylinderBetween(a, b, radius, material) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 18);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function collectPickables(group) {
  group.traverse((child) => {
    if (!child.isMesh) return;
    if (child.userData.kind === "terminal") {
      runtime.terminalPickables.push(child);
      return;
    }
    child.userData = child.userData.kind ? child.userData : group.userData;
    runtime.pickables.push(child);
  });
}

function materialForColor(color) {
  if (color === "silver") return runtime.materials.silver;
  if (color === "brass") return runtime.materials.brass;
  if (color === "green") return runtime.materials.green;
  if (color === "black") return runtime.materials.black;
  if (color === "red") return runtime.materials.red;
  if (color === "white") return runtime.materials.white;
  if (color === "copper") return runtime.materials.copper;
  if (color === "amber") return runtime.materials.amber;
  return runtime.materials.plastic;
}

function handleActionClick(event) {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "toggle-wiring-mode") {
    setMode(state.mode === "wiring" ? "build" : "wiring");
  }
  if (action === "fit-view") {
    centerCameraOnBench();
  }
  if (action === "undo") undoState();
  if (action === "redo") redoState();
  if (action === "reset-scene") resetScene();
  if (action === "bench-larger") resizeBench(BENCH_LIMITS.step);
  if (action === "bench-smaller") resizeBench(-BENCH_LIMITS.step);
  if (action === "bench-apply") applyCustomBenchSize();
  if (action === "save-state") saveState();
  if (action === "load-state") loadState();
  if (action === "clear-wires") clearWires();
  if (action === "power-cycle") {
    runAnalysis();
  }
  if (action === "trip-breaker") {
    pushUndoState();
    state.breakerTripped = true;
    addLog("Breaker tripped manually.");
    analyzeAndRender();
  }
  if (action === "reset-breaker") {
    pushUndoState();
    state.breakerTripped = false;
    state.gfciProtectedTrip = false;
    addLog("Breaker and protected source GFCI reset.");
    analyzeAndRender();
  }
  if (action === "delete-selected") deleteSelected();
  if (action === "rotate-selected") rotateSelected();
  if (action === "toggle-selected") toggleSelected();
  if (action === "gfci-test") testSelectedGfci();
  if (action === "gfci-reset") resetSelectedGfci();
}

function capturePointer(event) {
  try {
    event.currentTarget.setPointerCapture?.(event.pointerId);
  } catch {
    // Pointer capture can already be owned by the canvas during rapid drags.
  }
}

function releasePointer(event) {
  try {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  } catch {
    // Losing capture on pointerleave is harmless.
  }
}

function startObjectDrag(event, object) {
  if (object.fixed) return;
  const ids = state.selectedObjectIds.has(object.id)
    ? [...state.selectedObjectIds]
    : [object.id];
  const movableIds = ids.filter((id) => !objectById(id)?.fixed);
  if (!movableIds.length) return;
  const before = captureSceneSnapshot();
  movableIds.forEach((id) => {
    const entry = objectById(id);
    if (entry?.type === "plugInBulb" && entry.pluggedInto) detachPlugInBulb(entry, false);
  });
  runtime.drag = {
    type: "objects",
    ids: movableIds,
    startPoint: intersectPlane(event),
    starts: movableIds.map((id) => {
      const entry = objectById(id);
      return { id, x: entry.x, z: entry.z };
    }),
    before,
    moved: false
  };
}

function clampObjectDragDelta(starts, deltaX, deltaZ) {
  const bounds = benchBounds(0.7);
  let minXDelta = -Infinity;
  let maxXDelta = Infinity;
  let minZDelta = -Infinity;
  let maxZDelta = Infinity;
  starts.forEach((start) => {
    minXDelta = Math.max(minXDelta, bounds.minX - start.x);
    maxXDelta = Math.min(maxXDelta, bounds.maxX - start.x);
    minZDelta = Math.max(minZDelta, bounds.minZ - start.z);
    maxZDelta = Math.min(maxZDelta, bounds.maxZ - start.z);
  });
  return {
    x: clamp(deltaX, minXDelta, maxXDelta),
    z: clamp(deltaZ, minZDelta, maxZDelta)
  };
}

function startMarqueeSelection(event) {
  runtime.marquee = {
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    active: false
  };
  updateMarqueeElement();
}

function updateMarqueeSelection(event) {
  runtime.marquee.currentX = event.clientX;
  runtime.marquee.currentY = event.clientY;
  const distance = Math.hypot(
    runtime.marquee.currentX - runtime.marquee.startX,
    runtime.marquee.currentY - runtime.marquee.startY
  );
  runtime.marquee.active = runtime.marquee.active || distance > 6;
  updateMarqueeElement();
}

function finishMarqueeSelection(event) {
  updateMarqueeSelection(event);
  const marquee = runtime.marquee;
  hideMarqueeElement();
  if (!marquee.active) {
    selectItem(null);
    return;
  }
  const rect = marqueeClientRect(marquee);
  const ids = state.objects
    .filter((object) => !object.fixed)
    .filter((object) => pointInRect(projectObjectToClient(object), rect))
    .map((object) => object.id);
  if (ids.length > 1) {
    selectItem({ type: "multi", ids });
    setHint(`${ids.length} objects selected. Drag any selected object to move the group.`);
  } else if (ids.length === 1) {
    selectItem({ type: "object", id: ids[0] });
  } else {
    selectItem(null);
  }
}

function updateMarqueeElement() {
  if (!runtime.marqueeEl || !runtime.marquee) return;
  const marquee = runtime.marquee;
  if (!marquee.active) {
    runtime.marqueeEl.hidden = true;
    return;
  }
  const sceneRect = el.sceneMount.getBoundingClientRect();
  const rect = marqueeClientRect(marquee);
  runtime.marqueeEl.hidden = false;
  runtime.marqueeEl.style.left = `${rect.left - sceneRect.left}px`;
  runtime.marqueeEl.style.top = `${rect.top - sceneRect.top}px`;
  runtime.marqueeEl.style.width = `${rect.right - rect.left}px`;
  runtime.marqueeEl.style.height = `${rect.bottom - rect.top}px`;
}

function hideMarqueeElement() {
  if (runtime.marqueeEl) runtime.marqueeEl.hidden = true;
}

function marqueeClientRect(marquee) {
  return {
    left: Math.min(marquee.startX, marquee.currentX),
    right: Math.max(marquee.startX, marquee.currentX),
    top: Math.min(marquee.startY, marquee.currentY),
    bottom: Math.max(marquee.startY, marquee.currentY)
  };
}

function projectObjectToClient(object) {
  const rect = runtime.renderer.domElement.getBoundingClientRect();
  const vector = new THREE.Vector3(object.x, 0.35, object.z).project(runtime.camera);
  return {
    x: rect.left + (vector.x + 1) * rect.width / 2,
    y: rect.top + (-vector.y + 1) * rect.height / 2
  };
}

function pointInRect(point, rect) {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function handlePointerDown(event) {
  capturePointer(event);
  const hit = pick(event);
  if (hit.terminal) {
    const target = hit.terminal.object.userData;
    if (state.mode !== "wiring") {
      selectItem({ type: "terminal", objectId: target.objectId, terminalId: target.terminalId });
      setHint("Enable Wiring mode to make terminal or wire nut connections.");
      return;
    }
    if (state.pendingTerminal && !sameTerminal(state.pendingTerminal, target)) {
      connectTerminals(state.pendingTerminal, target);
      state.pendingTerminal = null;
      analyzeAndRender();
    } else {
      state.pendingTerminal = { objectId: target.objectId, terminalId: target.terminalId };
      selectItem({ type: "terminal", objectId: target.objectId, terminalId: target.terminalId });
      setHint(`Connecting from ${terminalName(target.objectId, target.terminalId)}. Drag or click another terminal.`);
    }
    runtime.drag = { type: "connect", started: true };
    return;
  }

  if (hit.asset) {
    const object = objectById(hit.asset.object.userData.id);
    if (!object) return;
    if (!state.selectedObjectIds.has(object.id)) {
      selectItem({ type: "object", id: object.id });
    }
    if (isSwitchToggleHit(hit.asset.object) && isSwitchType(object.type)) {
      toggleObject(object);
      return;
    }
    if (state.mode === "wiring") {
      setHint("Wiring mode keeps equipment fixed. Drag from a terminal or wire nut to connect.");
      return;
    }
    startObjectDrag(event, object);
    return;
  }

  if (hit.wire) {
    selectItem({ type: "wire", id: hit.wire.object.userData.id });
    return;
  }

  state.pendingTerminal = null;
  if (event.button === 2 || event.altKey) {
    runtime.orbit = { x: event.clientX, y: event.clientY, theta: runtime.cameraTheta, phi: runtime.cameraPhi };
    return;
  }
  startMarqueeSelection(event);
}

function handlePointerMove(event) {
  if (runtime.marquee) {
    updateMarqueeSelection(event);
    return;
  }

  if (runtime.drag?.type === "objects") {
    const point = intersectPlane(event);
    const delta = clampObjectDragDelta(
      runtime.drag.starts,
      point.x - runtime.drag.startPoint.x,
      point.z - runtime.drag.startPoint.z
    );
    runtime.drag.starts.forEach((start) => {
      const object = objectById(start.id);
      if (!object) return;
      object.x = start.x + delta.x;
      object.z = start.z + delta.z;
      object.group.position.set(object.x, 0, object.z);
    });
    runtime.drag.moved = Math.abs(delta.x) > 0.01 || Math.abs(delta.z) > 0.01;
    updateWires();
    updatePlugAttachments();
    updateSelectionHighlights();
    return;
  }

  if (runtime.orbit) {
    const dx = event.clientX - runtime.orbit.x;
    const dy = event.clientY - runtime.orbit.y;
    runtime.cameraTheta = runtime.orbit.theta - dx * 0.006;
    runtime.cameraPhi = clamp(runtime.orbit.phi + dy * 0.004, 0.18, 1.18);
    updateCamera();
  }
}

function handlePointerUp(event) {
  releasePointer(event);
  if (runtime.marquee) {
    finishMarqueeSelection(event);
    runtime.marquee = null;
    return;
  }
  if (runtime.drag?.type === "connect") {
    const hit = pick(event);
    if (hit.terminal) {
      const target = hit.terminal.object.userData;
      if (state.pendingTerminal && !sameTerminal(state.pendingTerminal, target)) {
        connectTerminals(state.pendingTerminal, target);
        state.pendingTerminal = null;
        analyzeAndRender();
      }
    }
  }
  if (runtime.drag?.type === "objects") {
    if (runtime.drag.moved) {
      pushUndoSnapshot(runtime.drag.before);
    }
    runtime.drag.ids.forEach((id) => {
      const object = objectById(id);
      if (object?.type === "plugInBulb") tryAttachPlugInBulb(object);
    });
    analyzeAndRender();
  }
  runtime.drag = null;
  runtime.orbit = null;
}

function handleKeyDown(event) {
  const tagName = event.target?.tagName?.toLowerCase();
  if (tagName === "input" || tagName === "textarea" || event.target?.isContentEditable) return;
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && key === "z") {
    event.preventDefault();
    if (event.shiftKey) redoState();
    else undoState();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && key === "y") {
    event.preventDefault();
    redoState();
    return;
  }
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    deleteSelected();
  }
}

function handleWheel(event) {
  event.preventDefault();
  if (event.ctrlKey || event.metaKey || event.altKey) {
    runtime.cameraRadius = clamp(runtime.cameraRadius + event.deltaY * 0.006, 4.8, maxCameraRadius());
    updateCamera();
    return;
  }
  const horizontalDelta = event.shiftKey && Math.abs(event.deltaX) < 1 ? event.deltaY : event.deltaX;
  const verticalDelta = event.shiftKey && Math.abs(event.deltaX) < 1 ? 0 : event.deltaY;
  panCameraByScroll(horizontalDelta, verticalDelta);
}

function pick(event) {
  const rect = runtime.renderer.domElement.getBoundingClientRect();
  runtime.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  runtime.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  runtime.raycaster.setFromCamera(runtime.pointer, runtime.camera);

  const assetHits = runtime.raycaster.intersectObjects(runtime.pickables, true);
  if (assetHits.length && state.mode !== "wiring") {
    const toggleHit = assetHits.find((hit) => isSwitchToggleHit(hit.object));
    if (toggleHit) return { asset: toggleHit };
    const deviceHit = assetHits.find((hit) => objectById(hit.object.userData.id)?.type !== "box");
    if (deviceHit) return { asset: deviceHit };
    return { asset: assetHits[0] };
  }

  const terminalHits = runtime.raycaster.intersectObjects(runtime.terminalPickables, true);
  if (terminalHits.length) return { terminal: bestTerminalHit(event, terminalHits) };

  const wireHits = runtime.raycaster.intersectObjects(runtime.wirePickables, true);
  if (wireHits.length) return { wire: wireHits[0] };

  if (assetHits.length) {
    const toggleHit = assetHits.find((hit) => isSwitchToggleHit(hit.object));
    if (toggleHit) return { asset: toggleHit };
    const deviceHit = assetHits.find((hit) => objectById(hit.object.userData.id)?.type !== "box");
    if (deviceHit) return { asset: deviceHit };
    return { asset: assetHits[0] };
  }

  return {};
}

function bestTerminalHit(event, terminalHits) {
  return terminalHits
    .map((hit) => ({ hit, screenDistance: terminalScreenDistance(event, hit.object.userData) }))
    .sort((a, b) => a.screenDistance - b.screenDistance || a.hit.distance - b.hit.distance)[0].hit;
}

function terminalScreenDistance(event, terminal) {
  const rect = runtime.renderer.domElement.getBoundingClientRect();
  const pos = terminalWorldPosition(terminal.objectId, terminal.terminalId).project(runtime.camera);
  const x = rect.left + (pos.x + 1) * rect.width / 2;
  const y = rect.top + (-pos.y + 1) * rect.height / 2;
  return Math.hypot(event.clientX - x, event.clientY - y);
}

function intersectPlane(event) {
  const rect = runtime.renderer.domElement.getBoundingClientRect();
  runtime.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  runtime.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  runtime.raycaster.setFromCamera(runtime.pointer, runtime.camera);
  const point = new THREE.Vector3();
  runtime.raycaster.ray.intersectPlane(runtime.plane, point);
  return point;
}

function connectTerminals(from, to) {
  if (isRomexSelfConnection(from, to)) {
    setHint("Romex conductors in the same cable cannot be wire-jumpered to each other. Connect each conductor to another device, wire nut, or cable end.");
    addLog("Skipped Romex self-connection.");
    return;
  }
  const duplicate = state.wires.some((wire) =>
    (sameTerminal(wire.from, from) && sameTerminal(wire.to, to)) ||
    (sameTerminal(wire.from, to) && sameTerminal(wire.to, from))
  );
  if (duplicate) {
    setHint("Those terminals are already connected.");
    return;
  }
  pushUndoState();
  const wire = {
    id: `wire_${state.nextWire++}`,
    from: { objectId: from.objectId, terminalId: from.terminalId },
    to: { objectId: to.objectId, terminalId: to.terminalId },
    color: state.wireColor.id,
    role: state.wireColor.role,
    mesh: null,
    labelSprite: null
  };
  state.wires.push(wire);
  buildWireMesh(wire);
  addLog(`Connected ${terminalName(from.objectId, from.terminalId)} to ${terminalName(to.objectId, to.terminalId)} with ${state.wireColor.label.toLowerCase()} wire.`);
  setHint("Wire connected. Drag terminals again to add another connection.");
}

function isRomexSelfConnection(from, to) {
  if (from.objectId !== to.objectId) return false;
  const object = objectById(from.objectId);
  return isRomexType(object?.type);
}

function buildWireMesh(wire) {
  if (wire.mesh) {
    runtime.scene.remove(wire.mesh);
    runtime.wirePickables = runtime.wirePickables.filter((mesh) => mesh !== wire.mesh);
    wire.mesh.geometry.dispose();
  }
  if (wire.labelSprite) {
    runtime.scene.remove(wire.labelSprite);
    wire.labelSprite.material.map?.dispose();
    wire.labelSprite.material.dispose();
    wire.labelSprite = null;
  }
  const start = terminalWorldPosition(wire.from.objectId, wire.from.terminalId);
  const end = terminalWorldPosition(wire.to.objectId, wire.to.terminalId);
  const distance = start.distanceTo(end);
  const direction = end.clone().sub(start);
  const flatDirection = new THREE.Vector3(direction.x, 0, direction.z);
  const perpendicular = flatDirection.length() > 0.001
    ? new THREE.Vector3(-flatDirection.z, 0, flatDirection.x).normalize()
    : new THREE.Vector3(1, 0, 0);
  const lift = clamp(distance * 0.13, 0.22, 0.72);
  const laneOffset = perpendicular.multiplyScalar(wireLaneOffset(wire));
  const mid1 = start.clone().lerp(end, 0.32).add(new THREE.Vector3(0, lift, 0)).add(laneOffset);
  const mid2 = start.clone().lerp(end, 0.68).add(new THREE.Vector3(0, lift, 0)).add(laneOffset);
  const curve = new THREE.CubicBezierCurve3(start, mid1, mid2, end);
  const material = new THREE.MeshStandardMaterial({
    color: wireColorValue(wire.color),
    roughness: 0.5,
    metalness: wire.color === "white" ? 0.03 : 0.08
  });
  const geometry = new THREE.TubeGeometry(curve, 36, 0.035, 14, false);
  wire.mesh = new THREE.Mesh(geometry, material);
  wire.mesh.castShadow = true;
  wire.mesh.receiveShadow = true;
  wire.mesh.userData = { kind: "wire", id: wire.id };
  runtime.scene.add(wire.mesh);
  runtime.wirePickables.push(wire.mesh);

  wire.labelAnchor = curve.getPoint(0.52).add(new THREE.Vector3(0, 0.12, 0));
}

function updateWires() {
  state.wires.forEach(buildWireMesh);
}

function terminalWorldPosition(objectId, terminalId) {
  const mesh = runtime.terminalMeshes.get(terminalRef(objectId, terminalId));
  if (!mesh) return new THREE.Vector3();
  return mesh.getWorldPosition(new THREE.Vector3());
}

function terminalRef(objectId, terminalId) {
  return `${objectId}:${terminalId}`;
}

function sameTerminal(a, b) {
  return a?.objectId === b?.objectId && a?.terminalId === b?.terminalId;
}

function terminalName(objectId, terminalId) {
  const object = objectById(objectId);
  const terminal = terminalDef(object?.type, terminalId);
  return `${object?.label || objectId} ${terminal?.label || terminalId}`;
}

function terminalDef(type, terminalId) {
  return DEVICE_DEFS[type]?.terminals.find((terminal) => terminal.id === terminalId);
}

function isOutletType(type) {
  return type === "standardOutlet" || type === "halfHotOutlet" || type === "gfciOutlet";
}

function isRomexType(type) {
  return type === "romex2" || type === "romex3";
}

function receptacleLocalZs(type) {
  if (type === "gfciOutlet") return { top: -0.62, bottom: 0.72 };
  return { top: -0.48, bottom: 0.50 };
}

function receptacleAnchors() {
  const anchors = [];
  state.objects.filter((object) => isOutletType(object.type)).forEach((outlet) => {
    const zPositions = receptacleLocalZs(outlet.type);
    Object.entries(zPositions).forEach(([receptacle, z]) => {
      const local = scaledTerminalPosition(outlet.type, [0, 0.34, z]);
      const position = outlet.group.localToWorld(new THREE.Vector3(...local));
      anchors.push({ outlet, receptacle, position });
    });
  });
  return anchors;
}

function nearestAvailableReceptacle(object) {
  let nearest = null;
  receptacleAnchors().forEach((anchor) => {
    const occupied = state.objects.some((entry) =>
      entry.id !== object.id &&
      entry.type === "plugInBulb" &&
      entry.pluggedInto?.outletId === anchor.outlet.id &&
      entry.pluggedInto?.receptacle === anchor.receptacle
    );
    if (occupied) return;
    const distance = Math.hypot(object.x - anchor.position.x, object.z - anchor.position.z);
    if (!nearest || distance < nearest.distance) nearest = { ...anchor, distance };
  });
  return nearest;
}

function tryAttachPlugInBulb(object) {
  const nearest = nearestAvailableReceptacle(object);
  if (!nearest || nearest.distance > 0.72) {
    setHint("Drag the plug-in bulb onto the top or bottom receptacle of an outlet to insert it.");
    return false;
  }
  object.pluggedInto = { outletId: nearest.outlet.id, receptacle: nearest.receptacle };
  snapPlugInBulbToAnchor(object, nearest);
  addLog(`${object.label} plugged into ${nearest.outlet.label} ${nearest.receptacle} receptacle.`);
  setHint(`${object.label} is plugged in. Drag it away from the receptacle to detach it.`);
  return true;
}

function detachPlugInBulb(object, shouldLog = true) {
  if (!object?.pluggedInto) return;
  const outlet = objectById(object.pluggedInto.outletId);
  const receptacle = object.pluggedInto.receptacle;
  object.pluggedInto = null;
  if (shouldLog) addLog(`${object.label} detached${outlet ? ` from ${outlet.label} ${receptacle} receptacle` : ""}.`);
}

function snapPlugInBulbToAnchor(object, anchor) {
  object.x = anchor.position.x;
  object.z = anchor.position.z;
  object.rotation = anchor.outlet.rotation;
  object.group.position.set(object.x, 0, object.z);
  object.group.rotation.y = object.rotation;
}

function updatePlugAttachments() {
  state.objects.filter((object) => object.type === "plugInBulb" && object.pluggedInto).forEach((plug) => {
    const anchor = receptacleAnchors().find((entry) =>
      entry.outlet.id === plug.pluggedInto.outletId && entry.receptacle === plug.pluggedInto.receptacle
    );
    if (anchor) {
      snapPlugInBulbToAnchor(plug, anchor);
    } else {
      detachPlugInBulb(plug, false);
    }
  });
}

function selectItem(selection) {
  const normalized = normalizeSelection(selection);
  state.selected = normalized;
  if (normalized?.type === "multi") {
    state.selectedObjectIds = new Set(normalized.ids);
  } else if (normalized?.type === "object") {
    state.selectedObjectIds = new Set([normalized.id]);
  } else {
    state.selectedObjectIds = new Set();
  }
  updateSelectionHighlights();
  renderInspector();
}

function normalizeSelection(selection) {
  if (selection?.type !== "multi") return selection;
  const ids = [...new Set(selection.ids)].filter((id) => objectById(id));
  if (ids.length > 1) return { type: "multi", ids };
  if (ids.length === 1) return { type: "object", id: ids[0] };
  return null;
}

function updateSelectionHighlights() {
  state.objects.forEach((object) => {
    const selectedObject = state.selectedObjectIds.has(object.id);
    const diagnosticObject = state.diagnosticFocus?.objectIds?.includes(object.id);
    object.group.traverse((child) => {
      if (child.isMesh && child.userData.kind !== "terminal") {
        child.scale.setScalar(selectedObject || diagnosticObject ? 1.035 : 1);
      }
    });
  });
  runtime.terminalMeshes.forEach((mesh, ref) => {
    const [objectId, terminalId] = ref.split(":");
    const isPending = state.pendingTerminal?.objectId === objectId && state.pendingTerminal?.terminalId === terminalId;
    const isSelected = state.selected?.type === "terminal" && state.selected.objectId === objectId && state.selected.terminalId === terminalId;
    const isDiagnostic = state.diagnosticFocus?.refs?.includes(ref);
    mesh.scale.setScalar(isPending || isSelected || isDiagnostic ? 1.45 : 1);
  });
  state.wires.forEach((wire) => {
    const selectedWire = state.selected?.type === "wire" && state.selected.id === wire.id;
    const diagnosticWire = state.diagnosticFocus?.wireIds?.includes(wire.id);
    if (wire.mesh) wire.mesh.scale.setScalar(selectedWire || diagnosticWire ? 1.6 : 1);
    syncWireLabel(wire, selectedWire || diagnosticWire);
  });
  updateTerminalLabelVisibility();
  updateSelectionMarker();
}

function updateTerminalLabelVisibility() {
  state.objects.forEach((object) => {
    const selectedObject = state.selectedObjectIds.has(object.id);
    const showObjectTerminals = state.mode === "wiring" && selectedObject;
    object.group.traverse((child) => {
      if (child.userData.kind !== "terminalLabel") return;
      const selectedTerminal = state.selected?.type === "terminal" &&
        state.selected.objectId === child.userData.objectId &&
        state.selected.terminalId === child.userData.terminalId;
      const pendingTerminal = state.pendingTerminal?.objectId === child.userData.objectId &&
        state.pendingTerminal?.terminalId === child.userData.terminalId;
      child.visible = showObjectTerminals || selectedTerminal || pendingTerminal;
    });
  });
}

function syncWireLabel(wire, shouldShow) {
  if (!shouldShow) {
    if (wire.labelSprite) wire.labelSprite.visible = false;
    return;
  }
  if (!wire.labelSprite) {
    const position = wire.labelAnchor || new THREE.Vector3();
    wire.labelSprite = addTextSprite(
      runtime.scene,
      wireLabelText(wire),
      [position.x, position.y, position.z],
      0.11,
      { background: "rgba(255,255,255,0.96)", color: "#17202a" }
    );
  }
  wire.labelSprite.position.copy(wire.labelAnchor || wire.labelSprite.position);
  wire.labelSprite.visible = true;
}

function updateSelectionMarker() {
  const marker = runtime.selectionMarker;
  if (!marker) return;
  const selected = state.selected;
  if (!selected) {
    marker.visible = false;
    return;
  }

  marker.visible = true;
  if (selected.type === "multi") {
    const objects = selected.ids.map(objectById).filter(Boolean);
    if (!objects.length) {
      marker.visible = false;
      return;
    }
    const center = objects.reduce((acc, object) => {
      acc.x += object.x;
      acc.z += object.z;
      return acc;
    }, { x: 0, z: 0 });
    center.x /= objects.length;
    center.z /= objects.length;
    const radius = objects.reduce((max, object) => (
      Math.max(max, Math.hypot(object.x - center.x, object.z - center.z) + selectionRadiusForObject(object))
    ), 0.75);
    marker.position.set(center.x, 0.055, center.z);
    marker.scale.setScalar(radius);
    return;
  }

  if (selected.type === "object") {
    const object = objectById(selected.id);
    if (!object) {
      marker.visible = false;
      return;
    }
    marker.position.set(object.x, 0.055, object.z);
    marker.scale.setScalar(selectionRadiusForObject(object));
    return;
  }

  if (selected.type === "terminal") {
    const pos = terminalWorldPosition(selected.objectId, selected.terminalId);
    marker.position.set(pos.x, Math.max(0.08, pos.y + 0.035), pos.z);
    marker.scale.setScalar(0.58);
    return;
  }

  if (selected.type === "wire") {
    const wire = state.wires.find((entry) => entry.id === selected.id);
    if (!wire) {
      marker.visible = false;
      return;
    }
    const start = terminalWorldPosition(wire.from.objectId, wire.from.terminalId);
    const end = terminalWorldPosition(wire.to.objectId, wire.to.terminalId);
    marker.position.copy(start.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.2, 0)));
    marker.scale.setScalar(0.48);
  }
}

function renderInspector() {
  const selected = state.selected;
  if (!selected) {
    el.selectionPanel.innerHTML = `<div class="selection-title">Nothing selected</div><p>Select an object, wire, or terminal in the 3D scene.</p>`;
    return;
  }

  if (selected.type === "multi") {
    const objects = selected.ids.map(objectById).filter(Boolean);
    el.selectionPanel.innerHTML = `
      <div class="selection-title">${objects.length} Objects Selected</div>
      <div class="property-list">
        <div class="property-row"><span>Move</span><strong>Drag any selected object</strong></div>
        <div class="property-row"><span>Contents</span><strong>${objects.map((object) => object.label).join(", ")}</strong></div>
      </div>
      <div class="action-row">
        <button type="button" data-action="delete-selected" data-help="Remove every selected object that can be deleted.">Delete</button>
      </div>
    `;
    return;
  }

  if (selected.type === "wire") {
    const wire = state.wires.find((entry) => entry.id === selected.id);
    el.selectionPanel.innerHTML = `
      <div class="selection-title">Wire</div>
      <div class="property-list">
        <div class="property-row"><span>Color</span><strong>${wire?.color || ""}</strong></div>
        <div class="property-row"><span>From</span><strong>${wire ? terminalName(wire.from.objectId, wire.from.terminalId) : ""}</strong></div>
        <div class="property-row"><span>To</span><strong>${wire ? terminalName(wire.to.objectId, wire.to.terminalId) : ""}</strong></div>
      </div>
      <div class="action-row"><button type="button" data-action="delete-selected">Delete</button></div>
    `;
    return;
  }

  if (selected.type === "terminal") {
    const object = objectById(selected.objectId);
    const terminal = terminalDef(object?.type, selected.terminalId);
    el.selectionPanel.innerHTML = `
      <div class="selection-title">${object?.label || "Terminal"}</div>
      <div class="property-list">
        <div class="property-row"><span>Terminal</span><strong>${terminal?.label || selected.terminalId}</strong></div>
        <div class="property-row"><span>Role</span><strong>${terminal?.role || ""}</strong></div>
        <div class="property-row"><span>Color</span><strong>${terminal?.color || ""}</strong></div>
      </div>
      <p>${state.pendingTerminal ? "Choose a second terminal to complete the wire." : "Drag from this terminal to connect a wire."}</p>
    `;
    return;
  }

  const object = objectById(selected.id);
  if (!object) return;
  const actions = [];
  if (canRotateObject(object)) actions.push(`<button type="button" data-action="rotate-selected" data-help="Rotate the selected object 90 degrees.">Rotate</button>`);
  if (canDeleteObject(object)) actions.push(`<button type="button" data-action="delete-selected" data-help="Remove the selected object and its wires.">Delete</button>`);
  if (object.type === "switch" || object.type === "threeWaySwitch" || object.type === "fourWaySwitch") {
    actions.unshift(`<button type="button" data-action="toggle-selected" data-help="Flip this switch. You can also click the 3D toggle directly.">Toggle</button>`);
  }
  if (object.type === "gfciOutlet") {
    actions.unshift(`<button type="button" data-action="gfci-test" data-help="Trip this GFCI outlet's protected LOAD output.">Test</button>`);
    actions.unshift(`<button type="button" data-action="gfci-reset" data-help="Restore this GFCI outlet's protected LOAD output.">Reset</button>`);
  }
  const statusRows = objectStatusRows(object).map(([key, value]) => `
    <div class="property-row"><span>${key}</span><strong>${value}</strong></div>
  `).join("");
  el.selectionPanel.innerHTML = `
    <div class="selection-title">${object.label}</div>
    <div class="property-list">
      <div class="property-row"><span>ID</span><strong>${object.id}</strong></div>
      ${statusRows}
    </div>
    <div class="action-row">${actions.join("")}</div>
  `;
}

function objectStatusRows(object) {
  if (object.type === "switch") return [["State", object.on ? "Closed" : "Open"]];
  if (object.type === "threeWaySwitch") return [["Throw", object.position === "A" ? "Common to left traveler" : "Common to right traveler"]];
  if (object.type === "fourWaySwitch") return [["Throw", object.crossed ? "Crossed travelers" : "Straight travelers"]];
  if (object.type === "gfciOutlet") return [["Reset", object.gfciReset ? "Yes" : "Tripped"]];
  if (object.type === "plugInBulb") {
    const outlet = objectById(object.pluggedInto?.outletId);
    return [
      ["Lamp", object.lit ? "Lit" : "Off"],
      ["Plugged", outlet ? `${outlet.label} ${object.pluggedInto.receptacle}` : "No"]
    ];
  }
  if (object.type === "lightBulb") return [["Lamp", object.lit ? "Lit" : "Off"]];
  return [["Terminals", String(DEVICE_DEFS[object.type]?.terminals.length || 0)]];
}

function analyzeAndRender() {
  const analysis = analyzeCircuit();
  applyAnalysis(analysis);
  renderDiagnostics(analysis);
  renderStatus(analysis);
  renderInspector();
  updateSelectionHighlights();
  return analysis;
}

function runAnalysis() {
  const analysis = analyzeAndRender();
  const focusEntry = analysis.diagnostics.find((entry) => entry.level === "trip" && entry.objectIds?.length) ||
    analysis.diagnostics.find((entry) => entry.objectIds?.length);
  focusDiagnostic(focusEntry || null);
  const trips = analysis.diagnostics.filter((entry) => entry.level === "trip").length;
  const warnings = analysis.diagnostics.filter((entry) => entry.level === "warn").length;
  const litLamps = state.objects.filter((object) =>
    (object.type === "lightBulb" || object.type === "plugInBulb") && object.lit
  ).length;
  const summary = trips
    ? `Analysis found ${trips} trip condition${trips === 1 ? "" : "s"}.`
    : warnings
      ? `Analysis complete: ${warnings} warning${warnings === 1 ? "" : "s"}, ${litLamps} lamp${litLamps === 1 ? "" : "s"} lit.`
      : `Analysis complete: circuit is clear, ${litLamps} lamp${litLamps === 1 ? "" : "s"} lit.`;
  setHint(focusEntry?.detail ? `${summary} ${focusEntry.detail}` : summary);
  addLog(summary);
}

function plugInBulbPower(object, terminalPower) {
  const outlet = objectById(object.pluggedInto?.outletId);
  if (!outlet) return { hot: false, neutral: false };
  if (outlet.type === "standardOutlet" || outlet.type === "halfHotOutlet") {
    const prefix = object.pluggedInto.receptacle === "top" ? "top" : "bottom";
    return {
      hot: terminalPower.get(terminalRef(outlet.id, `${prefix}Hot`))?.hot,
      neutral: terminalPower.get(terminalRef(outlet.id, `${prefix}Neutral`))?.neutral
    };
  }
  if (outlet.type === "gfciOutlet") {
    return {
      hot: Boolean(outlet.gfciReset && terminalPower.get(terminalRef(outlet.id, "lineHot"))?.hot),
      neutral: Boolean(outlet.gfciReset && terminalPower.get(terminalRef(outlet.id, "lineNeutral"))?.neutral)
    };
  }
  return { hot: false, neutral: false };
}

function analyzeCircuit() {
  const uf = new UnionFind();
  const refs = [];
  state.objects.forEach((object) => {
    DEVICE_DEFS[object.type].terminals.forEach((terminal) => {
      const ref = terminalRef(object.id, terminal.id);
      refs.push(ref);
      uf.find(ref);
    });
  });

  state.wires.forEach((wire) => {
    uf.union(terminalRef(wire.from.objectId, wire.from.terminalId), terminalRef(wire.to.objectId, wire.to.terminalId));
  });

  state.objects.forEach((object) => {
    const ref = (terminalId) => terminalRef(object.id, terminalId);
    if (object.type === "standardOutlet") {
      uf.union(ref("topHot"), ref("bottomHot"));
      uf.union(ref("topNeutral"), ref("bottomNeutral"));
    }
    if (object.type === "halfHotOutlet") {
      uf.union(ref("topNeutral"), ref("bottomNeutral"));
    }
    if (object.type === "gfciOutlet" && object.gfciReset) {
      uf.union(ref("lineHot"), ref("loadHot"));
      uf.union(ref("lineNeutral"), ref("loadNeutral"));
    }
    if (object.type === "switch" && object.on) {
      uf.union(ref("line"), ref("load"));
    }
    if (object.type === "threeWaySwitch") {
      uf.union(ref("common"), object.position === "A" ? ref("travelerLeft") : ref("travelerRight"));
    }
    if (object.type === "fourWaySwitch") {
      if (object.crossed) {
        uf.union(ref("upperLeft"), ref("lowerRight"));
        uf.union(ref("upperRight"), ref("lowerLeft"));
      } else {
        uf.union(ref("upperLeft"), ref("lowerLeft"));
        uf.union(ref("upperRight"), ref("lowerRight"));
      }
    }
    if (object.type === "wireNut") {
      const attached = state.wires
        .filter((wire) => wire.from.objectId === object.id || wire.to.objectId === object.id)
        .map((wire) => wire.from.objectId === object.id ? terminalRef(wire.to.objectId, wire.to.terminalId) : terminalRef(wire.from.objectId, wire.from.terminalId));
      attached.forEach((other) => uf.union(ref("splice"), other));
    }
    if (object.type === "romex2" || object.type === "romex3") {
      ["black", "white", "ground"].forEach((conductor) => {
        uf.union(ref(`${conductor}In`), ref(`${conductor}Out`));
      });
      if (object.type === "romex3") uf.union(ref("redIn"), ref("redOut"));
    }
  });

  const source = state.objects.find((object) => object.type === "source");
  const hotRoot = source ? uf.find(terminalRef(source.id, "hot")) : null;
  const neutralRoot = source ? uf.find(terminalRef(source.id, "neutral")) : null;
  const groundRoot = source ? uf.find(terminalRef(source.id, "ground")) : null;
  const hasHotNeutralShort = Boolean(hotRoot && neutralRoot && hotRoot === neutralRoot);
  const hasHotGroundFault = Boolean(hotRoot && groundRoot && hotRoot === groundRoot);
  if (hasHotNeutralShort) state.breakerTripped = true;
  if (hasHotGroundFault) state.gfciProtectedTrip = true;
  const powerAvailable = state.breakerOn && !state.breakerTripped && !state.gfciProtectedTrip;

  const terminalPower = new Map();
  refs.forEach((ref) => {
    const root = uf.find(ref);
    terminalPower.set(ref, {
      hot: powerAvailable && root === hotRoot,
      neutral: root === neutralRoot,
      ground: root === groundRoot,
      root
    });
  });

  const rootRefs = refs.reduce((map, ref) => {
    const root = uf.find(ref);
    if (!map.has(root)) map.set(root, []);
    map.get(root).push(ref);
    return map;
  }, new Map());
  const diagnostics = [];
  if (hasHotNeutralShort) {
    diagnostics.push(createFaultDiagnostic({
      level: "trip",
      root: hotRoot,
      rootRefs,
      primaryRole: "hot",
      secondaryRole: "neutral",
      text: "Hot-neutral fault. The breaker is tripped.",
      explanation: "Hot and neutral are tied together in the highlighted node."
    }));
  }
  if (hasHotGroundFault) {
    diagnostics.push(createFaultDiagnostic({
      level: "trip",
      root: hotRoot,
      rootRefs,
      primaryRole: "hot",
      secondaryRole: "ground",
      text: "Hot-ground fault. The protected GFCI source is tripped.",
      explanation: "Hot and ground are tied together in the highlighted node."
    }));
  }
  if (!state.breakerTripped && !hasHotNeutralShort && !hasHotGroundFault) {
    diagnostics.push({ level: "ok", text: "No direct hot-neutral or hot-ground fault detected." });
  }
  if (!powerAvailable) {
    diagnostics.push({ level: "warn", text: "Power is unavailable until the breaker and protection are reset." });
  }

  state.objects.forEach((object) => {
    object.lit = false;
    if (object.type === "lightBulb") {
      const hotRef = terminalRef(object.id, "hot");
      const neutralRef = terminalRef(object.id, "neutral");
      const hot = terminalPower.get(hotRef)?.hot;
      const neutral = terminalPower.get(neutralRef)?.neutral;
      object.lit = Boolean(hot && neutral);
      diagnostics.push({
        level: object.lit ? "ok" : "warn",
        text: `${object.label} is ${object.lit ? "lit" : "off"}.`,
        detail: object.lit
          ? "Lamp hot and neutral are both complete."
          : `Hot terminal: ${hot ? "powered" : "not powered"}. Neutral terminal: ${neutral ? "complete" : "not connected to neutral"}. Check the highlighted lamp terminals and their wires.`,
        objectIds: [object.id],
        refs: [hotRef, neutralRef],
        wireIds: wireIdsTouchingRefs([hotRef, neutralRef])
      });
    }
    if (object.type === "plugInBulb") {
      const plugPower = plugInBulbPower(object, terminalPower);
      object.lit = Boolean(plugPower.hot && plugPower.neutral);
      const outlet = objectById(object.pluggedInto?.outletId);
      diagnostics.push({
        level: object.lit ? "ok" : "warn",
        text: `${object.label} is ${object.lit ? "lit" : "off"}${object.pluggedInto ? "" : " because it is not plugged in"}.`,
        detail: object.pluggedInto
          ? `Plugged into ${outlet?.label || "an outlet"} ${object.pluggedInto.receptacle}; receptacle hot is ${plugPower.hot ? "present" : "missing"} and neutral is ${plugPower.neutral ? "present" : "missing"}.`
          : "Drag the plug-in bulb into a receptacle before analyzing outlet power.",
        objectIds: outlet ? [object.id, outlet.id] : [object.id],
        refs: outlet ? outletRefsForReceptacle(outlet, object.pluggedInto.receptacle) : [],
        wireIds: outlet ? wireIdsTouchingRefs(outletRefsForReceptacle(outlet, object.pluggedInto.receptacle)) : []
      });
    }
    if (object.type === "standardOutlet" || object.type === "halfHotOutlet") {
      const topHot = terminalPower.get(terminalRef(object.id, "topHot"))?.hot;
      const topNeutral = terminalPower.get(terminalRef(object.id, "topNeutral"))?.neutral;
      const bottomHot = terminalPower.get(terminalRef(object.id, "bottomHot"))?.hot;
      const bottomNeutral = terminalPower.get(terminalRef(object.id, "bottomNeutral"))?.neutral;
      if (topHot && topNeutral) diagnostics.push({ level: "ok", text: `${object.label} top receptacle is energized.` });
      if (bottomHot && bottomNeutral) diagnostics.push({ level: "ok", text: `${object.label} bottom receptacle is energized.` });
    }
    if (object.type === "gfciOutlet") {
      const lineHot = terminalPower.get(terminalRef(object.id, "lineHot"))?.hot;
      const lineNeutral = terminalPower.get(terminalRef(object.id, "lineNeutral"))?.neutral;
      if (lineHot && lineNeutral && object.gfciReset) diagnostics.push({ level: "ok", text: "GFCI LINE/IN is powered and reset, so LOAD/OUT can pass power." });
      if (!object.gfciReset) diagnostics.push({ level: "warn", text: "GFCI is tripped. Press Reset before LOAD/OUT passes power." });
    }
  });

  return { uf, terminalPower, diagnostics, powerAvailable, hasHotNeutralShort, hasHotGroundFault };
}

function createFaultDiagnostic({ level, root, rootRefs, primaryRole, secondaryRole, text, explanation }) {
  const refsInRoot = rootRefs.get(root) || [];
  const primaryRefs = refsInRoot.filter((ref) => terminalRoleForRef(ref) === primaryRole);
  const secondaryRefs = refsInRoot.filter((ref) => terminalRoleForRef(ref) === secondaryRole);
  const wireIds = state.wires
    .filter((wire) => refsInRoot.includes(terminalRef(wire.from.objectId, wire.from.terminalId)) &&
      refsInRoot.includes(terminalRef(wire.to.objectId, wire.to.terminalId)))
    .map((wire) => wire.id);
  const objectIds = [...new Set([
    ...refsInRoot.map((ref) => ref.split(":")[0]),
    ...wireIds.flatMap((id) => {
      const wire = state.wires.find((entry) => entry.id === id);
      return wire ? [wire.from.objectId, wire.to.objectId] : [];
    })
  ])];
  const spliceObjects = objectIds.map(objectById).filter((object) => object?.type === "wireNut");
  const location = spliceObjects.length
    ? `Check ${spliceObjects.map((object) => object.label).join(", ")} and the wires attached to it.`
    : `Check ${summarizeObjects(objectIds)}.`;
  const detail = [
    `${explanation}`,
    `${roleLabel(primaryRole)}: ${summarizeTerminalRefs(primaryRefs)}.`,
    `${roleLabel(secondaryRole)}: ${summarizeTerminalRefs(secondaryRefs)}.`,
    location
  ].join(" ");
  return {
    level,
    text,
    detail,
    refs: [...new Set([...primaryRefs, ...secondaryRefs])],
    wireIds,
    objectIds
  };
}

function terminalRoleForRef(ref) {
  const [objectId, terminalId] = ref.split(":");
  const object = objectById(objectId);
  return terminalDef(object?.type, terminalId)?.role || "";
}

function roleLabel(role) {
  if (role === "hot") return "Hot side";
  if (role === "neutral") return "Neutral side";
  if (role === "ground") return "Ground side";
  return role;
}

function summarizeTerminalRefs(refs) {
  if (!refs.length) return "none found";
  const names = refs.slice(0, 4).map((ref) => {
    const [objectId, terminalId] = ref.split(":");
    return terminalName(objectId, terminalId);
  });
  return refs.length > names.length ? `${names.join(", ")} and ${refs.length - names.length} more` : names.join(", ");
}

function summarizeObjects(objectIds) {
  const labels = [...new Set(objectIds.map(objectById).filter(Boolean).map((object) => object.label))];
  if (!labels.length) return "the highlighted wiring";
  return labels.length > 4 ? `${labels.slice(0, 4).join(", ")} and ${labels.length - 4} more` : labels.join(", ");
}

function wireIdsTouchingRefs(refs) {
  const refSet = new Set(refs);
  return state.wires
    .filter((wire) => refSet.has(terminalRef(wire.from.objectId, wire.from.terminalId)) ||
      refSet.has(terminalRef(wire.to.objectId, wire.to.terminalId)))
    .map((wire) => wire.id);
}

function outletRefsForReceptacle(outlet, receptacle) {
  if (!outlet) return [];
  if (outlet.type === "standardOutlet" || outlet.type === "halfHotOutlet") {
    const prefix = receptacle === "top" ? "top" : "bottom";
    return [terminalRef(outlet.id, `${prefix}Hot`), terminalRef(outlet.id, `${prefix}Neutral`)];
  }
  if (outlet.type === "gfciOutlet") {
    return [terminalRef(outlet.id, "lineHot"), terminalRef(outlet.id, "lineNeutral")];
  }
  return [];
}

function applyAnalysis(analysis) {
  runtime.terminalMeshes.forEach((mesh, ref) => {
    const object = objectById(ref.split(":")[0]);
    const power = analysis.terminalPower.get(ref);
    const material = mesh.material;
    material.emissive = material.emissive || new THREE.Color(0x000000);
    if (object?.type === "source") {
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    } else if (power?.hot) {
      material.emissive.setHex(0xff6b30);
      material.emissiveIntensity = 0.85;
    } else if (power?.neutral) {
      material.emissive.setHex(0x74a4ff);
      material.emissiveIntensity = 0.5;
    } else if (power?.ground) {
      material.emissive.setHex(0x20d070);
      material.emissiveIntensity = 0.45;
    } else {
      material.emissive.setHex(0x000000);
      material.emissiveIntensity = 0;
    }
  });

  state.objects.forEach((object) => {
    if (object.type === "lightBulb" || object.type === "plugInBulb") updateLampholderGlow(object);
    if (object.type === "switch" || object.type === "threeWaySwitch" || object.type === "fourWaySwitch") updateSwitchThrow(object);
  });
}

function updateLampholderGlow(object) {
  const bulb = object.group.getObjectByName("bulb-glass");
  if (!bulb) return;
  bulb.material = object.lit ? runtime.materials.glow : runtime.materials.glass;
}

function updateSwitchThrow(object) {
  const toggle = object.group.getObjectByName("switch-toggle");
  if (!toggle) return;
  const active = object.type === "switch" ? object.on : object.type === "threeWaySwitch" ? object.position === "B" : object.crossed;
  toggle.position.z = active ? -0.09 : 0.09;
  toggle.rotation.x = active ? -0.22 : 0.22;
}

function renderDiagnostics(analysis) {
  const unique = [];
  const seen = new Set();
  analysis.diagnostics.forEach((entry) => {
    const key = `${entry.text}|${entry.detail || ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(entry);
  });
  state.renderedDiagnostics = unique;
  el.diagnostics.innerHTML = unique.map((entry, index) => `
    <button type="button" class="diagnostic-card ${entry.level}" data-diagnostic-index="${index}">
      <span>${entry.text}</span>
      ${entry.detail ? `<small>${entry.detail}</small>` : ""}
    </button>
  `).join("");
}

function focusDiagnostic(entry) {
  if (!entry) {
    state.diagnosticFocus = null;
    updateSelectionHighlights();
    return;
  }
  state.diagnosticFocus = {
    objectIds: entry.objectIds || [],
    wireIds: entry.wireIds || [],
    refs: entry.refs || []
  };
  updateSelectionHighlights();
  if (entry.objectIds?.length) {
    const objects = entry.objectIds.map(objectById).filter(Boolean);
    if (!objects.length) return;
    const center = objects.reduce((acc, object) => {
      acc.x += object.x;
      acc.z += object.z;
      return acc;
    }, { x: 0, z: 0 });
    center.x /= objects.length;
    center.z /= objects.length;
    runtime.cameraTarget.set(center.x, 0, center.z);
    clampCameraTarget();
    updateCamera();
  }
}

function renderStatus(analysis) {
  const breakerClass = state.breakerTripped ? "trip" : "ok";
  const powerClass = analysis.powerAvailable ? "ok" : "warn";
  const gfciClass = state.gfciProtectedTrip ? "trip" : "ok";
  el.supplyStatus.innerHTML = `
    <span class="status-pill ${breakerClass}">Breaker: ${state.breakerTripped ? "Tripped" : "Ready"}</span>
    <span class="status-pill ${gfciClass}">Source GFCI: ${state.gfciProtectedTrip ? "Tripped" : "Reset"}</span>
    <span class="status-pill ${powerClass}">Power: ${analysis.powerAvailable ? "Available" : "Unavailable"}</span>
  `;
}

function addLog(message) {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  state.log.unshift({ time, message });
  state.log = state.log.slice(0, 18);
  el.eventLog.innerHTML = state.log.map((entry) => `<div class="log-line"><strong>${entry.time}</strong> ${entry.message}</div>`).join("");
}

function captureSceneSnapshot() {
  return {
    version: 1,
    bench: { ...state.bench },
    breakerOn: state.breakerOn,
    breakerTripped: state.breakerTripped,
    gfciProtectedTrip: state.gfciProtectedTrip,
    nextObject: state.nextObject,
    nextWire: state.nextWire,
    wireColor: state.wireColor.id,
    objects: state.objects.map((object) => ({
      id: object.id,
      type: object.type,
      x: object.x,
      z: object.z,
      rotation: object.rotation,
      fixed: object.fixed,
      on: object.on,
      position: object.position,
      crossed: object.crossed,
      gfciReset: object.gfciReset,
      pluggedInto: object.pluggedInto
    })),
    wires: state.wires.map((wire) => ({
      id: wire.id,
      from: wire.from,
      to: wire.to,
      color: wire.color,
      role: wire.role
    }))
  };
}

function pushUndoState() {
  pushUndoSnapshot(captureSceneSnapshot());
}

function pushUndoSnapshot(snapshot) {
  if (state.history.restoring || !snapshot) return;
  state.history.undo.push(JSON.stringify(snapshot));
  if (state.history.undo.length > HISTORY_LIMIT) state.history.undo.shift();
  state.history.redo = [];
  state.diagnosticFocus = null;
  updateUndoRedoUI();
}

function undoState() {
  if (!state.history.undo.length) {
    setHint("Nothing to undo.");
    return;
  }
  const current = captureSceneSnapshot();
  const previous = JSON.parse(state.history.undo.pop());
  state.history.redo.push(JSON.stringify(current));
  restoreSceneSnapshot(previous);
  addLog("Undo applied.");
  setHint("Undid the last board change.");
}

function redoState() {
  if (!state.history.redo.length) {
    setHint("Nothing to redo.");
    return;
  }
  const current = captureSceneSnapshot();
  const next = JSON.parse(state.history.redo.pop());
  state.history.undo.push(JSON.stringify(current));
  restoreSceneSnapshot(next);
  addLog("Redo applied.");
  setHint("Redid the last board change.");
}

function restoreSceneSnapshot(snapshot) {
  state.history.restoring = true;
  clearSceneGraph();
  state.bench = {
    width: clamp(Number(snapshot.bench?.width) || DEFAULT_BENCH.width, BENCH_LIMITS.minWidth, BENCH_LIMITS.maxWidth),
    depth: clamp(Number(snapshot.bench?.depth) || DEFAULT_BENCH.depth, BENCH_LIMITS.minDepth, BENCH_LIMITS.maxDepth)
  };
  createBenchSurface();
  state.breakerOn = snapshot.breakerOn ?? true;
  state.breakerTripped = Boolean(snapshot.breakerTripped);
  state.gfciProtectedTrip = Boolean(snapshot.gfciProtectedTrip);
  state.wireColor = WIRE_COLORS.find((wire) => wire.id === snapshot.wireColor) || WIRE_COLORS[0];
  (snapshot.objects || []).forEach((saved) => {
    if (!DEVICE_DEFS[saved.type]) return;
    const rotation = Number(saved.rotation);
    addObject(saved.type, Number(saved.x) || 0, Number(saved.z) || 0, {
      id: saved.id,
      fixed: saved.fixed,
      rotation: Number.isFinite(rotation) ? rotation : defaultRotationForType(saved.type),
      on: saved.on,
      position: saved.position,
      crossed: saved.crossed,
      gfciReset: saved.gfciReset,
      pluggedInto: saved.pluggedInto,
      silent: true
    });
  });
  state.nextObject = snapshot.nextObject || nextIndexFromIds(state.objects.map((object) => object.id));
  state.nextWire = snapshot.nextWire || nextIndexFromIds((snapshot.wires || []).map((wire) => wire.id));
  (snapshot.wires || []).forEach((saved) => {
    if (!objectById(saved.from?.objectId) || !objectById(saved.to?.objectId)) return;
    const color = WIRE_COLORS.find((wire) => wire.id === saved.color) || WIRE_COLORS[0];
    const wire = {
      id: saved.id || `wire_${state.nextWire++}`,
      from: { objectId: saved.from.objectId, terminalId: saved.from.terminalId },
      to: { objectId: saved.to.objectId, terminalId: saved.to.terminalId },
      color: color.id,
      role: saved.role || color.role,
      mesh: null,
      labelSprite: null
    };
    state.wires.push(wire);
    buildWireMesh(wire);
  });
  updatePlugAttachments();
  state.history.restoring = false;
  renderPalette();
  renderModeUI();
  analyzeAndRender();
  updateUndoRedoUI();
}

function updateUndoRedoUI() {
  document.querySelectorAll('[data-action="undo"]').forEach((button) => {
    button.disabled = state.history.undo.length === 0;
  });
  document.querySelectorAll('[data-action="redo"]').forEach((button) => {
    button.disabled = state.history.redo.length === 0;
  });
}

function saveState() {
  const snapshot = captureSceneSnapshot();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    setHint(`Saved board state with ${snapshot.objects.length} object${snapshot.objects.length === 1 ? "" : "s"} and ${snapshot.wires.length} wire${snapshot.wires.length === 1 ? "" : "s"}.`);
    addLog("Saved current board state.");
  } catch (error) {
    setHint("Could not save state in this browser.");
    addLog(`Save failed: ${error.message}`);
  }
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    setHint("No saved board state found in this browser.");
    addLog("Load skipped: no saved state.");
    return;
  }

  try {
    const snapshot = JSON.parse(raw);
    pushUndoState();
    clearSceneGraph();
    state.bench = {
      width: clamp(Number(snapshot.bench?.width) || DEFAULT_BENCH.width, BENCH_LIMITS.minWidth, BENCH_LIMITS.maxWidth),
      depth: clamp(Number(snapshot.bench?.depth) || DEFAULT_BENCH.depth, BENCH_LIMITS.minDepth, BENCH_LIMITS.maxDepth)
    };
    createBenchSurface();

    state.breakerOn = snapshot.breakerOn ?? true;
    state.breakerTripped = Boolean(snapshot.breakerTripped);
    state.gfciProtectedTrip = Boolean(snapshot.gfciProtectedTrip);
    state.wireColor = WIRE_COLORS.find((wire) => wire.id === snapshot.wireColor) || WIRE_COLORS[0];

    snapshot.objects?.forEach((saved) => {
      if (!DEVICE_DEFS[saved.type]) return;
      const rotation = Number(saved.rotation);
      addObject(saved.type, Number(saved.x) || 0, Number(saved.z) || 0, {
        id: saved.id,
        fixed: saved.fixed,
        rotation: Number.isFinite(rotation) ? rotation : defaultRotationForType(saved.type),
        on: saved.on,
        position: saved.position,
        crossed: saved.crossed,
        gfciReset: saved.gfciReset,
        pluggedInto: saved.pluggedInto,
        silent: true
      });
    });

    state.nextObject = snapshot.nextObject || nextIndexFromIds(state.objects.map((object) => object.id));
    state.nextWire = snapshot.nextWire || nextIndexFromIds((snapshot.wires || []).map((wire) => wire.id));
    (snapshot.wires || []).forEach((saved) => {
      if (!objectById(saved.from?.objectId) || !objectById(saved.to?.objectId)) return;
      const color = WIRE_COLORS.find((wire) => wire.id === saved.color) || WIRE_COLORS[0];
      const wire = {
        id: saved.id || `wire_${state.nextWire++}`,
        from: { objectId: saved.from.objectId, terminalId: saved.from.terminalId },
        to: { objectId: saved.to.objectId, terminalId: saved.to.terminalId },
        color: color.id,
        role: saved.role || color.role,
        mesh: null,
        labelSprite: null
      };
      state.wires.push(wire);
      buildWireMesh(wire);
    });

    updatePlugAttachments();
    renderPalette();
    renderModeUI();
    analyzeAndRender();
    setHint(`Loaded board state with ${state.objects.length} object${state.objects.length === 1 ? "" : "s"}.`);
    addLog("Loaded saved board state.");
  } catch (error) {
    setHint("Saved state could not be loaded.");
    addLog(`Load failed: ${error.message}`);
  }
}

function nextIndexFromIds(ids) {
  const maxId = ids.reduce((max, id) => {
    const match = String(id).match(/_(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return maxId + 1;
}

function clearSceneGraph() {
  [...state.wires].forEach(removeWire);
  [...state.objects].forEach((object) => {
    runtime.scene.remove(object.group);
  });
  state.objects = [];
  state.wires = [];
  state.nextObject = 1;
  state.nextWire = 1;
  state.selected = null;
  state.selectedObjectIds = new Set();
  state.pendingTerminal = null;
  state.diagnosticFocus = null;
  state.renderedDiagnostics = [];
  state.mode = "build";
  state.breakerOn = true;
  state.breakerTripped = false;
  state.gfciProtectedTrip = false;
  runtime.pickables = [];
  runtime.terminalPickables = [];
  runtime.wirePickables = [];
  runtime.terminalMeshes.clear();
}

function resetScene() {
  pushUndoState();
  clearSceneGraph();
  state.bench = { ...DEFAULT_BENCH };
  createBenchSurface();
  seedScene();
  renderPalette();
  renderModeUI();
  setHint("Click equipment to add it. Drag empty space to select multiple objects; Alt/right-drag rotates the camera.");
  analyzeAndRender();
}

function clearWires() {
  if (!state.wires.length) return;
  pushUndoState();
  [...state.wires].forEach(removeWire);
  selectItem(null);
  state.pendingTerminal = null;
  addLog("Cleared all wires.");
  analyzeAndRender();
}

function setMode(mode) {
  state.mode = mode;
  state.pendingTerminal = null;
  renderPalette();
  renderModeUI();
  if (mode === "wiring") {
    setHint("Wiring mode is on. Drag or click from any screw or wire nut to any other terminal.");
    addLog("Wiring mode enabled.");
  } else {
    setHint("Build mode is on. Drag empty space to select multiple objects; drag selected equipment to move it together.");
    addLog("Build mode enabled.");
  }
  updateSelectionHighlights();
}

function renderModeUI() {
  document.body.classList.toggle("wiring-mode", state.mode === "wiring");
  if (el.wiringModeButton) {
    const enabled = state.mode === "wiring";
    el.wiringModeButton.classList.toggle("active", enabled);
    el.wiringModeButton.setAttribute("aria-pressed", String(enabled));
    el.wiringModeButton.textContent = enabled ? "Wiring mode on" : "Wiring mode";
  }
  updateUndoRedoUI();
  renderBenchSize();
}

function renderBenchSize() {
  if (!el.benchSize) return;
  el.benchSize.textContent = `Bench: X ${state.bench.width.toFixed(0)} x Y ${state.bench.depth.toFixed(0)} grid units`;
  if (el.benchWidthInput) el.benchWidthInput.value = String(state.bench.width.toFixed(0));
  if (el.benchDepthInput) el.benchDepthInput.value = String(state.bench.depth.toFixed(0));
  renderBenchPanControls();
}

function resizeBench(direction) {
  setBenchSize(state.bench.width + direction, state.bench.depth + direction);
}

function applyCustomBenchSize() {
  const width = Number(el.benchWidthInput?.value);
  const depth = Number(el.benchDepthInput?.value);
  setBenchSize(width, depth);
}

function handleBenchPanInput() {
  runtime.cameraTarget.x = Number(el.benchPanXInput?.value || 0);
  runtime.cameraTarget.z = Number(el.benchPanZInput?.value || 0);
  clampCameraTarget();
  updateCamera();
}

function renderBenchPanControls() {
  if (!el.benchPanXInput || !el.benchPanZInput) return;
  const bounds = benchBounds();
  el.benchPanXInput.min = String(bounds.minX.toFixed(2));
  el.benchPanXInput.max = String(bounds.maxX.toFixed(2));
  el.benchPanZInput.min = String(bounds.minZ.toFixed(2));
  el.benchPanZInput.max = String(bounds.maxZ.toFixed(2));
  el.benchPanXInput.value = String(clamp(runtime.cameraTarget.x, bounds.minX, bounds.maxX).toFixed(2));
  el.benchPanZInput.value = String(clamp(runtime.cameraTarget.z, bounds.minZ, bounds.maxZ).toFixed(2));
}

function setBenchSize(width, depth) {
  const nextWidth = clamp(Math.round(Number.isFinite(width) ? width : state.bench.width), BENCH_LIMITS.minWidth, BENCH_LIMITS.maxWidth);
  const nextDepth = clamp(Math.round(Number.isFinite(depth) ? depth : state.bench.depth), BENCH_LIMITS.minDepth, BENCH_LIMITS.maxDepth);
  if (nextWidth === state.bench.width && nextDepth === state.bench.depth) {
    renderBenchSize();
    return;
  }
  pushUndoState();
  state.bench.width = nextWidth;
  state.bench.depth = nextDepth;
  createBenchSurface();
  const bounds = benchBounds(0.7);
  state.objects.forEach((object) => {
    object.x = clamp(object.x, bounds.minX, bounds.maxX);
    object.z = clamp(object.z, bounds.minZ, bounds.maxZ);
    object.group.position.set(object.x, 0, object.z);
  });
  updatePlugAttachments();
  updateWires();
  updateSelectionHighlights();
  clampCameraTarget();
  runtime.cameraRadius = clamp(runtime.cameraRadius, 4.8, maxCameraRadius());
  updateCamera();
  setHint(`Bench set to X ${state.bench.width.toFixed(0)} x Y ${state.bench.depth.toFixed(0)}. Scroll the scene to move around it.`);
  addLog(`Bench resized to X ${state.bench.width.toFixed(0)} x Y ${state.bench.depth.toFixed(0)}.`);
}

function centerCameraOnBench() {
  runtime.cameraTheta = Math.PI * 0.25;
  runtime.cameraPhi = Math.PI * 0.32;
  runtime.cameraRadius = clamp(runtime.cameraRadius, 8.5, Math.min(16, maxCameraRadius()));
  const center = benchCenter();
  runtime.cameraTarget.set(center.x, 0, center.z);
  updateCamera();
}

function maxCameraRadius() {
  return Math.max(15.5, Math.max(state.bench.width, state.bench.depth) * 1.8);
}

function panCameraByScroll(deltaX, deltaY) {
  const scale = clamp(runtime.cameraRadius * 0.001, 0.006, 0.045);
  const right = new THREE.Vector3().setFromMatrixColumn(runtime.camera.matrix, 0);
  right.y = 0;
  right.normalize();
  const forward = new THREE.Vector3();
  runtime.camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  runtime.cameraTarget
    .addScaledVector(right, deltaX * scale)
    .addScaledVector(forward, deltaY * scale);
  clampCameraTarget();
  updateCamera();
}

function clampCameraTarget() {
  const edgePadding = 0.5;
  const bounds = benchBounds();
  runtime.cameraTarget.x = clamp(runtime.cameraTarget.x, bounds.minX - edgePadding, bounds.maxX + edgePadding);
  runtime.cameraTarget.z = clamp(runtime.cameraTarget.z, bounds.minZ - edgePadding, bounds.maxZ + edgePadding);
}

function removeWire(wire) {
  if (!wire) return;
  if (wire.mesh) {
    runtime.scene.remove(wire.mesh);
    runtime.wirePickables = runtime.wirePickables.filter((mesh) => mesh !== wire.mesh);
    wire.mesh.geometry.dispose();
  }
  if (wire.labelSprite) {
    runtime.scene.remove(wire.labelSprite);
    wire.labelSprite.material.map?.dispose();
    wire.labelSprite.material.dispose();
  }
  state.wires = state.wires.filter((entry) => entry.id !== wire.id);
}

function deleteObject(object, shouldLog = true) {
  if (!object || !canDeleteObject(object)) return false;
  if (isOutletType(object.type)) {
    state.objects
      .filter((entry) => entry.type === "plugInBulb" && entry.pluggedInto?.outletId === object.id)
      .forEach((entry) => detachPlugInBulb(entry, true));
  }
  state.wires
    .filter((wire) => wire.from.objectId === object.id || wire.to.objectId === object.id)
    .forEach(removeWire);
  runtime.scene.remove(object.group);
  runtime.pickables = runtime.pickables.filter((mesh) => mesh.userData.id !== object.id);
  runtime.terminalPickables = runtime.terminalPickables.filter((mesh) => mesh.userData.objectId !== object.id);
  DEVICE_DEFS[object.type].terminals.forEach((terminal) => runtime.terminalMeshes.delete(terminalRef(object.id, terminal.id)));
  state.objects = state.objects.filter((entry) => entry.id !== object.id);
  if (shouldLog) addLog(`Deleted ${object.label}.`);
  return true;
}

function deleteSelected() {
  const selected = state.selected;
  if (!selected) return;
  if (selected.type === "wire") {
    const wire = state.wires.find((entry) => entry.id === selected.id);
    if (!wire) return;
    pushUndoState();
    removeWire(wire);
    addLog("Deleted selected wire.");
  }
  if (selected.type === "object") {
    const object = objectById(selected.id);
    if (!object || !canDeleteObject(object)) return;
    pushUndoState();
    if (!deleteObject(object)) return;
  }
  if (selected.type === "multi") {
    const deletable = selected.ids.map(objectById).filter((object) => canDeleteObject(object));
    if (!deletable.length) return;
    pushUndoState();
    const deleted = deletable.filter((object) => deleteObject(object, false));
    addLog(`Deleted ${deleted.length} selected object${deleted.length === 1 ? "" : "s"}.`);
  }
  selectItem(null);
  state.pendingTerminal = null;
  analyzeAndRender();
}

function rotateSelected() {
  const object = selectedObject();
  if (!object || !canRotateObject(object)) return;
  pushUndoState();
  if (object.type === "plugInBulb" && object.pluggedInto) detachPlugInBulb(object, true);
  object.rotation += Math.PI / 2;
  object.group.rotation.y = object.rotation;
  if (object.type === "romex2" || object.type === "romex3") refreshRomexLabels(object);
  updateWires();
  updatePlugAttachments();
  addLog(`Rotated ${object.label}.`);
}

function toggleSelected() {
  const object = selectedObject();
  if (!object) return;
  toggleObject(object);
}

function toggleObject(object) {
  if (!isSwitchType(object.type)) return;
  pushUndoState();
  if (object.type === "switch") {
    object.on = !object.on;
    addLog(`${object.label} is now ${object.on ? "closed" : "open"}.`);
  }
  if (object.type === "threeWaySwitch") {
    object.position = object.position === "A" ? "B" : "A";
    addLog(`${object.label} throw moved to ${object.position}.`);
  }
  if (object.type === "fourWaySwitch") {
    object.crossed = !object.crossed;
    addLog(`${object.label} is now ${object.crossed ? "crossed" : "straight"}.`);
  }
  analyzeAndRender();
}

function isSwitchType(type) {
  return type === "switch" || type === "threeWaySwitch" || type === "fourWaySwitch";
}

function isSwitchToggleHit(mesh) {
  let current = mesh;
  while (current) {
    if (current.name === "switch-toggle") return true;
    current = current.parent;
  }
  return false;
}

function testSelectedGfci() {
  const object = selectedObject();
  if (!object || object.type !== "gfciOutlet") return;
  pushUndoState();
  object.gfciReset = false;
  addLog("GFCI TEST pressed.");
  analyzeAndRender();
}

function resetSelectedGfci() {
  const object = selectedObject();
  if (!object || object.type !== "gfciOutlet") return;
  pushUndoState();
  object.gfciReset = true;
  state.gfciProtectedTrip = false;
  addLog("GFCI RESET pressed.");
  analyzeAndRender();
}

function objectById(id) {
  return state.objects.find((object) => object.id === id);
}

function selectedObject() {
  return state.selected?.type === "object" ? objectById(state.selected.id) : null;
}

function canDeleteObject(object) {
  return Boolean(object && !object.fixed && object.type !== "source");
}

function canRotateObject(object) {
  return Boolean(object && !object.fixed);
}

function setHint(message) {
  el.modeHint.textContent = message;
}

function resize() {
  const rect = el.sceneMount.getBoundingClientRect();
  runtime.camera.aspect = rect.width / rect.height;
  runtime.camera.updateProjectionMatrix();
  runtime.renderer.setSize(rect.width, rect.height, false);
}

function updateCamera() {
  syncSceneScale();
  const radius = runtime.cameraRadius;
  const x = runtime.cameraTarget.x + Math.sin(runtime.cameraTheta) * Math.cos(runtime.cameraPhi) * radius;
  const y = runtime.cameraTarget.y + Math.sin(runtime.cameraPhi) * radius + 1.1;
  const z = runtime.cameraTarget.z + Math.cos(runtime.cameraTheta) * Math.cos(runtime.cameraPhi) * radius;
  runtime.camera.position.set(x, y, z);
  runtime.camera.lookAt(runtime.cameraTarget);
  renderBenchPanControls();
}

function syncSceneScale() {
  const maxDimension = Math.max(state.bench.width, state.bench.depth);
  runtime.camera.far = Math.max(80, maxDimension * 5);
  runtime.camera.updateProjectionMatrix();
  if (runtime.scene?.fog) {
    runtime.scene.fog.near = Math.max(12, maxDimension * 2);
    runtime.scene.fog.far = Math.max(22, maxDimension * 4.5);
  }
}

function animate() {
  runtime.animationFrame = requestAnimationFrame(animate);
  runtime.renderer.render(runtime.scene, runtime.camera);
}

function usesScaledDeviceModel(type) {
  return BOX_DEVICE_TYPES.has(type);
}

function modelScaleForType(type) {
  return usesScaledDeviceModel(type) ? DEVICE_MODEL_SCALE : 1;
}

function scaledTerminalPosition(type, position) {
  const scale = modelScaleForType(type);
  return position.map((value) => value * scale);
}

function selectionRadiusForObject(object) {
  if (object.type === "box") return 1.72;
  if (object.type === "source") return 1.1;
  if (object.type === "lightBulb") return 1.05;
  if (object.type === "plugInBulb") return 0.8;
  if (object.type === "wireNut") return 0.72;
  if (object.type === "romex2" || object.type === "romex3") return 0.92;
  if (usesScaledDeviceModel(object.type)) return 0.95;
  return 0.8;
}

function wireColorValue(color) {
  const wire = WIRE_COLORS.find((entry) => entry.id === color);
  return wire ? wire.value : "#111318";
}

function wireLaneOffset(wire) {
  const colorOffset = {
    black: -0.2,
    red: -0.1,
    white: 0.1,
    green: 0.2
  }[wire.color] || 0;
  const idOffset = (Number(wire.id.split("_")[1]) % 3 - 1) * 0.045;
  return colorOffset + idOffset;
}

function wireLabelText(wire) {
  if (wire.color === "black") return "HOT";
  if (wire.color === "red") return "SWITCHED";
  if (wire.color === "white") return "NEUTRAL";
  if (wire.color === "green") return "GROUND";
  return wire.color.toUpperCase();
}

function normalizeRotation(rotation) {
  const fullTurn = Math.PI * 2;
  return ((rotation % fullTurn) + fullTurn) % fullTurn;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

class UnionFind {
  constructor() {
    this.parent = new Map();
  }

  find(value) {
    if (!this.parent.has(value)) {
      this.parent.set(value, value);
      return value;
    }
    const parent = this.parent.get(value);
    if (parent === value) return value;
    const root = this.find(parent);
    this.parent.set(value, root);
    return root;
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent.set(rootB, rootA);
  }
}
