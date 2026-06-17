// Per-world question objects + boss bodies. Each renders into a Phaser
// Graphics passed in by GameScene. The shapes are sized around the existing
// ASTEROID_RADIUS (110) for normals and a larger boss radius.
//
// Two entry points:
//   drawQuestionBody(g, worldId, radius)   — normal "asteroid" replacement
//   drawBossBody(g, worldId, accentColor, radius) — bespoke boss

import Phaser from 'phaser';
import { darken } from './colorUtils.js';

export function drawQuestionBody(g, worldId, radius) {
  const fn = NORMAL_DRAWERS[worldId] || NORMAL_DRAWERS[2];
  fn(g, radius);
}

export function drawBossBody(g, worldId, accentColor, radius) {
  const fn = BOSS_DRAWERS[worldId] || drawDefaultBoss;
  fn(g, accentColor, radius);
}

// Chunk layout is deterministic per seed so per-hit redraws don't reshuffle
// the silhouette. Caller layers idle glitch jitter on top via seed bumps.
export function drawDatamoshBlob(g, hpRatio, radius, seed = 0) {
  const r = radius;
  const clamped = Math.max(0, Math.min(1, hpRatio));

  const chunkCount = Math.round(10 + clamped * 34);
  const chunkSize = Math.round(r * (0.10 + (1 - clamped) * 0.10));
  const drain = 1 - clamped;
  const baseColors = [0x39ff14, 0xff00ff, 0x00ffff, 0xaa00ff];
  const colors = baseColors.map(c => lerpToGray(c, drain * 0.85));

  // Soft shadow under the blob so it reads against any backdrop.
  g.fillStyle(0x000000, 0.35);
  g.fillEllipse(8, r + 12, r * 1.4, r * 0.24);

  // Subtle outer halo — sits behind the chunks, doesn't dominate.
  g.fillStyle(colors[0], 0.05 + clamped * 0.06);
  g.fillCircle(0, 0, r * 0.85);

  // Layout chunks as a deterministic pseudo-random scatter within the radius
  // (seeded so per-hit redraws stay put; each jitter seed-bump reshuffles).
  // Intentionally NOT a spiral/phyllotaxis arrangement — just scattered pixels.
  const hash = (n) => {
    const x = Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  for (let i = 0; i < chunkCount; i++) {
    const ang = hash(i * 2 + 1) * Math.PI * 2;
    const dist = r * (0.12 + 0.73 * Math.sqrt(hash(i * 2 + 2)));
    const cx = Math.cos(ang) * dist;
    const cy = Math.sin(ang) * dist;
    const color = colors[i % colors.length];

    // Chunky pixel rect — drawn at integer multiples for that "chunky"
    // chromatic feel. Slight per-chunk size variation keeps it from reading
    // as a uniform grid.
    const size = chunkSize + (i % 3) * 2;
    g.fillStyle(color, 0.95);
    g.fillRect(Math.round(cx) - size / 2, Math.round(cy) - size / 2, size, size);

    // Tiny chromatic ghost — red/blue offset on a fraction of chunks for
    // CRT-glitch flavor.
    if (i % 4 === 0) {
      g.fillStyle(0xff3030, 0.45 * clamped);
      g.fillRect(Math.round(cx) - size / 2 + 3, Math.round(cy) - size / 2, size, size);
      g.fillStyle(0x3030ff, 0.45 * clamped);
      g.fillRect(Math.round(cx) - size / 2 - 3, Math.round(cy) - size / 2, size, size);
    }
  }

  // Scanline tear — one horizontal slice across the blob.
  const tearY = ((seed * 73) % 100) / 100 * r - r / 2;
  g.fillStyle(0xff00ff, 0.6 * clamped);
  g.fillRect(-r, tearY, r * 2, 3);
  g.fillStyle(0x39ff14, 0.5 * clamped);
  g.fillRect(-r, tearY + 4, r * 2, 2);

  // Death stage: at 0 HP, scatter a few black holes where chunks used to be.
  if (clamped <= 0.0001) {
    g.fillStyle(0x000000, 0.8);
    g.fillCircle(0, 0, r * 0.35);
  }
}

function lerpToGray(color, t) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const gray = r * 0.299 + g * 0.587 + b * 0.114;
  const lr = (r + (gray - r) * t) | 0;
  const lg = (g + (gray - g) * t) | 0;
  const lb = (b + (gray - b) * t) | 0;
  return (lr << 16) | (lg << 8) | lb;
}

// Stardust halo — a gold ring + inner glow drawn behind the asteroid body.
// Caller (GameScene) layers orbital sparkles with tweens on top.
export function drawStardustHalo(g, radius) {
  g.fillStyle(0xffe07a, 0.20);
  g.fillCircle(0, 0, radius * 1.55);
  g.fillStyle(0xfff3b8, 0.30);
  g.fillCircle(0, 0, radius * 1.30);
  g.lineStyle(5, 0xffd86b, 0.85);
  g.strokeCircle(0, 0, radius * 1.18);
  g.lineStyle(2, 0xffffff, 0.55);
  g.strokeCircle(0, 0, radius * 1.05);
}

// Twist overlay — a thin, non-distracting visual marker on the asteroid that
// signals which problem twist is active. Caller decides whether to also tween
// it (e.g. flare pulses).
//
//   flare    → red/orange flame ring (W8 + W11 random)
//   gravity  → magenta pull-line streaks (W9 + W11 random)
//   mirror   → cyan shimmer seam (W10 + W11 random)
export function drawTwistOverlay(g, twistKind, radius) {
  if (twistKind === 'flare') {
    g.lineStyle(6, 0xff6b3d, 0.85);
    g.strokeCircle(0, 0, radius * 1.20);
    g.lineStyle(3, 0xffe07a, 0.65);
    g.strokeCircle(0, 0, radius * 1.30);
    // Inner heat glow.
    g.fillStyle(0xff8b3d, 0.18);
    g.fillCircle(0, 0, radius * 1.10);
    return;
  }
  if (twistKind === 'gravity') {
    // Four magenta pull-lines pointing into the center.
    g.lineStyle(4, 0xff00ff, 0.65);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const x1 = Math.cos(a) * radius * 1.40;
      const y1 = Math.sin(a) * radius * 1.40;
      const x2 = Math.cos(a) * radius * 1.05;
      const y2 = Math.sin(a) * radius * 1.05;
      g.lineBetween(x1, y1, x2, y2);
    }
    g.lineStyle(2, 0xff00ff, 0.4);
    g.strokeCircle(0, 0, radius * 1.45);
    return;
  }
  if (twistKind === 'mirror') {
    // Vertical shimmer seam down the middle, cyan accents on both sides.
    g.lineStyle(4, 0x9bd4ff, 0.75);
    g.lineBetween(0, -radius * 1.10, 0, radius * 1.10);
    g.lineStyle(2, 0xffffff, 0.5);
    g.lineBetween(-3, -radius * 1.08, -3, radius * 1.08);
    g.lineBetween(3, -radius * 1.08, 3, radius * 1.08);
    // Bracket marks left/right.
    g.lineStyle(3, 0x9bd4ff, 0.7);
    g.lineBetween(-radius * 1.20, -radius * 0.50, -radius * 1.20, radius * 0.50);
    g.lineBetween(radius * 1.20, -radius * 0.50, radius * 1.20, radius * 0.50);
  }
}

// Mini-boss HP pips — two small dots above the asteroid showing remaining hits.
// Caller passes hpRemaining (0..maxHp). Renders into a Graphics that's
// positioned at the asteroid's local origin; pips sit at -radius - 28.
export function drawMiniBossPips(g, hpRemaining, maxHp, radius) {
  g.clear();
  const pipR = 9;
  const spacing = 26;
  const totalW = (maxHp - 1) * spacing;
  const startX = -totalW / 2;
  const y = -radius - 28;
  for (let i = 0; i < maxHp; i++) {
    const x = startX + i * spacing;
    const filled = i < hpRemaining;
    g.lineStyle(2, 0x0a0010, 0.9);
    g.fillStyle(filled ? 0xffffff : 0x3a3a4a, 1);
    g.fillCircle(x, y, pipR);
    g.strokeCircle(x, y, pipR);
  }
}

// =========================================================================
// NORMAL QUESTION OBJECTS
// =========================================================================

const NORMAL_DRAWERS = {};

// 1 — Moon rock: pale gray with cratered face
NORMAL_DRAWERS[1] = function (g, r) {
  drawShadow(g, r, 4, 8);
  g.fillStyle(0x8b9bd6, 1);
  g.fillCircle(0, 0, r);
  g.fillStyle(0xc7d2ff, 1);
  g.fillCircle(-r * 0.18, -r * 0.22, r * 0.85);
  g.fillStyle(0xe8efff, 1);
  g.fillEllipse(-r * 0.32, -r * 0.4, r * 0.7, r * 0.42);
  // Craters
  g.fillStyle(0x6f7ec4, 0.85);
  g.fillCircle(r * 0.35, r * 0.2, r * 0.18);
  g.fillCircle(-r * 0.18, r * 0.42, r * 0.12);
  g.fillCircle(r * 0.5, -r * 0.32, r * 0.10);
  g.fillStyle(0xb5e6ff, 0.65);
  g.fillCircle(r * 0.35, r * 0.18, r * 0.08);
  outline(g, r, 0x07071a, 0.6, 3);
};

