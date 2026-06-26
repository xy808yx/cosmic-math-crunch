// Mastery Wall — the Chapter 3 "Maker Space" garden.
//
// The runner-up "Grid Gardens" mode contributed exactly one asset to the build:
// a persistent, at-a-glance display of which multiplication facts the kid has
// made AUTOMATIC. Here it's re-themed as a warm 12×12 garden of blooms. It reads
// the SAME per-fact status the parent dashboard grid does (progress.getFactStatus)
// plus the spaced-repetition rust signal (progress.getRustyFacts), so it never
// invents its own pedagogy:
//   • automatic  → a bright open BLOOM (gold)        — fast + accurate
//   • slow       → a green SPROUT (two leaves)       — accurate but not yet fast
//   • inaccurate → a small BUD (amber / red)         — still being learned
//   • unseen     → bare SOIL                          — not planted yet
//   • rusty      → a wilted, dimmed bloom            — automatic but overdue for review
//
// Non-interactive. Plain shapes only (4 cardinal petals — no radial mandala /
// spiral / sunburst), per the project content rule. Returns a Container centred
// on (x, y); the caller positions and depths it.

import { progress } from './GameData.js';
import { style } from './textStyles.js';

const BLOOM  = 0xffd166;  // automatic
const SPROUT = 0x6fbf4a;  // accurate but slow
const BUD    = 0xffb142;  // inaccurate, ≥50%
const WILT   = 0xff6b6b;  // inaccurate, <50%
const SOIL   = 0x2a2238;  // unseen
const PETAL_DIM = 0x8a7a52; // rusty bloom desaturated cast

function factKey(a, b) {
  return `${Math.min(a, b)}x${Math.max(a, b)}`;
}

// Draw one garden tile centred at (cx, cy) inside graphics `g`.
// `kind` ∈ unseen|slow|inaccurate|automatic; `poor` only matters for inaccurate;
// `rusty` only matters for automatic.
function drawTile(g, cx, cy, cell, kind, poor, rusty) {
  const r = cell / 2 - 3;
  // Soil bed.
  g.fillStyle(0x000000, 0.25);
  g.fillRoundedRect(cx - r, cy - r + 3, r * 2, r * 2, 8);
  g.fillStyle(SOIL, 1);
  g.fillRoundedRect(cx - r, cy - r, r * 2, r * 2, 8);

  if (kind === 'unseen') {
    // A single faint seed dot.
    g.fillStyle(0x4a4060, 1);
    g.fillCircle(cx, cy, 3);
    return;
  }

  if (kind === 'slow') {
    // Sprout: two leaves + a stem.
    g.lineStyle(3, 0x3a7a3a, 1);
    g.lineBetween(cx, cy + r * 0.5, cx, cy - r * 0.2);
    g.fillStyle(SPROUT, 1);
    g.fillEllipse(cx - r * 0.32, cy - r * 0.1, r * 0.7, r * 0.4);
    g.fillEllipse(cx + r * 0.32, cy - r * 0.25, r * 0.66, r * 0.38);
    return;
  }

  if (kind === 'inaccurate') {
    // A small closed bud, colour-graded by how far off it is.
    g.fillStyle(0x3a7a3a, 1);
    g.fillRect(cx - 2, cy - 2, 4, r * 0.7);
    g.fillStyle(poor ? WILT : BUD, 1);
    g.fillCircle(cx, cy - r * 0.18, r * 0.42);
    return;
  }

  // automatic → an open bloom (centre + four cardinal petals).
  const petal = rusty ? PETAL_DIM : BLOOM;
  const a = rusty ? 0.5 : 1;
  const pr = r * 0.5;
  g.fillStyle(petal, a);
  g.fillEllipse(cx, cy - pr * 0.9, pr, pr * 1.3);
  g.fillEllipse(cx, cy + pr * 0.9, pr, pr * 1.3);
  g.fillEllipse(cx - pr * 0.9, cy, pr * 1.3, pr);
  g.fillEllipse(cx + pr * 0.9, cy, pr * 1.3, pr);
  g.fillStyle(rusty ? 0x6a5a3a : 0xfff0c2, a);
  g.fillCircle(cx, cy, pr * 0.7);
  if (rusty) {
    // A faint "needs water" mark so a wilted bloom reads as tend-me, not broken.
    g.fillStyle(0x6fc2e0, 0.6);
    g.fillCircle(cx + r * 0.55, cy - r * 0.55, 3);
  }
}

