// Pixel-art ship renderer. All cosmetic layers (hull / wings / paint / decal /
// pattern / trail) are visible in every context the ship appears.
// drawShip(scene, x, y, opts) returns a container with:
//   container.portholeMask   — Graphics mask used to clip the pet to the porthole
//   container.portholeCenter — { x, y } in container space (use for pet placement)
//   container.portholeRadius — number (in container space)
//   container.engineEmitX/Y  — where engine particles emit from (in container space)

import { SHIP_PARTS } from './ShipManager.js';
import { darken, lighten } from './colorUtils.js';

function partById(id) {
  return SHIP_PARTS.find(p => p.id === id) || null;
}

// HULL grid -------------------------------------------------------------------
// Larger 16×20 chassis with a clear cockpit area for the porthole.
const HULL_STANDARD = [
  '......XXXX......',
  '.....XHHBBX.....',
  '....XHBBBBBX....',
  '...XHBBBBBBBX...',
  '...XBBBPPBBBX...',
  '..XHBBPPPPBBX...',
  '..XBBBPPPPBBX...',
  '..XBBBPPPPBBX...',
  '..XBBBBBBBBBX...',
  '.XHBBBBBBBBBBX..',
  '.XBBBBBDBBBBBX..',
  '.XBBBBBBBBBBBX..',
  '.XBLBBBBBBBLBX..',
  '.XLLBBBBBBBLLX..',
  '..XLLLBBBBLLLX..',
  '...XLLLLLLLLX...',
  '....XLLLLLLX....',
  '.....X....X.....',
  '.....FfffF......',
  '......FfF.......'
];

const HULL_ROUND = [
  '.....XXXXXX.....',
  '....XHHHHHHX....',
  '...XHBBBBBBBX...',
  '..XHBBBPPBBBX...',
  '..XBBBPPPPBBX...',
  '.XHBBPPPPPPBX...',
  '.XBBBPPPPPPBX...',
  '.XBBBPPPPPPBX...',
  'XHBBBBBBBBBBBX..',
  'XBBBBBBBBBBBBX..',
  'XBBBBBDBBBBBBX..',
  'XBBBBBBBBBBBBX..',
  'XBBBBBBBBBBBBX..',
  'XBLBBBBBBBBBLX..',
  '.XLLBBBBBBBLLX..',
  '.XLLLLBBBLLLLX..',
  '..XLLLLLLLLLX...',
  '...XLLLLLLLX....',
  '....X......X....',
  '.....FfffF......'
];

// WING strip overlays --------------------------------------------------------
const WINGS_STUB = [
  '..wWW......WWw..',
  'wWWWW......WWWWw',
  'XWWWW......WWWWX',
  'XWWWX......XWWWX',
  '.XXX........XXX.',
  '................'
];

const WINGS_SWEPT = [
  '................',
  '..wW..........Ww..',
  'wWWW..........WWWw',
  'XWWWW........WWWWX',
  '.XWWWX......XWWWX.',
  '..XXX........XXX..'
];

function pixelGrid(scene, grid, ox, oy, pixelSize, paletteFn) {
  const g = scene.add.graphics();
  for (let row = 0; row < grid.length; row++) {
    const line = grid[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (!ch || ch === '.' || ch === ' ') continue;
      const color = paletteFn(ch);
      if (color === null) continue;
      g.fillStyle(color, 1);
      g.fillRect(ox + col * pixelSize, oy + row * pixelSize, pixelSize + 0.5, pixelSize + 0.5);
    }
  }
  return g;
}

