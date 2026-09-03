// World 36, The Bread Place. Six in the evening, the bakery's last hour: warm
// amber light coming in low through the big window, long shadows on the
// counter. Wave 2 gives it the boxing counter as its line: a kraft bread box
// with a bakery tag carrying the fact, the loaf in the box window is blueberry
// bread, the bins are the paper-bag shelf, and the pet ties the string. The
// Hot Pot food crate spawns on this counter exactly as shipped and is drawn
// elsewhere; nothing here may look like it.
//
// Cues, in plain words: wooden shelves of loaves, the purple-flecked blueberry
// loaf, flour-dusted sourdough rounds, a big window onto the plaza, the giant
// bird sculptures out on the plaza seen through the glass, and kraft paper
// bags tied with string. No people. No names anywhere.
//
// Paper Cutout rules apply: every prop goes through paper() so it gets the
// hard offset shadow, rounded corners, no outlines, no gradients except the
// small sky patch in the window. Plain shapes only, no spirals or sunbursts,
// no rays. Static and deterministic in the horizon and the node; the flour
// motes at the bottom are the one place Math.random is allowed.

import { ink, paper, sky, haze, wall, shelf, windowPane } from './paper.js';

// Palette. Bases stay mid-tone because the belt lightens and darkens them.
const CARD = 0xe4a262;        // the node's sky card, the same early-evening amber
const PLASTER = 0xf6e2c6;     // warm plaster back wall (laid translucent)
const WOOD = 0x8f5634;        // rack uprights and planks
const LEDGE = 0xa8663c;       // the counter, a little lighter where the light lands
const FRAME = 0x5a3a26;       // window frame and muntins
const PLAZA = 0xd9c7ae;       // plaza stone seen through the window
const SCULPT = 0xf4efe6;      // the pale bird sculptures
const BEAK = 0xf0a050;
const PLINTH = 0xa9a29a;
const CRUST = 0xd9a05a;       // golden crust
const BERRY_CRUST = 0xc98a52; // the blueberry loaf bakes a shade darker
const BERRY = 0x6a4fa0;       // blueberry purple, an art motif only
const FLOUR = 0xfff0d6;
const KRAFT = 0xd8b07a;
const KRAFT_FOLD = 0xb88a55;
const STRING = 0xfff8e7;
const FLOUR_MOTES = [0xfff8e7, 0xffe9c4, 0xffd1a8];

// Where the purple flecks sit on a blueberry loaf, as fractions of its width
// and height. Fixed so the same loaf always looks the same.
const FLECKS = [[0.18, 0.4], [0.36, 0.66], [0.5, 0.3], [0.66, 0.6], [0.84, 0.38], [0.3, 0.82]];

// A long loaf lying on a shelf: a rounded lozenge with three pale score marks.
// x is the centre, y the shelf line it rests on. berry makes it blueberry bread.
function loaf(g, x, y, w, h, crust, berry) {
  paper(g, 4, 6, (gg, s) => {
    ink(gg, s, crust);
    gg.fillRoundedRect(x - w / 2, y - h, w, h, h / 2);
  });
  g.fillStyle(FLOUR, 0.55);
  for (let k = -1; k <= 1; k++) g.fillRoundedRect(x + k * w * 0.22 - 2, y - h + 5, 4, h * 0.42, 2);
  if (berry) {
    g.fillStyle(BERRY, 1);
    for (const [fx, fy] of FLECKS) g.fillCircle(x - w / 2 + w * fx, y - h + h * fy, 3);
  }
}

// A sourdough round: a dome with a dusting of flour on the crown.
function sourdough(g, x, y, w, h) {
  const r = Math.min(h * 0.85, w / 2);
  paper(g, 4, 6, (gg, s) => {
    ink(gg, s, CRUST);
    gg.fillRoundedRect(x - w / 2, y - h, w, h, { tl: r, tr: r, bl: 8, br: 8 });
  });
  g.fillStyle(FLOUR, 0.6);
  g.fillEllipse(x, y - h * 0.62, w * 0.5, h * 0.3);
}

// A kraft paper bag standing on a shelf, top folded over and tied with string.
function bag(g, x, y, w, h) {
  paper(g, 4, 6, (gg, s) => {
    ink(gg, s, KRAFT);
    gg.fillRoundedRect(x - w / 2, y - h, w, h, 7);
  });
  g.fillStyle(KRAFT_FOLD, 1);
  g.fillRoundedRect(x - w / 2, y - h, w, 12, 5);
  g.lineStyle(3, STRING, 1);
  g.lineBetween(x - w / 2, y - h + 20, x + w / 2, y - h + 20);
  g.lineBetween(x + w * 0.2, y - h + 20, x + w * 0.34, y - h + 42);
}

// One of the giant bird sculptures out on the plaza: a plinth, an egg of a
// body, a neck and a round head, a small beak. Plain shapes, k scales it.
function bird(g, x, groundY, k) {
  paper(g, 4, 6, (gg, s) => {
    ink(gg, s, PLINTH);
    gg.fillRoundedRect(x - 26 * k, groundY - 14 * k, 52 * k, 14 * k, 4);
    ink(gg, s, SCULPT);
    gg.fillEllipse(x, groundY - 40 * k, 70 * k, 44 * k);
    gg.fillRoundedRect(x - 32 * k, groundY - 70 * k, 14 * k, 34 * k, 6 * k);
    gg.fillCircle(x - 30 * k, groundY - 68 * k, 15 * k);
  });
  g.fillStyle(BEAK, 1);
  g.fillTriangle(x - 44 * k, groundY - 72 * k, x - 44 * k, groundY - 63 * k, x - 60 * k, groundY - 68 * k);
}

