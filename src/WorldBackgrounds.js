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
// Read only through getWorldBackground() below — kept module-private.

const WORLD_BACKGROUNDS = {
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
  21: { bgTop: 0x1a0610, bgBottom: 0x5a1422, drawHorizon: ch2BloodstreamHorizon },
  22: { bgTop: 0x06201c, bgBottom: 0x166e64, drawHorizon: ch2CellCityHorizon },
  23: { bgTop: 0x140828, bgBottom: 0x3a1a6e, drawHorizon: ch2NucleusVaultHorizon },
  24: { bgTop: 0x06102a, bgBottom: 0x1a3a6e, drawHorizon: ch2NeuronForestHorizon },
  25: { bgTop: 0x1a1206, bgBottom: 0x5a3e16, drawHorizon: ch2MarrowCavernsHorizon },
  26: { bgTop: 0x0a1a06, bgBottom: 0x2a5a18, drawHorizon: ch2ImmuneFrontHorizon },
  27: { bgTop: 0x1a0c04, bgBottom: 0x5a2810, drawHorizon: ch2MitochondriaCoreHorizon },
  28: { bgTop: 0x0a0a18, bgBottom: 0x303068, drawHorizon: ch2TheSingularityCellHorizon },
  17: { bgTop: 0x10241a, bgBottom: 0x2f5a3a, drawHorizon: ch2RoyalFlushHorizon },
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

// ── Chapter 2 "Inner Space" horizons ──────────────────────────────────────
function ch2BloodstreamHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Deep plasma channel — wide, warm red curve filling the lower portion.
  g.fillStyle(0x6e1422, 1);
  g.fillEllipse(W / 2, baseY + 380, W * 1.6, 480);
  g.fillStyle(0xa02838, 1);
  g.fillEllipse(W / 2, baseY + 360, W * 1.55, 440);
  // A brighter plasma current rippling across the surface.
  g.fillStyle(0xc23a4a, 1);
  g.beginPath();
  g.moveTo(0, baseY + 40);
  for (let x = 0; x <= W; x += 40) {
    const y = baseY + 40 + Math.sin(x * 0.011) * 26 + Phaser.Math.Between(-5, 5);
    g.lineTo(x, y);
  }
  g.lineTo(W, baseY + 260);
  g.lineTo(0, baseY + 260);
  g.closePath();
  g.fillPath();
  // Floating red blood cells — rounded discs with a paler dimpled center.
  for (let i = 0; i < 9; i++) {
    const x = (i + 0.5) * (W / 9) + Phaser.Math.Between(-26, 26);
    const y = baseY + 90 + Phaser.Math.Between(-16, 70);
    const r = Phaser.Math.Between(20, 36);
    g.fillStyle(0xc23a4a, 1);
    g.fillEllipse(x, y, r * 2, r * 1.5);
    g.fillStyle(0xff7a8a, 1);
    g.fillEllipse(x, y, r * 1.2, r * 0.85);
  }
  // Tiny plasma bubbles drifting up.
  g.fillStyle(0xff9ec7, 0.6);
  for (let i = 0; i < 16; i++) {
    g.fillCircle(Phaser.Math.Between(0, W), baseY - Phaser.Math.Between(0, 180), Phaser.Math.Between(2, 5));
  }
  return g;
}

