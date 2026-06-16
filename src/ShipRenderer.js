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

// Sleek — long and narrow, sharp pointed nose, slim cockpit
const HULL_SLEEK = [
  '.......XX.......',
  '.......XX.......',
  '......XHHX......',
  '......XHBX......',
  '.....XHBBBX.....',
  '.....XBPPPX.....',
  '....XHBPPPBX....',
  '....XBBPPPBX....',
  '....XBBBBBBX....',
  '...XHBBBBBBBX...',
  '...XBBBDBBBBX...',
  '...XBBBBBBBBX...',
  '...XBBBBBBBBX...',
  '...XBLBBBBLBX...',
  '..XHLBBBBBBLLX..',
  '..XLLLLBBLLLLX..',
  '...XLLLLLLLLX...',
  '....XLLLLLLX....',
  '.....X....X.....',
  '......FfF.......'
];

// Bulky — wide squat fortress, armored shoulders, big windscreen
const HULL_BULKY = [
  '....XXXXXXXX....',
  '...XHHHHHHHHX...',
  '..XHBBBBBBBBBX..',
  '.XHBBBPPPPBBBBX.',
  '.XBBBPPPPPPBBBX.',
  '.XBBBPPPPPPBBBX.',
  'XHBBBPPPPPPBBBBX',
  'XBBBBBBBBBBBBBBX',
  'XBBBBBBBBBBBBBBX',
  'XBBBBBBBBBBBBBBX',
  'XBBBBBBDBBBBBBBX',
  'XBLLBBBBBBBBLLBX',
  'XBLLBBBBBBBBLLBX',
  'XBLLBBBBBBBBLLBX',
  '.XLLLLLLLLLLLLX.',
  '.XLLLLLLLLLLLLX.',
  '..XLLLLLLLLLLX..',
  '...XLLLLLLLLX...',
  '....X......X....',
  '.....FfffF......'
];

// Wraith — legendary asymmetric scout with offset cockpit, sleek profile
const HULL_WRAITH = [
  '........XX......',
  '.......XHHX.....',
  '......XHBBX.....',
  '.....XHBBBBX....',
  '....XHBPPPBX....',
  '...XHBPPPPBX....',
  '..XHBBPPPPBX....',
  '.XHBBBPPPBBX....',
  'XHBBBBBBBBBBX...',
  'XBBBBBBBBBBBBX..',
  'XBBBBBBDBBBBBX..',
  'XBBBBBBBBBBBBBX.',
  '.XBLBBBBBBBLBBX.',
  '.XLLBBBBBBBLLBX.',
  '..XLLBBBBBBLLX..',
  '...XLLBBBBLLX...',
  '....XLLLLLLX....',
  '.....XLLLLX.....',
  '.....X....X.....',
  '......FfF.......'
];

// Arrow — narrow forward-pointing fighter with sharp nose
const HULL_ARROW = [
  '.......XX.......',
  '.......XX.......',
  '......XHHX......',
  '......XHHX......',
  '.....XHBBHX.....',
  '.....XBPPBX.....',
  '....XHBPPBHX....',
  '....XBBPPBBX....',
  '...XHBBBBBBHX...',
  '...XBBBBBBBBX...',
  '..XHBBBDBBBBHX..',
  '..XBBBBBBBBBBX..',
  '..XBLBBBBBBLBX..',
  '.XLLBBBBBBBBLLX.',
  '.XLLBBBBBBBBLLX.',
  'XLLLLBBBBBBLLLLX',
  '.XXLLLLLLLLLLXX.',
  '...XXLLLLLLXX...',
  '......X..X......',
  '......FfF.......'
];

// Finned — symmetric mid-size hull with prominent rear tail fins
const HULL_FINNED = [
  '......XXXX......',
  '.....XHHHHX.....',
  '....XHBBBBHX....',
  '...XHBBPPBBHX...',
  '...XBBPPPPBBX...',
  '..XHBBPPPPBBHX..',
  '..XBBBPPPPBBBX..',
  '..XBBBBBBBBBBX..',
  '.XHBBBBBBBBBBHX.',
  '.XBBBBBDBBBBBBX.',
  '.XBBBBBBBBBBBBX.',
  'XHBBBBBBBBBBBBHX',
  'XBLBBBBBBBBBBLBX',
  'XLLBBBBBBBBBBLLX',
  'XLLLLBBBBBBLLLLX',
  '.XLLLLLLLLLLLLX.',
  'X...XLLLLLLXX..X',
  'XX...XLLLLX...XX',
  '.XX..X....X..XX.',
  '......FfffF.....'
];

