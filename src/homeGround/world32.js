// World 32, The Big Garden. Late morning, high clean light, the second stop of
// the Saturday. In wave 2 its line becomes the potting bench at the plant sale:
// seedling trays ride the bench with a plant tag carrying the fact, the garden
// beds are the bins, and the pet waters.
//
// Cues, in plain words: hedges taller than Dad (the hedge maze, drawn as blocky
// corridors, never a spiral; the node shows it from above), the lake with the
// stepping-stone path, the giant redwoods with their rusty bare trunks, a red
// wheelbarrow full of seedling trays, and the big lawn. Two small paper clouds
// and a light haze stand in for a sun that is nearly overhead and out of frame.
//
// Paper Cutout rules: every prop goes through paper() so it gets the hard offset
// shadow, rounded corners everywhere, no outlines, thin strokes only for the
// wheelbarrow handle. Plain shapes only, no spirals or sunbursts, no rays.

import { W, ink, inkLine, paper, haze, ridge, treeline, driftMote } from './paper.js';

// Palette for this stop. Lawn and hedge greens sit around the world colour
// 0x4f8a3a so the belt, bins and item (which recolour from it) feel like one place.
const LAWN = 0x7dc457;
const HEDGE_BACK = 0x3a7030;
const HEDGE_FRONT = 0x4f8a3a;
const HEDGE_TOP = 0x6fae4f;
const CROWN = 0x2f5a3a;
const BARK = 0x9a5a3a;
const FAR_HILLS = 0xa9c4dc;
const WATER = 0x3a8fb5;
const STONE = 0xd9d2bd;
const GRAVEL = 0xf0e6c8;
const BARROW_RED = 0xe8594a;
const SEEDLING = 0x6fbf4a;
const PETAL_PINK = 0xffb3c7;
const PETAL_YELLOW = 0xffd35c;

