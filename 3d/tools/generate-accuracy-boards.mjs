import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] || "/private/tmp/3d_upgrade_accuracy";
const outDir = path.join(root, "concepts", "accuracy-locked");
fs.mkdirSync(outDir, { recursive: true });

const colors = {
  bg: "#f4f6f8",
  panel: "#ffffff",
  ink: "#17202a",
  muted: "#5d6875",
  yoke: "#cfd6dc",
  yokeDark: "#9fa9b3",
  white: "#fbfbf8",
  brass: "#c58a21",
  silver: "#c8d0d8",
  green: "#1f9a5b",
  black: "#1c1d20",
  red: "#d73535",
  copper: "#c96f2c",
  beige: "#e9dfc9"
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[ch]));
}

function attrs(input) {
  return Object.entries(input)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}="${esc(value)}"`)
    .join(" ");
}

function tag(name, attributes = {}, body = "") {
  const a = attrs(attributes);
  return body === "" ? `<${name}${a ? ` ${a}` : ""}/>` : `<${name}${a ? ` ${a}` : ""}>${body}</${name}>`;
}

function text(x, y, value, size = 28, weight = 700, fill = colors.ink, anchor = "middle") {
  return tag("text", {
    x, y,
    "text-anchor": anchor,
    "font-family": "Inter, Arial, Helvetica, sans-serif",
    "font-size": size,
    "font-weight": weight,
    fill
  }, esc(value));
}

function multiline(x, y, lines, size = 20, fill = colors.muted) {
  return lines.map((line, index) => text(x, y + index * (size + 6), line, size, 650, fill)).join("");
}

function screw(cx, cy, fill, r = 13, stroke = "#3e4650") {
  return [
    tag("circle", { cx, cy, r, fill, stroke, "stroke-width": 2 }),
    tag("line", { x1: cx - r * 0.55, y1: cy, x2: cx + r * 0.55, y2: cy, stroke: "#fff", "stroke-width": 2.5, "stroke-linecap": "round", opacity: 0.85 }),
    tag("line", { x1: cx, y1: cy - r * 0.55, x2: cx, y2: cy + r * 0.55, stroke: "#fff", "stroke-width": 2.5, "stroke-linecap": "round", opacity: 0.85 })
  ].join("");
}

function board(title, subtitle, width, height, body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#26313d" flood-opacity="0.18"/>
    </filter>
    <linearGradient id="deviceFace" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f2f4f6"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#f5f7f8"/>
      <stop offset="45%" stop-color="#cfd6dc"/>
      <stop offset="100%" stop-color="#9fa9b3"/>
    </linearGradient>
    <linearGradient id="boxMetal" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#f2f6f8"/>
      <stop offset="50%" stop-color="#b7c0c7"/>
      <stop offset="100%" stop-color="#7f8b95"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="${colors.bg}"/>
  ${text(width / 2, 58, title, 34, 800)}
  ${text(width / 2, 92, subtitle, 18, 650, colors.muted)}
  ${body}
</svg>`;
}

function assetLabel(cx, y, label, detail) {
  return [
    tag("rect", { x: cx - 220, y, width: 440, height: detail ? 86 : 58, rx: 16, fill: "#fff", stroke: "#d7dde3" }),
    text(cx, y + 36, label, 24, 800),
    detail ? multiline(cx, y + 64, [detail], 16, colors.muted) : ""
  ].join("");
}

function mountingYoke(x, y, w, h) {
  const center = x + w / 2;
  return [
    tag("rect", { x: center - 44, y: y - 76, width: 88, height: 96, rx: 10, fill: "url(#metal)", stroke: colors.yokeDark }),
    tag("rect", { x: center - 44, y: y + h - 20, width: 88, height: 96, rx: 10, fill: "url(#metal)", stroke: colors.yokeDark }),
    tag("circle", { cx: center - 62, cy: y - 38, r: 22, fill: "none", stroke: colors.yokeDark, "stroke-width": 7 }),
    tag("circle", { cx: center + 62, cy: y - 38, r: 22, fill: "none", stroke: colors.yokeDark, "stroke-width": 7 }),
    tag("circle", { cx: center - 62, cy: y + h + 38, r: 22, fill: "none", stroke: colors.yokeDark, "stroke-width": 7 }),
    tag("circle", { cx: center + 62, cy: y + h + 38, r: 22, fill: "none", stroke: colors.yokeDark, "stroke-width": 7 }),
    screw(center, y - 30, colors.silver, 11, colors.yokeDark),
    screw(center, y + h + 30, colors.silver, 11, colors.yokeDark)
  ].join("");
}