// Eclipse — legendary orb-shaped hull with halo crown
const HULL_ECLIPSE = [
  '.....XXXXXX.....',
  '....XHHHHHHX....',
  '...XHBBBBBBHX...',
  '..XHBBPPPPBBHX..',
  '..XBBPPPPPPBBX..',
  '.XHBBPPPPPPBBHX.',
  '.XBBBPPPPPPBBBX.',
  'XHBBBBBBBBBBBBHX',
  'XBBBBBBBBBBBBBBX',
  'XBBBBBBDBBBBBBBX',
  'XHBBBBBBBBBBBBHX',
  'XBBBBBBBBBBBBBBX',
  '.XBLBBBBBBBBBLBX',
  '.XLLBBBBBBBBLLX.',
  '..XLLBBBBBBLLX..',
  '...XLLLLLLLLX...',
  '....XLLLLLLX....',
  '.....X....X.....',
  '.....FfffF......',
  '......FfF.......'
];

// Nanocraft — smooth rounded nanopod, big central cockpit dome, twin highlight
// edges. The Chapter 2 "Inner Space" finale trophy hull.
const HULL_NANOCRAFT = [
  '......XXXX......',
  '....XXHHHHXX....',
  '...XHHBBBBHHX...',
  '..XHBBPPPPBBHX..',
  '.XHBBPPPPPPBBHX.',
  '.XBBBPPPPPPBBBX.',
  '.XBBBBPPPPBBBBX.',
  'XHBBBBBBBBBBBBHX',
  'XBBBBBBBBBBBBBBX',
  'XBBBBBBDBBBBBBBX',
  'XHBBBBBBBBBBBBHX',
  'XBBBBBBBBBBBBBBX',
  '.XBLBBBBBBBBLBX.',
  '.XLLBBBBBBBBLLX.',
  '..XLLBBBBBBLLX..',
  '...XLLLLLLLLX...',
  '....XLLLLLLX....',
  '.....X....X.....',
  '.....FfffF......',
  '......FfF.......'
];

// WING strip overlays --------------------------------------------------------
// Each wing grid is 18 cols × 6 rows (slightly wider than hull).
const WINGS_STUB = [
  '..wWW..........WWw..',
  'wWWWW..........WWWWw',
  'XWWWW..........WWWWX',
  'XWWWX..........XWWWX',
  '.XXX............XXX.',
  '....................'
];

// Swept-back triangular wings — angle backward toward the rear of the ship.
const WINGS_SWEPT = [
  '....................',
  '..wW..............Ww',
  'wWWW..............WWW',
  'XWWWW............WWWWX',
  '.XWWWXX........XXWWWX',
  '..XXXXXX......XXXXXX.'
];

// Wide horizontal ovals — extending far past the hull edges.
const WINGS_WIDE = [
  '..wWWWW........WWWWw',
  'wWWWWWWW......WWWWWWw',
  'XWWWWWWW......WWWWWWX',
  'XWWWWWW........WWWWWX',
  '.XWWWX..........XWWWX.',
  '..XXX............XXX..'
];

// Snub stubby fins — small triangles close to the body.
const WINGS_SNUB = [
  '......wWW......WWw.....',
  '....wWWWW......WWWWw...',
  '....XWWWW......WWWWX...',
  '....XWWWX......XWWWX...',
  '.....XXX........XXX....',
  '.......................'
];

// Phantom — legendary curved sweeping wings with feathered trailing edge.
const WINGS_PHANTOM = [
  'wWWW..............WWWw',
  'WWWWWW..........WWWWWW',
  'XWWWWWW........WWWWWWX',
  'XWWWWWX........XWWWWWX',
  '.XWWXX..........XXWWX.',
  '..wW..............Ww..'
];

// Delta — large triangular forward-sweep delta wings
const WINGS_DELTA = [
  'wWWWWWWW........WWWWWWWw',
  'XWWWWWWWWW....WWWWWWWWWX',
  'XWWWWWWWX......XWWWWWWWX',
  '.XWWWWXX........XXWWWWX.',
  '..XWWX............XWWX..',
  '..............',
];

