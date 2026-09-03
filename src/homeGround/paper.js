// Paper Cutout helpers shared by the Home Ground worlds (31 to 38).
//
// The look: stacked flat planes like cut paper. Every prop is drawn twice,
// first as a black shape at alpha 0.22 pushed a few pixels down and right (the
// hard offset shadow), then in its own colour on top. Rounded corners
// everywhere, no outlines, no strokes except thin cables and rails, and no
// gradients except the sky. Depth comes from stacking, not shading.
//
// How to use it from a world module:
//   paper(g, 4, 6, (gg, shadow) => {
//     ink(gg, shadow, 0xe8594a);
//     gg.fillRoundedRect(x, y, w, h, 12);
//   });
// Inside the draw callback, set colours only through ink() and inkLine() so
// the shadow pass stays black. Where a row of shapes overlaps (scallops,
// humps, fence posts, a treeline) draw the whole row inside one paper() call
// so the row's shadows land as one pass before the row itself.
//
// Offsets by convention: (+4, +6) for props, (0, +8) for big horizontal
// planes such as water, (+6, +8) and (-6, +8) for the two far ridges.
//
// Horizon contract (every drawHorizon): anchored at opts.y, props above, a
// shallow floor of at most 60px below, and never an opaque full-width sheet
// over the sky the scene already painted (a translucent haze band at most).
// Static and deterministic: no Math.random in horizons or nodes. The two mote
// emitters at the bottom of this file are the one place Math.random belongs.
//
// This module imports nothing. It only calls methods on the Phaser Graphics
// object it is handed, so it also runs in plain node against a fake graphics
// object (see the hg-smoke harness).
//
// Art rule for anything radial: plain shapes only, no spirals or sunbursts,
// no rays. The sun here is a soft ellipse glow under a disc.

/** Canvas width. The game runs a 1080 by 1920 portrait canvas. */
export const W = 1080;

const SHADOW_COLOR = 0x000000;
const SHADOW_ALPHA = 0.22;
const GLINT_ALPHA = 0.35;

/**
 * Set the fill for one pass of a paper() draw. In the shadow pass the fill is
 * always black at 0.22 so the shadow stays a shadow no matter what the prop
 * colour is.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {boolean} shadow true during the shadow pass
 * @param {number} color hex colour for the real pass
 * @param {number} [alpha=1] alpha for the real pass
 * @returns {Phaser.GameObjects.Graphics}
 */
export function ink(g, shadow, color, alpha = 1) {
  if (shadow) g.fillStyle(SHADOW_COLOR, SHADOW_ALPHA);
  else g.fillStyle(color, alpha);
  return g;
}

/**
 * Line version of ink() for the few thin strokes the style allows (cables,
 * strings, spars, rails). Black at 0.22 in the shadow pass.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {boolean} shadow true during the shadow pass
 * @param {number} width stroke width in px
 * @param {number} color hex colour for the real pass
 * @param {number} [alpha=1]
 * @returns {Phaser.GameObjects.Graphics}
 */
export function inkLine(g, shadow, width, color, alpha = 1) {
  if (shadow) g.lineStyle(width, SHADOW_COLOR, SHADOW_ALPHA);
  else g.lineStyle(width, color, alpha);
  return g;
}

/**
 * The signature wrapper. Runs draw(g, true) with the canvas shifted by
 * (dx, dy) for the shadow pass, then draw(g, false) in place for the real
 * pass. Uses save() and restore() to undo the shift when the graphics object
 * has them (Phaser does); otherwise translates back by hand. Calls nest, so a
 * helper may call paper() inside another paper() callback.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} dx shadow offset right
 * @param {number} dy shadow offset down
 * @param {(g: Phaser.GameObjects.Graphics, shadow: boolean) => void} draw
 * @returns {Phaser.GameObjects.Graphics}
 */
export function paper(g, dx, dy, draw) {
  const canSave = typeof g.save === 'function' && typeof g.restore === 'function';
  if (canSave) {
    g.save();
    g.translateCanvas(dx, dy);
    draw(g, true);
    g.restore();
  } else {
    g.translateCanvas(dx, dy);
    draw(g, true);
    g.translateCanvas(-dx, -dy);
  }
  draw(g, false);
  return g;
}

