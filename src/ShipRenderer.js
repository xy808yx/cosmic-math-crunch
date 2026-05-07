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
  // Pattern is now embedded in paint (paint.pattern + paint.color2/color3).
  // Legacy pattern slot is ignored — see ShipManager paints definition.
  const trail = partById(parts.trail) || partById('trail_default_flame');

  const paintColor = paint?.color ?? 0xb6c2cf;
  const wingColor = wings?.color ?? 0x8b9bb4;
  const decalColor = decal?.color ?? 0xf7dc6f;

  const pixelSize = 5 * scale;

  // Pick hull grid — each variant has its own silhouette
  const hullGrid = parts.hull === 'hull_round' ? HULL_ROUND
                 : parts.hull === 'hull_sleek' ? HULL_SLEEK
                 : parts.hull === 'hull_bulky' ? HULL_BULKY
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

  // Hull (body) — `P` cells mark the porthole cutout (we render canopy color
  // here for the area; the pet renders on top of that, masked to the hole).
  // `D` cells are the decal ANCHOR — we paint over them in the body color and
  // overlay a proper multi-pixel decal sprite below (see drawDecalOverlay).
  const hullOx = -hullW / 2;
  const hullOy = -hullH / 2;
  const hullG = pixelGrid(scene, hullGrid, hullOx, hullOy, pixelSize, ch => {
    if (ch === 'X') return 0x07071a;
    if (ch === 'B') return paintColor;
    if (ch === 'H') return lighten(paintColor, 0.32);
    if (ch === 'L') return darken(paintColor, 0.28);
    if (ch === 'P') return 0x0a0a1a;     // porthole interior (pet sits on top)
    if (ch === 'D') return paintColor;   // anchor cell — covered by overlay
    if (ch === 'F') return 0xff8b3d;
    if (ch === 'f') return 0xffd86b;
    return null;
  });
  container.add(hullG);

  // Decal overlay — find the 'D' cell, draw a real sprite there.
  if (decal) {
    let dcol = -1, drow = -1;
    for (let r = 0; r < hullGrid.length; r++) {
      const ci = hullGrid[r].indexOf('D');
      if (ci >= 0) { dcol = ci; drow = r; break; }
    }
    if (dcol >= 0) {
      const dcx = hullOx + (dcol + 0.5) * pixelSize;
      const dcy = hullOy + (drow + 0.5) * pixelSize;
      drawDecalOverlay(scene, container, decal.id, decalColor, dcx, dcy, pixelSize);
    }
  }

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

  // ----- NEW TRAILS ----------------------------------------------------
  if (trailId === 'trail_starlight') {
    // Tiny gold stars drifting down with subtle scale pulse
    for (let i = 0; i < 7; i++) {
      const star = scene.add.graphics();
      star.fillStyle(i % 3 === 0 ? 0xffffff : 0xfff3b8, 0.95);
      drawStarShape(star, 0, 0, 5, (2 + Math.random() * 1.5) * scale, (0.8 + Math.random() * 0.6) * scale);
      star.x = x + (Math.random() - 0.5) * 16 * scale;
      star.y = baseY + Math.random() * 24 * scale;
      container.add(star);
      scene.tweens.add({
        targets: star,
        y: star.y + 36 * scale,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.4 },
        duration: 1000 + Math.random() * 500,
        repeat: -1, ease: 'Quad.easeOut'
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
    // Pale star burst + scattered sparkles
    g.fillStyle(c1, 0.85);
    drawStarShape(g, 0, hullH * 0.05, 6, pixelSize * 2.2, pixelSize * 0.9);
    g.fillStyle(c2, 0.7);
    drawStarShape(g, -hullW * 0.20, -hullH * 0.05, 5, pixelSize * 1.2, pixelSize * 0.5);
    drawStarShape(g, hullW * 0.20, -hullH * 0.05, 5, pixelSize * 1.2, pixelSize * 0.5);
    drawStarShape(g, -hullW * 0.10, hullH * 0.25, 5, pixelSize * 0.9, pixelSize * 0.4);
    drawStarShape(g, hullW * 0.10, hullH * 0.25, 5, pixelSize * 0.9, pixelSize * 0.4);
  }
  container.add(g);
}

// Decal sprites — small pixel-art icons drawn over the hull at the 'D' cell.
const DECAL_SPRITES = {
  decal_star: [
    '..A..',
    '.AAA.',
    'AAAAA',
    '.A.A.',
    'A...A'
  ],
  decal_heart: [
    '.A.A.',
    'AABAA',
    'AABBA',
    '.AAA.',
    '..A..'
  ],
  decal_crown: [
    'A.A.A',
    'AAAAA',
    'AKAKA',
    'AAAAA'
  ],
  decal_bolt: [
    '.AA..',
    '.AA..',
    'AAAAA',
    '..AA.',
    '..AA.'
  ],
  decal_skull: [
    '.AAA.',
    'AABAA',
    'ABABA',
    'AAAAA',
    '.A.A.'
  ],
  decal_comet: [
    '...A.',
    '..AAA',
    '.AAA.',
    'AAA..',
    'A....'
  ]
};

function drawDecalOverlay(scene, container, decalId, decalColor, cx, cy, pixelSize) {
  const grid = DECAL_SPRITES[decalId];
  if (!grid) return;
  const cols = grid[0].length;
  const rows = grid.length;
  // Decal pixels are slightly smaller than hull pixels so the icon fits cleanly.
  const px = pixelSize * 0.85;
  const ox = cx - (cols / 2) * px;
  const oy = cy - (rows / 2) * px;
  const g = scene.add.graphics();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      if (!ch || ch === '.') continue;
      // 'A' = main decal color, 'B' = darkened accent, 'K' = white
      const color = ch === 'A' ? decalColor
                  : ch === 'B' ? darken(decalColor, 0.40)
                  : ch === 'K' ? 0xffffff
                  : decalColor;
      g.fillStyle(color, 1);
      g.fillRect(ox + c * px, oy + r * px, px + 0.5, px + 0.5);
    }
  }
  // Outline to keep the decal readable on any paint.
  // Fast outline: draw transparent pixels around, then re-draw the decal on top.
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
