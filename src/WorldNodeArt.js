// Procedural pixel-art region renders for the home map nodes.
// Each function returns a Container drawn at (x, y) (the position is set on
// the container, drawing offsets are local). Sized to ~140-180px on the
// longest axis at default scale. Pass `scale` to resize.

import { style } from './textStyles.js';

export function drawWorldNode(scene, x, y, worldId, opts = {}) {
  const scale = opts.scale ?? 1;
  const container = scene.add.container(x, y);
  if (opts.silhouette) {
    drawSilhouette(scene, container);
  } else {
    const renderer = NODE_RENDERERS[worldId] || NODE_RENDERERS[1];
    renderer(scene, container, scale);
  }
  container.setScale(scale);
  container.worldId = worldId;
  return container;
}

// Generic locked-world silhouette: dark blob + ? glyph.
function drawSilhouette(scene, c) {
  const g = scene.add.graphics();
  // Drop shadow
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(0, 56, 130, 22);
  // Main silhouette body — soft rounded blob
  g.fillStyle(0x12122a, 0.92);
  g.fillCircle(0, 0, 60);
  g.fillCircle(-22, -10, 32);
  g.fillCircle(28, -6, 28);
  g.fillCircle(-10, 30, 24);
  // Subtle accent edge
  g.lineStyle(3, 0x2a2a44, 1);
  g.strokeCircle(0, 0, 62);
  c.add(g);
  const q = scene.add.text(0, 4, '?', style('display', {
    fontSize: '64px',
    fill: '#3a3a4a',
    strokeThickness: 4
  })).setOrigin(0.5);
  c.add(q);
}

const NODE_RENDERERS = {};

// 1 — Moon Base: pale periwinkle moon with mint highlights and candy flag
NODE_RENDERERS[1] = function drawMoonBase(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(0, 50, 130, 24);
  // Base body — shadow band first, then mid, then bright top
  g.fillStyle(0x8b9bd6, 1);
  g.fillCircle(0, 0, 60);
  g.fillStyle(0xc7d2ff, 1);
  g.fillCircle(-4, -6, 54);
  g.fillStyle(0xe8efff, 1);
  g.fillEllipse(-20, -22, 44, 28);
  // Cratery details
  g.fillStyle(0x6f7ec4, 0.9);
  g.fillCircle(20, 14, 9);
  g.fillCircle(-12, 26, 7);
  g.fillCircle(34, -14, 6);
  g.fillStyle(0xb5e6ff, 0.7);
  g.fillCircle(20, 12, 4);
  // Candy-stripe flag pole
  g.lineStyle(3, 0xfff3b8, 1);
  g.lineBetween(-5, -58, -5, -22);
  g.fillStyle(0xff9ec7, 1);
  g.fillTriangle(-5, -58, -5, -44, 22, -52);
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(-5, -52, -5, -46, 14, -49);
  c.add(g);
};

// 2 — Asteroid Belt: peach + clay rocks with bright rim light
NODE_RENDERERS[2] = function drawAsteroidBelt(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(0, 60, 150, 22);
  const rocks = [
    [-30, -10, 28, 0xd49774, 0xffd0a6],
    [25, 5, 35, 0xc77a4a, 0xffb38a],
    [10, -30, 22, 0xe2a884, 0xffe0c2],
    [-50, 18, 18, 0xb56a3e, 0xffa37a],
    [45, -22, 16, 0xd49774, 0xffd0a6]
  ];
  for (const [rx, ry, r, base, rim] of rocks) {
    g.fillStyle(base, 1);
    g.fillCircle(rx, ry, r);
    // Bright rim light on the upper-left
    g.fillStyle(rim, 1);
    g.fillCircle(rx - r * 0.35, ry - r * 0.4, r * 0.55);
    // Soft shadow pool on the bottom-right
    g.fillStyle(0x6b3a1a, 0.45);
    g.fillCircle(rx + r * 0.3, ry + r * 0.25, r * 0.32);
  }
  // A few stardust speckles
  g.fillStyle(0xfff3b8, 1);
  g.fillCircle(60, 30, 2);
  g.fillCircle(-40, -28, 1.5);
  c.add(g);
};