function receptacleSlots(cx, cy) {
  return [
    tag("rect", { x: cx - 35, y: cy - 36, width: 14, height: 52, rx: 4, fill: "#111" }),
    tag("rect", { x: cx + 21, y: cy - 36, width: 14, height: 52, rx: 4, fill: "#111" }),
    tag("path", { d: `M ${cx - 26} ${cy + 48} Q ${cx} ${cy + 25} ${cx + 26} ${cy + 48} L ${cx + 22} ${cy + 70} L ${cx - 22} ${cy + 70} Z`, fill: "#111" })
  ].join("");
}

function terminalCallout(x1, y1, x2, y2, value, anchor = "middle") {
  return [
    tag("line", { x1, y1, x2, y2, stroke: "#74808c", "stroke-width": 2, "stroke-linecap": "round" }),
    tag("circle", { cx: x1, cy: y1, r: 4, fill: "#74808c" }),
    text(x2, y2 - 6, value, 15, 800, colors.ink, anchor)
  ].join("");
}

function outletAsset(cx, cy, kind) {
  const w = 170;
  const h = kind === "gfci" ? 330 : 360;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const hotTabRemoved = kind === "half";
  const isGfci = kind === "gfci";
  return tag("g", { filter: "url(#shadow)" }, [
    mountingYoke(x, y, w, h),
    tag("rect", { x, y, width: w, height: h, rx: 24, fill: "url(#deviceFace)", stroke: "#d7dde4", "stroke-width": 3 }),
    isGfci
      ? [
          receptacleSlots(cx, y + 72),
          tag("rect", { x: cx - 50, y: y + 142, width: 100, height: 38, rx: 7, fill: "#f9fafb", stroke: "#959da7", "stroke-width": 2 }),
          text(cx, y + 167, "TEST", 16, 800),
          tag("rect", { x: cx - 50, y: y + 194, width: 100, height: 38, rx: 7, fill: "#f9fafb", stroke: "#959da7", "stroke-width": 2 }),
          text(cx, y + 219, "RESET", 16, 800),
          receptacleSlots(cx, y + 288)
        ].join("")
      : [
          tag("rect", { x: x + 17, y: y + 24, width: w - 34, height: 138, rx: 28, fill: "#fff", stroke: "#e3e6ea" }),
          receptacleSlots(cx, y + 74),
          tag("circle", { cx, cy: y + 180, r: 10, fill: "#111" }),
          tag("rect", { x: x + 17, y: y + 198, width: w - 34, height: 138, rx: 28, fill: "#fff", stroke: "#e3e6ea" }),
          receptacleSlots(cx, y + 248)
        ].join(""),
    screw(x - 22, y + 88, colors.silver),
    screw(x - 22, y + (isGfci ? 210 : 260), colors.silver),
    screw(x + w + 22, y + 88, colors.brass),
    screw(x + w + 22, y + (isGfci ? 210 : 260), colors.brass),
    screw(x - 22, y + h - 28, colors.green),
    tag("rect", { x: x - 8, y: y + 105, width: 7, height: isGfci ? 86 : 135, rx: 3, fill: "#cfd6dc" }),
    hotTabRemoved
      ? [
          tag("rect", { x: x + w + 2, y: y + 110, width: 7, height: 42, rx: 3, fill: colors.brass }),
          tag("rect", { x: x + w + 2, y: y + 205, width: 7, height: 42, rx: 3, fill: colors.brass }),
          tag("line", { x1: x + w + 1, y1: y + 168, x2: x + w + 11, y2: y + 192, stroke: colors.red, "stroke-width": 4, "stroke-linecap": "round" })
        ].join("")
      : tag("rect", { x: x + w + 2, y: y + 105, width: 7, height: isGfci ? 86 : 135, rx: 3, fill: colors.brass }),
    text(x - 48, y + 55, "silver", 13, 700, colors.muted),
    text(x + w + 52, y + 55, "brass", 13, 700, colors.muted)
  ].join(""));
}