export const world32 = {
  id: 32,
  // Clear late-morning blue, a touch softer than the beach's full afternoon sky.
  bgTop: 0x5aabe2,
  bgBottom: 0xd3ecf9,

  drawHorizon(scene, opts) {
    const g = scene.add.graphics().setDepth(2);
    const baseY = opts.y;
    // Thin late-morning haze low over the far hills, translucent so the sky shows through.
    haze(g, baseY - 240, 120, 0xffffff, 0.10);
    // Two small paper clouds, high and well apart; each cloud's lumps share one shadow pass.
    for (const [cx, cy, s] of [[240, baseY - 272, 1], [690, baseY - 292, 0.72]]) {
      paper(g, 4, 6, (gg, shadow) => {
        ink(gg, shadow, 0xf7fbff, 0.95);
        gg.fillRoundedRect(cx - 62 * s, cy - 10 * s, 124 * s, 26 * s, 13 * s);
        for (const [dx, dy, r] of [[-26, -12, 22], [10, -18, 28], [38, -8, 18]]) gg.fillCircle(cx + dx * s, cy + dy * s, r * s);
      });
    }
    // Far hills across the way in hazy blue, leaning left like a back ridge should.
    ridge(g, [[0, baseY - 150], [150, baseY - 214], [310, baseY - 168], [480, baseY - 232],
      [650, baseY - 176], [830, baseY - 222], [W, baseY - 158], [W, baseY - 110], [0, baseY - 110]], FAR_HILLS, -6, 8, 14);
    // The giant redwoods, two left and five right: rusty bare trunks first, then the tall
    // narrow crowns as one treeline row so they share a shadow pass.
    const woods = [[44, 232], [108, 272], [812, 244], [878, 296], [948, 264], [1018, 318], [1072, 254]];
    paper(g, 4, 6, (gg, shadow) => {
      ink(gg, shadow, BARK);
      for (const [x] of woods) gg.fillRoundedRect(x - 14, baseY - 76, 28, 72, 7);
    });
    treeline(g, woods.map(([x, h]) => [x, baseY - 48, Math.round((h - 48) * 0.36), h - 48]), CROWN);
    // The hedge maze in the middle distance: two staggered rows of blocky hedge walls with
    // gaps between them for the corridors. Blocky corridors only, never a spiral.
    const hedgeRows = [[HEDGE_BACK, baseY - 156, [[400, 130], [570, 100], [700, 80]]],
      [HEDGE_FRONT, baseY - 112, [[360, 96], [500, 150], [690, 90]]]];
    for (const [color, top, blocks] of hedgeRows) {
      paper(g, 4, 6, (gg, shadow) => {
        ink(gg, shadow, color);
        for (const [x, w] of blocks) gg.fillRoundedRect(x, top, w, 84, 10);
      });
    }
    // The high light catches the top of the front row.
    g.fillStyle(HEDGE_TOP, 1);
    for (const [x, w] of hedgeRows[1][2]) g.fillRoundedRect(x, baseY - 112, w, 10, 5);
    // The big lawn: the floor sheet, a shallow band that casts no shadow of its own.
    g.fillStyle(LAWN, 1);
    g.fillRect(0, baseY - 20, W, 76);
    // A gravel path along the front on the right, leading toward the maze.
    paper(g, 0, 4, (gg, shadow) => { ink(gg, shadow, GRAVEL); gg.fillRoundedRect(560, baseY + 8, 560, 22, 11); });
    // The lake, front left, laid over the lawn like a sheet: two glints, then the stepping stones zigzagging across.
    paper(g, 0, 8, (gg, shadow) => { ink(gg, shadow, WATER); gg.fillRoundedRect(150, baseY - 62, 390, 58, 29); });
    g.fillStyle(0xffffff, 0.35);
    for (const [x, dy, w] of [[180, -52, 120], [400, -50, 90]]) g.fillRoundedRect(x, baseY + dy, w, 4, 2);
    paper(g, 3, 4, (gg, shadow) => {
      ink(gg, shadow, STONE);
      for (const [x, dy] of [[200, -22], [258, -34], [318, -44], [378, -42], [438, -30], [496, -18]]) gg.fillEllipse(x, baseY + dy, 30, 14);
    });
    // A few flowers on the bank in front of the lake, pink and yellow like the petals on the map.
    paper(g, 2, 3, (gg, shadow) => {
      for (const [x, dy, color] of [[170, 4, PETAL_PINK], [250, 8, PETAL_YELLOW], [330, 4, PETAL_PINK], [410, 8, PETAL_YELLOW], [470, 4, PETAL_PINK]]) {
        ink(gg, shadow, color).fillCircle(x, baseY + dy, 7);
      }
    });
    // The red wheelbarrow, front right of centre, loaded with seedling trays. Seedlings go in
    // first so the tub rim covers their bottoms; the handle is the one thin stroke here.
    paper(g, 4, 6, (gg, shadow) => {
      ink(gg, shadow, SEEDLING);
      for (const [x, dy, w, h] of [[628, -66, 30, 18], [658, -70, 34, 20], [690, -66, 28, 16]]) gg.fillEllipse(x, baseY + dy, w, h);
      ink(gg, shadow, PETAL_PINK).fillCircle(658, baseY - 76, 5);
      ink(gg, shadow, BARROW_RED).fillRoundedRect(604, baseY - 62, 110, 46, 12);
      ink(gg, shadow, 0x3a3a4a);
      gg.fillRoundedRect(696, baseY - 18, 9, 22, 4);
      gg.fillCircle(620, baseY - 6, 16);
      inkLine(gg, shadow, 6, 0x8a6a48).lineBetween(712, baseY - 44, 770, baseY - 32);
    });
    g.fillStyle(0x9aa0b8, 1);
    g.fillCircle(620, baseY - 6, 6);
    return g;
  },

  drawNode(scene, c, _scale) {
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(0, 56, 130, 22);
    // The sky card back sheet.
    paper(g, 4, 6, (gg, shadow) => { ink(gg, shadow, 0x6db8ea); gg.fillRoundedRect(-75, -60, 150, 120, 18); });
    // Two hazy far hills peeking over the lawn.
    paper(g, -4, 6, (gg, shadow) => { ink(gg, shadow, FAR_HILLS); gg.fillEllipse(-30, -14, 90, 40); gg.fillEllipse(34, -18, 80, 36); });
    // The big lawn: one green sheet across the lower half of the card.
    paper(g, 0, 8, (gg, shadow) => { ink(gg, shadow, LAWN); gg.fillRoundedRect(-75, -8, 150, 68, 14); });
    // Two giant redwoods at the right: rusty trunks, then tall crowns overhanging the card top.
    paper(g, 4, 6, (gg, shadow) => { ink(gg, shadow, BARK); gg.fillRoundedRect(44, -22, 9, 32, 4); gg.fillRoundedRect(64, -16, 9, 28, 4); });
    treeline(g, [[48, -16, 32, 78], [68, -10, 28, 66]], CROWN);
    // The hedge maze seen from above: one dark hedge block with a pale gravel corridor that
    // snakes through it from the top left entrance to the bottom right exit, with a dead end
    // at the end of each row. Blocky corridors only, never a spiral.
    paper(g, 4, 6, (gg, shadow) => { ink(gg, shadow, 0x3f7a2e); gg.fillRoundedRect(-44, -4, 80, 62, 8); });
    g.fillStyle(GRAVEL, 1);
    for (const [x, y, w, h] of [[-44, 6, 72, 8], [12, 6, 8, 24], [-36, 22, 56, 8], [-28, 22, 8, 24], [-28, 38, 64, 8]]) {
      g.fillRoundedRect(x, y, w, h, 3);
    }
    // The lake at the front left, overhanging the card, with three stepping stones.
    paper(g, 0, 6, (gg, shadow) => { ink(gg, shadow, WATER); gg.fillRoundedRect(-92, 30, 52, 28, 14); });
    paper(g, 2, 3, (gg, shadow) => {
      ink(gg, shadow, STONE);
      for (const [x, y] of [[-82, 46], [-66, 38], [-50, 46]]) gg.fillEllipse(x, y, 14, 8);
    });
    // The one white highlight: a glint on the water.
    g.fillStyle(0xffffff, 0.8);
    g.fillRoundedRect(-88, 34, 16, 4, 2);
    c.add(g);
  },

  // Map ambience: petals and pollen drifting sideways on one steady breeze, pale pink and yellow.
  emit(scene, state, cx, cy) {
    return driftMote(scene, state, cx, cy, [PETAL_PINK, 0xffd6e0, PETAL_YELLOW, 0xfff0a8], 1);
  },
};
