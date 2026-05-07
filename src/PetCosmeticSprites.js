// Pixel-art cosmetic overlays for pets. Each cosmetic id has a tiny pixel
// grid drawn at the matching anchor on the pet (head_top / head_eye / neck /
// chest / back). Auras orbit the pet center and animate independently.
//
// renderPetCosmetic(ctx) — ctx is:
//   { scene, parent, item, speciesId, stage, layout, pal, anchor(name) }
//
// Grids use single-character cells. Per-grid palette maps each character to
// a color (number). '.' / ' ' = transparent.

import { darken, lighten } from './colorUtils.js';

const O = 0x07071a;          // outline (very dark)
const W = 0xffffff;           // white highlight

// Generic helper — draw a grid centered at (cx, cy).
function drawSprite(scene, parent, grid, palette, cx, cy, pxSize) {
  const cols = grid[0].length;
  const rows = grid.length;
  const ox = cx - (cols / 2) * pxSize;
  const oy = cy - (rows / 2) * pxSize;
  const g = scene.add.graphics();
  for (let r = 0; r < rows; r++) {
    const line = grid[r];
    for (let c = 0; c < cols; c++) {
      const ch = line[c];
      if (!ch || ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (color == null) continue;
      g.fillStyle(color, 1);
      g.fillRect(ox + c * pxSize, oy + r * pxSize, pxSize + 0.5, pxSize + 0.5);
    }
  }
  parent.add(g);
  return g;
}

function anchorOnTop(anchor, gridRows, pxSize) {
  return { x: anchor.x, y: anchor.y - (gridRows / 2) * pxSize };
}

// ============================================================================
// HATS — snacks first, then a few classics
// ============================================================================

function strawberryHat() {
  const r = 0xff5b6e, h = 0xff8b9b, s = 0x4f956b, k = W;
  return [[
    '....OssO........',
    '...OssOsO.......',
    '..OOssOO........',
    '.ORRRRRRRRO.....',
    'ORHRRkRRRRRO....',
    'ORRRRRRRRRRRO...',
    'ORHRRRRkRRRRRO..',
    '.ORRRRRRRRRRO...',
    '..ORRRRkRRRO....',
    '...ORRRRRRO.....',
    '....ORRRO.......',
    '.....OO.........'
  ], { O, R: r, H: h, s, k }];
}

function bananaHat() {
  const c = 0xffe07a, h = lighten(c, 0.30), d = darken(c, 0.40), b = 0x8b6420;
  return [[
    '............OO.',
    '...........OBO.',
    '..........OBBO.',
    '.........OBBO..',
    '.....OOOOBBO...',
    '....OcccBBOO...',
    '...OcHcccBO....',
    '..OccccccBO....',
    '..OccccccO.....',
    '...OccccO......',
    '....OOOO.......'
  ], { O, c, H: h, B: b, d }];
}

function avocadoHat() {
  const skin = 0x4f956b, flesh = 0x9be8a3, pit = 0x6b3a1a, h = lighten(flesh, 0.25);
  return [[
    '....OOOOOO....',
    '...OssssssO...',
    '..OsffffffsO..',
    '.OsffhhhhffsO.',
    'OsffhhhhhhffsO',
    'OsffhPPPPhhfsO',
    'OsffhPPPPhhfsO',
    '.OsffhhhhffsO.',
    '..OsffhhfsO...',
    '...OssssO.....',
    '....OOOO......'
  ], { O, s: skin, f: flesh, h, P: pit }];
}

function pizzaHat() {
  const crust = 0xc77a4a, cheese = 0xffd86b, sauce = 0xff5b6e, basil = 0x4f956b, p = 0xff8b3d;
  return [[
    '.......OO.......',
    '......OccO......',
    '.....OcccCO.....',
    '....OcccCcCO....',
    '...OcccPCcCcO...',
    '..OcccPccCccCO..',
    '.OccCccccPCccCO.',
    'OccCccPccccCccCO',
    'ObbbbbbbbbbbbbO',
    'OBBBBBBBBBBBBBO',
    '.OOOOOOOOOOOOO.'
  ], { O, c: cheese, C: sauce, P: p, b: crust, B: darken(crust, 0.30) }];
}

function donutHat() {
  const dough = 0xc77a4a, frost = 0xff9ec7, fh = lighten(0xff9ec7, 0.25),
        s1 = 0xfff3b8, s2 = 0xb6e0ff, s3 = 0x9be8a3;
  return [[
    '...OOOOOOOOO....',
    '..OFFFFFFFFFO...',
    '.OFsFFFsFFFsFO..',
    'OFFFsFFFsFFFsFO.',
    'OFsFOOOOOOFFFFO.',
    'OFFOddddOOFsFFO.',
    'OFFOdddddOFFsFO.',
    'OsFOddddOOFsFFO.',
    'OFsFOOOOOOFFFFO.',
    'OFFFsFFFsFFFsFO.',
    '.OFsFFFsFFFsFO..',
    '..OFFFFFFFFFO...',
    '...OOOOOOOOO....'
  ], { O, F: frost, f: fh, d: dough, s: s1 }];
}

function onigiriHat() {
  const w = 0xfafaf0, h = lighten(w, 0.10), n = 0x12122a, s = 0x4f956b;
  return [[
    '......OO......',
    '.....OWWO.....',
    '....OWHHWO....',
    '...OWHHHHWO...',
    '..OWHHHHHHWO..',
    '.OWHHHHHHHHWO.',
    'OWHHHHHHHHHHWO',
    'OWHHHHHHHHHHWO',
    'ONNNNNNNNNNNNO',
    'ONNNNssssNNNNO',
    'ONNNNNNNNNNNNO',
    'OWHHHHHHHHHHWO',
    'OOOOOOOOOOOOOO'
  ], { O, W: w, H: h, N: n, s }];
}

function taiyakiHat() {
  const c = 0xc77a4a, h = lighten(c, 0.30), e = 0x12122a;
  return [[
    '......OO........',
    '.....OBBO.......',
    '....OBBBBOOOO...',
    '...OBHBBBBBBBO..',
    '..OBHBBBBBBBBBO.',
    '.OBHBBeBBBBBBBO.',
    'OBHBBBBBBBBBBBO.',
    'OBHBBBBBBBBBBO..',
    '.OBBBBBBBBBBO...',
    '..OBBBBBBBBO....',
    '...OOOOOOOOOO...'
  ], { O, B: c, H: h, e }];
}

function sushiHat() {
  const rice = 0xfafaf0, riceH = lighten(rice, 0.10), salmon = 0xff8b3d,
        salmonH = lighten(0xff8b3d, 0.30), seaweed = 0x12122a;
  return [[
    '..OOOOOOOOOO....',
    '.OSSSSSSSSSO....',
    'OSHSHSHSHSSO....',
    'OSSSSSSSSSSO....',
    'OnnnnnnnnnnnO...',
    '.OWHHHHHHHHWO...',
    'OWHHHHHHHHHWO...',
    'OWHHHHHHHHHWO...',
    '.OOOOOOOOOOO....'
  ], { O, S: salmon, H: salmonH, n: seaweed, W: rice, h: riceH }];
}

function propellerHat(item) {
  const c = item.color, h = lighten(c, 0.30);
  return [[
    'AAAAA.....AAAAA',
    'AAAAA..O..AAAAA',
    '......OBO......',
    '...OOOOOOOOO...',
    '..OBHHHHHHHBO..',
    '.OBHHBBBBBBBBO.',
    'OBBBBBBBBBBBBBO',
    'OOOOOOOOOOOOOOO'
  ], { O, B: c, H: h, A: 0xff5b6e }];
}

function astronaut(item) {
  const c = item.color;
  return [[
    '....OOOOOOOO....',
    '..OOBBBBBBBBOO..',
    '.OBBBBHHHHBBBBO.',
    'OBBBBHHHHHHBBBBO',
    'OBBOOOOOOOOBBBBO',
    'OBBOVVVVVKOBBBBO',
    'OBBOVVVVVVOBBBBO',
    'OBBOVVVVVVOBBBBO',
    'OBBOOOOOOOOBBBBO',
    'OBBBBBBBBBBBBBBO',
    'OOOOOOOOOOOOOOOO'
  ], { O, B: c, H: lighten(c, 0.30), V: 0x4a90c2, K: 0xb6e0ff }];
}

function starHelmet(item) {
  const c = item.color, h = lighten(c, 0.30);
  return [[
    '...OOOOOOOOO...',
    '..OBHHHHHHHBO..',
    '.OBBHHHHHHHHBBO.',
    'OBBHHHKKKHHHBBO',
    'OBHHKKKKKKKHHBO',
    'OBHKKKKKKKKKHBO',
    'OBHKKK.K.KKKHBO',
    'OBBHKK...KKHBBO',
    'OBBBHHHHHHHBBBO',
    'OOOOOOOOOOOOOOO'
  ], { O, B: c, H: h, K: W }];
}

function wizardHat(item) {
  // Pointy conical hat with a wide brim and a couple of star sparkles. The
  // tip is offset by 1 column so it has a slight whimsical lean.
  const c = item.color;
  const h = lighten(c, 0.30);
  const star = 0xfff3b8;
  const band = darken(c, 0.30);
  return [[
    '.......OO.......',
    '......OBBO......',
    '......OBHO......',
    '.....OBHBBO.....',
    '.....OBBKBO.....',
    '....OBHBBBBO....',
    '....OBBBBBBO....',
    '...OBBBKHBBBO...',
    '...OBBBBBBBBO...',
    '..OBBHBBBBBBBO..',
    '.OBBBBBBKBBBBBO.',
    '.OdddddddddddddO',
    'OOOOOOOOOOOOOOOO'
  ], { O, B: c, H: h, K: star, d: band }];
}

function crownOfStars(item) {
  const c = item.color, h = lighten(c, 0.30);
  return [[
    '..O....O....O...',
    '.OAO..OAO..OAO..',
    '.OAO..OAO..OAO..',
    'OAAOAAOAOAAOAAO.',
    'OBBBBBBBBBBBBBBO',
    'OBHHHHHHHHHHHBHBO',
    'OBKBKBKBKBKBKBO.',
    'OOOOOOOOOOOOOOO.'
  ], { O, B: c, H: h, A: 0xffd86b, K: 0xff9ec7 }];
}

// Galaxy Helm — legendary cosmic helmet with swirl band and orbital ring
function galaxyHelm() {
  const purple = 0x6c2bd9;
  const lavender = 0xc77eff;
  const cyan = 0x4ecdc4;
  const star = 0xffd86b;
  return [[
    '......OOOO......',
    '.....OBBBBO.....',
    '....OBHHHHBO....',
    '...OBHHHHHHBO...',
    '...OBHCCCHHBO...',
    '..OBHCKCKCHHBO..',
    '..OBHHCKCHHHBO..',
    '...OBHHHHHHBO...',
    '....OBBBBBBO....',
    '....OBKBKBKO....',
    '...OAOOOOOOAO...',
    '..OAA......AAO..'
  ], { O, B: purple, H: lavender, C: cyan, K: 0xffffff, A: star }];
}

const HAT_DRAWERS = {
  hat_strawberry: strawberryHat,
  hat_banana: bananaHat,
  hat_avocado: avocadoHat,
  hat_pizza: pizzaHat,
  hat_donut: donutHat,
  hat_onigiri: onigiriHat,
  hat_taiyaki: taiyakiHat,
  hat_sushi: sushiHat,
  hat_propeller: propellerHat,
  hat_astronaut: astronaut,
  hat_wizard: wizardHat,
  hat_starhat: starHelmet,
  hat_crown_stars: crownOfStars,
  hat_galaxy_helm: galaxyHelm
};

// ============================================================================
// ACCESSORIES
// ============================================================================

function shades(item) {
  const c = item.color, h = 0xffffff;
  return [[
    'OOOOOOOOOOOOOOOO',
    'OBBBBBOOOBBBBBBO',
    'OBHBBBOOOBHBBBBO',
    'OBBBBBOOOBBBBBBO',
    'OOOOOOO.OOOOOOOO'
  ], { O, B: c, H: h }];
}

function bobaTea(item) {
  const cup = lighten(item.color, 0.30), tea = item.color, lid = 0xfafaf0,
        straw = 0xff5b6e, pearl = 0x12122a;
  return [[
    '..OOOOOOO...',
    '..OLLLLLO...',
    '..OLLLLLO...',
    '..OOOOOOO.OO',
    '.OcTTTTTcOSO',
    'OcTTPTTTTcSO',
    'OcTPPTPPTcOO',
    'OcTTTPTTTcO.',
    'OcTPTTPTTcO.',
    '.OcTTTTTcO..',
    '..OcccccO...',
    '...OOOOO....'
  ], { O, L: lid, c: cup, T: tea, P: pearl, S: straw }];
}

function pockyStick(item) {
  const stick = 0xfafaf0, dip = item.color, dipH = lighten(item.color, 0.30);
  return [[
    'OOOOOOOOOOOOOOOO',
    'OssssssssssDDDDO',
    'OssssssssssDHDDO',
    'OssssssssssDDDDO',
    'OOOOOOOOOOOOOOOO'
  ], { O, s: stick, D: dip, H: dipH }];
}

function cookie(item) {
  const c = item.color, h = lighten(c, 0.20), chip = 0x4a2a1a;
  return [[
    '...OOOOOOOO....',
    '..OBHBBBBHBO...',
    '.OBHBBCBBBBBO..',
    'OBBBCCCBBHBBBO.',
    'OBBHBBBBBCCBBO.',
    'OBBBBHBCCCBBHO.',
    'OBHBCCBBHBBBBO.',
    '.OBBBBBBHBBBO..',
    '..OBHBBBBBBO...',
    '...OOOOOOOO....'
  ], { O, B: c, H: h, C: chip }];
}

function dangoSkewer(item) {
  const stick = 0x8b6420, p = item.color, g = 0x9be8a3, w = 0xfafaf0;
  return [[
    '...OOO..OOO..OOO',
    '..OPPPOOGGGOOWWWO',
    '.OPHPPOGHGGOWHWWO',
    '.OPPPOGGGGGOWWWWO',
    '..OPPOGGGGOWWWWO',
    '...OOOO..OOO..OO',
    'sssssssssssssss.',
    'sssssssssssssss.'
  ], { O, P: p, H: lighten(p, 0.30), G: g, W: w, s: stick }];
}

function jetpack(item) {
  const c = item.color, d = darken(c, 0.35);
  return [[
    '.OOO.....OOO.',
    'OBHBO...OBHBO',
    'OBBBO...OBBBO',
    'OBBBO...OBBBO',
    'OBBBO...OBBBO',
    'OdddO...OdddO',
    'OOOOO...OOOOO'
  ], { O, B: c, H: lighten(c, 0.30), d: d }];
}

function antennaSprite(item) {
  const c = item.color;
  return [[
    '..AAA..',
    '.AaaaA.',
    'AaaKaaA',
    '.AaaaA.',
    '..AAA..',
    '...A...',
    '...A...',
    '...O...',
    '...O...'
  ], { O, A: c, a: lighten(c, 0.40), K: W }];
}

function rainbowScarf() {
  return [[
    'OOOOOOOOOOOOOOOO',
    'O11111111111111O',
    'O22222222222222O',
    'O33333333333333O',
    'O44444444444444O',
    'O55555555555555O',
    'O66666666666666O',
    'OOOOOOOO.OOOOOOO',
    '......OO111O....',
    '......OO222O....',
    '......OO333O....',
    '......OO444O....',
    '......OO555O....',
    '.......OOOOO....'
  ], {
    O,
    '1': 0xff5b6e, '2': 0xff8b3d, '3': 0xffd86b,
    '4': 0x58d68d, '5': 0x4ecdc4, '6': 0xc77eff
  }];
}

function tinyWings(item) {
  const c = item.color, h = lighten(c, 0.40);
  return [[
    '.OOOO........OOOO.',
    'OBBBHO......OHBBBO',
    'OBHHHHO....OHHHHBO',
    'OBHHHHHO..OHHHHHBO',
    'OBHHHHHHOOHHHHHHBO',
    'OBHHHHHHOOHHHHHHBO',
    'OBBHHHO....OHHHBBO',
    '.OOOOO......OOOOO.'
  ], { O, B: c, H: h }];
}

function heroCape(item) {
  const c = item.color, d = darken(c, 0.35), h = lighten(c, 0.25);
  return [[
    'OOOOOOOOOOOOOOOO',
    'OBHBBBBBBBBBBBHO',
    'OBHBBBBBBBBBBBHO',
    'OBdBBBBBBBBBBBdO',
    'OBdBBBBBBBBBBBdO',
    'OBdBBBBBBBBBBBdO',
    '.OBBBBBBBBBBBBO.',
    '.OBdBBBBBBBBBdO.',
    '..OBBBBBBBBBBO..',
    '..OBdBBBBBBBdO..',
    '...OBBBBBBBBO...',
    '....OBBBBBBO....',
    '.....OBBBBO.....',
    '......OBBO......',
    '.......OO.......'
  ], { O, B: c, H: h, d: d }];
}

// Void Amulet — legendary deep-purple gem on a thin chain
function voidAmulet() {
  const purple = 0x6c2bd9;
  const ph = lighten(purple, 0.35);
  const star = 0xffffff;
  const chain = 0xc8c8d8;
  return [[
    'O...........O',
    '.O.........O.',
    '..O.......O..',
    '...OcOOOcO...',
    '....OPPPO....',
    '...OPPHPPO...',
    '..OPPHKHPPO..',
    '..OPHKKKHPO..',
    '..OPPHKHPPO..',
    '...OPPHPPO...',
    '....OPPPO....',
    '.....OOO.....'
  ], { O, P: purple, H: ph, K: star, c: chain }];
}

// Phoenix Cape — flaming cape with gold-tipped flame edges (legendary).
function phoenixCape() {
  const r = 0xff5b3d;        // red base
  const o = 0xff8b3d;        // orange mid
  const y = 0xffd86b;        // gold highlight
  const dr = darken(r, 0.35);
  return [[
    'O.OOOOOOOOOOOOOO.O',
    'OyOyrrrrrrrrrrrOyO',
    'OrOorrrrrrrrrroOrO',
    'OroorrrrrrrrrrooOO',
    'OrdoorrrrrrrrrodrO',
    'OrdoorrrrrrrrrodrO',
    '.ORoorrrrrrrrrooRO',
    '.OodorrrrrrrrrdoO.',
    '..OorrrrrrrrrroO..',
    '..OodoorrrrrrooO..',
    '...OorrrrrrrroO...',
    '....OoorrrroOyO...',
    '.....OorrroOyO....',
    '......OorrOyO.....',
    '.......OyOyO......',
    '........OyO.......'
  ], { O, r, o, d: dr, y, R: dr }];
}

const ACC_DRAWERS = {
  acc_shades: shades,
  acc_boba: bobaTea,
  acc_pocky: pockyStick,
  acc_cookie: cookie,
  acc_dango: dangoSkewer,
  acc_jetpack: jetpack,
  acc_antenna: antennaSprite,
  acc_starbow: rainbowScarf,
  acc_wings: tinyWings,
  acc_cape: heroCape,
  acc_phoenix_cape: phoenixCape,
  acc_void_amulet: voidAmulet
  // acc_starhalo handled separately (orbiting container)
};

// Each accessory id maps to the pet anchor it sits on. Keeps placement logic
// data-driven instead of a long if/else cascade.
const ACC_ANCHORS = {
  acc_shades:   { name: 'head_eye' },
  acc_boba:     { name: 'neck' },
  acc_pocky:    { name: 'neck' },
  acc_cookie:   { name: 'neck' },
  acc_dango:    { name: 'neck' },
  acc_antenna:  { name: 'head_top', mode: 'onTop' },
  acc_jetpack:  { name: 'back', mode: 'below' },
  acc_wings:    { name: 'back' },
  acc_cape:     { name: 'back', mode: 'below' },
  acc_starbow:  { name: 'neck' },
  acc_phoenix_cape: { name: 'back', mode: 'below' },
  acc_void_amulet: { name: 'neck' }
};

// ============================================================================
// AURAS
// ============================================================================

function drawAura(item, ctx) {
  if (item.id === 'aura_none') return;

  const aura = ctx.scene.add.container(0, 0);
  ctx.parent.add(aura);

  // Built-in aura specs — the big ones get bespoke handlers so each aura feels
  // distinct rather than re-skinned versions of the same orbit.
  if (item.id === 'aura_hearts')    return auraHearts(item, ctx, aura);
  if (item.id === 'aura_orbit')     return auraStarOrbit(item, ctx, aura);
  if (item.id === 'aura_sparkle')   return auraSparkle(item, ctx, aura);
  if (item.id === 'aura_rainbow')   return auraRainbow(item, ctx, aura);
  if (item.id === 'aura_legendary') return auraLegendary(item, ctx, aura);
  if (item.id === 'aura_bubbles')   return auraBubbles(item, ctx, aura);
  if (item.id === 'aura_petals')    return auraPetals(item, ctx, aura);
  if (item.id === 'aura_flame')     return auraFlame(item, ctx, aura);
  if (item.id === 'aura_snow')      return auraSnow(item, ctx, aura);
  if (item.id === 'aura_lightning') return auraLightning(item, ctx, aura);
  if (item.id === 'aura_planets')   return auraPlanets(item, ctx, aura);
  if (item.id === 'aura_galaxy')    return auraGalaxy(item, ctx, aura);
  if (item.id === 'aura_embers')    return auraEmbers(item, ctx, aura);
  if (item.id === 'aura_constellation') return auraConstellation(item, ctx, aura);
}

function orbitRadii(layout) {
  return { rx: layout.width * 0.65, ry: layout.height * 0.55 };
}

function placeOrbit(g, i, count, rx, ry, phase = 0) {
  const a = (i / count) * Math.PI * 2 + phase;
  g.x = Math.cos(a) * rx;
  g.y = Math.sin(a) * ry;
}

function spinAura(scene, aura, durationMs, dir = 1) {
  scene.tweens.add({
    targets: aura, angle: 360 * dir,
    duration: durationMs, repeat: -1, ease: 'Linear'
  });
}

function auraSparkle(item, ctx, aura) {
  const { rx, ry } = orbitRadii(ctx.layout);
  const grid = ['..A..', '.AAA.', 'AAAAA', '.AAA.', '..A..'];
  for (let i = 0; i < 7; i++) {
    const dot = ctx.scene.add.graphics();
    drawPixelArt(dot, grid, { A: item.color }, 2);
    placeOrbit(dot, i, 7, rx, ry);
    aura.add(dot);
  }
  spinAura(ctx.scene, aura, 6000);
}

function auraStarOrbit(item, ctx, aura) {
  const { rx, ry } = orbitRadii(ctx.layout);
  const grid = ['..A..', '.AAA.', 'AAAAA', '.A.A.', 'A...A'];
  for (let i = 0; i < 4; i++) {
    const dot = ctx.scene.add.graphics();
    drawPixelArt(dot, grid, { A: item.color }, 2);
    placeOrbit(dot, i, 4, rx, ry);
    aura.add(dot);
  }
  spinAura(ctx.scene, aura, 3000);
}

function auraHearts(item, ctx, aura) {
  const { rx, ry } = orbitRadii(ctx.layout);
  const palette = [0xff9ec7, 0xff5b6e];
  const heart = ['.OO.OO.', 'OBBBBBO', 'OBBBBBO', '.OBBBO.', '..OBO..', '...O...'];
  for (let i = 0; i < 7; i++) {
    const dot = ctx.scene.add.graphics();
    drawPixelArt(dot, heart, { O, B: palette[i % palette.length] }, 2);
    placeOrbit(dot, i, 7, rx, ry);
    aura.add(dot);
  }
  spinAura(ctx.scene, aura, 6000);
}

function auraRainbow(item, ctx, aura) {
  const { rx, ry } = orbitRadii(ctx.layout);
  const palette = [0xff9ec7, 0xffe07a, 0x9be8a3, 0xb6e0ff, 0xc77eff];
  const grid = ['..A..', '.AAA.', 'AAAAA', '.AAA.', '..A..'];
  for (let i = 0; i < 7; i++) {
    const dot = ctx.scene.add.graphics();
    drawPixelArt(dot, grid, { A: palette[i % palette.length] }, 2);
    placeOrbit(dot, i, 7, rx, ry);
    aura.add(dot);
  }
  spinAura(ctx.scene, aura, 6000);
}

function auraLegendary(item, ctx, aura) {
  const palette = [0xfff3b8, 0xffe07a, 0xff9ec7];
  const { rx, ry } = orbitRadii(ctx.layout);
  const grid = ['..A..', '.AAA.', 'AAAAA', '.AAA.', '..A..'];
  for (let i = 0; i < 7; i++) {
    const dot = ctx.scene.add.graphics();
    drawPixelArt(dot, grid, { A: palette[i % palette.length] }, 2);
    placeOrbit(dot, i, 7, rx, ry);
    aura.add(dot);
  }
  spinAura(ctx.scene, aura, 6000);
  ctx.scene.tweens.add({
    targets: aura, scale: { from: 1, to: 1.18 },
    duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
  });
}

function auraBubbles(item, ctx, aura) {
  // Bubbles drift up from the pet's feet and fade. Re-spawn with delays.
  const baseY = ctx.layout.height * 0.5;
  const spread = ctx.layout.width * 0.55;
  const count = 6;
  for (let i = 0; i < count; i++) {
    const launch = () => {
      const bub = ctx.scene.add.graphics();
      const r = 4 + Math.random() * 4;
      bub.lineStyle(1.5, item.color, 1);
      bub.strokeCircle(0, 0, r);
      bub.fillStyle(W, 0.4);
      bub.fillCircle(-r * 0.3, -r * 0.3, r * 0.35);
      bub.x = (Math.random() - 0.5) * spread;
      bub.y = baseY;
      aura.add(bub);
      ctx.scene.tweens.add({
        targets: bub,
        y: -ctx.layout.height * 0.55,
        x: bub.x + (Math.random() - 0.5) * 30,
        alpha: 0,
        duration: 2200 + Math.random() * 800,
        ease: 'Sine.easeOut',
        onComplete: () => { bub.destroy(); launch(); }
      });
    };
    ctx.scene.time.delayedCall(i * 350, launch);
  }
}

function auraPetals(item, ctx, aura) {
  // Drifting petals — each tween loops and respawns from above.
  const spread = ctx.layout.width * 0.6;
  const top = -ctx.layout.height * 0.55;
  const bottom = ctx.layout.height * 0.55;
  const palette = [0xff9ec7, 0xffd6e1, 0xffb6c8];
  const petalGrid = ['.OOO.', 'OPPPO', 'OPHPO', 'OPPPO', '.OOO.'];
  for (let i = 0; i < 7; i++) {
    const launch = () => {
      const petal = ctx.scene.add.graphics();
      const c = palette[Math.floor(Math.random() * palette.length)];
      drawPixelArt(petal, petalGrid, { O, P: c, H: lighten(c, 0.30) }, 1.5);
      petal.x = (Math.random() - 0.5) * spread;
      petal.y = top;
      petal.angle = Math.random() * 360;
      aura.add(petal);
      ctx.scene.tweens.add({
        targets: petal,
        y: bottom,
        x: petal.x + (Math.random() - 0.5) * 40,
        angle: petal.angle + 180,
        duration: 3000 + Math.random() * 1500,
        ease: 'Sine.easeIn',
        onComplete: () => { petal.destroy(); launch(); }
      });
    };
    ctx.scene.time.delayedCall(i * 400, launch);
  }
}

function auraFlame(item, ctx, aura) {
  // Ring of flickering flame pixels at the base.
  const { rx } = orbitRadii(ctx.layout);
  const baseY = ctx.layout.height * 0.45;
  const flameColors = [0xff5b6e, 0xff8b3d, 0xffd86b];
  for (let i = 0; i < 9; i++) {
    const flame = ctx.scene.add.graphics();
    const ang = (i / 9) * Math.PI - Math.PI / 2;
    flame.x = Math.cos(ang) * rx * 0.85;
    flame.y = baseY + Math.sin(ang) * 6;
    const grid = ['..A..', '.ABA.', 'ABCBA', 'ABCBA', '.ACA.'];
    drawPixelArt(flame, grid, { A: flameColors[0], B: flameColors[1], C: flameColors[2] }, 2);
    aura.add(flame);
    ctx.scene.tweens.add({
      targets: flame,
      scaleY: { from: 1, to: 1.4 },
      alpha: { from: 0.85, to: 1 },
      duration: 250 + Math.random() * 250,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      delay: Math.random() * 200
    });
  }
}

function auraSnow(item, ctx, aura) {
  // Snowflakes orbit slowly while gently drifting.
  const { rx, ry } = orbitRadii(ctx.layout);
  const flake = ['.OAO.', 'OAAAO', 'AAAAA', 'OAAAO', '.OAO.'];
  for (let i = 0; i < 9; i++) {
    const dot = ctx.scene.add.graphics();
    drawPixelArt(dot, flake, { O: lighten(item.color, 0.20), A: W }, 1.5);
    placeOrbit(dot, i, 9, rx, ry * 0.9);
    aura.add(dot);
    ctx.scene.tweens.add({
      targets: dot, scale: { from: 0.8, to: 1.1 },
      duration: 1200 + Math.random() * 600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }
  spinAura(ctx.scene, aura, 9000);
}

function auraLightning(item, ctx, aura) {
  // Three lightning bolts crackle around the pet, blinking on/off.
  const { rx, ry } = orbitRadii(ctx.layout);
  const bolt = [
    '...AA',
    '..AA.',
    '.AAAA',
    '..AA.',
    '.AA..',
    'AA...'
  ];
  for (let i = 0; i < 4; i++) {
    const z = ctx.scene.add.graphics();
    drawPixelArt(z, bolt, { A: item.color }, 2);
    placeOrbit(z, i, 4, rx, ry, Math.PI / 4);
    z.alpha = 0;
    aura.add(z);
    ctx.scene.tweens.add({
      targets: z, alpha: { from: 0, to: 1 },
      duration: 100, hold: 80, yoyo: true,
      repeat: -1, repeatDelay: 400 + Math.random() * 600,
      delay: i * 220, ease: 'Linear'
    });
  }
}

function auraPlanets(item, ctx, aura) {
  // Three tiny planets orbiting at different radii and speeds.
  const baseRx = ctx.layout.width * 0.58;
  const baseRy = ctx.layout.height * 0.46;
  const planets = [
    { color: 0xff5b6e, r: 4, scale: 0.85, speed: 4200 },
    { color: 0x9be8a3, r: 3, scale: 1.05, speed: 5600 },
    { color: 0xb6e0ff, r: 5, scale: 1.20, speed: 7200 }
  ];
  planets.forEach((p, i) => {
    const orbit = ctx.scene.add.container(0, 0);
    const dot = ctx.scene.add.graphics();
    dot.fillStyle(p.color, 1);
    dot.fillCircle(0, 0, p.r);
    dot.fillStyle(lighten(p.color, 0.40), 1);
    dot.fillCircle(-p.r * 0.3, -p.r * 0.3, p.r * 0.4);
    dot.x = baseRx * p.scale;
    dot.y = 0;
    orbit.add(dot);
    orbit.angle = (i / planets.length) * 360;
    orbit.scaleY = baseRy / baseRx;
    aura.add(orbit);
    ctx.scene.tweens.add({
      targets: orbit, angle: orbit.angle + 360,
      duration: p.speed, repeat: -1, ease: 'Linear'
    });
  });
}

function auraGalaxy(item, ctx, aura) {
  // Two slow swirling arms of stars + a dense center.
  const arms = 2;
  const dotsPerArm = 9;
  const { rx, ry } = orbitRadii(ctx.layout);
  const palette = [0xfff3b8, 0xffd86b, 0xc77eff, 0xb6e0ff];
  for (let arm = 0; arm < arms; arm++) {
    const armC = ctx.scene.add.container(0, 0);
    armC.angle = (arm / arms) * 360;
    for (let i = 0; i < dotsPerArm; i++) {
      const t = i / dotsPerArm;
      const radius = rx * (0.18 + t * 0.95);
      const angle = t * Math.PI * 1.6;
      const dot = ctx.scene.add.graphics();
      const c = palette[i % palette.length];
      dot.fillStyle(c, 0.9);
      dot.fillCircle(0, 0, 2 + (1 - t) * 2);
      dot.x = Math.cos(angle) * radius;
      dot.y = Math.sin(angle) * radius * (ry / rx);
      armC.add(dot);
    }
    aura.add(armC);
  }
  // Bright center
  const core = ctx.scene.add.graphics();
  core.fillStyle(0xfff3b8, 0.9);
  core.fillCircle(0, 0, 4);
  core.fillStyle(W, 1);
  core.fillCircle(0, 0, 2);
  aura.add(core);
  spinAura(ctx.scene, aura, 9000);
  ctx.scene.tweens.add({
    targets: core, scale: { from: 0.9, to: 1.4 },
    duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
  });
}

// Rising embers — chunky pixel sparks float up from the pet's feet, fade out.
function auraEmbers(item, ctx, aura) {
  const spread = ctx.layout.width * 0.55;
  const baseY = ctx.layout.height * 0.5;
  const top = -ctx.layout.height * 0.55;
  const palette = [0xff5b3d, 0xff8b3d, 0xffd86b, 0xfff3b8];
  const sparkGrid = ['.A.', 'AKA', '.A.'];
  for (let i = 0; i < 8; i++) {
    const launch = () => {
      const ember = ctx.scene.add.graphics();
      const c = palette[Math.floor(Math.random() * palette.length)];
      drawPixelArt(ember, sparkGrid, { A: c, K: lighten(c, 0.45) }, 1.4 + Math.random() * 1.0);
      ember.x = (Math.random() - 0.5) * spread;
      ember.y = baseY;
      aura.add(ember);
      ctx.scene.tweens.add({
        targets: ember,
        y: top + Math.random() * 30,
        x: ember.x + (Math.random() - 0.5) * 50,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.5 },
        duration: 1500 + Math.random() * 900,
        ease: 'Quad.easeOut',
        onComplete: () => { ember.destroy(); launch(); }
      });
    };
    ctx.scene.time.delayedCall(i * 240, launch);
  }
}

// Constellation — five stars connected by faint lines, slowly rotating.
function auraConstellation(item, ctx, aura) {
  const { rx, ry } = orbitRadii(ctx.layout);
  const points = 5;
  const palette = [0xfff3b8, 0xb6e0ff, 0xffe07a, 0xffffff, 0xc77eff];
  const positions = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2 - Math.PI / 2;
    positions.push({ x: Math.cos(a) * rx, y: Math.sin(a) * ry });
  }
  // Faint connecting lines (drawn first, behind stars)
  const links = ctx.scene.add.graphics();
  links.lineStyle(1, item.color, 0.55);
  for (let i = 0; i < points; i++) {
    const p = positions[i];
    const q = positions[(i + 2) % points];
    links.lineBetween(p.x, p.y, q.x, q.y);
  }
  aura.add(links);
  const grid = ['..A..', '.AAA.', 'AAAAA', '.A.A.', 'A...A'];
  positions.forEach((pos, i) => {
    const star = ctx.scene.add.graphics();
    drawPixelArt(star, grid, { A: palette[i % palette.length] }, 2);
    star.x = pos.x;
    star.y = pos.y;
    aura.add(star);
    ctx.scene.tweens.add({
      targets: star,
      scale: { from: 0.85, to: 1.15 },
      alpha: { from: 0.75, to: 1 },
      duration: 900 + i * 160,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  });
  spinAura(ctx.scene, aura, 9000);
}

function drawPixelArt(g, grid, palette, px) {
  const cols = grid[0].length;
  const rows = grid.length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      if (!ch || ch === '.' || ch === ' ') continue;
      const color = palette[ch];
      if (color == null) continue;
      g.fillStyle(color, 1);
      g.fillRect((c - cols / 2) * px, (r - rows / 2) * px, px + 0.5, px + 0.5);
    }
  }
}

// Star halo — orbits at constant radius around the pet's head.
function starHalo(item, ctx) {
  const halo = ctx.scene.add.container(0, 0);
  const cx = 0;
  const cy = -ctx.layout.height * 0.20;
  const radius = ctx.layout.width * 0.55;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const star = ctx.scene.add.graphics();
    const grid = ['..A..', '.AAA.', 'AAAAA', '.A.A.', 'A...A'];
    drawPixelArt(star, grid, { A: item.color }, 2);
    star.x = cx + Math.cos(a) * radius;
    star.y = cy + Math.sin(a) * radius * 0.45;
    halo.add(star);
  }
  ctx.parent.add(halo);
  ctx.parent.starHalo = halo;
}