/**
 * The back sheet: a vertical gradient built from stacked rects, one per pair
 * of stops. Two stops give one rect; four stops give three. This is the one
 * place the style allows a gradient. Note the scenes already paint the world
 * sky, so a horizon should only call this for a small sky patch (a window, a
 * night node card), never full height over the scene's own sky.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} x left edge
 * @param {number} y top edge
 * @param {number} w width
 * @param {number} h height
 * @param {Array<[number, number]>} stops [[t, color], ...] with t rising from 0 to 1
 * @returns {Phaser.GameObjects.Graphics}
 */
export function sky(g, x, y, w, h, stops) {
  if (!stops || stops.length === 0) return g;
  if (stops.length === 1) {
    g.fillStyle(stops[0][1], 1);
    g.fillRect(x, y, w, h);
    return g;
  }
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, top] = stops[i];
    const [t1, bottom] = stops[i + 1];
    const y0 = y + h * t0;
    const y1 = y + h * t1;
    if (y1 <= y0) continue;
    // A plain mid-tone fill first: the canvas renderer ignores gradient fills
    // and falls back to the last solid fill, so it still gets a sensible colour.
    g.fillStyle(midColor(top, bottom), 1);
    g.fillGradientStyle(top, top, bottom, bottom, 1);
    // Overlap each band by a pixel so no seam shows between stacked rects.
    const extra = (i < stops.length - 2) ? 1 : 0;
    g.fillRect(x, y0, w, (y1 - y0) + extra);
  }
  return g;
}

/**
 * A translucent full-width band. The only thing a horizon may lay over the
 * scene's sky: morning mist, rain grey, evening glow low on the horizon.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} y top edge
 * @param {number} h height
 * @param {number} color
 * @param {number} alpha keep it translucent, well under 1
 * @returns {Phaser.GameObjects.Graphics}
 */
export function haze(g, y, h, color, alpha) {
  g.fillStyle(color, alpha);
  g.fillRect(0, y, W, h);
  return g;
}

/**
 * A full-width water plane with the big-plane paper shadow (0, +8) so the
 * sea reads as a sheet laid over the sand or the far shore. Optional glints:
 * thin white strips near the top edge, the way a kid draws sparkle on water.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} y top edge of the water
 * @param {number} h height
 * @param {number} color water colour (the chapter anchor is 0x3a8fb5)
 * @param {{glints?: Array<[number, number]>, glintY?: number, alpha?: number, shadowDy?: number}} [opts]
 *   glints: [[x, w], ...] strips 4px tall; glintY: distance below the top
 *   edge for the strips (default 12); alpha: water alpha (default 1);
 *   shadowDy: shadow drop (default 8)
 * @returns {Phaser.GameObjects.Graphics}
 */
export function waterBand(g, y, h, color, opts = {}) {
  const alpha = opts.alpha ?? 1;
  const shadowDy = opts.shadowDy ?? 8;
  paper(g, 0, shadowDy, (gg, shadow) => {
    ink(gg, shadow, color, alpha);
    gg.fillRect(0, y, W, h);
  });
  const glints = opts.glints || [];
  if (glints.length) {
    const gy = y + (opts.glintY ?? 12);
    g.fillStyle(0xffffff, GLINT_ALPHA);
    for (const [gx, gw] of glints) g.fillRoundedRect(gx, gy, gw, 4, 2);
  }
  return g;
}

/**
 * A beach floor: a dry sand plane with a darker wet strip along its top edge
 * (where the last wave reached), optional cream sandbars, optional tide pools.
 * Draw order: dry sand plane, wet strip with its paper shadow falling onto
 * the dry sand, sandbars with their own shadows, then pools. The dry plane is
 * the floor sheet and casts no shadow downward, so the floor stays shallow.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} y top edge (the water line)
 * @param {number} h total height of the sand
 * @param {number} sand dry sand colour (chapter anchor 0xefe0b0)
 * @param {number} wet wet sand colour, darker than sand
 * @param {{wetH?: number, bars?: Array<[number, number, number, number]>, barColor?: number,
 *   pools?: Array<[number, number, number, number]>, poolColor?: number}} [opts]
 *   wetH: wet strip height (default 22); bars: [[x, y, w, h], ...] cream
 *   rounded sandbars in absolute coords; pools: [[cx, cy, rx, ry], ...]
 *   water ellipses, each with a small white glint
 * @returns {Phaser.GameObjects.Graphics}
 */
