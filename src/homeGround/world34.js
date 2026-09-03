// World 34, The Beach. Mid-afternoon, full sun, the tide way out.
//
// Wave 2 gives this place its own line: the concession window. Snack trays
// (fries, ice cream, corn) slide along the snack-shack counter with an order
// card carrying the fact, the bins are the family blankets on the sand, and
// the pet hands trays through the window. Until that lands the plank belt
// runs below this backdrop.
//
// Recognition cues, in plain words: the tide out so far the sandbars go on
// and on, tide pools left behind on the flat, the row of driftwood logs the
// family sits on, the mountains across the water with the city towers off to
// the right, the lifeguard tower, a kite on a long string, one gull, and the
// afternoon sun. Everything is cut paper: flat planes with a hard offset
// shadow, rounded corners, no outlines, and no gradients (the scene paints
// the sky from bgTop and bgBottom).
//
// Art rule for the sun: a soft ellipse glow under a plain disc, plain shapes
// only, no spirals or sunbursts, no rays.

import { ink, inkLine, paper, haze, ridge, waterBand, sandFlat } from './paper.js';

// Palette. Chapter anchors first (water, sun, sand, driftwood, awning red),
// then the beach's own tints from the approved mock.
const WATER = 0x3a8fb5;
const SUN = 0xffe08a;
const SAND = 0xefe0b0;
const LOG = 0xb08a5c;
const ROOF = 0xe8594a;
const WET_SAND = 0xd9c48d;
const SANDBAR = 0xf2e5b8;
const POOL = 0x7fc4dc;
const FOAM = 0xcfeaf5;
const LOG_LIGHT = 0xd4b184;
const LOG_RING = 0xd9b98a;
const LOG_CORE = 0xa17a4c;
const FAR_HILL = 0xa9c4dc;
const NEAR_HILL = 0x8fb0c9;
const CITY = 0xb9c9d9;
const KITE = 0xff6f61;
const CABIN = 0xf4f1e6;
const POST = 0x8a6a48;
const GULL = 0xf4f6f8;
const SKY_CARD = 0xa9dcf5;
const GRAINS = [0xf2e5b8, 0xe2c48c, 0xfff8e7];

// A row of rounded boxes cut from one sheet: the row's shadows go down as one
// pass, then the row. boxes are [x, y, w, h].
function boxRow(g, dx, dy, color, boxes, r) {
  paper(g, dx, dy, (gg, shadow) => {
    ink(gg, shadow, color);
    for (const [x, y, w, h] of boxes) gg.fillRoundedRect(x, y, w, h, r);
  });
}

// A row of soft hills, the same way. hills are [cx, cy, rx, ry].
function humpRow(g, dx, dy, color, hills) {
  paper(g, dx, dy, (gg, shadow) => {
    ink(gg, shadow, color);
    for (const [cx, cy, rx, ry] of hills) gg.fillEllipse(cx, cy, rx * 2, ry * 2);
  });
}

// The diamond kite: two triangles with a paper shadow, then thin gold spars
// on top. Sharp points on purpose, a kite is the one prop that is not rounded.
function kite(g, cx, top, halfW, halfH, dx, dy, sparW) {
  const mid = top + halfH;
  const bot = top + halfH * 2;
  paper(g, dx, dy, (gg, shadow) => {
    ink(gg, shadow, KITE);
    gg.fillTriangle(cx, top, cx + halfW, mid, cx - halfW, mid);
    gg.fillTriangle(cx, bot, cx + halfW, mid, cx - halfW, mid);
  });
  g.lineStyle(sparW, SUN, 1);
  g.lineBetween(cx, top, cx, bot);
  g.lineBetween(cx - halfW, mid, cx + halfW, mid);
}

// Map ambience: a gull crossing high over the node, two short pale strokes
// that drift across and fade. Rare, so the sand grains stay the main mote.
function gull(scene, state, cx, cy) {
  const dir = Math.random() < 0.5 ? -1 : 1;
  const g = scene.add.graphics();
  g.lineStyle(2, GULL, 1);
  g.lineBetween(-7, 2, 0, -2);
  g.lineBetween(0, -2, 7, 2);
  g.setPosition(cx - dir * 70, cy - 60 - Math.random() * 20);
  state.layers.add(g);
  scene.tweens.add({
    targets: g, x: cx + dir * 70, alpha: 0,
    duration: 3400, ease: 'Sine.easeInOut', onComplete: () => g.destroy()
  });
  return g;
}

