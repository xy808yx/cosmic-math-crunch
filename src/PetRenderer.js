// Pixel-art pet renderer. Each pet stage is a small pixel grid drawn
// procedurally as filled squares — no asset files. Stages look meaningfully
// different (Pokémon-style evolution), not just bigger.
//
// Coordinate system: each pet is drawn centered at (0,0) in a container.
// Pixel size scales with `opts.scale` so the same grid renders crisp at any size.

import { progress } from './GameData.js';
import { companion, SPECIES } from './CompanionManager.js';

// Color palette helpers ------------------------------------------------------

function darken(color, amount) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const k = 1 - amount;
  return ((Math.max(0, Math.round(r * k)) << 16) |
          (Math.max(0, Math.round(g * k)) << 8) |
           Math.max(0, Math.round(b * k)));
}

function lighten(color, amount) {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return ((Math.min(255, Math.round(r + (255 - r) * amount)) << 16) |
          (Math.min(255, Math.round(g + (255 - g) * amount)) << 8) |
           Math.min(255, Math.round(b + (255 - b) * amount)));
}

// Build a per-species palette so we can recolor uniformly per pet.
function paletteFor(species) {
  const c = species.color;
  return {
    body:    c,
    bodyHi:  lighten(c, 0.25),
    bodyLo:  darken(c, 0.25),
    accent:  species.accent,
    accentHi: lighten(species.accent, 0.30),
    outline: 0x07071a,
    eyeWhite: 0xffffff,
    eyeBlack: 0x07071a,
    blush:    0xffb3c1,
    shadow:   0x000000
  };
}

// Pixel grids ----------------------------------------------------------------
//
// Each grid is a 2D array of single-character keys mapped to a palette entry.
// Whitespace = transparent. The legend below applies to every grid:
//   '.' transparent (skip)
//   'X' outline       → pal.outline
//   'B' body          → pal.body
//   'H' body highlight → pal.bodyHi
//   'L' body lowlight  → pal.bodyLo
//   'A' accent         → pal.accent
//   'a' accent highlight → pal.accentHi
//   'W' eye white      → pal.eyeWhite
//   'P' eye pupil      → pal.eyeBlack
//   'p' blush          → pal.blush
//   's' sparkle        → 0xffffff
//   'k' inner crack    → pal.bodyLo (egg)

const PIXEL_LEGEND = {
  X: 'outline',
  B: 'body',
  H: 'bodyHi',
  L: 'bodyLo',
  A: 'accent',
  a: 'accentHi',
  W: 'eyeWhite',
  P: 'eyeBlack',
  p: 'blush',
  s: null,        // pure white sparkle, palette-independent
  k: 'bodyLo'
};

// EGG (shared shape across species — palette differs).
// 14 wide × 16 tall.
const EGG = [
  '....XXXXXX....',
  '..XXHHBBBBXX..',
  '.XHHHBBBBBBX..',
  '.XHBBBBBBBBX..',
  'XHBBBBBBBBBBX.',
  'XHBBkkBBBBBBX.',
  'XHBBkBBBkkBBX.',
  'XHBBBBkkBBBBX.',
  'XHBBBBBBBBBBX.',
  'XBBBBAAaaBBBX.',
  'XBBBAAAAAABBX.',
  'XBBBBAAAABBBX.',
  '.XBBBBBBBBBX..',
  '.XLLLBBBLLLX..',
  '..XLLLLLLLX...',
  '....XXXXXX....'
];

// SPARKLING (Ember baby) — round body, big single eye, ember tuft on head
// 14 × 14
const EMBER_BABY = [
  '....AAaa......',
  '...AAAAaa.....',
  '..XXAAAAXX....',
  '.XHBBBBBBX....',
  'XHBBWWWWBBX...',
  'XBBWWWPPWBX...',
  'XBBWPPPPWBX...',
  'XBBWWPWWBBX...',
  'XBBpppBBBBX...',
  'XBBBBBBBBBX...',
  '.XBLBLBBBLX...',
  '..XLLLLLLX....',
  '...XXXXXX.....',
  '..XX....XX....'
];

