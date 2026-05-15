// Per-world background palette + horizon silhouette for the play scene.
// Slice 1.3 of the polish pass: each world gets a distinct vertical gradient
// plus a hand-rolled horizon shape so worlds read as different places without
// any new sprite assets and without tinting the HUD chrome.
//
// Used only by GameScene (the play screen). The world map has its own
// ambience system and is intentionally untouched.

import Phaser from 'phaser';
import { darken, lighten } from './colorUtils.js';

const W = 1080;

// Helpers ---------------------------------------------------------------------

function jaggedRidge(g, baseY, color, { peakCount = 9, peakMin = 60, peakMax = 160, jitter = 28 }) {
  // Fills a polygon along the bottom shaped like sharp triangle peaks.
  const step = W / peakCount;
  const points = [{ x: 0, y: baseY + 200 }];
  for (let i = 0; i <= peakCount; i++) {
    const x = i * step + (i > 0 && i < peakCount ? Phaser.Math.Between(-jitter, jitter) : 0);
    const peakH = Phaser.Math.Between(peakMin, peakMax);
    points.push({ x, y: baseY - peakH });
    if (i < peakCount) {
      const dipX = i * step + step / 2;
      const dipY = baseY - Phaser.Math.Between(0, peakMin / 2);
      points.push({ x: dipX, y: dipY });
    }
  }
  points.push({ x: W, y: baseY + 200 });
  g.fillStyle(color, 1);
  g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
  g.closePath();
  g.fillPath();
}

// World 1 — Moon Base: lunar arc, soft silver curve
function moonBaseHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Distant arc — a wide, low ellipse suggesting a curved lunar surface.
  g.fillStyle(0x202848, 1);
  g.fillEllipse(W / 2, baseY + 380, W * 1.6, 480);
  g.fillStyle(0x2e3a62, 1);
  g.fillEllipse(W / 2, baseY + 360, W * 1.55, 440);
  // Crater dots
  g.fillStyle(0x1a2040, 1);
  for (let i = 0; i < 7; i++) {
    const x = (i + 0.5) * (W / 7);
    const r = Phaser.Math.Between(8, 22);
    g.fillCircle(x, baseY + 80 + Phaser.Math.Between(-12, 12), r);
  }
  return g;
}

// World 2 — Asteroid Belt: jagged rocky ridge
function asteroidBeltHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Far ridge (darker, smaller peaks)
  jaggedRidge(g, baseY + 60, 0x2a160a, { peakCount: 11, peakMin: 30, peakMax: 80, jitter: 18 });
  // Near ridge
  jaggedRidge(g, baseY + 30, 0x4a2818, { peakCount: 8, peakMin: 70, peakMax: 150, jitter: 30 });
  return g;
}

// World 3 — Crystal Planet: shard silhouettes
function crystalPlanetHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  g.fillStyle(0x2a1448, 1);
  g.fillRect(0, baseY + 60, W, 200);
  // Tall crystal shards
  const shardCount = 9;
  for (let i = 0; i < shardCount; i++) {
    const cx = (i + 0.5) * (W / shardCount) + Phaser.Math.Between(-30, 30);
    const h = Phaser.Math.Between(80, 180);
    const w = Phaser.Math.Between(36, 70);
    const color = i % 2 === 0 ? 0x3a1a64 : 0x4a2670;
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(cx, baseY - h);
    g.lineTo(cx + w / 2, baseY + 30);
    g.lineTo(cx - w / 2, baseY + 30);
    g.closePath();
    g.fillPath();
  }
  return g;
}

// World 4 — Nebula Gardens: soft rolling clouds
function nebulaGardensHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Far cloud band (darker)
  g.fillStyle(0x143828, 1);
  g.fillRect(0, baseY + 70, W, 180);
  for (let i = 0; i < 5; i++) {
    g.fillEllipse(i * (W / 4) - 60, baseY + 60, 360, 110);
  }
  // Near cloud band (lighter)
  g.fillStyle(0x2a5a48, 1);
  g.fillRect(0, baseY + 110, W, 200);
  for (let i = 0; i < 6; i++) {
    g.fillEllipse(i * (W / 5) + 30, baseY + 100, 300, 130);
  }
  return g;
}

