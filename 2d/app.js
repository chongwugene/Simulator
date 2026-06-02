(function () {
  "use strict";

  const DEFAULT_BENCH = { width: 1000, height: 620, zoom: 1 };
  const BENCH_LIMITS = {
    minWidth: 520,
    maxWidth: 4000,
    minHeight: 360,
    maxHeight: 3000,
    minZoom: 0.35,
    maxZoom: 2
  };
  const BENCH_RESIZE_STEP = { width: 240, height: 160 };
  const BENCH_ZOOM_STEP = 0.1;
  const GRID = { width: DEFAULT_BENCH.width, height: DEFAULT_BENCH.height };
  const BOX_SIZE = { width: 236, height: 210 };
  const SOURCE_SIZE = { width: 126, height: 86 };
  const WIRE_NUT_SIZE = { width: 36, height: 36 };
  const CONDUIT_ENDPOINT_SIZE = { width: 22, height: 22 };
  const SAVE_KEY = "residentialWiringSimulator.savedState.v1";
  const STATE_FILE_KIND = "residential-wiring-simulator-workbench";
  const STATE_FILE_VERSION = 1;
  const STATE_FILE_MIME = "application/json";
  const SOURCE_CONDUIT_CONTEXT = "source";
  const DEFAULT_GRID_COLOR = "#f8fafc";
  const INITIAL_SOURCE = { id: "source_1", x: 128, y: 312 };
  const INITIAL_UPSTREAM = {
    breakerOn: true,
    breakerTripped: false,
    gfciTripped: false,
    pluggedIn: true,
    lastTrip: null
  };
  const DEVICE_SIZE = {
    narrow: { width: 82, height: 154 },
    light: { width: 150, height: 150 },
    socketLight: { width: 34, height: 34 }
  };
  const SOURCE_NODE = { hot: "source:hot", neutral: "source:neutral", ground: "source:ground" };
  const ROTATABLE_DEVICE_TYPES = new Set([
    "standardOutlet",
    "halfHotOutlet",
    "gfciOutlet",
    "switch",
    "threeWaySwitch",
    "fourWaySwitch"
  ]);
  const BOX_HOLES = [
    { key: "topLeft", label: "Top left side knockout", x: -70, y: -108, edge: "top" },
    { key: "top", label: "Top center side knockout", x: 0, y: -108, edge: "top" },
    { key: "topRight", label: "Top right side knockout", x: 70, y: -108, edge: "top" },
    { key: "left", label: "Left upper side knockout", x: -120, y: -70, edge: "left" },
    { key: "leftCenter", label: "Left center side knockout", x: -120, y: 0, edge: "left" },
    { key: "center", label: "Left lower side knockout", x: -120, y: 70, edge: "left" },
    { key: "right", label: "Right upper side knockout", x: 120, y: -70, edge: "right" },
    { key: "rightCenter", label: "Right center side knockout", x: 120, y: 0, edge: "right" },
    { key: "bottomLeft", label: "Right lower side knockout", x: 120, y: 70, edge: "right" },
    { key: "bottom", label: "Bottom left side knockout", x: -70, y: 108, edge: "bottom" },
    { key: "bottomCenter", label: "Bottom center side knockout", x: 0, y: 108, edge: "bottom" },
    { key: "bottomRight", label: "Bottom right side knockout", x: 70, y: 108, edge: "bottom" }
  ];
  const CONDUIT_DEFS = {
    conduitHalf: { label: "1/2 in EMT conduit", tradeSize: "1/2 in", diameter: 18 },
    conduitThreeQuarter: { label: "3/4 in EMT conduit", tradeSize: "3/4 in", diameter: 24 },
    conduitOne: { label: "1 in EMT conduit", tradeSize: "1 in", diameter: 30 }
  };

  const TOOL_PALETTE = [
    { id: "powerCable", label: "Power in", shortLabel: "Power", kind: "power", category: "Source" },
    { id: "box", label: "4x4 box", shortLabel: "Box", kind: "box", category: "Boxes" },
    { id: "wireNut", label: "Wire nut", shortLabel: "Nut", kind: "wireNut", category: "Boxes" },
    { id: "wireBlack", label: "Black hot", shortLabel: "Black", kind: "wire", color: "black", role: "hot", category: "Conductors" },
    { id: "wireRed", label: "Red hot", shortLabel: "Red", kind: "wire", color: "red", role: "hot", category: "Conductors" },
    { id: "wireWhite", label: "White neutral", shortLabel: "White", kind: "wire", color: "white", role: "neutral", category: "Conductors" },
    { id: "wireGreen", label: "Green ground", shortLabel: "Green", kind: "wire", color: "green", role: "ground", category: "Conductors" },
    { id: "romex2", label: "2-wire Romex", shortLabel: "2-wire", kind: "romex", cableType: "romex2", category: "Cable" },
    { id: "romex3", label: "3-wire Romex", shortLabel: "3-wire", kind: "romex", cableType: "romex3", category: "Cable" },
    { id: "conduitHalf", label: "1/2 in EMT", shortLabel: "1/2 EMT", kind: "conduit", conduitType: "conduitHalf", category: "Raceway" },
    { id: "conduitThreeQuarter", label: "3/4 in EMT", shortLabel: "3/4 EMT", kind: "conduit", conduitType: "conduitThreeQuarter", category: "Raceway" },
    { id: "conduitOne", label: "1 in EMT", shortLabel: "1 EMT", kind: "conduit", conduitType: "conduitOne", category: "Raceway" }
  ];

  const ROMEX_DEFS = {
    romex2: {
      label: "2-wire Romex",
      conductors: [
        { color: "black", role: "hot" },
        { color: "white", role: "neutral" },
        { color: "green", role: "ground" }
      ]
    },
    romex3: {
      label: "3-wire Romex",
      conductors: [
        { color: "black", role: "hot" },
        { color: "red", role: "hot" },
        { color: "white", role: "neutral" },
        { color: "green", role: "ground" }
      ]
    }
  };

  const DEVICE_DEFS = {
    standardOutlet: {
      label: "Regular outlet",
      face: "outlet",
      terminals: [
        { key: "topHot", label: "Top hot", role: "hot", screw: "brass", x: 68, y: 48 },
        { key: "bottomHot", label: "Bottom hot", role: "hot", screw: "brass", x: 68, y: 104 },
        { key: "topNeutral", label: "Top neutral", role: "neutral", screw: "silver", x: 14, y: 48 },
        { key: "bottomNeutral", label: "Bottom neutral", role: "neutral", screw: "silver", x: 14, y: 104 },
        { key: "ground", label: "Ground", role: "ground", screw: "green", x: 14, y: 124 }
      ]
    },
    halfHotOutlet: {
      label: "Half-hot outlet",
      face: "outlet",
      terminals: [
        { key: "topHot", label: "Top hot", role: "hot", screw: "brass", x: 68, y: 48 },
        { key: "bottomHot", label: "Bottom hot", role: "hot", screw: "brass", x: 68, y: 104 },
        { key: "topNeutral", label: "Top neutral", role: "neutral", screw: "silver", x: 14, y: 48 },
        { key: "bottomNeutral", label: "Bottom neutral", role: "neutral", screw: "silver", x: 14, y: 104 },
        { key: "ground", label: "Ground", role: "ground", screw: "green", x: 14, y: 124 }
      ]
    },
    gfciOutlet: {
      label: "GFCI outlet",
      face: "gfci",
      terminals: [
        { key: "lineHot", label: "LINE hot", role: "hot", screw: "brass", x: 68, y: 48 },
        { key: "loadHot", label: "LOAD hot", role: "hot", screw: "brass", x: 68, y: 104 },
        { key: "lineNeutral", label: "LINE neutral", role: "neutral", screw: "silver", x: 14, y: 48 },
        { key: "loadNeutral", label: "LOAD neutral", role: "neutral", screw: "silver", x: 14, y: 104 },
        { key: "ground", label: "Ground", role: "ground", screw: "green", x: 14, y: 139 }
      ]
    },
    switch: {
      label: "Single-pole switch",
      face: "switch",
      terminals: [
        { key: "line", label: "Line/feed", role: "hot", screw: "brass", x: 68, y: 50 },
        { key: "load", label: "Switched leg", role: "hot", screw: "brass", x: 68, y: 104 },
        { key: "ground", label: "Ground", role: "ground", screw: "green", x: 14, y: 139 }
      ]
    },
    threeWaySwitch: {
      label: "3-way switch",
      face: "switch",
      terminals: [
        { key: "travelerA", label: "Traveler A", role: "traveler", screw: "brass", x: 14, y: 50 },
        { key: "travelerB", label: "Traveler B", role: "traveler", screw: "brass", x: 68, y: 50 },
        { key: "common", label: "Common", role: "hot", screw: "black", x: 68, y: 104 },
        { key: "ground", label: "Ground", role: "ground", screw: "green", x: 14, y: 139 }
      ]
    },
    fourWaySwitch: {
      label: "4-way switch",
      face: "switch",
      terminals: [
        { key: "outA", label: "Brass pair A", role: "traveler", screw: "brass", x: 14, y: 50 },
        { key: "outB", label: "Brass pair B", role: "traveler", screw: "brass", x: 68, y: 50 },
        { key: "inA", label: "Black pair A", role: "traveler", screw: "black", x: 14, y: 104 },
        { key: "inB", label: "Black pair B", role: "traveler", screw: "black", x: 68, y: 104 },
        { key: "ground", label: "Ground", role: "ground", screw: "green", x: 14, y: 139 }
      ]
    },
    lightBulb: {
      label: "Wired lightbulb",
      face: "light",
      terminals: [
        { key: "hot", label: "Hot", role: "hot", screw: "brass", x: 52, y: 74 },
        { key: "neutral", label: "Neutral", role: "neutral", screw: "silver", x: 98, y: 74 }
      ]
    },
    socketLight: {
      label: "Socket lightbulb",
      face: "socketLight",
      terminals: []
    }
  };

  const DEVICE_PALETTE = [
    { type: "standardOutlet", shortLabel: "Outlet", category: "Receptacles" },
    { type: "halfHotOutlet", shortLabel: "Half-hot", category: "Receptacles" },
    { type: "gfciOutlet", shortLabel: "GFCI", category: "Receptacles" },
    { type: "switch", shortLabel: "Switch", category: "Switches" },
    { type: "threeWaySwitch", shortLabel: "3-way", category: "Switches" },
    { type: "fourWaySwitch", shortLabel: "4-way", category: "Switches" },
    { type: "lightBulb", shortLabel: "Bulb", category: "Loads" },
    { type: "socketLight", shortLabel: "Tester", category: "Loads" }
  ];

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
      if (parent === value) {
        return value;
      }
      const root = this.find(parent);
      this.parent.set(value, root);
      return root;
    }

    union(a, b) {
      const rootA = this.find(a);
      const rootB = this.find(b);
      if (rootA !== rootB) {
        this.parent.set(rootB, rootA);
      }
    }

    nodes() {
      return Array.from(this.parent.keys());
    }
  }

  const state = {
    nextId: 1,
    selected: { type: "source", id: "source_1" },
    source: { ...INITIAL_SOURCE },
    boxes: [],
    devices: [],
    wires: [],
    cables: [],
    wireNuts: [],
    conduits: [],
    paletteDrag: null,
    itemDrag: null,
    endpointDrag: null,
    marqueeDrag: null,
    suppressClick: false,
    gridColor: DEFAULT_GRID_COLOR,
    gridColorEditBefore: null,
    wiresBehindDevices: false,
    faultProbeMode: null,
    testFaults: [],
    bench: { ...DEFAULT_BENCH },
    upstream: cloneValue(INITIAL_UPSTREAM),
    chat: {
      messages: [],
      busy: false,
      pendingProposal: null
    },
    lastDiagnostics: [],
    log: []
  };

  const history = {
    undo: [],
    redo: [],
    suspended: false
  };

  const el = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheElements();
    bindEvents();
    seed();
    render();
  }

  function cacheElements() {
    el.supplyStatus = document.getElementById("supplyStatus");
    el.toolPalette = document.getElementById("toolPalette");
    el.devicePalette = document.getElementById("devicePalette");
    el.supplyRig = document.getElementById("supplyRig");
    el.workspaceToolbar = document.getElementById("workspaceToolbar");
    el.gridColorPicker = document.getElementById("gridColorPicker");
    el.gridColorHex = document.getElementById("gridColorHex");
    el.gridColorR = document.getElementById("gridColorR");
    el.gridColorG = document.getElementById("gridColorG");
    el.gridColorB = document.getElementById("gridColorB");
    el.benchWidthInput = document.getElementById("benchWidthInput");
    el.benchHeightInput = document.getElementById("benchHeightInput");
    el.benchZoomLabel = document.getElementById("benchZoomLabel");
    el.undoButton = document.getElementById("undoButton");
    el.redoButton = document.getElementById("redoButton");
    el.loadButton = document.getElementById("loadButton");
    el.stateFileInput = document.getElementById("stateFileInput");
    el.wireLayerModeButton = document.getElementById("wireLayerModeButton");
    el.groundFaultProbeButton = document.getElementById("groundFaultProbeButton");
    el.lineShortProbeButton = document.getElementById("lineShortProbeButton");
    el.clearShortsButton = document.getElementById("clearShortsButton");
    el.breakerActions = document.getElementById("breakerActions");
    el.upstreamGfciActions = document.getElementById("upstreamGfciActions");
    el.sandboxViewport = document.getElementById("sandboxViewport");
    el.sandboxScrollSpace = document.getElementById("sandboxScrollSpace");
    el.sandbox = document.getElementById("sandbox");
    el.wireLayer = document.getElementById("wireLayer");
    el.selectedWireLayer = document.getElementById("selectedWireLayer");
    el.boxLayer = document.getElementById("boxLayer");
    el.selectionMarquee = document.getElementById("selectionMarquee");
    el.boxInspector = document.getElementById("boxInspector");
    el.diagnostics = document.getElementById("diagnostics");
    el.diagnosticChat = document.getElementById("diagnosticChat");
    el.diagnosticChatForm = document.getElementById("diagnosticChatForm");
    el.diagnosticChatInput = document.getElementById("diagnosticChatInput");
    el.diagnosticChatMessages = document.getElementById("diagnosticChatMessages");
    el.diagnosticProposal = document.getElementById("diagnosticProposal");
    el.diagnosticChatStatus = document.getElementById("diagnosticChatStatus");
    el.eventLog = document.getElementById("eventLog");
    el.contextMenu = document.getElementById("contextMenu");
    el.breakerLamp = document.getElementById("breakerLamp");
    el.upstreamGfciLamp = document.getElementById("upstreamGfciLamp");
  }

  function bindEvents() {
    el.toolPalette.addEventListener("pointerdown", handlePalettePointerDown);
    el.devicePalette.addEventListener("pointerdown", handlePalettePointerDown);
    el.toolPalette.addEventListener("click", handlePaletteClick);
    el.devicePalette.addEventListener("click", handlePaletteClick);
    el.supplyRig.addEventListener("click", handleActionClick);
    el.workspaceToolbar.addEventListener("click", handleActionClick);
    el.stateFileInput.addEventListener("change", handleStateFileInputChange);
    el.gridColorPicker.addEventListener("input", handleGridColorPickerInput);
    el.gridColorPicker.addEventListener("change", handleGridColorCommit);
    el.gridColorHex.addEventListener("input", handleGridColorHexInput);
    el.gridColorHex.addEventListener("change", handleGridColorHexChange);
    [el.gridColorR, el.gridColorG, el.gridColorB].forEach((input) => {
      input.addEventListener("input", handleGridRgbInput);
      input.addEventListener("change", handleGridRgbChange);
    });
    [el.benchWidthInput, el.benchHeightInput].forEach((input) => {
      input.addEventListener("change", handleBenchSizeInputChange);
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          applyCustomBenchSize();
        }
      });
    });
    el.boxInspector.addEventListener("click", handleActionClick);
    el.diagnosticChat.addEventListener("click", handleActionClick);
    el.diagnosticChatForm.addEventListener("submit", handleDiagnosticChatSubmit);
    el.contextMenu.addEventListener("click", handleActionClick);
    el.sandbox.addEventListener("pointerdown", handleSandboxPointerDown);
    el.sandbox.addEventListener("click", handleActionClick);
    el.sandbox.addEventListener("click", handleSandboxClick);
    el.sandbox.addEventListener("contextmenu", handleSandboxContextMenu);
    document.addEventListener("click", hideContextMenu);
    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      const commandKey = event.metaKey || event.ctrlKey;
      if (commandKey && key === "z" && !isTypingTarget(event.target)) {
        event.preventDefault();
        if (event.shiftKey) {
          redoAction();
        } else {
          undoAction();
        }
        return;
      }
      if (commandKey && key === "y" && !isTypingTarget(event.target)) {
        event.preventDefault();
        redoAction();
        return;
      }
      if (event.key === "Escape") {
        hideContextMenu();
      }
      if ((event.key === "Delete" || event.key === "Backspace") && !isTypingTarget(event.target)) {
        const selected = selectedItem();
        if (selected && selected.type !== "source") {
          event.preventDefault();
          deleteSelected();
        }
      }
    });
  }

  function seed() {
    addLog("Power-in source is available as three independent conductors. Nothing is pre-wired.");
  }

  function handlePaletteClick(event) {
    if (state.suppressClick) {
      state.suppressClick = false;
      event.preventDefault();
      return;
    }
    const button = event.target.closest("button");
    if (!button) {
      return;
    }
    const payload = palettePayload(button);
    if (!payload) {
      return;
    }
    placePaletteItem(payload, { x: 420, y: 310 });
  }

  function handlePalettePointerDown(event) {
    if (event.button !== 0) {
      return;
    }
    const button = event.target.closest("button");
    const payload = button ? palettePayload(button) : null;
    if (!payload) {
      return;
    }
    const rect = button.getBoundingClientRect();
    state.paletteDrag = {
      payload,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      ghost: createGhost(button, rect)
    };
    moveGhost(event.clientX, event.clientY);
    document.addEventListener("pointermove", handlePalettePointerMove);
    document.addEventListener("pointerup", handlePalettePointerUp, { once: true });
  }

  function handlePalettePointerMove(event) {
    const drag = state.paletteDrag;
    if (!drag) {
      return;
    }
    if (Math.abs(event.clientX - drag.startX) > 4 || Math.abs(event.clientY - drag.startY) > 4) {
      drag.moved = true;
    }
    moveGhost(event.clientX, event.clientY);
  }

  function handlePalettePointerUp(event) {
    document.removeEventListener("pointermove", handlePalettePointerMove);
    const drag = state.paletteDrag;
    state.paletteDrag = null;
    drag?.ghost?.remove();
    if (!drag?.moved) {
      return;
    }
    suppressNextClick();
    if (!pointInElement(event.clientX, event.clientY, el.sandbox)) {
      return;
    }
    placePaletteItem(drag.payload, eventToGridPoint(event));
  }

  function handleGridColorPickerInput(event) {
    beginGridColorEdit();
    setGridColor(event.target.value, { syncPicker: false });
  }

  function handleGridColorHexInput(event) {
    const color = normalizeHexColor(event.target.value);
    if (color) {
      beginGridColorEdit();
      setGridColor(color, { syncText: false });
    }
  }

  function handleGridColorHexChange(event) {
    beginGridColorEdit();
    const color = normalizeHexColor(event.target.value) || state.gridColor;
    setGridColor(color);
    handleGridColorCommit();
  }

  function handleGridRgbInput() {
    const rgb = readGridRgbInputs();
    if (rgb) {
      beginGridColorEdit();
      setGridColor(rgbToHex(rgb), { syncRgb: false });
    }
  }

  function handleGridRgbChange() {
    beginGridColorEdit();
    const rgb = readGridRgbInputs();
    setGridColor(rgbToHex(rgb || hexToRgb(state.gridColor)), { syncRgb: false });
    syncGridRgbControls(state.gridColor);
    handleGridColorCommit();
  }

  function handleBenchSizeInputChange() {
    applyCustomBenchSize();
  }

  function beginGridColorEdit() {
    if (!state.gridColorEditBefore) {
      state.gridColorEditBefore = snapshotState();
    }
  }

  function handleGridColorCommit() {
    const before = state.gridColorEditBefore;
    state.gridColorEditBefore = null;
    pushUndoSnapshot(before);
    renderHistoryControls();
  }

  function handleSandboxClick(event) {
    hideContextMenu();
    if (state.suppressClick) {
      state.suppressClick = false;
      return;
    }
    const probeMode = activeFaultProbeMode();
    if (probeMode) {
      const faultTarget = faultTargetFromPointer(event, probeMode);
      if (faultTarget) {
        applyTestFault(faultTarget);
        return;
      }
      const touchedDevice = event.target.closest("[data-item-type='device']");
      if (touchedDevice) {
        addLog("Probe applies to wired lightbulbs, outlet receptacles, and plugged socket lightbulbs.");
        render();
        return;
      }
    }
    const gfciAction = event.target.closest("[data-gfci-action]");
    if (gfciAction) {
      const device = deviceById(gfciAction.closest("[data-item-type='device']")?.dataset.itemId);
      if (device?.type === "gfciOutlet") {
        if (gfciAction.dataset.gfciAction === "test") {
          device.tripped = true;
          addLog("Local GFCI test button opened the device.");
        } else {
          device.tripped = false;
          addLog("Local GFCI reset attempted.");
        }
        evaluateTrips();
        render();
      }
      return;
    }
    const switchAction = event.target.closest("[data-switch-action]");
    if (switchAction) {
      const device = deviceById(switchAction.closest("[data-item-type='device']")?.dataset.itemId);
      if (device) {
        toggleDevice(device);
        evaluateTrips();
        render();
      }
      return;
    }
    const clickedHole = event.target.closest("[data-node-type='box-hole']");
    if (clickedHole && selectedItem()?.type === "wire") {
      setSelectedWireKnockout(clickedHole.dataset.boxId, clickedHole.dataset.holeKey);
      return;
    }
    const point = eventToGridPoint(event);
    const nutAtPoint = wireNutAtPoint(point);
    if (nutAtPoint) {
      selectItem("wireNut", nutAtPoint.id);
      render();
      return;
    }
    const landedNutId = landedWireNutIdFromElement(event.target);
    if (landedNutId) {
      selectItem("wireNut", landedNutId);
      render();
      return;
    }
    const item = event.target.closest("[data-item-type]");
    if (!deviceLayerShouldWin(event.target)) {
      const conduitAt = conduitAtPoint(point);
      if (conduitAt) {
        selectItem("conduit", conduitAt.id);
        render();
        return;
      }
      const lineWire = nearestWireAtPoint(point, item?.dataset.itemType === "wireNut" ? 22 : 12);
      if (shouldPreferWireSelection(point, item, lineWire)) {
        selectItem("wire", lineWire.id);
        render();
        return;
      }
    }
    if (item) {
      selectItem(item.dataset.itemType, item.dataset.itemId);
      render();
      return;
    }
    state.selected = null;
    render();
  }

  function toggleDevice(device) {
    if (device.type === "switch") {
      device.on = !device.on;
      addLog(`Switch turned ${device.on ? "on" : "off"}.`);
    }
    if (device.type === "threeWaySwitch") {
      device.position = device.position === "A" ? "B" : "A";
      addLog(`3-way common moved to traveler ${device.position}.`);
    }
    if (device.type === "fourWaySwitch") {
      device.crossed = !device.crossed;
      addLog(`4-way switch set ${device.crossed ? "crossed" : "straight"}.`);
    }
  }

  function handleSandboxPointerDown(event) {
    if (event.button !== 0) {
      return;
    }
    if (activeFaultProbeMode() && event.target.closest("[data-item-type='device']")) {
      return;
    }
    if (event.target.closest("[data-gfci-action], [data-switch-action], [data-action]")) {
      return;
    }
    if (event.target.closest("[data-node-type='box-hole']") && selectedItem()?.type === "wire") {
      return;
    }
    const point = eventToGridPoint(event);
    const nutAtPoint = wireNutAtPoint(point);
    if (nutAtPoint) {
      const before = snapshotState();
      if (!isSelected("wireNut", nutAtPoint.id)) {
        selectItem("wireNut", nutAtPoint.id);
      }
      beginItemDrag(point, before, false);
      render();
      return;
    }
    const landedNutId = landedWireNutIdFromElement(event.target);
    if (landedNutId) {
      const before = snapshotState();
      if (!isSelected("wireNut", landedNutId)) {
        selectItem("wireNut", landedNutId);
      }
      beginItemDrag(point, before, false);
      render();
      return;
    }
    const node = event.target.closest(".grid-node");
    if (node && ["wire-end", "conduit-end"].includes(node.dataset.nodeType)) {
      startEndpointDrag(event, node);
      return;
    }
    const item = event.target.closest("[data-item-type]");
    if (!deviceLayerShouldWin(event.target)) {
      const conduitAt = conduitAtPoint(point);
      if (conduitAt) {
        const before = snapshotState();
        if (!isSelected("conduit", conduitAt.id)) {
          selectItem("conduit", conduitAt.id);
        }
        beginItemDrag(point, before, false);
        render();
        return;
      }
      const wirePath = event.target.closest("[data-wire-path]");
      if (wirePath) {
        const before = snapshotState();
        if (!isSelected("wire", wirePath.dataset.wirePath)) {
          selectItem("wire", wirePath.dataset.wirePath);
        }
        beginItemDrag(point, before, false);
        render();
        return;
      }
      const lineWire = nearestWireAtPoint(point, item?.dataset.itemType === "wireNut" ? 22 : 12);
      if (shouldPreferWireSelection(point, item, lineWire)) {
        selectItem("wire", lineWire.id);
        render();
        return;
      }
    }
    if (!item) {
      startSelectionMarquee(event, point);
      return;
    }
    const type = item.dataset.itemType;
    const id = item.dataset.itemId;
    const before = snapshotState();
    if (!isSelected(type, id)) {
      selectItem(type, id);
    }
    beginItemDrag(point, before, prepareSelectionForDrag());
  }

  function handleItemPointerMove(event) {
    const drag = state.itemDrag;
    if (!drag) {
      return;
    }
    const point = eventToGridPoint(event);
    const dx = point.x - drag.startMouse.x;
    const dy = point.y - drag.startMouse.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      drag.moved = true;
    }
    moveDraggedItems(drag.items, drag.starts, dx, dy);
    render();
  }

  function handleItemPointerUp() {
    document.removeEventListener("pointermove", handleItemPointerMove);
    const drag = state.itemDrag;
    state.itemDrag = null;
    if (!drag) {
      return;
    }
    finalizeDraggedItems(drag.items);
    if (drag.moved || drag.changedOnStart) {
      pushUndoSnapshot(drag.before);
      suppressNextClick();
      addLog(drag.moved ? `${drag.items.length} selected item${drag.items.length === 1 ? "" : "s"} moved.` : "Grid item detached.");
    }
    render();
  }

  function beginItemDrag(point, before, changedOnStart) {
    const items = normalizedDragItems(selectedItems());
    state.itemDrag = {
      items,
      starts: captureDragStarts(items),
      startMouse: { ...point },
      moved: false,
      before,
      changedOnStart
    };
    document.addEventListener("pointermove", handleItemPointerMove);
    document.addEventListener("pointerup", handleItemPointerUp, { once: true });
  }

  function prepareSelectionForDrag() {
    let changed = false;
    const items = normalizedDragItems(selectedItems());
    const selectedBoxes = new Set(items.filter((item) => item.type === "box").map((item) => item.id));
    items.forEach((item) => {
      if (item.type !== "device") return;
      const device = deviceById(item.id);
      if (!device) return;
      if (device.pluggedTarget) {
        const currentPos = devicePosition(device);
        device.x = currentPos.x;
        device.y = currentPos.y;
        device.pluggedTarget = null;
        changed = true;
      }
      if (device.boxId && !selectedBoxes.has(device.boxId)) {
        const currentPos = devicePosition(device);
        device.x = currentPos.x;
        device.y = currentPos.y;
        device.boxId = null;
        device.slot = null;
        changed = true;
      }
    });
    return changed;
  }

  function normalizedDragItems(items) {
    const selectedBoxes = new Set(items.filter((item) => item.type === "box").map((item) => item.id));
    const selectedCables = new Set(items.filter((item) => item.type === "cable").map((item) => item.id));
    const result = [];
    const seen = new Set();
    items.forEach((item) => {
      if (!item?.type || !item.id) return;
      if (item.type === "device") {
        const device = deviceById(item.id);
        if (device?.boxId && selectedBoxes.has(device.boxId)) return;
      }
      if (item.type === "wire") {
        const wire = wireById(item.id);
        if (wire?.cableId && selectedCables.has(wire.cableId)) return;
      }
      const key = selectionKey(item);
      if (seen.has(key)) return;
      seen.add(key);
      result.push({ type: item.type, id: item.id });
    });
    return result;
  }

  function captureDragStarts(items) {
    const starts = new Map();
    items.forEach((item) => {
      const key = selectionKey(item);
      if (item.type === "wire") {
        const wire = wireById(item.id);
        if (wire) {
          starts.set(key, cloneValue({ a: wire.a, b: wire.b }));
        }
        return;
      }
      if (item.type === "cable") {
        const cable = cableById(item.id);
        starts.set(key, (cable?.wireIds || []).map((wireId) => {
          const wire = wireById(wireId);
          return wire ? { wireId, a: cloneValue(wire.a), b: cloneValue(wire.b) } : null;
        }).filter(Boolean));
        return;
      }
      if (item.type === "conduit") {
        const conduit = conduitById(item.id);
        if (conduit) {
          starts.set(key, cloneValue({ a: conduit.a, b: conduit.b }));
        }
        return;
      }
      starts.set(key, cloneValue(itemPosition(item.type, item.id)));
    });
    return starts;
  }

  function moveDraggedItems(items, starts, dx, dy) {
    items.forEach((item) => {
      const start = starts.get(selectionKey(item));
      if (!start) return;
      if (item.type === "wire") {
        moveWireFromStart(item.id, start, dx, dy);
        return;
      }
      if (item.type === "cable") {
        moveCableFromStart(start, dx, dy);
        return;
      }
      if (item.type === "conduit") {
        moveConduitFromStart(item.id, start, dx, dy);
        return;
      }
      moveItem(item.type, item.id, start.x + dx, start.y + dy);
    });
  }

  function moveWireFromStart(wireId, start, dx, dy) {
    const wire = wireById(wireId);
    if (!wire) return;
    ["a", "b"].forEach((end) => {
      if (start[end]?.connection) {
        wire[end].connection = cloneValue(start[end].connection);
        return;
      }
      wire[end].connection = null;
      wire[end].x = clamp(start[end].x + dx, 18, GRID.width - 18);
      wire[end].y = clamp(start[end].y + dy, 18, GRID.height - 18);
    });
  }

  function moveCableFromStart(startWires, dx, dy) {
    startWires.forEach((entry) => moveWireFromStart(entry.wireId, entry, dx, dy));
  }

  function moveConduitFromStart(conduitId, start, dx, dy) {
    const conduit = conduitById(conduitId);
    if (!conduit) return;
    ["a", "b"].forEach((end) => {
      if (start[end]?.connection) {
        conduit[end].connection = cloneValue(start[end].connection);
        return;
      }
      conduit[end].connection = null;
      conduit[end].x = clamp(start[end].x + dx, 18, GRID.width - 18);
      conduit[end].y = clamp(start[end].y + dy, 18, GRID.height - 18);
    });
  }

  function finalizeDraggedItems(items) {
    items.forEach((item) => {
      if (item.type !== "device") return;
      const device = deviceById(item.id);
      if (!device) return;
      if (device.type === "socketLight") {
        snapSocketLight(device);
      } else {
        snapDeviceToBox(device);
      }
    });
  }

  function startSelectionMarquee(event, point) {
    event.preventDefault();
    state.marqueeDrag = {
      start: { ...point },
      current: { ...point },
      moved: false
    };
    updateSelectionMarquee();
    document.addEventListener("pointermove", handleSelectionPointerMove);
    document.addEventListener("pointerup", handleSelectionPointerUp, { once: true });
  }

  function handleSelectionPointerMove(event) {
    const drag = state.marqueeDrag;
    if (!drag) return;
    drag.current = eventToGridPoint(event);
    if (Math.abs(drag.current.x - drag.start.x) > 4 || Math.abs(drag.current.y - drag.start.y) > 4) {
      drag.moved = true;
    }
    updateSelectionMarquee();
  }

  function handleSelectionPointerUp() {
    document.removeEventListener("pointermove", handleSelectionPointerMove);
    const drag = state.marqueeDrag;
    state.marqueeDrag = null;
    hideSelectionMarquee();
    if (!drag?.moved) {
      return;
    }
    selectItems(itemsInsideSelection(selectionRectFromPoints(drag.start, drag.current)));
    suppressNextClick();
    render();
  }

  function startEndpointDrag(event, element) {
    event.stopPropagation();
    event.preventDefault();
    const node = nodeFromElement(element);
    if (!node) {
      return;
    }
    if (node.kind === "wireEndpoint") {
      selectItem("wire", node.wireId);
    } else if (node.kind === "sourceTerminal") {
      selectItem("source", state.source.id);
    } else if (node.kind === "deviceTerminal") {
      selectItem("device", node.deviceId);
    } else if (node.kind === "boxGround") {
      selectItem("box", node.boxId);
    } else if (node.kind === "wireNut") {
      selectItem("wireNut", node.nutId);
    }
    const start = nodePoint(node);
    state.endpointDrag = { from: node, start, current: start, moved: false, before: snapshotState() };
    ensurePreview();
    updatePreview(start, start);
    document.addEventListener("pointermove", handleEndpointPointerMove);
    document.addEventListener("pointerup", handleEndpointPointerUp, { once: true });
  }

  function handleEndpointPointerMove(event) {
    const drag = state.endpointDrag;
    if (!drag) {
      return;
    }
    const current = eventToGridPoint(event);
    drag.current = current;
    if (Math.abs(current.x - drag.start.x) > 3 || Math.abs(current.y - drag.start.y) > 3) {
      drag.moved = true;
    }
    updatePreview(drag.start, current);
  }

  function handleEndpointPointerUp(event) {
    document.removeEventListener("pointermove", handleEndpointPointerMove);
    const drag = state.endpointDrag;
    state.endpointDrag = null;
    removePreview();
    if (!drag?.moved) {
      render();
      return;
    }
    suppressNextClick();
    const target = targetNodeFromPoint(event.clientX, event.clientY, drag.from);
    applyNodeDrag(drag.from, target, drag.current);
    evaluateTrips();
    pushUndoSnapshot(drag.before);
    render();
  }

  function handleSandboxContextMenu(event) {
    const point = eventToGridPoint(event);
    const nutAtPoint = wireNutAtPoint(point);
    if (nutAtPoint) {
      event.preventDefault();
      if (!isSelected("wireNut", nutAtPoint.id)) {
        selectItem("wireNut", nutAtPoint.id);
      }
      render();
      showContextMenu(event.clientX, event.clientY);
      return;
    }
    const landedNutId = landedWireNutIdFromElement(event.target);
    if (landedNutId) {
      event.preventDefault();
      if (!isSelected("wireNut", landedNutId)) {
        selectItem("wireNut", landedNutId);
      }
      render();
      showContextMenu(event.clientX, event.clientY);
      return;
    }
    const item = event.target.closest("[data-item-type]");
    if (!deviceLayerShouldWin(event.target)) {
      const conduitAt = conduitAtPoint(point);
      if (conduitAt) {
        event.preventDefault();
        if (!isSelected("conduit", conduitAt.id)) {
          selectItem("conduit", conduitAt.id);
        }
        render();
        showContextMenu(event.clientX, event.clientY);
        return;
      }
      const lineWire = nearestWireAtPoint(point, item?.dataset.itemType === "wireNut" ? 22 : 12);
      if (shouldPreferWireSelection(point, item, lineWire)) {
        event.preventDefault();
        if (!isSelected("wire", lineWire.id)) {
          selectItem("wire", lineWire.id);
        }
        render();
        showContextMenu(event.clientX, event.clientY);
        return;
      }
    }
    if (item) {
      event.preventDefault();
      if (!isSelected(item.dataset.itemType, item.dataset.itemId)) {
        selectItem(item.dataset.itemType, item.dataset.itemId);
      }
      render();
      showContextMenu(event.clientX, event.clientY);
      return;
    }
    hideContextMenu();
  }

  function handleActionClick(event) {
    const button = event.target.closest("button");
    const action = button?.dataset.action;
    if (!action) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (action === "delete-selected") {
      deleteSelected();
    }
    if (action === "rotate-device-cw" || action === "rotate-selected-cw") {
      rotateSelected(90);
    }
    if (action === "rotate-device-ccw" || action === "rotate-selected-ccw") {
      rotateSelected(-90);
    }
    if (action === "undo") {
      undoAction();
    }
    if (action === "redo") {
      redoAction();
    }
    if (action === "save-state") {
      saveWorkState();
    }
    if (action === "load-state") {
      loadWorkState();
    }
    if (action === "export-state-file") {
      exportWorkStateFile();
    }
    if (action === "import-state-file") {
      openWorkStateFilePicker();
    }
    if (action === "clear-board") {
      clearBoard();
    }
    if (action === "toggle-wire-layer-mode") {
      recordHistory();
      state.wiresBehindDevices = !state.wiresBehindDevices;
      addLog(state.wiresBehindDevices ? "Wire paths moved behind devices." : "Wire paths moved in front for editing.");
      render();
    }
    if (action === "toggle-short-probe" || action === "toggle-ground-fault-probe" || action === "toggle-line-short-probe") {
      recordHistory();
      const nextMode = action === "toggle-line-short-probe" ? "line-neutral" : "ground-fault";
      state.faultProbeMode = state.faultProbeMode === nextMode ? null : nextMode;
      addLog(state.faultProbeMode ? `${probeModeLabel(state.faultProbeMode)} enabled. Click a receptacle or wired lightbulb on the board.` : "Fault probe disabled.");
      render();
    }
    if (action === "clear-test-shorts") {
      clearTestShorts();
    }
    if (action === "toggle-breaker") {
      recordHistory();
      state.upstream.breakerOn = !state.upstream.breakerOn;
      if (!state.upstream.breakerOn) {
        state.upstream.breakerTripped = false;
      }
      addLog(state.upstream.breakerOn ? "Breaker handle turned on." : "Breaker handle turned off.");
      evaluateTrips();
      render();
    }
    if (action === "reset-breaker") {
      recordHistory();
      state.upstream.breakerOn = true;
      state.upstream.breakerTripped = false;
      state.upstream.lastTrip = null;
      evaluateTrips();
      addLog("Breaker reset attempted.");
      render();
    }
    if (action === "test-upstream-gfci") {
      recordHistory();
      state.upstream.gfciTripped = true;
      state.upstream.lastTrip = {
        device: "upstreamGfci",
        title: "Upstream GFCI test",
        text: "The protected source was intentionally tripped."
      };
      addLog("Upstream GFCI test button tripped the source.");
      render();
    }
    if (action === "reset-upstream-gfci") {
      recordHistory();
      state.upstream.gfciTripped = false;
      state.upstream.lastTrip = null;
      evaluateTrips();
      addLog("Upstream GFCI reset attempted.");
      render();
    }
    if (action === "toggle-plug") {
      recordHistory();
      state.upstream.pluggedIn = !state.upstream.pluggedIn;
      addLog(state.upstream.pluggedIn ? "Power cable plugged in." : "Power cable unplugged.");
      evaluateTrips();
      render();
    }
    if (action === "shrink-bench") {
      resizeBenchBy(-BENCH_RESIZE_STEP.width, -BENCH_RESIZE_STEP.height);
    }
    if (action === "expand-bench") {
      resizeBenchBy(BENCH_RESIZE_STEP.width, BENCH_RESIZE_STEP.height);
    }
    if (action === "apply-bench-size") {
      applyCustomBenchSize();
    }
    if (action === "zoom-out") {
      setBenchZoom(state.bench.zoom - BENCH_ZOOM_STEP);
    }
    if (action === "zoom-in") {
      setBenchZoom(state.bench.zoom + BENCH_ZOOM_STEP);
    }
    if (action === "reset-bench-size") {
      setBenchSettings({ ...DEFAULT_BENCH }, "Bench size and zoom reset.");
    }
    if (action === "reset-grid-color") {
      recordHistory();
      setGridColor(DEFAULT_GRID_COLOR);
      addLog("Board background reset.");
      render();
    }
    if (action === "clear-wire-routes") {
      clearSelectedWireRoutes();
    }
    if (action === "short-selected-device") {
      shortSelectedDevice();
    }
    if (action === "short-selected-top" || action === "short-selected-bottom") {
      shortSelectedReceptacle(action === "short-selected-top" ? "top" : "bottom");
    }
    if (action === "clear-selected-shorts") {
      clearSelectedDeviceShorts();
    }
    if (action === "accept-ai-fix") {
      applyDiagnosticProposal();
    }
    if (action === "dismiss-ai-fix") {
      state.chat.pendingProposal = null;
      renderDiagnosticChat();
    }
  }

  async function handleDiagnosticChatSubmit(event) {
    event.preventDefault();
    const question = el.diagnosticChatInput.value.trim();
    if (!question || state.chat.busy) {
      return;
    }
    el.diagnosticChatInput.value = "";
    state.chat.messages.push({ role: "user", text: question });
    state.chat.busy = true;
    state.chat.pendingProposal = null;
    renderDiagnosticChat();
    try {
      const result = analyzeCircuit();
      const payload = {
        question,
        diagnostics: diagnosticRows(result),
        simulator: simulatorSnapshot(result)
      };
      const answer = await askDiagnosticAssistant(payload);
      state.chat.messages.push({ role: "assistant", text: answer.reply });
      state.chat.pendingProposal = normalizeProposal(answer.proposal);
    } catch (error) {
      const fallback = localDiagnosticAssistant(question, simulatorSnapshot(analyzeCircuit()));
      state.chat.messages.push({ role: "assistant", text: fallback.reply });
      state.chat.pendingProposal = normalizeProposal(fallback.proposal);
    } finally {
      state.chat.busy = false;
      renderDiagnosticChat();
    }
  }

  async function askDiagnosticAssistant(payload) {
    try {
      const response = await fetch("./api/diagnostics-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`AI proxy returned ${response.status}`);
      }
      const data = await response.json();
      if (!data?.reply) {
        throw new Error("AI proxy returned no reply.");
      }
      return data;
    } catch (error) {
      return localDiagnosticAssistant(payload.question, payload.simulator);
    }
  }

  function localDiagnosticAssistant(question, snapshot, prefix = "I checked the simulator graph.") {
    const lower = question.toLowerCase();
    const trips = snapshot.diagnostics.filter((row) => row.severity === "trip");
    const faults = snapshot.diagnostics.filter((row) => ["Ground fault", "Hot-neutral short", "Neutral-ground bond"].includes(row.title));
    let reply = `${prefix} `;
    const protectionExplanation = explainProtectionQuestion(lower, snapshot);
    if (protectionExplanation) {
      reply += protectionExplanation;
      return { reply, proposal: latchedTripProposal(snapshot, faults) };
    }
    const outletExplanation = explainOutletQuestion(lower, snapshot);
    if (outletExplanation) {
      reply += outletExplanation;
      return { reply, proposal: latchedTripProposal(snapshot, faults) };
    }
    const groundTripExplanation = explainGroundTripQuestion(lower, snapshot);
    if (groundTripExplanation) {
      reply += groundTripExplanation;
      return { reply, proposal: latchedTripProposal(snapshot, faults) };
    }
    if (trips.length) {
      reply += `The current diagnostic is based on ${trips.map((row) => row.title).join(", ")}. `;
    } else {
      reply += "There is no active trip diagnostic in the current run. ";
    }
    if (faults.length) {
      reply += `The analyzer still sees: ${faults.map((row) => `${row.title}: ${row.text}`).join(" ")} `;
    } else {
      reply += "The analyzer does not currently see a hot-neutral or hot-ground fault in the graph. ";
    }
    if (lower.includes("wrong") || lower.includes("valid") || lower.includes("true") || lower.includes("why")) {
      reply += "That conclusion comes from tracing each connected wire endpoint, terminal screw, source node, and device internal behavior in the current simulator graph.";
    }
    return { reply, proposal: latchedTripProposal(snapshot, faults) };
  }

  function explainProtectionQuestion(lower, snapshot) {
    if (!/(gfci|breaker|trip|short|fault)/.test(lower)) return "";
    const hotNeutral = snapshot.diagnostics.find((row) => row.title === "Hot-neutral short");
    const groundFault = snapshot.diagnostics.find((row) => row.title === "Ground fault");
    const testFaults = snapshot.testFaults || [];
    if (hotNeutral) {
      return ` The simulator sees a line-to-neutral short: ${hotNeutral.text} A GFCI compares current leaving on hot with current returning on neutral. In a hot-neutral short, that current can still be balanced, so the GFCI is not the protective device for that fault. The breaker trips for the overcurrent condition. Use the GFCI probe when you want to simulate leakage from hot to ground.`;
    }
    if (groundFault) {
      return ` The simulator sees a ground fault: ${groundFault.text} That means hot is leaking to the equipment grounding path instead of returning only on neutral, so the upstream GFCI trips before the breaker in this protected source setup.`;
    }
    if (testFaults.some((fault) => fault.kind === "line-neutral")) {
      const energized = faultTargetEnergized(snapshot, testFaults.find((fault) => fault.kind === "line-neutral"));
      const energizedText = energized === false
        ? " In this exact board state, the touched receptacle or load is currently dead, so the probe is recorded but no protective device should trip until that point is actually energized."
        : "";
      return ` The active test is a line-neutral short probe. That probe intentionally ties hot to neutral, so the expected protection response on an energized point is a breaker trip, not a GFCI trip.${energizedText}`;
    }
    if (testFaults.some((fault) => fault.kind === "ground-fault")) {
      const energized = faultTargetEnergized(snapshot, testFaults.find((fault) => fault.kind === "ground-fault"));
      const energizedText = energized === false
        ? " In this exact board state, the touched receptacle or load is currently dead, so the probe is recorded but no GFCI should trip until that point is actually energized."
        : "";
      return ` The active test is a ground-fault probe. If the touched object is energized from the protected source, the expected response is an upstream GFCI trip.${energizedText}`;
    }
    return "";
  }

  function faultTargetEnergized(snapshot, fault) {
    if (!fault) return null;
    const device = snapshot.devices?.find((entry) => entry.id === fault.deviceId);
    if (!device?.report) return null;
    if (fault.receptacle) {
      const rowLabel = fault.receptacle === "top" ? "Top receptacle" : "Bottom receptacle";
      const row = device.report.status?.find(([label]) => label === rowLabel);
      if (row) return row[1] === "120 V";
    }
    return Boolean(device.report.energized || device.report.lit || device.report.active);
  }

  function latchedTripProposal(snapshot, faults) {
    return (!faults.length && (snapshot.upstream.breakerTripped || snapshot.upstream.gfciTripped)) ? {
      title: "Clear latched trip state",
      reason: "No active line-neutral short or ground fault is visible now, so the remaining trip is a latched protection state. Accept to reset the protective device for this run.",
      actions: [
        snapshot.upstream.gfciTripped ? { type: "reset_upstream_gfci" } : null,
        snapshot.upstream.breakerTripped ? { type: "reset_breaker" } : null,
        { type: "clear_last_trip" }
      ].filter(Boolean)
    } : null;
  }

  function explainOutletQuestion(lower, snapshot) {
    if (!/(outlet|receptacle|socket|dead|light|lamp)/.test(lower)) return "";
    const requestedBox = lower.match(/box\s*(\d+)/)?.[1];
    const requestedHalf = lower.includes("top") && !lower.includes("bottom") ? "top" : lower.includes("bottom") && !lower.includes("top") ? "bottom" : null;
    const outlets = snapshot.devices.filter((device) => ["standardOutlet", "halfHotOutlet", "gfciOutlet"].includes(device.type) &&
      (!requestedBox || device.boxLabel?.toLowerCase() === `box ${requestedBox}`));
    if (!outlets.length) {
      return requestedBox ? ` I do not see an outlet device in Box ${requestedBox}.` : " I do not see an outlet device in the current simulator state.";
    }
    return outlets.map((device) => explainOutletDevice(device, requestedHalf, snapshot)).join(" ");
  }

  function explainGroundTripQuestion(lower, snapshot) {
    if (!lower.includes("ground") || !/(trip|gfci|breaker|fault|short|why)/.test(lower)) return "";
    const requestedBox = lower.match(/box\s*(\d+)/)?.[1];
    const box = requestedBox ? snapshot.boxes.find((entry) => entry.label?.toLowerCase() === `box ${requestedBox}`) : null;
    const groundFault = snapshot.diagnostics.find((row) => row.title === "Ground fault");
    if (groundFault) {
      return ` It is tripping because the current graph has hot and equipment ground on the same connected node: ${groundFault.text}`;
    }
    const boxText = box
      ? `${box.label}'s ground screw is ${box.ground?.connection === "open" ? "open" : `connected to ${box.ground?.connection}`}`
      : "an unwired box ground is open";
    return ` ${boxText}. That does not trip by itself. A missing ground is an open bonding/safety path; it is not a fault-current path. In this simulator, the upstream GFCI trips when hot is actually connected to equipment ground, and the breaker trips when hot is tied to neutral. Since no hot conductor is touching the box ground node right now, there is no hot-ground or hot-neutral short to trip. The setup can still be incomplete or unsafe, but an open ground alone should not cause a trip.`;
  }

  function explainOutletDevice(device, requestedHalf, snapshot) {
    if (device.type === "gfciOutlet") {
      const lineHot = terminalSummary(device, "lineHot");
      const lineNeutral = terminalSummary(device, "lineNeutral");
      const lineReady = lineHot.potential === "hot" && lineNeutral.potential === "neutral";
      return ` ${device.boxLabel || "Floating"} ${device.label}: the face is ${lineReady && device.report?.active ? "able to pass power" : "dead"} because LINE hot is ${lineHot.potential} (${lineHot.connection}) and LINE neutral is ${lineNeutral.potential} (${lineNeutral.connection}). A GFCI receptacle needs hot and neutral on LINE and must be reset before its receptacle/load side works.`;
    }
    const halves = requestedHalf ? [requestedHalf] : ["top", "bottom"];
    const parts = halves.map((half) => {
      const hot = terminalSummary(device, `${half}Hot`);
      const neutral = terminalSummary(device, `${half}Neutral`);
      const status = statusValue(device.report, `${capitalize(half)} receptacle`) || "unknown";
      const missing = [];
      if (hot.potential !== "hot") missing.push(`hot is ${hot.potential}`);
      if (neutral.potential !== "neutral") missing.push(`neutral is ${neutral.potential}`);
      const missingText = missing.length ? `missing ${missing.join(" and ")}` : "has hot and neutral";
      return `${capitalize(half)} is ${status}: ${missingText}. Hot screw: ${hot.connection}. Neutral screw: ${neutral.connection}.`;
    }).join(" ");
    const sourceText = snapshot.sourceAvailable ? "The power source itself is available." : `The power source is off/not available (${sourceOffReason(snapshot)}).`;
    return ` ${device.boxLabel || "Floating"} ${device.label}: ${parts} ${sourceText}`;
  }

  function terminalSummary(device, key) {
    const terminal = device.terminals?.find((entry) => entry.key === key);
    return {
      potential: terminal?.potential || "open",
      connection: terminal?.connection || "open"
    };
  }

  function statusValue(report, label) {
    return report?.status?.find(([name]) => name === label)?.[1] || "";
  }

  function sourceOffReason(snapshot) {
    if (!snapshot.upstream.pluggedIn) return "Power In is turned off/unplugged";
    if (!snapshot.upstream.breakerOn) return "breaker is off";
    if (snapshot.upstream.breakerTripped) return "breaker is tripped";
    if (snapshot.upstream.gfciTripped) return "upstream GFCI is tripped";
    return "unknown upstream state";
  }

  function normalizeProposal(proposal) {
    if (!proposal || !Array.isArray(proposal.actions) || proposal.actions.length === 0) {
      return null;
    }
    return {
      title: String(proposal.title || "Suggested simulator update"),
      reason: String(proposal.reason || "Apply this update to the current run."),
      actions: proposal.actions
        .filter((action) => action && typeof action.type === "string")
        .map((action) => ({ type: action.type }))
    };
  }

  function applyDiagnosticProposal() {
    const proposal = state.chat.pendingProposal;
    if (!proposal) return;
    recordHistory();
    proposal.actions.forEach((action) => {
      if (action.type === "reset_upstream_gfci") state.upstream.gfciTripped = false;
      if (action.type === "test_upstream_gfci") state.upstream.gfciTripped = true;
      if (action.type === "reset_breaker") {
        state.upstream.breakerOn = true;
        state.upstream.breakerTripped = false;
      }
      if (action.type === "turn_breaker_on") state.upstream.breakerOn = true;
      if (action.type === "turn_breaker_off") {
        state.upstream.breakerOn = false;
        state.upstream.breakerTripped = false;
      }
      if (action.type === "plug_source") state.upstream.pluggedIn = true;
      if (action.type === "unplug_source") state.upstream.pluggedIn = false;
      if (action.type === "clear_last_trip") state.upstream.lastTrip = null;
    });
    evaluateTrips();
    state.chat.pendingProposal = null;
    state.chat.messages.push({ role: "assistant", text: "Accepted. I applied the proposed simulator update and re-ran diagnostics for this run." });
    addLog("Diagnostic assistant proposal accepted.");
    render();
  }

  function activeFaultProbeMode() {
    return state.faultProbeMode || null;
  }

  function probeModeLabel(mode) {
    return mode === "line-neutral" ? "Line-neutral short probe" : "GFCI ground-fault probe";
  }

  function faultTargetFromPointer(event, mode) {
    const card = event.target.closest("[data-item-type='device']");
    const device = card ? deviceById(card.dataset.itemId) : null;
    if (!device) return null;
    if (device.type === "socketLight") {
      if (!device.pluggedTarget) return null;
      const outlet = deviceById(device.pluggedTarget.deviceId);
      return outletReceptacleFaultTarget(outlet, device.pluggedTarget.receptacle, "Socket tester", mode);
    }
    if (device.type === "lightBulb") {
      return lightBulbFaultTarget(device, mode);
    }
    if (isOutletDevice(device)) {
      return outletReceptacleFaultTarget(device, outletReceptacleFromPointer(device, event), DEVICE_DEFS[device.type].label, mode);
    }
    return null;
  }

  function lightBulbFaultTarget(device, mode) {
    if (!device) return null;
    if (mode === "line-neutral") {
      return {
        id: `device:${device.id}:bulb:line-neutral`,
        deviceId: device.id,
        kind: mode,
        label: `${DEVICE_DEFS[device.type].label} line-neutral short test`,
        terminals: ["hot", "neutral"]
      };
    }
    return {
      id: `device:${device.id}:bulb:ground-fault`,
      deviceId: device.id,
      kind: "ground-fault",
      label: `${DEVICE_DEFS[device.type].label} ground-fault test`,
      nodes: [deviceTerminalNode(device.id, "hot"), SOURCE_NODE.ground]
    };
  }

  function outletReceptacleFaultTarget(device, receptacle, sourceLabel, mode) {
    if (!device || !isOutletDevice(device)) return null;
    const pair = outletReceptacleTerminalPair(device, receptacle, mode);
    if (!pair) return null;
    const id = `device:${device.id}:${receptacle}:${mode}`;
    if (mode === "line-neutral") {
      return {
        id,
        deviceId: device.id,
        receptacle,
        kind: mode,
        label: `${sourceLabel} ${receptacle} receptacle line-neutral short test`,
        terminals: pair
      };
    }
    return {
      id,
      deviceId: device.id,
      receptacle,
      kind: "ground-fault",
      label: `${sourceLabel} ${receptacle} receptacle ground-fault test`,
      nodes: [deviceTerminalNode(device.id, pair[0]), SOURCE_NODE.ground]
    };
  }

  function outletReceptacleTerminalPair(device, receptacle, mode = "line-neutral") {
    if (!device) return null;
    if (device.type === "standardOutlet" || device.type === "halfHotOutlet") {
      const prefix = receptacle === "bottom" ? "bottom" : "top";
      return [`${prefix}Hot`, `${prefix}Neutral`];
    }
    if (device.type === "gfciOutlet") {
      if (mode === "ground-fault") {
        return ["lineHot", "lineNeutral"];
      }
      return ["lineHot", "lineNeutral"];
    }
    return null;
  }

  function outletReceptacleFromPointer(device, event) {
    const local = deviceLocalPointFromPointer(device, event);
    return local.y > deviceSizeForType(device.type).height / 2 ? "bottom" : "top";
  }

  function deviceLocalPointFromPointer(device, event) {
    const point = eventToGridPoint(event);
    const pos = devicePosition(device);
    const angle = (-deviceRotation(device) * Math.PI) / 180;
    const dx = point.x - pos.x;
    const dy = point.y - pos.y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const base = deviceSizeForType(device.type);
    return {
      x: dx * cos - dy * sin + base.width / 2,
      y: dx * sin + dy * cos + base.height / 2
    };
  }

  function applyTestFault(target) {
    if (!target?.terminals?.length && !target?.nodes?.length) return;
    recordHistory();
    state.testFaults = state.testFaults.filter((fault) => fault.id !== target.id);
    state.testFaults.push({
      id: target.id,
      deviceId: target.deviceId,
      receptacle: target.receptacle || null,
      kind: target.kind || "line-neutral",
      label: target.label,
      terminals: target.terminals ? [...target.terminals] : null,
      nodes: target.nodes ? [...target.nodes] : null
    });
    addLog(`${target.label} applied.`);
    evaluateTrips();
    render();
  }

  function clearTestShorts() {
    if (!state.testFaults.length) {
      render();
      return;
    }
    recordHistory();
    state.testFaults = [];
    evaluateTrips();
    addLog("All active test faults cleared.");
    render();
  }

  function shortSelectedDevice() {
    const selected = selectedItem();
    const device = selected?.type === "device" ? deviceById(selected.id) : null;
    if (!device) return;
    let target = null;
    if (device.type === "lightBulb") {
      target = lightBulbFaultTarget(device, activeFaultProbeMode() || "ground-fault");
    } else if (device.type === "socketLight" && device.pluggedTarget) {
      const outlet = deviceById(device.pluggedTarget.deviceId);
      target = outletReceptacleFaultTarget(outlet, device.pluggedTarget.receptacle, "Socket tester", activeFaultProbeMode() || "ground-fault");
    }
    if (target) {
      applyTestFault(target);
    }
  }

  function shortSelectedReceptacle(receptacle) {
    const selected = selectedItem();
    const device = selected?.type === "device" ? deviceById(selected.id) : null;
    const target = isOutletDevice(device) ? outletReceptacleFaultTarget(device, receptacle, DEVICE_DEFS[device.type].label, activeFaultProbeMode() || "ground-fault") : null;
    if (target) {
      applyTestFault(target);
    }
  }

  function clearSelectedDeviceShorts() {
    const selected = selectedItem();
    const device = selected?.type === "device" ? deviceById(selected.id) : null;
    if (!device) return;
    const before = state.testFaults.length;
    const deviceIds = new Set([device.id]);
    if (device.type === "socketLight" && device.pluggedTarget?.deviceId) {
      deviceIds.add(device.pluggedTarget.deviceId);
    }
    const next = state.testFaults.filter((fault) => !deviceIds.has(fault.deviceId));
    if (next.length !== before) {
      recordHistory();
      state.testFaults = next;
      evaluateTrips();
      addLog("Selected device test fault cleared.");
    }
    render();
  }

  function palettePayload(button) {
    if (button.dataset.tool) {
      return { palette: "tool", id: button.dataset.tool };
    }
    if (button.dataset.device) {
      return { palette: "device", id: button.dataset.device };
    }
    return null;
  }

  function placePaletteItem(payload, point) {
    if (payload.palette === "device") {
      recordHistory();
      const device = createDevice(payload.id, point.x, point.y);
      if (device.type === "socketLight") {
        snapSocketLight(device);
      } else {
        snapDeviceToBox(device);
      }
      selectItem("device", device.id);
      addLog(`${DEVICE_DEFS[payload.id].label} added to the diagram.`);
    } else {
      const tool = TOOL_PALETTE.find((entry) => entry.id === payload.id);
      if (!tool) {
        return;
      }
      recordHistory();
      if (tool.kind === "box") {
        const box = createBox(point.x, point.y);
        selectItem("box", box.id);
        addLog("4x4 box added.");
      }
      if (tool.kind === "wireNut") {
        const nut = createWireNut(point.x, point.y);
        selectItem("wireNut", nut.id);
        addLog("Wire nut added.");
      }
      if (tool.kind === "power") {
        const sourcePoint = clampPointForSize(point.x, point.y, SOURCE_SIZE);
        state.source.x = sourcePoint.x;
        state.source.y = sourcePoint.y;
        selectItem("source", state.source.id);
        addLog("Power-in source moved.");
      }
      if (tool.kind === "wire") {
        const wire = createWire(tool.color, tool.role, point.x, point.y);
        selectItem("wire", wire.id);
        addLog(`${tool.label} wire added.`);
      }
      if (tool.kind === "romex") {
        const cable = createRomexCable(tool.cableType, point.x, point.y);
        selectItem("cable", cable.id);
        addLog(`${cable.label} added with individually usable conductors.`);
      }
      if (tool.kind === "conduit") {
        const conduit = createConduit(tool.conduitType, point.x, point.y);
        selectItem("conduit", conduit.id);
        addLog(`${conduit.label} added. Drag each end onto a box knockout.`);
      }
    }
    evaluateTrips();
    render();
  }

  function createBox(x, y) {
    const point = clampPointForSize(snap(x), snap(y), BOX_SIZE);
    const box = { id: makeId("box"), label: `Box ${state.boxes.length + 1}`, x: point.x, y: point.y, openHoles: [] };
    state.boxes.push(box);
    return box;
  }

  function createDevice(type, x, y) {
    const point = clampPointForSize(snap(x), snap(y), deviceSizeForType(type));
    const device = {
      id: makeId("device"),
      type,
      x: point.x,
      y: point.y,
      boxId: null,
      slot: null,
      hotTab: type === "halfHotOutlet" ? false : true,
      neutralTab: true,
      tripped: false,
      on: false,
      position: "A",
      crossed: false,
      rotation: 0,
      pluggedTarget: null
    };
    state.devices.push(device);
    return device;
  }

  function createWire(color, role, x, y, options = {}) {
    const wire = {
      id: makeId("wire"),
      label: options.label || `${colorName(color)} ${role}`,
      color,
      role,
      cableId: options.cableId || null,
      a: options.a || { x: clamp(x - 58, 25, GRID.width - 25), y: clamp(y, 25, GRID.height - 25), connection: null },
      b: options.b || { x: clamp(x + 58, 25, GRID.width - 25), y: clamp(y, 25, GRID.height - 25), connection: null }
    };
    state.wires.push(wire);
    return wire;
  }

  function createRomexCable(type, x, y) {
    const def = ROMEX_DEFS[type];
    const point = clampPointForSize(snap(x), snap(y), { width: 180, height: 72 });
    const cable = {
      id: makeId("cable"),
      type,
      label: `${def.label} ${state.cables.length + 1}`,
      wireIds: []
    };
    const spread = def.conductors.length === 3 ? [-14, 0, 14] : [-18, -6, 6, 18];
    def.conductors.forEach((conductor, index) => {
      const yOffset = spread[index] || 0;
      const wire = createWire(conductor.color, conductor.role, point.x, point.y + yOffset, {
        cableId: cable.id,
        label: `${cable.label} ${colorName(conductor.color)} ${conductor.role}`,
        a: { x: clamp(point.x - 82, 25, GRID.width - 25), y: clamp(point.y + yOffset, 25, GRID.height - 25), connection: null },
        b: { x: clamp(point.x + 82, 25, GRID.width - 25), y: clamp(point.y + yOffset, 25, GRID.height - 25), connection: null }
      });
      cable.wireIds.push(wire.id);
    });
    state.cables.push(cable);
    return cable;
  }

  function createWireNut(x, y) {
    const point = clampPointForSize(snap(x), snap(y), WIRE_NUT_SIZE);
    const nut = { id: makeId("nut"), x: point.x, y: point.y };
    state.wireNuts.push(nut);
    return nut;
  }

  function createConduit(type, x, y) {
    const def = CONDUIT_DEFS[type] || CONDUIT_DEFS.conduitHalf;
    const point = clampPointForSize(snap(x), snap(y), { width: 220, height: 52 });
    const conduit = {
      id: makeId("conduit"),
      type,
      label: `${def.label} ${state.conduits.length + 1}`,
      tradeSize: def.tradeSize,
      a: { x: clamp(point.x - 88, 18, GRID.width - 18), y: clamp(point.y, 18, GRID.height - 18), connection: null },
      b: { x: clamp(point.x + 88, 18, GRID.width - 18), y: clamp(point.y, 18, GRID.height - 18), connection: null }
    };
    state.conduits.push(conduit);
    return conduit;
  }

  function applyNodeDrag(from, target, point) {
    if (from.kind === "conduitEndpoint") {
      applyConduitEndpointDrag(from, target, point);
      return;
    }
    if (from.kind !== "wireEndpoint") {
      addLog("Start from a wire end or conduit end, then drop onto a connector.");
      return;
    }
    const endpoint = getWireEndpoint(from.wireId, from.end);
    if (!endpoint) {
      return;
    }
    if (!target) {
      endpoint.connection = null;
      endpoint.x = clamp(point.x, 18, GRID.width - 18);
      endpoint.y = clamp(point.y, 18, GRID.height - 18);
      addLog("Wire end left open.");
      return;
    }
    if (target.kind === "wireEndpoint") {
      addLog("Wire ends need an actual wire nut. Drag a wire nut into the grid, then drag each wire end into it.");
      return;
    }
    if (target.kind === "deviceTerminal") {
      const terminal = terminalDef(target.deviceId, target.terminalKey);
      endpoint.connection = { kind: "deviceTerminal", deviceId: target.deviceId, terminalKey: target.terminalKey };
      addLog(`${wireById(from.wireId)?.label || "Wire"} connected to ${terminal?.label || "terminal"}.`);
      return;
    }
    if (target.kind === "boxGround") {
      endpoint.connection = { kind: "boxGround", boxId: target.boxId };
      addLog(`${wireById(from.wireId)?.label || "Wire"} attached to the box ground screw.`);
      return;
    }
    if (target.kind === "sourceTerminal") {
      endpoint.connection = { kind: "sourceTerminal", key: target.key };
      addLog(`${wireById(from.wireId)?.label || "Wire"} connected to power-in ${target.key}.`);
      return;
    }
    if (target.kind === "wireNut") {
      endpoint.connection = { kind: "wireNut", id: target.nutId };
      addLog("Wire end connected to a wire nut.");
      return;
    }
    if (target.kind === "boxHole") {
      endpoint.connection = { kind: "boxHole", boxId: target.boxId, holeKey: target.holeKey };
      openBoxHole(target.boxId, target.holeKey);
      addLog(`${wireById(from.wireId)?.label || "Wire"} routed through ${boxHoleLabel(target)}.`);
    }
  }

  function applyConduitEndpointDrag(from, target, point) {
    const conduit = conduitById(from.conduitId);
    const endpoint = conduit?.[from.end];
    if (!conduit || !endpoint) return;
    const sourceTarget = target?.kind === "sourceConduit" ? target : nearestSourceConduitAtPoint(point, 78);
    if (sourceTarget) {
      endpoint.connection = { kind: "sourceConduit" };
      addLog(`${conduit.label} locked to Power In conduit port.`);
      return;
    }
    const holeTarget = target?.kind === "boxHole" ? target : nearestBoxHoleAtPoint(point, 78);
    if (holeTarget) {
      endpoint.connection = { kind: "boxHole", boxId: holeTarget.boxId, holeKey: holeTarget.holeKey };
      openBoxHole(holeTarget.boxId, holeTarget.holeKey);
      addLog(`${conduit.label} locked to ${boxHoleLabel(holeTarget)}.`);
      return;
    }
    endpoint.connection = null;
    endpoint.x = clamp(point.x, 18, GRID.width - 18);
    endpoint.y = clamp(point.y, 18, GRID.height - 18);
    addLog(`${conduit.label} end left open. EMT ends lock to box knockouts or the Power In conduit port.`);
  }

  function buildGraph(activeGfcis = new Set()) {
    const uf = new UnionFind();
    Object.values(SOURCE_NODE).forEach((node) => uf.find(node));
    ["hot", "neutral", "ground"].forEach((key) => uf.find(sourceTerminalNode(key)));

    if (sourcePowerAvailable()) {
      uf.union(sourceTerminalNode("hot"), SOURCE_NODE.hot);
      uf.union(sourceTerminalNode("neutral"), SOURCE_NODE.neutral);
    }
    if (state.upstream.pluggedIn) {
      uf.union(sourceTerminalNode("ground"), SOURCE_NODE.ground);
    }

    state.boxes.forEach((box) => uf.find(boxGroundNode(box.id)));
    state.wireNuts.forEach((nut) => uf.find(wireNutNode(nut.id)));

    state.wires.forEach((wire) => {
      const a = wireEndpointNode(wire.id, "a");
      const b = wireEndpointNode(wire.id, "b");
      uf.find(a);
      uf.find(b);
      uf.union(a, b);
      ["a", "b"].forEach((end) => {
        const endpoint = wire[end];
        if (endpoint.connection && endpoint.connection.kind !== "boxHole") {
          uf.union(wireEndpointNode(wire.id, end), targetNode(endpoint.connection));
        }
      });
    });

    state.devices.forEach((device) => {
      DEVICE_DEFS[device.type].terminals.forEach((terminal) => uf.find(deviceTerminalNode(device.id, terminal.key)));
      applyDeviceInternals(uf, device, activeGfcis);
    });
    applyTestFaults(uf);
    return uf;
  }

  function analyzeCircuit() {
    let activeGfcis = new Set();
    let uf = null;
    let info = null;
    for (let pass = 0; pass < 6; pass += 1) {
      uf = buildGraph(activeGfcis);
      info = rootInfo(uf);
      const next = new Set();
      state.devices.forEach((device) => {
        if (device.type !== "gfciOutlet" || device.tripped) {
          return;
        }
        const lineHot = deviceTerminalNode(device.id, "lineHot");
        const lineNeutral = deviceTerminalNode(device.id, "lineNeutral");
        if (nodeHas(info, uf, lineHot, "hot") && nodeHas(info, uf, lineNeutral, "neutral")) {
          next.add(device.id);
        }
      });
      if (sameSet(activeGfcis, next)) {
        break;
      }
      activeGfcis = next;
    }
    const faults = findFaults(info);
    const devices = reportDevices(uf, info, activeGfcis, faults);
    return { uf, info, activeGfcis, faults, devices, testFaults: cloneValue(state.testFaults), sourceAvailable: sourcePowerAvailable() };
  }

  function applyDeviceInternals(uf, device, activeGfcis) {
    if (device.type === "standardOutlet" || device.type === "halfHotOutlet") {
      if (device.hotTab) {
        uf.union(deviceTerminalNode(device.id, "topHot"), deviceTerminalNode(device.id, "bottomHot"));
      }
      if (device.neutralTab) {
        uf.union(deviceTerminalNode(device.id, "topNeutral"), deviceTerminalNode(device.id, "bottomNeutral"));
      }
    }
    if (device.type === "gfciOutlet" && activeGfcis.has(device.id) && !device.tripped) {
      uf.union(deviceTerminalNode(device.id, "lineHot"), deviceTerminalNode(device.id, "loadHot"));
      uf.union(deviceTerminalNode(device.id, "lineNeutral"), deviceTerminalNode(device.id, "loadNeutral"));
    }
    if (device.type === "switch" && device.on) {
      uf.union(deviceTerminalNode(device.id, "line"), deviceTerminalNode(device.id, "load"));
    }
    if (device.type === "threeWaySwitch") {
      uf.union(deviceTerminalNode(device.id, "common"), deviceTerminalNode(device.id, device.position === "A" ? "travelerA" : "travelerB"));
    }
    if (device.type === "fourWaySwitch") {
      if (device.crossed) {
        uf.union(deviceTerminalNode(device.id, "inA"), deviceTerminalNode(device.id, "outB"));
        uf.union(deviceTerminalNode(device.id, "inB"), deviceTerminalNode(device.id, "outA"));
      } else {
        uf.union(deviceTerminalNode(device.id, "inA"), deviceTerminalNode(device.id, "outA"));
        uf.union(deviceTerminalNode(device.id, "inB"), deviceTerminalNode(device.id, "outB"));
      }
    }
  }

  function applyTestFaults(uf) {
    state.testFaults.forEach((fault) => {
      if (Array.isArray(fault.nodes) && fault.nodes.length >= 2) {
        const [first, second] = fault.nodes;
        uf.union(first, second);
        return;
      }
      const device = deviceById(fault.deviceId);
      if (!device || !Array.isArray(fault.terminals) || fault.terminals.length < 2) return;
      const [first, second] = fault.terminals;
      if (!terminalDef(device.id, first) || !terminalDef(device.id, second)) return;
      uf.union(deviceTerminalNode(device.id, first), deviceTerminalNode(device.id, second));
    });
  }

  function rootInfo(uf) {
    const map = new Map();
    uf.nodes().forEach((node) => {
      const root = uf.find(node);
      if (!map.has(root)) {
        map.set(root, { hot: false, neutral: false, ground: false, nodes: [] });
      }
      map.get(root).nodes.push(node);
    });
    markRoot(map, uf, SOURCE_NODE.hot, "hot");
    markRoot(map, uf, SOURCE_NODE.neutral, "neutral");
    markRoot(map, uf, SOURCE_NODE.ground, "ground");
    return map;
  }

  function markRoot(map, uf, node, key) {
    const root = uf.find(node);
    if (!map.has(root)) {
      map.set(root, { hot: false, neutral: false, ground: false, nodes: [node] });
    }
    map.get(root)[key] = true;
  }

  function findFaults(info) {
    const faults = [];
    info.forEach((root) => {
      if (root.hot && root.neutral) {
        faults.push({ type: "hot-neutral", severity: "trip", title: "Hot-neutral short", text: "Hot and neutral are tied together. The breaker trips for this overcurrent fault." });
      }
      if (root.hot && root.ground) {
        faults.push({ type: "hot-ground", severity: "trip", title: "Ground fault", text: "Hot is touching the equipment grounding path. The upstream GFCI trips first in this protected setup." });
      }
      if (root.neutral && root.ground && !root.hot) {
        faults.push({ type: "neutral-ground", severity: "warn", title: "Neutral-ground bond", text: "Neutral and equipment ground are tied downstream. This is not normal branch-circuit wiring." });
      }
    });
    return Array.from(new Map(faults.map((fault) => [fault.type, fault])).values());
  }

  function reportDevices(uf, info, activeGfcis, faults) {
    const reports = new Map();
    const faulted = faults.some((fault) => fault.severity === "trip");
    state.devices.forEach((device) => {
      const report = { status: [], warnings: [], energized: false, lit: false, active: false };
      if (device.type === "standardOutlet" || device.type === "halfHotOutlet") {
        const top = loadCanRun(uf, info, deviceTerminalNode(device.id, "topHot"), deviceTerminalNode(device.id, "topNeutral"), faulted);
        const bottom = loadCanRun(uf, info, deviceTerminalNode(device.id, "bottomHot"), deviceTerminalNode(device.id, "bottomNeutral"), faulted);
        report.energized = top || bottom;
        report.status.push(["Top receptacle", top ? "120 V" : "dead"]);
        report.status.push(["Bottom receptacle", bottom ? "120 V" : "dead"]);
        report.status.push(["Hot tab", device.hotTab ? "intact" : "split"]);
        report.status.push(["Neutral tab", device.neutralTab ? "intact" : "split"]);
      }
      if (device.type === "gfciOutlet") {
        const lineReady = nodeHas(info, uf, deviceTerminalNode(device.id, "lineHot"), "hot") &&
          nodeHas(info, uf, deviceTerminalNode(device.id, "lineNeutral"), "neutral");
        const backfed = nodeHas(info, uf, deviceTerminalNode(device.id, "loadHot"), "hot") &&
          nodeHas(info, uf, deviceTerminalNode(device.id, "loadNeutral"), "neutral") && !lineReady;
        report.active = activeGfcis.has(device.id) && !device.tripped;
        report.energized = report.active && !faulted;
        report.status.push(["LINE", lineReady ? "powered" : "not ready"]);
        report.status.push(["LOAD", report.active ? "protected power" : "open"]);
        report.status.push(["State", device.tripped ? "tripped" : "reset"]);
        if (backfed) {
          report.warnings.push("LINE and LOAD are reversed. The GFCI will not reset from LOAD-side feed.");
        }
      }
      if (device.type === "switch") {
        report.status.push(["Handle", device.on ? "closed" : "open"]);
        report.status.push(["Line", potentialLabel(info, uf, deviceTerminalNode(device.id, "line"))]);
        report.status.push(["Load", potentialLabel(info, uf, deviceTerminalNode(device.id, "load"))]);
      }
      if (device.type === "threeWaySwitch") {
        report.status.push(["Common", potentialLabel(info, uf, deviceTerminalNode(device.id, "common"))]);
        report.status.push(["Position", `common to ${device.position}`]);
      }
      if (device.type === "fourWaySwitch") {
        report.status.push(["Pattern", device.crossed ? "crossed" : "straight"]);
      }
      if (device.type === "lightBulb") {
        report.lit = loadCanRun(uf, info, deviceTerminalNode(device.id, "hot"), deviceTerminalNode(device.id, "neutral"), faulted);
        report.energized = report.lit;
        report.status.push(["Bulb", report.lit ? "lit" : "off"]);
      }
      if (device.type === "socketLight") {
        const target = device.pluggedTarget ? deviceById(device.pluggedTarget.deviceId) : null;
        const lit = target ? socketCanRun(uf, info, activeGfcis, target, device.pluggedTarget.receptacle, faulted) : false;
        report.lit = lit;
        report.energized = lit;
        report.status.push(["Plug", target ? `${DEVICE_DEFS[target.type].label} ${device.pluggedTarget.receptacle}` : "not plugged in"]);
        report.status.push(["Bulb", lit ? "lit" : "off"]);
      }
      reports.set(device.id, report);
    });
    return reports;
  }

  function evaluateTrips() {
    const result = analyzeCircuit();
    if (!result.sourceAvailable) {
      return;
    }
    if (result.faults.some((fault) => fault.type === "hot-ground")) {
      state.upstream.gfciTripped = true;
      state.upstream.lastTrip = { device: "upstreamGfci", title: "Upstream GFCI tripped", text: "Hot contacted ground on the protected load side." };
      addLog("Upstream GFCI tripped on a ground fault.");
      return;
    }
    if (result.faults.some((fault) => fault.type === "hot-neutral")) {
      state.upstream.breakerTripped = true;
      state.upstream.lastTrip = { device: "breaker", title: "Breaker tripped", text: "Hot and neutral were shorted together." };
      addLog("Breaker tripped on a hot-neutral short.");
    }
  }

  function render() {
    const result = analyzeCircuit();
    renderBenchControls();
    renderGridColorControls();
    renderHistoryControls();
    renderWireLayerModeControl();
    renderShortProbeControls();
    renderPalettes();
    renderSupplyActions();
    renderStatus(result);
    renderSandbox(result);
    renderInspector(result);
    renderDiagnostics(result);
    renderDiagnosticChat();
    renderLog();
    hydrateActionTooltips();
  }

  function renderPalettes() {
    el.toolPalette.innerHTML = renderPaletteGroups(TOOL_PALETTE, (tool) => `
      <button class="tool-button palette-button tool-${tool.id}" type="button" data-tool="${tool.id}" title="${escapeHtml(tool.label)}" aria-label="${escapeHtml(tool.label)}">
        <span class="palette-image">${renderToolArt(tool)}</span>
        <span class="palette-label">${escapeHtml(tool.shortLabel || tool.label)}</span>
      </button>
    `);
    el.devicePalette.innerHTML = renderPaletteGroups(DEVICE_PALETTE, (entry) => `
      <button class="device-button palette-button device-${entry.type}" type="button" data-device="${entry.type}" title="${escapeHtml(DEVICE_DEFS[entry.type].label)}" aria-label="${escapeHtml(DEVICE_DEFS[entry.type].label)}">
        <span class="palette-image">${renderDeviceArt(entry.type)}</span>
        <span class="palette-label">${escapeHtml(entry.shortLabel || DEVICE_DEFS[entry.type].label)}</span>
      </button>
    `);
  }

  function renderPaletteGroups(items, renderItem) {
    const groups = [];
    items.forEach((item) => {
      let group = groups.find((entry) => entry.category === item.category);
      if (!group) {
        group = { category: item.category || "Items", items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    return groups.map((group) => `
      <div class="palette-group">
        <div class="palette-group-title">${escapeHtml(group.category)}</div>
        <div class="palette-group-grid">
          ${group.items.map(renderItem).join("")}
        </div>
      </div>
    `).join("");
  }

  function uiIcon(name) {
    return `<svg class="ui-icon" aria-hidden="true" focusable="false"><use href="#icon-${escapeHtml(name)}"></use></svg>`;
  }

  function setControlContent(button, iconName, label) {
    if (!button) return;
    button.innerHTML = `${uiIcon(iconName)}<span class="cmd-label">${escapeHtml(label)}</span>`;
  }

  function tooltipTextFor(button) {
    const explicit = button.getAttribute("title") || button.getAttribute("aria-label");
    if (explicit) return explicit;
    return button.textContent.replace(/\s+/g, " ").trim();
  }

  function hydrateActionTooltips() {
    document.querySelectorAll("button, .grid-color-control").forEach((control) => {
      const label = tooltipTextFor(control);
      if (!label) return;
      control.dataset.tooltip = label;
      if (!control.getAttribute("aria-label") && !control.textContent.trim()) {
        control.setAttribute("aria-label", label);
      }
    });
  }

  function renderBenchControls() {
    applyBenchLayout();
    if (document.activeElement !== el.benchWidthInput && Number(el.benchWidthInput.value) !== state.bench.width) {
      el.benchWidthInput.value = state.bench.width;
    }
    if (document.activeElement !== el.benchHeightInput && Number(el.benchHeightInput.value) !== state.bench.height) {
      el.benchHeightInput.value = state.bench.height;
    }
    el.benchZoomLabel.textContent = `${Math.round(state.bench.zoom * 100)}%`;
  }

  function applyBenchLayout() {
    GRID.width = state.bench.width;
    GRID.height = state.bench.height;
    const cssWidth = Math.round(state.bench.width * state.bench.zoom);
    const cssHeight = Math.round(state.bench.height * state.bench.zoom);
    el.sandboxScrollSpace.style.width = `${cssWidth}px`;
    el.sandboxScrollSpace.style.height = `${cssHeight}px`;
    el.sandbox.style.setProperty("--bench-width", `${state.bench.width}px`);
    el.sandbox.style.setProperty("--bench-height", `${state.bench.height}px`);
    el.sandbox.style.setProperty("--grid-step", "32px");
    el.sandbox.style.width = `${state.bench.width}px`;
    el.sandbox.style.height = `${state.bench.height}px`;
    el.sandbox.style.transform = `scale(${state.bench.zoom})`;
    [el.wireLayer, el.selectedWireLayer].forEach((svg) => {
      svg.setAttribute("viewBox", `0 0 ${state.bench.width} ${state.bench.height}`);
    });
  }

  function renderGridColorControls() {
    applyGridColor(state.gridColor);
    if (el.gridColorPicker.value.toLowerCase() !== state.gridColor) {
      el.gridColorPicker.value = state.gridColor;
    }
    if (document.activeElement !== el.gridColorHex && el.gridColorHex.value.toLowerCase() !== state.gridColor) {
      el.gridColorHex.value = state.gridColor;
    }
    syncGridRgbControls(state.gridColor);
  }

  function renderHistoryControls() {
    el.undoButton.disabled = history.undo.length === 0;
    el.redoButton.disabled = history.redo.length === 0;
    el.loadButton.disabled = !hasSavedWorkState();
  }

  function renderWireLayerModeControl() {
    el.sandbox.classList.toggle("wires-behind-devices", state.wiresBehindDevices);
    if (!el.wireLayerModeButton) return;
    setControlContent(el.wireLayerModeButton, "layers", state.wiresBehindDevices ? "Wires behind" : "Wires front");
    el.wireLayerModeButton.classList.toggle("mode-on", state.wiresBehindDevices);
    el.wireLayerModeButton.setAttribute(
      "aria-pressed",
      state.wiresBehindDevices ? "true" : "false"
    );
    el.wireLayerModeButton.title = state.wiresBehindDevices
      ? "Wire paths are behind devices so switches and outlets are easier to click"
      : "Wire paths are in front and selectable by line";
  }

  function renderShortProbeControls() {
    const mode = activeFaultProbeMode();
    el.sandbox.classList.toggle("short-probe-mode", Boolean(mode));
    el.sandbox.dataset.probeMode = mode || "";
    if (el.groundFaultProbeButton) {
      const active = mode === "ground-fault";
      setControlContent(el.groundFaultProbeButton, "shield", "GFCI probe");
      el.groundFaultProbeButton.classList.toggle("mode-on", active);
      el.groundFaultProbeButton.setAttribute("aria-pressed", active ? "true" : "false");
      el.groundFaultProbeButton.title = active
        ? "Ground-fault probe is active. Click an energized receptacle or load to trip the upstream GFCI."
        : "Simulate leakage from hot to ground; a GFCI-protected circuit should trip the GFCI first.";
    }
    if (el.lineShortProbeButton) {
      const active = mode === "line-neutral";
      setControlContent(el.lineShortProbeButton, "zap", "L-N short");
      el.lineShortProbeButton.classList.toggle("mode-on", active);
      el.lineShortProbeButton.setAttribute("aria-pressed", active ? "true" : "false");
      el.lineShortProbeButton.title = active
        ? "Line-neutral short probe is active. Click a receptacle or load to simulate a hard short."
        : "Simulate hot tied to neutral; this trips the breaker, not the GFCI.";
    }
    if (el.clearShortsButton) {
      el.clearShortsButton.disabled = state.testFaults.length === 0;
      setControlContent(el.clearShortsButton, "eraser", state.testFaults.length ? `Clear faults (${state.testFaults.length})` : "Clear faults");
    }
  }

  function renderSupplyActions() {
    el.breakerActions.innerHTML = `
      <button type="button" data-action="toggle-breaker" title="${state.upstream.breakerOn ? "Turn breaker off" : "Turn breaker on"}">${uiIcon("power")}<span>${state.upstream.breakerOn ? "Breaker off" : "Breaker on"}</span></button>
      <button type="button" data-action="reset-breaker" title="Reset breaker">${uiIcon("reset")}<span>Reset</span></button>
    `;
    el.upstreamGfciActions.innerHTML = `
      <button type="button" data-action="test-upstream-gfci" title="Test upstream GFCI">${uiIcon("shield")}<span>Test</span></button>
      <button type="button" data-action="reset-upstream-gfci" title="Reset upstream GFCI">${uiIcon("reset")}<span>Reset</span></button>
    `;
  }

  function renderStatus(result) {
    const breakerClass = state.upstream.breakerTripped ? "trip" : state.upstream.breakerOn ? "ok" : "warn";
    const gfciClass = state.upstream.gfciTripped ? "trip" : "ok";
    el.supplyStatus.innerHTML = [
      pill("Breaker", state.upstream.breakerTripped ? "tripped" : state.upstream.breakerOn ? "on" : "off", breakerClass),
      pill("Upstream GFCI", state.upstream.gfciTripped ? "tripped" : "reset", gfciClass),
      pill("Power in", result.sourceAvailable ? "powered" : "off", result.sourceAvailable ? "ok" : "warn")
    ].join("");
    el.breakerLamp.className = `lamp-dot ${state.upstream.breakerTripped ? "tripped" : state.upstream.breakerOn ? "on" : ""}`;
    el.upstreamGfciLamp.className = `lamp-dot ${state.upstream.gfciTripped ? "tripped" : result.sourceAvailable ? "on" : ""}`;
  }

  function renderSandbox(result) {
    el.wireLayer.innerHTML = renderConduitPaths() + renderWirePaths({ selectedOnly: false });
    el.selectedWireLayer.innerHTML = renderWirePaths({ selectedOnly: true });
    el.boxLayer.innerHTML = [
      renderSource(result),
      ...state.boxes.map((box) => renderBox(box, result)),
      ...state.cables.map(renderRomexHandle),
      ...state.conduits.flatMap((conduit) => [renderConduitEndpoint(conduit, "a"), renderConduitEndpoint(conduit, "b")]),
      ...state.wireNuts.map(renderWireNut),
      ...state.devices.map((device) => renderDevice(device, result)),
      ...state.wires.flatMap((wire) => [renderWireEndpoint(wire, "a", result), renderWireEndpoint(wire, "b", result)]),
      ...state.wires.flatMap((wire) => [renderWireDetachGrip(wire, "a"), renderWireDetachGrip(wire, "b")])
    ].join("");
  }

  function renderSource(result) {
    const selected = isSelected("source", state.source.id);
    return `
      <div class="source-card ${selected ? "selected" : ""}" data-item-type="source" data-item-id="${state.source.id}" style="${posStyle(state.source.x, state.source.y)}">
        <span class="source-title">Power in</span>
        <button class="source-plug-button ${state.upstream.pluggedIn ? "on" : "off"}" type="button" data-action="toggle-plug" title="Toggle Power In">${state.upstream.pluggedIn ? "ON" : "OFF"}</button>
        ${["hot", "neutral", "ground"].map((key) => `
          <span class="grid-node source-terminal ${key} ${sourceNodeClass(key, result)} ${nodeConnectionClasses({ kind: "sourceTerminal", key })}"
            data-node-type="source-terminal" data-source-key="${key}" title="${key}"></span>
        `).join("")}
        <span class="grid-node source-conduit-node ${sourceConduitInUse() ? "connected" : ""}"
          data-node-type="source-conduit" title="Power In conduit port"></span>
      </div>
    `;
  }

  function renderBox(box) {
    const selected = isSelected("box", box.id);
    const holeUse = usedBoxHoles(box.id);
    const selectedWire = selectedItem()?.type === "wire" ? wireById(selectedItem().id) : null;
    return `
      <div class="box-card box-4x4 ${selected ? "selected" : ""}" data-item-type="box" data-item-id="${box.id}" style="${posStyle(box.x, box.y)}">
        <span class="box-title"><span>${escapeHtml(box.label)}</span><span>4x4</span></span>
        <span class="box-knockouts">${BOX_HOLES.map((hole) => renderBoxHole(box, hole, holeUse.used.has(hole.key), holeUse.conduitUsed.has(hole.key), selectedWire?.manualHoles?.[box.id] === hole.key)).join("")}</span>
        <span class="grid-node box-ground-node screw-green ${nodeConnectionClasses({ kind: "boxGround", boxId: box.id })}" data-node-type="box-ground" data-box-id="${box.id}" title="Box ground screw"></span>
      </div>
    `;
  }

  function renderBoxHole(box, hole, used, conduitUsed, selectedWireRoute) {
    return `
      <span class="grid-node box-hole-node open ${used ? "used" : ""} ${conduitUsed ? "conduit-used" : ""} ${selectedWireRoute ? "selected-wire-route" : ""}"
        data-node-type="box-hole" data-box-id="${box.id}" data-hole-key="${hole.key}"
        style="left:${BOX_SIZE.width / 2 + hole.x}px; top:${BOX_SIZE.height / 2 + hole.y}px"
        title="${escapeHtml(hole.label)} - open knockout"></span>
    `;
  }

  function renderRomexHandle(cable) {
    const point = cableCenter(cable);
    if (!point) return "";
    const selected = isSelected("cable", cable.id);
    const conductorCount = cable.wireIds.map(wireById).filter(Boolean).length;
    return `
      <div class="romex-handle ${cable.type} ${selected ? "selected" : ""}" data-item-type="cable" data-item-id="${cable.id}" style="${posStyle(point.x, point.y)}" title="${escapeHtml(cable.label)}">
        <span class="romex-jacket"></span>
        <span class="romex-conductor-count">${conductorCount}</span>
      </div>
    `;
  }

  function renderDevice(device, result) {
    const selected = isSelected("device", device.id);
    const pos = devicePosition(device);
    const report = result.devices.get(device.id);
    const size = deviceSize(device);
    const baseSize = deviceSizeForType(device.type);
    const rotation = deviceRotation(device);
    const faulted = deviceHasActiveTestFault(device) ? "faulted" : "";
    return `
      <div class="device-card ${device.type} rotation-${rotation} ${selected ? "selected" : ""} ${faulted} ${device.boxId ? "in-box" : ""} ${device.pluggedTarget ? "plugged" : ""} ${socketTesterSideClass(device)}" data-item-type="device" data-item-id="${device.id}" data-rotation="${rotation}"
        style="${posStyle(pos.x, pos.y)}; width:${size.width}px; height:${size.height}px">
        <div class="device-rotor" style="width:${baseSize.width}px; height:${baseSize.height}px; transform: translate(-50%, -50%) rotate(${rotation}deg)">
          ${renderDeviceFace(device, report)}
          ${DEVICE_DEFS[device.type].terminals.map((terminal) => renderTerminal(device, terminal, result)).join("")}
        </div>
        <span class="device-caption">${escapeHtml(DEVICE_DEFS[device.type].label)}</span>
      </div>
    `;
  }

  function renderDeviceFace(device, report) {
    if (device.type === "lightBulb") {
      return `<span class="device-face light ${report?.lit ? "lit" : ""}"></span>`;
    }
    if (device.type === "socketLight") {
      return `<span class="device-face socket-light ${report?.lit ? "lit" : ""}"><span class="socket-plug-marker"></span><span class="socket-shell"></span><span class="socket-glow"></span><span class="socket-prongs"></span></span>`;
    }
    if (device.type === "gfciOutlet") {
      return `
        <span class="device-face gfci realistic-gfci ${device.tripped ? "tripped" : "reset"}">
          <span class="gfci-terminal-label gfci-line-label">IN</span>
          <span class="gfci-slots top"></span>
          <button class="gfci-reset" type="button" data-gfci-action="reset" aria-label="Reset GFCI">RESET</button>
          <button class="gfci-test" type="button" data-gfci-action="test" aria-label="Test GFCI">TEST</button>
          <span class="gfci-slots bottom"></span>
          <span class="gfci-terminal-label gfci-load-label">OUT</span>
        </span>
      `;
    }
    if (device.type === "switch" || device.type === "threeWaySwitch" || device.type === "fourWaySwitch") {
      return `
        <span class="device-face switch ${switchOnClass(device)}">
          <button type="button" class="switch-toggle" data-switch-action="toggle" aria-label="Toggle switch" aria-pressed="${switchOnClass(device) ? "true" : "false"}" title="Toggle switch">
            <span class="switch-throw"></span>
          </button>
          <span class="switch-state">${escapeHtml(switchStateLabel(device))}</span>
        </span>
      `;
    }
    return `<span class="device-face outlet grounded"></span>`;
  }

  function renderTerminal(device, terminal, result) {
    const potential = potentialLabel(result.info, result.uf, deviceTerminalNode(device.id, terminal.key));
    const target = { kind: "deviceTerminal", deviceId: device.id, terminalKey: terminal.key };
    return `
      <span class="grid-node terminal-node screw-${terminal.screw} ${potential} ${nodeConnectionClasses(target)}"
        data-node-type="device-terminal" data-device-id="${device.id}" data-terminal-key="${terminal.key}"
        style="left:${terminal.x}px; top:${terminal.y}px" title="${escapeHtml(terminal.label)}"></span>
    `;
  }

  function renderWireNut(nut) {
    const selected = isSelected("wireNut", nut.id);
    return `
      <div class="wire-nut-item ${selected ? "selected" : ""}" data-item-type="wireNut" data-item-id="${nut.id}" style="${posStyle(nut.x, nut.y)}">
        <span class="grid-node wire-nut-node ${nodeConnectionClasses({ kind: "wireNut", id: nut.id })}" data-node-type="wire-nut" data-nut-id="${nut.id}" title="Wire nut"></span>
      </div>
    `;
  }

  function renderConduitPaths() {
    return state.conduits.map((conduit) => {
      const a = conduitEndpointPoint(conduit.id, "a");
      const b = conduitEndpointPoint(conduit.id, "b");
      const def = CONDUIT_DEFS[conduit.type] || CONDUIT_DEFS.conduitHalf;
      const selected = isSelected("conduit", conduit.id);
      const path = smoothPolylinePath([a, b]);
      return `
        <path class="conduit-path ${selected ? "selected" : ""}" data-conduit-path="${conduit.id}" data-item-type="conduit" data-item-id="${conduit.id}" d="${path}" style="--conduit-width:${def.diameter}px"></path>
        <path class="conduit-hit-path" data-conduit-path="${conduit.id}" data-item-type="conduit" data-item-id="${conduit.id}" d="${path}"></path>
      `;
    }).join("");
  }

  function renderConduitEndpoint(conduit, end) {
    const point = conduitEndpointPoint(conduit.id, end);
    const connected = conduit[end]?.connection ? "connected" : "";
    return `
      <span class="grid-node conduit-end-node ${connected}" data-node-type="conduit-end" data-conduit-id="${conduit.id}" data-conduit-end="${end}"
        data-item-type="conduit" data-item-id="${conduit.id}" style="${posStyle(point.x, point.y)}" title="${escapeHtml(conduit.label)} end ${end.toUpperCase()}"></span>
    `;
  }

  function renderWireRouteControls(wire) {
    const boxIds = wireRoutableBoxIds(wire);
    if (!boxIds.length) {
      return `<div class="diagram-help">This wire is not currently routed through a box. Put an endpoint inside/on a box first, then click a side knockout to override its path.</div>`;
    }
    const manualHoles = wire.manualHoles || {};
    const rows = boxIds.map((boxId) => {
      const box = boxById(boxId);
      const holeKey = manualHoles[boxId];
      const hole = BOX_HOLES.find((entry) => entry.key === holeKey);
      const status = hole ? `Manual: ${hole.label}` : "Auto";
      return `
        <div class="connection-row">
          <div>
            <div class="terminal-name">${escapeHtml(box?.label || "Box")} knockout path</div>
            <div class="connection-detail">${escapeHtml(status)}</div>
          </div>
        </div>
      `;
    }).join("");
    const hasManual = Object.keys(manualHoles).some((boxId) => boxIds.includes(boxId));
    return `
      <div class="diagram-help">Manual path: click any side knockout on one of these boxes while this wire is selected.</div>
      ${rows}
      ${hasManual ? `<div class="button-row"><button type="button" data-action="clear-wire-routes" title="Return this wire to automatic knockout routing">${uiIcon("reset")}<span>Auto route</span></button></div>` : ""}
    `;
  }

  function renderWireEndpoint(wire, end, result) {
    const point = wireEndpointPoint(wire.id, end);
    const status = potentialLabel(result.info, result.uf, wireEndpointNode(wire.id, end));
    const landed = wire[end].connection ? "landed" : "";
    const selected = isSelected("wire", wire.id) ? "selected" : "";
    return `
      <span class="grid-node wire-end-node ${wire.color} ${status} ${landed} ${selected}" data-node-type="wire-end" data-wire-id="${wire.id}" data-wire-end="${end}"
        data-item-type="wire" data-item-id="${wire.id}" style="${posStyle(point.x, point.y)}" title="${escapeHtml(wire.label)} ${end.toUpperCase()}"></span>
    `;
  }

  function renderWireDetachGrip(wire, end) {
    if (!isSelected("wire", wire.id) || !wire[end].connection) {
      return "";
    }
    const point = wireDetachGripPoint(wire, end);
    return `
      <span class="grid-node wire-detach-grip ${wire.color}" data-node-type="wire-end" data-wire-id="${wire.id}" data-wire-end="${end}"
        data-item-type="wire" data-item-id="${wire.id}" style="${posStyle(point.x, point.y)}" title="Drag this handle to remove ${escapeHtml(wire.label)} end ${end.toUpperCase()} from ${escapeHtml(connectionText(wire[end].connection))}"></span>
    `;
  }

  function renderWirePaths({ selectedOnly = false } = {}) {
    const wires = state.wires.filter((wire) => isSelected("wire", wire.id) === selectedOnly);
    const cableSheaths = selectedOnly ? [] : state.cables.map(renderRomexSheath);
    const hitPaths = selectedOnly ? [] : state.wires.map((wire) => {
      const path = wireHitPath(wire);
      return path ? `<path class="wire-hit-path" data-wire-path="${wire.id}" data-item-type="wire" data-item-id="${wire.id}" d="${path}"></path>` : "";
    });
    const paths = wires.map((wire) => {
      const path = wirePath(wire);
      const selected = isSelected("wire", wire.id);
      return `${selected ? `<path class="wire-select-halo ${wire.color}" d="${path}"></path>` : ""}<path class="wire-path ${wire.color} ${selected ? "selected" : ""}" data-wire-path="${wire.id}" data-item-type="wire" data-item-id="${wire.id}" d="${path}"></path>${renderWireCopperEnds(wire, selected)}`;
    });
    return hitPaths.concat(cableSheaths, paths).join("");
  }

  function renderRomexSheath(cable) {
    const conductors = cable.wireIds.map(wireById).filter(Boolean);
    if (!conductors.length) return "";
    const path = wirePath(conductors[0]);
    return `<path class="romex-sheath ${cable.type} ${isSelected("cable", cable.id) ? "selected" : ""}" d="${path}"></path>`;
  }

  function averageWireEndpoint(wires, end) {
    const total = wires.reduce((sum, wire) => {
      const point = wireEndpointPoint(wire.id, end);
      return { x: sum.x + point.x, y: sum.y + point.y };
    }, { x: 0, y: 0 });
    return { x: total.x / wires.length, y: total.y / wires.length };
  }

  function cableCenter(cable) {
    const conductors = cable?.wireIds.map(wireById).filter(Boolean) || [];
    if (!conductors.length) return null;
    const a = averageWireEndpoint(conductors, "a");
    const b = averageWireEndpoint(conductors, "b");
    const controls = curveControls(a, b);
    return cubicPoint(a, controls.c1, controls.c2, b, 0.5);
  }

  function conduitCenter(conduit) {
    if (!conduit) return null;
    const a = conduitEndpointPoint(conduit.id, "a");
    const b = conduitEndpointPoint(conduit.id, "b");
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function renderWireCopperEnds(wire, selected) {
    return ["a", "b"].map((end) => {
      const segment = wireCopperSegment(wire, end);
      if (!segment) return "";
      return `<path class="wire-copper-end ${selected ? "selected" : ""}" d="M ${segment.a.x} ${segment.a.y} L ${segment.b.x} ${segment.b.y}"></path>`;
    }).join("");
  }

  function renderInspector(result) {
    const selected = selectedItem();
    if (!selected) {
      el.boxInspector.innerHTML = `<div class="empty-state">Drag a box, device, wire, wire nut, or power source into the grid.</div>`;
      return;
    }
    if (selected.type === "device") {
      const device = deviceById(selected.id);
      const report = result.devices.get(selected.id);
      const placementLabel = device.type === "socketLight" && device.pluggedTarget ? "plugged in" : device.boxId ? "in box" : "floating";
      const placementMeter = device.type === "socketLight" && device.pluggedTarget ? "hot" : device.boxId ? "ground" : "open";
      el.boxInspector.innerHTML = `
        <div class="section-heading"><h2>${escapeHtml(DEVICE_DEFS[device.type].label)}</h2><span class="meter ${placementMeter}">${placementLabel}</span></div>
        <div class="diagram-help">${escapeHtml(deviceHelp(device.type))}</div>
        ${renderDeviceFaultControls(device)}
        ${report ? renderReport(report) : ""}
      `;
      return;
    }
    if (selected.type === "box") {
      const box = boxById(selected.id);
      el.boxInspector.innerHTML = `
        <div class="section-heading"><h2>${escapeHtml(box.label)}</h2><span class="meter ground">4x4</span></div>
        <div class="diagram-help">This box has a green ground screw and twelve always-open side knockouts. Wires and Romex auto-route through the nearest sensible knockout; select a wire, then click a knockout to force that wire's path through it.</div>
      `;
      return;
    }
    if (selected.type === "wire") {
      const wire = wireById(selected.id);
      const cable = wire.cableId ? cableById(wire.cableId) : null;
      el.boxInspector.innerHTML = `
        <div class="section-heading"><h2>${escapeHtml(wire.label)}</h2><span class="meter open">copper conductor</span></div>
        <div class="diagram-help">Jacket color is only a labeling convention here; the conductor behaves as copper regardless of color. ${cable ? `This conductor is part of ${cable.label}. ` : ""}To change its path, select this wire and click the knockout you want it to use on the relevant box.</div>
        ${["a", "b"].map((end) => `<div class="connection-row"><div><div class="terminal-name">End ${end.toUpperCase()}</div><div class="connection-detail">${escapeHtml(connectionText(wire[end].connection))}</div></div></div>`).join("")}
        ${renderWireRouteControls(wire)}
      `;
      return;
    }
    if (selected.type === "wireNut") {
      el.boxInspector.innerHTML = `
        <div class="section-heading"><h2>Wire nut</h2><span class="meter hot">splice</span></div>
        <div class="diagram-help">Drag wire ends to this nut to splice those conductors together. To remove one conductor from a crowded nut, select that wire by its line and pull the blue handle beside the nut.</div>
      `;
      return;
    }
    if (selected.type === "cable") {
      const cable = cableById(selected.id);
      el.boxInspector.innerHTML = `
        <div class="section-heading"><h2>${escapeHtml(cable?.label || "Romex cable")}</h2><span class="meter open">jacketed cable</span></div>
        <div class="diagram-help">Drag the yellow jacket handle to move the Romex as one cable. Each conductor can still be selected and wired independently.</div>
      `;
      return;
    }
    if (selected.type === "conduit") {
      const conduit = conduitById(selected.id);
      el.boxInspector.innerHTML = `
        <div class="section-heading"><h2>${escapeHtml(conduit?.label || "Conduit")}</h2><span class="meter open">${escapeHtml(conduit?.tradeSize || "EMT")}</span></div>
        <div class="diagram-help">Drag each EMT end onto a box side knockout. Use the rotate buttons or right-click menu to turn a loose EMT 90 degrees; if one end is locked, the free end swings around that knockout.</div>
        <div class="button-row">
          <button type="button" data-action="rotate-selected-ccw" title="Rotate 90 degrees counterclockwise">${uiIcon("rotate-ccw")}<span>Rotate CCW</span></button>
          <button type="button" data-action="rotate-selected-cw" title="Rotate 90 degrees clockwise">${uiIcon("rotate-cw")}<span>Rotate CW</span></button>
        </div>
      `;
      return;
    }
    if (selected.type === "group") {
      const items = selectedItems();
      el.boxInspector.innerHTML = `
        <div class="section-heading"><h2>${items.length} selected</h2><span class="meter open">marquee</span></div>
        <div class="diagram-help">Drag across the board to select multiple items. Press Delete or right-click the selected group to remove everything selected except the fixed power source.</div>
      `;
      return;
    }
    el.boxInspector.innerHTML = `
      <div class="section-heading"><h2>Power in</h2><span class="meter ${result.sourceAvailable ? "hot" : "open"}">${result.sourceAvailable ? "powered" : "off"}</span></div>
      <div class="diagram-help">This represents the already-plugged-in power cable: black hot, white neutral, and green ground. Connect separate wires to these terminals to begin a circuit.</div>
    `;
  }

  function renderDiagnostics(result) {
    const rows = diagnosticRows(result);
    state.lastDiagnostics = rows;
    el.diagnostics.innerHTML = rows.map((row) => `
      <div class="diagnostic-row ${row.severity}">
        <div class="diagnostic-title">${escapeHtml(row.title)}</div>
        <div class="diagnostic-text">${escapeHtml(row.text)}</div>
      </div>
    `).join("");
  }

  function diagnosticRows(result) {
    const rows = [];
    rows.push({
      severity: result.sourceAvailable ? "ok" : "warn",
      title: "Power-in source",
      text: result.sourceAvailable ? "The independent power cable source is energized." : "The independent power cable source is not supplying hot/neutral."
    });
    if (state.upstream.lastTrip) {
      rows.push({ severity: "trip", title: state.upstream.lastTrip.title, text: state.upstream.lastTrip.text });
    }
    if (result.testFaults?.length) {
      rows.push({
        severity: "trip",
        title: "Active test fault",
        text: result.testFaults.map((fault) => fault.label).join("; ")
      });
    }
    result.faults.forEach((fault) => rows.push(fault));
    if (rows.length === 1 && result.sourceAvailable) {
      rows.push({ severity: "ok", title: "No detected faults", text: "No hot-neutral or hot-ground fault is currently detected." });
    }
    return rows;
  }

  function renderDiagnosticChat() {
    el.diagnosticChatMessages.innerHTML = state.chat.messages.map((message) => `
      <div class="chat-message ${message.role}">
        <div class="chat-role">${message.role === "user" ? "You" : "Diagnostic assistant"}</div>
        <div class="chat-text">${escapeHtml(message.text)}</div>
      </div>
    `).join("");
    el.diagnosticProposal.innerHTML = state.chat.pendingProposal ? `
      <div class="proposal-card">
        <div>
          <div class="proposal-title">${escapeHtml(state.chat.pendingProposal.title || "Suggested simulator update")}</div>
          <div class="proposal-text">${escapeHtml(state.chat.pendingProposal.reason || "Apply the assistant's suggested correction to this run.")}</div>
        </div>
        <div class="proposal-actions">
          <button type="button" data-action="accept-ai-fix" title="Accept suggested simulator update">${uiIcon("check")}<span>Accept</span></button>
          <button type="button" data-action="dismiss-ai-fix" title="Dismiss suggested simulator update">${uiIcon("x")}<span>Dismiss</span></button>
        </div>
      </div>
    ` : "";
    el.diagnosticChatStatus.textContent = state.chat.busy ? "Checking the simulator state..." : diagnosticChatModeText();
    el.diagnosticChatInput.disabled = state.chat.busy;
    el.diagnosticChatForm.querySelector("button").disabled = state.chat.busy;
  }

  function diagnosticChatModeText() {
    return "Uses the local AI proxy when available; otherwise uses the built-in circuit verifier.";
  }

  function simulatorSnapshot(result) {
    return {
      upstream: {
        breakerOn: state.upstream.breakerOn,
        breakerTripped: state.upstream.breakerTripped,
        gfciTripped: state.upstream.gfciTripped,
        pluggedIn: state.upstream.pluggedIn,
        lastTrip: state.upstream.lastTrip
      },
      sourceAvailable: result.sourceAvailable,
      diagnostics: diagnosticRows(result),
      testFaults: cloneValue(state.testFaults),
      boxes: state.boxes.map((box) => ({
        id: box.id,
        label: box.label,
        ground: {
          potential: potentialLabel(result.info, result.uf, boxGroundNode(box.id)),
          connection: connectionTextForTarget({ kind: "boxGround", boxId: box.id })
        }
      })),
      wires: state.wires.map((wire) => ({
        id: wire.id,
        label: wire.label,
        role: wire.role,
        color: wire.color,
        cableId: wire.cableId,
        a: connectionText(wire.a.connection),
        b: connectionText(wire.b.connection)
      })),
      cables: state.cables.map((cable) => ({
        id: cable.id,
        label: cable.label,
        type: cable.type,
        wireIds: cable.wireIds
      })),
      devices: state.devices.map((device) => {
        const report = result.devices.get(device.id);
        return {
          id: device.id,
          type: device.type,
          label: DEVICE_DEFS[device.type].label,
          boxId: device.boxId,
          boxLabel: device.boxId ? boxById(device.boxId)?.label || "" : "",
          pluggedTarget: device.pluggedTarget,
          switchState: device.type === "switch" ? (device.on ? "on" : "off") : switchStateLabel(device),
          terminals: DEVICE_DEFS[device.type].terminals.map((terminal) => ({
            key: terminal.key,
            label: terminal.label,
            role: terminal.role,
            potential: potentialLabel(result.info, result.uf, deviceTerminalNode(device.id, terminal.key)),
            connection: connectionTextForTarget({ kind: "deviceTerminal", deviceId: device.id, terminalKey: terminal.key })
          })),
          report: report ? {
            status: report.status,
            warnings: report.warnings,
            energized: report.energized,
            lit: report.lit,
            active: report.active
          } : null
        };
      }),
      wireNuts: state.wireNuts.map((nut) => ({
        id: nut.id,
        connectionCount: state.wires.flatMap((wire) => [wire.a.connection, wire.b.connection]).filter((connection) => connection?.kind === "wireNut" && connection.id === nut.id).length
      }))
    };
  }

  function renderLog() {
    el.eventLog.innerHTML = state.log.slice(-18).reverse().map((entry) => `<div class="log-row">${escapeHtml(entry)}</div>`).join("");
  }

  function renderReport(report) {
    return `
      <div class="device-report">
        ${report.status.map(([label, value]) => `
          <dl class="report-cell"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></dl>
        `).join("")}
      </div>
      ${report.warnings.map((warning) => `<div class="diagnostic-row warn"><div class="diagnostic-title">Device nuance</div><div class="diagnostic-text">${escapeHtml(warning)}</div></div>`).join("")}
    `;
  }

  function renderDeviceFaultControls(device) {
    if (!device) return "";
    const hasFault = deviceHasActiveTestFault(device);
    let controls = "";
    const faultIcon = activeFaultProbeMode() === "line-neutral" ? "zap" : "shield";
    if (isOutletDevice(device)) {
      controls = `
        <button type="button" data-action="short-selected-top">${uiIcon(faultIcon)}<span>${activeFaultProbeMode() === "line-neutral" ? "L-N top" : "Ground top"}</span></button>
        <button type="button" data-action="short-selected-bottom">${uiIcon(faultIcon)}<span>${activeFaultProbeMode() === "line-neutral" ? "L-N bottom" : "Ground bottom"}</span></button>
      `;
    } else if (device.type === "lightBulb") {
      controls = `<button type="button" data-action="short-selected-device">${uiIcon(faultIcon)}<span>${activeFaultProbeMode() === "line-neutral" ? "L-N bulb" : "Ground bulb"}</span></button>`;
    } else if (device.type === "socketLight" && device.pluggedTarget) {
      controls = `<button type="button" data-action="short-selected-device">${uiIcon(faultIcon)}<span>${activeFaultProbeMode() === "line-neutral" ? "L-N receptacle" : "Ground receptacle"}</span></button>`;
    }
    if (!controls && !hasFault) return "";
    return `
      <div class="button-row fault-controls">
        ${controls}
        ${hasFault ? `<button type="button" data-action="clear-selected-shorts">${uiIcon("eraser")}<span>Clear fault</span></button>` : ""}
      </div>
    `;
  }

  function deviceHasActiveTestFault(device) {
    if (!device) return false;
    return state.testFaults.some((fault) => fault.deviceId === device.id || (device.type === "socketLight" && fault.deviceId === device.pluggedTarget?.deviceId));
  }

  function renderToolArt(tool) {
    if (tool.kind === "box") return `<span class="art art-box"></span>`;
    if (tool.kind === "wireNut") return `<span class="art art-nut"></span>`;
    if (tool.kind === "power") return `<span class="art art-cable"><i></i><i></i><i></i></span>`;
    if (tool.kind === "romex") return `<span class="art art-romex ${tool.cableType === "romex3" ? "three" : ""}"><i></i><i></i><i></i></span>`;
    if (tool.kind === "conduit") return `<span class="art art-conduit"></span>`;
    return `<span class="art art-single-wire ${tool.color}"></span>`;
  }

  function renderDeviceArt(type) {
    if (type === "gfciOutlet") return `<span class="art-device gfci"><i></i><i></i><b></b></span>`;
    if (type === "lightBulb") return `<span class="art-device bulb"></span>`;
    if (type === "socketLight") return `<span class="art-device socket-bulb"></span>`;
    if (type === "switch" || type === "threeWaySwitch" || type === "fourWaySwitch") return `<span class="art-device switch"><i></i></span>`;
    return `<span class="art-device outlet"><i></i><i></i></span>`;
  }

  function snapDeviceToBox(device) {
    if (!device) return;
    if (device.type === "socketLight") {
      snapSocketLight(device);
      return;
    }
    const box = state.boxes.find((candidate) => pointInsideBox(device.x, device.y, candidate));
    if (!box) {
      device.boxId = null;
      device.slot = null;
      return;
    }
    const existing = state.devices.filter((entry) => entry.id !== device.id && entry.boxId === box.id);
    if (device.type === "lightBulb") {
      if (existing.length === 0) {
        device.boxId = box.id;
        device.slot = "full";
      }
      return;
    }
    if (existing.some((entry) => entry.type === "lightBulb")) {
      return;
    }
    const occupied = new Set(existing.map((entry) => entry.slot));
    const slot = occupied.has("left") ? occupied.has("right") ? null : "right" : "left";
    if (slot) {
      device.boxId = box.id;
      device.slot = slot;
    }
  }

  function snapSocketLight(device) {
    if (!device) return;
    const target = nearestOutletSocket(device.x, device.y);
    if (target) {
      device.pluggedTarget = target;
      const point = socketTesterPoint(target.deviceId, target.receptacle);
      device.x = point.x;
      device.y = point.y;
      addLog(`Socket lightbulb plugged into ${target.receptacle} receptacle.`);
      return;
    }
    device.pluggedTarget = null;
  }

  function nearestOutletSocket(x, y) {
    let best = null;
    state.devices.forEach((device) => {
      if (!isOutletDevice(device)) return;
      ["top", "bottom"].forEach((receptacle) => {
        const point = socketTargetPoint(device.id, receptacle);
        const distance = Math.hypot(point.x - x, point.y - y);
        if (distance <= 58 && (!best || distance < best.distance)) {
          best = { deviceId: device.id, receptacle, distance };
        }
      });
    });
    return best ? { deviceId: best.deviceId, receptacle: best.receptacle } : null;
  }

  function devicePosition(device) {
    if (device?.type === "socketLight" && device.pluggedTarget) {
      return socketTesterPoint(device.pluggedTarget.deviceId, device.pluggedTarget.receptacle);
    }
    if (!device.boxId) {
      return { x: device.x, y: device.y };
    }
    const box = boxById(device.boxId);
    if (!box) {
      return { x: device.x, y: device.y };
    }
    if (device.slot === "full") {
      return { x: box.x, y: box.y + 8 };
    }
    return { x: box.x + (device.slot === "left" ? -48 : 48), y: box.y + 8 };
  }

  function deviceSize(device) {
    const base = deviceSizeForType(device?.type);
    const rotation = deviceRotation(device);
    if (rotation === 90 || rotation === 270) {
      return { width: base.height, height: base.width };
    }
    return base;
  }

  function deviceSizeForType(type) {
    if (type === "lightBulb") return DEVICE_SIZE.light;
    if (type === "socketLight") return DEVICE_SIZE.socketLight;
    return DEVICE_SIZE.narrow;
  }

  function isRotatableDevice(device) {
    return Boolean(device && ROTATABLE_DEVICE_TYPES.has(device.type));
  }

  function deviceRotation(device) {
    return normalizeRotation(Number(device?.rotation || 0));
  }

  function normalizeRotation(value) {
    const numeric = Number.isFinite(value) ? value : 0;
    return ((Math.round(numeric / 90) * 90) % 360 + 360) % 360;
  }

  function rotateDeviceOffset(device, x, y) {
    const angle = (deviceRotation(device) * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos
    };
  }

  function rotatedDeviceLocalPoint(device, x, y) {
    const base = deviceSizeForType(device?.type);
    return rotateDeviceOffset(device, x - base.width / 2, y - base.height / 2);
  }

  function socketTargetPoint(deviceId, receptacle) {
    const target = deviceById(deviceId);
    if (!target) return { x: 0, y: 0 };
    const pos = devicePosition(target);
    const offsets = target.type === "gfciOutlet" ? { top: -36, bottom: 39 } : { top: -22, bottom: 22 };
    const yOffset = offsets[receptacle] ?? offsets.top;
    const offset = rotateDeviceOffset(target, 0, yOffset);
    return { x: pos.x + offset.x, y: pos.y + offset.y };
  }

  function socketTesterPoint(deviceId, receptacle) {
    const anchor = socketTargetPoint(deviceId, receptacle);
    return clampPointForSize(anchor.x, anchor.y, DEVICE_SIZE.socketLight);
  }

  function socketTesterSideClass(device) {
    if (device?.type !== "socketLight" || !device.pluggedTarget) return "";
    const anchor = socketTargetPoint(device.pluggedTarget.deviceId, device.pluggedTarget.receptacle);
    const pos = devicePosition(device);
    return pos.x < anchor.x ? "plug-left" : "plug-right";
  }

  function isOutletDevice(device) {
    return Boolean(device && ["standardOutlet", "halfHotOutlet", "gfciOutlet"].includes(device.type));
  }

  function moveItem(type, id, x, y) {
    if (type === "source") {
      const point = clampPointForSize(x, y, SOURCE_SIZE);
      state.source.x = point.x;
      state.source.y = point.y;
    }
    if (type === "box") {
      const box = boxById(id);
      if (box) {
        const point = clampPointForSize(x, y, BOX_SIZE);
        box.x = point.x;
        box.y = point.y;
      }
    }
    if (type === "device") {
      const device = deviceById(id);
      if (device) {
        const size = deviceSize(device);
        const point = clampPointForSize(x, y, size);
        device.x = point.x;
        device.y = point.y;
      }
    }
    if (type === "wireNut") {
      const nut = wireNutById(id);
      if (nut) {
        const point = clampPointForSize(x, y, WIRE_NUT_SIZE);
        nut.x = point.x;
        nut.y = point.y;
      }
    }
    if (type === "conduit") {
      const conduit = conduitById(id);
      if (conduit) {
        const center = conduitCenter(conduit);
        moveConduitFromStart(id, cloneValue({ a: conduit.a, b: conduit.b }), x - center.x, y - center.y);
      }
    }
  }

  function itemPosition(type, id) {
    if (type === "source") return { x: state.source.x, y: state.source.y };
    if (type === "box") return boxById(id);
    if (type === "device") return devicePosition(deviceById(id));
    if (type === "cable") return cableCenter(cableById(id)) || { x: 0, y: 0 };
    if (type === "conduit") return conduitCenter(conduitById(id)) || { x: 0, y: 0 };
    if (type === "wireNut") return wireNutById(id);
    return { x: 0, y: 0 };
  }

  function deleteSelected() {
    hideContextMenu();
    const selected = selectedItem();
    if (!selected) return;
    if (selected.type === "group") {
      deleteSelectedGroup(selectedItems());
      return;
    }
    if (selected.type === "source") {
      addLog("The starting power-in source stays in the simulator.");
      render();
      return;
    }
    recordHistory();
    if (selected.type === "box") {
      state.devices.forEach((device) => {
        if (device.boxId === selected.id) {
          device.boxId = null;
          device.slot = null;
        }
      });
      state.boxes = state.boxes.filter((box) => box.id !== selected.id);
      removeConnectionsTo({ kind: "boxGround", boxId: selected.id });
      removeConnectionsTo({ kind: "box", boxId: selected.id });
      addLog("Box deleted.");
    }
    if (selected.type === "device") {
      removeDevicePlugTargets(selected.id);
      state.devices = state.devices.filter((device) => device.id !== selected.id);
      removeTestFaultsForDevices(new Set([selected.id]));
      removeConnectionsTo({ kind: "device", deviceId: selected.id });
      addLog("Device deleted.");
    }
    if (selected.type === "wire") {
      state.wires = state.wires.filter((wire) => wire.id !== selected.id);
      pruneCables();
      addLog("Wire deleted.");
    }
    if (selected.type === "cable") {
      const cable = cableById(selected.id);
      const wireIds = new Set(cable?.wireIds || []);
      state.wires = state.wires.filter((wire) => !wireIds.has(wire.id));
      state.cables = state.cables.filter((entry) => entry.id !== selected.id);
      addLog("Romex cable deleted.");
    }
    if (selected.type === "wireNut") {
      state.wireNuts = state.wireNuts.filter((nut) => nut.id !== selected.id);
      removeConnectionsTo({ kind: "wireNut", id: selected.id });
      addLog("Wire nut deleted.");
    }
    if (selected.type === "conduit") {
      state.conduits = state.conduits.filter((conduit) => conduit.id !== selected.id);
      addLog("Conduit deleted.");
    }
    state.selected = null;
    evaluateTrips();
    render();
  }

  function deleteSelectedGroup(items) {
    const deletable = items.filter((item) => item.type !== "source");
    if (!deletable.length) {
      addLog("The starting power-in source stays in the simulator.");
      render();
      return;
    }
    recordHistory();
    const boxIds = new Set(deletable.filter((item) => item.type === "box").map((item) => item.id));
    const deviceIds = new Set(deletable.filter((item) => item.type === "device").map((item) => item.id));
    const wireIds = new Set(deletable.filter((item) => item.type === "wire").map((item) => item.id));
    const cableIds = new Set(deletable.filter((item) => item.type === "cable").map((item) => item.id));
    const nutIds = new Set(deletable.filter((item) => item.type === "wireNut").map((item) => item.id));
    const conduitIds = new Set(deletable.filter((item) => item.type === "conduit").map((item) => item.id));
    state.cables.forEach((cable) => {
      if (cableIds.has(cable.id)) {
        cable.wireIds.forEach((wireId) => wireIds.add(wireId));
      }
    });

    boxIds.forEach((boxId) => {
      state.devices.forEach((device) => {
        if (device.boxId === boxId) {
          device.boxId = null;
          device.slot = null;
        }
      });
      removeConnectionsTo({ kind: "boxGround", boxId });
      removeConnectionsTo({ kind: "box", boxId });
    });
    deviceIds.forEach((deviceId) => {
      removeDevicePlugTargets(deviceId);
      removeConnectionsTo({ kind: "device", deviceId });
    });
    removeTestFaultsForDevices(deviceIds);
    nutIds.forEach((id) => removeConnectionsTo({ kind: "wireNut", id }));

    state.boxes = state.boxes.filter((box) => !boxIds.has(box.id));
    state.devices = state.devices.filter((device) => !deviceIds.has(device.id));
    state.wires = state.wires.filter((wire) => !wireIds.has(wire.id));
    state.cables = state.cables.filter((cable) => !cableIds.has(cable.id));
    state.wireNuts = state.wireNuts.filter((nut) => !nutIds.has(nut.id));
    state.conduits = state.conduits.filter((conduit) => !conduitIds.has(conduit.id));
    pruneCables();
    state.selected = null;
    evaluateTrips();
    addLog(`${deletable.length} selected item${deletable.length === 1 ? "" : "s"} deleted.`);
    render();
  }

  function rotateSelected(delta) {
    const selected = selectedItem();
    if (selected?.type === "conduit") {
      rotateSelectedConduit(delta);
      return;
    }
    if (selected?.type === "device") {
      rotateSelectedDevice(delta);
      return;
    }
    hideContextMenu();
  }

  function rotateSelectedDevice(delta) {
    const selected = selectedItem();
    if (selected?.type !== "device") {
      hideContextMenu();
      return;
    }
    const device = deviceById(selected.id);
    if (!isRotatableDevice(device)) {
      hideContextMenu();
      return;
    }
    recordHistory();
    device.rotation = normalizeRotation(deviceRotation(device) + delta);
    addLog(`${DEVICE_DEFS[device.type].label} rotated ${delta > 0 ? "clockwise" : "counterclockwise"}.`);
    hideContextMenu();
    render();
  }

  function rotateSelectedConduit(delta) {
    const selected = selectedItem();
    const conduit = selected?.type === "conduit" ? conduitById(selected.id) : null;
    if (!conduit) {
      hideContextMenu();
      return;
    }
    const aLocked = Boolean(conduit.a.connection);
    const bLocked = Boolean(conduit.b.connection);
    if (aLocked && bLocked) {
      addLog(`${conduit.label} is locked at both knockouts. Move an endpoint before rotating it.`);
      hideContextMenu();
      render();
      return;
    }
    const a = conduitEndpointPoint(conduit.id, "a");
    const b = conduitEndpointPoint(conduit.id, "b");
    const pivot = aLocked ? a : bLocked ? b : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const nextA = aLocked ? a : rotatePoint(a, pivot, delta);
    const nextB = bLocked ? b : rotatePoint(b, pivot, delta);
    recordHistory();
    if (!aLocked) {
      conduit.a.x = clamp(nextA.x, 18, GRID.width - 18);
      conduit.a.y = clamp(nextA.y, 18, GRID.height - 18);
      conduit.a.connection = null;
    }
    if (!bLocked) {
      conduit.b.x = clamp(nextB.x, 18, GRID.width - 18);
      conduit.b.y = clamp(nextB.y, 18, GRID.height - 18);
      conduit.b.connection = null;
    }
    addLog(`${conduit.label} rotated ${delta > 0 ? "clockwise" : "counterclockwise"}.`);
    hideContextMenu();
    render();
  }

  function rotatePoint(point, pivot, delta) {
    const radians = (delta * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const dx = point.x - pivot.x;
    const dy = point.y - pivot.y;
    return {
      x: pivot.x + dx * cos - dy * sin,
      y: pivot.y + dx * sin + dy * cos
    };
  }

  function pruneCables() {
    const liveWireIds = new Set(state.wires.map((wire) => wire.id));
    state.cables.forEach((cable) => {
      cable.wireIds = cable.wireIds.filter((wireId) => liveWireIds.has(wireId));
    });
    state.cables = state.cables.filter((cable) => cable.wireIds.length > 0);
  }

  function undoAction() {
    if (!history.undo.length) {
      addLog("Nothing to undo.");
      render();
      return;
    }
    const current = snapshotState();
    const previous = history.undo.pop();
    history.redo.push(current);
    history.suspended = true;
    restoreSnapshot(previous);
    history.suspended = false;
    addLog("Undo applied.");
    render();
  }

  function redoAction() {
    if (!history.redo.length) {
      addLog("Nothing to redo.");
      render();
      return;
    }
    const current = snapshotState();
    const next = history.redo.pop();
    history.undo.push(current);
    history.suspended = true;
    restoreSnapshot(next);
    history.suspended = false;
    addLog("Redo applied.");
    render();
  }

  function saveWorkState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(snapshotState()));
      addLog("Workbench saved in this browser.");
    } catch (error) {
      addLog("Save failed. Browser storage is unavailable.");
    }
    render();
  }

  function loadWorkState() {
    const snapshot = readSavedWorkState();
    if (!snapshot) {
      addLog("No saved workbench state was found.");
      render();
      return;
    }
    recordHistory();
    restoreSnapshot(snapshot);
    addLog("Saved workbench loaded.");
    render();
  }

  function exportWorkStateFile() {
    const exportedAt = new Date();
    const payload = {
      kind: STATE_FILE_KIND,
      version: STATE_FILE_VERSION,
      app: "Residential Wiring Simulator",
      exportedAt: exportedAt.toISOString(),
      snapshot: snapshotState()
    };
    const prettyJson = `${JSON.stringify(payload, null, 2)}\n`;
    const blob = new Blob([prettyJson], { type: STATE_FILE_MIME });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wiring-simulator-${formatFileTimestamp(exportedAt)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    addLog("Workbench file downloaded.");
    render();
  }

  function openWorkStateFilePicker() {
    if (!el.stateFileInput) {
      addLog("File loading is unavailable in this browser.");
      render();
      return;
    }
    el.stateFileInput.value = "";
    el.stateFileInput.click();
  }

  async function handleStateFileInputChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const snapshot = parseWorkStateFile(await file.text());
      recordHistory();
      restoreSnapshot(snapshot);
      addLog(`Workbench file loaded: ${file.name}`);
    } catch (error) {
      addLog(error?.message || "Workbench file could not be loaded.");
    } finally {
      event.target.value = "";
      render();
    }
  }

  function parseWorkStateFile(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new Error("Workbench file is not valid JSON.");
    }
    const snapshot = parsed?.kind === STATE_FILE_KIND ? parsed.snapshot : parsed;
    if (!isWorkStateSnapshot(snapshot)) {
      throw new Error("That file does not look like a wiring simulator workbench.");
    }
    return cloneValue(snapshot);
  }

  function isWorkStateSnapshot(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      value.source &&
      typeof value.source === "object" &&
      Array.isArray(value.boxes) &&
      Array.isArray(value.devices) &&
      Array.isArray(value.wires) &&
      Array.isArray(value.wireNuts)
    );
  }

  function clearBoard() {
    recordHistory();
    resetBoardState({ preserveGridColor: true, preserveBench: true });
    addLog("Workbench cleared.");
    render();
  }

  function resizeBenchBy(deltaWidth, deltaHeight) {
    setBenchSettings({
      width: state.bench.width + deltaWidth,
      height: state.bench.height + deltaHeight,
      zoom: state.bench.zoom
    }, deltaWidth > 0 || deltaHeight > 0 ? "Bench expanded." : "Bench shrunk.");
  }

  function applyCustomBenchSize() {
    const width = Number(el.benchWidthInput.value);
    const height = Number(el.benchHeightInput.value);
    setBenchSettings({
      width,
      height,
      zoom: state.bench.zoom
    }, "Custom bench size applied.");
  }

  function setBenchZoom(zoom) {
    setBenchSettings({
      width: state.bench.width,
      height: state.bench.height,
      zoom
    }, `Bench zoom set to ${Math.round(normalizeBench({ ...state.bench, zoom }).zoom * 100)}%.`, { clampItems: false });
  }

  function setBenchSettings(nextBench, message, options = {}) {
    const normalized = normalizeBench(nextBench);
    if (benchEqual(normalized, state.bench)) {
      renderBenchControls();
      return;
    }
    recordHistory();
    state.bench = normalized;
    GRID.width = normalized.width;
    GRID.height = normalized.height;
    if (options.clampItems !== false) {
      clampAllToBench();
    }
    addLog(message);
    render();
  }

  function recordHistory() {
    pushUndoSnapshot(snapshotState(), { force: true });
  }

  function pushUndoSnapshot(snapshot, options = {}) {
    if (history.suspended || !snapshot) return;
    if (!options.force && snapshotsEqual(snapshot, snapshotState())) return;
    history.undo.push(cloneValue(snapshot));
    history.redo = [];
  }

  function snapshotState() {
    return {
      nextId: state.nextId,
      selected: cloneValue(state.selected),
      source: cloneValue(state.source),
      boxes: cloneValue(state.boxes),
      devices: cloneValue(state.devices),
      wires: cloneValue(state.wires),
      cables: cloneValue(state.cables),
      wireNuts: cloneValue(state.wireNuts),
      conduits: cloneValue(state.conduits),
      upstream: cloneValue(state.upstream),
      chat: {
        messages: cloneValue(state.chat.messages),
        busy: false,
        pendingProposal: cloneValue(state.chat.pendingProposal)
      },
      lastDiagnostics: cloneValue(state.lastDiagnostics),
      log: cloneValue(state.log),
      gridColor: state.gridColor,
      wiresBehindDevices: state.wiresBehindDevices,
      faultProbeMode: state.faultProbeMode,
      testFaults: cloneValue(state.testFaults),
      bench: cloneValue(state.bench)
    };
  }

  function restoreSnapshot(snapshot) {
    state.paletteDrag?.ghost?.remove();
    state.paletteDrag = null;
    state.itemDrag = null;
    state.endpointDrag = null;
    state.suppressClick = false;
    state.gridColorEditBefore = null;
    removePreview();
    hideContextMenu();

    state.nextId = Number.isFinite(snapshot.nextId) ? snapshot.nextId : 1;
    state.selected = cloneValue(snapshot.selected) || { type: "source", id: INITIAL_SOURCE.id };
    state.source = cloneValue(snapshot.source) || { ...INITIAL_SOURCE };
    state.boxes = cloneValue(snapshot.boxes) || [];
    state.devices = cloneValue(snapshot.devices) || [];
    state.wires = cloneValue(snapshot.wires) || [];
    state.cables = cloneValue(snapshot.cables) || [];
    state.wireNuts = cloneValue(snapshot.wireNuts) || [];
    state.conduits = cloneValue(snapshot.conduits) || [];
    state.upstream = cloneValue(snapshot.upstream) || cloneValue(INITIAL_UPSTREAM);
    state.chat = {
      messages: cloneValue(snapshot.chat?.messages) || [],
      busy: false,
      pendingProposal: cloneValue(snapshot.chat?.pendingProposal)
    };
    state.lastDiagnostics = cloneValue(snapshot.lastDiagnostics) || [];
    state.log = cloneValue(snapshot.log) || [];
    state.gridColor = normalizeHexColor(snapshot.gridColor) || DEFAULT_GRID_COLOR;
    state.wiresBehindDevices = Boolean(snapshot.wiresBehindDevices);
    state.faultProbeMode = normalizeFaultProbeMode(snapshot.faultProbeMode) || (snapshot.shortProbeMode ? "ground-fault" : null);
    state.testFaults = Array.isArray(snapshot.testFaults) ? cloneValue(snapshot.testFaults) : [];
    state.bench = normalizeBench(snapshot.bench);
    GRID.width = state.bench.width;
    GRID.height = state.bench.height;
    clampAllToBench();
  }

  function resetBoardState(options = {}) {
    const gridColor = options.preserveGridColor ? state.gridColor : DEFAULT_GRID_COLOR;
    const bench = options.preserveBench ? state.bench : DEFAULT_BENCH;
    const wiresBehindDevices = state.wiresBehindDevices;
    const faultProbeMode = state.faultProbeMode;
    state.nextId = 1;
    state.selected = { type: "source", id: INITIAL_SOURCE.id };
    state.source = { ...INITIAL_SOURCE };
    state.boxes = [];
    state.devices = [];
    state.wires = [];
    state.cables = [];
    state.wireNuts = [];
    state.conduits = [];
    state.paletteDrag?.ghost?.remove();
    state.paletteDrag = null;
    state.itemDrag = null;
    state.endpointDrag = null;
    state.marqueeDrag = null;
    state.suppressClick = false;
    state.gridColorEditBefore = null;
    state.upstream = cloneValue(INITIAL_UPSTREAM);
    state.chat = { messages: [], busy: false, pendingProposal: null };
    state.lastDiagnostics = [];
    state.log = [];
    state.gridColor = gridColor;
    state.wiresBehindDevices = wiresBehindDevices;
    state.faultProbeMode = faultProbeMode;
    state.testFaults = [];
    state.bench = { ...bench };
    GRID.width = state.bench.width;
    GRID.height = state.bench.height;
    clampAllToBench();
    removePreview();
    hideSelectionMarquee();
    hideContextMenu();
  }

  function normalizeBench(value = {}) {
    return {
      width: snap(clamp(Number(value.width) || DEFAULT_BENCH.width, BENCH_LIMITS.minWidth, BENCH_LIMITS.maxWidth)),
      height: snap(clamp(Number(value.height) || DEFAULT_BENCH.height, BENCH_LIMITS.minHeight, BENCH_LIMITS.maxHeight)),
      zoom: roundZoom(clamp(Number(value.zoom) || DEFAULT_BENCH.zoom, BENCH_LIMITS.minZoom, BENCH_LIMITS.maxZoom))
    };
  }

  function normalizeFaultProbeMode(value) {
    return ["ground-fault", "line-neutral"].includes(value) ? value : null;
  }

  function benchEqual(a, b) {
    return a.width === b.width && a.height === b.height && a.zoom === b.zoom;
  }

  function roundZoom(value) {
    return Math.round(value * 100) / 100;
  }

  function clampAllToBench() {
    state.source = clampObjectPoint(state.source, SOURCE_SIZE);
    state.boxes.forEach((box) => clampObjectPoint(box, BOX_SIZE));
    state.wireNuts.forEach((nut) => clampObjectPoint(nut, WIRE_NUT_SIZE));
    state.conduits.forEach((conduit) => {
      ["a", "b"].forEach((end) => {
        if (conduit[end]?.connection) return;
        conduit[end].x = clamp(conduit[end].x, 18, state.bench.width - 18);
        conduit[end].y = clamp(conduit[end].y, 18, state.bench.height - 18);
      });
    });
    state.devices.forEach((device) => {
      if (device.boxId || device.pluggedTarget) return;
      clampObjectPoint(device, deviceSize(device));
    });
    state.wires.forEach((wire) => {
      ["a", "b"].forEach((end) => {
        if (wire[end]?.connection) return;
        wire[end].x = clamp(wire[end].x, 18, state.bench.width - 18);
        wire[end].y = clamp(wire[end].y, 18, state.bench.height - 18);
      });
    });
  }

  function clampObjectPoint(item, size) {
    const point = clampPointToBench(item.x, item.y, size);
    item.x = point.x;
    item.y = point.y;
    return item;
  }

  function clampPointToBench(x, y, size) {
    const marginX = Math.min(size.width / 2, state.bench.width / 2);
    const marginY = Math.min(size.height / 2, state.bench.height / 2);
    return {
      x: clamp(Number(x) || marginX, marginX, state.bench.width - marginX),
      y: clamp(Number(y) || marginY, marginY, state.bench.height - marginY)
    };
  }

  function readSavedWorkState() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function hasSavedWorkState() {
    try {
      return Boolean(localStorage.getItem(SAVE_KEY));
    } catch (error) {
      return false;
    }
  }

  function snapshotsEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function removeConnectionsTo(target) {
    state.wires.forEach((wire) => {
      ["a", "b"].forEach((end) => {
        if (connectionMatches(wire[end].connection, target)) {
          wire[end].connection = null;
        }
      });
      if (wire.manualHoles && target.kind === "box") {
        delete wire.manualHoles[target.boxId];
      }
      if (wire.manualHoles && target.kind === "boxHole" && wire.manualHoles[target.boxId] === target.holeKey) {
        delete wire.manualHoles[target.boxId];
      }
    });
    state.conduits.forEach((conduit) => {
      ["a", "b"].forEach((end) => {
        if (connectionMatches(conduit[end].connection, target)) {
          conduit[end].connection = null;
        }
      });
    });
  }

  function connectionMatches(connection, target) {
    if (!connection) return false;
    if (target.kind === "boxGround") return connection.kind === "boxGround" && connection.boxId === target.boxId;
    if (target.kind === "wireNut") return connection.kind === "wireNut" && connection.id === target.id;
    if (target.kind === "device") return connection.kind === "deviceTerminal" && connection.deviceId === target.deviceId;
    if (target.kind === "sourceTerminal") return connection.kind === "sourceTerminal" && connection.key === target.key;
    if (target.kind === "boxHole") return connection.kind === "boxHole" && connection.boxId === target.boxId && connection.holeKey === target.holeKey;
    if (target.kind === "box") return connection.kind === "boxHole" && connection.boxId === target.boxId;
    if (target.kind === "deviceTerminal") {
      return connection.kind === "deviceTerminal" &&
        connection.deviceId === target.deviceId &&
        connection.terminalKey === target.terminalKey;
    }
    return false;
  }

  function hasConnectionTo(target) {
    return state.wires.some((wire) => ["a", "b"].some((end) => connectionMatches(wire[end].connection, target)));
  }

  function connectedWireEntries(target) {
    const entries = [];
    state.wires.forEach((wire) => {
      ["a", "b"].forEach((end) => {
        if (connectionMatches(wire[end].connection, target)) {
          entries.push({ wire, end });
        }
      });
    });
    return entries;
  }

  function nodeConnectionClasses(target) {
    const entries = connectedWireEntries(target);
    if (!entries.length) return "";
    return `connected wired wire-${entries[0].wire.color} ${entries.length > 1 ? "multi-wire" : ""}`;
  }

  function connectionTextForTarget(target) {
    const labels = [];
    state.wires.forEach((wire) => {
      ["a", "b"].forEach((end) => {
        if (connectionMatches(wire[end].connection, target)) {
          labels.push(`${wire.label} end ${end.toUpperCase()}`);
        }
      });
    });
    return labels.length ? labels.join(", ") : "open";
  }

  function removeDevicePlugTargets(deviceId) {
    state.devices.forEach((device) => {
      if (device.pluggedTarget?.deviceId === deviceId) {
        const pos = devicePosition(device);
        device.x = pos.x;
        device.y = pos.y;
        device.pluggedTarget = null;
      }
    });
  }

  function removeTestFaultsForDevices(deviceIds) {
    if (!deviceIds?.size || !state.testFaults.length) return;
    state.testFaults = state.testFaults.filter((fault) => !deviceIds.has(fault.deviceId));
  }

  function nodeFromElement(element) {
    const type = element.dataset.nodeType;
    if (type === "wire-end") return { kind: "wireEndpoint", wireId: element.dataset.wireId, end: element.dataset.wireEnd };
    if (type === "source-terminal") return { kind: "sourceTerminal", key: element.dataset.sourceKey };
    if (type === "source-conduit") return { kind: "sourceConduit" };
    if (type === "device-terminal") return { kind: "deviceTerminal", deviceId: element.dataset.deviceId, terminalKey: element.dataset.terminalKey };
    if (type === "box-ground") return { kind: "boxGround", boxId: element.dataset.boxId };
    if (type === "box-hole") return { kind: "boxHole", boxId: element.dataset.boxId, holeKey: element.dataset.holeKey };
    if (type === "wire-nut") return { kind: "wireNut", nutId: element.dataset.nutId };
    if (type === "conduit-end") return { kind: "conduitEndpoint", conduitId: element.dataset.conduitId, end: element.dataset.conduitEnd };
    return null;
  }

  function targetNodeFromPoint(clientX, clientY, from) {
    const nodes = [];
    const seen = new Set();
    document.elementsFromPoint(clientX, clientY).forEach((element) => {
      const nodeElement = element.closest(".grid-node");
      if (!nodeElement || seen.has(nodeElement)) return;
      seen.add(nodeElement);
      nodes.push(nodeElement);
    });
    const connector = nodes.find((element) => element.dataset.nodeType === "wire-nut") ||
      nodes.find((element) => ["source-terminal", "source-conduit", "device-terminal", "box-ground", "box-hole"].includes(element.dataset.nodeType));
    if (connector) {
      return nodeFromElement(connector);
    }
    const wireEnd = nodes.find((element) => !sameNodeElement(element, from));
    return wireEnd ? nodeFromElement(wireEnd) : null;
  }

  function sameNodeElement(element, node) {
    if (!node) return false;
    if (node.kind === "wireEndpoint") {
      return element.dataset.nodeType === "wire-end" &&
        element.dataset.wireId === node.wireId &&
        element.dataset.wireEnd === node.end;
    }
    if (node.kind === "sourceTerminal") return element.dataset.nodeType === "source-terminal" && element.dataset.sourceKey === node.key;
    if (node.kind === "sourceConduit") return element.dataset.nodeType === "source-conduit";
    if (node.kind === "deviceTerminal") {
      return element.dataset.nodeType === "device-terminal" &&
        element.dataset.deviceId === node.deviceId &&
        element.dataset.terminalKey === node.terminalKey;
    }
    if (node.kind === "boxGround") return element.dataset.nodeType === "box-ground" && element.dataset.boxId === node.boxId;
    if (node.kind === "wireNut") return element.dataset.nodeType === "wire-nut" && element.dataset.nutId === node.nutId;
    if (node.kind === "boxHole") return element.dataset.nodeType === "box-hole" && element.dataset.boxId === node.boxId && element.dataset.holeKey === node.holeKey;
    if (node.kind === "conduitEndpoint") return element.dataset.nodeType === "conduit-end" && element.dataset.conduitId === node.conduitId && element.dataset.conduitEnd === node.end;
    return false;
  }

  function nodePoint(node) {
    if (!node) return null;
    if (node.kind === "wireEndpoint") return wireEndpointPoint(node.wireId, node.end);
    if (node.kind === "sourceTerminal") return sourceTerminalPoint(node.key);
    if (node.kind === "sourceConduit") return sourceConduitPoint();
    if (node.kind === "deviceTerminal") return deviceTerminalPoint(node.deviceId, node.terminalKey);
    if (node.kind === "boxGround") {
      const box = boxById(node.boxId);
      return box ? { x: box.x - 88, y: box.y - 68 } : null;
    }
    if (node.kind === "wireNut") {
      const nut = wireNutById(node.nutId);
      return nut ? { x: nut.x, y: nut.y } : null;
    }
    if (node.kind === "boxHole") return boxHolePoint(node.boxId, node.holeKey);
    if (node.kind === "conduitEndpoint") return conduitEndpointPoint(node.conduitId, node.end);
    return null;
  }

  function wireEndpointPoint(wireId, end) {
    const wire = wireById(wireId);
    const endpoint = wire?.[end];
    if (!endpoint) return { x: 0, y: 0 };
    return endpoint.connection ? targetPoint(endpoint.connection) : { x: endpoint.x, y: endpoint.y };
  }

  function wireEndpointBoxContext(wire, end, point) {
    const connection = wire[end]?.connection;
    if (connection?.kind === "deviceTerminal") {
      const device = deviceById(connection.deviceId);
      if (device?.boxId) return { boxId: device.boxId };
    }
    if (connection?.kind === "sourceTerminal") return { boxId: SOURCE_CONDUIT_CONTEXT };
    if (connection?.kind === "boxGround") return { boxId: connection.boxId };
    if (connection?.kind === "boxHole") return { boxId: connection.boxId, holeKey: connection.holeKey };
    if (connection?.kind === "wireNut") {
      const nut = wireNutById(connection.id);
      const box = nut ? boxAtPoint(nut.x, nut.y) : null;
      if (box) return { boxId: box.id };
    }
    const box = boxAtPoint(point.x, point.y);
    return box ? { boxId: box.id } : { boxId: null };
  }

  function wireRoutableBoxIds(wire) {
    if (!wire) return [];
    const a = wireEndpointPoint(wire.id, "a");
    const b = wireEndpointPoint(wire.id, "b");
    const ids = [wireEndpointBoxContext(wire, "a", a).boxId, wireEndpointBoxContext(wire, "b", b).boxId]
      .filter((id) => id && id !== SOURCE_CONDUIT_CONTEXT);
    Object.keys(wire.manualHoles || {}).forEach((boxId) => {
      if (boxById(boxId)) ids.push(boxId);
    });
    return Array.from(new Set(ids));
  }

  function setSelectedWireKnockout(boxId, holeKey) {
    const selected = selectedItem();
    const wire = selected?.type === "wire" ? wireById(selected.id) : null;
    const box = boxById(boxId);
    const hole = BOX_HOLES.find((entry) => entry.key === holeKey);
    if (!wire || !box || !hole) return;
    const boxIds = wireRoutableBoxIds(wire);
    if (!boxIds.includes(boxId)) {
      addLog(`${wire.label} is not routed through ${box.label}. Put one end in that box before assigning a knockout path.`);
      render();
      return;
    }
    recordHistory();
    wire.manualHoles = { ...(wire.manualHoles || {}), [boxId]: holeKey };
    addLog(`${wire.label} path set to ${boxHoleLabel({ boxId, holeKey })}.`);
    render();
  }

  function clearSelectedWireRoutes() {
    const selected = selectedItem();
    const wire = selected?.type === "wire" ? wireById(selected.id) : null;
    if (!wire) return;
    if (!wire.manualHoles || !Object.keys(wire.manualHoles).length) {
      render();
      return;
    }
    recordHistory();
    wire.manualHoles = {};
    addLog(`${wire.label} returned to automatic knockout routing.`);
    render();
  }

  function preferredBoxExitPoint(boxId, insidePoint, outsidePoint, connection, wire) {
    if (boxId === SOURCE_CONDUIT_CONTEXT) return sourceConduitPoint();
    if (connection?.kind === "boxHole" && connection.boxId === boxId) {
      return boxHolePoint(boxId, connection.holeKey);
    }
    const box = boxById(boxId);
    if (!box) return insidePoint;
    const conduitHole = conduitHoleForDirection(boxId, insidePoint, outsidePoint);
    if (conduitHole) {
      return boxHolePoint(boxId, conduitHole.key);
    }
    const manualHole = BOX_HOLES.find((hole) => hole.key === wire?.manualHoles?.[boxId]);
    if (manualHole) {
      return boxHolePoint(boxId, manualHole.key);
    }
    const hole = bestBoxHole(box, insidePoint, outsidePoint);
    return boxHolePoint(boxId, hole.key);
  }

  function bestBoxHole(box, insidePoint, outsidePoint) {
    const preferredEdges = preferredBoxEdges(box, insidePoint, outsidePoint);
    let best = null;
    BOX_HOLES.forEach((hole) => {
      const point = { x: box.x + hole.x, y: box.y + hole.y };
      let score = Math.hypot(point.x - insidePoint.x, point.y - insidePoint.y) * 0.45 +
        Math.hypot(point.x - outsidePoint.x, point.y - outsidePoint.y);
      if (preferredEdges.includes(hole.edge)) score -= 80;
      if (!best || score < best.score) best = { hole, score };
    });
    return best?.hole || BOX_HOLES[4];
  }

  function preferredBoxEdges(box, insidePoint, outsidePoint) {
    const dx = outsidePoint.x - box.x;
    const dy = outsidePoint.y - box.y;
    const preferredEdges = [];
    if (Math.abs(dx) > Math.abs(dy) * 0.7) preferredEdges.push(dx < 0 ? "left" : "right");
    if (Math.abs(dy) > Math.abs(dx) * 0.45) preferredEdges.push(dy < 0 ? "top" : "bottom");
    if (insidePoint.y > box.y + BOX_SIZE.height * 0.18) preferredEdges.unshift("bottom");
    if (insidePoint.y < box.y - BOX_SIZE.height * 0.18) preferredEdges.unshift("top");
    return Array.from(new Set(preferredEdges));
  }

  function conduitHoleForDirection(boxId, insidePoint, outsidePoint) {
    const box = boxById(boxId);
    if (!box) return null;
    const preferredEdges = preferredBoxEdges(box, insidePoint, outsidePoint);
    if (!preferredEdges.length) return null;
    let best = null;
    state.conduits.forEach((conduit) => {
      ["a", "b"].forEach((end) => {
        const connection = conduit[end]?.connection;
        if (connection?.kind !== "boxHole" || connection.boxId !== boxId) return;
        const hole = BOX_HOLES.find((entry) => entry.key === connection.holeKey);
        if (!hole || !preferredEdges.includes(hole.edge)) return;
        const point = boxHolePoint(boxId, hole.key);
        const score = preferredEdges.indexOf(hole.edge) * 1000 +
          Math.hypot(point.x - insidePoint.x, point.y - insidePoint.y) * 0.35 +
          Math.hypot(point.x - outsidePoint.x, point.y - outsidePoint.y);
        if (!best || score < best.score) best = { hole, score };
      });
    });
    return best?.hole || null;
  }

  function conduitRouteBetweenBoxes(boxA, boxB) {
    const path = conduitPathBetweenBoxes(boxA, boxB);
    if (!path.length) return null;
    const points = [];
    path.forEach((edge) => {
      points.push(edge.from.point, edge.to.point);
    });
    return { points: removeDuplicatePoints(points), edges: path, conduit: path[0]?.conduit };
  }

  function conduitPathBetweenBoxes(startBoxId, endBoxId) {
    if (!startBoxId || !endBoxId || startBoxId === endBoxId) return [];
    const edges = conduitGraphEdges();
    const queue = [{ boxId: startBoxId, path: [] }];
    const visited = new Set([startBoxId]);
    while (queue.length) {
      const current = queue.shift();
      const nextEdges = edges
        .filter((edge) => edge.from.boxId === current.boxId)
        .sort((a, b) => conduitEdgeScore(a, endBoxId) - conduitEdgeScore(b, endBoxId));
      for (const edge of nextEdges) {
        if (visited.has(edge.to.boxId)) continue;
        const nextPath = [...current.path, edge];
        if (edge.to.boxId === endBoxId) return nextPath;
        visited.add(edge.to.boxId);
        queue.push({ boxId: edge.to.boxId, path: nextPath });
      }
    }
    return [];
  }

  function conduitGraphEdges() {
    const edges = [];
    state.conduits.forEach((conduit) => {
      const a = conduit.a.connection;
      const b = conduit.b.connection;
      const aSide = conduitGraphSide(a);
      const bSide = conduitGraphSide(b);
      if (!aSide || !bSide || aSide.boxId === bSide.boxId) return;
      edges.push({ conduit, from: aSide, to: bSide });
      edges.push({ conduit, from: bSide, to: aSide });
    });
    return edges;
  }

  function conduitGraphSide(connection) {
    if (connection?.kind === "boxHole") {
      return { boxId: connection.boxId, holeKey: connection.holeKey, point: boxHolePoint(connection.boxId, connection.holeKey) };
    }
    if (connection?.kind === "sourceConduit") {
      return { boxId: SOURCE_CONDUIT_CONTEXT, holeKey: "source", point: sourceConduitPoint() };
    }
    return null;
  }

  function conduitEdgeScore(edge, targetBoxId) {
    const target = contextAnchorPoint(targetBoxId);
    if (!target) return 0;
    return Math.hypot(edge.to.point.x - target.x, edge.to.point.y - target.y);
  }

  function contextAnchorPoint(boxId) {
    if (boxId === SOURCE_CONDUIT_CONTEXT) return sourceConduitPoint();
    const box = boxById(boxId);
    return box ? { x: box.x, y: box.y } : null;
  }

  function openBoxHole(boxId, holeKey) {
    const box = boxById(boxId);
    if (!box) return;
    if (!Array.isArray(box.openHoles)) box.openHoles = [];
    if (!box.openHoles.includes(holeKey)) box.openHoles.push(holeKey);
  }

  function toggleBoxHole(boxId, holeKey) {
    const box = boxById(boxId);
    if (!box) return;
    if (!Array.isArray(box.openHoles)) box.openHoles = [];
    if (box.openHoles.includes(holeKey)) {
      box.openHoles = box.openHoles.filter((key) => key !== holeKey);
      addLog(`${boxHoleLabel({ boxId, holeKey })} closed.`);
    } else {
      box.openHoles.push(holeKey);
      addLog(`${boxHoleLabel({ boxId, holeKey })} opened.`);
    }
  }

  function boxHoleLabel(node) {
    const box = boxById(node.boxId);
    const hole = BOX_HOLES.find((entry) => entry.key === node.holeKey);
    return `${box?.label || "box"} ${hole?.label || "knockout"}`;
  }

  function nearestBoxHoleAtPoint(point, maxDistance = 70) {
    let best = null;
    state.boxes.forEach((box) => {
      BOX_HOLES.forEach((hole) => {
        const holePoint = { x: box.x + hole.x, y: box.y + hole.y };
        const distance = Math.hypot(point.x - holePoint.x, point.y - holePoint.y);
        if (distance <= maxDistance && (!best || distance < best.distance)) {
          best = { kind: "boxHole", boxId: box.id, holeKey: hole.key, distance };
        }
      });
    });
    return best;
  }

  function usedBoxHoles(boxId) {
    const used = new Set();
    const conduitUsed = new Set();
    state.wires.forEach((wire) => {
      ["a", "b"].forEach((end) => {
        const connection = wire[end]?.connection;
        if (connection?.kind === "boxHole" && connection.boxId === boxId) used.add(connection.holeKey);
      });
      wireRoutePoints(wire).forEach((point) => {
        const hole = BOX_HOLES.find((entry) => Math.hypot(point.x - (boxById(boxId)?.x || 0) - entry.x, point.y - (boxById(boxId)?.y || 0) - entry.y) < 1);
        if (hole) used.add(hole.key);
      });
    });
    state.conduits.forEach((conduit) => {
      ["a", "b"].forEach((end) => {
        const connection = conduit[end]?.connection;
        if (connection?.kind === "boxHole" && connection.boxId === boxId) {
          used.add(connection.holeKey);
          conduitUsed.add(connection.holeKey);
        }
      });
    });
    return { used, conduitUsed };
  }

  function wireCopperSegment(wire, end) {
    const route = wireRoutePoints(wire);
    const point = end === "a" ? route[0] : route[route.length - 1];
    const other = end === "a" ? route[1] : route[route.length - 2];
    if (!point || !other) return null;
    const dx = other.x - point.x;
    const dy = other.y - point.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 2) return null;
    const length = Math.min(28, Math.max(18, distance * 0.08));
    return {
      a: point,
      b: {
        x: point.x + (dx / distance) * length,
        y: point.y + (dy / distance) * length
      }
    };
  }

  function wireDetachGripPoint(wire, end) {
    const point = wireEndpointPoint(wire.id, end);
    const other = wireEndpointPoint(wire.id, end === "a" ? "b" : "a");
    let dx = point.x - other.x;
    let dy = point.y - other.y;
    const length = Math.hypot(dx, dy);
    if (length < 1) {
      dx = end === "a" ? -1 : 1;
      dy = -0.4;
    } else {
      dx /= length;
      dy /= length;
    }
    const offset = wire[end].connection?.kind === "wireNut" ? 32 : 24;
    return {
      x: clamp(point.x + dx * offset, 12, GRID.width - 12),
      y: clamp(point.y + dy * offset, 12, GRID.height - 12)
    };
  }

  function targetPoint(connection) {
    if (connection.kind === "sourceTerminal") return sourceTerminalPoint(connection.key);
    if (connection.kind === "sourceConduit") return sourceConduitPoint();
    if (connection.kind === "deviceTerminal") return deviceTerminalPoint(connection.deviceId, connection.terminalKey);
    if (connection.kind === "boxGround") return nodePoint({ kind: "boxGround", boxId: connection.boxId });
    if (connection.kind === "wireNut") return nodePoint({ kind: "wireNut", nutId: connection.id });
    if (connection.kind === "boxHole") return nodePoint({ kind: "boxHole", boxId: connection.boxId, holeKey: connection.holeKey });
    return { x: 0, y: 0 };
  }

  function sourceTerminalPoint(key) {
    const offsets = { hot: { x: -35, y: 26 }, neutral: { x: 0, y: 26 }, ground: { x: 35, y: 26 } };
    return { x: state.source.x + offsets[key].x, y: state.source.y + offsets[key].y };
  }

  function sourceConduitPoint() {
    return { x: state.source.x, y: state.source.y + SOURCE_SIZE.height / 2 };
  }

  function sourceConduitInUse() {
    return state.conduits.some((conduit) => ["a", "b"].some((end) => conduit[end]?.connection?.kind === "sourceConduit"));
  }

  function nearestSourceConduitAtPoint(point, maxDistance = 58) {
    const sourcePoint = sourceConduitPoint();
    return Math.hypot(point.x - sourcePoint.x, point.y - sourcePoint.y) <= maxDistance ? { kind: "sourceConduit" } : null;
  }

  function boxHolePoint(boxId, holeKey) {
    const box = boxById(boxId);
    const hole = BOX_HOLES.find((entry) => entry.key === holeKey);
    if (!box || !hole) return { x: 0, y: 0 };
    return { x: box.x + hole.x, y: box.y + hole.y };
  }

  function conduitEndpointPoint(conduitId, end) {
    const conduit = conduitById(conduitId);
    const endpoint = conduit?.[end];
    if (!endpoint) return { x: 0, y: 0 };
    return endpoint.connection ? targetPoint(endpoint.connection) : { x: endpoint.x, y: endpoint.y };
  }

  function deviceTerminalPoint(deviceId, terminalKey) {
    const device = deviceById(deviceId);
    if (!device) return { x: 0, y: 0 };
    const terminal = terminalDef(deviceId, terminalKey);
    const pos = devicePosition(device);
    const offset = rotatedDeviceLocalPoint(device, terminal.x, terminal.y);
    return { x: pos.x + offset.x, y: pos.y + offset.y };
  }

  function targetNode(connection) {
    if (connection.kind === "sourceTerminal") return sourceTerminalNode(connection.key);
    if (connection.kind === "deviceTerminal") return deviceTerminalNode(connection.deviceId, connection.terminalKey);
    if (connection.kind === "boxGround") return boxGroundNode(connection.boxId);
    if (connection.kind === "wireNut") return wireNutNode(connection.id);
    if (connection.kind === "boxHole") return "";
    return "";
  }

  function shouldPreferWireSelection(point, item, lineWire) {
    if (!lineWire) return false;
    if (!item || item.dataset.itemType === "box") return true;
    return false;
  }

  function deviceLayerShouldWin(target) {
    const item = target?.closest?.("[data-item-type]");
    return state.wiresBehindDevices && ["device", "source"].includes(item?.dataset.itemType);
  }

  function landedWireNutIdFromElement(element) {
    if (element?.closest?.(".wire-detach-grip")) return "";
    const wireNode = element?.closest?.("[data-node-type='wire-end']");
    if (!wireNode) return "";
    const wire = wireById(wireNode.dataset.wireId);
    const end = wireNode.dataset.wireEnd;
    if (!wire || !end || isSelected("wire", wire.id)) return "";
    const connection = wire[end]?.connection;
    return connection?.kind === "wireNut" ? connection.id : "";
  }

  function wireNutAtPoint(point) {
    const selectedBoost = selectedItem()?.type === "wireNut" ? 8 : 0;
    return state.wireNuts.find((nut) => Math.hypot(point.x - nut.x, point.y - nut.y) <= 24 + selectedBoost) || null;
  }

  function conduitAtPoint(point) {
    let best = null;
    state.conduits.forEach((conduit) => {
      const a = conduitEndpointPoint(conduit.id, "a");
      const b = conduitEndpointPoint(conduit.id, "b");
      const def = CONDUIT_DEFS[conduit.type] || CONDUIT_DEFS.conduitHalf;
      const distance = pointToSegmentDistance(point, a, b);
      const maxDistance = Math.max(18, def.diameter / 2 + 10) + (isSelected("conduit", conduit.id) ? 8 : 0);
      if (distance <= maxDistance) {
        const score = distance - (isSelected("conduit", conduit.id) ? 6 : 0);
        if (!best || score < best.score) best = { conduit, score };
      }
    });
    return best?.conduit || null;
  }

  function nearestWireAtPoint(point, maxDistance = 10) {
    return nearestWireHitAtPoint(point, maxDistance)?.wire || null;
  }

  function nearestWireHitAtPoint(point, maxDistance = 10) {
    let best = null;
    state.wires.forEach((wire) => {
      const distance = distanceToWire(point, wire);
      if (distance <= maxDistance) {
        const score = distance - (isSelected("wire", wire.id) ? 4 : 0);
        if (!best || score < best.score) {
          best = { wire, distance, score };
        }
      }
    });
    return best;
  }

  function distanceToWire(point, wire) {
    const samples = sampleWirePath(wire, 8);
    let best = Infinity;
    for (let index = 1; index < samples.length; index += 1) {
      best = Math.min(best, pointToSegmentDistance(point, samples[index - 1], samples[index]));
    }
    return best;
  }

  function sampleCurve(a, b, steps) {
    const controls = curveControls(a, b);
    const points = [];
    for (let index = 0; index <= steps; index += 1) {
      const t = index / steps;
      points.push(cubicPoint(a, controls.c1, controls.c2, b, t));
    }
    return points;
  }

  function wireHitPath(wire) {
    const points = sampleWirePath(wire, 10).slice(5, -5);
    if (points.length < 2) return "";
    const [first, ...rest] = points;
    return `M ${first.x} ${first.y} ${rest.map((point) => `L ${point.x} ${point.y}`).join(" ")}`;
  }

  function wirePath(wire) {
    return smoothPolylinePath(wireRoutePoints(wire));
  }

  function wireRoutePoints(wire) {
    const a = wireEndpointPoint(wire.id, "a");
    const b = wireEndpointPoint(wire.id, "b");
    const contextA = wireEndpointBoxContext(wire, "a", a);
    const contextB = wireEndpointBoxContext(wire, "b", b);
    if (!contextA.boxId && !contextB.boxId) return [a, b];
    if (contextA.boxId && contextA.boxId === contextB.boxId) return [a, b];
    if (contextA.boxId && contextB.boxId) {
      const conduitRoute = conduitRouteBetweenBoxes(contextA.boxId, contextB.boxId);
      if (conduitRoute) {
        return removeDuplicatePoints([a, ...conduitRoute.points, b]);
      }
    }
    const points = [a];
    if (contextA.boxId) points.push(preferredBoxExitPoint(contextA.boxId, a, b, wire.a.connection, wire));
    if (contextB.boxId) points.push(preferredBoxExitPoint(contextB.boxId, b, a, wire.b.connection, wire));
    points.push(b);
    return removeDuplicatePoints(points);
  }

  function sampleWirePath(wire, segmentSteps = 8) {
    const route = wireRoutePoints(wire);
    if (route.length <= 2) return sampleCurve(route[0], route[1], 32);
    const samples = [];
    for (let index = 1; index < route.length; index += 1) {
      const a = route[index - 1];
      const b = route[index];
      for (let step = 0; step <= segmentSteps; step += 1) {
        if (index > 1 && step === 0) continue;
        const t = step / segmentSteps;
        samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
    return samples;
  }

  function smoothPolylinePath(points) {
    const route = removeDuplicatePoints(points);
    if (route.length < 2) return "";
    if (route.length === 2) return curvePath(route[0], route[1]);
    return route.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `${path} L ${point.x} ${point.y}`;
    }, "");
  }

  function removeDuplicatePoints(points) {
    return points.filter((point, index, list) => index === 0 || Math.hypot(point.x - list[index - 1].x, point.y - list[index - 1].y) > 1);
  }

  function cubicPoint(a, c1, c2, b, t) {
    const mt = 1 - t;
    return {
      x: mt ** 3 * a.x + 3 * mt ** 2 * t * c1.x + 3 * mt * t ** 2 * c2.x + t ** 3 * b.x,
      y: mt ** 3 * a.y + 3 * mt ** 2 * t * c1.y + 3 * mt * t ** 2 * c2.y + t ** 3 * b.y
    };
  }

  function pointToSegmentDistance(point, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    if (!lengthSq) return Math.hypot(point.x - a.x, point.y - a.y);
    const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq, 0, 1);
    return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
  }

  function selectionRectFromPoints(a, b) {
    const left = Math.min(a.x, b.x);
    const top = Math.min(a.y, b.y);
    const right = Math.max(a.x, b.x);
    const bottom = Math.max(a.y, b.y);
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }

  function itemsInsideSelection(rect) {
    return [
      ...(rectIntersects(rect, itemBounds("source", state.source.id)) ? [{ type: "source", id: state.source.id }] : []),
      ...state.boxes.filter((box) => rectIntersects(rect, itemBounds("box", box.id))).map((box) => ({ type: "box", id: box.id })),
      ...state.devices.filter((device) => rectIntersects(rect, itemBounds("device", device.id))).map((device) => ({ type: "device", id: device.id })),
      ...state.cables.filter((cable) => rectIntersects(rect, itemBounds("cable", cable.id))).map((cable) => ({ type: "cable", id: cable.id })),
      ...state.conduits.filter((conduit) => rectIntersects(rect, itemBounds("conduit", conduit.id))).map((conduit) => ({ type: "conduit", id: conduit.id })),
      ...state.wireNuts.filter((nut) => rectIntersects(rect, itemBounds("wireNut", nut.id))).map((nut) => ({ type: "wireNut", id: nut.id })),
      ...state.wires.filter((wire) => wireIntersectsRect(wire, rect)).map((wire) => ({ type: "wire", id: wire.id }))
    ];
  }

  function itemBounds(type, id) {
    const pos = itemPosition(type, id);
    const size = itemSize(type, id);
    return {
      left: pos.x - size.width / 2,
      top: pos.y - size.height / 2,
      right: pos.x + size.width / 2,
      bottom: pos.y + size.height / 2
    };
  }

  function itemSize(type, id) {
    if (type === "source") return SOURCE_SIZE;
    if (type === "box") return BOX_SIZE;
    if (type === "device") return deviceSize(deviceById(id));
    if (type === "cable") return { width: 74, height: 34 };
    if (type === "conduit") return { width: Math.abs(conduitEndpointPoint(id, "a").x - conduitEndpointPoint(id, "b").x) + 32, height: Math.abs(conduitEndpointPoint(id, "a").y - conduitEndpointPoint(id, "b").y) + 32 };
    if (type === "wireNut") return WIRE_NUT_SIZE;
    return { width: 0, height: 0 };
  }

  function rectIntersects(a, b) {
    return Boolean(b) && a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
  }

  function pointInRect(point, rect) {
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
  }

  function wireIntersectsRect(wire, rect) {
    return sampleWirePath(wire, 10)
      .some((point) => pointInRect(point, rect));
  }

  function selectedItem() {
    return state.selected;
  }

  function selectItem(type, id) {
    state.selected = { type, id };
  }

  function selectItems(items) {
    const unique = [];
    const seen = new Set();
    items.forEach((item) => {
      if (!item?.type || !item.id) return;
      const key = selectionKey(item);
      if (seen.has(key)) return;
      seen.add(key);
      unique.push({ type: item.type, id: item.id });
    });
    if (unique.length === 0) {
      state.selected = null;
      addLog("Selection cleared.");
      return;
    }
    if (unique.length === 1) {
      selectItem(unique[0].type, unique[0].id);
      addLog("1 item selected.");
      return;
    }
    state.selected = { type: "group", items: unique };
    addLog(`${unique.length} items selected.`);
  }

  function selectedItems() {
    if (!state.selected) return [];
    if (state.selected.type === "group") {
      return cloneValue(state.selected.items || []);
    }
    return [state.selected];
  }

  function isSelected(type, id) {
    if (!state.selected) return false;
    if (state.selected.type === "group") {
      return (state.selected.items || []).some((item) => item.type === type && item.id === id);
    }
    return state.selected.type === type && state.selected.id === id;
  }

  function selectionKey(item) {
    return `${item.type}:${item.id}`;
  }

  function sourcePowerAvailable() {
    return state.upstream.pluggedIn && state.upstream.breakerOn && !state.upstream.breakerTripped && !state.upstream.gfciTripped;
  }

  function loadCanRun(uf, info, hotNode, neutralNode, faulted) {
    return !faulted && nodeHas(info, uf, hotNode, "hot") && nodeHas(info, uf, neutralNode, "neutral") && uf.find(hotNode) !== uf.find(neutralNode);
  }

  function socketCanRun(uf, info, activeGfcis, outlet, receptacle, faulted) {
    if (!outlet || faulted) return false;
    if (outlet.type === "standardOutlet" || outlet.type === "halfHotOutlet") {
      const prefix = receptacle === "top" ? "top" : "bottom";
      return loadCanRun(uf, info, deviceTerminalNode(outlet.id, `${prefix}Hot`), deviceTerminalNode(outlet.id, `${prefix}Neutral`), faulted);
    }
    if (outlet.type === "gfciOutlet") {
      return activeGfcis.has(outlet.id) && !outlet.tripped &&
        loadCanRun(uf, info, deviceTerminalNode(outlet.id, "lineHot"), deviceTerminalNode(outlet.id, "lineNeutral"), faulted);
    }
    return false;
  }

  function nodeHas(info, uf, node, key) {
    return Boolean(info.get(uf.find(node))?.[key]);
  }

  function potentialLabel(info, uf, node) {
    const root = info.get(uf.find(node));
    if (!root) return "open";
    if (root.hot && root.neutral) return "short";
    if (root.hot && root.ground) return "fault";
    if (root.hot) return "hot";
    if (root.neutral && root.ground) return "grounded-neutral";
    if (root.neutral) return "neutral";
    if (root.ground) return "ground";
    return "open";
  }

  function sourceNodeClass(key, result) {
    if (key === "hot") return result.sourceAvailable ? "hot" : "open";
    if (key === "neutral") return result.sourceAvailable ? "neutral" : "open";
    return state.upstream.pluggedIn ? "ground" : "open";
  }

  function sourceTerminalNode(key) {
    return `node:source:${key}`;
  }

  function wireEndpointNode(wireId, end) {
    return `node:wire:${wireId}:${end}`;
  }

  function deviceTerminalNode(deviceId, terminalKey) {
    return `node:device:${deviceId}:${terminalKey}`;
  }

  function boxGroundNode(boxId) {
    return `node:box:${boxId}:ground`;
  }

  function wireNutNode(nutId) {
    return `node:nut:${nutId}`;
  }

  function terminalDef(deviceId, terminalKey) {
    const device = deviceById(deviceId);
    return device ? DEVICE_DEFS[device.type].terminals.find((terminal) => terminal.key === terminalKey) : null;
  }

  function getWireEndpoint(wireId, end) {
    const wire = wireById(wireId);
    return wire ? wire[end] : null;
  }

  function boxById(id) {
    return state.boxes.find((box) => box.id === id) || null;
  }

  function deviceById(id) {
    return state.devices.find((device) => device.id === id) || null;
  }

  function wireById(id) {
    return state.wires.find((wire) => wire.id === id) || null;
  }

  function cableById(id) {
    return state.cables.find((cable) => cable.id === id) || null;
  }

  function conduitById(id) {
    return state.conduits.find((conduit) => conduit.id === id) || null;
  }

  function wireNutById(id) {
    return state.wireNuts.find((nut) => nut.id === id) || null;
  }

  function pointInsideBox(x, y, box) {
    return x >= box.x - BOX_SIZE.width / 2 && x <= box.x + BOX_SIZE.width / 2 &&
      y >= box.y - BOX_SIZE.height / 2 && y <= box.y + BOX_SIZE.height / 2;
  }

  function boxAtPoint(x, y) {
    return state.boxes.find((box) => pointInsideBox(x, y, box)) || null;
  }

  function eventToGridPoint(event) {
    const rect = el.sandbox.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * GRID.width, 0, GRID.width),
      y: clamp(((event.clientY - rect.top) / rect.height) * GRID.height, 0, GRID.height)
    };
  }

  function clampPointForSize(x, y, size) {
    return clampPointToBench(x, y, size);
  }

  function createGhost(button, rect) {
    const ghost = button.cloneNode(true);
    ghost.classList.add("drag-ghost");
    ghost.style.width = `${rect.width}px`;
    document.body.appendChild(ghost);
    return ghost;
  }

  function moveGhost(x, y) {
    const ghost = state.paletteDrag?.ghost;
    if (!ghost) return;
    ghost.style.left = `${x + 10}px`;
    ghost.style.top = `${y + 10}px`;
  }

  function ensurePreview() {
    if (document.getElementById("wirePreviewPath")) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("id", "wirePreviewPath");
    path.setAttribute("class", "wire-preview");
    el.wireLayer.appendChild(path);
  }

  function updatePreview(from, to) {
    const path = document.getElementById("wirePreviewPath");
    if (!path) return;
    path.setAttribute("d", curvePath(from, to));
  }

  function removePreview() {
    document.getElementById("wirePreviewPath")?.remove();
  }

  function curvePath(a, b) {
    const controls = curveControls(a, b);
    return `M ${a.x} ${a.y} C ${controls.c1.x} ${controls.c1.y}, ${controls.c2.x} ${controls.c2.y}, ${b.x} ${b.y}`;
  }

  function curveControls(a, b) {
    const midX = (a.x + b.x) / 2;
    const curve = Math.min(110, Math.abs(b.x - a.x) * 0.24 + 20);
    return {
      c1: { x: midX - curve, y: a.y },
      c2: { x: midX + curve, y: b.y }
    };
  }

  function showContextMenu(x, y) {
    renderContextMenu();
    el.contextMenu.hidden = false;
    const rect = el.contextMenu.getBoundingClientRect();
    el.contextMenu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - rect.width - 8))}px`;
    el.contextMenu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - rect.height - 8))}px`;
  }

  function renderContextMenu() {
    const selected = selectedItem();
    const device = selected?.type === "device" ? deviceById(selected.id) : null;
    const rotationControls = isRotatableDevice(device) || selected?.type === "conduit" ? `
      <button type="button" data-action="rotate-selected-ccw" title="Rotate 90 degrees counterclockwise">${uiIcon("rotate-ccw")}<span>Rotate CCW</span></button>
      <button type="button" data-action="rotate-selected-cw" title="Rotate 90 degrees clockwise">${uiIcon("rotate-cw")}<span>Rotate CW</span></button>
    ` : "";
    el.contextMenu.innerHTML = `
      ${rotationControls}
      <button type="button" class="danger" data-action="delete-selected" title="Delete selected item">${uiIcon("trash")}<span>Delete item</span></button>
    `;
  }

  function updateSelectionMarquee() {
    const drag = state.marqueeDrag;
    if (!drag || !el.selectionMarquee) return;
    const rect = selectionRectFromPoints(drag.start, drag.current);
    el.selectionMarquee.hidden = !drag.moved;
    el.selectionMarquee.style.left = `${(rect.left / GRID.width) * 100}%`;
    el.selectionMarquee.style.top = `${(rect.top / GRID.height) * 100}%`;
    el.selectionMarquee.style.width = `${(rect.width / GRID.width) * 100}%`;
    el.selectionMarquee.style.height = `${(rect.height / GRID.height) * 100}%`;
  }

  function hideSelectionMarquee() {
    if (!el.selectionMarquee) return;
    el.selectionMarquee.hidden = true;
    el.selectionMarquee.removeAttribute("style");
  }

  function hideContextMenu() {
    if (el.contextMenu) el.contextMenu.hidden = true;
  }

  function setGridColor(value, options = {}) {
    const color = normalizeHexColor(value);
    if (!color) return;
    state.gridColor = color;
    applyGridColor(color);
    if (options.syncPicker !== false) {
      el.gridColorPicker.value = color;
    }
    if (options.syncText !== false) {
      el.gridColorHex.value = color;
    }
    if (options.syncRgb !== false) {
      syncGridRgbControls(color);
    }
  }

  function applyGridColor(color) {
    const rgb = hexToRgb(color);
    if (!rgb) return;
    const line = gridLineColor(rgb);
    const wash = gridWashColor(rgb);
    el.sandbox.style.setProperty("--grid-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    el.sandbox.style.setProperty("--grid-bg-color", color);
    el.sandbox.style.setProperty("--grid-line-color", `rgba(${line.r}, ${line.g}, ${line.b}, ${line.a})`);
    el.sandbox.style.setProperty("--grid-wash-color", `rgba(${wash.r}, ${wash.g}, ${wash.b}, ${wash.a})`);
  }

  function gridLineColor(rgb) {
    const luminance = relativeLuminance(rgb);
    const target = luminance > 0.58 ? { r: 30, g: 39, b: 50 } : { r: 255, g: 255, b: 255 };
    const amount = luminance > 0.88 ? 0.4 : luminance > 0.58 ? 0.32 : 0.45;
    return { ...mixRgb(rgb, target, amount), a: luminance > 0.88 ? 0.28 : 0.24 };
  }

  function gridWashColor(rgb) {
    const target = relativeLuminance(rgb) > 0.58 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
    return { ...mixRgb(rgb, target, 0.24), a: 0.08 };
  }

  function mixRgb(a, b, amount) {
    return {
      r: Math.round(a.r + (b.r - a.r) * amount),
      g: Math.round(a.g + (b.g - a.g) * amount),
      b: Math.round(a.b + (b.b - a.b) * amount)
    };
  }

  function relativeLuminance(rgb) {
    const linear = [rgb.r, rgb.g, rgb.b].map((value) => {
      const channel = value / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  function normalizeHexColor(value) {
    const trimmed = String(value || "").trim();
    const short = trimmed.match(/^#?([0-9a-f]{3})$/i);
    if (short) {
      return `#${short[1].split("").map((char) => char + char).join("")}`.toLowerCase();
    }
    const full = trimmed.match(/^#?([0-9a-f]{6})$/i);
    return full ? `#${full[1].toLowerCase()}` : "";
  }

  function hexToRgb(value) {
    const color = normalizeHexColor(value);
    if (!color) return null;
    return {
      r: parseInt(color.slice(1, 3), 16),
      g: parseInt(color.slice(3, 5), 16),
      b: parseInt(color.slice(5, 7), 16)
    };
  }

  function readGridRgbInputs() {
    const values = [el.gridColorR, el.gridColorG, el.gridColorB].map((input) => Number(input.value));
    return values.every((value) => Number.isFinite(value) && value >= 0 && value <= 255)
      ? { r: values[0], g: values[1], b: values[2] }
      : null;
  }

  function rgbToHex(rgb) {
    return `#${[rgb.r, rgb.g, rgb.b].map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0")).join("")}`;
  }

  function syncGridRgbControls(color) {
    const rgb = hexToRgb(color);
    if (!rgb) return;
    [
      [el.gridColorR, rgb.r],
      [el.gridColorG, rgb.g],
      [el.gridColorB, rgb.b]
    ].forEach(([input, value]) => {
      if (document.activeElement !== input && Number(input.value) !== value) {
        input.value = value;
      }
    });
  }

  function suppressNextClick() {
    state.suppressClick = true;
    window.setTimeout(() => {
      state.suppressClick = false;
    }, 0);
  }

  function pointInElement(x, y, element) {
    const rect = element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function isTypingTarget(target) {
    return Boolean(target?.closest?.("input, textarea, select, [contenteditable='true']"));
  }

  function posStyle(x, y) {
    return `left:${(x / GRID.width) * 100}%; top:${(y / GRID.height) * 100}%`;
  }

  function makeId(prefix) {
    const id = `${prefix}_${state.nextId}`;
    state.nextId += 1;
    return id;
  }

  function snap(value) {
    return Math.round(value / 20) * 20;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function sameSet(a, b) {
    if (a.size !== b.size) return false;
    for (const value of a) {
      if (!b.has(value)) return false;
    }
    return true;
  }

  function cloneValue(value) {
    if (value === undefined) return undefined;
    return JSON.parse(JSON.stringify(value));
  }

  function midpointOf(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function colorName(color) {
    return color[0].toUpperCase() + color.slice(1);
  }

  function capitalize(value) {
    return value ? value[0].toUpperCase() + value.slice(1) : "";
  }

  function formatFileTimestamp(date) {
    return date.toISOString().replace(/\.\d{3}Z$/, "Z").replaceAll(":", "-");
  }

  function switchOnClass(device) {
    if (device.type === "switch") return device.on ? "on" : "";
    if (device.type === "threeWaySwitch") return device.position === "B" ? "on" : "";
    if (device.type === "fourWaySwitch") return device.crossed ? "on" : "";
    return "";
  }

  function switchStateLabel(device) {
    if (device.type === "switch") return device.on ? "ON" : "OFF";
    if (device.type === "threeWaySwitch") return device.position === "B" ? "B" : "A";
    if (device.type === "fourWaySwitch") return device.crossed ? "X" : "||";
    return "";
  }

  function deviceHelp(type) {
    if (type === "gfciOutlet") return "Drag wires to the actual LINE/LOAD screws. LINE must receive hot and neutral before LOAD passes power.";
    if (type === "switch") return "Click the switch to open or close it. Wire it in series with a hot leg.";
    if (type === "threeWaySwitch") return "Click the switch throw to move the dark common screw between the two brass travelers.";
    if (type === "fourWaySwitch") return "Click the switch throw to swap the two traveler pairs. Keep one cable pair on the black screws and the other pair on the brass screws.";
    if (type === "lightBulb") return "The bulb uses the whole box. It lights only with a hot and neutral path.";
    if (type === "socketLight") return "Drag this tester onto the top or bottom socket of an outlet. It lights only when that receptacle has hot and neutral.";
    return "Drag black/red hots to brass screws, white neutral to silver screws, and green ground to the green screw.";
  }

  function connectionText(connection) {
    if (!connection) return "Open";
    if (connection.kind === "sourceTerminal") return `Power in ${connection.key}`;
    if (connection.kind === "boxGround") return `Box ground screw`;
    if (connection.kind === "wireNut") return `Wire nut`;
    if (connection.kind === "boxHole") return boxHoleLabel(connection);
    if (connection.kind === "deviceTerminal") {
      const terminal = terminalDef(connection.deviceId, connection.terminalKey);
      const device = deviceById(connection.deviceId);
      return `${DEVICE_DEFS[device?.type]?.label || "Device"} ${terminal?.label || "terminal"}`;
    }
    return "Connected";
  }

  function pill(label, value, className) {
    return `<span class="status-pill ${className}">${escapeHtml(label)}: ${escapeHtml(value)}</span>`;
  }

  function addLog(message) {
    state.log.push(message);
    if (state.log.length > 80) state.log.shift();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
