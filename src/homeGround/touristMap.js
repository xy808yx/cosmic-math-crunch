// The paper tourist map under the Home Ground world map.
//
// Shape only: the palette, the ink alphas, the layer order and the route
// stipple are the shipped ones. What changed is the geometry: this is the
// family's own coast instead of a generic band of water.
//
// The shapes that carry the recognition, and that this sheet keeps:
//   - the channel across the top is pinched TWICE, hard, with a wide basin
//     between the two pinches and open water beyond each;
//   - at its east end it forks like a sideways Y: one long knife-thin arm
//     running north, one short stub running east and dead-ending;
//   - a bay cuts west into the channel's south shore, which is what leaves the
//     wooded park attached to the town by a neck narrower than the park is
//     wide, so the peninsula reads as a hammer head and not as a taper;
//   - the small inlet under the peninsula is a DEAD END, entered through a
//     narrow north-west facing mouth between two blunt headlands;
//   - the wooded point in the south-west is straight, straight, blunt: a long
//     flat north coast, a rounded nose, then a straight run back south-east;
//   - those two headlands both point north-west with the bay between them
//     converging east on the first pinch, which is the coast's whole motif;
//   - the range stands right behind the channel, with one pair of horns
//     standing proud of the wall;
//   - the river at the foot forks once around one long low island, with a
//     second smaller fork around a wedge at the west end, and it holds one
//     ruler-straight line except for a single loop south.
//
// All the water is one polygon (SEA) because it is all one body, so nothing
// double-darkens at a seam. The islands and the far bank are cut back out in
// paper afterwards, the same trick the old islands used.
//
// Everything is translucent ink (headline alpha about a third, the grid at
// half that) so the node art, the 28px labels, the secret nodes and the chips
// drawn on top stay readable. The scene's day-to-dusk sky wash goes over this
// sheet afterwards (see createHomeGroundBase).
//
// Plain shapes only: no compass rose, no rays, no spirals. Static and
// deterministic (no Math.random). Imports the paper ink helpers and the
// chapter's node route, nothing else.

import { ink, inkLine, W } from './paper.js';
import { buildMapPath, getNodePositions, MAP_HEADER_FADE_END } from '../MapPath.js';

/** The sheet colour. Exported so the scene can match a margin if it needs to. */
export const PAPER = 0xf6ecd6;

/**
 * The headline ink alpha the owner chose. createHomeGroundBase draws at this
 * strength unless a caller overrides it.
 */
export const MAP_INK = 0.34;

const INK = 0x4a3b2c;       // warm dark brown, the printed ink
const WATER = 0x3a8fb5;     // the chapter's water anchor
const PARK = 0x6fae5a;      // park green
const ROUTE = 0xc44b3a;     // the route, in the chapter's red

const P = (pairs) => pairs.map(([x, y]) => ({ x, y }));

// The map header paints over the top of the sheet and fades out by
// MAP_HEADER_FADE_END, so no peak and no arm reaches above PEAK_TOP.
const PEAK_TOP = MAP_HEADER_FADE_END + 2;

// The tallest peak stands under the last stop, so its x comes from the route's
// own node table rather than a copied number.
const CH3_STOPS = getNodePositions(3);
const LAST_STOP = CH3_STOPS[CH3_STOPS.length - 1];

// ---------------------------------------------------------------- the coast
// Traced as one continuous walk with the land on the inside. Read down this
// list and you walk the whole shoreline once.