// World 5 — Robot Station: geometric platforms
function robotStationHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Distant platform line
  g.fillStyle(0x1a2c44, 1);
  g.fillRect(0, baseY + 30, W, 200);
  // Boxy buildings + antennas
  let x = 20;
  while (x < W - 20) {
    const w = Phaser.Math.Between(70, 140);
    const h = Phaser.Math.Between(40, 110);
    g.fillStyle(0x1a3858, 1);
    g.fillRect(x, baseY - h, w, h + 30);
    // Window strip
    g.fillStyle(0x6fa8d8, 0.55);
    for (let i = 0; i < 3; i++) {
      const wy = baseY - h + 14 + i * 18;
      if (wy < baseY - 6) g.fillRect(x + 8, wy, w - 16, 6);
    }
    // Antenna
    if (Math.random() < 0.45) {
      g.fillStyle(0x6fa8d8, 0.9);
      g.fillRect(x + w / 2 - 2, baseY - h - 22, 4, 22);
      g.fillCircle(x + w / 2, baseY - h - 22, 4);
    }
    x += w + Phaser.Math.Between(8, 24);
  }
  return g;
}

// World 6 — Black Hole Edge: warp arc pulled toward center
function blackHoleEdgeHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Concentric squashed ellipses — a dark gravity well.
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const rx = W * (1.6 - t * 0.4);
    const ry = 120 + t * 240;
    const color = darken(0x301240, t * 0.3);
    g.fillStyle(color, 0.8);
    g.fillEllipse(W / 2, baseY + 280 + t * 40, rx, ry);
  }
  // A single bright accretion sliver
  g.fillStyle(0xff9ec7, 0.18);
  g.fillEllipse(W / 2, baseY + 60, W * 1.1, 16);
  return g;
}

// World 7 — Ice Comet: jagged ice ridge (sharper than asteroid)
function iceCometHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  jaggedRidge(g, baseY + 50, 0x2a4870, { peakCount: 13, peakMin: 30, peakMax: 80, jitter: 14 });
  jaggedRidge(g, baseY + 20, 0x4078a8, { peakCount: 9, peakMin: 80, peakMax: 170, jitter: 22 });
  // Highlights on near peaks
  g.fillStyle(0xb6e0ff, 0.4);
  for (let i = 0; i < 6; i++) {
    const x = (i + 0.5) * (W / 6) + Phaser.Math.Between(-20, 20);
    g.fillTriangle(x - 8, baseY - 40, x + 8, baseY - 40, x, baseY - 80);
  }
  return g;
}

// World 8 — Supernova: molten ridge with embers
function supernovaHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Wavy lava band
  g.fillStyle(0x40080c, 1);
  g.fillRect(0, baseY + 30, W, 200);
  g.fillStyle(0x701828, 1);
  g.beginPath();
  g.moveTo(0, baseY + 30);
  for (let x = 0; x <= W; x += 40) {
    const y = baseY + 30 + Math.sin(x * 0.012) * 30 + Phaser.Math.Between(-6, 6);
    g.lineTo(x, y);
  }
  g.lineTo(W, baseY + 230);
  g.lineTo(0, baseY + 230);
  g.closePath();
  g.fillPath();
  // Glowing crack along the ridge
  g.fillStyle(0xffae8a, 0.7);
  for (let x = 30; x < W; x += Phaser.Math.Between(60, 110)) {
    const y = baseY + 30 + Math.sin(x * 0.012) * 30;
    g.fillRect(x, y - 4, Phaser.Math.Between(20, 40), 4);
  }
  // Floating embers
  g.fillStyle(0xffd86b, 0.85);
  for (let i = 0; i < 18; i++) {
    g.fillCircle(Phaser.Math.Between(0, W), baseY - Phaser.Math.Between(0, 200), Phaser.Math.Between(2, 4));
  }
  return g;
}

// World 9 — Galactic Core: bright core glow at horizon
function galacticCoreHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Core bloom (concentric warm ellipses)
  const cx = W / 2;
  const cy = baseY + 60;
  for (let i = 6; i >= 0; i--) {
    const t = i / 6;
    g.fillStyle(lighten(0x603018, 0.5 - t * 0.4), 0.18 + (1 - t) * 0.18);
    g.fillEllipse(cx, cy, W * (0.4 + t * 1.0), 80 + t * 220);
  }
  // Bright nucleus
  g.fillStyle(0xffe07a, 0.85);
  g.fillEllipse(cx, cy, 220, 60);
  g.fillStyle(0xfff3b8, 1);
  g.fillEllipse(cx, cy, 110, 28);
  // Distant ridge across the bottom
  g.fillStyle(0x402008, 1);
  g.fillRect(0, baseY + 110, W, 200);
  return g;
}