// 3 — Crystal Planet: faceted lavender + rose with rainbow glints
NODE_RENDERERS[3] = function drawCrystalPlanet(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(0, 60, 140, 22);
  // Big central crystal — back/dark face
  g.fillStyle(0x9d6bff, 1);
  g.beginPath();
  g.moveTo(0, -58);
  g.lineTo(40, 12);
  g.lineTo(0, 52);
  g.lineTo(-40, 12);
  g.closePath();
  g.fillPath();
  // Mid face
  g.fillStyle(0xd5a6ff, 1);
  g.beginPath();
  g.moveTo(0, -58);
  g.lineTo(18, 0);
  g.lineTo(0, 36);
  g.lineTo(-18, 0);
  g.closePath();
  g.fillPath();
  // Bright front facet
  g.fillStyle(0xfce7ff, 1);
  g.beginPath();
  g.moveTo(0, -58);
  g.lineTo(8, -20);
  g.lineTo(0, 16);
  g.lineTo(-8, -20);
  g.closePath();
  g.fillPath();
  // Side crystals
  g.fillStyle(0xff9ec7, 1);
  g.fillTriangle(48, 12, 62, 52, 30, 52);
  g.fillStyle(0xffd0e5, 1);
  g.fillTriangle(38, 18, 48, 50, 30, 50);
  g.fillStyle(0xb6e0ff, 1);
  g.fillTriangle(-48, 12, -62, 52, -30, 52);
  g.fillStyle(0xe2f0ff, 1);
  g.fillTriangle(-38, 18, -48, 50, -30, 50);
  // Rainbow glints (small but bright)
  g.fillStyle(0xfff3b8, 1);
  g.fillCircle(-5, -22, 3);
  g.fillStyle(0x9be8a3, 1);
  g.fillCircle(22, -8, 2);
  g.fillStyle(0xff9ec7, 1);
  g.fillCircle(-26, 18, 2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(0, -40, 4);
  c.add(g);
};

// 4 — Nebula Gardens: mint green + lavender swirl with candy blossoms
NODE_RENDERERS[4] = function drawNebulaGardens(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(0, 60, 140, 22);
  // Hill — three layers from dark to bright
  g.fillStyle(0x3a7a52, 1);
  g.fillEllipse(0, 32, 124, 84);
  g.fillStyle(0x9be8a3, 1);
  g.fillEllipse(0, 26, 112, 62);
  g.fillStyle(0xd6f5d0, 0.85);
  g.fillEllipse(-18, 6, 56, 32);
  // Lavender nebula swirl drifting across
  g.fillStyle(0xd5a6ff, 0.45);
  g.fillEllipse(20, -6, 50, 22);
  g.fillStyle(0xfce7ff, 0.55);
  g.fillEllipse(8, -16, 30, 14);
  // Vine arch
  g.lineStyle(4, 0x4f956b, 1);
  g.beginPath();
  g.arc(0, 12, 24, Math.PI, 0);
  g.strokePath();
  // Blossoms
  g.fillStyle(0xff9ec7, 1);
  g.fillCircle(-24, 12, 7);
  g.fillCircle(24, 12, 7);
  g.fillStyle(0xfff3b8, 1);
  g.fillCircle(-24, 12, 3);
  g.fillCircle(24, 12, 3);
  g.fillStyle(0xffe07a, 1);
  g.fillCircle(0, -22, 6);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(0, -22, 2.5);
  c.add(g);
};

// 5 — Robot Station: sky blue + steel modules with cheerful lights
NODE_RENDERERS[5] = function drawRobotStation(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(0, 60, 130, 22);
  // Lower module (bright sky)
  g.fillStyle(0x9bd4ff, 1);
  g.fillRoundedRect(-44, 10, 88, 42, 10);
  g.fillStyle(0xd6ecff, 1);
  g.fillRoundedRect(-44, 10, 88, 12, 10);
  // Upper module (steel)
  g.fillStyle(0x4c7ab5, 1);
  g.fillRoundedRect(-32, -28, 64, 32, 8);
  g.fillStyle(0x82a8d8, 1);
  g.fillRoundedRect(-32, -28, 64, 8, 8);
  // Antenna with sparkle
  g.fillStyle(0xb6e0ff, 1);
  g.fillRect(-2, -58, 4, 30);
  g.fillStyle(0xfff3b8, 1);
  g.fillCircle(0, -60, 5);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(0, -60, 2);
  // Lights
  g.fillStyle(0xff9ec7, 1);
  g.fillCircle(-15, -12, 5);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-15, -12, 1.5);
  g.fillStyle(0x9be8a3, 1);
  g.fillCircle(15, -12, 5);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(15, -12, 1.5);
  // Window glow
  g.fillStyle(0xffe07a, 1);
  g.fillRoundedRect(-24, 26, 14, 14, 2);
  g.fillRoundedRect(10, 26, 14, 14, 2);
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(-22, 28, 4, 4);
  g.fillRect(12, 28, 4, 4);
  c.add(g);
};

