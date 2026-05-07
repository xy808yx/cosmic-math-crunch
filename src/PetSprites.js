// Pixel-grid pet sprites. Each (species × stage) defines a 2D character grid
// rendered as filled rects via Phaser Graphics — same approach as ShipRenderer.
//
// Cell legend:
//   .  transparent
//   O  outline (very dark)
//   B  body main color
//   H  body highlight (lighter than B)
//   L  body shadow (darker than B)
//   W  eye white
//   E  eye black/pupil
//   K  sparkle highlight on pupil (white)
//   M  mouth/cheek dark
//   T  tongue / blush
//   A  accent main color (per-species: flame / water / leaf)
//   a  accent highlight (lighter accent)
//   S  species secondary (wing membrane / fin / bark)
//   s  species secondary highlight
//
// Anchor points are expressed in cell coordinates (col, row from grid origin).
// They tell cosmetics where to attach (head_top sits above the head; chest sits
// over the body; back sits behind shoulders).

// ---------- EMBER (fire) ----------------------------------------------------

// Cinder Egg — speckled cracking egg with ember spots
const EMBER_EGG = [
  '..............',
  '....OOOOOO....',
  '...OBHHHBBO...',
  '..OBHHHHBBBO..',
  '.OBHHBBBBBBBO.',
  '.OBHBBABBBBBO.',
  '.OBBBABBBABBO.',
  '.OBBBBBBBBBBO.',
  '.OBBABBBBBBBO.',
  '.OBBBBBABBBBO.',
  '.OBBABBBBABBO.',
  '.OBBBBBBBBBBO.',
  '..OBBBBBBBBO..',
  '...OOOOOOOO...',
  '..............'
];

// Sparkling — round chibi blob, 1 huge eye, flame tuft
const EMBER_BABY = [
  '......AaA.......',
  '.....AaaaA......',
  '....AAaaaAA.....',
  '....OAaaAAO.....',
  '...OOOOOOOOO....',
  '..OBBHHHHHBBO...',
  '.OBHHHHHHHHHBO..',
  '.OBHHWWWWWHHBO..',
  'OBHHWWWWWWWHHBO.',
  'OBHHWEEEEEWHHBO.',
  'OBHHWEEKEEWHHBO.',
  'OBHHWEEEEEWHHBO.',
  '.OBHHWWWWWHHBO..',
  '.OBHHHHTHHHHBO..',
  '.OBBHHMMMHHBBO..',
  '..OBBHHHHHBBO...',
  '...OBBBBBBBO....',
  '....OOOOOOO.....'
];

// Blazewisp — winged ember with comet tail
const EMBER_TEEN = [
  '........AaA.........',
  '.......AaaaA........',
  '......AAaaaAA.......',
  '......OAaaaAO.......',
  '.....OOOOOOOO.......',
  'SS..OBHHHHHHBO...SS.',
  'SsS.OBHHWHWHHBO.SsS.',
  'SssSOBHWEKEKWHBOSsss',
  'SsssOBHHWMWHHHBOssss',
  'SssSOBHHHHHHHBOSsssS',
  'SS..OBHHTTTHHBO...SS',
  '....OBBHHHHHBBO.....',
  '.....OBBHHHBBO......',
  '......OBBBBBO.......',
  '.......OAaAO........',
  '........AaA.........',
  '........AaA.........',
  '.........A..........',
  '.........A..........',
  '.........a..........'
];

