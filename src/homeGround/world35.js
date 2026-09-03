// World 35, The Big Store. Five in the afternoon, warm low light coming in
// through the open loading doors of the warehouse store.
//
// Wave 2 line: the roller line by the pallets. A bulk box (a giant multipack)
// rides it with a shelf label carrying the fact, the bins are the flatbed
// carts, and the pet drives the flatbed. This is the world closest to the
// shipped crate, so it is last in the line priority and keeps the plain belt
// longest.
//
// Cues, in plain words: pallet racks to the ceiling stacked with cardboard
// boxes and shrink-wrapped pallets, the giant cart, a flatbed cart loaded with
// giant boxes, a sample station with little paper cups, the food court sign
// with the hot dog and the giant pizza slice, the painted yellow floor line,
// and the loading door glowing with the low afternoon light. Nobody is drawn,
// so the card check at the door and the receipt check on the way out are left
// to the copy.
//
// Paper Cutout style: every prop goes through paper() so it gets the black
// offset shadow, rounded corners everywhere, no outlines, no rays. The door
// light is a flat glowing pane and a soft pool on the floor, plain shapes only,
// no spirals or sunbursts.

import { W, ink, inkLine, paper, haze, ridge, wall, shelf, windowPane, driftMote } from './paper.js';

const RACK_STEEL = 0xb5623a;   // the store's rust orange, also the world colour
const BOX_A = 0xd2a066;        // cardboard, three tones so stacks read as stacks
const BOX_B = 0xe0b57c;
const BOX_C = 0xc4915a;
const STEEL = 0x7d838f;        // cart and flatbed metal
const STEEL_DARK = 0x3a3d45;   // wheels
const CREAM = 0xfff8e7;        // shelf labels and the menu board
const DOOR_LIGHT = 0xffc27a;   // the world accent, the light outside the door

