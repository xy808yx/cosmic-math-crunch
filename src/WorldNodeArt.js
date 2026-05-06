// Procedural pixel-art region renders for the home map nodes.
// Each function returns a Container drawn at (x, y) (the position is set on
// the container, drawing offsets are local). Sized to ~140-180px on the
// longest axis at default scale. Pass `scale` to resize.

export function drawWorldNode(scene, x, y, worldId, opts = {}) {
  const scale = opts.scale ?? 1;
  const container = scene.add.container(x, y);
  const renderer = NODE_RENDERERS[worldId] || drawMoonBase;
  renderer(scene, container, scale);
  container.setScale(scale);
  container.worldId = worldId;
  return container;
}

const NODE_RENDERERS = {};

// 1 — Moon Base: gray cratered mound with a tiny flag
NODE_RENDERERS[1] = function drawMoonBase(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(0, 50, 130, 24);
  g.fillStyle(0x9da0b8, 1);
  g.fillCircle(0, 0, 60);
  g.fillStyle(0xc6c8da, 1);
  g.fillEllipse(-20, -18, 38, 26);
  g.fillStyle(0x6c708a, 1);
  g.fillCircle(20, 12, 8);
  g.fillCircle(-12, 25, 6);
  g.fillCircle(35, -15, 5);
  // Flag
  g.lineStyle(3, 0xeeeef0, 1);
  g.lineBetween(-5, -55, -5, -22);
  g.fillStyle(0xff5c7c, 1);
  g.fillTriangle(-5, -55, -5, -42, 18, -48);
  c.add(g);
};

// 2 — Asteroid Belt: chunky cluster of small asteroids
NODE_RENDERERS[2] = function drawAsteroidBelt(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(0, 60, 150, 22);
  const rocks = [
    [-30, -10, 28, 0x8b7355],
    [25, 5, 35, 0x6b5344],
    [10, -30, 22, 0x9a8465],
    [-50, 18, 18, 0x6b5344],
    [45, -22, 16, 0x8b7355]
  ];
  for (const [rx, ry, r, col] of rocks) {
    g.fillStyle(col, 1);
    g.fillCircle(rx, ry, r);
    g.fillStyle(0x07071a, 0.55);
    g.fillCircle(rx + r * 0.3, ry + r * 0.2, r * 0.25);
    g.fillStyle(0xffffff, 0.18);
    g.fillCircle(rx - r * 0.4, ry - r * 0.4, r * 0.3);
  }
  c.add(g);
};

// 3 — Crystal Planet: faceted purple gem cluster
NODE_RENDERERS[3] = function drawCrystalPlanet(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(0, 60, 140, 22);
  // Big central crystal
  g.fillStyle(0xa29bfe, 1);
  g.beginPath();
  g.moveTo(0, -55);
  g.lineTo(35, 10);
  g.lineTo(0, 50);
  g.lineTo(-35, 10);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xc39bd3, 1);
  g.beginPath();
  g.moveTo(0, -55);
  g.lineTo(15, 0);
  g.lineTo(0, 30);
  g.lineTo(-15, 0);
  g.closePath();
  g.fillPath();
  // Side crystals
  g.fillStyle(0x9d6bff, 1);
  g.fillTriangle(45, 10, 60, 50, 30, 50);
  g.fillTriangle(-45, 10, -60, 50, -30, 50);
  // Sparkles
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-5, -20, 3);
  g.fillCircle(20, -10, 2);
  g.fillCircle(-25, 15, 2);
  c.add(g);
};

// 4 — Nebula Gardens: green hill with vine spirals
NODE_RENDERERS[4] = function drawNebulaGardens(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(0, 60, 140, 22);
  // Hill
  g.fillStyle(0x1e4d2b, 1);
  g.fillEllipse(0, 30, 120, 80);
  g.fillStyle(0x58d68d, 1);
  g.fillEllipse(0, 25, 110, 60);
  g.fillStyle(0x85c97e, 0.7);
  g.fillEllipse(-20, 0, 40, 30);
  // Vines
  g.lineStyle(4, 0x2c8a3a, 1);
  g.beginPath();
  g.arc(0, 10, 22, Math.PI, 0);
  g.strokePath();
  g.fillStyle(0xff79b0, 1);
  g.fillCircle(-22, 10, 6);
  g.fillCircle(22, 10, 6);
  g.fillStyle(0xffd86b, 1);
  g.fillCircle(0, -20, 5);
  c.add(g);
};

// 5 — Robot Station: stacked metal modules with antenna
NODE_RENDERERS[5] = function drawRobotStation(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(0, 60, 130, 22);
  g.fillStyle(0x5dade2, 1);
  g.fillRoundedRect(-40, 10, 80, 40, 8);
  g.fillStyle(0x2c3e50, 1);
  g.fillRoundedRect(-30, -25, 60, 30, 6);
  // Antenna
  g.fillStyle(0xb6c2cf, 1);
  g.fillRect(-2, -55, 4, 30);
  g.fillCircle(0, -56, 4);
  // Lights
  g.fillStyle(0xff5577, 1);
  g.fillCircle(-15, -10, 4);
  g.fillStyle(0x58d68d, 1);
  g.fillCircle(15, -10, 4);
  // Window glow
  g.fillStyle(0xffd86b, 0.85);
  g.fillRect(-22, 25, 12, 12);
  g.fillRect(10, 25, 12, 12);
  c.add(g);
};