export function drawShip(scene, x, y, opts = {}) {
  const scale = opts.scale ?? 1;
  const showTrail = opts.showTrail !== false;
  const parts = opts.parts || {
    hull: 'hull_default',
    wings: 'wings_default',
    paint: 'paint_default',
    decal: null,
    pattern: 'pattern_none',
    trail: 'trail_default_flame'
  };

  const container = scene.add.container(x, y);

  const paint = partById(parts.paint);
  const hull = partById(parts.hull);
  const wings = partById(parts.wings);
  const decal = partById(parts.decal);
  const pattern = partById(parts.pattern);
  const trail = partById(parts.trail) || partById('trail_default_flame');

  const paintColor = paint?.color ?? 0xb6c2cf;
  const wingColor = wings?.color ?? 0x8b9bb4;
  const decalColor = decal?.color ?? 0xf7dc6f;

  const pixelSize = 5 * scale;

  // Pick hull grid
  const hullGrid = parts.hull === 'hull_round' ? HULL_ROUND : HULL_STANDARD;
  const hullW = hullGrid[0].length * pixelSize;
  const hullH = hullGrid.length * pixelSize;

  // Drop shadow
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.30);
  shadow.fillEllipse(0, hullH / 2 + 6 * scale, hullW * 0.85, 10 * scale);
  container.add(shadow);

  // Engine trail (drawn behind hull) -------------------------------------
  const engineEmitX = 0;
  const engineEmitY = hullH / 2 - 4 * scale;
  if (showTrail) {
    drawEngineTrail(scene, container, trail.id, engineEmitX, engineEmitY, scale);
  }
  container.engineEmitX = engineEmitX;
  container.engineEmitY = engineEmitY;
  container.trailId = trail.id;

  // Wings (behind hull) --------------------------------------------------
  const wingsGrid = parts.wings === 'wings_swept' ? WINGS_SWEPT : WINGS_STUB;
  const wingsW = wingsGrid[0].length * pixelSize;
  const wingsH = wingsGrid.length * pixelSize;
  const wingsOx = -wingsW / 2;
  const wingsOy = -wingsH / 2 + (hullH * 0.10);
  const wingsG = pixelGrid(scene, wingsGrid, wingsOx, wingsOy, pixelSize, ch => {
    if (ch === 'X') return 0x07071a;
    if (ch === 'W') return wingColor;
    if (ch === 'w') return lighten(wingColor, 0.30);
    return null;
  });
  container.add(wingsG);

  // Hull (body) — `P` cells mark the porthole cutout (we render canopy color
  // here for the area; the pet renders on top of that, masked to the hole).
  const hullOx = -hullW / 2;
  const hullOy = -hullH / 2;
  const hullG = pixelGrid(scene, hullGrid, hullOx, hullOy, pixelSize, ch => {
    if (ch === 'X') return 0x07071a;
    if (ch === 'B') return paintColor;
    if (ch === 'H') return lighten(paintColor, 0.32);
    if (ch === 'L') return darken(paintColor, 0.28);
    if (ch === 'P') return 0x0a0a1a;     // porthole interior (pet sits on top)
    if (ch === 'D') return decal ? decalColor : paintColor;
    if (ch === 'F') return 0xff8b3d;
    if (ch === 'f') return 0xffd86b;
    return null;
  });
  container.add(hullG);

  // Compute porthole geometry from the 'P' cells.
  let pMinX = Infinity, pMaxX = -Infinity, pMinY = Infinity, pMaxY = -Infinity;
  for (let row = 0; row < hullGrid.length; row++) {
    for (let col = 0; col < hullGrid[row].length; col++) {
      if (hullGrid[row][col] === 'P') {
        pMinX = Math.min(pMinX, col);
        pMaxX = Math.max(pMaxX, col);
        pMinY = Math.min(pMinY, row);
        pMaxY = Math.max(pMaxY, row);
      }
    }
  }
  if (pMinX === Infinity) {
    container.portholeCenter = { x: 0, y: -hullH * 0.18 };
    container.portholeRadius = hullW * 0.16;
  } else {
    const cx = hullOx + ((pMinX + pMaxX + 1) / 2) * pixelSize;
    const cy = hullOy + ((pMinY + pMaxY + 1) / 2) * pixelSize;
    const radius = ((pMaxX - pMinX + 1) / 2) * pixelSize;
    container.portholeCenter = { x: cx, y: cy };
    container.portholeRadius = radius;
  }

  // Glassy ring around the porthole
  const ring = scene.add.graphics();
  ring.lineStyle(Math.max(2, 3 * scale), 0x4ecdc4, 0.85);
  ring.strokeCircle(container.portholeCenter.x, container.portholeCenter.y, container.portholeRadius);
  ring.fillStyle(0xffffff, 0.25);
  ring.fillEllipse(
    container.portholeCenter.x - container.portholeRadius * 0.35,
    container.portholeCenter.y - container.portholeRadius * 0.45,
    container.portholeRadius * 0.55,
    container.portholeRadius * 0.30
  );
  container.add(ring);
  container.portholeRing = ring;

  // Pattern overlay drawn on top of the hull
  if (pattern && pattern.id !== 'pattern_none') {
    drawPatternOverlay(scene, container, pattern, hullW, hullH, pixelSize);
  }

  return container;
}

// Engine trails --------------------------------------------------------------

