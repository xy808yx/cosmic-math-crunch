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

  // Layout chunks in a deterministic Phi-spiral within the radius.
  const phi = 2.39996;
  for (let i = 0; i < chunkCount; i++) {
    const t = (i + 1) / chunkCount;
    const dist = r * (0.18 + 0.72 * Math.sqrt(t));
    const a = i * phi + seed * 0.7;
    const cx = Math.cos(a) * dist;
    const cy = Math.sin(a) * dist;
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

// 11 — Void rune tile: dark with glowing cream edges
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
  // Rune mark — interlocked triangles
  g.lineStyle(4, 0xfff3b8, 1);
  g.beginPath();
  g.moveTo(0, -r * 0.5);
  g.lineTo(r * 0.45, r * 0.3);
  g.lineTo(-r * 0.45, r * 0.3);
  g.closePath();
  g.strokePath();
  g.beginPath();
  g.moveTo(0, r * 0.5);
  g.lineTo(r * 0.45, -r * 0.3);
  g.lineTo(-r * 0.45, -r * 0.3);
  g.closePath();
  g.strokePath();
  // Center star
  g.fillStyle(0xffffff, 1);
  g.fillCircle(0, 0, r * 0.10);
  // Edge outline
  g.lineStyle(3, 0xfff3b8, 0.85);
  g.strokeRoundedRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7, 10);
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
