// Endgame cinematic. Runs in one of three modes (registry 'creditsMode'):
//
//   'cliffhanger' (Chapter 1 / World 11): cards, then the pet evolves to Cosmic,
//      then a light teaser outro pointing at the warp gate. Keeps endingSeen
//      (Cosmic pet + Arcade unlock). NO hero card, that moves to the true finale.
//   'finale' (Chapter 2 / World 28): cards, then (evolve only if not already
//      Cosmic) the prominent 中文 hero shout-out for the three kids + the
//      Nanocraft reward reveal, then a short homeward coda that points at the
//      gate into Chapter 3. Sets finaleSeen.
//   'homecoming' (Chapter 3 / World 38, Home Ground): cards over the dusk sky,
//      then the lit mountain and the city lights coming on below, closing on the
//      personal message. No pet beat (the pet is already Cosmic). Sets finale3Seen.
//
// On exit, returns to WorldMapScene parked on the chapter's final world and
// clears justClearedWorld so the auto-advance doesn't run on top of the finale.

import Phaser from 'phaser';
import { progress } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { music } from '../MusicManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { style } from '../textStyles.js';
import { COLORS } from '../colorPalette.js';
import { companion, drawCompanion } from '../CompanionManager.js';
import { ship } from '../ShipManager.js';
import { drawShip } from '../ShipRenderer.js';
import { drawWorldNode } from '../WorldNodeArt.js';
import { createButton } from '../buttonHelper.js';

const W = 1080;
const H = 1920;

// The personal hero card text. Hardcoded per the user's request.
const HERO_NAMES = '小宇  新宇  星宇';
const HERO_MESSAGE = '爸爸爱你';

// One continuous arc across both chapters. Chapter 1 ends with the Void NOT
// gone but SHRUNK into a scale you can't see (the cliffhanger); Chapter 2 ends
// with the last shadow letting go inside the smallest cell, healing outward.
const CLIFFHANGER_CARDS = [
  'The Void Devourer dims… then folds inward — smaller, and smaller.',
  'Across the galaxy, worlds remember what light feels like.',
  'But the dark did not leave. It SHRANK.',
  'Something is wrong now — at a scale far too small to see…'
];

const FINALE_CARDS = [
  'Patient Zero — the very first germ of all — goes still.',
  'Deep inside the smallest cell, the last shadow lets go.',
  'From the bloodstream to the stars, every world breathes easy.',
  'You did it, pilot. Outer space AND inner space are yours.'
];

// Chapter 3 (World 38, The Mountain): the homecoming. The scale arc lands at
// human scale: one Saturday around the family's own city, morning to dusk, and
// the last stop is the ride up the mountain as the lights come on. No void.
// Card four and the World 38 description are near-twins on purpose.
const HOMECOMING_CARDS = [
  'You journeyed to the edge of the cosmos. Then into the smallest cell.',
  'And now the long way around brings you somewhere new: home.',
  'A whole Saturday of it. The store, the garden, the beach, the bread place.',
  'One last ride up the mountain, and the lights come on for everyone.'
];

// Home Ground finale sky: dusk on the mountain. Violet overhead, afterglow at
// the ridge line, warm cream low down where the city lights are coming on.
// Plain stacked gradients only, no rays. Shared by the recap cards (homecoming
// mode opens on this sky from the first frame instead of the starfield; the
// far-stars callback is given up on purpose) and by the outro wash.
const DUSK_TOP = 0x6a4b8f;
const DUSK_MID = 0xf0b489;
const DUSK_LOW = 0xffe9a8;
const DUSK_SPLIT = 0.56;   // where the violet gives way to the afterglow band
function paintDuskSky(scene, depth) {
  const g = scene.add.graphics().setDepth(depth);
  const split = Math.round(H * DUSK_SPLIT);
  g.fillGradientStyle(DUSK_TOP, DUSK_TOP, DUSK_MID, DUSK_MID, 1);
  g.fillRect(0, 0, W, split);
  g.fillGradientStyle(DUSK_MID, DUSK_MID, DUSK_LOW, DUSK_LOW, 1);
  g.fillRect(0, split, W, H - split);
  return g;
}