// Ribbed — segmented striped wings with prominent vertical bars
const WINGS_RIBBED = [
  '..wWXWXWX....XWXWXWw..',
  'wWXWXWXWXW..WXWXWXWXWw',
  'XWXWXWXWXX..XXWXWXWXWX',
  'XWXWXWXWX....XWXWXWXWX',
  '.XXXXXXXX....XXXXXXXX.',
  '......................'
];

// Solar Sails — wide flat panels with grid pattern (legendary)
const WINGS_SOLAR = [
  'wWWWWWWW........WWWWWWWw',
  'WWXWXWXWX......XWXWXWXWW',
  'WWWXWXWXX......XXWXWXWWW',
  'WWXWXWXWX......XWXWXWXWW',
  'XWWWWWWWX......XWWWWWWWX',
  '.XXXXXXXX........XXXXXX.'
];

// Seraph — angel-style multi-tier feathered wings (legendary)
const WINGS_SERAPH = [
  'wWWww...............wwWWw',
  'WWWWWww...........wwWWWWW',
  'WWWWWWWWw.......wWWWWWWWW',
  'XWWWWWWWWW....WWWWWWWWWWX',
  'XWWWWWWWWX....XWWWWWWWWWX',
  '.XwWWwwWX......XWwwWWwX..'
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
    addon: null,
    pattern: 'pattern_none',
    trail: 'trail_default_flame'
  };

  const container = scene.add.container(x, y);

  const paint = partById(parts.paint);
  const hull = partById(parts.hull);
  const wings = partById(parts.wings);
  const addon = partById(parts.addon);
  // Pattern is now embedded in paint (paint.pattern + paint.color2/color3).
  // Legacy pattern slot is ignored — see ShipManager paints definition.
  const trail = partById(parts.trail) || partById('trail_default_flame');

  const paintColor = paint?.color ?? 0xb6c2cf;
  const wingColor = wings?.color ?? 0x8b9bb4;
  const addonColor = addon?.color ?? 0xf7dc6f;

  const pixelSize = 5 * scale;

  // Pick hull grid — each variant has its own silhouette
  const hullGrid = parts.hull === 'hull_round' ? HULL_ROUND
                 : parts.hull === 'hull_sleek' ? HULL_SLEEK
                 : parts.hull === 'hull_bulky' ? HULL_BULKY
                 : parts.hull === 'hull_wraith' ? HULL_WRAITH
                 : parts.hull === 'hull_arrow' ? HULL_ARROW
                 : parts.hull === 'hull_finned' ? HULL_FINNED
                 : parts.hull === 'hull_eclipse' ? HULL_ECLIPSE
                 : parts.hull === 'hull_nanocraft' ? HULL_NANOCRAFT
                 : HULL_STANDARD;
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
  const wingsGrid = parts.wings === 'wings_swept' ? WINGS_SWEPT
                  : parts.wings === 'wings_wide' ? WINGS_WIDE
                  : parts.wings === 'wings_stub' ? WINGS_SNUB
                  : parts.wings === 'wings_phantom' ? WINGS_PHANTOM
                  : parts.wings === 'wings_delta' ? WINGS_DELTA
                  : parts.wings === 'wings_ribbed' ? WINGS_RIBBED
                  : parts.wings === 'wings_solar' ? WINGS_SOLAR
                  : parts.wings === 'wings_seraph' ? WINGS_SERAPH
                  : WINGS_STUB;
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

  // 'P' = porthole cutout (pet renders on top, masked to the hole).
  const hullOx = -hullW / 2;
  const hullOy = -hullH / 2;
  const hullG = pixelGrid(scene, hullGrid, hullOx, hullOy, pixelSize, ch => {
    if (ch === 'X') return 0x07071a;
    if (ch === 'B') return paintColor;
    if (ch === 'H') return lighten(paintColor, 0.32);
    if (ch === 'L') return darken(paintColor, 0.28);
    if (ch === 'P') return 0x0a0a1a;     // porthole interior (pet sits on top)
    if (ch === 'D') return paintColor;   // legacy decal anchor — body color
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

  // Pattern overlay drawn on top of the hull (data lives on the paint now)
  if (paint && paint.pattern && paint.pattern !== 'pattern_none') {
    const patternData = {
      id: paint.pattern,
      color: paint.color2,
      color2: paint.color3
    };
    drawPatternOverlay(scene, container, patternData, hullW, hullH, pixelSize);
  }

  // Addon module — most mount on TOP of the hull. Tail spoiler is a special
  // case: it perches on the BACK of the hull, just above the engine flame.
  if (addon) {
    if (addon.id === 'addon_spoiler') {
      const mountY = hullH / 2 - 4 * scale;
      drawAddonOverlay(scene, container, addon.id, addonColor, 0, mountY, pixelSize);
    } else {
      const mountY = -hullH / 2;
      drawAddonOverlay(scene, container, addon.id, addonColor, 0, mountY + 2, pixelSize);
    }
  }

  return container;
}

// Engine trails --------------------------------------------------------------

function drawEngineTrail(scene, container, trailId, x, y, scale) {
  // Boost all trail visuals so the equipped trail reads at a glance.
  scale = scale * 1.8;
  const baseY = y;

  // New trail types ------------------------------------------------------
  if (trailId === 'trail_lightning') {
    for (let i = 0; i < 4; i++) {
      const bolt = scene.add.graphics();
      bolt.lineStyle(3 * scale, 0xfff3b8, 1);
      bolt.beginPath();
      bolt.moveTo(x, baseY);
      bolt.lineTo(x - 4 * scale, baseY + 8 * scale);
      bolt.lineTo(x + 4 * scale, baseY + 14 * scale);
      bolt.lineTo(x - 2 * scale, baseY + 22 * scale);
      bolt.strokePath();
      bolt.alpha = 0.4 + Math.random() * 0.5;
      container.add(bolt);
      scene.tweens.add({
        targets: bolt,
        alpha: { from: 0.2, to: 1 },
        duration: 180 + Math.random() * 200,
        yoyo: true, repeat: -1, ease: 'Quad.easeInOut',
        delay: i * 60
      });
    }
    return;
  }
  if (trailId === 'trail_bubbles') {
    for (let i = 0; i < 8; i++) {
      const b = scene.add.graphics();
      b.fillStyle(0xb6e0ff, 0.85);
      b.fillCircle(0, 0, (3 + Math.random() * 3) * scale);
      b.fillStyle(0xffffff, 0.65);
      b.fillCircle(-1 * scale, -1 * scale, 1.2 * scale);
      b.x = x + (Math.random() - 0.5) * 16 * scale;
      b.y = baseY + Math.random() * 30 * scale;
      container.add(b);
      scene.tweens.add({
        targets: b,
        y: b.y + 36 * scale,
        alpha: { from: 1, to: 0 },
        duration: 800 + Math.random() * 500,
        repeat: -1, ease: 'Quad.easeOut'
      });
    }
    return;
  }
  if (trailId === 'trail_notes') {
    for (let i = 0; i < 5; i++) {
      const note = scene.add.graphics();
      note.fillStyle(0xd5a6ff, 0.9);
      note.fillCircle(0, 0, 4 * scale);
      note.fillRect(3 * scale, -10 * scale, 1.5 * scale, 10 * scale);
      note.x = x + (Math.random() - 0.5) * 16 * scale;
      note.y = baseY + Math.random() * 24 * scale;
      container.add(note);
      scene.tweens.add({
        targets: note,
        y: note.y + 38 * scale,
        alpha: { from: 1, to: 0 },
        duration: 1000 + Math.random() * 400,
        repeat: -1, ease: 'Quad.easeOut'
      });
    }
    return;
  }
  if (trailId === 'trail_petals') {
    for (let i = 0; i < 8; i++) {
      const p = scene.add.graphics();
      p.fillStyle(0xff9ec7, 0.9);
      p.fillEllipse(0, 0, 6 * scale, 3 * scale);
      p.x = x + (Math.random() - 0.5) * 16 * scale;
      p.y = baseY + Math.random() * 28 * scale;
      p.angle = Math.random() * 360;
      container.add(p);
      scene.tweens.add({
        targets: p,
        y: p.y + 40 * scale,
        angle: p.angle + 360,
        alpha: { from: 1, to: 0 },
        duration: 1200 + Math.random() * 500,
        repeat: -1, ease: 'Quad.easeOut'
      });
    }
    return;
  }
  if (trailId === 'trail_aurora') {
    const colors = [0xa6f0e8, 0x9be8a3, 0xd5a6ff, 0xff9ec7, 0xfff3b8];
    for (let i = 0; i < colors.length; i++) {
      const ribbon = scene.add.graphics();
      ribbon.fillStyle(colors[i], 0.55);
      ribbon.fillEllipse(0, 0, 18 * scale, 6 * scale);
      ribbon.x = x;
      ribbon.y = baseY + i * 5 * scale;
      container.add(ribbon);
      scene.tweens.add({
        targets: ribbon,
        scaleX: { from: 0.7, to: 1.3 },
        alpha: { from: 0.4, to: 0.9 },
        duration: 700 + i * 90,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }
    return;
  }

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

  if (trailId === 'trail_pixel_smoke') {
    // Chunky 8-bit smoke puffs — square-pixel blobs in light gray
    for (let i = 0; i < 6; i++) {
      const puff = scene.add.graphics();
      const c = i % 2 === 0 ? 0xc8c8d8 : 0xa0a0b8;
      puff.fillStyle(c, 0.85);
      const sz = (3 + Math.random() * 2) * scale;
      // Plus-shape pixel cloud
      puff.fillRect(-sz, -sz / 2, sz * 2, sz);
      puff.fillRect(-sz / 2, -sz, sz, sz * 2);
      puff.x = x + (Math.random() - 0.5) * 14 * scale;
      puff.y = baseY + Math.random() * 18 * scale;
      container.add(puff);
      scene.tweens.add({
        targets: puff,
        y: puff.y + 38 * scale,
        scale: { from: 1, to: 1.7 },
        alpha: { from: 0.9, to: 0 },
        duration: 1000 + Math.random() * 400,
        repeat: -1, ease: 'Quad.easeOut'
      });
    }
    return;
  }
  if (trailId === 'trail_neon_grid') {
    // Receding grid lines — Tron-style horizontal bars at staggered depths
    const colors = [0x4ecdc4, 0xc77eff, 0x4ecdc4, 0xc77eff, 0x4ecdc4];
    for (let i = 0; i < colors.length; i++) {
      const line = scene.add.graphics();
      const w = (8 + i * 2) * scale;
      line.lineStyle(2 * scale, colors[i], 0.95);
      line.lineBetween(-w, 0, w, 0);
      line.x = x;
      line.y = baseY + i * 5 * scale;
      container.add(line);
      scene.tweens.add({
        targets: line,
        y: line.y + 30 * scale,
        scaleX: { from: 1, to: 1.5 },
        alpha: { from: 1, to: 0 },
        duration: 700,
        delay: i * 90,
        repeat: -1, ease: 'Quad.easeOut'
      });
    }
    return;
  }
  if (trailId === 'trail_snowflake') {
    // White six-pointed flakes drifting + slow rotation
    for (let i = 0; i < 6; i++) {
      const flake = scene.add.graphics();
      flake.lineStyle(scale, 0xffffff, 1);
      const r = (3 + Math.random() * 2) * scale;
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * Math.PI * 2;
        flake.lineBetween(0, 0, Math.cos(a) * r, Math.sin(a) * r);
      }
      flake.fillStyle(0xb6e0ff, 0.6);
      flake.fillCircle(0, 0, scale);
      flake.x = x + (Math.random() - 0.5) * 16 * scale;
      flake.y = baseY + Math.random() * 22 * scale;
      flake.angle = Math.random() * 360;
      container.add(flake);
      scene.tweens.add({
        targets: flake,
        y: flake.y + 38 * scale,
        angle: flake.angle + 180,
        alpha: { from: 1, to: 0 },
        duration: 1300 + Math.random() * 400,
        repeat: -1, ease: 'Quad.easeOut'
      });
    }
    return;
  }
  if (trailId === 'trail_pixel_lava') {
    // Chunky lava droplets dripping with a wisp of steam
    for (let i = 0; i < 6; i++) {
      const drop = scene.add.graphics();
      const c = i % 2 === 0 ? 0xff5b3d : 0xffe07a;
      drop.fillStyle(c, 1);
      const sz = (2.5 + Math.random()) * scale;
      drop.fillRect(-sz, -sz, sz * 2, sz * 2);
      drop.fillStyle(0xff8b3d, 1);
      drop.fillRect(-sz * 0.5, sz, sz, sz);
      drop.x = x + (Math.random() - 0.5) * 14 * scale;
      drop.y = baseY + Math.random() * 16 * scale;
      container.add(drop);
      scene.tweens.add({
        targets: drop,
        y: drop.y + 36 * scale,
        alpha: { from: 1, to: 0 },
        duration: 900 + Math.random() * 400,
        repeat: -1, ease: 'Quad.easeIn'
      });
    }
    // Steam wisp behind it
    const steam = scene.add.graphics();
    steam.fillStyle(0xffffff, 0.45);
    steam.fillEllipse(x, baseY - 4 * scale, 14 * scale, 6 * scale);
    container.add(steam);
    scene.tweens.add({
      targets: steam,
      alpha: { from: 0.45, to: 0.1 },
      scaleY: { from: 1, to: 1.4 },
      duration: 800,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
    return;
  }

  if (trailId === 'trail_cosmic_dust') {
    // Sparkly cosmic-purple stardust drifting down with bright twinkles
    for (let i = 0; i < 12; i++) {
      const dust = scene.add.graphics();
      const c = i % 4 === 0 ? 0xffffff
              : i % 3 === 0 ? 0xfff3b8
              : i % 2 === 0 ? 0xc77eff
              : 0x9d6bff;
      dust.fillStyle(c, 0.95);
      const sz = (1.2 + Math.random() * 2) * scale;
      drawStarShape(dust, 0, 0, 4, sz, sz * 0.4);
      dust.x = x + (Math.random() - 0.5) * 18 * scale;
      dust.y = baseY + Math.random() * 24 * scale;
      container.add(dust);
      scene.tweens.add({
        targets: dust,
        y: dust.y + 42 * scale,
        angle: 360,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.5 },
        duration: 1100 + Math.random() * 600,
        repeat: -1, ease: 'Quad.easeOut'
      });
    }
    // Faint nebula glow behind it
    const glow = scene.add.graphics();
    glow.fillStyle(0xc77eff, 0.30);
    glow.fillEllipse(x, baseY + 4 * scale, 22 * scale, 12 * scale);
    container.add(glow);
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.30, to: 0.10 },
      scaleX: { from: 1, to: 1.4 },
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
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
  const c1 = pattern.color || 0xffffff;
  const c2 = pattern.color2 || 0x07071a;

  if (pattern.id === 'pattern_stripes') {
    // Two diagonal stripes
    g.lineStyle(pixelSize * 1.2, c1, 0.95);
    g.lineBetween(-hullW * 0.30, hullH * 0.40, hullW * 0.20, -hullH * 0.20);
    g.lineStyle(pixelSize * 1.2, c1, 0.7);
    g.lineBetween(-hullW * 0.18, hullH * 0.45, hullW * 0.32, -hullH * 0.15);
  } else if (pattern.id === 'pattern_checkered') {
    // 4 squares in a checker pattern centered on hull
    const sz = pixelSize * 2.5;
    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        if ((r + col) % 2 !== 0) continue;
        g.fillStyle(c1, 0.85);
        g.fillRect(-sz * 2 + col * sz, -sz * 2 + r * sz + hullH * 0.05, sz, sz);
      }
    }
  } else if (pattern.id === 'pattern_stars') {
    const starColor = c1;
    const stars = [
      [-hullW * 0.22, -hullH * 0.05],
      [hullW * 0.22, -hullH * 0.05],
      [-hullW * 0.12, hullH * 0.20],
      [hullW * 0.12, hullH * 0.20],
      [0, hullH * 0.05]
    ];
    for (const [sx, sy] of stars) {
      g.fillStyle(starColor, 1);
      drawStarShape(g, sx, sy, 5, pixelSize * 1.4, pixelSize * 0.6);
    }
  } else if (pattern.id === 'pattern_flames') {
    // Two licking-flame triangles climbing up the body
    g.fillStyle(c1, 0.85);
    g.fillTriangle(-hullW * 0.25, hullH * 0.30, -hullW * 0.05, hullH * 0.30, -hullW * 0.15, -hullH * 0.10);
    g.fillTriangle(hullW * 0.05, hullH * 0.30, hullW * 0.25, hullH * 0.30, hullW * 0.15, -hullH * 0.10);
    g.fillStyle(c2, 0.85);
    g.fillTriangle(-hullW * 0.18, hullH * 0.20, -hullW * 0.10, hullH * 0.20, -hullW * 0.14, hullH * 0.0);
    g.fillTriangle(hullW * 0.10, hullH * 0.20, hullW * 0.18, hullH * 0.20, hullW * 0.14, hullH * 0.0);
  } else if (pattern.id === 'pattern_hearts') {
    // 3 small hearts as filled triangles + 2 circles each
    const hearts = [
      [-hullW * 0.16, -hullH * 0.05],
      [hullW * 0.16, -hullH * 0.05],
      [0, hullH * 0.18]
    ];
    g.fillStyle(c1, 0.95);
    for (const [hx, hy] of hearts) {
      const r = pixelSize * 0.9;
      g.fillCircle(hx - r, hy, r);
      g.fillCircle(hx + r, hy, r);
      g.fillTriangle(hx - 2 * r, hy + r * 0.2, hx + 2 * r, hy + r * 0.2, hx, hy + 2.4 * r);
    }
  } else if (pattern.id === 'pattern_galaxy_swirl') {
    g.fillStyle(c1, 0.45);
    g.fillEllipse(-hullW * 0.10, hullH * 0.10, hullW * 0.55, hullH * 0.40);
    g.fillStyle(c2, 0.45);
    g.fillEllipse(hullW * 0.12, -hullH * 0.05, hullW * 0.50, hullH * 0.40);
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(-hullW * 0.18, -hullH * 0.05, pixelSize * 0.6);
    g.fillCircle(hullW * 0.20, hullH * 0.18, pixelSize * 0.6);
    g.fillCircle(-hullW * 0.05, hullH * 0.25, pixelSize * 0.5);
    g.fillCircle(hullW * 0.05, -hullH * 0.10, pixelSize * 0.5);
  } else if (pattern.id === 'pattern_cosmic') {
    // Pale star burst + scattered sparkles (5-point stars — a 6-point burst
    // reads as a hexagram, which we avoid).
    g.fillStyle(c1, 0.85);
    drawStarShape(g, 0, hullH * 0.05, 5, pixelSize * 2.2, pixelSize * 0.9);
    g.fillStyle(c2, 0.7);
    drawStarShape(g, -hullW * 0.20, -hullH * 0.05, 5, pixelSize * 1.2, pixelSize * 0.5);
    drawStarShape(g, hullW * 0.20, -hullH * 0.05, 5, pixelSize * 1.2, pixelSize * 0.5);
    drawStarShape(g, -hullW * 0.10, hullH * 0.25, 5, pixelSize * 0.9, pixelSize * 0.4);
    drawStarShape(g, hullW * 0.10, hullH * 0.25, 5, pixelSize * 0.9, pixelSize * 0.4);
  } else if (pattern.id === 'pattern_frost') {
    // Snowflake six-point burst plus drifting flakes
    const fx = pixelSize * 1.6;
    g.lineStyle(pixelSize * 0.7, c1, 0.95);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.lineBetween(0, hullH * 0.05, Math.cos(a) * fx * 1.6, hullH * 0.05 + Math.sin(a) * fx * 1.6);
    }
    g.fillStyle(c2 || 0xffffff, 0.85);
    g.fillCircle(-hullW * 0.22, -hullH * 0.10, pixelSize * 0.5);
    g.fillCircle(hullW * 0.22, -hullH * 0.10, pixelSize * 0.5);
    g.fillCircle(-hullW * 0.18, hullH * 0.25, pixelSize * 0.4);
    g.fillCircle(hullW * 0.18, hullH * 0.25, pixelSize * 0.4);
  }
  container.add(g);
}