function gfciRearAsset(cx, cy) {
  const w = 190;
  const h = 330;
  const x = cx - w / 2;
  const y = cy - h / 2;
  return tag("g", { filter: "url(#shadow)" }, [
    mountingYoke(x, y, w, h),
    tag("rect", { x, y, width: w, height: h, rx: 18, fill: "#f8fafc", stroke: "#aeb8c2", "stroke-width": 3 }),
    tag("rect", { x: x + 18, y: y + 34, width: w - 36, height: 112, rx: 12, fill: "#eef2f5", stroke: "#c0c8d0", "stroke-width": 2 }),
    tag("rect", { x: x + 18, y: y + 184, width: w - 36, height: 112, rx: 12, fill: "#eef2f5", stroke: "#c0c8d0", "stroke-width": 2 }),
    text(cx, y + 70, "LINE / IN", 18, 850),
    text(cx, y + 220, "LOAD / OUT", 18, 850),
    text(x + 50, y + 96, "neutral", 13, 700, colors.muted),
    text(x + 140, y + 96, "hot", 13, 700, colors.muted),
    text(x + 50, y + 246, "neutral", 13, 700, colors.muted),
    text(x + 140, y + 246, "hot", 13, 700, colors.muted),
    screw(x + 48, y + 126, colors.silver),
    screw(x + 142, y + 126, colors.brass),
    screw(x + 48, y + 276, colors.silver),
    screw(x + 142, y + 276, colors.brass),
    screw(x - 24, y + h - 30, colors.green),
    terminalCallout(x + 48, y + 126, x - 46, y + 110, "silver"),
    terminalCallout(x + 142, y + 126, x + w + 54, y + 110, "brass"),
    terminalCallout(x + 48, y + 276, x - 46, y + 292, "silver"),
    terminalCallout(x + 142, y + 276, x + w + 54, y + 292, "brass")
  ].join(""));
}

function switchAsset(cx, cy, kind) {
  const w = 150;
  const h = 330;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const screwGroups = [];

  if (kind === "single") {
    screwGroups.push(screw(x + w + 22, y + 110, colors.brass));
    screwGroups.push(screw(x + w + 22, y + 220, colors.brass));
    screwGroups.push(screw(x - 22, y + 285, colors.green));
  } else if (kind === "three") {
    screwGroups.push(screw(x - 22, y + 112, colors.brass));
    screwGroups.push(screw(x + w + 22, y + 112, colors.brass));
    screwGroups.push(screw(x + w + 22, y + 248, colors.black));
    screwGroups.push(screw(x - 22, y + 38, colors.green));
  } else {
    screwGroups.push(screw(x - 22, y + 112, colors.brass));
    screwGroups.push(screw(x + w + 22, y + 112, colors.brass));
    screwGroups.push(screw(x - 22, y + 248, colors.black));
    screwGroups.push(screw(x + w + 22, y + 248, colors.black));
    screwGroups.push(screw(x - 22, y + 306, colors.green));
  }

  const terminalText = kind === "single"
    ? ["2 brass terminals", "1 green ground"]
    : kind === "three"
      ? ["User ref: brass travelers upper L/R", "black common lower right; ground high left"]
      : ["User ref: brass travelers upper L/R", "black travelers lower L/R; ground low left"];

  return tag("g", { filter: "url(#shadow)" }, [
    mountingYoke(x, y, w, h),
    tag("rect", { x, y, width: w, height: h, rx: 20, fill: "url(#deviceFace)", stroke: "#d7dde4", "stroke-width": 3 }),
    kind === "single"
      ? ""
      : tag("path", { d: `M ${cx - 62} ${y + 35} L ${cx + 62} ${y + 35} L ${cx + 66} ${y + 238} Q ${cx + 48} ${y + 258} ${cx + 58} ${y + 302} L ${cx - 58} ${y + 302} Q ${cx - 48} ${y + 258} ${cx - 66} ${y + 238} Z`, fill: "url(#metal)", stroke: colors.yokeDark, "stroke-width": 2, opacity: 0.92 }),
    tag("rect", { x: cx - 42, y: y + 95, width: 84, height: 140, rx: 8, fill: "#edf0f3", stroke: "#888f98", "stroke-width": 3 }),
    tag("path", { d: `M ${cx - 28} ${y + 110} L ${cx + 30} ${y + 104} L ${cx + 22} ${y + 222} L ${cx - 25} ${y + 228} Z`, fill: "#fff", stroke: "#c8ced6", "stroke-width": 2 }),
    screwGroups.join(""),
    kind === "three"
      ? [
          terminalCallout(x - 22, y + 112, x - 98, y + 92, "traveler"),
          terminalCallout(x + w + 22, y + 112, x + w + 98, y + 92, "traveler"),
          terminalCallout(x + w + 22, y + 248, x + w + 104, y + 266, "common")
        ].join("")
      : "",
    kind === "four"
      ? [
          terminalCallout(x - 22, y + 112, x - 98, y + 92, "traveler"),
          terminalCallout(x + w + 22, y + 112, x + w + 98, y + 92, "traveler"),
          terminalCallout(x - 22, y + 248, x - 102, y + 266, "traveler"),
          terminalCallout(x + w + 22, y + 248, x + w + 102, y + 266, "traveler")
        ].join("")
      : "",
    multiline(cx, y + h + 108, terminalText, 17, colors.muted)
  ].join(""));
}