// World 22 — Cell City: organelle skyline inside a glowing cell
function ch2CellCityHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Cytoplasm floor — layered soft teal bands
  g.fillStyle(0x0f4a44, 1);
  g.fillRect(0, baseY + 60, W, 240);
  g.fillStyle(0x176e64, 1);
  g.fillEllipse(W / 2, baseY + 120, W * 1.5, 200);
  // Distant membrane glow band
  g.fillStyle(0x4ecdc4, 0.18);
  g.fillEllipse(W / 2, baseY + 30, W * 1.3, 36);
  // Organelle "buildings" along the skyline — rounded rods + blob domes
  let x = 30;
  while (x < W - 30) {
    const w = Phaser.Math.Between(60, 120);
    const h = Phaser.Math.Between(50, 140);
    g.fillStyle(0x2f8f86, 1);
    g.fillRoundedRect(x, baseY - h, w, h + 40, 18);
    // Lighter front face
    g.fillStyle(0x4ecdc4, 0.85);
    g.fillRoundedRect(x + 6, baseY - h + 6, w - 12, 16, 8);
    // Window dots (vesicles)
    g.fillStyle(0xbafff6, 0.6);
    for (let i = 0; i < 3; i++) {
      const wy = baseY - h + 30 + i * 22;
      if (wy < baseY) g.fillCircle(x + w / 2, wy, 5);
    }
    // Occasional rounded antenna cilium
    if (Math.random() < 0.45) {
      g.lineStyle(4, 0x4ecdc4, 0.9);
      g.lineBetween(x + w / 2, baseY - h, x + w / 2, baseY - h - 24);
      g.fillStyle(0xbafff6, 0.9);
      g.fillCircle(x + w / 2, baseY - h - 26, 5);
    }
    x += w + Phaser.Math.Between(10, 28);
  }
  // Floating cytoplasm bubbles
  g.fillStyle(0xbafff6, 0.5);
  for (let i = 0; i < 10; i++) {
    g.fillCircle(Phaser.Math.Between(0, W), baseY - Phaser.Math.Between(0, 180), Phaser.Math.Between(2, 5));
  }
  return g;
}

function ch2NucleusVaultHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Deep cytoplasm floor — layered violet ellipses receding to the back wall.
  g.fillStyle(0x2a1450, 1);
  g.fillEllipse(W / 2, baseY + 380, W * 1.6, 480);
  g.fillStyle(0x3a1f6a, 1);
  g.fillEllipse(W / 2, baseY + 360, W * 1.55, 440);
  // The great nucleus vault — a glowing violet sphere domed at the horizon.
  g.fillStyle(0x4a2a82, 0.9);
  g.fillCircle(W / 2, baseY + 150, 360);
  g.fillStyle(0x6a3fa0, 1);
  g.fillCircle(W / 2, baseY + 170, 320);
  g.fillStyle(0x8455c4, 0.7);
  g.fillEllipse(W / 2 - 90, baseY + 70, 200, 120);
  // Bright nucleolus core glow.
  g.fillStyle(0xc77eff, 0.5);
  g.fillCircle(W / 2, baseY + 150, 90);
  g.fillStyle(0xe3bcff, 0.85);
  g.fillCircle(W / 2 - 10, baseY + 140, 42);
  // Floating chromosome rods scattered low across the floor.
  for (let i = 0; i < 8; i++) {
    const x = (i + 0.5) * (W / 8) + Phaser.Math.Between(-24, 24);
    const y = baseY + 60 + Phaser.Math.Between(-16, 24);
    const len = Phaser.Math.Between(22, 40);
    g.fillStyle(0xc77eff, 0.85);
    g.fillRoundedRect(x - 5, y - len / 2, 10, len, 5);
    g.fillStyle(0xc77eff, 0.85);
    g.fillRoundedRect(x - len / 2, y - 5, len, 10, 5);
    g.fillStyle(0xe3bcff, 0.6);
    g.fillCircle(x, y, 4);
  }
  // DNA thread strands drifting near the dome.
  g.fillStyle(0xe3bcff, 0.7);
  for (let i = 0; i < 6; i++) {
    const x = (i + 0.5) * (W / 6);
    g.fillCircle(x, baseY - 30 + Math.sin(i * 1.1) * 30, 3);
  }
  return g;
}