// BLAZEWISP (Ember teen) — taller body, two eyes, flame tail behind, mitten paws
// 16 × 18
const EMBER_TEEN = [
  '......AAAa........',
  '....AAAAAa........',
  '...AAAAAAa........',
  '...XXXXXX.........',
  '..XHHBBBBX..AA....',
  '.XHHBBBBBBX.AAa...',
  'XHBBBBBBBBXXAAa...',
  'XHBBWWBBWWBBAA....',
  'XBBWPWBBWPWBA.....',
  'XBBWWWBBWWWBX.....',
  'XBBpBBBBBBpBX.....',
  'XBBBBPPPPBBBX.....',
  'XBBBBBBBBBBBX.....',
  'XHBLLLLLLLLBX.....',
  '.XLBBLLLLBBLX.....',
  '..XX..XX..XX......',
  '..XX..XX..XX......',
  '...X...X...X......'
];

// SOLFIRE (Ember adult) — small dragon, mane of flames, crescent wings
// 18 × 20
const EMBER_ADULT = [
  '......AAAaaa.......',
  '.....AAAAAaaa......',
  '..AAAAAAAAAAaa.....',
  '.AAaXXXXXXXXAaa....',
  '.AaXHHBBBBBBXaa....',
  'AaXHBBBBBBBBBXa....',
  'AXBBBBBBBBBBBBX.AA.',
  'XBBBWWWBBWWWBBXAAA.',
  'XBBWPPPWBWPPPWBXAA.',
  'XBBWWPWWBWWPWWBXA..',
  'XBBpBBBBBBBBBBpX...',
  'XBBBBBBPPPPBBBBX...',
  'XBBBBPPPPPPPPBBX...',
  'XHBBBBBBBBBBBBBX...',
  'XHBLLLLLLLLLLBBX...',
  '.XLBBLLLLLLBBBX....',
  '..XXX..XXXX..XXX...',
  '..XX....XX....XX...',
  '...X.....X.....X...',
  '....AAa..AAa..AAa..'
];

// DRIPLET (Tide baby) — water drop blob, two antenna with droplets, big eyes
// 14 × 16
const TIDE_BABY = [
  '...AaA....AaA.',
  '...AAA....AAA.',
  '....A......A..',
  '....X......X..',
  '...XXXXXXXX...',
  '..XHHBBBBBBX..',
  '.XHBBBBBBBBX..',
  'XHBBWWBBWWBBX.',
  'XBBWPWBBWPWBX.',
  'XBBWWWBBWWWBX.',
  'XBBpBBBBBBpBX.',
  'XBBBBPPPPBBBX.',
  'XHBBBBBBBBBBX.',
  '.XLBBBBBBBBLX.',
  '..XLLLLLLLLX..',
  '...XXXXXXXX...'
];

// WAVEMITE (Tide teen) — fins forming, longer body, antennae bigger
// 16 × 18
const TIDE_TEEN = [
  '....AAa....AAa....',
  '....AAA....AAA....',
  '.....A......A.....',
  '.....X......X.....',
  '....XXXXXXXX......',
  'AA.XHHBBBBBBX.AA..',
  'AAaXHBBBBBBBXaAA..',
  'AaXBBBBBBBBBBXaAa.',
  'AXBBWWBBBBWWBBXaA.',
  'XBBWPWBBBBWPWBBX..',
  'XBBWWWBBBBWWWBBX..',
  'XBBpBBBBBBBBpBBX..',
  'XBBBBBPPPPBBBBBX..',
  'XHBBBBBBBBBBBBBX..',
  'XHLBBBBBBBBBBBLX..',
  '.XLLBBLLLLBBLLX...',
  '..XXLLLLLLLLXX....',
  '....XXXXXXXX......'
];

// TIDALORD (Tide adult) — cosmic whale, glowing fins, tail
// 20 × 18
const TIDE_ADULT = [
  '....AAa........AAa..',
  '....AAA........AAA..',
  '.....A..........A...',
  '.....XXXXXXXXXXXX...',
  'AA..XHHBBBBBBBBBBX..',
  'AAaaXHBBBBBBBBBBBXAA',
  'AaaXBBBBBBBBBBBBBXAA',
  'AaXBBWWWBBBBBWWWBBXa',
  'AXBBWPPWBBBBBWPPWBBX',
  'XBBBWWPWBBBBBWWPWBBX',
  'XBBBpBBBBBBBBBBpBBBX',
  'XBBBBBPPPPPPPPBBBBBX',
  'XHBBBBBBBBBBBBBBBBBX',
  'XHLBBBBBBBBBBBBBBBLX',
  '.XLLBBBBBBBBBBBBBLX.',
  '..XLLLLLLLLLLLLLLX..',
  '...XX...........XX..',
  '....AAa.......AAa...'
];

