// S-curve path connecting the 11 worlds on the home map.
// Coordinates are in the 1080×1920 canvas, with the path occupying the
// region y ≈ 280..1620 (below the header band, above the footer band).
//
// Returns a Phaser.Curves.Path that the ship can follow, and the precomputed
// node anchor positions {x, y} for each world.

import Phaser from 'phaser';

const NODE_POSITIONS = [
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

export function getNodePositions() {
  return NODE_POSITIONS.map(p => ({ ...p }));
}

// Build a Phaser Path that smoothly threads all node positions, suitable for
// `this.tweens.add({ targets: ship, ...path.getPoint(t) })` style traversal.
export function buildMapPath() {
  const start = NODE_POSITIONS[0];
  const path = new Phaser.Curves.Path(start.x, start.y);
  for (let i = 1; i < NODE_POSITIONS.length; i++) {
    const prev = NODE_POSITIONS[i - 1];
    const curr = NODE_POSITIONS[i];
    // Smooth bezier per segment — control points biased to make the curve weave.
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
export function drawPath(scene, path, visibleSegmentCount, accentColor = 0x4ecdc4) {
  const g = scene.add.graphics();
  if (visibleSegmentCount <= 0) return g;

  // We approximate the path with sampled points and draw dashes.
  const totalPoints = 240;
  const visibleCutoff = Math.min(1, visibleSegmentCount / (NODE_POSITIONS.length - 1));
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

  // Sparkle dots along the visible portion
  for (let i = 0; i < limit; i += 14) {
    const p = samples[i];
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(p.x, p.y, 2);
  }

  return g;
}

// Returns the param t along the path for a given node index (0-based).
export function tForNodeIndex(idx) {
  const total = NODE_POSITIONS.length - 1;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, idx / total));
}
