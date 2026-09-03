// World 33, The Mall.
//
// Midday on the family's errand-day Saturday, and it is pouring outside. In
// here it is bright white and warm wood under a huge glass roof, and the whole
// city has come in to get dry. The line it gets in wave 2 is the moving
// walkway, with a glossy shopping bag riding it and the shopfronts as the bins.
// Until then it keeps the plain belt, which recolours from this world's palette.
//
// Recognition cues, in plain words: the big glass atrium roof with rain running
// down it, the very long escalators, the trees of the rooftop park showing
// above the roof line, the food hall counter under its pendant lamps, and the
// library shelves tucked inside the mall. No people, no words on any sign, no
// real place or business names anywhere.
//
// Paper Cutout: every plane goes through paper() for the hard offset shadow,
// rounded corners everywhere, no outlines, and the only strokes are the thin
// handrails and lamp cords. drawHorizon and drawNode are static and
// deterministic; the map emitter is the one place Math.random is used.

import { W, ink, paper, wall, shelf, riseMote } from './paper.js';

// Palette: warm white walls and wood trim, cool glass and steel, one leaf green.
const WALL = 0xf4efe6;
const WOOD = 0xc4935e;
const WOOD_DARK = 0x8a6238;
const GLASS = 0xdce8f4;
const STEEL = 0xcfd4dc;
const STEEL_FAR = 0xe2e6ec;
const TREAD = 0xa5adb9;
const TREAD_FAR = 0xc3c9d2;
const RAIL = 0x3a3a4a;
const LEAF = 0x5fa85a;
const LAMP = 0xffe9a8;
const RAIN = 0xeaf2fb;
const SKY_CARD = 0x8f99ac;
const BOOKS = [0xe8594a, 0x3a8fb5, 0xffd35c, 0x6fbf5a, 0x6a6fa8, 0xff9a78];

// The roof is a shallow arch: how far each of the eight panes, and each of the
// nine mullions between them, lifts above the eaves.
const PANE_LIFT = [0, 10, 18, 22, 22, 18, 10, 0];
const MULLION_LIFT = [0, 10, 18, 22, 22, 22, 18, 10, 0];
// Treetops of the rooftop park, [x, y above baseY, radius], in two clumps.
const TREETOPS = [[150, -276, 26], [196, -286, 30], [240, -270, 22], [822, -280, 28], [868, -290, 32], [914, -272, 24]];

// Fill one closed polygon from a point list.
function poly(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
}

// One escalator seen side-on, climbing from (x0, y0) at the bottom to (x1, y1)
// at the top with a flat comb plate at each end: a steel truss under the step
// line, small treads climbing it, a glass balustrade and a dark rubber
// handrail above. The handrail is one of the few thin strokes the style allows.
function escalator(g, x0, y0, x1, y1, truss, tread) {
  const T = 34, B = 30, F = 36;
  paper(g, 4, 6, (gg, s) => {
    ink(gg, s, truss);
    poly(gg, [[x0 - F, y0], [x0, y0], [x1, y1], [x1 + F, y1], [x1 + F, y1 + T], [x0 - F, y0 + T]]);
  });
  g.fillStyle(tread, 1);
  for (let k = 0; k <= 10; k++) {
    const t = k / 10;
    g.fillRoundedRect(x0 + (x1 - x0) * t - 9, y0 + (y1 - y0) * t - 9, 18, 10, 3);
  }
  const top = (y) => y - 8 - B;
  g.fillStyle(GLASS, 0.45);
  poly(g, [[x0 - F, y0 - 8], [x0, y0 - 8], [x1, y1 - 8], [x1 + F, y1 - 8], [x1 + F, top(y1)], [x1, top(y1)], [x0, top(y0)], [x0 - F, top(y0)]]);
  g.lineStyle(6, RAIL, 1);
  g.lineBetween(x0 - F, top(y0), x0, top(y0));
  g.lineBetween(x0, top(y0), x1, top(y1));
  g.lineBetween(x1, top(y1), x1 + F, top(y1));
}

// The library inside the mall: a wood case with three shelves of book spines
// in the chapter's bright colours. Spine heights repeat on a fixed pattern.
function bookcase(g, x, baseY) {
  paper(g, 4, 6, (gg, s) => {
    ink(gg, s, WOOD_DARK);
    gg.fillRoundedRect(x, baseY - 156, 130, 142, 10);
  });
  for (let row = 0; row < 3; row++) {
    const boardY = baseY - 106 + row * 44;
    g.fillStyle(WOOD, 1);
    g.fillRect(x + 8, boardY, 114, 6);
    for (let i = 0; i < 8; i++) {
      const h = 26 + ((i * 5 + row * 3) % 3) * 4;
      g.fillStyle(BOOKS[(i + row * 2) % BOOKS.length], 1);
      g.fillRoundedRect(x + 10 + i * 14, boardY - h, 11, h, 2);
    }
  }
}