export function sandFlat(g, y, h, sand, wet, opts = {}) {
  const wetH = Math.min(opts.wetH ?? 22, h);
  // Dry sand plane, the floor sheet.
  g.fillStyle(sand, 1);
  g.fillRect(0, y, W, h);
  // Wet strip along the water line, shadowed onto the dry sand.
  paper(g, 0, 6, (gg, shadow) => {
    ink(gg, shadow, wet, 1);
    gg.fillRect(0, y, W, wetH);
  });
  // Sandbars: pale rounded lozenges sitting on the flat.
  const bars = opts.bars || [];
  if (bars.length) {
    const barColor = opts.barColor ?? 0xfff8e7;
    paper(g, 4, 6, (gg, shadow) => {
      ink(gg, shadow, barColor, 1);
      for (const [bx, by, bw, bh] of bars) gg.fillRoundedRect(bx, by, bw, bh, Math.min(bh / 2, 12));
    });
  }
  // Tide pools: water ellipses cut into the sand, one glint each.
  const pools = opts.pools || [];
  if (pools.length) {
    const poolColor = opts.poolColor ?? 0x3a8fb5;
    for (const [cx, cy, rx, ry] of pools) {
      g.fillStyle(poolColor, 1);
      g.fillEllipse(cx, cy, rx * 2, ry * 2);
      g.fillStyle(0xffffff, 0.6);
      g.fillEllipse(cx - rx * 0.35, cy - ry * 0.3, Math.max(4, rx * 0.4), Math.max(3, ry * 0.35));
    }
  }
  return g;
}

/**
 * A ridge, hill or roofline: one closed polygon plus a same-colour circle of
 * radius r at each vertex so the peaks come out rounded like cut paper. The
 * vertices on the polygon's bottom edge are not rounded (they sit under the
 * floor and a circle there would bulge below it). Pass r = 0 for sharp peaks.
 * Drawn through paper() with the given offset: use (+6, +8) and (-6, +8) for
 * the two far ridges so they lean apart.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {Array<[number, number]>} points [[x, y], ...] in draw order
 * @param {number} color
 * @param {number} [dx=6] shadow offset right (negative leans left)
 * @param {number} [dy=8] shadow offset down
 * @param {number} [r=10] vertex rounding radius
 * @returns {Phaser.GameObjects.Graphics}
 */
export function ridge(g, points, color, dx = 6, dy = 8, r = 10) {
  if (!points || points.length < 3) return g;
  let bottom = -Infinity;
  for (const p of points) if (p[1] > bottom) bottom = p[1];
  paper(g, dx, dy, (gg, shadow) => {
    ink(gg, shadow, color, 1);
    gg.beginPath();
    gg.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) gg.lineTo(points[i][0], points[i][1]);
    gg.closePath();
    gg.fillPath();
    if (r > 0) {
      for (const [px, py] of points) {
        if (py >= bottom - 0.5) continue;
        gg.fillCircle(px, py, r);
      }
    }
  });
  return g;
}

/**
 * A row of paper trees: one triangle each with a small circle at the tip so
 * the point is rounded. The whole row's shadows go down first as one pass,
 * then the row, so overlapping trees do not shadow each other.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {Array<[number, number, number, number]>} trees [[x, baseY, w, h], ...]
 *   x is the trunk centre, baseY the ground line, w the full width, h the height
 * @param {number} color
 * @returns {Phaser.GameObjects.Graphics}
 */
export function treeline(g, trees, color) {
  if (!trees || trees.length === 0) return g;
  paper(g, 4, 6, (gg, shadow) => {
    ink(gg, shadow, color, 1);
    for (const [x, baseY, w, h] of trees) {
      const tipR = Math.max(3, Math.min(w, h) * 0.12);
      gg.fillTriangle(x - w / 2, baseY, x + w / 2, baseY, x, baseY - h);
      gg.fillCircle(x, baseY - h + tipR, tipR);
    }
  });
  return g;
}

/**
 * A rounded tower (or any tall box) standing on baseY, drawn through paper()
 * with the prop offset (+4, +6). Optional window grid with a deterministic
 * lit rule so the same tower always lights the same windows.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} x centre x
 * @param {number} baseY ground line the tower stands on
 * @param {number} w width
 * @param {number} h height above baseY
 * @param {number} color
 * @param {{radius?: number, dx?: number, dy?: number, windows?: {cols: number, rows: number,
 *   size?: number, gap?: number, lit?: number, dark?: number, offsetY?: number,
 *   rule?: (i: number, j: number) => 'lit' | 'dark' | 'skip'}}} [opts]
 *   windows.rule(i, j) is called per column i and row j and must be
 *   deterministic; default (i * 7 + j * 3) % 5 < 3 ? 'lit' : 'skip'.
 *   windows.offsetY shifts the grid from its vertically centred spot.
 * @returns {Phaser.GameObjects.Graphics}
 */