export const world35 = {
  id: 35,
  bgTop: 0x6b9fd2,     // five o'clock blue, softer than the beach sky
  bgBottom: 0xf2c58a,  // going warm gold toward the ground

  drawHorizon(scene, opts) {
    const g = scene.add.graphics().setDepth(2);
    const baseY = opts.y;
    // Back wall: warm concrete over the sky, with a low band of door light across it.
    wall(g, baseY, 0x9c8672, 0.5);
    haze(g, baseY - 130, 130, DOOR_LIGHT, 0.12);
    // The open loading door in the middle, its slab rolled up above the frame.
    windowPane(g, baseY, 540, 300, 226, 0x6a6f7a, DOOR_LIGHT, 0.6);
    paper(g, 4, 6, (gg, s) => { ink(gg, s, 0x8a8f9a); gg.fillRoundedRect(360, baseY - 292, 360, 26, 13); });
    // Pallet racks to the ceiling: rust uprights and beams, the left one three levels high.
    const racks = [[40, 330, [baseY - 300, baseY - 200, baseY - 100]], [760, 1040, [baseY - 180, baseY - 95]]];
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, RACK_STEEL);
      for (const [x0, x1, beams] of racks) {
        for (const x of [x0, x1 - 14]) gg.fillRoundedRect(x, beams[0], 14, baseY - 14 - beams[0], 4);
        for (const by of beams) gg.fillRoundedRect(x0, by, x1 - x0, 10, 4);
      }
    });
    // Boxes on every level: [x, bottom offset from baseY, w, h, colour]. Each stands on a beam or the floor.
    const boxes = [
      [60, -14, 80, 64, BOX_A], [150, -14, 70, 56, BOX_B], [230, -14, 86, 70, BOX_C],
      [58, -100, 90, 60, BOX_B], [160, -100, 66, 66, BOX_A], [236, -100, 80, 54, BOX_C],
      [60, -200, 120, 72, BOX_A], [196, -200, 118, 64, BOX_B],
      [780, -14, 96, 66, BOX_C], [890, -14, 130, 60, BOX_A],
      [782, -95, 110, 62, BOX_B], [906, -95, 112, 56, BOX_C],
    ];
    paper(g, 4, 6, (gg, s) => {
      for (const [x, b, w, h, col] of boxes) { ink(gg, s, col); gg.fillRoundedRect(x, baseY + b - h, w, h, 6); }
    });
    // A tape stripe down each box, then shrink film over the top pallets (a pale see-through sheet, no shadow of its own).
    g.fillStyle(0xa8783f, 0.35);
    for (const [x, b, w, h] of boxes) g.fillRect(x + w / 2 - 4, baseY + b - h, 8, h);
    g.fillStyle(0xdfeaf2, 0.45);
    for (const [x, y, w, h] of [[56, -276, 128, 80], [192, -268, 126, 72], [778, -161, 134, 70]]) g.fillRoundedRect(x, baseY + y, w, h, 8);
    // Food court sign above the right rack: a cream menu board with a red header.
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, CREAM); gg.fillRoundedRect(776, baseY - 302, 250, 92, 14);
      ink(gg, s, 0xe8594a); gg.fillRoundedRect(776, baseY - 302, 250, 20, 10);
    });
    // On the board, the hot dog (bun, sausage, one mustard line) and the giant pizza slice (crust, cheese, three pepperoni).
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, BOX_B); gg.fillRoundedRect(796, baseY - 262, 100, 34, 17);
      ink(gg, s, 0xc8503a); gg.fillRoundedRect(802, baseY - 254, 88, 16, 8);
      ink(gg, s, 0xf2c14e); gg.fillRoundedRect(814, baseY - 250, 64, 6, 3);
      ink(gg, s, BOX_B); gg.fillTriangle(922, baseY - 270, 1006, baseY - 270, 964, baseY - 218);
      ink(gg, s, 0xf2b64a); gg.fillTriangle(930, baseY - 262, 998, baseY - 262, 964, baseY - 226);
      ink(gg, s, 0xc8503a); gg.fillCircle(950, baseY - 252, 6); gg.fillCircle(976, baseY - 250, 6); gg.fillCircle(962, baseY - 236, 5);
    });
    // Floor: a concrete curb at the line with the painted yellow floor stripe, and the door light pooling in front of the door.
    shelf(g, baseY, 0x8c8478);
    g.fillStyle(0xf2c14e, 0.9); g.fillRoundedRect(40, baseY + 4, W - 80, 6, 3);
    g.fillStyle(DOOR_LIGHT, 0.28); g.fillEllipse(540, baseY + 24, 440, 44);
    // Flatbed cart in front of the left rack: a long steel deck on four small wheels with an upright handle.
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, STEEL); gg.fillRoundedRect(70, baseY - 40, 240, 14, 6);
      gg.fillRoundedRect(296, baseY - 130, 10, 92, 5); gg.fillRoundedRect(272, baseY - 136, 58, 10, 5);
      ink(gg, s, STEEL_DARK); for (const x of [92, 130, 250, 288]) gg.fillCircle(x, baseY - 22, 9);
    });
    // Giant boxes in one layer: two riding the flatbed (the front one wearing a plain cream shelf label)
    // and two multipacks standing in the giant cart, drawn before the basket so they show above its rim.
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, BOX_A); gg.fillRoundedRect(84, baseY - 110, 110, 70, 6); gg.fillRoundedRect(910, baseY - 132, 70, 70, 6);
      ink(gg, s, BOX_B); gg.fillRoundedRect(150, baseY - 102, 120, 62, 6); gg.fillRoundedRect(830, baseY - 150, 96, 90, 6);
      ink(gg, s, CREAM); gg.fillRoundedRect(196, baseY - 84, 40, 18, 4);
    });
    // Sample station by the door: a little steel table with three paper cups on top.
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, 0x8a8f9a); gg.fillRoundedRect(704, baseY - 72, 64, 8, 4);
      for (const x of [710, 754]) gg.fillRoundedRect(x, baseY - 66, 6, 52, 3);
      ink(gg, s, CREAM); for (const x of [712, 730, 748]) gg.fillRoundedRect(x, baseY - 82, 12, 10, 2);
    });
    // The giant cart in front of the right rack: the steel basket with two wire lines, then the handle and two fat wheels.
    ridge(g, [[790, baseY - 108], [1000, baseY - 108], [984, baseY - 38], [806, baseY - 38]], STEEL, 4, 6, 6);
    g.fillStyle(0xaab0bc, 0.6); g.fillRoundedRect(816, baseY - 96, 168, 8, 4); g.fillRoundedRect(824, baseY - 72, 152, 8, 4);
    paper(g, 4, 6, (gg, s) => {
      inkLine(gg, s, 8, STEEL); gg.lineBetween(1000, baseY - 108, 1034, baseY - 178);
      ink(gg, s, RACK_STEEL); gg.fillRoundedRect(1014, baseY - 190, 40, 12, 6);
      ink(gg, s, STEEL_DARK); gg.fillCircle(826, baseY - 24, 12); gg.fillCircle(970, baseY - 24, 12);
    });
    return g;
  },

  drawNode(scene, c, scale) {
    const g = scene.add.graphics();
    // Ground shadow first, then the five o'clock sky card, then the store planes back to front.
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(0, 56, 130, 22);
    paper(g, 4, 6, (gg, s) => { ink(gg, s, 0x74a8d8); gg.fillRoundedRect(-75, -60, 150, 120, 18); });
    // Back plane: a pallet rack on the left of the card, rust uprights and beams with boxes on every level.
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, RACK_STEEL);
      for (const x of [-68, -16]) gg.fillRoundedRect(x, -54, 8, 88, 3);
      for (const y of [-52, -22, 8]) gg.fillRoundedRect(-70, y, 62, 6, 3);
      ink(gg, s, BOX_A);
      gg.fillRoundedRect(-58, -44, 22, 22, 4); gg.fillRoundedRect(-34, -38, 18, 16, 4);
      gg.fillRoundedRect(-58, -14, 40, 22, 4); gg.fillRoundedRect(-58, 14, 24, 20, 4); gg.fillRoundedRect(-32, 18, 18, 16, 4);
    });
    // Middle plane: giant multipacks standing in the cart, the front one wearing a plain cream shelf label.
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, BOX_A); gg.fillRoundedRect(-22, -44, 54, 60, 6);
      ink(gg, s, BOX_B); gg.fillRoundedRect(20, -36, 42, 52, 6);
      ink(gg, s, CREAM); gg.fillRoundedRect(-12, -30, 26, 12, 3);
    });
    // Front plane: the giant cart. A steel basket that overhangs the card, two wire lines, a tall handle, two fat wheels.
    ridge(g, [[-38, -4], [72, -4], [60, 44], [-26, 44]], STEEL, 4, 6, 6);
    g.fillStyle(0xaab0bc, 0.6); g.fillRoundedRect(-24, 8, 84, 6, 3); g.fillRoundedRect(-18, 24, 72, 6, 3);
    paper(g, 4, 6, (gg, s) => {
      inkLine(gg, s, 7, STEEL); gg.lineBetween(72, -4, 84, -40);
      ink(gg, s, RACK_STEEL); gg.fillRoundedRect(68, -48, 24, 10, 5);
      ink(gg, s, STEEL_DARK); gg.fillCircle(-14, 52, 10); gg.fillCircle(46, 52, 10);
    });
    // The one white highlight: a glint on the top corner of the tall box.
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(-14, -38, 5);
    c.add(g);
  },

  emit(scene, state, cx, cy) {
    // Cardboard-brown flecks drifting sideways past the node, like dust in the door light.
    return driftMote(scene, state, cx, cy, [0xc4915a, 0xd2a066, 0xb08a5c, 0xe0b57c]);
  },
};