// Solfire — pixel star-dragon: horns, wings, four legs, tail
const EMBER_ADULT = [
  '...A.........A....',
  '...AaA......AaA...',
  '..AAaaA....AaaAA..',
  '..OOAaO....OaAOO..',
  '....OO......OO....',
  'SS..OOOOOOOOOO..SS',
  'SsSOHHHHHHHHHHHOSsS',
  'SssOHWWWWHWWWWHOssS',
  'SssOHWEEKWEKEEWHOssS',
  'SssOHWEEEWEEEEWHOssS',
  'SssOHHWWWMWMWWHHOsss',
  'SsSOHHHHTTTTTHHHOSsS',
  'SS.OBHHHHHHHHHHBO.SS',
  '...OBBBHHHHHBBBO...',
  '...OBHHHHHHHHHBO...',
  '...OBHHHHHHHHHBO...',
  '...OBBBBBBBBBBBO...',
  '...OBO.OBBO.OBO....',
  '...OBO.OBBO.OBO....',
  '...OOO.OOOO.OOO....',
  '............AaaA...',
  '............OaAO...',
  '.............OO....'
];

// ---------- TIDE (water) ----------------------------------------------------

// Pearl Egg — dripping pearl
const TIDE_EGG = [
  '..............',
  '....OOOOOO....',
  '...OHHBBBBO...',
  '..OHHHBBBBBO..',
  '.OHHHBBBBBBBO.',
  '.OHBBBBABBBBO.',
  '.OBBBABBBBBBO.',
  '.OBBBBBBBBBBO.',
  '.OBBBBBBABBBO.',
  '.OBBBABBBBBBO.',
  '.OBBBBBBBBBBO.',
  '.OBBBBBABBBBO.',
  '..OBBBBBBBBO..',
  '...OOOOOOOO...',
  '......AA......',
  '......AaA.....',
  '......OOO.....'
];

// Driplet — teardrop with 2 eyes + droplet antennae
const TIDE_BABY = [
  '....A.....A.....',
  '....A.....A.....',
  '...AaA...AaA....',
  '...OAO...OAO....',
  '....O.....O.....',
  '....OOOOOOO.....',
  '..OOBHHHHHBOO...',
  '.OBHHHHHHHHHBO..',
  '.OBHWWWHWWWHBO..',
  'OBHWEKEHEEKEWHBO',
  'OBHWEEEHEEEEWHBO',
  '.OBHWWWHWWWWHBO.',
  '.OBHHHMMMMHHHBO.',
  '..OBHHTTTTTHHBO.',
  '...OBHHHHHHHBO..',
  '....OBBHHHBBO...',
  '.....OBBBBBO....',
  '......OOOOO.....'
];

// Wavemite — teardrop with side fins + tail
const TIDE_TEEN = [
  '..........A.........',
  '.........AaA........',
  '..........A.........',
  '......OOOOOOO.......',
  '....OOBHHHHHBOO.....',
  'SS.OBHHHHHHHHHBO.SS.',
  'SsSOBHWWWHWWWHBOSsS.',
  'SssOBHWEKEHEKEWHBOss',
  'SssOBHWEEEHEEEEWHBOs',
  'SssOBHWWWHWWWWHBOsss',
  'SsSOBHHMMMMMMMHHBOSs',
  'SS.OBHHHTTTTTHHHBO.S',
  '...OBBHHHHHHHHHBBO..',
  '....OBBHHHHHHHBBO...',
  '.....OBBHHHHHBBO....',
  '.......OBBBBBO......',
  '........SssS........',
  '........SsS.........',
  '.........SS.........',
  '..........S.........'
];

// Tidalord — pixel cosmic whale with dorsal fin and tail flukes
const TIDE_ADULT = [
  '............S...........',
  '...........SsS..........',
  '..........SssS..........',
  '.........SsssS..........',
  '.OOOOOOOOOOOOOOOOOO.....',
  'OBBHHHHHHHHHHHHHHHHBO...',
  'OBHHHHHHHHHHHHHHHHHHBO..',
  'OBHWWWHWWWHHHHHHHHHHHBO.',
  'OBHWEKEHEKEWHHHHHHHHHHBO',
  'OBHWEEEHEEEWHHHHHHHHHHBO',
  'OBHWWWHWWWWHHHKHHHKHHHBO',
  'OBHHMMMMMMMMHHHHHHHHHBSS',
  'OBHHTTTTTTTHHHHHHHHHBSsS',
  'OBHHHHHHHHHHHHHHHHHBSssS',
  '.OOOOOOOOOOOOOOOOOOSsssS',
  '............SssS....SssS',
  '...........SsssS....SssS',
  '............OOO.....SOOO',
  '....................OO..'
];