// The sound comes down the sheet's north-west almost due north-south, then
// turns a near right angle and heads east. That corner is the gate.
const SOUND_E = [[150, PEAK_TOP], [153, 300], [149, 338], [151, 372], [156, 398]];
// The channel's north shore. Flat for a while, then it breaks south-east at a
// visible hinge, then flattens again. It is also the foot of the range.
const NORTH_SHORE = [
  [200, 402], [252, 400], [300, 402], [332, 404],      // the first pinch
  [378, 414], [428, 428], [478, 442], [528, 456],
  [576, 466], [628, 472], [680, 476], [730, 478],
  [782, 478], [812, 476],                              // the second pinch
  [846, 472], [876, 466], [902, 460]
];
// The long thin arm running north off the fork, and the short blunt one that
// dead-ends east. Between them a finger of land splits the water into two
// parallel slots.
const ARM_W = [[910, 428], [920, 384], [931, 340], [938, 298], [941, PEAK_TOP]];
const ARM_E = [[971, PEAK_TOP], [967, 300], [961, 344], [955, 390], [950, 434], [947, 470]];
const FINGER = [
  [960, 492], [978, 498],                              // the finger's south tip
  [985, 458], [990, 416], [994, 378],                  // up its east side
  [1014, 372], [1018, 414], [1022, 456], [1026, 492]   // and down into the bay
];
const STUB_N = [[1062, 508], [1120, 520]];
// The channel's far shore, coming back west. A bay cuts west into it, and the
// head of that bay is what makes the neck.
const SOUTH_SHORE = [
  [1120, 562], [1052, 558], [984, 554], [914, 550],
  [852, 546], [812, 542],                              // the second pinch
  [768, 548], [716, 556], [664, 564], [614, 570]
];
const HARBOUR = [
  [572, 556], [524, 540], [478, 528], [440, 521],      // west into the bay's head
  [420, 500], [400, 476], [370, 460], [344, 452]       // out along the park's shore
];
// Round the park's blunt head, down its west face, and along the town's own
// shore to the north lip of the small inlet's mouth.
const PARK_W = [
  [326, 448], [294, 452], [262, 466], [237, 490], [222, 522], [218, 556],
  [226, 584], [240, 600], [264, 612], [296, 618], [334, 620], [374, 616],
  [410, 608], [444, 600], [476, 606]
];
// The small inlet: in through a narrow north-west facing mouth, east along its
// north shore to a rounded head, then back out along its south shore. A dead
// end, not a channel.
const INLET_N = [
  [510, 618], [552, 630], [600, 642], [650, 652], [700, 660],
  [750, 664], [798, 666], [842, 662], [874, 652]
];
const INLET_S = [
  [892, 656], [862, 666], [826, 678], [780, 686], [726, 688],
  [670, 684], [614, 674], [560, 660], [512, 646], [470, 634]
];
// West along the point's long flat north coast to its blunt nose.
// The bay's two shores run roughly parallel and converge eastward, funnelling
// on the first pinch: wide open to the west, a narrow gap at the inlet's mouth.
const POINT_N = [
  [438, 664], [400, 682], [352, 692], [300, 694], [250, 694],
  [200, 704], [150, 724], [96, 742], [48, 742], [22, 728]
];
// Then straight back south-east down the point's other side and on to the
// river. Almost a ruled line, which is half of what makes the point read.
const POINT_SW = [
  [18, 764], [32, 810], [56, 866], [84, 924], [110, 982], [136, 1040],
  [158, 1098], [176, 1156], [192, 1214], [204, 1272], [212, 1330],
  [214, 1390], [210, 1444], [200, 1494], [188, 1528], [182, 1544]
];
// The river's north bank, ruler-straight except for one loop south.
const RIVER_N = [
  [242, 1540], [322, 1538], [402, 1538], [482, 1540], [562, 1542],
  [642, 1544], [718, 1550],
  [762, 1570], [802, 1594], [842, 1602], [882, 1590], [912, 1566],   // the loop
  [952, 1552], [1002, 1548], [1052, 1548], [1120, 1550]
];

const SEA = P([
  ...SOUND_E, ...NORTH_SHORE, ...ARM_W, ...ARM_E, ...FINGER, ...STUB_N,
  ...SOUTH_SHORE, ...HARBOUR, ...PARK_W, ...INLET_N, ...INLET_S,
  ...POINT_N, ...POINT_SW, ...RIVER_N,
  [1120, 1980], [-40, 1980], [-40, PEAK_TOP]
]);

// ------------------------------------------------------- cut back out in paper

