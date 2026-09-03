// World 38, The Mountain. The finale: dusk, half past eight in the evening,
// the sky going violet at the top with the last warm afterglow low behind the
// peaks, and the city lighting up in the valley below.
//
// Wave 2 gives this place its own line: gondola cabins on the cable. Each red
// cabin rides across with the fact on its side, the bins are the platforms,
// and the pet waves cabins in. The big order is to get everyone loaded and
// the mountain's lights on before dark. Until that line lands the plank belt
// runs below this backdrop.
//
// Recognition cues, in plain words: the red gondola cabin on its cable heading
// down toward the city lights, the two brown bears in their fenced refuge,
// the wind turbine on the ridge (three straight blades), the chairlift with
// its little chairs, the city and the inlet spread out far below with the
// windows coming on, and the lit chalet on the summit. No people, no names.
//
// Everything is cut paper: flat planes with a hard offset shadow, rounded
// corners, no outlines, and no gradients except the small dusk sky on the
// node card (the scenes paint the big sky from bgTop and bgBottom). The
// horizon and the node are static and deterministic; the emitter at the
// bottom is the one place Math.random is allowed.
//
// Art rule for the turbine: three straight tapered blades and a round hub,
// plain shapes only, no spirals or sunbursts, no rays.

import { W, ink, paper, sky, haze, waterBand, ridge, treeline, tower, stars, riseMote } from './paper.js';

// Palette. Chapter anchors first (dusk, afterglow, ridge green, lamplight),
// then the mountain's own tints from the approved mock. Bases stay mid-tone
// because the belt lightens and darkens them.
const DUSK = 0x4a3a80;         // violet at the top of the sky, also the node card
const MAUVE = 0x8a5f98;        // the sky halfway down the node card
const ROSE = 0xd98a7a;         // the band just above the afterglow
const AFTERGLOW = 0xf0b489;    // the last warm light on the horizon
const CLOUD = 0x4a3f7a;        // the far bank of violet cloud
const INLET = 0x7a6aa8;        // the water below, catching the sky
const CITY = 0x2c2a55;         // the dark city plane
const TOWER = 0x35325f;        // the towers standing on it
const LAMP = 0xffe9a8;         // lamplight: windows, doors, platform lamps
const LAMP_OFF = 0x4a4670;     // a window still dark
const CITY_GLOW = 0xffd27a;    // the warm haze over the city
const CHALET_GLOW = 0xfff3b8;  // the chapter's finale cream, spilling from the chalet
const RIDGE = 0x2f4a3a;        // the two near ridges
const MOUNTAIN = 0x2b4636;     // the node's one big peak
const TREE = 0x1f3a2a;
const STEEL = 0x8a8fa8;        // chairlift posts
const POST = 0x9aa0b8;         // chair bars and platform lamp posts
const LIFT_CABLE = 0xd8d4ee;
const CHAIR = 0xe8e0f0;
const MAST = 0xe9ecf2;
const HOUSING = 0xd5d9e2;
const BLADE = 0xf5f7fa;
const CHALET = 0x6b4a34;
const ROOF = 0x3d2b20;
const PAD = 0x3b5a48;          // the chalet's ground pad and the platform edge
const PEN = 0x4f6b3f;          // the bears' grassy pen
const FENCE = 0xb89a72;
const RAIL = 0xd8bd93;
const BEAR = 0x6b4a2e;
const MUZZLE = 0xa8845c;
const BEAR_DARK = 0x2a1c12;
const PAW = 0x5a3d26;
const GONDOLA_CABLE = 0xc9c3e0;
const HANGER = 0x3a3a4a;
const CABIN = 0xd94a3a;        // the red gondola cabin
const CABIN_GLASS = 0xbfe3f5;
const GROUND = 0x223829;       // the platform floor
const STAR = 0xe8e4ff;
const COOL_MOTES = [0xc9c3e0, 0xe8e4ff, 0xbfe3f5];