// ---------- SPROUT (grass) --------------------------------------------------

// Pod — mossy seed with hopeful leaf
const SPROUT_EGG = [
  '......A.......',
  '......aA......',
  '.....AAAA.....',
  '....OOOOOO....',
  '...OBHHBBBO...',
  '..OBHHHBBBBO..',
  '.OBHHBBBBBBBO.',
  '.OBBBBBABBBBO.',
  '.OBABBBBBBBBO.',
  '.OBBBBBBBABBO.',
  '.OBBBABBBBBBO.',
  '.OBBBBBBBBBBO.',
  '.OBBABBBBBBBO.',
  '..OBBBBBBBBO..',
  '...OOOOOOOO...',
  '..............'
];

// Seedling — mossy blob with leaf sprig + 2 eyes
const SPROUT_BABY = [
  '........A.......',
  '......AaaA......',
  '....AAaaaaAA....',
  '...AaaA.AaaA....',
  '....OAOOOAO.....',
  '....OOOOOOOO....',
  '..OBHHHHHHHBO...',
  '.OBHHHHHHHHHBO..',
  '.OBHWWHWWHHHBO..',
  'OBHWEKHEEWHHHBO.',
  'OBHWEEHEEWHHHBO.',
  '.OBHWWHWWHHHBO..',
  '.OBHHHMMMHHHBO..',
  '.OBHHTTTTTHHBO..',
  '..OBHHHHHHHBO...',
  '...OBBHHHBBO....',
  '....OBBBBBO.....',
  '.....OOOOO......'
];

// Vinepup — vine-legged creature with bloom
const SPROUT_TEEN = [
  '........A...........',
  '......AaaaA.........',
  '....AAaaaaaAA.......',
  '...AaaA.AaaaA.......',
  '....OAOOOAOO........',
  '....OOOOOOOO........',
  '..OBHHHHHHHBO.......',
  '.OBHHHHHHHHHBO......',
  '.OBHWWHWWHHHBO......',
  'OBHWEKHEEWHHHBO.....',
  'OBHWEEHEEWHHHBO.....',
  '.OBHWWHWWHHHBO..AaA.',
  '.OBHHHMMMHHHBO.AaaaA',
  '.OBHHTTTTTHHBO..AaA.',
  '..OBHHHHHHHBO.......',
  '...OBHHHHHBO........',
  'A...OBBHHHBO........',
  'aA..AOBBBBO.A.......',
  'aaAAaOOOOOOAa.......',
  '.aaaaA....AaaA......',
  '..AAA......AAA......'
];

// Cosmoss — walking treant with bark torso, branchy arms, flower crown
const SPROUT_ADULT = [
  '......A...A...A.....',
  '....AaaA.AaA.AaaA...',
  '...AaaaaAaaaAaaaaA..',
  '....AAaaAaaaAaaAA...',
  '......OOAaaAOO......',
  '......OOOOOOOO......',
  '....OBBHHHHHHBBO....',
  '...OBHHHHHHHHHHBO...',
  '...OBHWWHWWHHHHBO...',
  'A..OBHWEKHEKEWHHBO..A',
  'AaAOBHWEEHEEEWHHBOAaA',
  'AaAOBHWWHWWWWHHHBOAaA',
  '.AAOBHHMMMMMMHHHBOAA.',
  '...OBHHHTTTTTHHHBO...',
  '...OBHHHHHHHHHHHBO...',
  '...OBLLBHHHHHBLLBO...',
  '...OBLLLBHHHBLLLBO...',
  '...OBLLLLBHBLLLLBO...',
  '...OBLLLLLBLLLLLBO...',
  '...OBLLBO.OBLLLBO....',
  '...OBLLBO.OBLLLBO....',
  '....OOOO...OOOOO....'
];

