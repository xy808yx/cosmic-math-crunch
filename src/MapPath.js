// S-curve paths connecting the visible worlds on the 1080×1920 canvas.
// Chapter 1 ("Outer Space") has 11 nodes; Chapter 2 ("Inner Space") and
// Chapter 3 ("Home Ground") have 8 each.
//
// Returns a Phaser.Curves.Path the ship can follow, and the precomputed
// node anchor positions {x, y} for each world. Every entry point takes a
// `chapter` (default 1) and selects the matching hand-tuned point set.

import Phaser from 'phaser';

const POSITIONS_CH1 = [
  // 11 hand-tuned points to feel like a meandering S-curve.
  { x: 240,  y: 1500 },  // 1 — bottom-left
  { x: 540,  y: 1430 },  // 2
  { x: 820,  y: 1340 },  // 3
  { x: 880,  y: 1180 },  // 4
  { x: 700,  y: 1060 },  // 5
  { x: 420,  y: 980  },  // 6
  { x: 220,  y: 870  },  // 7
  { x: 360,  y: 720  },  // 8
  { x: 660,  y: 660  },  // 9
  { x: 880,  y: 540  },  // 10
  { x: 540,  y: 360  }   // 11 — top-center
];

const POSITIONS_CH2 = [
  // 8 hand-tuned points — a tighter S as the nanocraft shrinks inward.
  { x: 240,  y: 1480 },  // 21 — bottom-left (Bloodstream)
  { x: 560,  y: 1360 },  // 22 (Cell City)
  { x: 840,  y: 1220 },  // 23 (Nucleus Vault)
  { x: 660,  y: 1040 },  // 24 (Neuron Forest)
  { x: 320,  y: 900  },  // 25 (Marrow Caverns)
  { x: 560,  y: 720  },  // 26 (Immune Front)
  { x: 860,  y: 560  },  // 27 (Mitochondria Core)
  { x: 540,  y: 380  }   // 28 — top-center (The Singularity Cell)
];

const POSITIONS_CH3 = [
  // 8 hand-tuned points that read as one Saturday out. A near-flat sweep east
  // along the bottom for the morning stops, a switchback west for the
  // afternoon, a second run east to the water for the evening, then the
  // longest leg of all, straight up to the peak at the top of the map for the
  // ride at dusk. Rules this layout keeps: every x stays between 240 and 860 so
  // the 28px labels never clip (about 440px of room at x 860, 480px at x 240);
  // the lowest node stays at y 1480 because the Tune-Up pill band in
  // WorldMapScene is derived from it; and every neighbouring pair is at least
  // as far apart as the Chapter 2 curve kept them.
  { x: 240,  y: 1480 },  // 31 The Grocery Store: bottom-left, 9 in the morning
  { x: 585,  y: 1460 },  // 32 The Big Garden: east along the bottom, late morning
  { x: 860,  y: 1300 },  // 33 The Mall: the east edge, midday rain
  { x: 620,  y: 1120 },  // 34 The Beach: cut back west and up, mid-afternoon
  { x: 260,  y: 960  },  // 35 The Big Store: the west edge, 5 in the afternoon (a step up so the return gate clears its label)
  { x: 540,  y: 830  },  // 36 The Bread Place: back to the centre, 6 in the evening
  { x: 860,  y: 680  },  // 37 The Seawall: the east edge again, golden hour by the water
  { x: 560,  y: 380  }   // 38 The Mountain: top of the map at dusk, the ride up
];

function positionsFor(chapter) {
  if (chapter === 3) return POSITIONS_CH3;
  return chapter === 2 ? POSITIONS_CH2 : POSITIONS_CH1;
}

export function getNodePositions(chapter = 1) {
  return positionsFor(chapter).map(p => ({ ...p }));
}

// Build a Phaser Path that smoothly threads all node positions, suitable for
// `this.tweens.add({ targets: ship, ...path.getPoint(t) })` style traversal.
export function buildMapPath(chapter = 1) {
  const positions = positionsFor(chapter);
  const start = positions[0];
  const path = new Phaser.Curves.Path(start.x, start.y);
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1];
    const curr = positions[i];
    const cx1 = prev.x + (curr.x - prev.x) * 0.3 + (i % 2 === 0 ? 80 : -80);
    const cy1 = prev.y + (curr.y - prev.y) * 0.3;
    const cx2 = prev.x + (curr.x - prev.x) * 0.7 + (i % 2 === 0 ? -80 : 80);
    const cy2 = prev.y + (curr.y - prev.y) * 0.7;
    path.cubicBezierTo(curr.x, curr.y, cx1, cy1, cx2, cy2);
  }
  return path;
}