// 6 — Black Hole Edge: rose accretion ring around a black void
NODE_RENDERERS[6] = function drawBlackHoleEdge(scene, c, _s) {
  const g = scene.add.graphics();
  // Soft outer halo
  g.fillStyle(0xff9ec7, 0.30);
  g.fillCircle(0, 0, 78);
  g.fillStyle(0xffd0e5, 0.45);
  g.fillCircle(0, 0, 60);
  // Mid pink ring
  g.fillStyle(0xff9ec7, 0.85);
  g.fillCircle(0, 0, 46);
  g.fillStyle(0xffd0e5, 1);
  g.fillCircle(0, 0, 36);
  // Dark inner zone with absolute void
  g.fillStyle(0x4a2a55, 1);
  g.fillCircle(0, 0, 28);
  g.fillStyle(0x07071a, 1);
  g.fillCircle(0, 0, 18);
  // Bright accretion arc on top, bending light
  g.lineStyle(4, 0xfff3b8, 0.9);
  g.beginPath();
  g.arc(0, 0, 54, Math.PI * 0.85, Math.PI * 0.15, true);
  g.strokePath();
  g.lineStyle(2, 0xff9ec7, 0.85);
  g.beginPath();
  g.arc(0, 0, 42, Math.PI, Math.PI * 1.6);
  g.strokePath();
  // Speck stars getting pulled in
  g.fillStyle(0xffffff, 1);
  g.fillCircle(46, -22, 2.5);
  g.fillCircle(-38, 28, 2);
  g.fillCircle(36, 36, 1.5);
  c.add(g);
};

// 7 — Ice Comet: frosty shard streaking with bright trail
NODE_RENDERERS[7] = function drawIceComet(scene, c, _s) {
  const g = scene.add.graphics();
  // Trail — three layers of frost blue
  g.fillStyle(0xb6e0ff, 0.30);
  g.fillTriangle(-15, 0, -85, -34, -85, 34);
  g.fillStyle(0xd6ecff, 0.55);
  g.fillTriangle(-10, 0, -60, -20, -60, 20);
  g.fillStyle(0xffffff, 0.75);
  g.fillTriangle(-5, 0, -40, -12, -40, 12);
  // Comet body
  g.fillStyle(0xb6e0ff, 1);
  g.fillCircle(15, 0, 30);
  g.fillStyle(0xe2f4ff, 1);
  g.fillCircle(15, 0, 22);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(8, -10, 14);
  // Sharp icicle facet line
  g.lineStyle(2, 0x6e95c2, 1);
  g.lineBetween(22, -10, 30, 6);
  g.lineBetween(8, 14, 16, 22);
  // Sparkles in the trail
  g.fillStyle(0xfff3b8, 1);
  g.fillCircle(-50, -5, 3);
  g.fillCircle(-65, 8, 2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-32, -16, 2);
  c.add(g);
};

// 8 — Supernova: warm coral burst with cherry rays
NODE_RENDERERS[8] = function drawSupernova(scene, c, _s) {
  const g = scene.add.graphics();
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const long = i % 2 === 0;
    const r = long ? 70 : 50;
    g.fillStyle(long ? 0xc44b5e : 0xffae8a, long ? 0.7 : 0.85);
    g.beginPath();
    g.moveTo(Math.cos(a - 0.12) * 18, Math.sin(a - 0.12) * 18);
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    g.lineTo(Math.cos(a + 0.12) * 18, Math.sin(a + 0.12) * 18);
    g.closePath();
    g.fillPath();
  }
  // Outer halo
  g.fillStyle(0xff9ec7, 0.45);
  g.fillCircle(0, 0, 36);
  // Coral mid
  g.fillStyle(0xffae8a, 1);
  g.fillCircle(0, 0, 28);
  // Bright butter core
  g.fillStyle(0xffe07a, 1);
  g.fillCircle(0, 0, 20);
  // Hot white center
  g.fillStyle(0xffffff, 1);
  g.fillCircle(0, 0, 11);
  c.add(g);
};