// ----------------------------------------------------------------------------

export const PET_SPRITES = {
  ember: { egg: EMBER_EGG, baby: EMBER_BABY, teen: EMBER_TEEN, adult: EMBER_ADULT },
  tide:  { egg: TIDE_EGG,  baby: TIDE_BABY,  teen: TIDE_TEEN,  adult: TIDE_ADULT  },
  sprout:{ egg: SPROUT_EGG,baby: SPROUT_BABY,teen: SPROUT_TEEN,adult: SPROUT_ADULT}
};

// Per-stage anchor points in CELL coordinates (col, row) where (0,0) is the
// grid's top-left. Cosmetics resolve real coordinates by multiplying by
// pixelSize and offsetting by grid origin.
//
// head_top — directly above the head, where hats sit
// head_eye — between the eyes, where shades sit
// neck    — collar / scarf / bow tie line
// chest   — center of body, where outfits sit
// back    — shoulder area, where wings/jetpack/cape attach
// foot    — for trail-style auras attached to base
const PET_ANCHORS = {
  ember: {
    egg:   { head_top:[7,1],  head_eye:[6,7],  neck:[7,12], chest:[7,9],  back:[7,9],  foot:[7,13] },
    baby:  { head_top:[8,0],  head_eye:[8,9],  neck:[8,14], chest:[8,15], back:[8,11], foot:[8,17] },
    teen:  { head_top:[9,0],  head_eye:[9,7],  neck:[9,11], chest:[9,11], back:[5,7],  foot:[9,19] },
    adult: { head_top:[8,0],  head_eye:[8,9],  neck:[8,12], chest:[8,15], back:[3,7],  foot:[8,22] }
  },
  tide: {
    egg:   { head_top:[7,1],  head_eye:[6,8],  neck:[7,12], chest:[7,9],  back:[7,9],  foot:[7,13] },
    baby:  { head_top:[8,0],  head_eye:[8,9],  neck:[8,12], chest:[8,14], back:[8,10], foot:[8,17] },
    teen:  { head_top:[10,0], head_eye:[10,7], neck:[10,12],chest:[10,12],back:[5,8],  foot:[10,19] },
    adult: { head_top:[5,0],  head_eye:[5,8],  neck:[5,11], chest:[10,10],back:[10,4], foot:[10,17] }
  },
  sprout: {
    egg:   { head_top:[7,1],  head_eye:[6,8],  neck:[7,12], chest:[7,9],  back:[7,9],  foot:[7,14] },
    baby:  { head_top:[8,0],  head_eye:[8,9],  neck:[8,12], chest:[8,14], back:[8,11], foot:[8,17] },
    teen:  { head_top:[9,0],  head_eye:[9,9],  neck:[9,12], chest:[9,13], back:[5,8],  foot:[10,20] },
    adult: { head_top:[10,0], head_eye:[10,9], neck:[10,12],chest:[10,14],back:[5,8],  foot:[10,21] }
  }
};

// Returns { width, height, originX, originY, pixelSize } for a stage at scale.
// originX/Y is where (0,0) of the grid lands relative to the container center.
export function gridLayout(grid, pixelSize) {
  const cols = grid[0].length;
  const rows = grid.length;
  return {
    cols, rows,
    width: cols * pixelSize,
    height: rows * pixelSize,
    originX: -(cols * pixelSize) / 2,
    originY: -(rows * pixelSize) / 2,
    pixelSize
  };
}

export function anchorXY(speciesId, stage, anchorName, layout) {
  const a = PET_ANCHORS[speciesId]?.[stage]?.[anchorName];
  if (!a) return { x: 0, y: 0 };
  return {
    x: layout.originX + (a[0] + 0.5) * layout.pixelSize,
    y: layout.originY + (a[1] + 0.5) * layout.pixelSize
  };
}