// The near-square island alone in the sound, with two bites out of the shore
// that faces the mainland.
const SOUND_ISLAND = P([
  [26, 296], [70, 288], [104, 300], [116, 318], [98, 330], [116, 344],
  [112, 366], [86, 386], [46, 390], [24, 372], [18, 334]
]);
// The long low island the river forks around: a sharp point wedged in the fork
// at the east, a blunt face at the west, and much wider than it is deep.
const BIG_ISLAND = P([
  [1120, 1566], [1032, 1584], [934, 1596], [836, 1608], [738, 1616],
  [640, 1620], [546, 1622], [462, 1624], [402, 1636], [352, 1652],
  [330, 1690], [352, 1730], [420, 1754], [520, 1766], [640, 1770],
  [768, 1762], [896, 1744], [1016, 1720], [1120, 1698]
]);
// The wedge in the second, smaller fork at the west end, its sharp end
// pointing back east into the junction.
const FORK_ISLAND = P([
  [196, 1566], [258, 1556], [318, 1560], [364, 1578], [386, 1600],
  [340, 1616], [272, 1622], [214, 1614], [182, 1594]
]);
// The far bank of the river's other arm, along the foot of the sheet.
const FAR_BANK = P([
  [-40, 1892], [180, 1856], [400, 1826], [620, 1806], [840, 1794],
  [1060, 1786], [1120, 1784], [1120, 1980], [-40, 1980]
]);

// ------------------------------------------------------------- the mountains

// The range stands right behind the channel: the wall's foot is the north
// shore and its top is up under the header. Peaks are unevenly spaced, each
// with one long shoulder and one short steep face, and one pair of horns
// stands proud of the wall to the west. The tallest of all is under the last
// stop. The long arm cuts the range clean through, so it comes in two lobes.
const FAR_APEX = [
  [152, 396], [186, 336], [216, 302], [248, 284], [280, 296], [308, 278],
  [340, 292], [372, 278], [404, 296], [436, 280], [468, 298], [500, 286],
  [534, 300], [568, 288], [600, 298], [634, 280], [668, 294], [700, 278],
  [734, 296], [766, 282], [798, 300], [830, 284], [862, 300], [890, 286],
  [906, 350]
];
const NEAR_APEX = [
  [156, 400],
  [172, 358], [190, 318], [212, 296], [232, 288],
  [248, 268], [264, 292], [284, 264], [300, 294],        // the pair of horns
  [316, 330], [332, 372], [344, 404],                    // the first valley
  [362, 358], [382, 316], [406, 292], [430, 300], [452, 322], [478, 348],
  [498, 316], [520, 290], [540, 276], [562, 298],        // the west massif
  [588, 334], [614, 370], [640, 398], [664, 412],        // the second valley
  [686, 384], [708, 348], [728, 370],                    // stepping back up, east
  [752, 318], [772, 338],
  [796, 288], [816, 306],
  [LAST_STOP.x, PEAK_TOP],                               // the tallest peak
  [876, 296], [890, 336], [906, 400]
];
const SHORE_BACK = [...NORTH_SHORE].reverse();
const FAR_RANGE = P([...FAR_APEX, [908, 430], ...SHORE_BACK, [156, 398]]);
const NEAR_RANGE = P([...NEAR_APEX, [908, 436], ...SHORE_BACK, [156, 402]]);
const FAR_RANGE_E = P([
  [978, 400], [996, 330], [1032, 288], [1074, 320], [1112, 286],
  [1120, 302], [1120, 424], [1054, 430], [1010, 420], [986, 392]
]);
const NEAR_RANGE_E = P([
  [974, 434], [990, 348], [1026, 300], [1070, 336], [1108, 296],
  [1120, 314], [1120, 452], [1056, 458], [1012, 452], [984, 424]
]);

// ------------------------------------------------------------ what is on land