// 2 — Classic asteroid: warm clay with rim light
NORMAL_DRAWERS[2] = function (g, r) {
  const sides = 9;
  const path = polygonPath(r, sides, 0.85, 1.05);
  drawShadow(g, r, 4, 6);
  // Body
  g.fillStyle(0xc77a4a, 1);
  fillPath(g, path);
  // Bright rim on top-left
  g.fillStyle(0xffb38a, 1);
  fillPath(g, path.map(p => ({ x: p.x * 0.7 - 8, y: p.y * 0.7 - 14 })));
  g.fillStyle(0xffd0a6, 0.9);
  g.fillEllipse(-r * 0.28, -r * 0.35, r * 0.6, r * 0.35);
  // Pock marks
  g.fillStyle(0x6b3a1a, 0.6);
  g.fillCircle(r * 0.28, r * 0.18, r * 0.15);
  g.fillCircle(-r * 0.10, r * 0.32, r * 0.10);
  g.fillCircle(r * 0.45, -r * 0.10, r * 0.08);
  outlinePath(g, path, 0x07071a, 0.9, 3);
};

// 3 — Crystal shard cluster: faceted lavender + rose
NORMAL_DRAWERS[3] = function (g, r) {
  drawShadow(g, r, 4, 6);
  // Big back facet
  g.fillStyle(0x9d6bff, 1);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.7, r * 0.2);
  g.lineTo(0, r);
  g.lineTo(-r * 0.7, r * 0.2);
  g.closePath();
  g.fillPath();
  // Mid facet
  g.fillStyle(0xd5a6ff, 1);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.32, 0);
  g.lineTo(0, r * 0.7);
  g.lineTo(-r * 0.32, 0);
  g.closePath();
  g.fillPath();
  // Bright front facet
  g.fillStyle(0xfce7ff, 1);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.14, -r * 0.3);
  g.lineTo(0, r * 0.3);
  g.lineTo(-r * 0.14, -r * 0.3);
  g.closePath();
  g.fillPath();
  // Side mini-shards
  g.fillStyle(0xff9ec7, 1);
  g.fillTriangle(r * 0.85, r * 0.2, r * 1.0, r * 0.95, r * 0.55, r * 0.95);
  g.fillStyle(0xb6e0ff, 1);
  g.fillTriangle(-r * 0.85, r * 0.2, -r * 1.0, r * 0.95, -r * 0.55, r * 0.95);
  // Rainbow glints
  g.fillStyle(0xfff3b8, 1); g.fillCircle(-r * 0.12, -r * 0.4, r * 0.05);
  g.fillStyle(0x9be8a3, 1); g.fillCircle(r * 0.4, -r * 0.18, r * 0.04);
  g.fillStyle(0xffffff, 1); g.fillCircle(0, -r * 0.7, r * 0.07);
  // Outline the back facet
  g.lineStyle(3, 0x07071a, 0.7);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.7, r * 0.2);
  g.lineTo(0, r);
  g.lineTo(-r * 0.7, r * 0.2);
  g.closePath();
  g.strokePath();
};

// 4 — Pollen orb: glowing green core + petal ring
NORMAL_DRAWERS[4] = function (g, r) {
  drawShadow(g, r * 0.9, 4, 6);
  // Outer glow
  g.fillStyle(0x9be8a3, 0.4);
  g.fillCircle(0, 0, r * 1.05);
  g.fillStyle(0xd6f5d0, 0.6);
  g.fillCircle(0, 0, r * 0.85);
  // Petals
  g.fillStyle(0xff9ec7, 0.95);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.fillCircle(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, r * 0.18);
  }
  // Core
  g.fillStyle(0xffe07a, 1);
  g.fillCircle(0, 0, r * 0.45);
  g.fillStyle(0xfff3b8, 1);
  g.fillCircle(-r * 0.1, -r * 0.12, r * 0.22);
  g.lineStyle(3, 0x4f956b, 0.7);
  g.strokeCircle(0, 0, r * 0.95);
};

// 5 — Bolt: hex-headed metal with antenna
NORMAL_DRAWERS[5] = function (g, r) {
  drawShadow(g, r, 4, 6);
  // Hex head
  const hex = polygonPath(r * 0.95, 6, 1, 1);
  g.fillStyle(0x4c7ab5, 1);
  fillPath(g, hex);
  // Top highlight
  g.fillStyle(0x9bd4ff, 1);
  g.fillTriangle(-r * 0.55, -r * 0.4, r * 0.55, -r * 0.4, 0, -r * 0.85);
  // Center cross slot
  g.fillStyle(0x223450, 1);
  g.fillRoundedRect(-r * 0.45, -r * 0.10, r * 0.9, r * 0.20, 4);
  g.fillRoundedRect(-r * 0.10, -r * 0.45, r * 0.20, r * 0.9, 4);
  // Antenna
  g.fillStyle(0xb6e0ff, 1);
  g.fillRect(-2, -r * 1.15, 4, r * 0.3);
  g.fillStyle(0xfff3b8, 1);
  g.fillCircle(0, -r * 1.18, r * 0.10);
  outlinePath(g, hex, 0x07071a, 0.9, 3);
};

// 6 — Gravity sphere: black core, light bending around it
NORMAL_DRAWERS[6] = function (g, r) {
  drawShadow(g, r, 4, 6);
  // Outer rose halo
  g.fillStyle(0xff9ec7, 0.30);
  g.fillCircle(0, 0, r * 1.1);
  g.fillStyle(0xffd0e5, 0.55);
  g.fillCircle(0, 0, r * 0.85);
  // Mid pink ring
  g.fillStyle(0xff9ec7, 1);
  g.fillCircle(0, 0, r * 0.65);
  // Dark inner
  g.fillStyle(0x4a2a55, 1);
  g.fillCircle(0, 0, r * 0.42);
  g.fillStyle(0x07071a, 1);
  g.fillCircle(0, 0, r * 0.28);
  // Bright bending arc
  g.lineStyle(4, 0xfff3b8, 0.95);
  g.beginPath();
  g.arc(0, 0, r * 0.78, Math.PI * 0.85, Math.PI * 0.15, true);
  g.strokePath();
};

// 7 — Icicle shard: cyan with white highlights
NORMAL_DRAWERS[7] = function (g, r) {
  drawShadow(g, r, 4, 6);
  // Shard body — long tear-drop
  g.fillStyle(0xb6e0ff, 1);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.55, r * 0.3);
  g.lineTo(0, r);
  g.lineTo(-r * 0.55, r * 0.3);
  g.closePath();
  g.fillPath();
  // Bright facet
  g.fillStyle(0xffffff, 1);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.18, -r * 0.2);
  g.lineTo(0, r * 0.2);
  g.lineTo(-r * 0.18, -r * 0.2);
  g.closePath();
  g.fillPath();
  // Side facet
  g.fillStyle(0x6e95c2, 0.7);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.55, r * 0.3);
  g.lineTo(r * 0.18, -r * 0.2);
  g.closePath();
  g.fillPath();
  // Tip glints
  g.fillStyle(0xfff3b8, 1);
  g.fillCircle(0, -r * 0.6, r * 0.06);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(r * 0.2, 0, r * 0.04);
  g.lineStyle(3, 0x2a4a72, 0.85);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.55, r * 0.3);
  g.lineTo(0, r);
  g.lineTo(-r * 0.55, r * 0.3);
  g.closePath();
  g.strokePath();
};

// 8 — Fire shard: burning ember
NORMAL_DRAWERS[8] = function (g, r) {
  drawShadow(g, r, 4, 6);
  // Outer flames silhouette
  g.fillStyle(0xc44b5e, 1);
  g.beginPath();
  g.moveTo(0, -r * 1.05);
  g.lineTo(r * 0.5, -r * 0.15);
  g.lineTo(r * 0.85, r * 0.4);
  g.lineTo(r * 0.3, r);
  g.lineTo(-r * 0.3, r);
  g.lineTo(-r * 0.85, r * 0.4);
  g.lineTo(-r * 0.5, -r * 0.15);
  g.closePath();
  g.fillPath();
  // Coral inner
  g.fillStyle(0xffae8a, 1);
  g.fillCircle(0, 0, r * 0.6);
  // Butter core
  g.fillStyle(0xffe07a, 1);
  g.fillCircle(0, -r * 0.05, r * 0.42);
  // White hot center
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-r * 0.05, -r * 0.12, r * 0.18);
  // Flame highlights
  g.fillStyle(0xfff3b8, 0.85);
  g.fillTriangle(0, -r * 1.0, r * 0.18, -r * 0.5, -r * 0.18, -r * 0.5);
};

// 9 — Gold core fragment: faceted radiant disc
NORMAL_DRAWERS[9] = function (g, r) {
  drawShadow(g, r, 4, 6);
  // Outer gold halo
  g.fillStyle(0xc88a3a, 0.55);
  g.fillCircle(0, 0, r * 1.05);
  // Faceted disc — 8 spokes
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.fillStyle(i % 2 === 0 ? 0xffe07a : 0xfff3b8, 1);
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, r * 0.85, a - Math.PI / 8, a + Math.PI / 8);
    g.closePath();
    g.fillPath();
  }
  // Center jewel
  g.fillStyle(0xfff3b8, 1);
  g.fillCircle(0, 0, r * 0.35);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(-r * 0.08, -r * 0.1, r * 0.16);
  outline(g, r * 0.85, 0xc88a3a, 1, 3);
};