// A row of rounded boxes cut from one sheet: the row's shadows go down as one
// pass, then the row. boxes are [x, y, w, h].
function boxRow(g, dx, dy, color, boxes, r) {
  paper(g, dx, dy, (gg, s) => {
    ink(gg, s, color);
    for (const [x, y, w, h] of boxes) gg.fillRoundedRect(x, y, w, h, r);
  });
}

// A row of soft ellipses the same way (the far cloud bank). items are [cx, cy, rx, ry].
function ellipseRow(g, dx, dy, color, items) {
  paper(g, dx, dy, (gg, s) => {
    ink(gg, s, color);
    for (const [cx, cy, rx, ry] of items) gg.fillEllipse(cx, cy, rx * 2, ry * 2);
  });
}

// A closed polygon from [x, y] points, for the tapered mast.
function poly(gg, pts) {
  gg.beginPath();
  gg.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) gg.lineTo(pts[i][0], pts[i][1]);
  gg.closePath();
  gg.fillPath();
}

// One straight tapered blade: a thin triangle from the hub to the tip.
function blade(gg, hx, hy, tx, ty, halfW) {
  const len = Math.hypot(tx - hx, ty - hy) || 1;
  const nx = -(ty - hy) / len * halfW;
  const ny = (tx - hx) / len * halfW;
  gg.fillTriangle(hx + nx, hy + ny, hx - nx, hy - ny, tx, ty);
}

// The wind turbine on the ridge: a tapered mast, a small housing, three
// straight blades set 120 degrees apart, and a round hub. Plain shapes only,
// no spirals or sunbursts, no rays. k scales the widths (1 in the scene, 0.3
// on the node). The hub is white: on the node it is the one white highlight.
function turbine(g, x, baseY, mastH, bladeL, k) {
  const hy = baseY - mastH;
  paper(g, 3 * k, 4 * k, (gg, s) => {
    ink(gg, s, MAST);
    poly(gg, [[x - 8 * k, baseY], [x + 8 * k, baseY], [x + 4 * k, hy], [x - 4 * k, hy]]);
    ink(gg, s, HOUSING);
    gg.fillRoundedRect(x - 16 * k, hy - 8 * k, 32 * k, 16 * k, 6 * k);
    ink(gg, s, BLADE);
    blade(gg, x, hy, x, hy - bladeL, 6 * k);
    blade(gg, x, hy, x + bladeL * 0.866, hy + bladeL * 0.5, 6 * k);
    blade(gg, x, hy, x - bladeL * 0.866, hy + bladeL * 0.5, 6 * k);
  });
  g.fillStyle(0xffffff, 1);
  g.fillCircle(x, hy, 8 * k);
}

// The lit chalet on the summit: a warm glow, a ground pad and a door (scene
// only), the body, a rounded roof and a row of lit windows. n is the number
// of windows and k scales the details (1 in the scene, 0.2 on the node).
function chalet(g, x, groundY, w, h, roofH, n, k) {
  const top = groundY - h;
  g.fillStyle(CHALET_GLOW, 0.2);
  g.fillEllipse(x, groundY - 8 * k, 300 * k, 120 * k);
  if (k >= 0.5) {
    g.fillStyle(PAD, 1);
    g.fillRoundedRect(x - 100 * k, groundY - 6 * k, 200 * k, 14 * k, 6 * k);
  }
  boxRow(g, 4 * k, 6 * k, CHALET, [[x - w / 2, top, w, h]], 10 * k);
  ridge(g, [[x - w / 2 - 12 * k, top + 6 * k], [x + w / 2 + 12 * k, top + 6 * k], [x, top - roofH]], ROOF, 4 * k, 6 * k, 5 * k);
  const ww = 20 * k;
  const gap = 12 * k;
  const x0 = x - (n * ww + (n - 1) * gap) / 2;
  g.fillStyle(LAMP, 1);
  for (let i = 0; i < n; i++) g.fillRoundedRect(x0 + i * (ww + gap), top + 16 * k, ww, 22 * k, 4 * k);
  if (k >= 0.5) g.fillRoundedRect(x - 9 * k, groundY - 24 * k, 18 * k, 24 * k, 4 * k);
}