// The park filling the peninsula's head, visibly wider than the neck behind
// it, with the small lagoon punched into it right at the neck.
const HEAD_PARK = P([
  [236, 504], [264, 478], [302, 466], [338, 474], [364, 498], [374, 530],
  [366, 564], [346, 590], [316, 602], [288, 602], [260, 592], [240, 572],
  [230, 544], [230, 520]
]);
const LAGOON = { x: 330, y: 560, w: 50, h: 28 };
// The forest on the point.
const POINT_FOREST = P([
  [86, 782], [134, 768], [180, 778], [208, 806], [214, 850], [198, 894],
  [162, 924], [120, 920], [88, 888], [72, 836]
]);
// Parks, each an irregular outline rather than an ellipse: an ellipse with a
// fixed sum of sines on its radius, so no two share a shape and none of it
// needs a random number.
const PARKS = [
  // the park with the pond, beside the fourth stop
  P([
    [873, 1148], [859, 1170], [836, 1187], [808, 1198], [776, 1198], [746, 1205],
    [706, 1208], [683, 1190], [672, 1169], [670, 1148], [686, 1131], [691, 1111],
    [706, 1088], [744, 1084], [779, 1089], [808, 1098], [824, 1116], [849, 1128]
  ]),
  // the garden the second stop is in
  P([
    [688, 1292], [663, 1317], [628, 1334], [594, 1349], [559, 1375], [505, 1365],
    [460, 1353], [439, 1331], [387, 1318], [372, 1292], [397, 1267], [432, 1250],
    [466, 1235], [501, 1209], [555, 1219], [600, 1231], [621, 1253], [673, 1266]
  ]),
  // the park beside the mall stop
  P([
    [1071, 1296], [1064, 1317], [1042, 1331], [1023, 1343], [1002, 1364], [969, 1365],
    [943, 1350], [922, 1335], [917, 1314], [912, 1296], [898, 1272], [913, 1251],
    [943, 1242], [972, 1236], [999, 1243], [1023, 1249], [1058, 1252], [1075, 1272]
  ]),
  // the lake park on the east side
  P([
    [1081, 1146], [1079, 1165], [1060, 1178], [1039, 1185], [1019, 1191], [994, 1203],
    [973, 1191], [957, 1177], [955, 1160], [935, 1146], [937, 1127], [956, 1114],
    [977, 1107], [997, 1101], [1022, 1089], [1043, 1101], [1059, 1115], [1061, 1132]
  ]),
  // a break in the grid on the west side
  P([
    [430, 1032], [422, 1048], [405, 1061], [383, 1067], [365, 1079], [337, 1087],
    [313, 1076], [295, 1063], [287, 1047], [290, 1032], [282, 1016], [286, 996],
    [313, 988], [339, 985], [364, 988], [383, 997], [409, 1001], [433, 1013]
  ]),
  // and one further south
  P([
    [370, 1272], [357, 1287], [344, 1298], [324, 1303], [310, 1318], [286, 1317],
    [267, 1308], [257, 1296], [243, 1286], [226, 1272], [239, 1257], [252, 1246],
    [272, 1241], [286, 1226], [310, 1227], [329, 1236], [339, 1248], [353, 1258]
  ]),
  // the wide one east of the third stop
  P([
    [746, 900], [740, 913], [721, 922], [709, 933], [690, 945], [663, 943],
    [641, 935], [624, 925], [621, 912], [610, 900], [600, 884], [617, 872],
    [641, 865], [664, 862], [686, 867], [709, 867], [738, 870], [748, 885]
  ]),
  // the low one by the river
  P([
    [978, 1490], [972, 1510], [950, 1524], [927, 1534], [900, 1534], [876, 1536],
    [843, 1541], [819, 1527], [812, 1508], [809, 1490], [823, 1475], [833, 1460],
    [843, 1439], [872, 1433], [902, 1438], [927, 1446], [941, 1461], [955, 1474]
  ]),
  // the small waterfront park
  P([
    [1004, 806], [997, 818], [986, 827], [970, 831], [957, 838], [938, 845],
    [920, 838], [908, 828], [901, 817], [904, 806], [901, 795], [902, 781],
    [920, 774], [939, 772], [957, 774], [970, 781], [986, 785], [1005, 793]
  ]),
];
const PONDS = [[762, 1152, 68, 40], [1008, 1146, 64, 34], [298, 1274, 46, 26]];

// Blocks on the wedge between the bay and the small inlet: [x, y, w, h].
const BLOCKS = [
  [492, 578, 20, 40], [520, 570, 24, 52], [552, 580, 18, 44],
  [582, 570, 26, 58], [618, 582, 20, 46], [650, 576, 24, 54],
  [686, 590, 18, 42], [716, 584, 22, 50], [752, 598, 18, 40]
];
// The dome on the far shore of the small inlet's head, across the water from
// the seawall stop: a half disc on a base bar, the same silhouette as the
// chapter's own dome (world37), whose lower half the water hides.
const DOME = { x: 872, y: 640, r: 14 };

