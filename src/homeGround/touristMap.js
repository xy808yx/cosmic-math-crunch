// The paper tourist map under the Home Ground world map: the sheet the day's
// route is drawn on. Cream paper, flat blue water, green park blobs, a faint
// street grid, the day's route as a dashed line, a mountain range across the
// top with the tallest peak under the last stop, an inlet with one bridge, a
// downtown peninsula with a dome dot near the seawall stop, open water and
// islands down the left edge, and a river across the bottom. No place is named
// anywhere, on screen or in code.
//
// Everything is translucent ink (the headline alpha is about a third and the
// grid runs at half that, a strength the owner chose over two fainter takes)
// so the node art, the 28px labels, the secret nodes and the chips drawn on
// top stay readable.
// The scene's day-to-dusk sky wash is laid over this sheet afterwards (see
// createHomeGroundBase), so the top of the map reads bluer and the bottom
// creamier without the map itself changing.
//
// Plain shapes only: no compass rose, no rays, no spirals. Static and
// deterministic (no Math.random). Imports the paper ink helpers and the
// chapter's node route, nothing else.

import { ink, inkLine, W } from './paper.js';
import { buildMapPath } from '../MapPath.js';

/** The sheet colour. Exported so the scene can match a margin if it needs to. */
export const PAPER = 0xf6ecd6;

const INK = 0x4a3b2c;       // warm dark brown, the printed ink
const WATER = 0x3a8fb5;     // the chapter's water anchor
const PARK = 0x6fae5a;      // park green
const ROUTE = 0xc44b3a;     // the route, in the chapter's red

// The far range, drawn first and lighter, sits behind the near one. Every
// apex stays below y 262: the map header paints over y 0 to 220 and fades out
// by 260 (WorldMapScene.createHeader), so peaks above that would be cut off.
const FAR_RANGE = [
  [-20, 480], [120, 340], [260, 390], [420, 270], [540, 330],
  [680, 262], [830, 360], [960, 300], [1100, 480]
];
// The near range: the tallest peak sits under the last stop, World 38 (560, 380).
const NEAR_RANGE = [
  [-20, 480], [90, 400], [200, 430], [330, 330], [430, 395],
  [560, 268], [690, 395], [790, 350], [900, 420], [1010, 360], [1100, 480]
];
// The inlet between the mountains and downtown, a touch narrower to the east.
const INLET = [[0, 492], [W, 518], [W, 582], [0, 604]];
// Open water down the left edge, from the inlet to the river.
const LEFT_WATER = [
  [0, 560], [150, 604], [140, 900], [210, 1150], [190, 1450], [0, 1560]
];
// The small inlet on the south side of the downtown peninsula, the water the
// seawall stop looks across. It opens onto the left water.
const SOUTH_INLET = [
  [150, 758], [700, 748], [1000, 760], [1030, 792], [760, 822], [150, 832]
];
// The river across the bottom, below the lowest labels and above the chrome.
const RIVER = [
  [0, 1630], [300, 1620], [600, 1640], [900, 1625], [W, 1640],
  [W, 1690], [800, 1676], [500, 1692], [200, 1672], [0, 1682]
];
// Islands in the left water: [cx, cy, w, h].
const ISLANDS = [[70, 700, 110, 70], [96, 1000, 140, 86], [62, 1300, 96, 62]];
// Parks: [cx, cy, w, h]. One on the peninsula's tip, one around the garden
// stop, one west of the beach stop.
const PARKS = [[330, 660, 230, 96], [585, 1440, 300, 170], [380, 1250, 220, 120]];
// Downtown blocks: [x, y, w, h]. A few tall blocks between the bridge and the
// seawall stop; the dome sits across the south inlet from that stop.
const BLOCKS = [[560, 640, 26, 60], [600, 626, 30, 74], [646, 648, 24, 52], [690, 636, 28, 64]];
const DOME = { x: 1016, y: 838, r: 12 };
const BRIDGE_X = 330;
// Street grid rectangles, land only: [x0, y0, x1, y1].
const GRID_AREAS = [[150, 612, W, 744], [220, 840, W, 1616]];
const GRID_STEP = 96;