// 10 — Mirror cube: geometric prism with reflective sheen
NORMAL_DRAWERS[10] = function (g, r) {
  drawShadow(g, r, 4, 6);
  // Cube faces
  const half = r * 0.7;
  // Right face (mid)
  g.fillStyle(0x55858a, 1);
  g.beginPath();
  g.moveTo(0, -half);
  g.lineTo(half, -half * 0.5);
  g.lineTo(half, half * 0.6);
  g.lineTo(0, half);
  g.closePath();
  g.fillPath();
  // Left face (bright)
  g.fillStyle(0xa6f0e8, 1);
  g.beginPath();
  g.moveTo(0, -half);
  g.lineTo(-half, -half * 0.5);
  g.lineTo(-half, half * 0.6);
  g.lineTo(0, half);
  g.closePath();
  g.fillPath();
  // Top face (very bright)
  g.fillStyle(0xfce7ff, 1);
  g.beginPath();
  g.moveTo(0, -half);
  g.lineTo(half, -half * 0.5);
  g.lineTo(0, -half * 0.1);
  g.lineTo(-half, -half * 0.5);
  g.closePath();
  g.fillPath();
  // Sheen line
  g.lineStyle(3, 0xffffff, 0.8);
  g.lineBetween(-half * 0.7, -half * 0.4, -half * 0.1, half * 0.4);
  // Outline
  g.lineStyle(3, 0x07071a, 0.85);
  g.beginPath();
  g.moveTo(0, -half);
  g.lineTo(half, -half * 0.5);
  g.lineTo(half, half * 0.6);
  g.lineTo(0, half);
  g.lineTo(-half, half * 0.6);
  g.lineTo(-half, -half * 0.5);
  g.closePath();
  g.strokePath();
};

// 11 — Void data tile: dark with glowing cream edges
NORMAL_DRAWERS[11] = function (g, r) {
  drawShadow(g, r, 4, 6);
  // Outer glow
  g.fillStyle(0xfff3b8, 0.25);
  g.fillRoundedRect(-r * 0.95, -r * 0.95, r * 1.9, r * 1.9, 12);
  // Tile body
  g.fillStyle(0x4a4a8c, 1);
  g.fillRoundedRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7, 10);
  g.fillStyle(0x6b6bb3, 0.6);
  g.fillRoundedRect(-r * 0.85, -r * 0.85, r * 1.7, r * 0.4, 10);
  // Decorative inset frames — a plain geometric tech motif. No symbol of any
  // kind (no rune/sigil/star): just nested rounded squares with a center pip.
  g.lineStyle(4, 0xfff3b8, 1);
  g.strokeRoundedRect(-r * 0.46, -r * 0.46, r * 0.92, r * 0.92, 9);
  g.lineStyle(3, 0xfff3b8, 0.75);
  g.strokeRoundedRect(-r * 0.27, -r * 0.27, r * 0.54, r * 0.54, 7);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(-r * 0.07, -r * 0.07, r * 0.14, r * 0.14);
  // Edge outline
  g.lineStyle(3, 0xfff3b8, 0.85);
  g.strokeRoundedRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7, 10);
};

// ── Chapter 2 "Inner Space" — microscopic biology, one motif per world ──────

// 21 — Bloodstream: red blood cell (biconcave disc)
NORMAL_DRAWERS[21] = function (g, r) {
  drawShadow(g, r, 4, 6);
  g.fillStyle(0xc94257, 1);
  g.fillCircle(0, 0, r);
  g.fillStyle(0xff7a8a, 1);
  g.fillCircle(0, 0, r * 0.92);
  // Concave dimple — a darker recessed center reads as the cell's pinch.
  g.fillStyle(0xd14d63, 1);
  g.fillEllipse(0, r * 0.05, r * 1.0, r * 0.78);
  g.fillStyle(0xb83b50, 0.85);
  g.fillEllipse(0, r * 0.06, r * 0.55, r * 0.42);
  g.fillStyle(0xffd0d8, 0.8);
  g.fillEllipse(-r * 0.3, -r * 0.34, r * 0.5, r * 0.28);
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(-r * 0.34, -r * 0.38, r * 0.09);
  outline(g, r, 0x4a0d18, 0.6, 3);
};

// 22 — Cell City: living cell with nucleus + organelles
NORMAL_DRAWERS[22] = function (g, r) {
  drawShadow(g, r, 4, 6);
  g.fillStyle(0x2f8f86, 0.5);
  g.fillCircle(0, 0, r * 1.0);
  g.fillStyle(0x6fe0d4, 1);
  g.fillCircle(0, 0, r * 0.9);
  g.fillStyle(0xa9f0e8, 0.8);
  g.fillEllipse(-r * 0.22, -r * 0.28, r * 0.7, r * 0.42);
  // Nucleus
  g.fillStyle(0x2f8f86, 1);
  g.fillCircle(r * 0.12, r * 0.1, r * 0.3);
  g.fillStyle(0x1d6b63, 1);
  g.fillCircle(r * 0.16, r * 0.14, r * 0.15);
  // Organelle dots
  g.fillStyle(0xffe07a, 0.95);
  g.fillCircle(-r * 0.45, r * 0.2, r * 0.1);
  g.fillCircle(-r * 0.22, r * 0.48, r * 0.07);
  g.fillStyle(0xff9ec7, 0.9);
  g.fillCircle(r * 0.48, -r * 0.32, r * 0.08);
  g.lineStyle(3, 0x14534c, 0.8);
  g.strokeCircle(0, 0, r * 0.9);
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(-r * 0.36, -r * 0.4, r * 0.08);
};

// 23 — Nucleus Vault: chromosome (two pinched arms + centromere band)
NORMAL_DRAWERS[23] = function (g, r) {
  drawShadow(g, r, 4, 6);
  const lobe = (cx, col, light) => {
    g.fillStyle(col, 1);
    g.fillEllipse(cx, -r * 0.42, r * 0.5, r * 0.62);
    g.fillEllipse(cx, r * 0.42, r * 0.5, r * 0.62);
    g.fillStyle(light, 0.7);
    g.fillEllipse(cx - r * 0.08, -r * 0.5, r * 0.22, r * 0.28);
  };
  lobe(-r * 0.28, 0x9d6bff, 0xd5a6ff);
  lobe(r * 0.28, 0x8a52e8, 0xc99cff);
  // Centromere pinch band crossing the middle.
  g.fillStyle(0x6a3fa0, 1);
  g.fillEllipse(0, 0, r * 1.18, r * 0.34);
  g.fillStyle(0xc77eff, 0.9);
  g.fillEllipse(0, -r * 0.03, r * 0.9, r * 0.16);
  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(-r * 0.36, -r * 0.56, r * 0.06);
};

// 24 — Neuron Forest: neuron with radiating dendrites + glowing synapse tips
NORMAL_DRAWERS[24] = function (g, r) {
  drawShadow(g, r * 0.7, 4, 6);
  const arms = 7;
  const tips = [];
  g.lineStyle(5, 0x4a7fd6, 0.9);
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * Math.PI * 2 + 0.3;
    const ex = Math.cos(a) * r * 1.05, ey = Math.sin(a) * r * 1.05;
    g.lineBetween(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4, ex, ey);
    g.lineBetween(ex, ey, ex + Math.cos(a + 0.5) * r * 0.22, ey + Math.sin(a + 0.5) * r * 0.22);
    tips.push([ex, ey]);
  }
  g.fillStyle(0x3a5fa0, 1);
  g.fillCircle(0, 0, r * 0.5);
  g.fillStyle(0x7fb8ff, 1);
  g.fillCircle(-r * 0.08, -r * 0.1, r * 0.36);
  g.fillStyle(0xd6ecff, 0.9);
  g.fillCircle(-r * 0.15, -r * 0.16, r * 0.15);
  g.fillStyle(0x24407a, 1);
  g.fillCircle(r * 0.05, r * 0.06, r * 0.13);
  g.fillStyle(0xbfe0ff, 1);
  for (const [tx, ty] of tips) g.fillCircle(tx, ty, r * 0.07);
  g.lineStyle(3, 0x1c3160, 0.8);
  g.strokeCircle(0, 0, r * 0.5);
};

// 25 — Marrow Caverns: fresh stem cell budding new cells
NORMAL_DRAWERS[25] = function (g, r) {
  drawShadow(g, r, 4, 6);
  const buds = [[r * 0.72, -r * 0.45, r * 0.34], [-r * 0.7, r * 0.42, r * 0.3], [r * 0.5, r * 0.62, r * 0.26]];
  for (const [bx, by, br] of buds) {
    g.fillStyle(0xb5863a, 1); g.fillCircle(bx, by, br);
    g.fillStyle(0xffcf6b, 1); g.fillCircle(bx, by, br * 0.82);
    g.fillStyle(0xfff0c8, 0.8); g.fillCircle(bx - br * 0.25, by - br * 0.28, br * 0.34);
  }
  g.fillStyle(0xb5863a, 1); g.fillCircle(0, 0, r * 0.9);
  g.fillStyle(0xffcf6b, 1); g.fillCircle(0, 0, r * 0.78);
  g.fillStyle(0xfff0c8, 0.85); g.fillEllipse(-r * 0.25, -r * 0.3, r * 0.6, r * 0.38);
  g.fillStyle(0xc4622a, 1); g.fillCircle(r * 0.1, r * 0.12, r * 0.25);
  g.fillStyle(0x9a4a1f, 1); g.fillCircle(r * 0.13, r * 0.15, r * 0.12);
  g.fillStyle(0xffffff, 0.8); g.fillCircle(-r * 0.32, -r * 0.36, r * 0.08);
  outline(g, r * 0.9, 0x5a3a14, 0.7, 3);
};