// The one long straight jetty striking west into open water off the river's
// mouth, and the training wall beside it. Ruled straight lines on a soft
// river-mouth coast are that coast's own signature.
const JETTIES = [[186, 1542, 40, 1538], [200, 1556, 84, 1560]];

// Crossings. The big one is over the first pinch and is drawn heavy; the rest
// are thin, and they cluster east over the river the way the real ones do.
const BIG_BRIDGE = [330, 398, 326, 450];
const THIN_BRIDGES = [
  [812, 474, 812, 544],     // the second pinch
  [560, 640, 552, 668],     // over the small inlet, west
  [700, 664, 692, 692],     // over the small inlet, east
  [402, 1534, 396, 1642],   // over the river, alone in the west
  [912, 1560, 906, 1602],   // and the cluster in the east
  [968, 1544, 962, 1600],
  [1030, 1544, 1024, 1594]
];

// The street grid. The flat town runs true north-south and east-west; the
// peninsula's grid is sheared about forty-five degrees against it and the two
// meet along the small inlet, which is a shear line unique to this town. Grid
// lines sit on one lattice so they line up across bands, and each band's left
// edge steps in to follow the coast rather than running out over the water.
const GRID_STEP = 96;
const GRID_ORIGIN = 48;
const GRID_BANDS = [
  [470, 692, W, 724],
  [300, 724, W, 760],
  [180, 760, W, 810],
  [60, 810, W, 880],
  [92, 880, W, 950],
  [128, 950, W, 1030],
  [162, 1030, W, 1120],
  [186, 1120, W, 1230],
  [206, 1230, W, 1350],
  [212, 1350, W, 1450],
  [198, 1450, W, 1532],
  [360, 1660, W, 1748]
];
const PENINSULA_GRID = [
  [470, 534, 876, 644], [458, 558, 840, 652], [456, 582, 796, 658],
  [478, 604, 740, 652],
  [448, 534, 416, 588], [488, 542, 458, 594], [528, 552, 498, 604],
  [568, 562, 538, 616], [608, 574, 578, 628], [648, 586, 618, 638],
  [688, 598, 658, 644], [728, 610, 700, 650], [768, 622, 742, 650]
];
const MAIN_ROADS = [[140, 1012, W, 1012], [604, 700, 604, 1528]];

/**
 * Draw the whole sheet onto one Graphics object.
 * @param {Phaser.GameObjects.Graphics} g
 * @param {{height?: number, ink?: number}} [opts]
 *   height: canvas height (default 1920); ink: headline ink alpha (default
 *   MAP_INK). Every layer's alpha is scaled off it.
 * @returns {Phaser.GameObjects.Graphics}
 */
