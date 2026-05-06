// Pixel-art ship renderer. All cosmetic layers (hull / wings / paint / decal)
// are visible in every context the ship appears (world map, cockpit, gameplay).
// Returns a container, like drawCompanion, so callers can position/scale/tween it.

import { SHIP_PARTS } from './ShipManager.js';

function partById(id) {
  return SHIP_PARTS.find(p => p.id === id) || null;
}

// Pixel grids -----------------------------------------------------------------
// Legend:
//   '.' transparent
//   'X' hull outline → 0x07071a
//   'B' body fill   → paint.color
//   'H' body highlight → lighten(paint.color, .3)
//   'L' body lowlight  → darken(paint.color, .25)
//   'C' cockpit canopy → cyan teal
//   'c' canopy highlight → white
//   'W' wing fill   → wings.color
//   'w' wing highlight → lighten(wings.color, .3)
//   'D' decal fill  → decal.color
//   'F' booster flame outer → orange
//   'f' booster flame inner → yellow

// Standard hull (default) — teardrop chassis. 14 wide × 18 tall.
const HULL_STANDARD = [
  '......XXX.....',
  '.....XHHX.....',
  '.....XHBX.....',
  '....XHBBBX....',
  '....XBCCBX....',
  '...XHBcCCBX...',
  '...XBCCCCBX...',
  '...XBCCCCBX...',
  '..XHBBBBBBBX..',
  '..XBBBBBBBBX..',
  '..XBBBDBBBBX..',
  '..XBLBBBLLBX..',
  '..XLLBBBLLLX..',
  '...XLLBBLLX...',
  '....XLLLLX....',
  '.....X..X.....',
  '.....FfffF....',
  '......FfF.....'
];

// Bubble hull (hull_round) — almost spherical, taller cockpit, chunkier base.
const HULL_ROUND = [
  '......XXX.....',
  '....XHHHHX....',
  '...XHBBBBBX...',
  '..XHBCCCCBX...',
  '..XBCCcCCBX...',
  '.XHBCCCCCCBX..',
  '.XBCCCCCCCCX..',
  '.XBBCCCCCCBX..',
  'XHBBBBBBBBBBX.',
  'XBBBBBDBBBBBX.',
  'XBBBBBBBBBBBX.',
  'XBLBBBBBBBLBX.',
  'XLLBBBBBBBLLX.',
  '.XLLLBBBBLLLX.',
  '..XLLLBBLLLX..',
  '...XLLLLLLX...',
  '....XLLLLX....',
  '.....FfffF....'
];

// Stub wings (default) — short rectangular wings on either side. Drawn as a
// strip overlay onto whichever hull is in use. 22 wide × 6 tall (wing band).
const WINGS_STUB = [
  '..wWW....WWw..',
  'wWWWW....WWWWw',
  'XWWWW....WWWWX',
  'XWWWX....XWWWX',
  '.XXX......XXX.',
  '..............'
];

// Swept wings — angled, longer, more aggressive shape.
const WINGS_SWEPT = [
  '..............',
  '.wW..........Ww',
  'wWWW........WWWw',
  'XWWWW......WWWWX',
  '.XWWWX....XWWWX.',
  '..XXX......XXX..'
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

function darken(color, amount) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const k = 1 - amount;
  return ((Math.max(0, Math.round(r * k)) << 16) |
          (Math.max(0, Math.round(g * k)) << 8) |
           Math.max(0, Math.round(b * k)));
}

function lighten(color, amount) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return ((Math.min(255, Math.round(r + (255 - r) * amount)) << 16) |
          (Math.min(255, Math.round(g + (255 - g) * amount)) << 8) |
           Math.min(255, Math.round(b + (255 - b) * amount)));
}

export function drawShip(scene, x, y, opts = {}) {
  const scale = opts.scale ?? 1;
  const parts = opts.parts || {
    hull: 'hull_default',
    wings: 'wings_default',
    paint: 'paint_default',
    decal: null
  };

  const container = scene.add.container(x, y);

  const paint = partById(parts.paint);
  const hull = partById(parts.hull);
  const wings = partById(parts.wings);
  const decal = partById(parts.decal);

  const paintColor = paint?.color ?? 0xb6c2cf;
  const wingColor = wings?.color ?? 0x8b9bb4;
  const decalColor = decal?.color ?? 0xf7dc6f;

  const pixelSize = 4 * scale;

  // Pick hull grid
  const hullGrid = parts.hull === 'hull_round' ? HULL_ROUND : HULL_STANDARD;
  const hullW = hullGrid[0].length * pixelSize;
  const hullH = hullGrid.length * pixelSize;

  // Drop shadow under the ship
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.30);
  shadow.fillEllipse(0, hullH / 2 + 6 * scale, hullW * 0.8, 8 * scale);
  container.add(shadow);

  // Booster glow halo (always-on ambient)
  const glow = scene.add.graphics();
  glow.fillStyle(0xff8b3d, 0.45);
  glow.fillEllipse(0, hullH / 2 - 4 * scale, hullW * 0.30, 14 * scale);
  glow.fillStyle(0xffd86b, 0.7);
  glow.fillEllipse(0, hullH / 2 - 4 * scale, hullW * 0.18, 8 * scale);
  container.add(glow);
  scene.tweens.add({
    targets: glow,
    alpha: 0.85,
    scaleX: 1.10,
    scaleY: 1.10,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // Wings — drawn behind the hull so the body sits on top.
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

  // Hull (body)
  const hullOx = -hullW / 2;
  const hullOy = -hullH / 2;
  const hullG = pixelGrid(scene, hullGrid, hullOx, hullOy, pixelSize, ch => {
    if (ch === 'X') return 0x07071a;
    if (ch === 'B') return paintColor;
    if (ch === 'H') return lighten(paintColor, 0.32);
    if (ch === 'L') return darken(paintColor, 0.28);
    if (ch === 'C') return 0x4ecdc4;
    if (ch === 'c') return 0xffffff;
    if (ch === 'D') return decal ? decalColor : paintColor;  // decal pixel = paint when no decal
    if (ch === 'F') return 0xff8b3d;
    if (ch === 'f') return 0xffd86b;
    return null;
  });
  container.add(hullG);

  return container;
}