// 6 — Black Hole Edge: swirling dark spiral
NODE_RENDERERS[6] = function drawBlackHoleEdge(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0xff6b9d, 0.25);
  g.fillCircle(0, 0, 70);
  g.fillStyle(0xc44569, 0.4);
  g.fillCircle(0, 0, 50);
  g.fillStyle(0x6c2a4a, 0.7);
  g.fillCircle(0, 0, 32);
  g.fillStyle(0x07071a, 1);
  g.fillCircle(0, 0, 18);
  g.lineStyle(3, 0xff6b9d, 0.85);
  g.beginPath();
  g.arc(0, 0, 56, 0, Math.PI * 1.2);
  g.strokePath();
  g.lineStyle(2, 0xc44569, 0.7);
  g.beginPath();
  g.arc(0, 0, 42, Math.PI, Math.PI * 1.6);
  g.strokePath();
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(45, -22, 2);
  g.fillCircle(-38, 28, 2);
  c.add(g);
};

// 7 — Ice Comet: angular ice shard with trail
NODE_RENDERERS[7] = function drawIceComet(scene, c, _s) {
  const g = scene.add.graphics();
  // Tail
  g.fillStyle(0x74b9ff, 0.35);
  g.fillTriangle(-15, 0, -75, -30, -75, 30);
  g.fillStyle(0xa0d8ef, 0.55);
  g.fillTriangle(-10, 0, -55, -18, -55, 18);
  g.fillStyle(0xd4f1f9, 0.8);
  g.fillTriangle(-5, 0, -35, -10, -35, 10);
  // Comet body
  g.fillStyle(0xe8f4f8, 1);
  g.fillCircle(15, 0, 28);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(8, -8, 12);
  g.lineStyle(2, 0xa0d8ef, 1);
  g.lineBetween(20, -8, 28, 4);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-50, -5, 2);
  g.fillCircle(-65, 8, 1.5);
  c.add(g);
};

// 8 — Supernova: radiant burst with light rays
NODE_RENDERERS[8] = function drawSupernova(scene, c, _s) {
  const g = scene.add.graphics();
  const rays = 10;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    g.fillStyle(0xff7675, 0.6);
    g.beginPath();
    g.moveTo(Math.cos(a - 0.15) * 18, Math.sin(a - 0.15) * 18);
    g.lineTo(Math.cos(a) * 60, Math.sin(a) * 60);
    g.lineTo(Math.cos(a + 0.15) * 18, Math.sin(a + 0.15) * 18);
    g.closePath();
    g.fillPath();
  }
  g.fillStyle(0xfab1a0, 0.55);
  g.fillCircle(0, 0, 32);
  g.fillStyle(0xffeaa7, 1);
  g.fillCircle(0, 0, 22);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(0, 0, 10);
  c.add(g);
};

// 9 — Galactic Core: concentric rings with central glow
NODE_RENDERERS[9] = function drawGalacticCore(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0xf7dc6f, 0.30);
  g.fillCircle(0, 0, 65);
  g.fillStyle(0xffeaa7, 0.45);
  g.fillCircle(0, 0, 50);
  g.lineStyle(4, 0xf7dc6f, 0.7);
  g.strokeEllipse(0, 0, 130, 50);
  g.lineStyle(3, 0xffeaa7, 0.6);
  g.strokeEllipse(0, 0, 100, 36);
  g.fillStyle(0xffeaa7, 1);
  g.fillCircle(0, 0, 22);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(0, 0, 10);
  // Star sparkles around the core
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(-50, -10, 2);
  g.fillCircle(45, 12, 2);
  g.fillCircle(-25, -22, 1.5);
  g.fillCircle(28, -28, 1.5);
  c.add(g);
};

// 10 — Parallel Dimension: refracted/glitchy duplicated shapes
NODE_RENDERERS[10] = function drawParallelDimension(scene, c, _s) {
  const g = scene.add.graphics();
  g.lineStyle(4, 0x82ccdd, 1);
  g.strokeCircle(0, 0, 50);
  g.lineStyle(3, 0x82ccdd, 0.7);
  g.strokeCircle(-6, -3, 50);
  g.lineStyle(3, 0xff6b9d, 0.7);
  g.strokeCircle(6, 3, 50);
  g.fillStyle(0x0a3d62, 1);
  g.fillCircle(0, 0, 32);
  g.fillStyle(0x82ccdd, 0.5);
  g.fillEllipse(-6, -6, 22, 12);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(40, 0, 3);
  g.fillCircle(-40, 0, 3);
  g.fillCircle(0, 40, 3);
  g.fillCircle(0, -40, 3);
  c.add(g);
};

// 11 — Universe's End: black void with a single star
NODE_RENDERERS[11] = function drawUniverseEnd(scene, c, _s) {
  const g = scene.add.graphics();
  g.fillStyle(0x12122a, 1);
  g.fillCircle(0, 0, 60);
  // Constellation hint
  const points = [
    [-25, -20], [10, -28], [28, 10], [4, 22], [-22, 18], [-32, -2]
  ];
  g.lineStyle(1, 0xffeaa7, 0.4);
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i][0], points[i][1]);
  g.lineTo(points[0][0], points[0][1]);
  g.strokePath();
  g.fillStyle(0xffeaa7, 1);
  for (const [px, py] of points) {
    g.fillCircle(px, py, 2.5);
  }
  // Big single star at the center
  const s = 14;
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

function drawMoonBase(scene, c, _s) { NODE_RENDERERS[1](scene, c, _s); }