function wireAsset(cx, cy, color, label) {
  const stroke = color === "white" ? "#f7f7f2" : colors[color];
  const outline = color === "white" ? "#c7ced6" : stroke;
  return [
    tag("path", { d: `M ${cx - 150} ${cy} C ${cx - 75} ${cy - 32}, ${cx + 75} ${cy + 32}, ${cx + 150} ${cy}`, fill: "none", stroke: outline, "stroke-width": 32, "stroke-linecap": "round" }),
    tag("path", { d: `M ${cx - 150} ${cy} C ${cx - 75} ${cy - 32}, ${cx + 75} ${cy + 32}, ${cx + 150} ${cy}`, fill: "none", stroke, "stroke-width": 26, "stroke-linecap": "round" }),
    tag("line", { x1: cx - 192, y1: cy, x2: cx - 150, y2: cy, stroke: colors.copper, "stroke-width": 22, "stroke-linecap": "round" }),
    tag("line", { x1: cx + 150, y1: cy, x2: cx + 192, y2: cy, stroke: colors.copper, "stroke-width": 22, "stroke-linecap": "round" }),
    text(cx, cy + 122, label, 23, 800)
  ].join("");
}

function wireNut(cx, cy) {
  return [
    tag("path", { d: `M ${cx - 50} ${cy + 66} L ${cx + 50} ${cy + 66} L ${cx + 36} ${cy - 68} Q ${cx} ${cy - 102} ${cx - 36} ${cy - 68} Z`, fill: "#ffa51c", stroke: "#c87900", "stroke-width": 3, filter: "url(#shadow)" }),
    ...[-30, -15, 0, 15, 30].map((offset) => tag("line", { x1: cx - 34, y1: cy + offset, x2: cx + 34, y2: cy + offset - 8, stroke: "#ffd36d", "stroke-width": 4, "stroke-linecap": "round" })),
    text(cx, cy + 132, "Wire Nut", 23, 800)
  ].join("");
}

function nmCable(cx, cy, type) {
  const conductors = type === 2
    ? [{ c: colors.black, y: -28 }, { c: colors.white, y: 8, stroke: "#c7ced6" }, { c: colors.copper, y: 42 }]
    : [{ c: colors.black, y: -45 }, { c: colors.red, y: -15 }, { c: colors.white, y: 15, stroke: "#c7ced6" }, { c: colors.copper, y: 48 }];
  return [
    tag("rect", { x: cx - 170, y: cy - 60, width: 240, height: 120, rx: 26, fill: colors.beige, stroke: "#d3c6a8", "stroke-width": 3, filter: "url(#shadow)" }),
    ...conductors.map((wire) => [
      tag("line", { x1: cx + 50, y1: cy + wire.y, x2: cx + 205, y2: cy + wire.y * 1.45, stroke: wire.stroke || wire.c, "stroke-width": 18, "stroke-linecap": "round" }),
      tag("line", { x1: cx + 200, y1: cy + wire.y * 1.45, x2: cx + 245, y2: cy + wire.y * 1.45, stroke: colors.copper, "stroke-width": 13, "stroke-linecap": "round" })
    ].join("")),
    text(cx, cy + 148, `${type}-Wire NM-B Cable`, 23, 800),
    text(cx, cy + 176, type === 2 ? "black + white + bare ground" : "black + red + white + bare ground", 16, 650, colors.muted)
  ].join("");
}

function metalBox(cx, cy) {
  const x = cx - 170;
  const y = cy - 150;
  return tag("g", { filter: "url(#shadow)" }, [
    tag("rect", { x, y, width: 340, height: 300, rx: 12, fill: "url(#boxMetal)", stroke: "#6f7b85", "stroke-width": 4 }),
    tag("rect", { x: x + 30, y: y + 30, width: 280, height: 240, rx: 8, fill: "#dbe1e5", stroke: "#6f7b85", "stroke-width": 3 }),
    ...[
      [cx - 95, cy - 62, 55], [cx, cy - 62, 55], [cx + 95, cy - 62, 55],
      [cx - 66, cy + 52, 64], [cx + 66, cy + 52, 64]
    ].map(([kx, ky, r]) => tag("circle", { cx: kx, cy: ky, r: r / 2, fill: "none", stroke: "#8b969f", "stroke-width": 4 })),
    screw(cx + 112, cy + 70, colors.green, 16),
    text(cx + 112, cy + 113, "ground", 15, 700, colors.muted)
  ].join(""));
}