// Addon sprites — prominent modules mounted on top of the hull. Replaces the
// old decal system (which sat on the paint and clashed with patterns).
// Cells:  X = outline    A = main color    H = highlight (auto-lightened)
//         L = shadow     K = white sparkle  B = darker accent (auto-darkened)
//         C = cyan tech-glow    P = purple/magenta tech-glow
const ADDON_SPRITES = {
  addon_antenna: [
    '..K..',
    '..A..',
    '.KAK.',
    '..A..',
    '..A..',
    '..A..',
    '..A..',
    '..A..',
    'XBABX',
    'XBBBX',
    'XXXXX'
  ],
  addon_spoiler: [
    'XX.........XX',
    'XAXXXXXXXXXAX',
    'XAHHHHHHHHHAX',
    'XABBBBBBBBBAX',
    'XXAAAAAAAAAXX',
    '.XXXXXXXXXXX.'
  ],
  addon_periscope: [
    '.XXXXX.',
    'XAHHHAX',
    'XAKKHAX',
    'XAHHHAX',
    '.XXXXX.',
    '...A...',
    '...A...',
    '...A...',
    '...A...',
    '..XAX..',
    '..XAX..'
  ],
  addon_cannons: [
    'XXX...XXX',
    'XKX...XKX',
    'XAX...XAX',
    'XAX...XAX',
    'XAXXXXXAX',
    'XAAAAAAAAX',
    'XBBBBBBBBX',
    'XXXXXXXXXX'
  ],
  addon_satellite: [
    'X..K..X..K..X',
    'XAKKKKAKKKKAX',
    'XAHHHHHHHHHAX',
    'XABBBBBBBBBAX',
    'XXXBBBBBBBXXX',
    '...XXAXAXX...',
    '....XAXAX....',
    '....XAAAX....',
    '.....XXX.....'
  ],
  addon_phoenix_crest: [
    '...K...',
    '..KAK..',
    '.KAAAK.',
    'KAABAAK',
    'KABBBAK',
    'KAABAAK',
    '.KAAAK.',
    '..XAX..',
    '..XBX..',
    '..XXX..'
  ],
  addon_galaxy_orb: [
    '...XXX...',
    '..XAHAX..',
    '.XAHKHAX.',
    'XAHKKKHAX',
    'XAHKKKHAX',
    '.XAHKHAX.',
    '..XAHAX..',
    '...XXX...',
    '....X....',
    '...XAX...',
    '..XXXXX..'
  ],
  addon_dragon_horns: [
    'XX.....XX',
    'XAX...XAX',
    'XAX...XAX',
    'XAAX.XAAX',
    'XABAXAABX',
    'XABBAABBX',
    '.XBBBBBX.',
    '..XBBBX..',
    '...XXX...'
  ],
  addon_glitch_module: [
    'XAXAXAX',
    'AXAKAXA',
    'XAKAKAX',
    'AXKAKXA',
    'XAKAKAX',
    'AXAKAXA',
    'XAXAXAX',
    'XXXXXXX'
  ]
};