// 26 — Immune Front: wiggly bacterium (rod + flagella)
NORMAL_DRAWERS[26] = function (g, r) {
  drawShadow(g, r, 4, 8);
  g.lineStyle(4, 0x4f8a35, 0.85);
  for (let i = -1; i <= 1; i++) {
    g.beginPath();
    g.moveTo(-r * 0.75, i * r * 0.24);
    g.lineTo(-r * 1.02, i * r * 0.24 - r * 0.12);
    g.lineTo(-r * 1.28, i * r * 0.24 + r * 0.08);
    g.strokePath();
  }
  g.fillStyle(0x4f8a35, 1);
  g.fillRoundedRect(-r * 0.78, -r * 0.42, r * 1.56, r * 0.84, r * 0.42);
  g.fillStyle(0x9be86b, 1);
  g.fillRoundedRect(-r * 0.7, -r * 0.36, r * 1.4, r * 0.72, r * 0.36);
  g.fillStyle(0xd6f5b8, 0.8);
  g.fillEllipse(-r * 0.1, -r * 0.18, r * 0.9, r * 0.2);
  g.fillStyle(0x2f6320, 0.9);
  g.fillCircle(-r * 0.3, r * 0.05, r * 0.12);
  g.fillCircle(r * 0.15, -r * 0.02, r * 0.09);
  g.fillCircle(r * 0.45, r * 0.08, r * 0.07);
  g.lineStyle(3, 0x274d18, 0.8);
  g.strokeRoundedRect(-r * 0.7, -r * 0.36, r * 1.4, r * 0.72, r * 0.36);
};

// 27 — Mitochondria Core: mitochondrion (oval + cristae folds + energy core)
NORMAL_DRAWERS[27] = function (g, r) {
  drawShadow(g, r, 4, 6);
  g.fillStyle(0xc4622a, 1);
  g.fillEllipse(0, 0, r * 1.9, r * 1.25);
  g.fillStyle(0xff9b4a, 1);
  g.fillEllipse(0, 0, r * 1.7, r * 1.05);
  g.fillStyle(0xffc48a, 0.75);
  g.fillEllipse(-r * 0.25, -r * 0.2, r * 0.9, r * 0.4);
  // Cristae — inner folds read as vertical lobes inside the oval.
  g.fillStyle(0xc4622a, 0.85);
  for (let i = -1; i <= 1; i++) g.fillEllipse(i * r * 0.55, 0, r * 0.32, r * 0.85);
  g.fillStyle(0xff9b4a, 1);
  for (let i = -1; i <= 1; i++) g.fillEllipse(i * r * 0.55, 0, r * 0.16, r * 0.68);
  g.fillStyle(0xffe07a, 0.95);
  g.fillCircle(0, 0, r * 0.22);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(-r * 0.04, -r * 0.04, r * 0.1);
  g.lineStyle(3, 0x7a3a14, 0.7);
  g.strokeEllipse(0, 0, r * 1.7, r * 1.05);
};

// 28 — The Singularity Cell: pristine luminous first cell
NORMAL_DRAWERS[28] = function (g, r) {
  drawShadow(g, r, 4, 6);
  g.fillStyle(0xfff3b8, 0.18); g.fillCircle(0, 0, r * 1.1);
  g.fillStyle(0xfff3b8, 0.3); g.fillCircle(0, 0, r * 0.98);
  g.fillStyle(0xe8dca0, 1); g.fillCircle(0, 0, r * 0.88);
  g.fillStyle(0xfffade, 1); g.fillCircle(0, 0, r * 0.78);
  g.fillStyle(0xffffff, 0.7); g.fillEllipse(-r * 0.22, -r * 0.28, r * 0.6, r * 0.38);
  g.fillStyle(0xffe9a0, 1); g.fillCircle(0, r * 0.02, r * 0.3);
  g.fillStyle(0xffffff, 0.95); g.fillCircle(-r * 0.05, -r * 0.04, r * 0.14);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(r * 0.5, -r * 0.4, r * 0.05);
  g.fillCircle(-r * 0.55, r * 0.2, r * 0.04);
  g.lineStyle(2, 0xcabf80, 0.7); g.strokeCircle(0, 0, r * 0.88);
};

// 17 — The Royal Flush (secret): E. coli germ minion — green capsule + pili + face
NORMAL_DRAWERS[17] = function (g, r) {
  drawShadow(g, r, 4, 8);
  // Short hair-like pili poking out around the capsule.
  g.lineStyle(3, 0x4f7a28, 0.9);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const px = Math.cos(a) * r * 0.82, py = Math.sin(a) * r * 0.5;
    g.lineBetween(px, py, px + Math.cos(a) * r * 0.22, py + Math.sin(a) * r * 0.18);
  }
  // A short wavy flagellum tail trailing off one end.
  g.lineStyle(3, 0x4f7a28, 0.85);
  g.beginPath();
  g.moveTo(-r * 0.92, r * 0.1);
  g.lineTo(-r * 1.14, -r * 0.06);
  g.lineTo(-r * 1.32, r * 0.12);
  g.strokePath();
  // Rod/capsule body.
  g.fillStyle(0x6b8f3a, 1);
  g.fillRoundedRect(-r * 0.92, -r * 0.5, r * 1.84, r * 1.0, r * 0.5);
  g.fillStyle(0x9bc35a, 1);
  g.fillRoundedRect(-r * 0.82, -r * 0.42, r * 1.64, r * 0.84, r * 0.42);
  g.fillStyle(0xc8e89a, 0.8);
  g.fillEllipse(-r * 0.12, -r * 0.2, r * 1.0, r * 0.24);
  // Tiny face — two eyes + a little smirk.
  g.fillStyle(0x2f4d16, 1);
  g.fillCircle(-r * 0.22, -r * 0.05, r * 0.1);
  g.fillCircle(r * 0.22, -r * 0.05, r * 0.1);
  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(-r * 0.25, -r * 0.08, r * 0.04);
  g.fillCircle(r * 0.19, -r * 0.08, r * 0.04);
  g.lineStyle(3, 0x2f4d16, 0.9);
  g.beginPath();
  g.arc(0, r * 0.08, r * 0.22, 0.12 * Math.PI, 0.88 * Math.PI, false);
  g.strokePath();
  g.lineStyle(3, 0x3a5a1c, 0.8);
  g.strokeRoundedRect(-r * 0.82, -r * 0.42, r * 1.64, r * 0.84, r * 0.42);
};

// =========================================================================
// BOSS BODIES — bespoke per world (radius is large, ~374)
// =========================================================================

const BOSS_DRAWERS = {};

// Generic boss outline + eyes used by many drawers
function bossEyes(g, r, eyeColor = 0xff3b3b) {
  const eyeOffsetX = r * 0.32;
  const eyeY = -r * 0.22;
  g.fillStyle(eyeColor, 0.95);
  g.fillCircle(-eyeOffsetX, eyeY, r * 0.07);
  g.fillCircle(eyeOffsetX, eyeY, r * 0.07);
  g.fillStyle(0xffffaa, 1);
  g.fillCircle(-eyeOffsetX, eyeY, r * 0.03);
  g.fillCircle(eyeOffsetX, eyeY, r * 0.03);
}

function bossShadow(g, r) {
  g.fillStyle(0x000000, 0.55);
  g.fillEllipse(8, r + 12, r * 1.8, r * 0.32);
}

// 1 — Cratershade: hunched mole-mound with two big tunnels
BOSS_DRAWERS[1] = function (g, accent, r) {
  bossShadow(g, r);
  // Tunnels behind
  g.fillStyle(0x12122a, 1);
  g.fillEllipse(-r * 0.7, r * 0.2, r * 0.5, r * 0.8);
  g.fillEllipse(r * 0.7, r * 0.2, r * 0.5, r * 0.8);
  // Main body — round periwinkle moon
  g.fillStyle(0x6f7ec4, 1);
  g.fillCircle(0, 0, r);
  g.fillStyle(0xb5e6ff, 1);
  g.fillEllipse(-r * 0.25, -r * 0.35, r * 0.7, r * 0.45);
  // Big mole snout pushing forward
  g.fillStyle(0x4a5a92, 1);
  g.fillEllipse(0, r * 0.35, r * 0.8, r * 0.55);
  g.fillStyle(0xff9ec7, 0.7);
  g.fillEllipse(0, r * 0.45, r * 0.4, r * 0.18);
  // Whiskers
  g.lineStyle(3, 0x2a3a5a, 0.85);
  g.lineBetween(-r * 0.3, r * 0.35, -r * 0.65, r * 0.45);
  g.lineBetween(-r * 0.3, r * 0.42, -r * 0.6, r * 0.55);
  g.lineBetween(r * 0.3, r * 0.35, r * 0.65, r * 0.45);
  g.lineBetween(r * 0.3, r * 0.42, r * 0.6, r * 0.55);
  bossEyes(g, r);
  outline(g, r, 0x07071a, 0.95, 5);
};