// SEEDLING (Sprout baby) — mossy blob, sprig on head, small leaf-ears
// 14 × 14
const SPROUT_BABY = [
  '......Aa......',
  '.....AAAa.....',
  '....AAAAA.....',
  '...AXXXXXX....',
  '..AaXHHBBBX...',
  'AAaXHBBBBBBX..',
  'AaXBBBBBBBBXaA',
  'aXBBWWBBWWBBXa',
  'XBBWPWBBWPWBX.',
  'XBBWWWBBWWWBX.',
  'XBBpBBBBBBpBX.',
  'XBBBBPPPPBBBX.',
  '.XHBBBBBBBBX..',
  '..XXLLLLLLXX..'
];

// VINEPUP (Sprout teen) — vine legs, bloom in hair, tendril ears
// 16 × 18
const SPROUT_TEEN = [
  '......AAa.........',
  '.....AAAa.........',
  '....AAAAA.AaA.....',
  '...XXXXXX.AAA.....',
  '..XHBBBBBX.A......',
  '.XHBBBBBBBX.......',
  'aaXBBBBBBBBBXaa...',
  'AaXBBWWBBWWBBXaA..',
  'AXBBWPWBBWPWBBXA..',
  'XBBBWWWBBWWWBBBX..',
  'XBBBpBBBBBBpBBBX..',
  'XBBBBBPPPPBBBBBX..',
  'XHBBBBBBBBBBBBBX..',
  'XHLBBBBBBBBBBBBX..',
  '.XLLBBBBBBBBBBLX..',
  '..XX.AaA..AaA.X...',
  '..X..AAA..AAA..X..',
  '..X..AaA..AaA..X..'
];

// COSMOSS (Sprout adult) — small treant, blooming flowers, root tendrils
// 18 × 20
const SPROUT_ADULT = [
  '.....AAa..AAa.....',
  '....AAAaaAAAa.....',
  '...AAAAAAAAAa.....',
  '..AAAaaaaAAAA.....',
  '.AAaaXXXXXXAAA....',
  'AAaXHHBBBBBBXAa...',
  'AaXHBBBBBBBBBXaA..',
  'aXBBBBBBBBBBBBXaA.',
  'XBBBWWBBBBWWBBBX..',
  'XBBWPPWBBBBPPWBX..',
  'XBBWWPWBBBWPWWBX..',
  'XBBpBBBBBBBBBBpX..',
  'XBBBBPPPPPPPPBBX..',
  'XBBBBBBBBBBBBBBX..',
  'XHBLLLLLLLLLLBBX..',
  '.XLBBLLLLLLBBLX...',
  '..XX.LL.LLL.XX....',
  '..X..L...LL..X....',
  '..X..L....L..X....',
  '..XX.X...XX.XX....'
];

// Stage → grid lookup
function gridFor(speciesId, stage) {
  if (stage === 'egg') return EGG;
  const map = {
    ember:  { baby: EMBER_BABY,  teen: EMBER_TEEN,  adult: EMBER_ADULT },
    tide:   { baby: TIDE_BABY,   teen: TIDE_TEEN,   adult: TIDE_ADULT },
    sprout: { baby: SPROUT_BABY, teen: SPROUT_TEEN, adult: SPROUT_ADULT }
  };
  return map[speciesId]?.[stage] || EGG;
}