// A plain brown bear: body, head and two round ears in one paper pass, then a
// lighter muzzle, a dark nose and eye, and two legs. (bx, by) is the body
// centre, k the size, dir 1 to face right or -1 to face left.
function bear(g, bx, by, k, dir) {
  const hx = bx + dir * 36 * k;
  const hy = by - 23 * k;
  paper(g, 3, 4, (gg, s) => {
    ink(gg, s, BEAR);
    gg.fillEllipse(bx, by, 80 * k, 52 * k);
    gg.fillCircle(hx, hy, 19 * k);
    gg.fillCircle(hx - 11 * k, hy - 15 * k, 8 * k);
    gg.fillCircle(hx + 11 * k, hy - 15 * k, 8 * k);
  });
  g.fillStyle(MUZZLE, 1);
  g.fillEllipse(hx + dir * 10 * k, hy + 4 * k, 18 * k, 12 * k);
  g.fillStyle(BEAR_DARK, 1);
  g.fillCircle(hx + dir * 15 * k, hy + 3 * k, 3 * k);
  g.fillCircle(hx + dir * 2 * k, hy - 5 * k, 2.2 * k);
  g.fillStyle(PAW, 1);
  g.fillRoundedRect(bx - 28 * k, by + 16 * k, 15 * k, 14 * k, 4 * k);
  g.fillRoundedRect(bx + 8 * k, by + 16 * k, 15 * k, 14 * k, 4 * k);
}

// A gondola cable from (x1, y1) to (x2, y2) with one red cabin hanging at
// fraction t along it: a short hanger, the cabin, its window, one lamp. s is
// the cabin size; k scales the cable width and the shadow.
function gondola(g, x1, y1, x2, y2, t, s, k) {
  const cx = x1 + (x2 - x1) * t;
  const cy = y1 + (y2 - y1) * t;
  const top = cy + s * 0.45;
  g.lineStyle(4 * k, GONDOLA_CABLE, 1);
  g.lineBetween(x1, y1, x2, y2);
  g.lineStyle(4 * k, HANGER, 1);
  g.lineBetween(cx, cy, cx, top);
  boxRow(g, 4 * k, 6 * k, CABIN, [[cx - s / 2, top, s, s]], s * 0.2);
  g.fillStyle(CABIN_GLASS, 1);
  g.fillRoundedRect(cx - s * 0.36, top + s * 0.2, s * 0.72, s * 0.36, s * 0.14);
  g.fillStyle(LAMP, 1);
  g.fillCircle(cx + s * 0.29, top + s * 0.71, s * 0.14);
}

// Which city windows are on: a fixed pattern per tower so the skyline never changes.
function windowRule(t, i, j) {
  const v = (t * 5 + i * 7 + j * 3) % 6;
  if (v < 4) return 'lit';
  return v === 4 ? 'dark' : 'skip';
}