// Render the path onto a Graphics object as a dashed line, only visible
// up to the player's current furthest-unlocked world. Returns the Graphics.
export function drawPath(scene, path, visibleSegmentCount, accentColor = 0x4ecdc4, chapter = 1) {
  const g = scene.add.graphics();
  if (visibleSegmentCount <= 0) return g;

  const nodeCount = positionsFor(chapter).length;
  const totalPoints = 240;
  const visibleCutoff = Math.min(1, visibleSegmentCount / Math.max(1, nodeCount - 1));
  const samples = path.getPoints(totalPoints);
  const limit = Math.floor(samples.length * visibleCutoff);

  g.lineStyle(8, 0x121225, 0.85);
  for (let i = 1; i < limit; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    g.lineBetween(a.x, a.y, b.x, b.y);
  }
  g.lineStyle(4, accentColor, 0.85);
  for (let i = 1; i < limit; i += 2) {
    const a = samples[i - 1];
    const b = samples[i];
    g.lineBetween(a.x, a.y, b.x, b.y);
  }

  for (let i = 0; i < limit; i += 14) {
    const p = samples[i];
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(p.x, p.y, 2);
  }

  return g;
}

// Returns the param t along the path for a given node index (0-based).
export function tForNodeIndex(idx, chapter = 1) {
  const total = positionsFor(chapter).length - 1;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, idx / total));
}

// Off-S-curve positions for the two hidden worlds. Placed in the empty pockets
// of the map so each reads as a distinct "side branch" off its host world.
export const HIDDEN_NODE_POSITIONS = {
  15: { x: 970, y: 880 },  // Glitch — branches up-right from W5 (700, 1060)
  16: { x: 465, y: 548 },  // Garage — short branch up-left from its host Galactic
                           // Core (660, 658), tucked in the open pocket below the
                           // Universe's End label and above the Supernova→Core
                           // path edge. Sits right beside its host instead of
                           // being tethered diagonally across the whole map.
  // --- Chapter 2 secrets (positions are on the CH2 map) ---
  17: { x: 880, y: 790 },  // The Royal Flush (King Coli) — branches up-right from
                           // its host Neuron Forest (660, 1040) into the open
                           // pocket under Mitochondria Core (860, 560).
  18: { x: 230, y: 700 },  // Recess — branches up-left of its host Immune Front
                           // (560, 720), into the open left pocket below Marrow Caverns.
  // --- Chapter 3 secrets (positions are on the CH3 map) ---
  20: { x: 948, y: 920 },  // The Night Shift: branches down-right of its host
                           // The Seawall (860, 680), into the open right pocket
                           // between the seawall and The Mall (860, 1300). Its
                           // 24px label lands at y 1004, clear of the seawall
                           // label (y 770) above it and of The Beach node
                           // (620, 1120) to its left. Kept in from the canvas
                           // edge because the name is long: at x 975 the label
                           // once ran 2px off screen. The label clamp in
                           // WorldMapScene is the real guard; this keeps the
                           // label naturally centred under its node.
  19: { x: 240, y: 720 }   // Hot Pot Time: branches up-left of its host The Bread
                           // Place (540, 830), into the open left pocket above
                           // The Big Store (260, 1000). Its label (y 804) clears
                           // the big-store node top (about y 910) and never meets
                           // the bread place label (y 920, x 410 to 670).
};

// Host world id each hidden world is connected to. Used to draw the dashed
// branch connector from host → hidden. NB: the index is into the host world's
// CHAPTER position array: Ch1 hidden worlds index POSITIONS_CH1, Ch2 ones
// POSITIONS_CH2, Ch3 ones POSITIONS_CH3 (resolved via the active map's
// nodePositions).
export const HIDDEN_HOST_INDEX = {
  15: 4,  // W5  (CH1 index 4)
  16: 8,  // W9  (CH1 index 8)
  17: 3,  // W24 Neuron Forest (CH2 index 3)
  18: 5,  // W26 Immune Front  (CH2 index 5)
  19: 5,  // W36 The Bread Place (CH3 index 5)
  20: 6   // W37 The Seawall     (CH3 index 6)
};

// Control point for the quadratic-Bezier arc that connects a host world to a
// hidden world. Used by both the visible dashed branch and the ship-travel
// tween so they trace the exact same curve.
export function hiddenBranchControlPoint(host, dest, arc = 40) {
  const mx = (host.x + dest.x) / 2;
  const my = (host.y + dest.y) / 2;
  const dx = dest.x - host.x;
  const dy = dest.y - host.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: mx + (-dy / len) * arc, y: my + (dx / len) * arc };
}

export function sampleHiddenBranch(host, dest, t, control) {
  const c = control || hiddenBranchControlPoint(host, dest);
  const u = 1 - t;
  return {
    x: u * u * host.x + 2 * u * t * c.x + t * t * dest.x,
    y: u * u * host.y + 2 * u * t * c.y + t * t * dest.y
  };
}