// 2 — Boulderlord: jagged crowned asteroid
BOSS_DRAWERS[2] = function (g, accent, r) {
  bossShadow(g, r);
  const path = polygonPath(r, 13, 0.86, 1.06);
  g.fillStyle(0xc77a4a, 1);
  fillPath(g, path);
  g.fillStyle(0xffb38a, 1);
  fillPath(g, path.map(p => ({ x: p.x * 0.7 - 8, y: p.y * 0.7 - 14 })));
  g.fillStyle(0xffd0a6, 0.65);
  g.fillEllipse(-r * 0.28, -r * 0.45, r * 0.7, r * 0.32);
  // Crown horns on top
  g.fillStyle(0x8c4f25, 1);
  g.fillTriangle(-r * 0.55, -r * 0.85, -r * 0.3, -r * 1.18, -r * 0.05, -r * 0.85);
  g.fillTriangle(-r * 0.05, -r * 0.85, r * 0.2, -r * 1.32, r * 0.45, -r * 0.85);
  g.fillTriangle(r * 0.45, -r * 0.85, r * 0.7, -r * 1.18, r * 0.95, -r * 0.85);
  bossEyes(g, r);
  outlinePath(g, path, 0x07071a, 0.95, 5);
};

// 3 — Shardmaw: floating mouth with crystal teeth
BOSS_DRAWERS[3] = function (g, accent, r) {
  bossShadow(g, r);
  // Body — diamond
  g.fillStyle(0x9d6bff, 1);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.95, 0);
  g.lineTo(0, r);
  g.lineTo(-r * 0.95, 0);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xd5a6ff, 1);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.45, 0);
  g.lineTo(0, r * 0.6);
  g.lineTo(-r * 0.45, 0);
  g.closePath();
  g.fillPath();
  // Mouth cavity
  g.fillStyle(0x07071a, 1);
  g.fillEllipse(0, r * 0.15, r * 0.7, r * 0.32);
  // Crystal teeth
  g.fillStyle(0xfce7ff, 1);
  for (let i = -2; i <= 2; i++) {
    const tx = i * r * 0.16;
    g.fillTriangle(tx - r * 0.06, r * 0.04, tx + r * 0.06, r * 0.04, tx, r * 0.18);
  }
  bossEyes(g, r, 0xff9ec7);
  // Outline diamond
  g.lineStyle(5, 0x07071a, 0.95);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.95, 0);
  g.lineTo(0, r);
  g.lineTo(-r * 0.95, 0);
  g.closePath();
  g.strokePath();
};

// 4 — Mistshroud: mossy figure cloaked in vines
BOSS_DRAWERS[4] = function (g, accent, r) {
  bossShadow(g, r);
  // Cloak body
  g.fillStyle(0x3a7a52, 1);
  g.fillEllipse(0, r * 0.1, r * 1.6, r * 1.7);
  g.fillStyle(0x4f956b, 1);
  g.fillEllipse(0, 0, r * 1.4, r * 1.5);
  g.fillStyle(0x9be8a3, 0.75);
  g.fillEllipse(-r * 0.2, -r * 0.4, r * 0.9, r * 0.5);
  // Hood lip
  g.fillStyle(0x2a5a3a, 1);
  g.fillEllipse(0, -r * 0.55, r * 1.1, r * 0.35);
  // Vines
  g.lineStyle(4, 0x4f956b, 1);
  g.beginPath(); g.arc(-r * 0.5, r * 0.2, r * 0.18, Math.PI, 0); g.strokePath();
  g.beginPath(); g.arc(r * 0.5, r * 0.4, r * 0.16, Math.PI, 0); g.strokePath();
  // Blossom buttons
  g.fillStyle(0xff9ec7, 1);
  g.fillCircle(-r * 0.6, r * 0.3, r * 0.05);
  g.fillCircle(r * 0.6, r * 0.5, r * 0.05);
  // Glowing eyes peering from hood
  bossEyes(g, r, 0xffe07a);
  outline(g, r, 0x07071a, 0.95, 5);
};

// 5 — Coregrinder: robot core with rotating gear collar
BOSS_DRAWERS[5] = function (g, accent, r) {
  bossShadow(g, r);
  // Gear collar
  const teeth = 12;
  g.fillStyle(0x4c7ab5, 1);
  g.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r * 1.05 : r * 0.85;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
  // Inner steel
  g.fillStyle(0x9bd4ff, 1);
  g.fillCircle(0, 0, r * 0.7);
  g.fillStyle(0xd6ecff, 1);
  g.fillCircle(-r * 0.15, -r * 0.18, r * 0.4);
  // Core jewel
  g.fillStyle(0xff9ec7, 1);
  g.fillCircle(0, 0, r * 0.3);
  g.fillStyle(0xfff3b8, 1);
  g.fillCircle(-r * 0.05, -r * 0.05, r * 0.14);
  bossEyes(g, r, 0xffe07a);
  outline(g, r * 1.05, 0x07071a, 0.95, 5);
};

// 6 — Eventhorror: black abyss with glowing rose ring
BOSS_DRAWERS[6] = function (g, accent, r) {
  bossShadow(g, r);
  // Outer halo
  g.fillStyle(0xff9ec7, 0.35);
  g.fillCircle(0, 0, r * 1.05);
  g.fillStyle(0xffd0e5, 0.55);
  g.fillCircle(0, 0, r * 0.85);
  // Inner pink ring
  g.fillStyle(0xff9ec7, 1);
  g.fillCircle(0, 0, r * 0.78);
  g.fillStyle(0xfce7ff, 1);
  g.fillCircle(0, 0, r * 0.7);
  // Black abyss
  g.fillStyle(0x07071a, 1);
  g.fillCircle(0, 0, r * 0.5);
  // Bright accretion arc
  g.lineStyle(8, 0xfff3b8, 1);
  g.beginPath();
  g.arc(0, 0, r * 0.7, Math.PI * 0.85, Math.PI * 0.15, true);
  g.strokePath();
  // Eyes inside the void
  g.fillStyle(0xff9ec7, 1);
  g.fillCircle(-r * 0.18, -r * 0.1, r * 0.06);
  g.fillCircle(r * 0.18, -r * 0.1, r * 0.06);
  outline(g, r * 0.78, 0xfff3b8, 1, 3);
};

// 7 — Frostfang: icicle mouth with frost beard
BOSS_DRAWERS[7] = function (g, accent, r) {
  bossShadow(g, r);
  // Body
  g.fillStyle(0x6e95c2, 1);
  g.fillCircle(0, 0, r);
  g.fillStyle(0xb6e0ff, 1);
  g.fillCircle(-r * 0.15, -r * 0.18, r * 0.85);
  g.fillStyle(0xe2f4ff, 1);
  g.fillEllipse(-r * 0.25, -r * 0.4, r * 0.7, r * 0.4);
  // Frost beard — icicles dripping from bottom
  for (let i = -3; i <= 3; i++) {
    const tx = i * r * 0.18;
    g.fillStyle(0xe2f4ff, 1);
    g.fillTriangle(tx - r * 0.08, r * 0.7, tx + r * 0.08, r * 0.7, tx, r * 1.1);
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(tx - r * 0.04, r * 0.7, tx + r * 0.04, r * 0.7, tx, r * 0.95);
  }
  // Mouth — icicle teeth
  g.fillStyle(0x07071a, 1);
  g.fillEllipse(0, r * 0.2, r * 0.55, r * 0.2);
  g.fillStyle(0xffffff, 1);
  for (let i = -2; i <= 2; i++) {
    const tx = i * r * 0.13;
    g.fillTriangle(tx - r * 0.05, r * 0.12, tx + r * 0.05, r * 0.12, tx, r * 0.28);
  }
  bossEyes(g, r, 0xb6e0ff);
  outline(g, r, 0x07071a, 0.95, 5);
};

// 8 — Pyrewraith: flame-cloaked skull with ember crown
BOSS_DRAWERS[8] = function (g, accent, r) {
  bossShadow(g, r);
  // Outer flame
  g.fillStyle(0xc44b5e, 1);
  g.beginPath();
  g.moveTo(0, -r * 1.1);
  g.lineTo(r * 0.7, -r * 0.2);
  g.lineTo(r, r * 0.5);
  g.lineTo(r * 0.4, r);
  g.lineTo(-r * 0.4, r);
  g.lineTo(-r, r * 0.5);
  g.lineTo(-r * 0.7, -r * 0.2);
  g.closePath();
  g.fillPath();
  // Coral mid
  g.fillStyle(0xffae8a, 1);
  g.fillCircle(0, 0, r * 0.78);
  g.fillStyle(0xffe07a, 0.85);
  g.fillCircle(-r * 0.1, -r * 0.15, r * 0.5);
  // Skull — dark eyes + nose
  g.fillStyle(0x07071a, 1);
  g.fillCircle(-r * 0.25, -r * 0.1, r * 0.10);
  g.fillCircle(r * 0.25, -r * 0.1, r * 0.10);
  g.fillTriangle(-r * 0.06, r * 0.05, r * 0.06, r * 0.05, 0, r * 0.18);
  // Skull teeth
  for (let i = -2; i <= 2; i++) {
    const tx = i * r * 0.10;
    g.fillStyle(0xfff3b8, 1);
    g.fillRect(tx - r * 0.04, r * 0.28, r * 0.07, r * 0.10);
  }
  // Ember eye glow
  g.fillStyle(0xff3b3b, 0.85);
  g.fillCircle(-r * 0.25, -r * 0.1, r * 0.05);
  g.fillCircle(r * 0.25, -r * 0.1, r * 0.05);
};