// World 10 — Parallel Dimension: doubled mirror ridge
function parallelDimHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Far echo (translucent, offset)
  g.fillStyle(0x103840, 0.55);
  jaggedRidge(g, baseY + 70, 0x103840, { peakCount: 7, peakMin: 50, peakMax: 110, jitter: 26 });
  // Near solid ridge
  jaggedRidge(g, baseY + 20, 0x205058, { peakCount: 9, peakMin: 70, peakMax: 140, jitter: 30 });
  // Shimmer line across
  g.fillStyle(0xa6f0e8, 0.35);
  g.fillRect(0, baseY - 4, W, 2);
  g.fillStyle(0xa6f0e8, 0.18);
  g.fillRect(0, baseY + 8, W, 2);
  return g;
}

// World 11 — Universe's End: distant horizon line + sparse pillars
function universesEndHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Distant glow band
  g.fillStyle(0x4a4a8c, 0.6);
  g.fillRect(0, baseY - 6, W, 12);
  // Lower void
  g.fillStyle(0x141430, 1);
  g.fillRect(0, baseY + 6, W, 240);
  // Sparse pillars / monoliths
  const pillars = [0.15, 0.32, 0.55, 0.74, 0.88];
  for (const p of pillars) {
    const x = p * W + Phaser.Math.Between(-20, 20);
    const h = Phaser.Math.Between(70, 160);
    const w = Phaser.Math.Between(20, 36);
    g.fillStyle(0x303068, 1);
    g.fillRect(x - w / 2, baseY - h, w, h + 30);
    // Glowing tip
    g.fillStyle(0xfff3b8, 0.6);
    g.fillRect(x - w / 2, baseY - h, w, 4);
  }
  return g;
}

// Map ------------------------------------------------------------------------

export const WORLD_BACKGROUNDS = {
  1:  { bgTop: 0x0a1030, bgBottom: 0x3a4470, drawHorizon: moonBaseHorizon },
  2:  { bgTop: 0x1a0e08, bgBottom: 0x4a2818, drawHorizon: asteroidBeltHorizon },
  3:  { bgTop: 0x180828, bgBottom: 0x4a2670, drawHorizon: crystalPlanetHorizon },
  4:  { bgTop: 0x081a14, bgBottom: 0x2a5a48, drawHorizon: nebulaGardensHorizon },
  5:  { bgTop: 0x081020, bgBottom: 0x1a3858, drawHorizon: robotStationHorizon },
  6:  { bgTop: 0x0a0610, bgBottom: 0x300820, drawHorizon: blackHoleEdgeHorizon },
  7:  { bgTop: 0x081830, bgBottom: 0x4078a8, drawHorizon: iceCometHorizon },
  8:  { bgTop: 0x180408, bgBottom: 0x701828, drawHorizon: supernovaHorizon },
  9:  { bgTop: 0x180a04, bgBottom: 0x603018, drawHorizon: galacticCoreHorizon },
  10: { bgTop: 0x0a1820, bgBottom: 0x205058, drawHorizon: parallelDimHorizon },
  11: { bgTop: 0x0a0a18, bgBottom: 0x303068, drawHorizon: universesEndHorizon },
  15: { bgTop: 0x0a0010, bgBottom: 0x200030, drawHorizon: glitchWorldHorizon }
};

function glitchWorldHorizon(scene, { width, y }) {
  const g = scene.add.graphics().setDepth(0);
  g.fillStyle(0x000005, 1);
  g.fillRect(0, y, width, 1920 - y);
  for (let i = 0; i < 14; i++) {
    const ty = y - 220 + Math.random() * 360;
    const th = 2 + Math.floor(Math.random() * 5);
    const col = (i % 2 === 0) ? 0xff00ff : 0x39ff14;
    g.fillStyle(col, 0.20 + Math.random() * 0.18);
    g.fillRect(0, ty, width, th);
  }
  g.lineStyle(2, 0xff00ff, 0.55);
  g.lineBetween(0, y, width, y);
}

export function getWorldBackground(worldId) {
  return WORLD_BACKGROUNDS[worldId] || WORLD_BACKGROUNDS[1];
}