// 9 — Galactic Core: butter gold core with amber spiral arms
NODE_RENDERERS[9] = function drawGalacticCore(scene, c, _s) {
  const g = scene.add.graphics();
  // Soft outer halo
  g.fillStyle(0xffe07a, 0.30);
  g.fillCircle(0, 0, 72);
  g.fillStyle(0xfff3b8, 0.45);
  g.fillCircle(0, 0, 54);
  // Spiral arm rings
  g.lineStyle(5, 0xc88a3a, 0.85);
  g.strokeEllipse(0, 0, 138, 56);
  g.lineStyle(4, 0xffe07a, 0.85);
  g.strokeEllipse(-6, -2, 110, 42);
  g.lineStyle(3, 0xfff3b8, 0.7);
  g.strokeEllipse(4, 4, 86, 30);
  // Core
  g.fillStyle(0xffe07a, 1);
  g.fillCircle(0, 0, 24);
  g.fillStyle(0xfff3b8, 1);
  g.fillCircle(0, 0, 16);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(0, 0, 9);
  // Star sparkles around the core
  g.fillStyle(0xfff3b8, 1);
  g.fillCircle(-50, -10, 2.5);
  g.fillCircle(45, 12, 2.5);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(-25, -22, 1.5);
  g.fillCircle(28, -28, 1.5);
  g.fillCircle(58, 4, 1.5);
  c.add(g);
};

// 10 — Parallel Dimension: mint teal triple-offset orbs with glitch shimmer
NODE_RENDERERS[10] = function drawParallelDimension(scene, c, _s) {
  const g = scene.add.graphics();
  // Three offset rings — mint, rose, cream
  g.lineStyle(5, 0xa6f0e8, 1);
  g.strokeCircle(0, 0, 50);
  g.lineStyle(4, 0xff9ec7, 0.7);
  g.strokeCircle(-7, -4, 50);
  g.lineStyle(4, 0xfff3b8, 0.7);
  g.strokeCircle(7, 4, 50);
  // Inner sphere
  g.fillStyle(0x55858a, 1);
  g.fillCircle(0, 0, 34);
  g.fillStyle(0xa6f0e8, 0.6);
  g.fillEllipse(-6, -6, 26, 14);
  g.fillStyle(0xfce7ff, 0.45);
  g.fillEllipse(6, 6, 22, 10);
  // Compass-point sparkle stars
  const sparkles = [[40, 0], [-40, 0], [0, 40], [0, -40]];
  for (const [px, py] of sparkles) {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(px, py, 3);
    g.fillStyle(0xff9ec7, 0.8);
    g.fillCircle(px + 3, py + 1, 1.5);
  }
  c.add(g);
};

// 11 — Universe's End: deep violet void with cream constellation + final star
NODE_RENDERERS[11] = function drawUniverseEnd(scene, c, _s) {
  const g = scene.add.graphics();
  // Outer halo of cream light
  g.fillStyle(0xfff3b8, 0.18);
  g.fillCircle(0, 0, 70);
  // Deep violet sphere
  g.fillStyle(0x4a4a8c, 1);
  g.fillCircle(0, 0, 60);
  g.fillStyle(0x6b6bb3, 0.6);
  g.fillCircle(-6, -10, 48);
  // Constellation
  const points = [
    [-25, -20], [10, -28], [28, 10], [4, 22], [-22, 18], [-32, -2]
  ];
  g.lineStyle(2, 0xfff3b8, 0.55);
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i][0], points[i][1]);
  g.lineTo(points[0][0], points[0][1]);
  g.strokePath();
  g.fillStyle(0xfff3b8, 1);
  for (const [px, py] of points) {
    g.fillCircle(px, py, 3);
  }
  // Big star at the center
  const s = 16;
  g.fillStyle(0xfff3b8, 0.5);
  g.fillCircle(0, 0, s + 4);
  g.fillStyle(0xffffff, 1);
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? s : s * 0.4;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
  c.add(g);
};