export function tower(g, x, baseY, w, h, color, opts = {}) {
  const radius = opts.radius ?? Math.min(14, w / 4);
  const left = x - w / 2;
  const top = baseY - h;
  paper(g, opts.dx ?? 4, opts.dy ?? 6, (gg, shadow) => {
    ink(gg, shadow, color, 1);
    gg.fillRoundedRect(left, top, w, h, radius);
  });
  const win = opts.windows;
  if (win && win.cols > 0 && win.rows > 0) {
    const size = win.size ?? 10;
    const gap = win.gap ?? 8;
    const lit = win.lit ?? 0xffe9a8;
    const dark = win.dark ?? 0x2a2a3a;
    const rule = win.rule || defaultWindowRule;
    const gridW = win.cols * size + (win.cols - 1) * gap;
    const gridH = win.rows * size + (win.rows - 1) * gap;
    const gx0 = x - gridW / 2;
    const gy0 = top + Math.max(12, (h - gridH) / 2) + (win.offsetY ?? 0);
    for (let j = 0; j < win.rows; j++) {
      for (let i = 0; i < win.cols; i++) {
        const kind = rule(i, j);
        if (kind === 'skip') continue;
        g.fillStyle(kind === 'lit' ? lit : dark, 1);
        g.fillRoundedRect(gx0 + i * (size + gap), gy0 + j * (size + gap), size, size, 2);
      }
    }
  }
  return g;
}

function defaultWindowRule(i, j) {
  return ((i * 7 + j * 3) % 5 < 3) ? 'lit' : 'skip';
}

/**
 * The sun or moon: a soft ellipse glow under a plain disc plus one small white
 * highlight upper-left. No rays (project art rule: plain shapes only, no
 * spirals or sunbursts).
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} cx
 * @param {number} cy
 * @param {number} r disc radius
 * @param {number} color (chapter anchor 0xffe08a)
 * @param {number} [glowAlpha=0.3]
 * @returns {Phaser.GameObjects.Graphics}
 */
export function sunDisc(g, cx, cy, r, color, glowAlpha = 0.3) {
  g.fillStyle(color, glowAlpha);
  g.fillEllipse(cx, cy, r * 3.2, r * 2.4);
  g.fillStyle(color, 1);
  g.fillCircle(cx, cy, r);
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(cx - r * 0.35, cy - r * 0.35, Math.max(2, r * 0.22));
  return g;
}

/**
 * Plain dot stars for the dusk worlds. Each point may carry its own alpha as
 * a fourth value; otherwise the dots are solid.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {Array<[number, number, number, number?]>} pts [[x, y, r, alpha?], ...]
 * @param {number} [color=0xffffff]
 * @returns {Phaser.GameObjects.Graphics}
 */
export function stars(g, pts, color = 0xffffff) {
  if (!pts || pts.length === 0) return g;
  let current = -1;
  for (const [x, y, r, a] of pts) {
    const alpha = a ?? 1;
    if (alpha !== current) {
      g.fillStyle(color, alpha);
      current = alpha;
    }
    g.fillCircle(x, y, r);
  }
  return g;
}

// Indoor set, carried over from the shipped chapter so the indoor places keep
// the wall, ledge and window they had.

/**
 * A translucent back-wall wash from baseY - 250 down to baseY + 60. Carried
 * over unchanged from the shipped chapter (ch3Wall).
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} baseY the shelf line (opts.y)
 * @param {number} color
 * @param {number} [alpha=0.5]
 * @returns {Phaser.GameObjects.Graphics}
 */
export function wall(g, baseY, color, alpha = 0.5) {
  g.fillStyle(color, alpha);
  g.fillRect(0, baseY - 250, W, 310);
  return g;
}

/**
 * A rounded wooden ledge along the shelf line with a paper shadow below and a
 * thin highlight along its top. Carried over from the shipped chapter
 * (ch3Shelf) with the shadow drawn the paper way (black, offset down).
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} baseY the shelf line (opts.y)
 * @param {number} ledge wood colour
 * @param {number} [shadow=0x2a1c0c] kept for call compatibility; the shadow
 *   itself is the paper black at 0.22 like every other prop
 * @returns {Phaser.GameObjects.Graphics}
 */