// ============================================================================
// Public dispatcher
// ============================================================================

export function renderPetCosmetic(ctx) {
  const id = ctx.item.id;
  const layout = ctx.layout;
  const px = layout.pixelSize * 0.7;

  if (id === 'aura_none') return;

  if (id.startsWith('aura_')) {
    drawAura(ctx.item, ctx);
    return;
  }

  if (id === 'acc_starhalo') {
    starHalo(ctx.item, ctx);
    return;
  }

  // HATS — drawn at head_top (bottom edge of grid lands at head_top)
  if (HAT_DRAWERS[id]) {
    const data = HAT_DRAWERS[id](ctx.item);
    if (!data) return;
    const [grid, palette] = data;
    const a = ctx.anchor('head_top');
    const pos = anchorOnTop(a, grid.length, px);
    const sprite = drawSprite(ctx.scene, ctx.parent, grid, palette, pos.x, pos.y, px);
    if (id === 'hat_propeller') {
      ctx.scene.tweens.add({
        targets: sprite, scaleX: { from: 1, to: -1 },
        duration: 4000, repeat: -1, ease: 'Linear'
      });
      ctx.parent.propeller = sprite;
    }
    return;
  }

  if (ACC_DRAWERS[id]) {
    const data = ACC_DRAWERS[id](ctx.item);
    if (!data) return;
    const [grid, palette] = data;
    const cfg = ACC_ANCHORS[id] || { name: 'neck' };
    const a = ctx.anchor(cfg.name);
    let pos;
    if (cfg.mode === 'onTop') pos = anchorOnTop(a, grid.length, px);
    else if (cfg.mode === 'below') pos = { x: a.x, y: a.y + (grid.length / 2) * px };
    else pos = { x: a.x, y: a.y };
    const sprite = drawSprite(ctx.scene, ctx.parent, grid, palette, pos.x, pos.y, px);

    if (id === 'acc_jetpack') {
      const flame = ctx.scene.add.graphics();
      flame.fillStyle(0xff8b3d, 1);
      const fy = pos.y + (grid.length / 2) * px;
      flame.fillRect(pos.x - px * 5, fy, px * 2, px * 3);
      flame.fillRect(pos.x + px * 3, fy, px * 2, px * 3);
      flame.fillStyle(0xffd86b, 1);
      flame.fillRect(pos.x - px * 4.5, fy + px * 0.5, px, px * 2);
      flame.fillRect(pos.x + px * 3.5, fy + px * 0.5, px, px * 2);
      flame.setAlpha(0);
      ctx.parent.add(flame);
      ctx.parent.jetpackFlame = flame;
    }
    if (id === 'acc_antenna') {
      const tipX = pos.x;
      const tipY = pos.y - (grid.length / 2) * px;
      ctx.parent.antennaTip = { x: tipX, y: tipY };
    }
    return;
  }
}