/**
 * Draw the whole sheet onto one Graphics object.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {{height?: number, ink?: number}} [opts]
 *   height: canvas height (default 1920); ink: headline ink alpha (default
 *   0.14). Every layer's alpha is scaled off it.
 * @returns {Phaser.GameObjects.Graphics}
 */
export function drawTouristMap(g, opts = {}) {
  const height = opts.height ?? 1920;
  const a = opts.ink ?? 0.14;

  // The sheet, with two soft darker patches so it reads as paper, not a fill.
  ink(g, false, PAPER, 1);
  g.fillRect(0, 0, W, height);
  ink(g, false, INK, 0.035);
  g.fillEllipse(W * 0.78, height * 0.30, W * 1.1, height * 0.5);
  g.fillEllipse(W * 0.2, height * 0.82, W * 0.9, height * 0.4);

  // Water: the inlet, the open water down the left, the south inlet, the river.
  ink(g, false, WATER, a * 1.1);
  fillPoly(g, INLET);
  fillPoly(g, LEFT_WATER);
  fillPoly(g, SOUTH_INLET);
  fillPoly(g, RIVER);

  // Islands cut back out of the water in paper, with a faint shoreline.
  for (const [cx, cy, w, h] of ISLANDS) {
    ink(g, false, PAPER, 1);
    g.fillEllipse(cx, cy, w, h);
    inkLine(g, false, 2, INK, a * 0.8);
    g.strokeEllipse(cx, cy, w, h);
  }

  // Parks.
  ink(g, false, PARK, a * 1.0);
  for (const [cx, cy, w, h] of PARKS) g.fillEllipse(cx, cy, w, h);

  // The street grid, on land only, with two slightly stronger main roads.
  inkLine(g, false, 2, INK, a * 0.45);
  for (const [x0, y0, x1, y1] of GRID_AREAS) {
    for (let x = x0 + GRID_STEP / 2; x < x1; x += GRID_STEP) g.lineBetween(x, y0, x, y1);
    for (let y = y0 + GRID_STEP / 2; y < y1; y += GRID_STEP) g.lineBetween(x0, y, x1, y);
  }
  inkLine(g, false, 4, INK, a * 0.7);
  g.lineBetween(220, 1000, W, 1000);
  g.lineBetween(604, 840, 604, 1616);

  // Downtown blocks and the dome across the water from the seawall stop.
  ink(g, false, INK, a * 1.0);
  for (const [x, y, w, h] of BLOCKS) g.fillRoundedRect(x, y, w, h, 4);
  g.fillCircle(DOME.x, DOME.y, DOME.r);
  g.fillRect(DOME.x - DOME.r - 4, DOME.y, DOME.r * 2 + 8, 5);

  // The mountain range across the top: the far range first and lighter.
  ink(g, false, INK, a * 0.6);
  fillPoly(g, FAR_RANGE);
  ink(g, false, INK, a * 1.0);
  fillPoly(g, NEAR_RANGE);

  // One bridge over the inlet: the deck and its two thin rails.
  ink(g, false, INK, a * 1.3);
  g.fillRoundedRect(BRIDGE_X - 8, 476, 16, 136, 6);
  inkLine(g, false, 2, INK, a * 1.3);
  g.lineBetween(BRIDGE_X - 14, 482, BRIDGE_X - 14, 606);
  g.lineBetween(BRIDGE_X + 14, 482, BRIDGE_X + 14, 606);

  // The day's route, dashed, along the same curve the ship follows.
  const samples = buildMapPath(3).getPoints(240);
  inkLine(g, false, 5, ROUTE, a * 1.4);
  for (let i = 1; i < samples.length; i++) {
    if ((i >> 1) % 2 === 0) continue;   // two on, two off
    const p = samples[i - 1], q = samples[i];
    g.lineBetween(p.x, p.y, q.x, q.y);
  }

  return g;
}

function fillPoly(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  g.fillPath();
}