export const world34 = {
  id: 34,
  // Full afternoon blue. The belt scene lifts these toward daylight; the play
  // scene paints them as they are.
  bgTop: 0x3f96d2,
  bgBottom: 0xa8d8ef,

  drawHorizon(scene, opts) {
    const g = scene.add.graphics().setDepth(2);
    const baseY = opts.y;
    // A faint bright haze low over the water so the far hills sit back.
    haze(g, baseY - 230, 130, 0xe6f4fb, 0.14);
    // The sun, left: soft glow, shadowed disc, one small highlight, no rays.
    g.fillStyle(SUN, 0.3);
    g.fillEllipse(200, baseY - 292, 260, 210);
    paper(g, 4, 6, (gg, s) => { ink(gg, s, SUN); gg.fillCircle(200, baseY - 292, 46); });
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(186, baseY - 306, 9);
    // One gull, two short strokes, mid sky.
    g.lineStyle(4, GULL, 1);
    g.lineBetween(590, baseY - 304, 606, baseY - 312);
    g.lineBetween(606, baseY - 312, 622, baseY - 304);
    // Across the water: rounded peaks leaning apart, soft hills, the city towers to the right.
    ridge(g, [[140, baseY - 100], [300, baseY - 210], [460, baseY - 100]], FAR_HILL, -6, 8, 14);
    ridge(g, [[420, baseY - 100], [570, baseY - 240], [720, baseY - 100]], FAR_HILL, 6, 8, 14);
    humpRow(g, 4, 6, FAR_HILL, [[150, baseY - 100, 230, 80], [720, baseY - 100, 200, 70]]);
    humpRow(g, 4, 6, NEAR_HILL, [[60, baseY - 96, 160, 60], [330, baseY - 96, 190, 70], [600, baseY - 96, 170, 55]]);
    boxRow(g, 3, 4, CITY, [[800, baseY - 156, 18, 60], [826, baseY - 186, 24, 90], [858, baseY - 166, 20, 70],
      [886, baseY - 206, 26, 110], [920, baseY - 160, 18, 64], [946, baseY - 180, 22, 84], [976, baseY - 146, 16, 50],
      [1000, baseY - 168, 24, 72], [1032, baseY - 140, 18, 44]], 4);
    // The kite flies in front of the far city, a zigzag tail with three bows.
    kite(g, 840, baseY - 340, 48, 52, 4, 6, 4);
    const tail = [[840, 236], [828, 206], [846, 176], [832, 146]];
    g.lineStyle(3, SUN, 1);
    for (let i = 1; i < tail.length; i++) g.lineBetween(tail[i - 1][0], baseY - tail[i - 1][1], tail[i][0], baseY - tail[i][1]);
    g.fillStyle(WATER, 1);
    for (const [bx, by] of tail.slice(1)) g.fillCircle(bx, baseY - by, 7);
    // The flat: wet sand, cream sandbars, tide pools, dry sand as the shallow floor; the sea laid on top.
    sandFlat(g, baseY - 70, 126, SAND, WET_SAND, {
      wetH: 62, barColor: SANDBAR, poolColor: POOL,
      bars: [[-10, baseY - 48, 220, 10], [270, baseY - 40, 240, 10], [580, baseY - 30, 190, 10], [820, baseY - 44, 250, 10]],
      pools: [[140, baseY - 18, 85, 8], [440, baseY - 10, 95, 9], [720, baseY - 8, 70, 8], [980, baseY - 16, 60, 7]]
    });
    waterBand(g, baseY - 100, 30, WATER, { glints: [[40, 400], [600, 440]], glintY: 6 });
    // The last wave's edge on the wet sand, then the kite string down to a log.
    g.fillStyle(POOL, 0.7);
    g.fillRoundedRect(40, baseY - 58, 440, 4, 2);
    g.fillRoundedRect(560, baseY - 53, 520, 4, 2);
    g.lineStyle(2, 0xffffff, 0.7);
    g.lineBetween(840, baseY - 236, 640, baseY - 2);
    // The lifeguard tower: posts with a brace and deck rail, cabin with window, red roof.
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, POST);
      gg.fillRect(120, baseY - 60, 10, 60);
      gg.fillRect(200, baseY - 60, 10, 60);
      inkLine(gg, s, 5, POST);
      gg.lineBetween(125, baseY - 40, 205, baseY - 2);
      inkLine(gg, s, 5, CABIN);
      gg.lineBetween(100, baseY - 60, 232, baseY - 60);
    });
    boxRow(g, 4, 6, CABIN, [[110, baseY - 120, 112, 60]], 8);
    g.fillStyle(WATER, 1);
    g.fillRoundedRect(135, baseY - 104, 62, 26, 4);
    boxRow(g, 4, 6, ROOF, [[98, baseY - 136, 136, 22]], 8);
    // The row of driftwood logs: a light strip along each and a ring on the cut end.
    const logs = [[30, baseY, 270], [330, baseY + 4, 200], [560, baseY - 2, 260], [850, baseY + 3, 210]];
    boxRow(g, 4, 6, LOG, logs.map(([x, y, w]) => [x, y, w, 26]), 13);
    for (const [x, y, w] of logs) {
      g.fillStyle(LOG_LIGHT, 1);
      g.fillRoundedRect(x + 20, y + 6, w - 40, 6, 3);
      g.fillStyle(LOG_RING, 1);
      g.fillCircle(x + 13, y + 13, 13);
      g.fillStyle(LOG_CORE, 1);
      g.fillCircle(x + 13, y + 13, 6);
    }
    return g;
  },

  drawNode(scene, c, _scale) {
    const g = scene.add.graphics();
    // Ground shadow, then the sky card, then the planes back to front.
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(0, 58, 136, 22);
    boxRow(g, 4, 5, SKY_CARD, [[-75, -68, 150, 120]], 18);
    // Sun top left, with the node's one white highlight.
    g.fillStyle(SUN, 1);
    g.fillCircle(-40, -42, 12);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(-44, -46, 4);
    // Hills across the water and the city towers off to the right.
    humpRow(g, 3, 4, NEAR_HILL, [[-30, -6, 40, 22], [20, -6, 50, 28], [52, -4, 22, 14]]);
    g.fillStyle(0xc9d8e6, 1);
    for (const [x, y, w, h] of [[32, -22, 8, 14], [42, -30, 10, 22], [54, -22, 8, 14], [64, -18, 6, 10]]) g.fillRoundedRect(x, y, w, h, 2);
    // The sea, then the sand sheet overhanging the card, one sandbar, one pool.
    boxRow(g, 3, 4, WATER, [[-74, -8, 148, 20]], 8);
    g.fillStyle(FOAM, 0.7);
    g.fillRoundedRect(-66, -4, 132, 3, 1.5);
    boxRow(g, 3, 5, 0xecd9a6, [[-78, 8, 156, 34]], 12);
    g.fillStyle(0xf5e8bd, 1);
    g.fillRoundedRect(-60, 14, 60, 6, 3);
    g.fillStyle(POOL, 1);
    g.fillEllipse(22, 24, 44, 12);
    g.fillStyle(FOAM, 0.8);
    g.fillEllipse(18, 23, 20, 3);
    // Three logs, the lifeguard tower, and the kite over the top edge.
    boxRow(g, 2, 4, LOG, [[-70, 34, 50, 12], [-12, 34, 52, 12], [48, 34, 28, 12]], 6);
    g.fillStyle(LOG_LIGHT, 1);
    for (const [x, w] of [[-62, 34], [-4, 36], [56, 12]]) g.fillRoundedRect(x, 37, w, 3, 1.5);
    g.fillStyle(POST, 1);
    g.fillRect(-56, 0, 4, 24);
    g.fillRect(-36, 0, 4, 24);
    boxRow(g, 2, 3, CABIN, [[-64, -20, 40, 22]], 4);
    g.fillStyle(WATER, 1);
    g.fillRoundedRect(-54, -14, 20, 9, 2);
    boxRow(g, 2, 3, ROOF, [[-68, -26, 48, 8]], 4);
    kite(g, 28, -74, 14, 20, 2, 3, 2);
    g.lineStyle(1.5, SUN, 1);
    g.lineBetween(28, -34, 22, -16);
    g.fillStyle(WATER, 1);
    g.fillCircle(24, -24, 2.5);
    g.fillCircle(22, -16, 2.5);
    c.add(g);
  },

  emit(scene, state, cx, cy) {
    // Mostly slow sand grains blowing along the flat near the bottom of the
    // node; now and then a gull crosses high over it instead.
    if (Math.random() < 0.15) return gull(scene, state, cx, cy);
    const dir = Math.random() < 0.5 ? -1 : 1;
    const p = scene.add.circle(
      cx - dir * 55, cy + 20 + Math.random() * 30,
      2.5, GRAINS[Math.floor(Math.random() * GRAINS.length)], 0.9
    );
    state.layers.add(p);
    scene.tweens.add({
      targets: p, x: cx + dir * 65, y: '-=6', alpha: 0,
      duration: 2600 + Math.random() * 600, ease: 'Sine.easeInOut', onComplete: () => p.destroy()
    });
    return p;
  }
};