export const world38 = {
  id: 38,
  // Dusk violet over afterglow. The belt scene lifts these toward daylight;
  // the play scene paints them as they are.
  bgTop: DUSK,
  bgBottom: AFTERGLOW,

  drawHorizon(scene, opts) {
    const g = scene.add.graphics().setDepth(2);
    const baseY = opts.y;
    // The afterglow: a warm translucent band low on the sky, the first stars above it.
    haze(g, baseY - 240, 116, AFTERGLOW, 0.16);
    stars(g, [[120, baseY - 342, 3, 0.6], [300, baseY - 302, 2, 0.5], [520, baseY - 346, 2.5, 0.6], [760, baseY - 318, 2, 0.5]]);
    // A far bank of violet cloud along the horizon, then the inlet catching the last light.
    ellipseRow(g, 0, 4, CLOUD, [[180, baseY - 134, 260, 22], [600, baseY - 134, 300, 26], [980, baseY - 134, 220, 20]]);
    waterBand(g, baseY - 134, 50, INLET);
    g.fillStyle(AFTERGLOW, 0.6);
    g.fillRect(0, baseY - 128, W, 4);
    // The city below: a dark plane with a warm glow over it.
    paper(g, 0, 8, (gg, s) => { ink(gg, s, CITY); gg.fillRect(0, baseY - 88, W, 90); });
    g.fillStyle(CITY_GLOW, 0.2);
    g.fillEllipse(600, baseY - 10, 480, 68);
    // One cabin on its way down from the chalet toward the city lights. The
    // cable starts behind the chalet and dives behind the towers.
    gondola(g, 830, baseY - 150, 560, baseY - 92, 0.45, 26, 1);
    // Seven towers with their windows coming on.
    const towers = [[480, 71, 22], [509, 92, 29], [545, 58, 19], [570, 105, 34], [611, 78, 24], [642, 95, 31], [679, 65, 20]];
    towers.forEach(([x, h, w], t) => tower(g, x + w / 2, baseY - 10, w, h, TOWER, {
      radius: 4, dx: 3, dy: 4,
      windows: { cols: w >= 28 ? 2 : 1, rows: Math.floor((h - 14) / 16), size: 6, gap: 10, lit: LAMP, dark: LAMP_OFF, rule: (i, j) => windowRule(t, i, j) }
    }));
    // Two dark green ridges leaning apart, with trees on their shoulders.
    ridge(g, [[0, baseY - 180], [90, baseY - 140], [200, baseY - 100], [320, baseY - 32], [430, baseY], [430, baseY + 30], [0, baseY + 30]], RIDGE, 6, 8, 9);
    ridge(g, [[W, baseY - 200], [980, baseY - 170], [900, baseY - 140], [780, baseY - 100], [700, baseY - 50], [650, baseY], [650, baseY + 30], [W, baseY + 30]], RIDGE, -6, 8, 9);
    treeline(g, [[56, baseY - 155, 36, 44], [140, baseY - 122, 36, 44], [1046, baseY - 190, 36, 44], [664, baseY - 14, 36, 44], [296, baseY - 45, 48, 56], [334, baseY - 28, 44, 50]], TREE);
    // The chairlift on the left shoulder: two posts, a cable, three chairs on hangers.
    boxRow(g, 4, 6, STEEL, [[27, baseY - 229, 6, 62], [201, baseY - 128, 6, 30]], 2);
    g.lineStyle(4, LIFT_CABLE, 1);
    g.lineBetween(-10, baseY - 252, 310, baseY - 66);
    g.lineStyle(3, LIFT_CABLE, 1);
    const chairs = [[72, baseY - 178], [162, baseY - 126], [242, baseY - 79]];
    for (const [x, y] of chairs) g.lineBetween(x + 18, y - 16, x + 18, y);
    boxRow(g, 4, 3, CHAIR, chairs.map(([x, y]) => [x, y, 36, 14]), 5);
    g.fillStyle(POST, 1);
    for (const [x, y] of chairs) g.fillRect(x, y, 36, 4);
    // The turbine on the right ridge and the lit chalet beside it.
    turbine(g, 990, baseY - 172, 110, 62, 1);
    chalet(g, 874, baseY - 102, 164, 58, 46, 5, 1);
    // The bear refuge at the foot of the left ridge: a grassy pen, a big bear
    // looking right, a little one looking left, a post-and-rail fence in front.
    boxRow(g, 4, 6, PEN, [[260, baseY - 36, 210, 30]], 12);
    bear(g, 322, baseY - 36, 1, 1);
    bear(g, 436, baseY - 34, 0.75, -1);
    boxRow(g, 2, 3, FENCE, [267, 300, 333, 380, 424, 462].map((x) => [x, baseY - 48, 6, 34]), 2);
    g.lineStyle(4, RAIL, 1);
    g.lineBetween(268, baseY - 38, 468, baseY - 38);
    g.lineBetween(268, baseY - 24, 468, baseY - 24);
    // A shallow platform floor with a lighter edge: the deck the belt runs over.
    g.fillStyle(GROUND, 1);
    g.fillRect(0, baseY, W, 56);
    g.fillStyle(PAD, 1);
    g.fillRect(0, baseY, W, 6);
    return g;
  },

  drawNode(scene, c, _scale) {
    const g = scene.add.graphics();
    // Ground shadow, then the dusk card: violet at the top running down to the afterglow.
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(0, 58, 140, 22);
    boxRow(g, 4, 5, DUSK, [[-70, -72, 140, 122]], 18);
    sky(g, -70, -50, 140, 82, [[0, DUSK], [0.45, MAUVE], [0.8, ROSE], [1, AFTERGLOW]]);
    stars(g, [[-48, -56, 1.8, 0.9], [20, -60, 1.5, 0.9], [50, -44, 1.8, 0.9], [-16, -40, 1.2, 0.9]], STAR);
    // A far cloud, the inlet with its glint, the ground sheet overhanging the card, the city glow.
    g.fillStyle(CLOUD, 1);
    g.fillEllipse(56, 2, 52, 10);
    boxRow(g, 2, 3, INLET, [[32, 2, 40, 18]], 4);
    g.fillStyle(AFTERGLOW, 0.5);
    g.fillRoundedRect(36, 5, 32, 2, 1);
    boxRow(g, 0, 5, GROUND, [[-80, 24, 160, 26]], 10);
    g.fillStyle(CITY_GLOW, 0.2);
    g.fillEllipse(56, 22, 48, 12);
    // The city towers with their windows on.
    boxRow(g, 2, 2, TOWER, [[40, 12, 6, 14], [48, 4, 8, 22], [58, 10, 6, 16], [66, 16, 5, 10]], 1.5);
    g.fillStyle(LAMP, 1);
    for (const [x, y] of [[42, 15], [42, 20], [50, 7], [54, 7], [50, 13], [54, 18], [60, 13], [60, 19], [68, 18]]) g.fillRect(x, y, 2, 3);
    // The mountain, trees on its shoulders, the turbine on the left ridge, the lit chalet on top.
    ridge(g, [[-90, 50], [-72, 10], [-54, -6], [-38, 0], [-20, -48], [8, -48], [24, -14], [40, 50]], MOUNTAIN, 4, 6, 5);
    treeline(g, [[-74, 16, 10, 12], [-60, 4, 10, 12], [-30, -6, 10, 12], [20, -4, 10, 12]], TREE);
    turbine(g, -54, -6, 26, 13, 0.3);
    chalet(g, -5, -46, 26, 14, 10, 3, 0.2);
    // One cabin on its way down the cable toward the city lights, and two platform lamps.
    gondola(g, 10, -48, 76, 22, 0.545, 14, 0.5);
    boxRow(g, 1, 2, POST, [[-71, 28, 2, 10], [-35, 28, 2, 10]], 1);
    g.fillStyle(LAMP, 1);
    g.fillCircle(-70, 27, 3);
    g.fillCircle(-34, 27, 3);
    c.add(g);
  },

  emit(scene, state, cx, cy) {
    // Mostly the first city lights blinking on low on the node: a warm dot
    // pops in, holds a moment, and goes again. Now and then a cool mote rises
    // off the peak instead.
    if (Math.random() < 0.3) return riseMote(scene, state, cx, cy - 40, COOL_MOTES);
    const p = scene.add.circle(cx + (Math.random() - 0.5) * 110, cy + 18 + Math.random() * 30, 2.5, LAMP, 0);
    p.setScale(0.3);
    state.layers.add(p);
    scene.tweens.add({
      targets: p, alpha: 1, scale: 1.3,
      duration: 240, hold: 700 + Math.random() * 600, yoyo: true,
      ease: 'Sine.easeInOut', onComplete: () => p.destroy()
    });
    return p;
  }
};