// 9 — Corecrusher: golden gem with filament arms
BOSS_DRAWERS[9] = function (g, accent, r) {
  bossShadow(g, r);
  // Filament arms
  g.lineStyle(8, 0xc88a3a, 0.85);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.lineBetween(0, 0, Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1);
  }
  // Gem body — diamond shape
  g.fillStyle(0xc88a3a, 1);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.85, 0);
  g.lineTo(0, r);
  g.lineTo(-r * 0.85, 0);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xffe07a, 1);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.45, 0);
  g.lineTo(0, r * 0.6);
  g.lineTo(-r * 0.45, 0);
  g.closePath();
  g.fillPath();
  g.fillStyle(0xfff3b8, 1);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.18, -r * 0.3);
  g.lineTo(0, r * 0.3);
  g.lineTo(-r * 0.18, -r * 0.3);
  g.closePath();
  g.fillPath();
  bossEyes(g, r);
  // Outline
  g.lineStyle(5, 0x07071a, 0.95);
  g.beginPath();
  g.moveTo(0, -r);
  g.lineTo(r * 0.85, 0);
  g.lineTo(0, r);
  g.lineTo(-r * 0.85, 0);
  g.closePath();
  g.strokePath();
};

// 10 — Mirrorshade: cracked mirror with player silhouette
BOSS_DRAWERS[10] = function (g, accent, r) {
  bossShadow(g, r);
  // Mirror frame
  g.fillStyle(0x55858a, 1);
  g.fillRoundedRect(-r * 0.95, -r * 1.1, r * 1.9, r * 2.2, 16);
  // Mirror surface
  g.fillStyle(0xa6f0e8, 1);
  g.fillRoundedRect(-r * 0.8, -r * 0.95, r * 1.6, r * 1.9, 12);
  g.fillStyle(0xfce7ff, 0.85);
  g.fillRoundedRect(-r * 0.7, -r * 0.85, r * 1.0, r * 0.8, 12);
  // Cracks
  g.lineStyle(4, 0x07071a, 0.9);
  g.lineBetween(-r * 0.5, -r * 0.8, r * 0.6, r * 0.7);
  g.lineBetween(0, -r * 0.95, r * 0.3, r * 0.95);
  g.lineBetween(-r * 0.5, r * 0.4, r * 0.3, -r * 0.2);
  // Reflected silhouette inside (shrunken pet shape)
  g.fillStyle(0x07071a, 0.85);
  g.fillEllipse(0, r * 0.3, r * 0.45, r * 0.6);
  g.fillCircle(0, -r * 0.05, r * 0.32);
  // Glowing red eyes
  bossEyes(g, r * 0.7, 0xff3b3b);
  // Frame outline
  g.lineStyle(5, 0x07071a, 0.95);
  g.strokeRoundedRect(-r * 0.95, -r * 1.1, r * 1.9, r * 2.2, 16);
};

// 11 — Void Devourer: starfield maw with tendrils
BOSS_DRAWERS[11] = function (g, accent, r) {
  bossShadow(g, r);
  // Tendrils first (behind body)
  g.lineStyle(10, 0x4a4a8c, 0.85);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.4;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
    g.lineTo(Math.cos(a + 0.3) * r * 1.4, Math.sin(a + 0.3) * r * 1.4);
    g.strokePath();
  }
  // Body
  g.fillStyle(0x4a4a8c, 1);
  g.fillCircle(0, 0, r);
  g.fillStyle(0x6b6bb3, 0.7);
  g.fillCircle(-r * 0.15, -r * 0.2, r * 0.7);
  // Constellation specks across the surface
  const specks = [
    [-r * 0.4, -r * 0.3], [r * 0.3, -r * 0.5], [r * 0.5, r * 0.2],
    [-r * 0.5, r * 0.3], [0, r * 0.5], [-r * 0.2, -r * 0.6]
  ];
  g.fillStyle(0xfff3b8, 1);
  for (const [sx, sy] of specks) g.fillCircle(sx, sy, r * 0.04);
  // Maw — open mouth at center
  g.fillStyle(0x07071a, 1);
  g.fillCircle(0, r * 0.1, r * 0.4);
  g.fillStyle(0xffffff, 1);
  // Star teeth
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    const tx = Math.cos(a) * r * 0.32;
    const ty = r * 0.1 - Math.sin(a) * r * 0.2;
    g.fillCircle(tx, ty, r * 0.04);
  }
  bossEyes(g, r, 0xfff3b8);
  outline(g, r, 0xfff3b8, 1, 5);
};

// ── Chapter 2 "Inner Space" bosses — the eight germ villains ─────────────────

// 21 — Sneezel: cold-virus germ with a corona of spikes + a drippy snout
BOSS_DRAWERS[21] = function (g, accent, r) {
  bossShadow(g, r);
  const spikes = 14;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    g.lineStyle(r * 0.06, 0xc94257, 1);
    g.lineBetween(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, Math.cos(a) * r * 1.18, Math.sin(a) * r * 1.18);
    g.fillStyle(0xff9ec7, 1);
    g.fillCircle(Math.cos(a) * r * 1.18, Math.sin(a) * r * 1.18, r * 0.08);
  }
  g.fillStyle(0xc94257, 1); g.fillCircle(0, 0, r);
  g.fillStyle(0xff7a8a, 1); g.fillCircle(-r * 0.05, -r * 0.05, r * 0.9);
  g.fillStyle(0xffb3bf, 0.8); g.fillEllipse(-r * 0.28, -r * 0.34, r * 0.8, r * 0.45);
  // Drippy snout + a glistening drop.
  g.fillStyle(0xff9ec7, 1); g.fillEllipse(0, r * 0.5, r * 0.5, r * 0.36);
  g.fillStyle(0xb6e0ff, 0.9);
  g.fillCircle(r * 0.05, r * 0.72, r * 0.1);
  g.fillEllipse(r * 0.05, r * 0.86, r * 0.12, r * 0.22);
  bossEyes(g, r);
  g.lineStyle(r * 0.04, 0x7a1020, 0.9);
  g.lineBetween(-r * 0.5, -r * 0.34, -r * 0.16, -r * 0.24);
  g.lineBetween(r * 0.5, -r * 0.34, r * 0.16, -r * 0.24);
  outline(g, r, 0x4a0d18, 0.95, 5);
};

// 22 — Gunkster: gooey slime blob with drips, bubbles + a wide gooey grin
BOSS_DRAWERS[22] = function (g, accent, r) {
  bossShadow(g, r);
  g.fillStyle(0x2f8f86, 1);
  g.fillCircle(0, 0, r);
  for (const [dx, dr] of [[-r * 0.55, r * 0.22], [0, r * 0.3], [r * 0.5, r * 0.2]]) {
    g.fillEllipse(dx, r * 0.85, dr * 1.4, dr * 2.2);
    g.fillCircle(dx, r * 1.05, dr);
  }
  g.fillStyle(0x4ecdc4, 1); g.fillCircle(-r * 0.05, -r * 0.08, r * 0.88);
  g.fillStyle(0x9bf0e8, 0.8); g.fillEllipse(-r * 0.28, -r * 0.34, r * 0.8, r * 0.45);
  g.fillStyle(0x7be0d8, 0.9);
  g.fillCircle(r * 0.4, r * 0.2, r * 0.14);
  g.fillCircle(-r * 0.45, r * 0.05, r * 0.1);
  g.fillStyle(0xd6fff8, 0.85);
  g.fillCircle(r * 0.36, r * 0.15, r * 0.05);
  // Gooey grin (filled bottom arc).
  g.fillStyle(0x14534c, 1);
  g.beginPath();
  g.arc(0, r * 0.1, r * 0.5, 0.15 * Math.PI, 0.85 * Math.PI, false);
  g.closePath(); g.fillPath();
  bossEyes(g, r, 0xffe07a);
  outline(g, r, 0x0f3b36, 0.95, 5);
};