// Public API ----------------------------------------------------------------
//
// drawCompanion(scene, x, y, opts)
//   opts.speciesId  — defaults to current player pet
//   opts.stage      — defaults to current stage
//   opts.scale      — overall scale (1 = ~120px tall for adult)
//   opts.preview    — if true, ignores live state (for picker / shop previews)
//   opts.mood       — 'happy' | 'sad' (only affects subtle eye look; pixel art is
//                     intentionally less expressive than the old chibi version)
//
// Returns a Phaser container that idle-bobs.
export function drawCompanion(scene, x, y, opts = {}) {
  const speciesId = opts.speciesId || progress.companion.speciesId || 'ember';
  const stage = opts.stage || progress.companion.stage || 'egg';
  const scale = opts.scale ?? 1;
  const species = SPECIES[speciesId];

  const container = scene.add.container(x, y);
  if (!species) return container;

  const pal = paletteFor(species);
  const grid = gridFor(speciesId, stage);

  // Scale tuning — adult is the largest grid (~20 tall), baby is smaller.
  // Pick a base pixel size so the visual presence stays roughly consistent
  // and a teen looks bigger than a baby.
  const stageScale = stageVisualScale(stage);
  const pixelSize = 5 * scale * stageScale;
  const gridW = grid[0].length;
  const gridH = grid.length;
  const w = gridW * pixelSize;
  const h = gridH * pixelSize;

  // Soft ambient glow under/behind the pet — gives the cockpit some life.
  const glow = scene.add.graphics();
  glow.fillStyle(species.accent, 0.20);
  glow.fillEllipse(0, h * 0.20, w * 1.10, h * 0.55);
  container.add(glow);
  scene.tweens.add({
    targets: glow,
    alpha: 0.36,
    scaleX: 1.08,
    scaleY: 1.08,
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  // Drop shadow
  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.28);
  shadow.fillEllipse(0, h * 0.55, w * 0.78, h * 0.10);
  container.add(shadow);

  // Pixel grid → graphics rectangles, batched into one Graphics object.
  const g = scene.add.graphics();
  // Translate so the grid is centered at (0,0)
  const ox = -w / 2;
  const oy = -h / 2;
  for (let row = 0; row < gridH; row++) {
    const line = grid[row];
    for (let col = 0; col < gridW; col++) {
      const ch = line[col];
      if (!ch || ch === '.' || ch === ' ') continue;
      const color = colorFor(ch, pal);
      if (color === null) continue;
      g.fillStyle(color, 1);
      g.fillRect(ox + col * pixelSize, oy + row * pixelSize, pixelSize + 0.5, pixelSize + 0.5);
    }
  }
  container.add(g);

  // Idle bob — gentle, never stops
  scene.tweens.add({
    targets: container,
    y: y - 4 * scale,
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  container.species = species;
  container.stage = stage;
  container.pixelSize = pixelSize;

  // Methods for animation hooks (used by GameScene for happy/sad/missed-you).
  container.bounceHappy = () => {
    scene.tweens.add({
      targets: container,
      scaleY: { from: 0.85, to: 1 },
      scaleX: { from: 1.15, to: 1 },
      duration: 250,
      ease: 'Back.easeOut'
    });
  };
  container.slumpSad = () => {
    scene.tweens.add({
      targets: container,
      y: y + 6,
      angle: { from: 0, to: -4 },
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeOut'
    });
  };
  container.missedYou = () => {
    // Big excited bounce + sparkle ring
    scene.tweens.add({
      targets: container,
      scaleY: { from: 0.7, to: 1 },
      scaleX: { from: 1.3, to: 1 },
      duration: 400,
      ease: 'Bounce.easeOut'
    });
    const ring = scene.add.graphics();
    ring.lineStyle(3, species.accent, 1);
    ring.strokeCircle(0, 0, 12);
    container.add(ring);
    scene.tweens.add({
      targets: ring,
      scaleX: 6,
      scaleY: 6,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });
    // Sparkles
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const sp = scene.add.circle(0, 0, 3, 0xffffff, 1);
      container.add(sp);
      scene.tweens.add({
        targets: sp,
        x: Math.cos(angle) * 70,
        y: Math.sin(angle) * 70 - 20,
        alpha: 0,
        duration: 800,
        ease: 'Quad.easeOut',
        onComplete: () => sp.destroy()
      });
    }
  };

  return container;
}

function stageVisualScale(stage) {
  if (stage === 'egg') return 0.9;
  if (stage === 'baby') return 0.95;
  if (stage === 'teen') return 1.05;
  return 1.15; // adult
}

function colorFor(ch, pal) {
  if (ch === 's') return 0xffffff;
  const key = PIXEL_LEGEND[ch];
  if (key === undefined) return null;
  return pal[key];
}