function ch2NeuronForestHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Soft neural haze along the floor
  g.fillStyle(0x1c2f5a, 1);
  g.fillRect(0, baseY + 60, W, 220);
  // Forest of neuron "trees": a rounded soma trunk that branches into dendrites
  const trees = 6;
  for (let i = 0; i < trees; i++) {
    const cx = (i + 0.5) * (W / trees) + Phaser.Math.Between(-30, 30);
    const h = Phaser.Math.Between(110, 190);
    const trunkW = Phaser.Math.Between(14, 22);
    // Trunk (axon)
    g.fillStyle(0x2c4a82, 1);
    g.fillRoundedRect(cx - trunkW / 2, baseY - h, trunkW, h + 40, trunkW / 2);
    // Cell body (soma) — a plump blob at the base of the branches
    g.fillStyle(0x3a5fa0, 1);
    g.fillCircle(cx, baseY - h + 18, trunkW + 8);
    // Branching dendrites — three rounded rods fanning upward
    g.lineStyle(8, 0x3a5fa0, 1);
    const branches = 3;
    for (let b = 0; b < branches; b++) {
      const spread = (b - (branches - 1) / 2) * 38 + Phaser.Math.Between(-6, 6);
      const tipX = cx + spread;
      const tipY = baseY - h - Phaser.Math.Between(20, 50);
      g.lineBetween(cx, baseY - h + 12, tipX, tipY);
      // Glowing synapse tip
      g.fillStyle(0x7fb8ff, 0.35);
      g.fillCircle(tipX, tipY, 9);
      g.fillStyle(0x7fb8ff, 1);
      g.fillCircle(tipX, tipY, 4);
    }
  }
  // A few electric sparks drifting in the canopy
  g.fillStyle(0x7fb8ff, 0.9);
  for (let i = 0; i < 14; i++) {
    g.fillCircle(Phaser.Math.Between(0, W), baseY - Phaser.Math.Between(20, 200), Phaser.Math.Between(2, 3));
  }
  return g;
}

function ch2MarrowCavernsHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Warm amber cavern walls — layered rounded ellipses lit from below.
  g.fillStyle(0x6e4f18, 1);
  g.fillEllipse(W / 2, baseY + 380, W * 1.6, 480);
  g.fillStyle(0x8a661f, 1);
  g.fillEllipse(W / 2, baseY + 360, W * 1.55, 440);
  // Spongy marrow pockets along the cavern floor.
  g.fillStyle(0xb5863a, 1);
  for (let i = 0; i < 6; i++) {
    const x = (i + 0.5) * (W / 6) + Phaser.Math.Between(-24, 24);
    g.fillEllipse(x, baseY + 150, Phaser.Math.Between(120, 200), Phaser.Math.Between(70, 110));
  }
  // Brand-new cells budding and glowing upward like bubbles.
  for (let i = 0; i < 14; i++) {
    const x = Phaser.Math.Between(0, W);
    const y = baseY - Phaser.Math.Between(0, 200);
    const r = Phaser.Math.Between(4, 12);
    g.fillStyle(0xffcf6b, 0.5);
    g.fillCircle(x, y, r + 3);
    g.fillStyle(0xffe6ac, 0.85);
    g.fillCircle(x - r * 0.3, y - r * 0.3, r * 0.6);
  }
  return g;
}

function ch2ImmuneFrontHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Plasma floor — layered organic green ellipses receding into the distance.
  g.fillStyle(0x1c3a10, 1);
  g.fillEllipse(W / 2, baseY + 380, W * 1.6, 480);
  g.fillStyle(0x2a5418, 1);
  g.fillEllipse(W / 2, baseY + 360, W * 1.55, 440);
  // A row of plump white blood cells resting along the front line.
  for (let i = 0; i < 6; i++) {
    const x = (i + 0.5) * (W / 6) + Phaser.Math.Between(-24, 24);
    const cy = baseY + 70 + Phaser.Math.Between(-16, 16);
    const r = Phaser.Math.Between(34, 58);
    g.fillStyle(0x6fae4a, 1);
    g.fillCircle(x, cy, r);
    // Lumpy edges
    g.fillCircle(x - r * 0.6, cy + r * 0.2, r * 0.5);
    g.fillCircle(x + r * 0.55, cy - r * 0.1, r * 0.45);
    // Pale highlight cap
    g.fillStyle(0x9be86b, 1);
    g.fillEllipse(x - r * 0.25, cy - r * 0.3, r * 0.9, r * 0.55);
  }
  // Floating accent microbes drifting above the line.
  g.fillStyle(0x9be86b, 0.8);
  for (let i = 0; i < 14; i++) {
    g.fillCircle(Phaser.Math.Between(0, W), baseY - Phaser.Math.Between(0, 200), Phaser.Math.Between(2, 5));
  }
  return g;
}