// A small paper-cutout red gondola cabin, the Home Ground stand-in for the old
// lamp glyph. Like every cutout it is drawn twice: first the same shapes in
// black at alpha 0.22, offset (+4, +6), then in colour on top. Origin (0, 0) is
// the wheel on the cable, so a sway tween pivots where a real cabin hangs from.
// Rounded rect body, darker roof cap, one pale window, a thin hanger arm up to
// a plain wheel disc. Plain shapes only, no spirals or sunbursts, no rays.
const CABIN_RED = 0xe8594a;
const CABIN_ROOF = 0xb33f33;
const CABIN_DARK = 0x3a2a50;
function drawGondolaCabin(g) {
  [{ dx: 4, dy: 6, shadow: true }, { dx: 0, dy: 0, shadow: false }].forEach(({ dx, dy, shadow }) => {
    const ink = (color, alpha = 1) => g.fillStyle(shadow ? 0x000000 : color, shadow ? 0.22 : alpha);
    // Wheel on the cable, then the hanger arm down to the roof.
    ink(CABIN_DARK); g.fillCircle(dx, dy, 7);
    g.lineStyle(4, shadow ? 0x000000 : CABIN_DARK, shadow ? 0.22 : 0.95);
    g.lineBetween(dx, 6 + dy, dx, 24 + dy);
    // Roof cap, a shade darker than the body.
    ink(CABIN_ROOF); g.fillRoundedRect(-30 + dx, 22 + dy, 60, 14, 6);
    // Body.
    ink(CABIN_RED); g.fillRoundedRect(-26 + dx, 32 + dy, 52, 46, 10);
    // Pale window.
    ink(DUSK_LOW); g.fillRoundedRect(-16 + dx, 40 + dy, 32, 20, 6);
  });
  return g;
}

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CreditsScene' });
  }

  create() {
    audio.init();
    music.pause();

    // 'cliffhanger' (World 11), 'finale' (World 28) or 'homecoming' (World 38).
    // Default to the HARMLESS cliffhanger path: the finale path grants the
    // Nanocraft trophy + marks the finale seen, so a flagless/accidental entry
    // must never land there. Every real finale launch sets creditsMode explicitly.
    this.mode = this.registry.get('creditsMode') || 'cliffhanger';
    this.cards = this.mode === 'cliffhanger' ? CLIFFHANGER_CARDS
      : this.mode === 'homecoming' ? HOMECOMING_CARDS
      : FINALE_CARDS;

    // Credits soundtrack — plays once (not looped) under the cinematic cards
    // + pet evolution + roll + hero. Falls back silently if file is missing.
    // Respect the Music toggle — creditsSong is played directly (not via
    // MusicManager), so it must check music.enabled itself or it would play
    // through a muted setting.
    if (music.enabled && this.cache.audio.exists('creditsSong')) {
      this._creditsSong = this.sound.add('creditsSong', { volume: 0.5, loop: false });
      this._creditsSong.play();
    }

    if (this.mode === 'homecoming') {
      // Home Ground credits open on daylight: the four recap cards play over
      // the dusk sky on the mountain from the first frame. No starfield, no
      // velvet dim, no twinkle sprinkle here; the outro wash is this same sky.
      paintDuskSky(this, 0);
    } else {
      createStarfield(this, { width: W, height: H, accentStrength: 0 });

      // Deep velvet backdrop on top of the starfield for cinematic mood.
      this.backdrop = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1).setDepth(5);
      this.backdrop.alpha = 0;
      this.tweens.add({ targets: this.backdrop, alpha: 0.6, duration: 800 });

      // Sprinkle 80 twinkly stars (same as the original finale).
      this.starLayer = this.add.container(0, 0).setDepth(8);
      for (let i = 0; i < 80; i++) {
        const sx = Math.random() * W;
        const sy = Math.random() * (H - 100) + 50;
        const r = Math.random() * 2 + 1.2;
        const star = this.add.graphics();
        star.fillStyle(0xffffff, 1);
        star.fillCircle(sx, sy, r);
        star.alpha = 0;
        this.starLayer.add(star);
        this.tweens.add({
          targets: star,
          alpha: 1,
          duration: 600 + Math.random() * 1200,
          delay: 200 + Math.random() * 2200,
          ease: 'Quad.easeOut'
        });
      }
    }

    new TransitionManager(this).fadeIn(400);

    // Begin the cinematic sequence.
    this.time.delayedCall(900, () => this.playCinematicCards());
  }

  // ============================================================
  // PART A — 4-card cinematic
  // ============================================================
  playCinematicCards() {
    const cards = this.cards;
    let i = 0;
    const showCard = (text, last) => {
      const cardW = 880;
      const cardH = 260;
      const card = this.add.container(W / 2, H / 2).setDepth(20);
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.bgPanel, 0.92);
      bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 28);
      bg.lineStyle(3, 0xfbbf24, 0.95);
      bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 28);
      card.add(bg);
      card.add(this.add.text(0, 0, text, style('subhead', {
        fontSize: '34px',
        fill: '#ffeaa7',
        align: 'center',
        wordWrap: { width: cardW - 80 }
      })).setOrigin(0.5));

      card.alpha = 0;
      card.y = H / 2 + 20;
      this.tweens.add({
        targets: card,
        alpha: 1,
        y: H / 2,
        duration: 500,
        ease: 'Quad.easeOut'
      });

      const advance = () => {
        this.tweens.add({
          targets: card,
          alpha: 0,
          y: H / 2 - 20,
          duration: 450,
          onComplete: () => {
            card.destroy();
            i++;
            if (i < cards.length) {
              showCard(cards[i], i === cards.length - 1);
            } else {
              this.afterCards();
            }
          }
        });
      };

      this.time.delayedCall(last ? 2800 : 2400, advance);
    };
    showCard(cards[0], false);
  }

  // Route past the cards depending on mode. The pet's Cosmic evolution beat is
  // the Chapter 1 (cliffhanger) payoff; in the finale the pet is already Cosmic
  // (unless a player skipped World 11 entirely — then show it once here too).
  afterCards() {
    if (this.mode === 'homecoming') {
      // Home Ground: the pet is already Cosmic by Chapter 3, so skip the evolution
      // beat and go straight to the dusk-on-the-mountain homecoming reveal.
      this.showHomecomingOutro();
      return;
    }
    if (this.mode === 'cliffhanger') {
      this._afterPetMoment = () => this.showCliffhangerOutro();
      this.playPetEvolutionMoment();
    } else {
      this._afterPetMoment = () => this.showHeroCard();
      if (companion.hasStarter() && !progress.companion?.cosmicForm) {
        this.playPetEvolutionMoment();
      } else {
        this.showHeroCard();
      }
    }
  }

  // ============================================================
  // PART B — Pet evolution moment (cosmic-tier glow)
  // ============================================================
  playPetEvolutionMoment() {
    const done = this._afterPetMoment || (() => this.showHeroCard());
    if (!companion.hasStarter()) {
      done();
      return;
    }

    const sp = companion.getSpecies();
    const accent = sp?.accent || 0xfbbf24;

    const cx = W / 2;
    const cy = H / 2;

    // Halo pulse
    const halo = this.add.graphics().setDepth(15);
    halo.fillStyle(accent, 1);
    halo.fillCircle(cx, cy, 100);
    halo.alpha = 0;
    halo.setScale(0.3);
    this.tweens.add({
      targets: halo,
      alpha: { from: 0, to: 0.55 },
      scale: 3.2,
      duration: 1400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: halo,
          alpha: 0,
          duration: 500,
          onComplete: () => halo.destroy()
        });
      }
    });

    // Pet appears as ADULT (the player's current form) and scales up.
    let pet = drawCompanion(this, cx, cy, { stage: 'adult', scale: 1.6 }).setDepth(16);
    pet.setScale(0);
    audio.playEvolutionBuildup?.();
    this.tweens.add({
      targets: pet,
      scale: 1.6,
      duration: 700,
      ease: 'Back.easeOut',
      onComplete: () => {
        audio.playEvolutionFlash?.();
        // A brighter inner ring "cosmic" effect
        const ring = this.add.graphics().setDepth(17);
        ring.lineStyle(8, 0xffffff, 1);
        ring.strokeCircle(cx, cy, 80);
        ring.alpha = 1;
        this.tweens.add({
          targets: ring,
          scale: 4,
          alpha: 0,
          duration: 700,
          ease: 'Quad.easeOut',
          onComplete: () => ring.destroy()
        });

        // Grant + persist the Cosmic form (idempotent). Decoupled from the old
        // stage==='adult' gate so the saved state always matches this cinematic.
        companion.unlockCosmic();
        pet.destroy();
        pet = drawCompanion(this, cx, cy, { stage: 'cosmic', scale: 1.6 }).setDepth(16);

        // Pet scales briefly larger then settles
        this.tweens.add({
          targets: pet,
          scaleX: 1.9,
          scaleY: 1.9,
          duration: 250,
          yoyo: true,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            audio.playEvolutionResolve?.();
            // Quick title card under the pet
            const tag = this.add.text(cx, cy + 200, 'COSMIC FORM', style('display', {
              fontSize: '40px',
              fill: '#fbbf24',
              stroke: '#0a0a1a',
              strokeThickness: 4
            })).setOrigin(0.5).setDepth(18);
            tag.alpha = 0;
            this.tweens.add({
              targets: tag,
              alpha: 1,
              duration: 400,
              ease: 'Quad.easeOut'
            });

            this.time.delayedCall(1700, () => {
              this.tweens.add({
                targets: [pet, tag],
                alpha: 0,
                duration: 600,
                onComplete: () => {
                  pet.destroy();
                  tag.destroy();
                  done();
                }
              });
            });
          }
        });
      }
    });
  }

  // ============================================================
  // CLIFFHANGER OUTRO (Chapter 1) — a light teaser, not the hero card.
  // Points the player at the warp gate that now sits beside Universe's End
  // (World 11, the finale node), which is where it opens after the boss falls.
  // ============================================================
  showCliffhangerOutro() {
    const wash = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1).setDepth(60);
    wash.alpha = 0;
    this.tweens.add({ targets: wash, alpha: 0.9, duration: 1500, ease: 'Quad.easeIn' });

    const lines = [
      { t: 'CHAPTER 1 COMPLETE', size: 56, fill: '#fbbf24', y: 0.30, delay: 600 },
      { t: 'The galaxy is bright again…', size: 38, fill: '#ffeaa7', y: 0.40, delay: 2200 },
      { t: 'but something stirs at a scale\nyou cannot see.', size: 44, fill: '#ff7a8a', y: 0.52, delay: 4200 },
      { t: 'Find the WARP GATE beside UNIVERSE\'S END\nand dive into INNER SPACE.', size: 32, fill: '#b5e6ff', y: 0.68, delay: 7000 }
    ];
    lines.forEach(l => {
      const txt = this.add.text(W / 2, H * l.y, l.t, style('display', {
        fontSize: `${l.size}px`, fill: l.fill, align: 'center',
        stroke: '#0a0a1a', strokeThickness: 4, wordWrap: { width: W - 120 }
      })).setOrigin(0.5).setDepth(70);
      txt.alpha = 0; txt.setScale(0.9);
      this.time.delayedCall(l.delay, () => {
        audio.playMatch?.();
        this.tweens.add({ targets: txt, alpha: 1, scale: 1, duration: 800, ease: 'Back.easeOut' });
      });
    });

    // A small inward portal glyph (membrane rings — no spiral/sigil).
    this.time.delayedCall(5400, () => {
      const g = this.add.graphics().setDepth(69);
      g.x = W / 2; g.y = H * 0.60;
      g.lineStyle(4, 0xff7a8a, 0.9); g.strokeCircle(0, 0, 34);
      g.lineStyle(3, 0xff7a8a, 0.55); g.strokeCircle(0, 0, 22);
      g.fillStyle(0xff7a8a, 0.9); g.fillCircle(0, 0, 6);
      g.alpha = 0;
      this.tweens.add({ targets: g, alpha: 1, duration: 600 });
      this.tweens.add({
        targets: g, scale: { from: 1, to: 1.4 }, alpha: { from: 0.9, to: 0.35 },
        duration: 1600, repeat: -1, yoyo: true, ease: 'Sine.easeInOut'
      });
    });

    this.time.delayedCall(9500, () => {
      const btn = createButton(this, {
        x: W / 2, y: H - 200, label: 'Onward',
        width: 360, height: 100, color: 0xff7a8a,
        onClick: () => this.exitFinale()
      });
      btn.setDepth(75); btn.alpha = 0;
      this.tweens.add({ targets: btn, alpha: 1, duration: 800 });
    });
  }

  // ============================================================
  // HOMEWARD OUTRO (after the Chapter 2 hero card): the on-ramp into Chapter 3,
  // Home Ground. Plays unconditionally now that the chapter is always on.
  //
  // This is deliberately NOT a cliffhanger. Chapter 1 ended by opening a threat
  // ("the dark did not leave. It SHRANK") because Chapter 2 was more story. The
  // story is DONE here: Patient Zero is beaten, the last shadow let go, and the
  // hero card has already landed. So this coda closes the conflict out loud
  // ("nothing left to fight") and opens a DOOR instead of a wound: the journey
  // home. Home Ground is where you've stopped fighting, not where you fight next.
  // The two payoff lines below stay exactly as shipped; they still fit.
  // ============================================================
  showHomewardOutro() {
    const wash = this.add.rectangle(W / 2, H / 2, W, H, 0x1a1208, 1).setDepth(80);
    wash.alpha = 0;
    this.tweens.add({ targets: wash, alpha: 0.94, duration: 1400, ease: 'Quad.easeIn' });

    const lines = [
      { t: 'And that was the last of it.', size: 42, fill: '#fff3b8', y: 0.26, delay: 700 },
      { t: 'Nothing left to fight.\nNot out in the stars. Not down in the smallest cell.', size: 34, fill: '#ffe0a0', y: 0.38, delay: 2600 },
      { t: 'But you are a long way from home,\nand the light you switched back on\nis waiting for you there.', size: 36, fill: '#ffd27a', y: 0.55, delay: 5000 },
      { t: 'Find the WARM GATE beside THE SINGULARITY CELL\nand take the long way home.', size: 30, fill: '#9be86b', y: 0.72, delay: 7800 }
    ];
    lines.forEach(l => {
      const txt = this.add.text(W / 2, H * l.y, l.t, style('display', {
        fontSize: `${l.size}px`, fill: l.fill, align: 'center',
        stroke: '#0a0a1a', strokeThickness: 4, wordWrap: { width: W - 120 }
      })).setOrigin(0.5).setDepth(85);
      txt.alpha = 0; txt.setScale(0.92);
      this.time.delayedCall(l.delay, () => {
        audio.playMatch?.();
        this.tweens.add({ targets: txt, alpha: 1, scale: 1, duration: 800, ease: 'Back.easeOut' });
      });
    });

    // A small red gondola cabin on its cable (paper cutout, plain shapes, no
    // rays / spiral / sigil): the first glimpse of the ride up the mountain that
    // ends the chapter, and the daylight answer to the cliffhanger outro's cold
    // portal rings. The cable is its own static graphic so the cabin can sway
    // from the wheel without dragging the cable with it.
    this.time.delayedCall(6200, () => {
      const cx = W / 2, cy = H * 0.625;
      const cable = this.add.graphics().setDepth(83);
      cable.lineStyle(3, 0x000000, 0.22); cable.lineBetween(cx - 90 + 4, cy + 6, cx + 90 + 4, cy + 6);
      cable.lineStyle(3, CABIN_DARK, 0.9);  cable.lineBetween(cx - 90, cy, cx + 90, cy);
      const g = drawGondolaCabin(this.add.graphics().setDepth(84));
      g.x = cx; g.y = cy;
      cable.alpha = 0; g.alpha = 0;
      this.tweens.add({ targets: [cable, g], alpha: 1, duration: 600 });
      this.tweens.add({
        targets: g, rotation: { from: -0.05, to: 0.05 },
        duration: 1800, repeat: -1, yoyo: true, ease: 'Sine.easeInOut'
      });
    });

    this.time.delayedCall(10200, () => {
      const btn = createButton(this, {
        x: W / 2, y: H - 180, label: 'Head home',
        width: 380, height: 100, color: 0xffd27a,
        onClick: () => this.exitFinale()
      });
      btn.setDepth(88); btn.alpha = 0;
      this.tweens.add({ targets: btn, alpha: 1, duration: 800 });
    });
  }

  // ============================================================
  // HOMECOMING OUTRO (Chapter 3 / World 38): dusk on the mountain, the payoff.
  // After the cards, the dusk wash (violet overhead, afterglow, warm cream low
  // down) settles in as a plain gradient reveal, NO spiral/wormhole, per the
  // content rule. The lit mountain rises, the city lights come on below it, and
  // the journey closes on the personal message.
  // ============================================================
  showHomecomingOutro() {
    // Dusk wash: the same sky the recap cards played over, settling in on top of
    // them so the stage is clean. Violet down to afterglow down to warm cream.
    const day = paintDuskSky(this, 60);
    day.alpha = 0;
    this.tweens.add({ targets: day, alpha: 1, duration: 1800, ease: 'Quad.easeIn' });

    // The sun is already down behind the ridge; what is left is a soft afterglow
    // band at the horizon under the mountain (plain ellipses, no rays).
    const sun = this.add.graphics().setDepth(61);
    sun.fillStyle(DUSK_LOW, 0.35); sun.fillEllipse(W * 0.5, H * 0.545, 760, 220);
    sun.fillStyle(0xfff8e7, 0.45); sun.fillEllipse(W * 0.5, H * 0.545, 360, 110);
    sun.alpha = 0;
    this.tweens.add({ targets: sun, alpha: 1, duration: 2200, delay: 500 });

    // The Mountain, lit: reuse the World 38 node art (the lit peak with one
    // cabin heading down toward the city lights) at 2.4x, so the icon the kid
    // tapped on the map is the one that lights up.
    this.time.delayedCall(1300, () => {
      const lh = drawWorldNode(this, W / 2, H * 0.44, 38, { scale: 2.4 });
      lh.setDepth(62); lh.setScale(0); lh.alpha = 0;
      this.tweens.add({ targets: lh, scale: 2.4, alpha: 1, duration: 900, ease: 'Back.easeOut' });
    });

    // The two payoff lines (coming home, and the lights coming on below) are a
    // NARRATOR fallback in second person, holding the spot for J's own words.
    // The headline sits in the violet band, so it gets a cream fill on a dusk
    // stroke; the lower lines sit on the afterglow and cream and keep dark fills.
    const lines = [
      { t: 'CHAPTER 3 COMPLETE', size: 58, fill: '#ffe9a8', stroke: '#3a2a50', y: 0.14, delay: 800 },
      { t: 'From the far stars, and the deep cell,', size: 36, fill: '#5a4410', y: 0.62, delay: 2600 },
      { t: 'you took the long way home.', size: 42, fill: '#4a3568', y: 0.69, delay: 4400 },
      { t: 'The mountain is lit for the ride down.\nBelow you, one by one, the city lights come on.', size: 32, fill: '#1f5a6a', y: 0.78, delay: 6600 },
    ];
    lines.forEach(l => {
      const txt = this.add.text(W / 2, H * l.y, l.t, style('display', {
        fontSize: `${l.size}px`, fill: l.fill, align: 'center',
        stroke: l.stroke || '#fff6e0', strokeThickness: 4, wordWrap: { width: W - 120 }
      })).setOrigin(0.5).setDepth(70);
      txt.alpha = 0; txt.setScale(0.92);
      this.time.delayedCall(l.delay, () => {
        audio.playMatch?.();
        this.tweens.add({ targets: txt, alpha: 1, scale: 1, duration: 800, ease: 'Back.easeOut' });
      });
    });

    // The personal message — the capstone of the whole game, soft and warm.
    this.time.delayedCall(8800, () => {
      const msg = this.add.text(W / 2, H * 0.88, HERO_MESSAGE, style('display', {
        fontSize: '64px', fill: '#c44b3a', stroke: '#fff6e0', strokeThickness: 5
      })).setOrigin(0.5).setDepth(71);
      msg.alpha = 0; msg.setScale(0.9);
      audio.playStar?.();
      this.tweens.add({
        targets: msg, alpha: 1, scale: 1, duration: 1400, ease: 'Back.easeOut',
        onComplete: () => this.tweens.add({
          targets: msg, scaleX: 1.06, scaleY: 1.06,
          duration: 800, yoyo: true, repeat: 1, ease: 'Sine.easeInOut'
        })
      });
    });

    // "Home" button: back to the (now-complete) Home Ground map.
    this.time.delayedCall(10800, () => {
      const btn = createButton(this, {
        x: W / 2, y: H - 140, label: 'Home',
        width: 340, height: 96, color: 0x4f8a3a,
        onClick: () => this.exitFinale()
      });
      btn.setDepth(75); btn.alpha = 0;
      this.tweens.add({ targets: btn, alpha: 1, duration: 800 });
    });
  }

  // ============================================================
  // Pet + ship gently choreograph around the hero card. Looped paths,
  // slow and soft so they read as background motion behind the names.
  // ============================================================
  startChronoChoreography() {
    const shipContainer = this.add.container(-200, H * 0.85).setDepth(65);
    const shipG = drawShip(this, 0, 0, {
      scale: 1.0,
      parts: ship.getCurrentParts()
    });
    shipContainer.add(shipG);
    shipContainer.shipG = shipG;

    let petInCockpit = null;
    if (companion.hasStarter()) {
      const pc = shipG.portholeCenter || { x: 0, y: -60 };
      petInCockpit = drawCompanion(this, pc.x, pc.y, { scale: 0.4 });
      shipG.add(petInCockpit);
    }

    this._cockpitPet = petInCockpit;

    // Soft figure-8-ish loop staying out of the central hero text area.
    const stages = [
      { x: 220,       y: H * 0.85, rot: 0,     dur: 4200, ease: 'Sine.easeInOut' },
      { x: W - 220,   y: H * 0.75, rot: 0.18,  dur: 5200, ease: 'Sine.easeInOut' },
      { x: W - 140,   y: H * 0.92, rot: -0.10, dur: 4400, ease: 'Sine.easeInOut' },
      { x: 180,       y: H * 0.78, rot: 0.20,  dur: 5400, ease: 'Sine.easeInOut', wave: true },
      { x: W * 0.5,   y: H * 0.95, rot: 0,     dur: 4400, ease: 'Sine.easeInOut', zap: true }
    ];

    const loop = (i) => {
      if (!shipContainer.active) return;
      const stage = stages[i % stages.length];
      this.tweens.add({
        targets: shipContainer,
        x: stage.x,
        y: stage.y,
        rotation: stage.rot,
        duration: stage.dur,
        ease: stage.ease,
        onComplete: () => {
          if (stage.wave && petInCockpit) {
            this.tweens.add({
              targets: petInCockpit,
              scaleX: 0.55, scaleY: 0.55,
              duration: 220, yoyo: true, repeat: 2,
              ease: 'Sine.easeInOut'
            });
            audio.playPetChirp?.();
          }
          if (stage.zap) {
            for (let s = 0; s < 6; s++) {
              const star = this.add.graphics().setDepth(66);
              star.fillStyle(0xfbbf24, 1);
              star.fillCircle(0, 0, 4);
              star.x = shipContainer.x;
              star.y = shipContainer.y;
              const dx = (Math.random() - 0.5) * 300;
              const dy = (Math.random() - 0.5) * 200;
              this.tweens.add({
                targets: star,
                x: shipContainer.x + dx,
                y: shipContainer.y + dy,
                alpha: 0,
                duration: 600,
                onComplete: () => star.destroy()
              });
            }
            audio.playLaser?.();
          }
          loop(i + 1);
        }
      });
    };
    loop(0);
  }

  startWorldsParallax() {
    this._worldNodes = [];
    this._worldIdx = 0;

    const spawnOne = () => {
      const worldId = (this._worldIdx++ % 11) + 1;
      const y = Phaser.Math.Between(H * 0.06, H * 0.18);
      const node = drawWorldNode(this, W + 120, y, worldId, { scale: 0.5 });
      node.setDepth(62);
      node.alpha = 0.5;
      this._worldNodes.push(node);

      const driftDur = 14000;
      this.tweens.add({
        targets: node,
        x: -160,
        duration: driftDur,
        ease: 'Linear',
        onComplete: () => {
          const i = this._worldNodes.indexOf(node);
          if (i >= 0) this._worldNodes.splice(i, 1);
          node.destroy();
        }
      });
      this.tweens.add({
        targets: node,
        y: y + 12,
        duration: 2400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      this.time.delayedCall(driftDur / 2, () => {
        if (!this._cockpitPet || !this._cockpitPet.active) return;
        this.tweens.add({
          targets: this._cockpitPet,
          scaleX: 0.45,
          scaleY: 0.35,
          duration: 220,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.easeInOut'
        });
      });
    };

    this.time.delayedCall(2000, spawnOne);
    this._worldsSpawner = this.time.addEvent({
      delay: 6500,
      loop: true,
      startAt: -2000,
      callback: spawnOne
    });
  }

  // ============================================================
  // PART C — Personalized hero shout-out (long, slow, the magic moment)
  // Names reveal one at a time, then the message. Ship choreographs in
  // the background. Gold sparkles drift. Holds long before "Onward".
  // ============================================================
  showHeroCard() {
    // Kick off the pet+ship choreography in the background (they orbit the
    // bottom of the screen, behind the hero text).
    this.startChronoChoreography();
    this.startWorldsParallax();

    // Slow dark wash — gives the hero text a quiet stage. Paced to the 52s
    // credits song: cards (~14s) + evolution (~4s) + this hero card (~34s)
    // ≈ 52s, with the Onward button landing as the song resolves.
    const wash = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 1).setDepth(60);
    wash.alpha = 0;
    this.tweens.add({
      targets: wash, alpha: 0.92,
      duration: 3000, ease: 'Quad.easeIn'
    });

    // Soft gold halo backdrop behind where the names will appear.
    const heroContainer = this.add.container(W / 2, H * 0.42).setDepth(70);
    const halo = this.add.graphics();
    halo.fillStyle(0xfbbf24, 0.10);
    halo.fillCircle(0, 0, 600);
    halo.fillStyle(0xfbbf24, 0.06);
    halo.fillCircle(0, 0, 780);
    halo.alpha = 0;
    heroContainer.add(halo);
    this.tweens.add({
      targets: halo, alpha: 1,
      duration: 2800, delay: 1500,
      ease: 'Quad.easeOut'
    });

    // Subtle bob across the whole hero container.
    this.tweens.add({
      targets: heroContainer,
      y: H * 0.42 - 8,
      duration: 4200, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Names reveal one at a time. Each gets its own sparkle burst.
    // Split HERO_NAMES by spaces so each kid lands on its own beat.
    const nameStrings = HERO_NAMES.split(/\s+/).filter(Boolean);
    const nameSpacing = 320;
    const nameStartX = -(nameStrings.length - 1) * nameSpacing / 2;
    const nameObjects = [];
    nameStrings.forEach((str, idx) => {
      const x = nameStartX + idx * nameSpacing;
      const t = this.add.text(x, -100, str, style('display', {
        fontSize: '120px',
        fill: '#fbbf24',
        stroke: '#0a0a1a',
        strokeThickness: 6,
        align: 'center'
      })).setOrigin(0.5);
      t.alpha = 0;
      t.setScale(0.7);
      heroContainer.add(t);
      nameObjects.push(t);
    });

    const NAME_REVEAL_DELAYS = [4500, 8500, 12500]; // t in ms from now
    nameStrings.forEach((str, idx) => {
      this.time.delayedCall(NAME_REVEAL_DELAYS[idx], () => {
        const target = nameObjects[idx];
        // Sparkle burst at the name's spot
        const cx = W / 2 + (nameStartX + idx * nameSpacing);
        const cy = H * 0.42 - 100;
        for (let s = 0; s < 14; s++) {
          const star = this.add.graphics().setDepth(69);
          star.fillStyle(0xfff3b8, 1);
          star.fillCircle(0, 0, 3 + Math.random() * 3);
          star.x = cx; star.y = cy;
          const angle = (s / 14) * Math.PI * 2;
          const dist = 60 + Math.random() * 100;
          this.tweens.add({
            targets: star,
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            alpha: 0,
            duration: 900 + Math.random() * 400,
            ease: 'Quad.easeOut',
            onComplete: () => star.destroy()
          });
        }
        audio.playMatch?.();
        this.tweens.add({
          targets: target,
          alpha: 1, scale: 1,
          duration: 900, ease: 'Back.easeOut'
        });
      });
    });

    // Message ("爸爸爱你") appears after all names land.
    const msg = this.add.text(0, 100, HERO_MESSAGE, style('display', {
      fontSize: '92px',
      fill: '#ffffff',
      stroke: '#0a0a1a',
      strokeThickness: 5,
      align: 'center'
    })).setOrigin(0.5);
    msg.alpha = 0;
    msg.setScale(0.85);
    heroContainer.add(msg);
    this.time.delayedCall(17000, () => {
      this.tweens.add({
        targets: msg,
        alpha: 1, scale: 1,
        duration: 2200, ease: 'Back.easeOut',
        onComplete: () => {
          // Heartbeat pulse — slow, twice.
          this.tweens.add({
            targets: msg,
            scaleX: 1.08, scaleY: 1.08,
            duration: 700, yoyo: true, repeat: 1,
            ease: 'Sine.easeInOut'
          });
        }
      });
    });

    // Slow expanding gold rings around the message — repeats forever, the
    // visual hum of the moment.
    this.time.delayedCall(20500, () => {
      const ringSpawner = this.time.addEvent({
        delay: 2400, loop: true,
        callback: () => {
          const ring = this.add.graphics().setDepth(68);
          ring.lineStyle(4, 0xfbbf24, 0.5);
          ring.strokeCircle(0, 0, 80);
          ring.x = W / 2;
          ring.y = H * 0.42 + 100;
          this.tweens.add({
            targets: ring,
            scaleX: 5, scaleY: 5, alpha: 0,
            duration: 3200, ease: 'Quad.easeOut',
            onComplete: () => ring.destroy()
          });
        }
      });
      this._heroRingSpawner = ringSpawner;
    });

    // Continuous gentle gold star drift — adds atmosphere over the whole
    // hold time.
    const driftStars = this.time.addEvent({
      delay: 400, loop: true,
      callback: () => {
        const s = this.add.graphics().setDepth(69);
        s.fillStyle(0xfbbf24, 0.85);
        s.fillCircle(0, 0, 1.5 + Math.random() * 2.5);
        s.x = Math.random() * W;
        s.y = H + 20;
        this.tweens.add({
          targets: s,
          y: -30,
          alpha: { from: 0, to: 0.9 },
          duration: 6000 + Math.random() * 3000,
          ease: 'Linear',
          onComplete: () => s.destroy()
        });
      }
    });
    this._driftStars = driftStars;

    // Nanocraft reward reveal (~30s). The hull is already equipped (granted by
    // markFinaleSeen in GameScene), so it's literally flying in the choreography
    // above — this banner just names the trophy.
    this.time.delayedCall(30000, () => {
      const rc = this.add.container(W / 2, H - 330).setDepth(74);
      const rg = this.add.graphics();
      rg.fillStyle(0x0a0a1a, 0.92); rg.fillRoundedRect(-300, -46, 600, 92, 18);
      rg.lineStyle(3, 0x4ecdc4, 1); rg.strokeRoundedRect(-300, -46, 600, 92, 18);
      rc.add(rg);
      rc.add(this.add.text(0, -16, '★ NANOCRAFT HULL UNLOCKED ★', style('caption', {
        fontSize: '26px', fill: '#4ecdc4', fontStyle: '900'
      })).setOrigin(0.5));
      rc.add(this.add.text(0, 18, 'Equipped! Build out the rest in the Shop.', style('caption', {
        fontSize: '20px', fill: '#cfcfe0'
      })).setOrigin(0.5));
      rc.alpha = 0;
      audio.playStardustChime?.();
      this.tweens.add({ targets: rc, alpha: 1, duration: 700, ease: 'Quad.easeOut' });
    });

    // "Onward" button arrives at ~33s, landing right as the 52s song
    // resolves (cards 14s + evolution 4s + this 33s ≈ 51s).
    this.time.delayedCall(33000, () => {
      // The hero card is not the last beat: a short homeward coda follows it
      // (see showHomewardOutro), which is the on-ramp into Home Ground.
      const btn = createButton(this, {
        x: W / 2, y: H - 200, label: 'Onward',
        width: 360, height: 100,
        color: 0xfbbf24,
        onClick: () => this.showHomewardOutro()
      });
      btn.setDepth(75);
      btn.alpha = 0;
      this.tweens.add({ targets: btn, alpha: 1, duration: 800 });
    });
  }

  exitFinale() {
    // Persist the right flag for the mode (both idempotent; GameScene already
    // set them early, this is the belt-and-suspenders on the "Onward" path).
    if (this.mode === 'cliffhanger') {
      progress.markEndingSeen();
    } else if (this.mode === 'homecoming') {
      progress.markFinale3Seen();
    } else {
      progress.markFinaleSeen();
    }
    progress.consumeJustClearedWorld(); // Clear any stale flag.

    // Stop the ambient spawners so they don't keep firing after we leave.
    if (this._heroRingSpawner) this._heroRingSpawner.remove();
    if (this._driftStars) this._driftStars.remove();
    if (this._worldsSpawner) this._worldsSpawner.remove();
    (this._worldNodes || []).forEach(c => {
      this.tweens.killTweensOf(c);
      c.destroy();
    });

    if (this._creditsSong && this._creditsSong.isPlaying) {
      this.tweens.add({
        targets: this._creditsSong,
        volume: 0,
        duration: 400,
        onComplete: () => this._creditsSong.stop()
      });
    }

    // Open the map on the chapter that actually contains the parked world, and
    // park the ship on that chapter's final world. Without setting the chapter,
    // a replay launched from the "wrong" chapter (e.g. dev-menu finale replay
    // while viewing Chapter 1) would rebuild the wrong map and park on a node id
    // that doesn't exist there. setCurrentChapter is idempotent.
    // Each credits mode parks on its chapter's final world; default is the
    // grand finale (Chapter 2, World 28).
    const MODE_TARGET = {
      cliffhanger: { chapter: 1, world: 11 },
      homecoming: { chapter: 3, world: 38 }
    };
    const target = MODE_TARGET[this.mode] || { chapter: 2, world: 28 };
    progress.setCurrentChapter(target.chapter);
    this.registry.set('shipParkedWorldId', target.world);
    this.registry.set('freePlay', false);
    this.registry.set('creditsMode', null); // consume so a stray relaunch defaults cleanly

    new TransitionManager(this).fadeToScene('WorldMapScene');
  }
}