function sourceModule(cx, cy) {
  const x = cx - 150;
  const y = cy - 150;
  return tag("g", { filter: "url(#shadow)" }, [
    tag("rect", { x, y, width: 300, height: 300, rx: 18, fill: "#f8fafc", stroke: "#aeb8c2", "stroke-width": 4 }),
    tag("rect", { x: cx - 76, y: y + 42, width: 152, height: 150, rx: 14, fill: "#20242a" }),
    tag("rect", { x: cx - 48, y: y + 62, width: 38, height: 105, rx: 8, fill: "#343a40" }),
    tag("rect", { x: cx + 10, y: y + 62, width: 38, height: 105, rx: 8, fill: "#343a40" }),
    screw(cx - 82, y + 232, colors.black, 17),
    screw(cx, y + 232, colors.silver, 17),
    screw(cx + 82, y + 232, colors.green, 17),
    text(cx - 82, y + 270, "hot", 15, 700, colors.muted),
    text(cx, y + 270, "neutral", 15, 700, colors.muted),
    text(cx + 82, y + 270, "ground", 15, 700, colors.muted)
  ].join(""));
}

function protectedOutlet(cx, cy) {
  return tag("g", { filter: "url(#shadow)" }, [
    tag("rect", { x: cx - 92, y: cy - 145, width: 184, height: 290, rx: 16, fill: "url(#deviceFace)", stroke: "#ccd3da", "stroke-width": 3 }),
    receptacleSlots(cx, cy - 78),
    tag("rect", { x: cx - 48, y: cy - 12, width: 96, height: 32, rx: 7, fill: "#fff", stroke: "#949ca6", "stroke-width": 2 }),
    tag("rect", { x: cx - 48, y: cy + 33, width: 96, height: 32, rx: 7, fill: "#fff", stroke: "#949ca6", "stroke-width": 2 }),
    receptacleSlots(cx, cy + 110),
    tag("path", { d: `M ${cx + 92} ${cy - 100} C ${cx + 205} ${cy - 178}, ${cx + 260} ${cy - 70}, ${cx + 238} ${cy + 10}`, fill: "none", stroke: "#fafafa", "stroke-width": 30, "stroke-linecap": "round" }),
    tag("rect", { x: cx + 210, y: cy - 10, width: 88, height: 100, rx: 22, fill: "#fff", stroke: "#ccd3da", "stroke-width": 3 }),
    tag("line", { x1: cx + 244, y1: cy + 90, x2: cx + 232, y2: cy + 145, stroke: colors.brass, "stroke-width": 10, "stroke-linecap": "round" }),
    tag("line", { x1: cx + 268, y1: cy + 90, x2: cx + 282, y2: cy + 145, stroke: colors.brass, "stroke-width": 10, "stroke-linecap": "round" })
  ].join(""));
}

function lampholder(cx, cy) {
  return tag("g", { filter: "url(#shadow)" }, [
    tag("circle", { cx, cy, r: 110, fill: "url(#deviceFace)", stroke: "#ccd3da", "stroke-width": 4 }),
    tag("circle", { cx, cy: cy - 10, r: 68, fill: "#fff", stroke: "#d2d8df", "stroke-width": 4 }),
    tag("circle", { cx, cy: cy - 10, r: 46, fill: "#d19a28", stroke: "#9d6d12", "stroke-width": 4 }),
    tag("path", { d: `M ${cx - 40} ${cy - 12} C ${cx - 18} ${cy - 32}, ${cx + 18} ${cy + 12}, ${cx + 40} ${cy - 12}`, fill: "none", stroke: "#fff3bb", "stroke-width": 5 }),
    screw(cx - 82, cy + 82, colors.brass, 16),
    screw(cx + 82, cy + 82, colors.silver, 16),
    text(cx - 82, cy + 125, "hot", 15, 700, colors.muted),
    text(cx + 82, cy + 125, "neutral", 15, 700, colors.muted)
  ].join(""));
}