function ch2MitochondriaCoreHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Warm cytoplasm floor — layered ellipses from deep to glowing.
  g.fillStyle(0x3a1808, 1);
  g.fillEllipse(W / 2, baseY + 380, W * 1.6, 480);
  g.fillStyle(0x6a3010, 1);
  g.fillEllipse(W / 2, baseY + 360, W * 1.55, 440);
  // Big bean-shaped mitochondria resting along the floor.
  const beans = [
    [W * 0.22, baseY + 40, 220, 110],
    [W * 0.58, baseY + 70, 300, 140],
    [W * 0.86, baseY + 30, 180, 96]
  ];
  for (const [bx, by, bw, bh] of beans) {
    g.fillStyle(0xc4622a, 1);
    g.fillEllipse(bx, by, bw, bh);
    g.fillStyle(0xff9b4a, 1);
    g.fillEllipse(bx - bw * 0.08, by - bh * 0.14, bw * 0.78, bh * 0.6);
    // Glowing inner cristae folds (rounded rods).
    g.fillStyle(0xc4622a, 0.9);
    for (let i = -2; i <= 2; i++) {
      const cx = bx + i * (bw * 0.16);
      g.fillRoundedRect(cx - 8, by - bh * 0.34, 16, bh * 0.68, 8);
    }
  }
  // Floating energy sparks rising off the furnace.
  g.fillStyle(0xffc77a, 0.9);
  for (let i = 0; i < 16; i++) {
    g.fillCircle(Phaser.Math.Between(0, W), baseY - Phaser.Math.Between(0, 200), Phaser.Math.Between(2, 4));
  }
  return g;
}

function ch2TheSingularityCellHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  const cx = W / 2;
  const cy = baseY + 70;
  // Radiant primordial bloom — concentric soft halos in the cell palette
  for (let i = 6; i >= 0; i--) {
    const t = i / 6;
    g.fillStyle(0x6a6ab0, 0.10 + (1 - t) * 0.14);
    g.fillEllipse(cx, cy, W * (0.4 + t * 1.1), 90 + t * 240);
  }
  // Soft ringed light around the cell
  g.lineStyle(6, 0xfff3b8, 0.30);
  g.strokeEllipse(cx, cy, 520, 200);
  g.lineStyle(4, 0xfff3b8, 0.22);
  g.strokeEllipse(cx, cy, 700, 280);
  // The luminous first cell — gold-white sphere
  g.fillStyle(0x9a9ad8, 0.85);
  g.fillEllipse(cx, cy, 300, 140);
  g.fillStyle(0xfff3b8, 0.9);
  g.fillEllipse(cx, cy, 200, 90);
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(cx, cy, 100, 44);
  // Drifting nucleus motes along the horizon
  g.fillStyle(0xfff3b8, 0.7);
  for (let i = 0; i < 9; i++) {
    const x = (i + 0.5) * (W / 9) + Phaser.Math.Between(-20, 20);
    g.fillCircle(x, baseY + 130 + Phaser.Math.Between(-16, 16), Phaser.Math.Between(2, 5));
  }
  return g;
}