// 23 — Scramble: jagged purple gremlin marked with scrambled digit-glyphs
BOSS_DRAWERS[23] = function (g, accent, r) {
  bossShadow(g, r);
  const path = polygonPath(r, 11, 0.78, 1.12);
  g.fillStyle(0x6a3fa0, 1); fillPath(g, path);
  g.fillStyle(0x9d6bff, 1); fillPath(g, path.map(p => ({ x: p.x * 0.7, y: p.y * 0.7 - r * 0.1 })));
  g.fillStyle(0xc99cff, 0.7); g.fillEllipse(-r * 0.25, -r * 0.4, r * 0.7, r * 0.4);
  // Scrambled glyph marks (little bright cross-rects — no symbol, just garble).
  g.fillStyle(0xfce7ff, 0.9);
  for (const [mx, my] of [[-r * 0.4, r * 0.1], [r * 0.3, -r * 0.2], [r * 0.15, r * 0.42], [-r * 0.15, -r * 0.46], [r * 0.5, r * 0.15]]) {
    g.fillRect(mx - r * 0.05, my - r * 0.09, r * 0.1, r * 0.18);
    g.fillRect(mx - r * 0.09, my - r * 0.02, r * 0.18, r * 0.06);
  }
  // Zigzag grin.
  g.lineStyle(r * 0.05, 0x2a0f4a, 1);
  g.beginPath();
  g.moveTo(-r * 0.35, r * 0.32);
  g.lineTo(-r * 0.12, r * 0.46);
  g.lineTo(r * 0.12, r * 0.32);
  g.lineTo(r * 0.35, r * 0.46);
  g.strokePath();
  bossEyes(g, r, 0xff9ec7);
  outlinePath(g, path, 0x2a0f4a, 0.95, 5);
};

// 24 — Staticbug: electric beetle with antennae + crackling spark arcs
BOSS_DRAWERS[24] = function (g, accent, r) {
  bossShadow(g, r);
  g.lineStyle(r * 0.035, 0xbfe0ff, 0.9);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.2;
    const x0 = Math.cos(a) * r * 0.95, y0 = Math.sin(a) * r * 0.95;
    const x1 = Math.cos(a) * r * 1.25, y1 = Math.sin(a) * r * 1.25;
    const mx = (x0 + x1) / 2 + Math.cos(a + 1.5) * r * 0.12;
    const my = (y0 + y1) / 2 + Math.sin(a + 1.5) * r * 0.12;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(mx, my); g.lineTo(x1, y1); g.strokePath();
  }
  g.lineStyle(r * 0.04, 0x3a5fa0, 1);
  g.lineBetween(-r * 0.3, -r * 0.78, -r * 0.5, -r * 1.15);
  g.lineBetween(r * 0.3, -r * 0.78, r * 0.5, -r * 1.15);
  g.fillStyle(0xffe07a, 1);
  g.fillCircle(-r * 0.5, -r * 1.15, r * 0.09);
  g.fillCircle(r * 0.5, -r * 1.15, r * 0.09);
  g.fillStyle(0x3a5fa0, 1); g.fillEllipse(0, 0, r * 1.7, r * 1.9);
  g.fillStyle(0x7fb8ff, 1); g.fillEllipse(-r * 0.08, -r * 0.1, r * 1.4, r * 1.5);
  g.fillStyle(0xd6ecff, 0.8); g.fillEllipse(-r * 0.25, -r * 0.35, r * 0.7, r * 0.5);
  // Wing seam as a lightning bolt.
  g.lineStyle(r * 0.04, 0x24407a, 0.9);
  g.beginPath();
  g.moveTo(0, -r * 0.6); g.lineTo(-r * 0.1, -r * 0.1); g.lineTo(r * 0.08, 0); g.lineTo(-r * 0.05, r * 0.7);
  g.strokePath();
  bossEyes(g, r, 0xffe07a);
  g.lineStyle(5, 0x1c3160, 0.95); g.strokeEllipse(0, 0, r * 1.7, r * 1.9);
};

// 25 — Crustle: crusty armored crab-rock with two pincers
BOSS_DRAWERS[25] = function (g, accent, r) {
  bossShadow(g, r);
  const claw = (sx) => {
    g.fillStyle(0xb5863a, 1); g.fillCircle(sx * r * 1.05, r * 0.2, r * 0.34);
    g.fillStyle(0xffcf6b, 1); g.fillCircle(sx * r * 1.05, r * 0.2, r * 0.24);
    g.fillStyle(0x12122a, 1); g.fillTriangle(sx * r * 1.2, r * 0.05, sx * r * 1.2, r * 0.35, sx * r * 0.92, r * 0.2);
  };
  claw(-1); claw(1);
  const path = polygonPath(r, 12, 0.84, 1.08);
  g.fillStyle(0x8a5f25, 1); fillPath(g, path);
  g.fillStyle(0xb5863a, 1); fillPath(g, path.map(p => ({ x: p.x * 0.82, y: p.y * 0.82 - r * 0.06 })));
  g.fillStyle(0xffcf6b, 0.7); g.fillEllipse(-r * 0.25, -r * 0.4, r * 0.7, r * 0.36);
  g.fillStyle(0x8a5f25, 0.9);
  g.fillCircle(r * 0.35, r * 0.15, r * 0.12);
  g.fillCircle(-r * 0.3, r * 0.3, r * 0.1);
  g.fillCircle(r * 0.1, -r * 0.35, r * 0.08);
  // Chompy mouth with teeth.
  g.fillStyle(0x12122a, 1); g.fillRoundedRect(-r * 0.32, r * 0.35, r * 0.64, r * 0.2, 4);
  g.fillStyle(0xfff0c8, 1);
  for (let i = -2; i <= 2; i++) g.fillRect(i * r * 0.12 - r * 0.03, r * 0.35, r * 0.06, r * 0.1);
  bossEyes(g, r, 0xfff3b8);
  outlinePath(g, path, 0x4a2f10, 0.95, 5);
};

// 26 — Swarm Mother: crowned queen germ surrounded by spawnlings
BOSS_DRAWERS[26] = function (g, accent, r) {
  bossShadow(g, r);
  for (const [sx, sy] of [[-r * 1.05, -r * 0.2], [r * 1.05, -r * 0.1], [-r * 0.85, r * 0.6], [r * 0.9, r * 0.55]]) {
    g.fillStyle(0x4f8a35, 1); g.fillCircle(sx, sy, r * 0.2);
    g.fillStyle(0x9be86b, 1); g.fillCircle(sx, sy, r * 0.14);
    g.fillStyle(0x2f6320, 1); g.fillCircle(sx, sy, r * 0.05);
  }
  g.fillStyle(0x4f8a35, 1); g.fillCircle(0, 0, r);
  g.fillStyle(0x9be86b, 1); g.fillCircle(-r * 0.05, -r * 0.05, r * 0.9);
  g.fillStyle(0xcdf5a8, 0.8); g.fillEllipse(-r * 0.28, -r * 0.34, r * 0.8, r * 0.45);
  g.fillStyle(0x2f6320, 0.85);
  g.fillCircle(r * 0.4, r * 0.25, r * 0.1);
  g.fillCircle(-r * 0.4, r * 0.3, r * 0.08);
  // Crown.
  g.fillStyle(0xffe07a, 1);
  g.fillTriangle(-r * 0.5, -r * 0.78, -r * 0.32, -r * 1.12, -r * 0.14, -r * 0.78);
  g.fillTriangle(-r * 0.18, -r * 0.85, 0, -r * 1.28, r * 0.18, -r * 0.85);
  g.fillTriangle(r * 0.14, -r * 0.78, r * 0.32, -r * 1.12, r * 0.5, -r * 0.78);
  g.fillStyle(0xff9ec7, 1); g.fillCircle(0, -r * 1.28, r * 0.06);
  bossEyes(g, r, 0xffe07a);
  g.lineStyle(r * 0.045, 0x274d18, 1);
  g.beginPath(); g.arc(0, r * 0.05, r * 0.4, 0.15 * Math.PI, 0.85 * Math.PI, false); g.strokePath();
  outline(g, r, 0x1f3a12, 0.95, 5);
};

// 27 — Drainol: orange furnace-cell gulping energy through a straw proboscis
BOSS_DRAWERS[27] = function (g, accent, r) {
  bossShadow(g, r);
  g.fillStyle(0xff9b4a, 0.3); g.fillCircle(0, 0, r * 1.1);
  g.fillStyle(0xc4622a, 1); g.fillCircle(0, 0, r);
  g.fillStyle(0xff9b4a, 1); g.fillCircle(-r * 0.05, -r * 0.05, r * 0.88);
  g.fillStyle(0xffc48a, 0.8); g.fillEllipse(-r * 0.28, -r * 0.34, r * 0.8, r * 0.45);
  g.lineStyle(r * 0.03, 0xc4622a, 0.8);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.lineBetween(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45, Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
  }
  g.fillStyle(0xffe07a, 1); g.fillCircle(0, r * 0.12, r * 0.32);
  g.fillStyle(0xffffff, 0.9); g.fillCircle(-r * 0.05, r * 0.08, r * 0.14);
  // Sucking straw/proboscis.
  g.fillStyle(0x8a3f18, 1); g.fillRoundedRect(-r * 0.12, r * 0.62, r * 0.24, r * 0.5, r * 0.1);
  g.fillStyle(0x07071a, 1); g.fillEllipse(0, r * 1.12, r * 0.22, r * 0.12);
  bossEyes(g, r, 0xfff3b8);
  outline(g, r, 0x6a3010, 0.95, 5);
};