function drawAddonOverlay(scene, container, addonId, color, cx, cy, pixelSize) {
  const grid = ADDON_SPRITES[addonId];
  if (!grid) return;
  const cols = grid[0].length;
  const rows = grid.length;
  // Addons render at slightly smaller pitch so the mount sits crisply on the hull
  // without dwarfing it.
  const px = pixelSize * 0.85;
  const ox = cx - (cols / 2) * px;
  // Anchor cy is the BOTTOM of the addon — module sits ON TOP of the hull, not
  // floating above it.
  const oy = cy - rows * px;
  const g = scene.add.graphics();
  const hi = lighten(color, 0.30);
  const lo = darken(color, 0.30);
  const dim = darken(color, 0.50);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      if (!ch || ch === '.') continue;
      let fill;
      switch (ch) {
        case 'X': fill = 0x07071a; break;
        case 'A': fill = color; break;
        case 'H': fill = hi; break;
        case 'L': fill = lo; break;
        case 'B': fill = dim; break;
        case 'K': fill = 0xffffff; break;
        case 'C': fill = 0x4ecdc4; break;
        case 'P': fill = 0xc77eff; break;
        default:  fill = color;
      }
      g.fillStyle(fill, 1);
      g.fillRect(ox + c * px, oy + r * px, px + 0.5, px + 0.5);
    }
  }
  container.add(g);

  if (addonId === 'addon_galaxy_orb') {
    scene.tweens.add({
      targets: g,
      scale: { from: 1, to: 1.08 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
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