export function shelf(g, baseY, ledge, shadow = 0x2a1c0c) {
  void shadow;
  paper(g, 0, 8, (gg, isShadow) => {
    ink(gg, isShadow, ledge, 1);
    gg.fillRoundedRect(40, baseY - 14, W - 80, 32, 9);
  });
  g.fillStyle(0xffffff, 0.12);
  g.fillRoundedRect(40, baseY - 14, W - 80, 9, 9);
  return g;
}

/**
 * A warm-lit window of daylight (no rays, a plain glowing pane with muntins).
 * One vertical and one horizontal muntin: a cross of muntins is a window
 * frame, not a symbol. Carried over from the shipped chapter (ch3Window).
 * @param {Phaser.GameObjects.Graphics} g
 * @param {number} baseY the shelf line (opts.y); the pane sits 24px above it
 * @param {number} cx centre x
 * @param {number} w pane width
 * @param {number} h pane height
 * @param {number} frame frame colour
 * @param {number} light pane colour
 * @param {number} [lightAlpha=0.5]
 * @returns {Phaser.GameObjects.Graphics}
 */
export function windowPane(g, baseY, cx, w, h, frame, light, lightAlpha = 0.5) {
  const x = cx - w / 2;
  const y = baseY - h - 24;
  paper(g, 4, 6, (gg, shadow) => {
    ink(gg, shadow, frame, 1);
    gg.fillRoundedRect(x - 10, y - 10, w + 20, h + 20, 14);
  });
  g.fillStyle(light, lightAlpha);
  g.fillRoundedRect(x, y, w, h, 8);
  g.lineStyle(6, frame, 1);
  g.lineBetween(cx, y, cx, y + h);
  g.lineBetween(x, y + h / 2, x + w, y + h / 2);
  return g;
}

// Map emitters. These run on the world map and may use Math.random (the only
// place in the chapter's art where randomness is allowed).

/**
 * One small mote rising from a map node and fading out. Carried over from
 * the shipped riseMote emitter (pollen, embers, steam). The scene's emitter
 * loop counts the returned object and listens for its destroy event.
 * @param {Phaser.Scene} scene
 * @param {{layers: Phaser.GameObjects.Container}} state map ambience state
 * @param {number} cx node centre x
 * @param {number} cy node centre y
 * @param {number[]} colors hex colours to pick from
 * @returns {Phaser.GameObjects.Arc}
 */
export function riseMote(scene, state, cx, cy, colors) {
  const p = scene.add.circle(
    cx + (Math.random() - 0.5) * 70, cy + 26,
    3, colors[Math.floor(Math.random() * colors.length)], 0.85
  );
  state.layers.add(p);
  scene.tweens.add({
    targets: p, y: '-=64', alpha: 0,
    duration: 2200, ease: 'Sine.easeOut', onComplete: () => p.destroy()
  });
  return p;
}

/**
 * One small mote drifting sideways across a map node and fading out (a
 * breeze, blown sand, a gull's glint). dir -1 drifts left, 1 drifts right,
 * 0 picks a side at random.
 * @param {Phaser.Scene} scene
 * @param {{layers: Phaser.GameObjects.Container}} state map ambience state
 * @param {number} cx node centre x
 * @param {number} cy node centre y
 * @param {number[]} colors hex colours to pick from
 * @param {number} [dir=0] -1, 1, or 0 for random
 * @returns {Phaser.GameObjects.Arc}
 */
export function driftMote(scene, state, cx, cy, colors, dir = 0) {
  const side = dir === 0 ? (Math.random() < 0.5 ? -1 : 1) : (dir < 0 ? -1 : 1);
  const p = scene.add.circle(
    cx - side * 50, cy + (Math.random() - 0.5) * 50,
    3, colors[Math.floor(Math.random() * colors.length)], 0.9
  );
  state.layers.add(p);
  scene.tweens.add({
    targets: p, x: cx + side * 60, alpha: 0,
    duration: 1600, ease: 'Sine.easeOut', onComplete: () => p.destroy()
  });
  return p;
}

// Average of two hex colours, channel by channel. Used only as the solid
// fallback under a gradient band.
function midColor(a, b) {
  const r = (((a >> 16) & 0xff) + ((b >> 16) & 0xff)) >> 1;
  const gch = (((a >> 8) & 0xff) + ((b >> 8) & 0xff)) >> 1;
  const bl = ((a & 0xff) + (b & 0xff)) >> 1;
  return (r << 16) | (gch << 8) | bl;
}
