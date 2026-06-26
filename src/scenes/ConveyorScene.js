// ConveyorScene — Chapter 3 "Maker Space" mode: STAMP & SHIP (Conveyor Sort).
//
// The new mode of play for Chapter 3: instead of falling asteroids you tap to
// destroy, math-stamped crates ride a calm belt and you route each one to the
// dock whose label matches its answer. No falling threat, no ship to defend —
// just SHIPPED! stamps and a growing tally. The whole pedagogy engine is reused
// untouched (getProblemForWorld / getDistractors / recordFactAttempt); only the
// presentation + interaction layer is new.
//
// CORE LOOP (Phase 1):
//   • Exactly ONE crate is readable/answerable at a time — non-negotiable for a
//     clean timing signal. The fact is hidden while the crate slides in, and
//     `startedAtMs` is set only when it parks in the active zone and the input
//     opens (mirrors GameScene's "readable → committed" measure). This kills
//     the "pre-read the next crate" exploit.
//   • Correct answer → crate ships, SHIPPED ticks, recordFactAttempt(a, b, true,
//     elapsedMs) — elapsed measures the readable→first-correct window. Wrong
//     answer → gentle "return to sender" wobble, recordFactAttempt(a, b, false)
//     with NO timing (only correct answers carry recall-speed signal — identical
//     to GameScene's protocol), and the crate stays so the kid can retry.
//   • A crate that rides off the end requeues that exact fact (no record — a
//     non-answer isn't a wrong answer) so the kid sees it again next.
//   • Round-end re-implements GameScene's CAMPAIGN branch from the shared
//     primitives: calculateStars / isRoundMastered / completeLevel / addStardust.
//
// PHASE 2 (the pedagogy win): two interchangeable input modes behind the
// `conveyorInputMode` localStorage flag — the engine can't tell them apart
// (both call commit() → recordFactAttempt identically), so the A/B is purely a
// UX/volume question resolved later from real timing data (Phase 6):
//   • `production` (DEFAULT): free recall — the crate shows the fact and a big
//     number keypad lets the kid punch the answer they RETRIEVED (no options to
//     pick from). This is the form that builds durable fast recall.
//   • `recognition`: 4 labeled docks ([answer, ...getDistractors]), relabelled
//     AND repositioned (truly shuffled into a random slot) every crate; one tap.
//   Belt window = max(getAdaptiveProblemSeconds, getComfortableProblemSeconds) —
//   pace-floored so a slow kid never races and a fast kid can't drop below the
//   adaptive FLOOR (a sub-2.5s belt would manufacture taps the engine wrongly
//   stamps "automatic"). The streak/combo is gated on CORRECT answers, never on
//   belt velocity; the belt itself never accelerates. Per-fact recall times +
//   the dock-position-repeat rate are instrumented (records.recordConveyor*) and
//   surfaced in ParentDashboardScene.
//
// PHASE 3 (boss = "Rush Order"): the level-4 boss runs the SAME core loop with
// levelMode==='boss' (the engine then serves 100% weak facts). Instead of a
// fixed-time round scored on accuracy, it's a QUOTA race: fill a big order
// (getBossHpForWorld crates) before the clock (getBossDurationForWorld) runs out.
// A WIN is the mastery demonstration (isRoundMastered({isBoss:true,bossWin})),
// and clearing the boss masters the world → unlocks the next. Tonally it's a
// "big order to fill before the truck leaves" — NO monster, no enemy (Maker
// Space has no combat), so the GameScene boss INTRO/DEFEAT cinematics (monster
// silhouette + shatter, and coupled to a boss asteroid + ship HP that don't
// exist here) are deliberately NOT reused; a calm Maker-native intro + order-
// complete beat stand in. Boss stars use a Conveyor metric (accuracy + time to
// spare) since there is no ship HP for GameScene.calculateBossStars to read.
//
// The Maker-Space art/audio/finale pass lands in Phases 4-5.
// See /Users/j/.claude/plans/cosmic-crunch-i-want-purring-dawn.md.