function testBulb(cx, cy) {
  return tag("g", { filter: "url(#shadow)" }, [
    tag("path", { d: `M ${cx - 58} ${cy - 36} C ${cx - 68} ${cy - 118}, ${cx + 68} ${cy - 118}, ${cx + 58} ${cy - 36} C ${cx + 50} ${cy + 20}, ${cx - 50} ${cy + 20}, ${cx - 58} ${cy - 36} Z`, fill: "#fbfdff", stroke: "#b9c3cc", "stroke-width": 4, opacity: 0.92 }),
    tag("rect", { x: cx - 42, y: cy + 8, width: 84, height: 62, rx: 9, fill: "#d19a28", stroke: "#9d6d12", "stroke-width": 4 }),
    tag("line", { x1: cx - 26, y1: cy + 70, x2: cx - 26, y2: cy + 116, stroke: colors.brass, "stroke-width": 9, "stroke-linecap": "round" }),
    tag("line", { x1: cx + 26, y1: cy + 70, x2: cx + 26, y2: cy + 116, stroke: colors.brass, "stroke-width": 9, "stroke-linecap": "round" }),
    tag("path", { d: `M ${cx - 28} ${cy - 10} C ${cx - 8} ${cy - 44}, ${cx + 8} ${cy - 44}, ${cx + 28} ${cy - 10}`, fill: "none", stroke: "#6f7782", "stroke-width": 3 })
  ].join(""));
}

fs.writeFileSync(path.join(outDir, "outlets-accuracy-board.svg"), board(
  "Accuracy-Locked Outlet Assets",
  "Clean brand-new finish. GFCI front labels and LINE/LOAD side-back markings are explicit.",
  1800,
  1060,
  [
    outletAsset(285, 410, "standard"),
    outletAsset(770, 410, "half"),
    outletAsset(1220, 410, "gfci"),
    gfciRearAsset(1515, 410),
    assetLabel(285, 800, "Standard Outlet", "2 brass + 2 silver + green; both tabs intact"),
    assetLabel(770, 800, "Half-Hot Outlet", "2 brass + 2 silver + green; hot tab removed"),
    assetLabel(1370, 800, "GFCI Outlet", "front TEST/RESET; rear LINE/IN + LOAD/OUT")
  ].join("")
));

fs.writeFileSync(path.join(outDir, "switches-accuracy-board.svg"), board(
  "Accuracy-Locked Switch Assets",
  "Terminal placement follows the user-provided 3-way and 4-way reference photos.",
  1600,
  980,
  [
    switchAsset(300, 390, "single"),
    switchAsset(800, 390, "three"),
    switchAsset(1300, 390, "four"),
    assetLabel(300, 795, "Single-Pole Switch", "2 brass terminals + 1 green ground"),
    assetLabel(800, 795, "3-Way Switch", "brass travelers upper L/R; black common lower R"),
    assetLabel(1300, 795, "4-Way Switch", "brass upper L/R; black lower L/R; no common")
  ].join("")
));

fs.writeFileSync(path.join(outDir, "wiring-connectors-accuracy-board.svg"), board(
  "Accuracy-Locked Wire And Cable Assets",
  "Fresh insulation, bright copper, clean cable jackets, every asset labeled.",
  1800,
  1060,
  [
    wireAsset(250, 230, "black", "Black Hot Wire"),
    wireAsset(700, 230, "red", "Red Traveler/Hot Wire"),
    wireAsset(1150, 230, "white", "White Neutral Wire"),
    wireAsset(1600, 230, "green", "Green Ground Wire"),
    wireNut(260, 640),
    nmCable(830, 630, 2),
    nmCable(1380, 630, 3)
  ].join("")
));

fs.writeFileSync(path.join(outDir, "boxes-supply-lighting-accuracy-board.svg"), board(
  "Accuracy-Locked Box, Source, And Lighting Assets",
  "Fresh clean materials with visible simulator connection points.",
  1800,
  1080,
  [
    metalBox(300, 350),
    sourceModule(900, 350),
    protectedOutlet(1450, 350),
    lampholder(650, 760),
    testBulb(1150, 760),
    assetLabel(300, 575, "4x4 Metal Box", "one green ground screw"),
    assetLabel(900, 575, "Breaker / Source Module", "hot + neutral + ground training terminals"),
    assetLabel(1450, 575, "Protected Outlet Source", "clean protected outlet and cord source"),
    assetLabel(650, 940, "Keyless Lampholder", "brass hot + silver neutral only"),
    assetLabel(1150, 940, "Socket Lightbulb", "small plug-in/receptacle test light")
  ].join("")
));

console.log(outDir);