// Per-fact status + an accuracy band flag for inaccurate tiles.
function tileStatus(a, b) {
  const kind = progress.getFactStatus(a, b);
  return { kind, poor: kind === 'inaccurate' && progress.getFactMastery(a, b) < 50 };
}

export function drawMasteryWall(scene, x, y, opts = {}) {
  const cell = opts.cell ?? 46;
  const title = opts.title ?? 'Mastery Garden';
  const accent = opts.accent ?? 0xffd27a;

  const gridW = 12 * cell;
  const padX = 40;
  const headTop = 96;        // title + column numbers
  const legendH = 56;
  const panelW = gridW + padX * 2 + 28;
  const panelH = headTop + gridW + 36 + legendH;

  const cont = scene.add.container(x, y);

  // Panel.
  const bg = scene.add.graphics();
  bg.fillStyle(0x000000, 0.45);
  bg.fillRoundedRect(-panelW / 2 + 4, -panelH / 2 + 6, panelW, panelH, 26);
  bg.fillStyle(0x1d1830, 0.98);
  bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 26);
  bg.lineStyle(3, accent, 0.85);
  bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 26);
  cont.add(bg);

  // Count automatic / rusty for the subtitle.
  const rustyList = progress.getRustyFacts();
  const rustySet = new Set(rustyList.map(f => factKey(f.a, f.b)));
  const stats = progress.getAutomaticityStats();

  cont.add(scene.add.text(0, -panelH / 2 + 34, title, style('display', {
    fontSize: '40px', fill: '#ffe6b0'
  })).setOrigin(0.5));
  const sub = stats.attempted === 0
    ? 'Plant your first bloom — keep playing!'
    : `${stats.automatic} blooms open` + (rustySet.size ? `  ·  ${rustySet.size} need water` : '');
  cont.add(scene.add.text(0, -panelH / 2 + 70, sub, style('caption', {
    fontSize: '22px', fill: '#cfcfe0'
  })).setOrigin(0.5));

  // Grid origin (top-left of the first cell centre row/col).
  const gridLeft = -gridW / 2;
  const gridTop = -panelH / 2 + headTop;

  // Column + row headers.
  for (let i = 1; i <= 12; i++) {
    cont.add(scene.add.text(gridLeft + (i - 0.5) * cell, gridTop - 14, i.toString(), style('caption', {
      fontSize: '15px', fill: '#7a7a90'
    })).setOrigin(0.5));
    cont.add(scene.add.text(gridLeft - 18, gridTop + (i - 0.5) * cell, i.toString(), style('caption', {
      fontSize: '15px', fill: '#7a7a90'
    })).setOrigin(0.5));
  }

  // The garden itself.
  const g = scene.add.graphics();
  for (let row = 1; row <= 12; row++) {
    for (let col = 1; col <= 12; col++) {
      const st = tileStatus(row, col);
      const cx = gridLeft + (col - 0.5) * cell;
      const cy = gridTop + (row - 0.5) * cell;
      const rusty = st.kind === 'automatic' && rustySet.has(factKey(row, col));
      drawTile(g, cx, cy, cell, st.kind, st.poor, rusty);
    }
  }
  cont.add(g);

  // Legend.
  const legendY = gridTop + gridW + 34;
  const items = [[BLOOM, 'Automatic'], [SPROUT, 'Almost'], [BUD, 'Learning'], [PETAL_DIM, 'Needs water']];
  const colW = 150;
  let lx = -((items.length * colW) / 2) + 28;
  const swatches = scene.add.graphics(); // one batched draw for all four swatches
  cont.add(swatches);
  for (const [color, label] of items) {
    swatches.fillStyle(color, 1);
    swatches.fillCircle(lx, legendY, 9);
    cont.add(scene.add.text(lx + 18, legendY, label, style('caption', {
      fontSize: '18px', fill: '#cfcfe0'
    })).setOrigin(0, 0.5));
    lx += colW;
  }

  cont.panelW = panelW;
  cont.panelH = panelH;
  return cont;
}