// The food hall under the mezzanine: two pendant lamps on cords with a soft
// pool of light under each (plain ellipses, no rays), a menu board carrying
// blank bars instead of words, and a wood counter with a bowl, a cup and a tray.
function foodHall(g, baseY) {
  for (const lx of [760, 840]) {
    g.lineStyle(3, RAIL, 1);
    g.lineBetween(lx, baseY - 134, lx, baseY - 118);
    g.fillStyle(LAMP, 0.25);
    g.fillEllipse(lx, baseY - 94, 64, 26);
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, RAIL);
      gg.fillRoundedRect(lx - 16, baseY - 120, 32, 16, 6);
    });
  }
  paper(g, 4, 6, (gg, s) => {
    ink(gg, s, 0x2f3440);
    gg.fillRoundedRect(890, baseY - 136, 150, 44, 8);
  });
  g.fillStyle(0xdfe4ea, 1);
  for (let i = 0; i < 3; i++) g.fillRoundedRect(902, baseY - 126 + i * 12, 70 + (i * 37) % 50, 5, 2.5);
  paper(g, 4, 6, (gg, s) => {
    ink(gg, s, WOOD);
    gg.fillRoundedRect(700, baseY - 62, 350, 48, 10);
  });
  g.fillStyle(WALL, 1);
  g.fillRoundedRect(700, baseY - 62, 350, 8, 4);
  paper(g, 4, 6, (gg, s) => {
    ink(gg, s, 0xfff8e7);
    gg.fillEllipse(760, baseY - 70, 34, 16);
    ink(gg, s, 0x3a8fb5);
    gg.fillRoundedRect(806, baseY - 88, 18, 26, 4);
    ink(gg, s, 0xe8594a);
    gg.fillRoundedRect(850, baseY - 72, 72, 10, 5);
  });
}