// 28 — Patient Zero: the regal grand-finale master germ (pale gold + corona crown)
BOSS_DRAWERS[28] = function (g, accent, r) {
  bossShadow(g, r);
  g.fillStyle(0xfff3b8, 0.1); g.fillCircle(0, 0, r * 1.35);
  g.fillStyle(0xfff3b8, 0.16); g.fillCircle(0, 0, r * 1.18);
  // Elegant corona crown — alternating long + short spikes.
  const spikes = 18;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const long = i % 2 === 0;
    g.lineStyle(r * (long ? 0.05 : 0.035), 0xe8c97a, 1);
    g.lineBetween(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92,
                  Math.cos(a) * r * (long ? 1.3 : 1.12), Math.sin(a) * r * (long ? 1.3 : 1.12));
    g.fillStyle(long ? 0xff9ec7 : 0xfffade, 1);
    g.fillCircle(Math.cos(a) * r * (long ? 1.3 : 1.12), Math.sin(a) * r * (long ? 1.3 : 1.12), r * (long ? 0.07 : 0.05));
  }
  g.fillStyle(0xd9c87e, 1); g.fillCircle(0, 0, r);
  g.fillStyle(0xfff3b8, 1); g.fillCircle(-r * 0.05, -r * 0.06, r * 0.9);
  g.fillStyle(0xfffdf0, 0.85); g.fillEllipse(-r * 0.26, -r * 0.32, r * 0.85, r * 0.5);
  g.lineStyle(r * 0.02, 0xe8c97a, 0.8); g.strokeCircle(0, 0, r * 0.6);
  g.lineStyle(r * 0.02, 0xe8c97a, 0.6); g.strokeCircle(0, 0, r * 0.4);
  g.fillStyle(0xff9ec7, 1); g.fillCircle(0, r * 0.02, r * 0.26);
  g.fillStyle(0xffffff, 0.95); g.fillCircle(-r * 0.06, -r * 0.05, r * 0.12);
  bossEyes(g, r, 0xff7a8a);
  g.lineStyle(r * 0.035, 0xb8902f, 0.9);
  g.lineBetween(-r * 0.5, -r * 0.34, -r * 0.18, -r * 0.28);
  g.lineBetween(r * 0.5, -r * 0.34, r * 0.18, -r * 0.28);
  outline(g, r, 0x8a6a1f, 0.95, 5);
};

// 17 — King Coli (secret superboss): regal E. coli germ-king of "The Royal Flush"
// A green capsule body standing upright with pili + flagella, a gold porcelain
// crown of rounded merlons, a smug royal face, and a tiny scepter. Echoes
// Patient Zero's regal layering — but germier and a touch comedic.
BOSS_DRAWERS[17] = function (g, accent, r) {
  bossShadow(g, r);
  // Faint sickly aura.
  g.fillStyle(0x9bc35a, 0.1); g.fillCircle(0, 0, r * 1.3);
  g.fillStyle(0x9bc35a, 0.14); g.fillCircle(0, 0, r * 1.12);

  // Wavy flagella tails trailing off behind the body (drawn first, behind).
  g.lineStyle(r * 0.045, 0x4f7a28, 0.9);
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(side * r * 0.55, r * 0.95);
    g.lineTo(side * r * 0.78, r * 1.18);
    g.lineTo(side * r * 0.58, r * 1.38);
    g.lineTo(side * r * 0.86, r * 1.55);
    g.strokePath();
  }

  // Short hair-like pili poking out all around the capsule.
  g.lineStyle(r * 0.025, 0x4f7a28, 0.95);
  const pili = 22;
  for (let i = 0; i < pili; i++) {
    const a = (i / pili) * Math.PI * 2;
    const ex = Math.cos(a) * r * 0.96, ey = Math.sin(a) * r * 1.04;
    g.lineBetween(Math.cos(a) * r * 0.84, Math.sin(a) * r * 0.92, ex, ey);
    g.fillStyle(0x6b8f3a, 1);
    g.fillCircle(ex, ey, r * 0.02);
  }

  // Rod/capsule body — tall green germ standing upright.
  g.fillStyle(0x6b8f3a, 1);
  g.fillRoundedRect(-r * 0.82, -r * 0.92, r * 1.64, r * 1.84, r * 0.82);
  g.fillStyle(0x9bc35a, 1);
  g.fillRoundedRect(-r * 0.72, -r * 0.84, r * 1.44, r * 1.68, r * 0.72);
  // Bright rim light on the upper-left.
  g.fillStyle(0xc8e89a, 0.85);
  g.fillEllipse(-r * 0.22, -r * 0.5, r * 0.85, r * 0.55);
  // A couple of darker germ-speckle blemishes for texture.
  g.fillStyle(0x4f7a28, 0.7);
  g.fillCircle(r * 0.42, r * 0.32, r * 0.12);
  g.fillCircle(-r * 0.38, r * 0.5, r * 0.09);
  g.fillCircle(r * 0.5, -r * 0.18, r * 0.07);

  // Tiny royal scepter held to the side — green stick + gold knob.
  g.lineStyle(r * 0.06, 0xb8902f, 1);
  g.lineBetween(r * 0.74, r * 0.55, r * 0.98, -r * 0.3);
  g.fillStyle(0xeed25a, 1); g.fillCircle(r * 1.0, -r * 0.4, r * 0.14);
  g.fillStyle(0xfffade, 0.9); g.fillCircle(r * 0.96, -r * 0.44, r * 0.06);

  // Smug royal face — two eyes with highlights + a confident smirk.
  bossEyes(g, r, 0x2f4d16);
  // Half-lidded brows for the smug look.
  g.lineStyle(r * 0.03, 0x3a5a1c, 0.9);
  g.lineBetween(-r * 0.46, -r * 0.36, -r * 0.18, -r * 0.3);
  g.lineBetween(r * 0.46, -r * 0.36, r * 0.18, -r * 0.3);
  // Confident smirk — an off-center arc.
  g.lineStyle(r * 0.04, 0x2f4d16, 1);
  g.beginPath();
  g.arc(r * 0.04, r * 0.04, r * 0.3, 0.05 * Math.PI, 0.78 * Math.PI, false);
  g.strokePath();
  // A little rosy cheek blush for the comedic touch.
  g.fillStyle(0xc8e89a, 0.5);
  g.fillEllipse(-r * 0.42, r * 0.12, r * 0.18, r * 0.1);
  g.fillEllipse(r * 0.42, r * 0.12, r * 0.18, r * 0.1);

  // Gold porcelain crown perched on top — rounded merlons (toilet-bowl-meets-crown).
  const crownY = -r * 0.92;
  const crownW = r * 1.3;
  // Crown band.
  g.fillStyle(0xb8902f, 1);
  g.fillRoundedRect(-crownW / 2, crownY - r * 0.14, crownW, r * 0.26, r * 0.08);
  g.fillStyle(0xeed25a, 1);
  g.fillRoundedRect(-crownW / 2, crownY - r * 0.14, crownW, r * 0.16, r * 0.08);
  // Rounded merlons sitting on the band — porcelain bumps with gold rims.
  const merlons = 5;
  for (let i = 0; i < merlons; i++) {
    const mx = -crownW / 2 + (i + 0.5) * (crownW / merlons);
    const big = i === Math.floor(merlons / 2);
    const mr = big ? r * 0.2 : r * 0.15;
    g.fillStyle(0xeed25a, 1);
    g.fillCircle(mx, crownY - r * 0.14, mr);
    g.fillStyle(0xfffade, 1);
    g.fillCircle(mx, crownY - r * 0.16, mr * 0.66);
    // Tiny gold pip on each merlon.
    g.fillStyle(0xb8902f, 1);
    g.fillCircle(mx, crownY - r * 0.14 - mr * 0.5, mr * 0.22);
  }
  // Crown rim light + band glints.
  g.fillStyle(0xfffade, 0.9);
  g.fillRoundedRect(-crownW / 2 + r * 0.04, crownY - r * 0.12, crownW * 0.4, r * 0.05, r * 0.025);

  // Capsule outline last so it reads cleanly against any backdrop.
  g.lineStyle(5, 0x3a5a1c, 0.95);
  g.strokeRoundedRect(-r * 0.72, -r * 0.84, r * 1.44, r * 1.68, r * 0.72);
};

function drawDefaultBoss(g, accent, r) {
  // Fallback boss shape
  bossShadow(g, r);
  const path = polygonPath(r, 11, 0.88, 1.04);
  const bodyColor = darken(accent, 0.50);
  g.fillStyle(bodyColor, 1);
  fillPath(g, path);
  g.fillStyle(accent, 0.45);
  fillPath(g, path.map(p => ({ x: p.x * 0.85, y: p.y * 0.85 - 22 })));
  bossEyes(g, r);
  outlinePath(g, path, 0x07071a, 0.95, 5);
}

// =========================================================================
// HELPERS
// =========================================================================

function polygonPath(r, sides, minMul, maxMul) {
  const path = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const m = Phaser.Math.FloatBetween(minMul, maxMul);
    path.push({ x: Math.cos(a) * r * m, y: Math.sin(a) * r * m });
  }
  return path;
}

function fillPath(g, path) {
  g.beginPath();
  g.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) g.lineTo(path[i].x, path[i].y);
  g.closePath();
  g.fillPath();
}

function outlinePath(g, path, color, alpha, width) {
  g.lineStyle(width, color, alpha);
  g.beginPath();
  g.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) g.lineTo(path[i].x, path[i].y);
  g.closePath();
  g.strokePath();
}

function outline(g, r, color, alpha, width) {
  g.lineStyle(width, color, alpha);
  g.strokeCircle(0, 0, r);
}

function drawShadow(g, r, dx, dy) {
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(dx, r + dy, r * 1.6, r * 0.32);
}