export function drawTouristMap(g, opts = {}) {
  const height = opts.height ?? 1920;
  const a = opts.ink ?? MAP_INK;

  // The sheet, with two soft darker patches so it reads as paper, not a fill.
  ink(g, false, PAPER, 1);
  g.fillRect(0, 0, W, height);
  ink(g, false, INK, 0.035);
  g.fillEllipse(W * 0.78, height * 0.30, W * 1.1, height * 0.5);
  g.fillEllipse(W * 0.2, height * 0.82, W * 0.9, height * 0.4);

  // All the water in one pass, so no seam double-darkens.
  ink(g, false, WATER, a * 1.1);
  g.fillPoints(SEA, false, true);

  // The land the water enclosed, cut back in paper.
  const cutBack = [SOUND_ISLAND, BIG_ISLAND, FORK_ISLAND, FAR_BANK];
  for (const shape of cutBack) {
    ink(g, false, PAPER, 1);
    g.fillPoints(shape, false, true);
  }
  // The printed coastline, the line a paper map always has.
  inkLine(g, false, 3, INK, a * 1.5);
  g.strokePoints(SEA, true, true);
  for (const shape of cutBack) g.strokePoints(shape, true, true);

  // Parks: the two shaped ones, then the plain blobs, then the water in them.
  ink(g, false, PARK, a * 1.0);
  g.fillPoints(HEAD_PARK, false, true);
  g.fillPoints(POINT_FOREST, false, true);
  for (const shape of PARKS) g.fillPoints(shape, false, true);
  ink(g, false, WATER, a * 1.1);
  g.fillEllipse(LAGOON.x, LAGOON.y, LAGOON.w, LAGOON.h);
  for (const [cx, cy, w, h] of PONDS) g.fillEllipse(cx, cy, w, h);

  // The street grid, band by band, on one lattice; then the peninsula's own
  // sheared grid; then two slightly stronger main roads.
  inkLine(g, false, 2, INK, a * 0.45);
  for (const [x0, y0, x1, y1] of GRID_BANDS) {
    const firstX = GRID_ORIGIN + Math.ceil((x0 - GRID_ORIGIN) / GRID_STEP) * GRID_STEP;
    for (let x = firstX; x < x1; x += GRID_STEP) g.lineBetween(x, y0, x, y1);
    const firstY = GRID_ORIGIN + Math.ceil((y0 - GRID_ORIGIN) / GRID_STEP) * GRID_STEP;
    for (let y = firstY; y < y1; y += GRID_STEP) g.lineBetween(x0, y, x1, y);
  }
  for (const [x0, y0, x1, y1] of PENINSULA_GRID) g.lineBetween(x0, y0, x1, y1);
  inkLine(g, false, 4, INK, a * 0.7);
  for (const [x0, y0, x1, y1] of MAIN_ROADS) g.lineBetween(x0, y0, x1, y1);

  // The blocks on the wedge, and the dome across the water from the seawall.
  ink(g, false, INK, a * 1.0);
  for (const [x, y, w, h] of BLOCKS) g.fillRoundedRect(x, y, w, h, 4);
  g.slice(DOME.x, DOME.y, DOME.r, Math.PI, Math.PI * 2, false);
  g.fillPath();
  g.fillRect(DOME.x - DOME.r - 4, DOME.y, DOME.r * 2 + 8, 5);

  // The range, the far wall first and lighter, each in its two lobes.
  ink(g, false, INK, a * 0.6);
  g.fillPoints(FAR_RANGE, false, true);
  g.fillPoints(FAR_RANGE_E, false, true);
  ink(g, false, INK, a * 1.0);
  g.fillPoints(NEAR_RANGE, false, true);
  g.fillPoints(NEAR_RANGE_E, false, true);

  // The crossings: the big one over the first pinch, deck and two rails, then
  // the thin ones. Then the jetties out on the flats.
  ink(g, false, INK, a * 1.3);
  g.fillRoundedRect(BIG_BRIDGE[0] - 9, BIG_BRIDGE[1], 18, BIG_BRIDGE[3] - BIG_BRIDGE[1], 6);
  inkLine(g, false, 2, INK, a * 1.3);
  g.lineBetween(BIG_BRIDGE[0] - 15, BIG_BRIDGE[1] + 4, BIG_BRIDGE[2] - 15, BIG_BRIDGE[3] - 4);
  g.lineBetween(BIG_BRIDGE[0] + 15, BIG_BRIDGE[1] + 4, BIG_BRIDGE[2] + 15, BIG_BRIDGE[3] - 4);
  inkLine(g, false, 5, INK, a * 1.1);
  for (const [x0, y0, x1, y1] of THIN_BRIDGES) g.lineBetween(x0, y0, x1, y1);
  inkLine(g, false, 4, INK, a * 1.0);
  for (const [x0, y0, x1, y1] of JETTIES) g.lineBetween(x0, y0, x1, y1);

  // The day's route along the same curve the ship follows, as a fine red
  // stipple: getPoints samples each of the path's seven legs 240 times, about
  // 1.5 px apart, so keeping two samples in every four at a 5 px line width
  // reads as a dotted line rather than dashes. That is the look the owner
  // approved, so the sampling stays as it is.
  const samples = buildMapPath(3).getPoints(240);
  inkLine(g, false, 5, ROUTE, a * 1.4);
  for (let i = 1; i < samples.length; i++) {
    if ((i >> 1) % 2 === 0) continue;   // two samples on, two off
    const p = samples[i - 1], q = samples[i];
    g.lineBetween(p.x, p.y, q.x, q.y);
  }

  return g;
}