import Phaser from 'phaser';
import {
  MODES,
  WORLDS,
  findWorld,
  getProblemForWorld,
  getDistractors,
  getAdaptiveProblemSeconds,
  getComfortableProblemSeconds,
  getBossHpForWorld,
  getBossDurationForWorld,
  isRoundMastered,
  calculateStars,
  getWorldMusicRate,
  isChapter3FinaleWorld,
  progress
} from '../GameData.js';
import { music } from '../MusicManager.js';
import { audio } from '../AudioManager.js';
import { getWorldBackground } from '../WorldBackgrounds.js';
import { darken, lighten } from '../colorUtils.js';
import { TransitionManager } from '../TransitionManager.js';
import { createButton, createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { COLORS } from '../colorPalette.js';
import { companion, drawCompanion } from '../CompanionManager.js';
import { economy, claimDailyBonusIfDue } from '../EconomyManager.js';
import { records } from '../RecordsManager.js';
import { drawStarIcon, drawSparkleIcon } from '../StatIcons.js';
import { drawMasteryWall } from '../MasteryWall.js';

const W = 1080;
const H = 1920;

// Belt + crate geometry (portrait 1080×1920).
const BELT_Y = 820;          // vertical center of the conveyor band
const BELT_H = 250;          // belt band height
const ACTIVE_X = W / 2;      // where a crate parks while readable
const CRATE_SIZE = 250;      // crate body width/height
const ARRIVAL_MS = 440;      // slide-in (fact HIDDEN — not part of the timed window)
const SHIP_MS = 460;         // arc-to-dock on a correct route
const RESOLVE_GAP_MS = 260;  // calm beat between crates

// Dock row (the labeled answer bins).
const DOCK_COUNT = 4;
const DOCK_Y = 1500;
const DOCK_MARGIN = 46;
const DOCK_GAP = 22;
const DOCK_W = Math.round((W - 2 * DOCK_MARGIN - (DOCK_COUNT - 1) * DOCK_GAP) / DOCK_COUNT);
const DOCK_H = 240;

// Production keypad (the free-recall stamp pad). 3-column grid: 1-9, then ⌫ 0 ✓.
const KEYPAD_BTN_W = 210;
const KEYPAD_BTN_H = 124;
const KEYPAD_GAP_X = 24;
const KEYPAD_GAP_Y = 22;
const KEYPAD_TOP = 1248;          // y of the first (top) keypad row's center
const KEYPAD_COL0 = W / 2 - (KEYPAD_BTN_W + KEYPAD_GAP_X); // center x of left column
const ENTRY_Y = 1090;             // recalled-answer readout, between belt and pad
const ENTRY_PLATE_H = 120;        // readout plate height (kept clear of the top keypad row)
const MAX_ANSWER_DIGITS = 3;      // products top out at 12×12 = 144

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class ConveyorScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ConveyorScene' });
  }

  create() {
    this.worldId = this.registry.get('currentWorldId') || 31;
    this.currentLevel = this.registry.get('currentLevel') || 1;
    this.levelMode = this.registry.get('levelMode') || 'mult';
    this.world = findWorld(this.worldId) || WORLDS[0];
    this.accent = this.world.accentColor;
    this.isBoss = this.levelMode === 'boss';

    // Input mode A/B (see header). Production = free-recall keypad (default);
    // recognition = labeled docks. Anything other than the explicit
    // 'recognition' opt-in defaults to production. Applies to boss too — the
    // boss only changes which FACTS are served (100% weak), not the input.
    this.inputMode = localStorage.getItem('conveyorInputMode') === 'recognition'
      ? 'recognition'
      : 'production';

    // Phaser reuses the scene instance across scene.start, so reset every field
    // update()/finishRound() guard on at the TOP of create() — otherwise a stale
    // (now-destroyed) timeBarFill/quotaBar from a prior round could slip past the
    // guard and update() would .clear() a dead graphics object.
    this.ended = false;
    this.timeBarFill = null;
    this.quotaBarFill = null;
    this.roundEndsAt = null;
    this.roundTimer = null;
    this.docks = [];
    this.keypad = null;
    this.entry = '';
    this.lastCorrectDockIndex = null;
    this.bossQuota = 0;
    this.bossWon = false;
    this.shakeTweenX = null;
    this.shakeTweenAngle = null;

    audio.init?.();

    // Music: the Rush Order boss gets the maker boss theme; practice rounds keep
    // the maker level theme (LevelSelectScene already started it via resolveTrack,
    // so re-applying carries it seamlessly and re-pitches per world). resolveTrack
    // falls back to the Chapter-1 boss/level themes until the bespoke maker MP3s
    // ship, so the chapter is never silent.
    const trackKey = this.isBoss
      ? music.resolveTrack(this, 'makerBoss', 'bossTheme')
      : music.resolveTrack(this, 'makerLevel', 'levelTheme');
    music.fadeToTrack(this, trackKey);
    music.setPlaybackRate(getWorldMusicRate(this.worldId), 600);

    this.drawBackdrop();

    // ── Round state (mirrors GameScene's campaign run) ──────────────────────
    this.score = 0;        // crates correctly shipped
    this.attempts = 0;     // every committed answer (correct + wrong) → accuracy
    this.shipped = 0;      // SHIPPED tally (== score; named for the HUD)
    this.streak = 0;
    this.bestStreak = 0;
    this.stardustEarned = 0;
    this.acceptingInput = false;
    this.requeuedFact = null;   // {a,b} of a crate that rode off the end
    this.activeProblem = null;
    this.crate = null;

    if (this.isBoss) {
      // The boss is a QUOTA race, not an accuracy-scored fixed round. 100% weak
      // facts come for free from getProblemForWorld(..., 'boss').
      this.bossMaxQuota = getBossHpForWorld(this.worldId);
      this.scoreThreshold = this.bossMaxQuota;   // parity w/ GameScene boss
      this.duration = getBossDurationForWorld(this.worldId);
    } else {
      this.scoreThreshold = MODES[this.levelMode].scoreThreshold;
      this.duration = MODES[this.levelMode].duration;
    }

    // Adaptive belt window: how long a parked crate waits before it rides off
    // into the recheck chute. Take the SLOWER (max) of the pushy adaptive window
    // and the comfortable floor so a slow kid never races; on cold start (no pace
    // data) both fall back to the world's calm designed seconds. The adaptive
    // FLOOR (2s) also keeps even a fast kid above the sub-2.5s zone where a belt
    // would manufacture taps the engine wrongly certifies "automatic". Boss mode
    // gets its +1s accuracy cushion baked into both helpers.
    const paceMs = records.getPaceMs();
    this.problemSeconds = Math.max(
      getAdaptiveProblemSeconds(this.worldId, this.levelMode, paceMs),
      getComfortableProblemSeconds(this.worldId, this.levelMode, paceMs)
    );

    this.buildHud();
    this.buildBelt();
    if (this.inputMode === 'production') this.buildKeypad();
    this.buildPet();

    this.events.once('shutdown', () => this.teardown());

    new TransitionManager(this).fadeIn(280);

    // The boss opens with a calm "big order incoming" card; the round clock only
    // starts once it's dismissed so the intro doesn't eat the timer. Practice
    // levels just roll the first crate in.
    if (this.isBoss) {
      this.playRushOrderIntro(() => this.startRound());
    } else {
      this.time.delayedCall(360, () => this.startRound());
    }
  }

  // Starts the round clock and rolls the first crate. Split out so the boss can
  // defer it until after the Rush Order intro (the timer must not tick early).
  startRound() {
    if (this.ended || !this.scene.isActive()) return;
    this.roundEndsAt = this.time.now + this.duration * 1000;
    this.roundTimer = this.time.delayedCall(this.duration * 1000, () => this.finishRound());
    this.spawnCrate();
  }

  update() {
    if (this.ended || !this.timeBarFill || !this.roundEndsAt) return;
    const remaining = Math.max(0, this.roundEndsAt - this.time.now);
    const ratio = this.duration > 0 ? remaining / (this.duration * 1000) : 0;
    this.drawTimeBar(ratio);
  }

  // ── Static chrome ─────────────────────────────────────────────────────────

  drawBackdrop() {
    // A warm daytime workshop — indoors, hand-built, tonally opposite the void
    // and the bloodstream. The per-world palette + back-wall scene come from the
    // shared WorldBackgrounds table (the same source GameScene uses), so each
    // Maker world reads as its own place: lantern bench, seed shed, railyard…
    const wb = getWorldBackground(this.worldId);
    // Lift the palette toward daytime — the WorldBackgrounds gradients are tuned
    // dark so nodes read on the map; in the workshop we want warm, lit air.
    const top = lighten(wb.bgTop, 0.10);
    const bottom = lighten(wb.bgBottom, 0.28);
    const g = this.add.graphics().setDepth(-2);
    g.fillGradientStyle(top, top, bottom, bottom, 1);
    g.fillRect(0, 0, W, H);

    // A soft pool of daylight on the back wall (sun through the workshop window)
    // so the scene reads warm/daytime rather than dim. No rays (content rule).
    const day = this.add.graphics().setDepth(-2);
    day.fillStyle(lighten(this.world.color, 0.45), 0.16);
    day.fillEllipse(W / 2, BELT_Y - 150, W * 1.1, 560);
    day.fillStyle(lighten(this.accent, 0.2), 0.10);
    day.fillEllipse(W / 2, BELT_Y - 220, W * 0.7, 360);

    // The world's back-wall scene, anchored just behind the belt (its shallow
    // floor tucks under the belt band; its props rise on the wall above).
    const hz = wb.drawHorizon(this, { width: W, y: BELT_Y - 110, world: this.world });
    hz?.setDepth(-1);

    // Warm plank floor under the belt to ground the scene.
    const floor = this.add.graphics().setDepth(1);
    floor.fillStyle(darken(this.world.color, 0.45), 1);
    floor.fillRect(0, BELT_Y + BELT_H - 40, W, H - (BELT_Y + BELT_H) + 40);
    floor.fillStyle(0x000000, 0.16);
    for (let x = 60; x < W; x += 150) floor.fillRect(x, BELT_Y + BELT_H - 40, 4, H);
    floor.fillStyle(lighten(this.world.color, 0.05), 0.25);
    floor.fillRect(0, BELT_Y + BELT_H - 40, W, 6);
  }

  buildHud() {
    // Back — abandons the round (no progress written) and returns to the world's
    // level grid.
    createIconButton(this, {
      x: 90, y: 110, radius: 44,
      accentColor: this.accent,
      drawIcon: (gr, size) => {
        gr.lineStyle(8, 0xffffff, 1);
        gr.beginPath();
        gr.moveTo(size * 0.35, -size * 0.5);
        gr.lineTo(-size * 0.35, 0);
        gr.lineTo(size * 0.35, size * 0.5);
        gr.strokePath();
      },
      onClick: () => this.abandonRound('LevelSelectScene')
    }).setDepth(20);

    this.add.text(W / 2, 70, this.isBoss ? 'RUSH ORDER' : 'STAMP & SHIP', style('caption', {
      fontSize: '26px', fill: this.isBoss ? '#ffb142' : '#cfcfe0', fontStyle: '900'
    })).setOrigin(0.5).setDepth(20);

    this.add.text(W / 2, 124, this.world.name, style('display', {
      fontSize: '52px',
      fill: '#' + this.accent.toString(16).padStart(6, '0')
    })).setOrigin(0.5).setDepth(20);

    // Hero counter — crates shipped (== quota progress in a boss order).
    this.shippedText = this.add.text(W / 2, 250, '0', style('display', {
      fontSize: '92px', fill: '#ffffff'
    })).setOrigin(0.5).setDepth(20);
    this.add.text(W / 2, 322, this.isBoss ? `OF ${this.bossMaxQuota} SHIPPED` : 'SHIPPED', style('caption', {
      fontSize: '24px', fill: '#cfcfe0', fontStyle: '900'
    })).setOrigin(0.5).setDepth(20);

    // Streak chip (top-right).
    this.streakText = this.add.text(W - 70, 250, '', style('subhead', {
      fontSize: '40px', fill: '#ff8b3d', fontStyle: '900'
    })).setOrigin(1, 0.5).setDepth(20);

    // Time bar.
    this.timeBarX = W / 2;
    this.timeBarY = 392;
    this.timeBarW = 760;
    this.timeBarH = 26;
    const track = this.add.graphics().setDepth(19);
    track.fillStyle(COLORS.bgTrack, 1);
    track.fillRoundedRect(this.timeBarX - this.timeBarW / 2, this.timeBarY - this.timeBarH / 2, this.timeBarW, this.timeBarH, this.timeBarH / 2);
    this.timeBarFill = this.add.graphics().setDepth(20);
    this.drawTimeBar(1);

    // Boss quota bar — sits under the time bar and fills as the order is packed.
    if (this.isBoss) {
      this.quotaBarX = W / 2;
      this.quotaBarY = 432;
      this.quotaBarW = 760;
      this.quotaBarH = 26;
      const qtrack = this.add.graphics().setDepth(19);
      qtrack.fillStyle(COLORS.bgTrack, 1);
      qtrack.fillRoundedRect(this.quotaBarX - this.quotaBarW / 2, this.quotaBarY - this.quotaBarH / 2, this.quotaBarW, this.quotaBarH, this.quotaBarH / 2);
      this.quotaBarFill = this.add.graphics().setDepth(20);
      this.drawQuotaBar();
    }
  }

  drawQuotaBar() {
    if (!this.quotaBarFill) return;
    const r = this.bossMaxQuota > 0 ? Math.max(0, Math.min(1, this.bossQuota / this.bossMaxQuota)) : 0;
    const fw = Math.max(0, Math.round(this.quotaBarW * r));
    this.quotaBarFill.clear();
    if (fw > 2) {
      this.quotaBarFill.fillStyle(COLORS.success, 1);
      this.quotaBarFill.fillRoundedRect(this.quotaBarX - this.quotaBarW / 2, this.quotaBarY - this.quotaBarH / 2, fw, this.quotaBarH, this.quotaBarH / 2);
    }
  }

  drawTimeBar(ratio) {
    const r = Math.max(0, Math.min(1, ratio));
    const fw = Math.max(0, Math.round(this.timeBarW * r));
    this.timeBarFill.clear();
    if (fw > 2) {
      const color = r > 0.35 ? this.accent : (r > 0.15 ? COLORS.warning : COLORS.error);
      this.timeBarFill.fillStyle(color, 1);
      this.timeBarFill.fillRoundedRect(this.timeBarX - this.timeBarW / 2, this.timeBarY - this.timeBarH / 2, fw, this.timeBarH, this.timeBarH / 2);
    }
  }

  buildBelt() {
    const g = this.add.graphics().setDepth(2);
    const left = 40;
    const right = W - 40;
    const top = BELT_Y - BELT_H / 2;

    // Warm wood/metal belt tones derived from the world palette (no cold purple).
    const beltBody = darken(this.world.color, 0.62);
    const beltSlat = darken(this.world.color, 0.4);
    const roller = this.accent;
    const rollerCore = lighten(this.world.color, 0.1);

    // Side frame rails (the bench the belt rides on).
    g.fillStyle(darken(this.world.color, 0.7), 1);
    g.fillRoundedRect(left - 8, top - 10, right - left + 16, BELT_H + 20, 30);

    // Belt body.
    g.fillStyle(beltBody, 1);
    g.fillRoundedRect(left, top, right - left, BELT_H, 26);
    g.fillStyle(0x000000, 0.30);
    g.fillRoundedRect(left, top + BELT_H * 0.62, right - left, BELT_H * 0.38, { tl: 0, tr: 0, bl: 26, br: 26 });

    // Belt slats (the "moving treads" read) — warm raised bars.
    for (let x = left + 50; x < right; x += 70) {
      g.fillStyle(beltSlat, 0.9);
      g.fillRoundedRect(x - 5, top + 14, 10, BELT_H - 28, 5);
      g.fillStyle(lighten(this.world.color, 0.08), 0.25);
      g.fillRect(x - 5, top + 14, 3, BELT_H - 28);
    }

    // Brass rollers at each end.
    g.fillStyle(darken(this.accent, 0.35), 1);
    g.fillCircle(left + 4, BELT_Y, BELT_H / 2 - 6);
    g.fillCircle(right - 4, BELT_Y, BELT_H / 2 - 6);
    g.fillStyle(roller, 1);
    g.fillCircle(left + 4, BELT_Y, BELT_H / 2 - 16);
    g.fillCircle(right - 4, BELT_Y, BELT_H / 2 - 16);
    g.fillStyle(rollerCore, 1);
    g.fillCircle(left + 4, BELT_Y, BELT_H / 2 - 30);
    g.fillCircle(right - 4, BELT_Y, BELT_H / 2 - 30);

    // Active-zone bracket — a soft highlight where the readable crate parks.
    const az = this.add.graphics().setDepth(3);
    az.lineStyle(5, this.accent, 0.85);
    const azW = CRATE_SIZE + 60;
    const azH = CRATE_SIZE + 60;
    const azX = ACTIVE_X - azW / 2;
    const azY = BELT_Y - azH / 2;
    const corner = 30;
    // Four corner brackets (not a full box) so it reads as a "target zone".
    const seg = 46;
    const drawCorner = (cx, cy, dx, dy) => {
      az.beginPath();
      az.moveTo(cx + dx * seg, cy);
      az.lineTo(cx, cy);
      az.lineTo(cx, cy + dy * seg);
      az.strokePath();
    };
    drawCorner(azX + corner, azY + corner, 1, 1);
    drawCorner(azX + azW - corner, azY + corner, -1, 1);
    drawCorner(azX + corner, azY + azH - corner, 1, -1);
    drawCorner(azX + azW - corner, azY + azH - corner, -1, -1);
    this.activeZoneGfx = az;

    // Recheck chute hint at the right end (where unanswered crates tip off).
    const chute = this.add.graphics().setDepth(2);
    chute.fillStyle(0x000000, 0.35);
    chute.fillRoundedRect(right - 70, BELT_Y - 30, 90, 120, 16);
    this.add.text(right - 24, BELT_Y + 110, 'recheck', style('caption', {
      fontSize: '18px', fill: '#9a8fb0'
    })).setOrigin(0.5).setDepth(2);
  }

  buildPet() {
    if (!companion.hasStarter?.()) return;
    const px = W - 200;
    const py = BELT_Y - BELT_H / 2 - 120;

    // A little loading crane the pet works — a warm wooden mast + jib reaching
    // over the belt with a pulley and hook. Cosmetic; sits behind the pet so the
    // companion reads as the crane operator.
    const crane = this.add.graphics().setDepth(3);
    const wood = darken(this.world.color, 0.5);
    const woodLite = lighten(this.world.color, 0.06);
    const mastX = px + 40;
    const mastTop = py - 70;
    const mastBot = BELT_Y - BELT_H / 2 - 6;
    crane.fillStyle(wood, 1);
    crane.fillRoundedRect(mastX - 12, mastTop, 24, mastBot - mastTop, 8);            // mast
    crane.fillRoundedRect(mastX - 150, mastTop, 162, 20, 8);                          // jib arm
    crane.fillStyle(woodLite, 0.5);
    crane.fillRect(mastX - 150, mastTop, 162, 5);
    crane.lineStyle(5, wood, 1);
    crane.lineBetween(mastX, mastTop + 20, mastX - 120, mastTop);                     // brace
    crane.fillStyle(this.accent, 1);
    crane.fillCircle(mastX - 140, mastTop + 28, 12);                                  // pulley
    crane.fillStyle(darken(this.accent, 0.4), 1);
    crane.fillCircle(mastX - 140, mastTop + 28, 5);
    crane.lineStyle(3, 0x2a1c0c, 1);
    crane.lineBetween(mastX - 140, mastTop + 40, mastX - 140, mastTop + 78);          // cable
    crane.fillStyle(0x2a1c0c, 1);                                                     // hook
    crane.beginPath();
    crane.arc(mastX - 140, mastTop + 86, 9, Math.PI * 0.1, Math.PI * 1.1);
    crane.strokePath();
    this.crane = crane;

    // The pet works the line — a warm anchor beside the belt. Cosmetic only.
    this.pet = drawCompanion(this, px, py, { scale: 1.0 });
    this.pet.setDepth(4);
    this.petTween = this.tweens.add({
      targets: this.pet,
      y: this.pet.y - 14,
      duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  // ── Core loop ─────────────────────────────────────────────────────────────

  spawnCrate() {
    if (this.ended) return;

    // Pull the next fact (a requeued miss takes priority so the kid re-sees it).
    const problem = getProblemForWorld(this.worldId, this.levelMode, this.requeuedFact);
    this.requeuedFact = null;
    this.activeProblem = problem;

    this.crate = this.buildCrate();
    this.crate.x = -CRATE_SIZE;
    this.crate.y = BELT_Y;

    // Slide in with the fact HIDDEN — no pre-read, so the timed window starts
    // clean only when it parks and the docks light up.
    this.arrivalTween = this.tweens.add({
      targets: this.crate,
      x: ACTIVE_X,
      duration: ARRIVAL_MS,
      ease: 'Sine.easeOut',
      onComplete: () => this.makeReadable()
    });
  }

  makeReadable() {
    if (this.ended || !this.crate) return;

    // Reveal the fact + open the input. THIS is when the kid can first read and
    // answer, so the timing signal starts here (identical for both input modes).
    this.crate.reveal(this.activeProblem.display);
    this.startedAtMs = performance.now();
    this.acceptingInput = true;

    if (this.inputMode === 'recognition') {
      const distractors = getDistractors(this.activeProblem, DOCK_COUNT - 1);
      const labels = shuffle([this.activeProblem.answer, ...distractors]).slice(0, DOCK_COUNT);
      this.buildDocks(labels);

      // Instrument randomization quality: how often the correct answer's dock
      // lands in the same slot as the previous crate. The shuffle above puts the
      // answer in a truly random slot, so this should sit near chance
      // (1/DOCK_COUNT). The first crate of a round has no previous slot (null).
      const correctIdx = labels.indexOf(this.activeProblem.answer);
      const repeated = this.lastCorrectDockIndex === null
        ? null
        : correctIdx === this.lastCorrectDockIndex;
      records.recordConveyorDockPosition(repeated);
      this.lastCorrectDockIndex = correctIdx;
    } else {
      // Production: clear the recalled-answer entry and open the keypad.
      this.entry = '';
      this.updateEntry();
      this.setKeypadEnabled(true);
    }

    // Gentle bob so the parked crate feels alive without moving the number.
    this.bobTween = this.tweens.add({
      targets: this.crate,
      y: BELT_Y - 12,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Ride-off-the-end timer: unanswered → requeue (no record).
    this.crateTimer = this.time.delayedCall(this.problemSeconds * 1000, () => this.timeoutCrate());
  }

  // The single resolution path for BOTH input modes — the only difference is
  // who calls it (a dock tap with its index, or the keypad with dockIndex=null)
  // and how the crate routes out. The engine writes are byte-identical, which is
  // exactly what makes the production-vs-recognition A/B clean.
  commit(value, dockIndex = null) {
    if (!this.acceptingInput || this.ended) return;
    const p = this.activeProblem;
    const correct = value === p.answer;

    if (correct) {
      this.acceptingInput = false;
      this.crateTimer?.remove();
      this.bobTween?.stop();
      // Kill any in-flight crate tween (e.g. a lingering shakeCrate from a wrong
      // retry on THIS crate) before the ship tween, so its onComplete can't snap
      // the now-shipping crate back to belt center. Reset the tilt too — a shake
      // killed mid-wobble would otherwise ship the crate at a stray angle (the
      // recognition route doesn't re-set angle on its way to the dock).
      this.tweens.killTweensOf(this.crate);
      this.crate.angle = 0;

      const elapsed = performance.now() - this.startedAtMs;
      progress.recordFactAttempt(p.a, p.b, true, elapsed);
      records.recordAnswer(p, true, elapsed);
      records.recordConveyorTiming(this.inputMode, elapsed);

      this.score++;
      this.attempts++;
      this.shipped++;
      this.streak++;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      if (this.isBoss) {
        this.bossQuota++;
        this.drawQuotaBar();
        if (this.bossQuota >= this.bossMaxQuota) {
          this.bossWon = true;
          // Order filled — disarm the round clock NOW. The win isn't banked until
          // afterResolve() fires (after the ~460ms ship animation); without this,
          // a buzzer-beater final crate lets the round timer fire finishRound()
          // (a LOSS) first, set ended=true, and swallow the real win.
          this.roundTimer?.remove();
          this.roundTimer = null;
        }
      }
      this.updateHud();
      this.pulseShippedCounter();
      audio.playMatch?.();

      if (this.inputMode === 'recognition') {
        this.setDocksEnabled(false);
        this.shipCrateToDock(dockIndex);
      } else {
        // Flash the recalled answer green + confirmed before it clears, so a
        // correct punch is acknowledged on the pad as well as on the crate.
        if (this.keypad?.entryText) {
          this.keypad.entryText.setColor('#58d68d');
          this.keypad.entryText.setText('= ' + p.answer + '  ✓');
        }
        this.setKeypadEnabled(false);
        this.shipCrateToOutput();
      }
    } else {
      // Return to sender — the crate STAYS (retry allowed), the clock keeps
      // running. Each wrong answer is a real attempt + de-certifies the fact.
      this.attempts++;
      this.streak = 0;
      progress.recordFactAttempt(p.a, p.b, false);
      records.recordAnswer(p, false, performance.now() - this.startedAtMs);
      audio.playWrong?.();
      this.updateHud();
      if (this.inputMode === 'recognition') {
        this.rejectDock(dockIndex);
      } else {
        // Clear the wrong entry so the kid can re-punch; keypad stays open.
        this.entry = '';
        this.updateEntry();
        this.flashEntryWrong();
      }
      this.crate?.flashWrong();
      if (this.crate) this.burstReject(this.crate.x, this.crate.y);
      this.shakeCrate();
    }
  }

  timeoutCrate() {
    if (this.ended || !this.acceptingInput) return;
    this.acceptingInput = false;
    this.bobTween?.stop();
    this.tweens.killTweensOf(this.crate); // drop any lingering shake before the tip-off
    this.setDocksEnabled(false);
    if (this.keypad) this.setKeypadEnabled(false);

    // Requeue the exact fact so it returns next — a non-answer is not a wrong
    // answer, so nothing is recorded (the engine still resurfaces weak facts).
    this.requeuedFact = { a: this.activeProblem.a, b: this.activeProblem.b };

    // Tip off the right end into the recheck chute.
    this.tweens.add({
      targets: this.crate,
      x: W + CRATE_SIZE,
      angle: 18,
      alpha: 0.25,
      duration: 520,
      ease: 'Quad.easeIn',
      onComplete: () => this.afterResolve()
    });
  }

  shipCrateToDock(dockIndex) {
    const dock = this.docks[dockIndex];
    const targetX = dock ? dock.cx : ACTIVE_X;
    const targetY = DOCK_Y - 30;
    const sx = this.crate.x, sy = this.crate.y;

    // SHIPPED stamp pops + a green burst at the crate; the dock thunks green.
    this.crate.stamp();
    this.burstSuccess(sx, sy);
    if (dock) this.thunkDock(dockIndex, true);

    // A quick anticipation squash ("pack it down"), then the routed crate flies
    // to its dock.
    this.tweens.add({
      targets: this.crate, scaleX: 1.12, scaleY: 0.86, duration: 80, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.crate) return;
        this.tweens.add({
          targets: this.crate,
          x: targetX, y: targetY, scaleX: 0.62, scaleY: 0.62,
          duration: SHIP_MS, ease: 'Quad.easeIn',
          onComplete: () => this.afterResolve()
        });
      }
    });

    // Little celebratory hop from the pet.
    this.pet?.bounceHappy?.();
  }

  // Production has no dock row (the keypad lives there), so a shipped crate is
  // "loaded out" — the crane lifts it up-and-off toward the pet/output.
  shipCrateToOutput() {
    const sx = this.crate.x, sy = this.crate.y;
    this.crate.stamp();
    this.burstSuccess(sx, sy);

    // Anticipation squash, then the crane lifts the stamped crate up-and-off.
    this.tweens.add({
      targets: this.crate, scaleX: 1.12, scaleY: 0.86, duration: 80, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.crate) return;
        this.tweens.add({
          targets: this.crate,
          x: W + CRATE_SIZE, y: BELT_Y - 280, scaleX: 0.5, scaleY: 0.5, angle: -8,
          duration: SHIP_MS, ease: 'Quad.easeIn',
          onComplete: () => this.afterResolve()
        });
      }
    });
    this.pet?.bounceHappy?.();
  }

  afterResolve() {
    if (this.ended) return;
    this.crate?.destroy();
    this.crate = null;
    this.clearDocks();

    // Boss order filled → win immediately (don't wait for the clock).
    if (this.isBoss && this.bossWon) {
      this.finishRound({ bossWin: true });
    } else if (this.time.now >= this.roundEndsAt) {
      this.finishRound();
    } else {
      this.time.delayedCall(RESOLVE_GAP_MS, () => this.spawnCrate());
    }
  }

  // ── Crate + dock art ──────────────────────────────────────────────────────

  buildCrate() {
    const c = this.add.container(0, 0).setDepth(6);
    const wood = Phaser.Display.Color.ValueToColor(this.world.color).lighten(8).color;
    const woodDark = Phaser.Display.Color.ValueToColor(this.world.color).darken(28).color;
    const s = CRATE_SIZE;

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRoundedRect(-s / 2 + 6, -s / 2 + 10, s, s, 22);
    c.add(shadow);

    const body = this.add.graphics();
    body.fillStyle(wood, 1);
    body.fillRoundedRect(-s / 2, -s / 2, s, s, 22);
    // Horizontal plank slats — a plain shipping crate (no diagonal cross).
    body.fillStyle(lighten(this.world.color, 0.14), 0.5);
    for (let i = 0; i < 4; i++) {
      body.fillRect(-s / 2 + 10, -s / 2 + 18 + i * (s - 36) / 4, s - 20, 5);
    }
    // Edge frame + corner bolts (the maker's hardware).
    body.lineStyle(8, woodDark, 1);
    body.strokeRoundedRect(-s / 2, -s / 2, s, s, 22);
    body.fillStyle(this.accent, 0.9);
    for (const [bx, by] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      body.fillCircle(bx * (s / 2 - 26), by * (s / 2 - 26), 7);
    }
    c.add(body);

    // Label plate where the fact prints.
    const plate = this.add.graphics();
    plate.fillStyle(0xf3ead7, 1);
    plate.fillRoundedRect(-s / 2 + 26, -52, s - 52, 104, 14);
    plate.lineStyle(4, woodDark, 0.6);
    plate.strokeRoundedRect(-s / 2 + 26, -52, s - 52, 104, 14);
    c.add(plate);

    // Wrong-answer wash — a red overlay on the plate, hidden at rest. Sits UNDER
    // the fact text so the number stays legible while it pulses.
    const plateFlash = this.add.graphics();
    plateFlash.fillStyle(COLORS.error, 1);
    plateFlash.fillRoundedRect(-s / 2 + 26, -52, s - 52, 104, 14);
    plateFlash.setAlpha(0);
    c.add(plateFlash);

    const factText = this.add.text(0, 0, '', style('display', {
      fontSize: '58px', fill: '#2c2336', stroke: '#2c2336', strokeThickness: 1
    })).setOrigin(0.5);
    c.add(factText);

    // SHIPPED stamp, hidden until a correct route.
    const stamp = this.add.container(0, 0);
    const stampG = this.add.graphics();
    stampG.lineStyle(6, COLORS.success, 1);
    stampG.strokeRoundedRect(-118, -34, 236, 68, 10);
    stamp.add(stampG);
    stamp.add(this.add.text(0, 0, 'SHIPPED', style('subhead', {
      fontSize: '40px', fill: '#58d68d', fontStyle: '900'
    })).setOrigin(0.5));
    stamp.setAngle(-12);
    stamp.setScale(0);
    stamp.setAlpha(0);
    c.add(stamp);

    c.reveal = (display) => factText.setText(display);

    c.stamp = () => {
      // Punch the SHIPPED stamp in with an overshoot + settle, plus a quick white
      // flare behind it — a correct route should land as a satisfying "ka-CHUNK",
      // not a gentle fade-in.
      stamp.setAlpha(1);
      stamp.setScale(0);
      stamp.setAngle(-28);
      const flare = this.add.graphics();
      flare.fillStyle(0xffffff, 0.9);
      flare.fillRoundedRect(-128, -42, 256, 84, 12);
      stamp.addAt(flare, 0);
      this.tweens.add({
        targets: stamp, scale: 1.18, angle: -12, duration: 200, ease: 'Back.easeOut',
        onComplete: () => this.tweens.add({ targets: stamp, scale: 1, duration: 130, ease: 'Sine.easeOut' })
      });
      this.tweens.add({
        targets: flare, alpha: 0, duration: 300, ease: 'Quad.easeOut',
        onComplete: () => { if (flare.active) flare.destroy(); }
      });
    };

    let wrongResetTimer = null;
    c.flashWrong = () => {
      // One firm red pulse over the plate + the fact text briefly reddening, so a
      // miss reads instantly without relying on the buzzer alone. Restart cleanly
      // on a rapid second miss: kill the prior pulse + reset timer so the colours
      // don't flicker back early.
      this.tweens.killTweensOf(plateFlash);
      plateFlash.setAlpha(0);
      this.tweens.add({ targets: plateFlash, alpha: 0.5, duration: 90, yoyo: true, repeat: 1 });
      factText.setColor('#b3261e');
      wrongResetTimer?.remove();
      wrongResetTimer = this.time.delayedCall(380, () => { if (factText.active) factText.setColor('#2c2336'); });
    };

    return c;
  }

  buildDocks(labels) {
    this.clearDocks();
    this.docks = labels.map((value, i) => {
      const cx = DOCK_MARGIN + DOCK_W / 2 + i * (DOCK_W + DOCK_GAP);
      const cont = this.add.container(cx, DOCK_Y).setDepth(5);

      const bg = this.add.graphics();
      this.paintDock(bg, COLORS.bgPanel, this.accent);
      cont.add(bg);

      const numText = this.add.text(0, 4, value.toString(), style('display', {
        fontSize: '72px', fill: '#ffffff'
      })).setOrigin(0.5);
      cont.add(numText);

      const hit = this.add.rectangle(0, 0, DOCK_W, DOCK_H, 0x000000, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.tweens.add({ targets: cont, scaleX: 1.04, scaleY: 1.04, duration: 100 }));
      hit.on('pointerout', () => this.tweens.add({ targets: cont, scaleX: 1, scaleY: 1, duration: 100 }));
      hit.on('pointerdown', () => this.commit(value, i));
      cont.add(hit);

      return { cont, bg, numText, hit, value, cx };
    });
  }

  paintDock(bg, fill, accent) {
    bg.clear();
    bg.fillStyle(0x000000, 0.4);
    bg.fillRoundedRect(-DOCK_W / 2 + 3, -DOCK_H / 2 + 6, DOCK_W, DOCK_H, 22);
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-DOCK_W / 2, -DOCK_H / 2, DOCK_W, DOCK_H, 22);
    // Open-bin lip.
    bg.fillStyle(accent, 0.22);
    bg.fillRoundedRect(-DOCK_W / 2, -DOCK_H / 2, DOCK_W, 42, { tl: 22, tr: 22, bl: 4, br: 4 });
    bg.lineStyle(4, accent, 0.85);
    bg.strokeRoundedRect(-DOCK_W / 2, -DOCK_H / 2, DOCK_W, DOCK_H, 22);
  }

  setDocksEnabled(enabled) {
    this.docks.forEach(d => {
      if (enabled) d.hit.setInteractive({ useHandCursor: true });
      else d.hit.disableInteractive();
    });
  }

  clearDocks() {
    this.docks.forEach(d => d.cont.destroy());
    this.docks = [];
  }

  rejectDock(i) {
    const d = this.docks[i];
    if (!d) return;
    this.paintDock(d.bg, COLORS.bgPanel, COLORS.error);
    this.tweens.add({
      targets: d.cont, x: d.cx - 14, duration: 60, yoyo: true, repeat: 3,
      onComplete: () => {
        // The dock can be cleared between rounds before this settles — guard
        // against touching a destroyed container.
        if (!d.cont?.active) return;
        d.cont.x = d.cx;
        this.paintDock(d.bg, COLORS.bgPanel, this.accent);
      }
    });
  }

  thunkDock(i, success) {
    const d = this.docks[i];
    if (!d) return;
    if (success) this.paintDock(d.bg, COLORS.bgPanel, COLORS.success);
    this.tweens.add({
      targets: d.cont, scaleX: 1.1, scaleY: 0.9, duration: 120, yoyo: true, ease: 'Quad.easeOut'
    });
  }

  // ── Production keypad (free-recall stamp pad) ──────────────────────────────

  buildKeypad() {
    const cont = this.add.container(0, 0).setDepth(5);
    this.keypad = { cont, buttons: [], enabled: false, entryText: null };

    // Recalled-answer readout, between the belt and the pad.
    const plateW = 520;
    const plateH = ENTRY_PLATE_H;
    const plate = this.add.graphics();
    plate.fillStyle(0x000000, 0.35);
    plate.fillRoundedRect(W / 2 - plateW / 2 + 2, ENTRY_Y - plateH / 2 + 4, plateW, plateH, 18);
    plate.fillStyle(COLORS.bgPanel, 0.96);
    plate.fillRoundedRect(W / 2 - plateW / 2, ENTRY_Y - plateH / 2, plateW, plateH, 18);
    plate.lineStyle(4, this.accent, 0.7);
    plate.strokeRoundedRect(W / 2 - plateW / 2, ENTRY_Y - plateH / 2, plateW, plateH, 18);
    cont.add(plate);
    this.keypad.entryText = this.add.text(W / 2, ENTRY_Y, '= –', style('display', {
      fontSize: '76px', fill: '#ffffff'
    })).setOrigin(0.5);
    cont.add(this.keypad.entryText);

    const layout = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['⌫', '0', '✓']
    ];
    layout.forEach((cols, row) => cols.forEach((label, col) => {
      const x = KEYPAD_COL0 + col * (KEYPAD_BTN_W + KEYPAD_GAP_X);
      const y = KEYPAD_TOP + row * (KEYPAD_BTN_H + KEYPAD_GAP_Y);
      const kind = label === '⌫' ? 'back' : label === '✓' ? 'submit' : 'digit';
      const accent = kind === 'submit' ? COLORS.success : kind === 'back' ? COLORS.warning : this.accent;
      const fill = kind === 'submit' ? COLORS.success : COLORS.bgPanel;

      const btn = this.add.container(x, y);
      const bg = this.add.graphics();
      this.paintKeypadButton(bg, fill, accent, kind === 'submit');
      btn.add(bg);
      btn.add(this.add.text(0, 0, label, style('display', {
        fontSize: '62px', fill: kind === 'submit' ? '#0a0a18' : '#ffffff'
      })).setOrigin(0.5));

      const hit = this.add.rectangle(0, 0, KEYPAD_BTN_W, KEYPAD_BTN_H, 0x000000, 0);
      btn.add(hit);
      hit.on('pointerover', () => this.tweens.add({ targets: btn, scaleX: 1.04, scaleY: 1.04, duration: 80 }));
      hit.on('pointerout', () => this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 80 }));
      hit.on('pointerdown', () => {
        if (kind === 'digit') this.pressDigit(label);
        else if (kind === 'back') this.pressBackspace();
        else this.submitProduction();
      });
      cont.add(btn);
      this.keypad.buttons.push({ btn, hit });
    }));

    this.setKeypadEnabled(false);
  }

  paintKeypadButton(bg, fill, accent, isSubmit) {
    bg.clear();
    bg.fillStyle(0x000000, 0.35);
    bg.fillRoundedRect(-KEYPAD_BTN_W / 2 + 2, -KEYPAD_BTN_H / 2 + 4, KEYPAD_BTN_W, KEYPAD_BTN_H, 18);
    bg.fillStyle(fill, isSubmit ? 1 : 0.95);
    bg.fillRoundedRect(-KEYPAD_BTN_W / 2, -KEYPAD_BTN_H / 2, KEYPAD_BTN_W, KEYPAD_BTN_H, 18);
    bg.lineStyle(4, accent, 0.9);
    bg.strokeRoundedRect(-KEYPAD_BTN_W / 2, -KEYPAD_BTN_H / 2, KEYPAD_BTN_W, KEYPAD_BTN_H, 18);
  }

  setKeypadEnabled(enabled) {
    if (!this.keypad) return;
    this.keypad.enabled = enabled;
    this.keypad.buttons.forEach(b => {
      if (enabled) b.hit.setInteractive({ useHandCursor: true });
      else b.hit.disableInteractive();
    });
    this.keypad.cont.setAlpha(enabled ? 1 : 0.45);
  }

  pressDigit(d) {
    if (!this.acceptingInput || this.ended) return;
    if (this.entry.length >= MAX_ANSWER_DIGITS) return;
    this.entry += d;
    this.updateEntry();
    audio.playClick?.();
    // Auto-submit only at the universal max digit count (no more digits are
    // possible) — never at the answer's own length, which would leak it.
    if (this.entry.length >= MAX_ANSWER_DIGITS) this.submitProduction();
  }

  pressBackspace() {
    if (!this.acceptingInput || this.ended || !this.entry.length) return;
    this.entry = this.entry.slice(0, -1);
    this.updateEntry();
    audio.playClick?.();
  }

  submitProduction() {
    if (!this.acceptingInput || this.ended || !this.entry.length) return;
    this.commit(parseInt(this.entry, 10), null);
  }

  updateEntry() {
    if (!this.keypad?.entryText) return;
    this.keypad.entryText.setColor('#ffffff');
    this.keypad.entryText.setText('= ' + (this.entry.length ? this.entry : '–'));
  }

  flashEntryWrong() {
    if (!this.keypad?.entryText) return;
    this.keypad.entryText.setColor('#ff6b6b');
    this.keypad.entryText.setText('= ✗');
    this.time.delayedCall(360, () => {
      if (!this.ended) this.updateEntry();
    });
  }

  shakeCrate() {
    if (!this.crate) return;
    // Restart the wobble cleanly from the parked pose. A parked crate always sits
    // at ACTIVE_X with angle 0 (the bob tween owns Y), so a rapid second wrong
    // answer can't stack offset shakes: stop ONLY the prior shake's own x/angle
    // tweens (never the bob), snap back to center, then re-wobble. The correct and
    // timeout paths still recover via their own killTweensOf + angle reset.
    this.shakeTweenX?.stop();
    this.shakeTweenAngle?.stop();
    this.crate.x = ACTIVE_X;
    this.crate.angle = 0;
    this.shakeTweenX = this.tweens.add({
      targets: this.crate, x: ACTIVE_X - 18, duration: 50, yoyo: true, repeat: 3,
      onComplete: () => { if (this.crate && this.acceptingInput) this.crate.x = ACTIVE_X; }
    });
    this.shakeTweenAngle = this.tweens.add({
      targets: this.crate, angle: { from: -5, to: 5 }, duration: 66, yoyo: true, repeat: 2,
      onComplete: () => { if (this.crate && this.acceptingInput) this.crate.angle = 0; }
    });
  }

  // ── Shared answer-feedback juice (both input modes call these) ──────────────

  // Green "shipped!" burst at a world point: an expanding ring + a scatter of
  // neutral 4-point sparkles. Content-safe (a ring and star sparkles — no
  // spirals/sigils). So a correct answer always lands with the same pop whether
  // the kid punched the keypad or tapped a dock.
  burstSuccess(x, y) {
    const ring = this.add.graphics().setDepth(9).setPosition(x, y);
    ring.lineStyle(10, COLORS.success, 0.9);
    ring.strokeCircle(0, 0, 50);
    this.tweens.add({
      targets: ring, scale: { from: 0.4, to: 2.6 }, alpha: { from: 0.9, to: 0 },
      duration: 460, ease: 'Quad.easeOut', onComplete: () => ring.destroy()
    });
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8 + 0.3;
      const dist = 110 + Math.random() * 70;
      const sg = this.add.graphics().setDepth(9).setPosition(x, y);
      drawSparkleIcon(sg, 0, 0, 14 + Math.random() * 8, [COLORS.success, COLORS.warning, 0xffffff][i % 3]);
      this.tweens.add({
        targets: sg, x: x + Math.cos(ang) * dist, y: y + Math.sin(ang) * dist,
        scale: { from: 1, to: 0 }, alpha: { from: 1, to: 0 },
        duration: 520 + Math.random() * 220, ease: 'Quad.easeOut', onComplete: () => sg.destroy()
      });
    }
  }

  // A small dust-puff "cough" under the crate on a wrong answer — muted, earthy,
  // deliberately un-celebratory so it never reads like success.
  burstReject(x, y) {
    for (let i = 0; i < 5; i++) {
      const p = this.add.circle(x + (Math.random() - 0.5) * 50, y + 70, 6 + Math.random() * 6, 0x6b5d4a, 0.7).setDepth(9);
      this.tweens.add({
        targets: p, y: p.y + 28 + Math.random() * 30, x: p.x + (Math.random() - 0.5) * 50,
        alpha: 0, scale: { from: 1, to: 0.4 }, duration: 420 + Math.random() * 200,
        ease: 'Quad.easeOut', onComplete: () => p.destroy()
      });
    }
  }

  // Bump the SHIPPED tally so a correct answer visibly ticks the hero counter.
  pulseShippedCounter() {
    if (!this.shippedText) return;
    this.tweens.killTweensOf(this.shippedText);
    this.shippedText.setScale(1);
    this.tweens.add({ targets: this.shippedText, scale: 1.32, duration: 130, yoyo: true, ease: 'Quad.easeOut' });
  }

  updateHud() {
    this.shippedText?.setText(this.shipped.toString());
    this.streakText?.setText(this.streak >= 2 ? `🔥${this.streak}` : '');
  }

  // ── Round end (mirrors GameScene's campaign endRound branch) ───────────────

  finishRound({ bossWin = false } = {}) {
    if (this.ended) return;
    this.ended = true;
    this.acceptingInput = false;
    this.crateTimer?.remove();
    this.roundTimer?.remove();
    this.bobTween?.stop();
    // Settle the belt pet to its rest pose so it doesn't keep bobbing behind the
    // summary panel (the summary draws its own celebratory pet).
    this.petTween?.stop();
    if (this.crate) this.tweens.killTweensOf(this.crate);
    // Settle the SHIPPED counter — a correct-answer pulse mid-flight could
    // otherwise freeze it scaled-up behind the summary panel.
    if (this.shippedText) { this.tweens.killTweensOf(this.shippedText); this.shippedText.setScale(1); }
    this.setDocksEnabled(false);
    if (this.keypad) this.setKeypadEnabled(false);
    audio.playRoundComplete?.();

    const accuracy = this.attempts > 0 ? Math.round((this.score / this.attempts) * 100) : 0;
    const remaining = this.roundEndsAt ? Math.max(0, this.roundEndsAt - this.time.now) : 0;
    const timeLeftRatio = this.duration > 0 ? remaining / (this.duration * 1000) : 0;

    // The order is filled iff bossWon, regardless of WHICH callback reached here
    // first: if the round clock fires finishRound() (bossWin defaults false)
    // during the quota crate's ship animation, the filled order must still score
    // as a win. bossWon is the source of truth.
    const isWin = bossWin || (this.isBoss && this.bossWon);

    // Boss = quota race: a WIN is the mastery demonstration (isRoundMastered),
    // stars reward how cleanly + quickly the order was filled. Practice = the
    // accuracy + volume gate, same primitive GameScene uses.
    let stars, mastered;
    if (this.isBoss) {
      stars = isWin ? this.calculateConveyorBossStars(accuracy, timeLeftRatio) : 0;
      mastered = isRoundMastered({ isBoss: true, bossWin: isWin, score: this.score, accuracy, scoreThreshold: this.scoreThreshold });
    } else {
      stars = calculateStars(this.score, accuracy, this.scoreThreshold);
      mastered = isRoundMastered({ isBoss: false, bossWin: false, score: this.score, accuracy, scoreThreshold: this.scoreThreshold });
    }

    const prevBestStars = progress.worldProgress[this.worldId]?.levelStars?.[this.currentLevel] || 0;
    const firstMastery = stars === 3 && prevBestStars < 3;

    const wasMastered = progress.isWorldMastered(this.worldId);
    progress.completeLevel(this.worldId, this.currentLevel, stars, mastered);

    // Stardust — identical reward tiers to GameScene.
    let baseBonus = 0;
    if (stars > 0) {
      baseBonus = stars === 3 ? 10 : stars === 2 ? 5 : 2;
      economy.addStardust(baseBonus);
      this.stardustEarned += baseBonus;
    }
    let masteryBonus = 0;
    if (firstMastery) {
      masteryBonus = 5;
      economy.addStardust(masteryBonus);
      this.stardustEarned += masteryBonus;
    }
    const dailyBonus = claimDailyBonusIfDue();
    this.stardustEarned += dailyBonus;

    records.recordLevelComplete(this.bestStreak);

    // Evolution can become eligible mid-round from lifetime-correct gates (the
    // Conveyor records the same factMastery the rest of the game does), so keep
    // the pet progressing here too.
    const evolvedTo = companion.checkEvolutionEligibility?.();

    const worldJustMastered = !wasMastered && progress.isWorldMastered(this.worldId);
    if (worldJustMastered) progress.setJustClearedWorld(this.worldId);

    // Chapter 3 grand finale (W38 The Great Lighthouse): the first boss win that
    // completes the world triggers the warm "homecoming" cinematic + credits
    // instead of the normal summary — mirroring how GameScene routes the W11/W28
    // finales. markFinale3Seen persists the flag EARLY (atomic) so a tab close
    // mid-credits can't strand it; replays fall through to the normal boss flow.
    if (isWin && progress.chapter3Enabled && isChapter3FinaleWorld(this.worldId)
        && progress.isWorldFullyCleared(this.worldId) && !progress.finale3Seen) {
      progress.markFinale3Seen();
      this.registry.set('currentWorldId', this.worldId);
      this.registry.set('creditsMode', 'homecoming');
      this.scene.start('CreditsScene');
      return;
    }

    const summaryArgs = { stars, accuracy, firstMastery, masteryBonus, dailyBonus, bossWin: isWin };

    const proceed = () => this.showSummary(summaryArgs);
    const afterEvolve = () => {
      if (evolvedTo) {
        import('../EvolutionCinematic.js')
          .then(({ playEvolutionCinematic }) => playEvolutionCinematic(this, evolvedTo, proceed))
          .catch(() => proceed());
      } else {
        proceed();
      }
    };

    // A boss WIN earns the Maker "big order complete" beat, then (if this run was
    // the one that mastered the whole world) the world-cleared banner, before the
    // summary. Everything else goes straight to the post-round flow.
    if (this.isBoss && isWin) {
      this.playOrderCompleteCinematic(() => {
        if (worldJustMastered) this.showWorldClearBanner(afterEvolve);
        else afterEvolve();
      });
    } else {
      afterEvolve();
    }
  }

  // Boss-win stars for the Conveyor. GameScene.calculateBossStars is damage-based
  // (ship HP), which Maker Space has no analog for — a filled order is already a
  // 100% quota, so stars grade how cleanly (accuracy) and how fast (time to
  // spare) the kid packed it.
  calculateConveyorBossStars(accuracy, timeLeftRatio) {
    if (accuracy >= 90 && timeLeftRatio >= 0.2) return 3;
    if (accuracy >= 75 || timeLeftRatio >= 0.15) return 2;
    return 1;
  }

  showSummary({ stars, accuracy, firstMastery, masteryBonus, dailyBonus, bossWin = false }) {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.7, duration: 350 });

    const panelW = 880;
    const panelH = 980;
    const panel = this.add.container(W / 2, H + panelH / 2).setDepth(60);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.98);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32);
    bg.lineStyle(3, this.accent, 0.9);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32);
    panel.add(bg);

    const title = this.isBoss
      ? (bossWin ? 'Big Order Shipped!' : 'Order Unfinished')
      : (stars > 0 ? 'Order Shipped!' : "Time's Up!");
    const modeLabel = this.isBoss ? 'RUSH ORDER' : (MODES[this.levelMode]?.label || 'Mixed').toUpperCase();
    panel.add(this.add.text(0, -panelH / 2 + 80, title, style('display', {
      fontSize: '60px'
    })).setOrigin(0.5));
    panel.add(this.add.text(0, -panelH / 2 + 145, `${this.world.name.toUpperCase()} · ${modeLabel}`, style('caption', {
      fill: '#cfcfe0', fontSize: '24px'
    })).setOrigin(0.5));

    // Stars.
    const starY = -panelH / 2 + 260;
    for (let i = 0; i < 3; i++) {
      const filled = i < stars;
      const g = this.add.graphics();
      drawStarIcon(g, 0, 0, 44, filled ? COLORS.warning : 0x4a4a5e, 0xffffff);
      g.x = -160 + i * 160;
      g.y = starY;
      g.setScale(0);
      panel.add(g);
      this.tweens.add({
        targets: g, scale: 1.2, duration: 250, delay: 600 + i * 180, ease: 'Back.easeOut',
        onStart: () => filled && audio.playStar?.()
      });
    }

    // Stats.
    const statY = starY + 220;
    const stat = (x, value, label, color) => {
      panel.add(this.add.text(x, statY, value, style('display', { fontSize: '74px', fill: color })).setOrigin(0.5));
      panel.add(this.add.text(x, statY + 58, label, style('caption')).setOrigin(0.5));
    };
    stat(-220, this.isBoss ? `${this.bossQuota}/${this.bossMaxQuota}` : this.shipped.toString(), this.isBoss ? 'ORDER' : 'SHIPPED', '#ffffff');
    stat(0, `${accuracy}%`, 'ACCURACY', '#' + this.accent.toString(16).padStart(6, '0'));
    stat(220, this.bestStreak.toString(), 'BEST STREAK', '#ff8b3d');

    // First-mastery banner.
    if (firstMastery) {
      const banner = this.add.container(0, -panelH / 2 + 30);
      const bg2 = this.add.graphics();
      bg2.fillStyle(COLORS.warning, 1);
      bg2.fillRoundedRect(-340, -34, 680, 68, 34);
      banner.add(bg2);
      banner.add(this.add.text(0, 0, 'FIRST MASTERY! +5 STARDUST', style('subhead', {
        fontSize: '26px', fill: '#1a1208', fontStyle: '900'
      })).setOrigin(0.5));
      panel.add(banner);
      this.tweens.add({ targets: banner, scale: { from: 0.6, to: 1 }, duration: 320, ease: 'Back.easeOut' });
    }

    // Stardust chip.
    if (this.stardustEarned > 0) {
      const chip = this.add.container(0, statY + 150);
      const cg = this.add.graphics();
      cg.fillStyle(COLORS.bgTrack, 1);
      cg.fillRoundedRect(-200, -40, 400, 80, 40);
      cg.lineStyle(2, COLORS.accentPurple, 0.85);
      cg.strokeRoundedRect(-200, -40, 400, 80, 40);
      chip.add(cg);
      const icon = this.add.graphics();
      drawSparkleIcon(icon, -120, 0, 22, COLORS.accentPurple);
      chip.add(icon);
      chip.add(this.add.text(20, 0, `+${this.stardustEarned} STARDUST`, style('subhead', {
        fontSize: '34px', fill: '#ffffff', fontStyle: '900', stroke: '#0a0a18', strokeThickness: 3
      })).setOrigin(0.5));
      panel.add(chip);
    }

    // Summary pet.
    if (companion.hasStarter?.()) {
      const pet = drawCompanion(this, 300, -250, { scale: 1.4 });
      pet.setScale(0);
      panel.add(pet);
      this.tweens.add({
        targets: pet, scale: 1.4, duration: 320, delay: 500, ease: 'Back.easeOut',
        onComplete: () => pet.bounceHappy?.()
      });
    }

    // Between rounds, peek at the Mastery Garden — the persistent bloom display
    // of which facts are now automatic (and which have gone rusty).
    const gardenY = panelH / 2 - 224;
    panel.add(createButton(this, {
      x: 0, y: gardenY, label: '🌱  Mastery Garden', width: 600, height: 84,
      color: 0x2f6e3a, onClick: () => this.showMasteryWall()
    }));

    const btnY = panelH / 2 - 110;
    panel.add(createButton(this, {
      x: -160, y: btnY, label: 'Retry', width: 280, height: 92,
      color: 0x4a4a6a, onClick: () => this.scene.restart()
    }));
    panel.add(createButton(this, {
      x: 160, y: btnY, label: 'Continue', width: 280, height: 92,
      color: this.accent, onClick: () => this.exitToMap()
    }));

    this.tweens.add({ targets: panel, y: H / 2, duration: 500, ease: 'Back.easeOut' });
  }

  // The Mastery Garden as a between-rounds overlay (above the summary).
  showMasteryWall() {
    audio.playClick?.();
    const root = this.add.container(0, 0).setDepth(70);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setInteractive();
    root.add(dim);
    this.tweens.add({ targets: dim, fillAlpha: 0.8, duration: 220 });

    // Fade in at full scale (no scale-pop): the Done button below is positioned
    // against the wall's full panelH, so a scaling wall would make it snap.
    const wall = drawMasteryWall(this, W / 2, H / 2 - 50, { cell: 46, accent: this.accent });
    wall.setAlpha(0);
    root.add(wall);
    this.tweens.add({ targets: wall, alpha: 1, duration: 240, ease: 'Quad.easeOut' });

    const closeY = H / 2 - 50 + wall.panelH / 2 + 70;
    root.add(createButton(this, {
      x: W / 2, y: closeY, label: 'Done', width: 280, height: 88,
      color: this.accent, onClick: () => {
        this.tweens.add({ targets: root, alpha: 0, duration: 180, onComplete: () => root.destroy() });
      }
    }));
    // Tapping the dim backdrop also closes.
    dim.on('pointerdown', () => {
      this.tweens.add({ targets: root, alpha: 0, duration: 180, onComplete: () => root.destroy() });
    });
  }

  exitToMap() {
    // A just-mastered world auto-advances on the map; otherwise back to the grid.
    if (progress.justClearedWorld) {
      this.scene.start('WorldMapScene');
    } else {
      this.scene.start('LevelSelectScene');
    }
  }

  // Abandon the round and leave — write NO progress. The fade keeps the scene
  // alive ~400ms, so we must end the round + tear timers down NOW; otherwise the
  // round clock could fire finishRound() mid-fade and silently bank progress.
  abandonRound(sceneKey) {
    if (this.ended) return;
    this.ended = true;
    this.acceptingInput = false;
    this.teardown();
    new TransitionManager(this).fadeToScene(sceneKey);
  }

  // ── Boss "Rush Order" framing (Maker-native; NOT the GameScene monster intro) ──

  // Calm "a big order just came in" card. No monster, no red flash — a warm
  // brief that sets the quota + clock, then rolls the belt. Tap to skip.
  playRushOrderIntro(onDone) {
    const root = this.add.container(0, 0).setDepth(80);
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x1a1208, 0).setInteractive();
    root.add(overlay);
    this.tweens.add({ targets: overlay, fillAlpha: 0.84, duration: 260 });

    const card = this.add.container(W / 2, H / 2 - 60);
    card.setScale(0.6);
    card.setAlpha(0);
    root.add(card);

    // A neat stack of crates (plain rounded squares — no symbols).
    const stack = this.add.graphics();
    const cs = 64;
    const place = [[-cs, 20], [cs, 20], [0, -44]];
    place.forEach(([dx, dy]) => {
      stack.fillStyle(Phaser.Display.Color.ValueToColor(this.world.color).lighten(8).color, 1);
      stack.fillRoundedRect(dx - cs / 2, dy - cs / 2 - 130, cs, cs, 10);
      stack.lineStyle(5, Phaser.Display.Color.ValueToColor(this.world.color).darken(28).color, 1);
      stack.strokeRoundedRect(dx - cs / 2, dy - cs / 2 - 130, cs, cs, 10);
    });
    card.add(stack);

    card.add(this.add.text(0, 10, 'BIG ORDER INCOMING', style('display', {
      fontSize: '64px', fill: '#ffb142', fontStyle: '900'
    })).setOrigin(0.5));
    card.add(this.add.text(0, 90, this.world.name, style('subhead', {
      fontSize: '40px', fill: '#' + this.accent.toString(16).padStart(6, '0')
    })).setOrigin(0.5));
    card.add(this.add.text(0, 168, `Pack ${this.bossMaxQuota} crates before the truck leaves!`, style('body', {
      fontSize: '32px', fill: '#e8e8f0', align: 'center', wordWrap: { width: W - 220 }
    })).setOrigin(0.5));

    this.tweens.add({ targets: card, scale: 1, alpha: 1, duration: 320, ease: 'Back.easeOut' });
    audio.playRoundComplete?.();

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      this.tweens.add({
        targets: root, alpha: 0, duration: 240,
        onComplete: () => { root.destroy(); if (typeof onDone === 'function') onDone(); }
      });
    };
    const t = this.time.delayedCall(2100, finish);
    overlay.on('pointerdown', () => { t.remove(); finish(); });
  }

  // Warm "order out the door" beat on a boss WIN (replaces the GameScene shatter
  // cinematic — nothing is destroyed; the order simply ships). Tap to skip.
  playOrderCompleteCinematic(onDone) {
    const root = this.add.container(0, 0).setDepth(80);
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x0c2a14, 0).setInteractive();
    root.add(overlay);
    this.tweens.add({ targets: overlay, fillAlpha: 0.6, duration: 220 });

    const txt = this.add.text(W / 2, H / 2 - 40, 'BIG ORDER\nSHIPPED!', style('display', {
      fontSize: '88px', fill: '#58d68d', align: 'center', fontStyle: '900', stroke: '#07120a', strokeThickness: 6
    })).setOrigin(0.5);
    txt.setScale(0);
    root.add(txt);
    this.tweens.add({ targets: txt, scale: 1, duration: 380, ease: 'Back.easeOut' });

    // A scatter of neutral sparkles (4-point) — celebratory, no spirals/sigils.
    for (let i = 0; i < 14; i++) {
      const sg = this.add.graphics();
      const sx = W / 2 + (Math.random() - 0.5) * 760;
      const sy = H / 2 + (Math.random() - 0.5) * 520;
      drawSparkleIcon(sg, sx, sy, 14 + Math.random() * 12, [COLORS.success, COLORS.warning, 0xffffff][i % 3]);
      sg.setScale(0);
      root.add(sg);
      this.tweens.add({
        targets: sg, scale: 1, alpha: { from: 1, to: 0 },
        duration: 700 + Math.random() * 500, delay: 120 + Math.random() * 500, ease: 'Quad.easeOut'
      });
    }

    if (companion.hasStarter?.()) {
      const pet = drawCompanion(this, W / 2 + 320, H / 2 + 40, { scale: 1.4 }).setDepth(81);
      pet.setScale(0);
      root.add(pet);
      this.tweens.add({
        targets: pet, scale: 1.4, duration: 300, ease: 'Back.easeOut',
        onComplete: () => pet.bounceHappy?.()
      });
    }
    audio.playWorldClearFanfare?.();

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      this.tweens.add({
        targets: root, alpha: 0, duration: 260,
        onComplete: () => { root.destroy(); if (typeof onDone === 'function') onDone(); }
      });
    };
    const t = this.time.delayedCall(1700, finish);
    overlay.on('pointerdown', () => { t.remove(); finish(); });
  }

  // Slide-in "WORLD CLEARED" banner shown when the boss win masters the world.
  showWorldClearBanner(onComplete) {
    const bannerW = 960;
    const bannerH = 160;
    const banner = this.add.container(W / 2, -bannerH).setDepth(85);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.98);
    bg.fillRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 28);
    bg.lineStyle(4, this.accent, 0.9);
    bg.strokeRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 28);
    banner.add(bg);
    banner.add(this.add.text(0, -28, this.world.name.toUpperCase(), style('subhead', {
      fontSize: '30px', fill: '#cfcfe0'
    })).setOrigin(0.5));
    banner.add(this.add.text(0, 28, 'WORLD CLEARED!', style('display', {
      fontSize: '52px', fill: '#' + this.accent.toString(16).padStart(6, '0')
    })).setOrigin(0.5));

    let done = false;
    const finish = () => { if (done) return; done = true; if (typeof onComplete === 'function') onComplete(); };
    this.tweens.add({
      targets: banner, y: 240, duration: 420, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1600, () => {
          this.tweens.add({
            targets: banner, y: -bannerH, duration: 300, ease: 'Quad.easeIn',
            onComplete: () => { banner.destroy(); finish(); }
          });
        });
      }
    });
  }

  teardown() {
    this.crateTimer?.remove();
    this.roundTimer?.remove();
    this.bobTween?.stop();
    this.arrivalTween?.stop();
    this.petTween?.stop();
  }
}