// A wooden rack between x0 and x1: two uprights and two planks, drawn in one
// paper pass so the shadows land together.
function rack(g, x0, x1, baseY) {
  paper(g, 4, 6, (gg, s) => {
    ink(gg, s, WOOD);
    gg.fillRoundedRect(x0, baseY - 246, 14, 232, 5);
    gg.fillRoundedRect(x1 - 14, baseY - 246, 14, 232, 5);
    for (const y of [baseY - 200, baseY - 110]) gg.fillRoundedRect(x0, y, x1 - x0, 14, 5);
  });
}

export const world36 = {
  id: 36,
  bgTop: 0xd9904e,
  bgBottom: 0xf4c78e,

  drawHorizon(scene, opts) {
    const g = scene.add.graphics().setDepth(2);
    const baseY = opts.y;
    // Warm plaster back wall over the scene's own sky, with a band of low
    // evening glow along the shelves. Both translucent, never a full sheet.
    wall(g, baseY, PLASTER, 0.5);
    haze(g, baseY - 130, 116, 0xffb070, 0.14);

    // The big window onto the plaza. windowPane gives the frame; the view is
    // painted over its pane: a small patch of evening sky, the plaza stone,
    // the two giant bird sculptures, then the muntins struck again on top so
    // it reads as looking out through the glass.
    const wx = 540, ww = 500, wh = 168;
    const px = wx - ww / 2, py = baseY - wh - 24;
    windowPane(g, baseY, wx, ww, wh, FRAME, 0xf7c98e, 1);
    sky(g, px, py, ww, wh, [[0, 0xe9a35e], [1, 0xfad3a0]]);
    g.fillStyle(PLAZA, 1);
    g.fillRect(px, py + wh - 40, ww, 40);
    bird(g, 420, baseY - 50, 1);
    bird(g, 662, baseY - 50, 0.8);
    g.lineStyle(6, FRAME, 1);
    g.lineBetween(wx, py, wx, py + wh);
    g.lineBetween(px, py + wh / 2, px + ww, py + wh / 2);

    // Left rack: long loaves on the top plank (the second one is blueberry
    // bread), sourdough rounds on the lower plank.
    rack(g, 60, 250, baseY);
    loaf(g, 112, baseY - 200, 76, 30, CRUST, false);
    loaf(g, 198, baseY - 200, 76, 30, BERRY_CRUST, true);
    sourdough(g, 108, baseY - 110, 64, 44);
    sourdough(g, 200, baseY - 110, 64, 44);

    // Right rack: kraft paper bags tied with string, and one more loaf below.
    rack(g, 830, 1020, baseY);
    bag(g, 882, baseY - 200, 50, 44);
    bag(g, 966, baseY - 200, 50, 44);
    loaf(g, 884, baseY - 110, 80, 32, CRUST, false);
    sourdough(g, 972, baseY - 110, 60, 42);

    // The counter along the shelf line, with the evening's last rounds and a
    // blueberry loaf set out on it. In the belt scene only their tops show
    // above the belt; in the other scenes the whole counter reads.
    shelf(g, baseY, LEDGE);
    sourdough(g, 330, baseY - 14, 72, 48);
    loaf(g, 760, baseY - 14, 92, 34, BERRY_CRUST, true);
    return g;
  },

  drawNode(scene, c, _scale) {
    const g = scene.add.graphics();
    // Ground shadow first, then the amber sky card this stop happens under.
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(0, 56, 130, 22);
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, CARD);
      gg.fillRoundedRect(-75, -60, 150, 120, 18);
    });
    // A wooden plank across the card, overhanging both sides.
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, WOOD);
      gg.fillRoundedRect(-84, 8, 168, 14, 6);
    });
    // On the plank: a blueberry loaf at the back left, a tied paper bag at the
    // back right. In front, one big sourdough round standing on the ground.
    loaf(g, -34, 8, 62, 32, BERRY_CRUST, true);
    bag(g, 42, 8, 52, 50);
    sourdough(g, -10, 58, 84, 52);
    // The one white highlight, on the crown of the round.
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(-32, 18, 5);
    c.add(g);
  },

  // Flour motes, warm and slow: a speck appears above the node and sifts down.
  emit(scene, state, cx, cy) {
    const color = FLOUR_MOTES[Math.floor(Math.random() * FLOUR_MOTES.length)];
    const p = scene.add.circle(
      cx + (Math.random() - 0.5) * 80, cy - 30 - Math.random() * 30,
      2.5, color, 0.8
    );
    state.layers.add(p);
    scene.tweens.add({
      targets: p, y: '+=58', x: '+=' + ((Math.random() - 0.5) * 24), alpha: 0,
      duration: 2800 + Math.random() * 600, ease: 'Sine.easeInOut',
      onComplete: () => p.destroy()
    });
    return p;
  },
};