function drawEngineTrail(scene, container, trailId, x, y, scale) {
  const baseY = y;
  if (trailId === 'trail_rainbow') {
    const colors = [0xff5b6e, 0xff8b3d, 0xffd86b, 0x58d68d, 0x4ecdc4, 0xc77eff];
    const stripes = scene.add.container(x, baseY);
    container.add(stripes);
    for (let i = 0; i < colors.length; i++) {
      const stripe = scene.add.graphics();
      stripe.fillStyle(colors[i], 0.6);
      stripe.fillEllipse(0, 0, 14 * scale, 6 * scale);
      stripe.y = i * 4 * scale;
      stripes.add(stripe);
      scene.tweens.add({
        targets: stripe,
        scaleX: { from: 0.7, to: 1.2 },
        alpha: { from: 0.3, to: 0.8 },
        duration: 500 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
    return;
  }

  if (trailId === 'trail_comet') {
    for (let i = 0; i < 12; i++) {
      const sparkle = scene.add.graphics();
      sparkle.fillStyle(0xffffff, 0.8);
      sparkle.fillCircle(0, 0, (1 + Math.random() * 2) * scale);
      sparkle.x = x + (Math.random() - 0.5) * 14 * scale;
      sparkle.y = baseY + Math.random() * 24 * scale;
      container.add(sparkle);
      scene.tweens.add({
        targets: sparkle,
        y: sparkle.y + 30 * scale,
        alpha: { from: 1, to: 0 },
        duration: 600 + Math.random() * 400,
        repeat: -1,
        ease: 'Quad.easeOut'
      });
    }
    return;
  }

  if (trailId === 'trail_galaxy') {
    for (let i = 0; i < 14; i++) {
      const dust = scene.add.graphics();
      const c = i % 3 === 0 ? 0xffffff : (i % 2 === 0 ? 0x9d6bff : 0x4ecdc4);
      dust.fillStyle(c, 0.85);
      dust.fillCircle(0, 0, (1 + Math.random() * 2) * scale);
      dust.x = x + (Math.random() - 0.5) * 16 * scale;
      dust.y = baseY + Math.random() * 28 * scale;
      container.add(dust);
      scene.tweens.add({
        targets: dust,
        y: dust.y + 40 * scale,
        alpha: { from: 1, to: 0 },
        duration: 900 + Math.random() * 500,
        repeat: -1,
        ease: 'Quad.easeOut'
      });
    }
    return;
  }

  // Default flame + fire swirl
  const outerColor = trailId === 'trail_fire_swirl' ? 0xff5b3d : 0xff8b3d;
  const innerColor = trailId === 'trail_fire_swirl' ? 0xffd86b : 0xffd86b;
  const glow = scene.add.graphics();
  glow.fillStyle(outerColor, 0.55);
  glow.fillEllipse(x, baseY, 18 * scale, 22 * scale);
  glow.fillStyle(innerColor, 0.85);
  glow.fillEllipse(x, baseY - 2 * scale, 10 * scale, 14 * scale);
  container.add(glow);
  scene.tweens.add({
    targets: glow,
    scaleX: { from: 0.85, to: 1.15 },
    scaleY: { from: 0.9, to: 1.2 },
    alpha: { from: 0.7, to: 1 },
    duration: trailId === 'trail_fire_swirl' ? 320 : 600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  if (trailId === 'trail_fire_swirl') {
    // Add a swirling flicker layer
    const swirl = scene.add.graphics();
    swirl.fillStyle(0xff8b3d, 0.45);
    swirl.fillCircle(x - 4 * scale, baseY + 4 * scale, 4 * scale);
    swirl.fillCircle(x + 4 * scale, baseY + 6 * scale, 3 * scale);
    container.add(swirl);
    scene.tweens.add({
      targets: swirl,
      angle: 360,
      duration: 700,
      repeat: -1,
      ease: 'Linear'
    });
  }
}

// Patterns ------------------------------------------------------------------

function drawPatternOverlay(scene, container, pattern, hullW, hullH, pixelSize) {
  const g = scene.add.graphics();
  if (pattern.id === 'pattern_stripes') {
    g.lineStyle(pixelSize * 0.8, pattern.color2 ?? 0x07071a, 0.85);
    g.lineBetween(-hullW * 0.30, hullH * 0.40, hullW * 0.20, -hullH * 0.20);
    g.lineStyle(pixelSize * 0.8, pattern.color, 0.85);
    g.lineBetween(-hullW * 0.18, hullH * 0.45, hullW * 0.32, -hullH * 0.15);
  } else if (pattern.id === 'pattern_stars') {
    const starColor = pattern.color || 0xffd86b;
    const stars = [
      [-hullW * 0.20, hullH * 0.05],
      [hullW * 0.20, hullH * 0.10],
      [-hullW * 0.10, hullH * 0.30],
      [hullW * 0.10, hullH * 0.30],
      [0, hullH * 0.40]
    ];
    for (const [sx, sy] of stars) {
      g.fillStyle(starColor, 1);
      drawStarShape(g, sx, sy, 5, pixelSize * 1.4, pixelSize * 0.6);
    }
  } else if (pattern.id === 'pattern_galaxy_swirl') {
    g.fillStyle(pattern.color || 0xc77eff, 0.4);
    g.fillEllipse(-hullW * 0.10, hullH * 0.20, hullW * 0.6, hullH * 0.4);
    g.fillStyle(pattern.color2 || 0x4ecdc4, 0.4);
    g.fillEllipse(hullW * 0.15, hullH * 0.10, hullW * 0.5, hullH * 0.4);
    g.fillStyle(0xffffff, 0.6);
    for (let i = 0; i < 5; i++) {
      g.fillCircle((Math.random() - 0.5) * hullW * 0.6, (Math.random() - 0.5) * hullH * 0.4, pixelSize * 0.5);
    }
  }
  container.add(g);
}

function drawStarShape(g, cx, cy, points, outerR, innerR) {
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fillPath();
}