export const world33 = {
  id: 33,
  // Rain grey-white: a cloud grey top over a pale wet-white bottom. Mid-tone
  // so the belt scene can lift it toward daylight and GameScene can use it raw.
  bgTop: 0x7f889b,
  bgBottom: 0xb7bfcc,

  drawHorizon(scene, opts) {
    const g = scene.add.graphics().setDepth(2);
    const baseY = opts.y;
    // Bright white and wood inside: a translucent warm-white wash over the rain sky.
    wall(g, baseY, WALL, 0.42);
    // The rooftop park: treetops showing above the roof line, out in the rain.
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, LEAF);
      for (const [tx, ty, r] of TREETOPS) gg.fillCircle(tx, baseY + ty, r);
    });
    // The glass atrium roof: eight translucent panes in a shallow arch so the
    // grey sky shows through, with rain running down each pane.
    for (let i = 0; i < 8; i++) {
      const lift = PANE_LIFT[i], x = 6 + i * 134, top = baseY - 250 - lift;
      g.fillStyle(GLASS, 0.38);
      g.fillRoundedRect(x, top, 126, 60 + lift, 6);
      g.fillStyle(RAIN, 0.6);
      g.fillRoundedRect(x + 22 + (i * 29) % 60, top + 8 + (i * 17) % 20, 3, 22, 1.5);
      g.fillRoundedRect(x + 76 + (i * 13) % 30, top + 24 + (i * 11) % 18, 3, 16, 1.5);
    }
    // Wood caps stepping up the arch, the mullions between panes, and the eave beam.
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, WOOD);
      for (let i = 0; i < 8; i++) gg.fillRoundedRect(2 + i * 134, baseY - 258 - PANE_LIFT[i], 134, 12, 5);
      for (let i = 0; i <= 8; i++) gg.fillRoundedRect(2 + i * 134, baseY - 252 - MULLION_LIFT[i], 8, 62 + MULLION_LIFT[i], 4);
      gg.fillRoundedRect(6, baseY - 196, W - 12, 12, 5);
    });
    // Two very long escalators climbing to the mezzanine, the far one paler.
    escalator(g, 370, baseY - 14, 700, baseY - 150, STEEL_FAR, TREAD_FAR);
    escalator(g, 240, baseY - 14, 570, baseY - 150, STEEL, TREAD);
    // The mezzanine: a wood slab across the right with a glass rail on top.
    paper(g, 0, 8, (gg, s) => {
      ink(gg, s, WOOD);
      gg.fillRoundedRect(590, baseY - 150, W - 570, 16, 6);
    });
    g.fillStyle(GLASS, 0.45);
    g.fillRect(600, baseY - 174, W - 600, 24);
    g.lineStyle(5, RAIL, 1);
    g.lineBetween(600, baseY - 174, W, baseY - 174);
    // The library on the left, the food hall on the right.
    bookcase(g, 30, baseY);
    foodHall(g, baseY);
    // The walkway edge along the line.
    shelf(g, baseY, WOOD);
    return g;
  },

  drawNode(scene, c, scale) {
    void scale;
    const g = scene.add.graphics();
    // Ground shadow, then the rain-grey sky card.
    g.fillStyle(0x000000, 0.4);
    g.fillEllipse(0, 56, 130, 22);
    paper(g, 4, 6, (gg, s) => { ink(gg, s, SKY_CARD); gg.fillRoundedRect(-75, -60, 150, 120, 18); });
    // Rain streaks on the sky card (near-white so the glass glint stays the one highlight).
    g.fillStyle(RAIN, 0.7);
    for (const [rx, ry] of [[-62, -52], [-40, -38], [-14, -56], [16, -44], [44, -54], [64, -36]]) g.fillRoundedRect(rx, ry, 3, 14, 1.5);
    // Rooftop park: treetops on both roof wings, their bases hidden by the building.
    paper(g, 4, 6, (gg, s) => {
      ink(gg, s, LEAF);
      for (const [tx, ty, r] of [[-74, -22, 12], [-62, -27, 10], [64, -26, 11], [77, -21, 12]]) gg.fillCircle(tx, ty, r);
    });
    // The glass arch: a wood rim under a glass half-ellipse with three mullions.
    paper(g, 4, 6, (gg, s) => { ink(gg, s, WOOD); gg.fillEllipse(0, -12, 120, 58); });
    g.fillStyle(GLASS, 0.9);
    g.fillEllipse(0, -12, 108, 48);
    g.fillStyle(WOOD, 1);
    for (const [mx, mh] of [[-28, 20], [0, 24], [28, 20]]) g.fillRoundedRect(mx - 3, -12 - mh, 6, mh, 3);
    // The one highlight: a glint on the wet glass.
    g.fillStyle(0xffffff, 0.85);
    g.fillRoundedRect(-30, -30, 18, 5, 2.5);
    // The building body overhanging the card, with the wood walkway along its foot.
    paper(g, 4, 6, (gg, s) => { ink(gg, s, WALL); gg.fillRoundedRect(-84, -12, 168, 58, 10); });
    g.fillStyle(WOOD, 1);
    g.fillRoundedRect(-84, 34, 168, 12, 6);
    // The glass front with one long escalator climbing behind it.
    g.fillStyle(GLASS, 0.55);
    g.fillRoundedRect(-72, -4, 144, 36, 8);
    g.fillStyle(STEEL, 1);
    poly(g, [[-52, 28], [-40, 28], [30, 0], [42, 0], [42, 8], [-52, 36]]);
    g.fillStyle(TREAD, 1);
    for (let k = 0; k <= 5; k++) g.fillRoundedRect(-40 + 14 * k - 3, 28 - 5.6 * k - 3, 6, 4, 1);
    g.lineStyle(2, RAIL, 1);
    g.lineBetween(-52, 20, -40, 20);
    g.lineBetween(-40, 20, 30, -8);
    g.lineBetween(30, -8, 42, -8);
    c.add(g);
  },

  // Map ambience: rain running down the glass above the node, slow pale
  // motes below it. The one place in this module Math.random is allowed.
  emit(scene, state, cx, cy) {
    if (Math.random() < 0.45) {
      const p = scene.add.rectangle(cx + (Math.random() - 0.5) * 120, cy - 70 - Math.random() * 30, 3, 16, RAIN, 0.75);
      state.layers.add(p);
      scene.tweens.add({
        targets: p, y: '+=36', alpha: 0,
        duration: 700 + Math.random() * 300, ease: 'Sine.easeIn', onComplete: () => p.destroy()
      });
      return p;
    }
    return riseMote(scene, state, cx, cy, [0xffffff, 0xeef2f8, 0xd8dcff]);
  },
};