// World 17 — The Royal Flush (secret): murky-green sewer-cell throne room with a
// porcelain-white dais glow, dripping pipes/valves, rising bubbles, and depths.
function ch2RoyalFlushHorizon(scene, opts) {
  const g = scene.add.graphics().setDepth(2);
  const baseY = opts.y;
  // Murky green depths — layered ellipses receding into the gloom.
  g.fillStyle(0x123a26, 1);
  g.fillEllipse(W / 2, baseY + 380, W * 1.6, 480);
  g.fillStyle(0x1f5236, 1);
  g.fillEllipse(W / 2, baseY + 360, W * 1.55, 440);

  // The porcelain throne / dais on the horizon — a broad white glow and a
  // rounded pedestal stepping up out of the murk.
  const cx = W / 2;
  const daisY = baseY + 40;
  g.fillStyle(0xeaf2ec, 0.16);
  g.fillEllipse(cx, daisY, 560, 220);
  g.fillStyle(0xf6faf6, 0.22);
  g.fillEllipse(cx, daisY, 360, 140);
  // Pedestal steps (porcelain).
  g.fillStyle(0xcfe0d2, 1);
  g.fillRoundedRect(cx - 230, daisY - 10, 460, 90, 28);
  g.fillStyle(0xeaf2ec, 1);
  g.fillRoundedRect(cx - 160, daisY - 60, 320, 80, 26);
  // Throne back — a tall rounded porcelain bowl-back behind the dais.
  g.fillStyle(0xdce8df, 1);
  g.fillEllipse(cx, daisY - 110, 280, 180);
  g.fillStyle(0xf6faf6, 0.9);
  g.fillEllipse(cx, daisY - 130, 200, 120);
  g.fillStyle(0xb8cdbd, 0.7);
  g.fillEllipse(cx, daisY - 70, 150, 50);
  // Glints on the porcelain.
  g.fillStyle(0xffffff, 0.8);
  g.fillEllipse(cx - 70, daisY - 150, 60, 26);

  // Dripping pipes / valves descending from the top on both flanks.
  for (const px of [W * 0.12, W * 0.88]) {
    // Pipe.
    g.fillStyle(0x2a4a36, 1);
    g.fillRect(px - 18, baseY - 260, 36, 280);
    g.fillStyle(0x3f6b4e, 1);
    g.fillRect(px - 12, baseY - 260, 12, 280);
    // Valve wheel (a plain ring + spokes — purely mechanical).
    g.lineStyle(8, 0x6f9a7e, 1);
    g.strokeCircle(px, baseY - 200, 34);
    g.lineStyle(6, 0x6f9a7e, 1);
    g.lineBetween(px - 34, baseY - 200, px + 34, baseY - 200);
    g.lineBetween(px, baseY - 234, px, baseY - 166);
    g.fillStyle(0x8fb89c, 1);
    g.fillCircle(px, baseY - 200, 9);
    // A glistening drip hanging from the pipe mouth.
    g.fillStyle(0x9be0c0, 0.85);
    g.fillCircle(px, baseY + 30, 8);
    g.fillEllipse(px, baseY + 48, 10, 18);
  }

  // A couple of low cross-pipes / outflow valves along the floor.
  g.fillStyle(0x2a4a36, 1);
  g.fillRoundedRect(W * 0.30, baseY + 96, 120, 26, 10);
  g.fillRoundedRect(W * 0.56, baseY + 110, 140, 26, 10);
  g.fillStyle(0x3f6b4e, 1);
  g.fillCircle(W * 0.30, baseY + 109, 20);
  g.fillCircle(W * 0.70, baseY + 123, 22);

  // Rising bubbles drifting up through the murky green throne room.
  g.fillStyle(0xbafee0, 0.5);
  for (let i = 0; i < 18; i++) {
    const x = Phaser.Math.Between(0, W);
    const y = baseY - Phaser.Math.Between(0, 220);
    const br = Phaser.Math.Between(2, 7);
    g.fillCircle(x, y, br);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(x - br * 0.3, y - br * 0.3, br * 0.35);
    g.fillStyle(0xbafee0, 0.5);
  }
  return g;
}

export function getWorldBackground(worldId) {
  return WORLD_BACKGROUNDS[worldId] || WORLD_BACKGROUNDS[1];
}
