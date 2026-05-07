import Phaser from 'phaser';
import { audio } from '../AudioManager.js';
import {
  WORLDS,
  MODES,
  BOSS_CONFIG,
  getProblemForWorld,
  getDistractors,
  getProblemSecondsForWorldAndMode,
  getAsteroidCountForWorld,
  getBossHpForWorld,
  progress
} from '../GameData.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { getWorldBackground } from '../WorldBackgrounds.js';
import { createButton, createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { companion, drawCompanion } from '../CompanionManager.js';
import { drawShip } from '../ShipRenderer.js';
import { economy, claimDailyBonusIfDue } from '../EconomyManager.js';
import { records } from '../RecordsManager.js';
import {
  drawFlameIcon, drawStarIcon, drawHourglassIcon,
  drawHeartIcon, drawSkullIcon, drawSoundIcon, drawArrowLeftIcon,
  drawSparkleIcon
} from '../StatIcons.js';
import { cosmetics } from '../CosmeticManager.js';
import { drawQuestionBody, drawBossBody as drawWorldBoss } from '../QuestionObjectArt.js';
import { applyBossTwist, bossTwistOn } from '../BossMechanics.js';
import { darken, lighten } from '../colorUtils.js';
import { COLORS } from '../colorPalette.js';
import { createTopBar, drawTimeBar } from '../GameTopBar.js';

const W = 1080;
const H = 1920;

const SHIP_HP_MAX = 5;

// New layout (1080×1920):
//   0–340  : top bar (two rows of stats + HP + time bar)
//   340–1500: asteroid play area
//   1300   : ship Y (with pet in cockpit)
//   1450–1900: answer button area
const TOP_BAR_H = 340;
const ASTEROID_TOP_Y = TOP_BAR_H + 60;
const ASTEROID_IMPACT_Y = 1240;
const SHIP_Y = 1370;
const ASTEROID_RADIUS = 110;

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    this.worldId = this.registry.get('currentWorldId') || 1;
    this.currentLevel = this.registry.get('currentLevel') || 1;
    this.mode = this.registry.get('levelMode') || 'mult';
    this.world = WORLDS[this.worldId - 1];
    this.isBoss = this.mode === 'boss';
    this.bossMaxHp = getBossHpForWorld(this.worldId);

    this.modeConfig = this.isBoss
      ? { label: this.world.villain || 'Boss', symbol: 'skull', duration: 90, scoreThreshold: this.bossMaxHp }
      : MODES[this.mode];

    this.duration = this.modeConfig.duration;
    this.scoreThreshold = this.modeConfig.scoreThreshold;
    this.timeLeft = this.duration * 1000;
    this.problemSeconds = getProblemSecondsForWorldAndMode(this.worldId, this.mode);

    this.score = 0;
    this.attempts = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.stardustEarned = 0;
    this.history = [];
    this.problemStartedAtMs = 0;

    this.shipHp = SHIP_HP_MAX;
    this.asteroidSlots = this.isBoss ? 1 : getAsteroidCountForWorld(this.worldId);

    this.bossHp = this.bossMaxHp;
    this.bossDefeated = false;

    this.activeAsteroids = [];
    this.targetedAsteroid = null;

    this.state = 'ready';
  }

  create() {
    audio.init();
    const wb = getWorldBackground(this.worldId);
    createStarfield(this, {
      width: W, height: H,
      bgTopColor: wb.bgTop,
      bgBottomColor: wb.bgBottom,
      accentColor: this.world.accentColor,
      accentStrength: 0.18
    });

    createTopBar(this, TOP_BAR_H);
    this.createPlayArea();
    this.createMcButtons();

    this._onKeyDown = this.onKeyDown.bind(this);
    this.input.keyboard?.on('keydown', this._onKeyDown);
    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown', this._onKeyDown);
    });

    new TransitionManager(this).fadeIn(280);

    if (this.isBoss) {
      this.state = 'intro';
      applyBossTwist(this, this.world.id);
      import('../BossIntro.js').then(({ playBossIntro }) => {
        playBossIntro(this, this.world.id, () => {
          if (!this.scene.isActive()) return;
          audio.playBossRumble?.();
          this.cameras.main.flash(280, 90, 0, 0);
          this.cameras.main.shake(420, 0.008);
          this.spawnAsteroid();
          this.time.delayedCall(700, () => { this.state = 'playing'; });
        });
      });
    } else {
      for (let i = 0; i < this.asteroidSlots; i++) {
        this.time.delayedCall(i * 600, () => {
          if (this.state === 'failed' || this.state === 'ended') return;
          this.spawnAsteroid();
        });
      }
      this.time.delayedCall(450, () => { this.state = 'playing'; });
    }
  }

  setHp(newHp) {
    this.shipHp = Math.max(0, newHp);
    this.hpIcons.forEach((icon, i) => {
      const filled = i < this.shipHp;
      if (icon.fullColor !== filled) {
        icon.fullColor = filled;
        icon.heart.clear();
        drawHeartIcon(icon.heart, 0, 0, 28, filled);
        if (!filled) {
          this.tweens.add({
            targets: icon,
            scale: { from: 1.5, to: 1 },
            duration: 250,
            ease: 'Back.easeOut'
          });
        }
      }
    });
  }

  formatTime(ms) {
    const totalS = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(totalS / 60);
    const s = totalS % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ============================================================
  // PLAY AREA — ship at bottom, asteroids drifting in
  // ============================================================
  createPlayArea() {
    // Per-world horizon silhouette behind asteroids/ship.
    const wb = getWorldBackground(this.worldId);
    wb.drawHorizon(this, { width: W, y: ASTEROID_IMPACT_Y + 24, world: this.world });

    this.shipContainer = this.add.container(W / 2, SHIP_Y).setDepth(8);
    const shipG = drawShip(this, 0, 0, {
      scale: 1.8,
      parts: progress.ship?.parts
    });
    this.shipContainer.add(shipG);

    // Pet rides INSIDE the cockpit porthole at ~2× current scale
    if (companion.hasStarter()) {
      const pc = shipG.portholeCenter;
      this.cockpitPet = drawCompanion(this, pc.x, pc.y, { scale: 0.7 });
      shipG.add(this.cockpitPet);
    }

    this.tweens.add({
      targets: this.shipContainer,
      y: SHIP_Y - 8,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // ============================================================
  // ASTEROIDS
  // ============================================================
  spawnAsteroid() {
    if (this.state === 'ended' || this.state === 'failed') return;
    if (this.bossDefeated) return;
    if (this.activeAsteroids.length >= this.asteroidSlots) return;

    const problem = getProblemForWorld(this.worldId, this.mode);

    let xLane;
    let slotIdx = null;
    if (this.asteroidSlots === 1) {
      xLane = W / 2 + Phaser.Math.Between(-60, 60);
    } else {
      const used = this.activeAsteroids.map(a => a.slotIdx);
      const positions = this.asteroidSlots === 2 ? [W * 0.32, W * 0.68] : [W * 0.22, W * 0.5, W * 0.78];
      for (let i = 0; i < positions.length; i++) {
        if (!used.includes(i)) { slotIdx = i; break; }
      }
      if (slotIdx === null) slotIdx = 0;
      xLane = positions[slotIdx];
    }

    const container = this.add.container(xLane, ASTEROID_TOP_Y).setDepth(7);

    if (this.isBoss) {
      this.drawBossBody(container);
    } else {
      this.drawAsteroidBody(container);
    }

    const text = this.add.text(0, 0, problem.display, style('display', {
      fontSize: this.isBoss ? '92px' : '70px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 7
    })).setOrigin(0.5);
    container.add(text);

    this.tweens.add({
      targets: container,
      angle: this.isBoss ? Phaser.Math.Between(-3, 3) : Phaser.Math.Between(-6, 6),
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const variation = this.asteroidSlots > 1 ? Phaser.Math.FloatBetween(0.85, 1.15) : 1;
    const fallSeconds = this.problemSeconds * variation;

    const asteroid = {
      container,
      text,
      problem,
      slotIdx,
      lockedOut: false,
      fallTween: null,
      startedAtMs: performance.now(),
      isBoss: this.isBoss
    };

    asteroid.fallTween = this.tweens.add({
      targets: container,
      y: this.isBoss ? ASTEROID_IMPACT_Y - 80 : ASTEROID_IMPACT_Y,
      duration: fallSeconds * 1000,
      ease: 'Linear',
      onComplete: () => this.onAsteroidImpact(asteroid)
    });

    if (this.isBoss) {
      this.attachBossHpBar(container);
      bossTwistOn(this, 'onSpawn', asteroid);
    }

    this.activeAsteroids.push(asteroid);

    if (this.asteroidSlots > 1) {
      const hit = this.add.rectangle(0, 0, 280, 280, 0x000000, 0).setInteractive({ useHandCursor: true });
      container.add(hit);
      hit.on('pointerdown', () => this.targetAsteroid(asteroid));
    }

    if (!this.targetedAsteroid) {
      this.targetAsteroid(asteroid);
    }
  }

  drawBossBody(container) {
    const g = this.add.graphics();
    const radius = ASTEROID_RADIUS * BOSS_CONFIG.asteroidScale;
    drawWorldBoss(g, this.world.id, this.world.accentColor, radius);
    container.add(g);
  }

  attachBossHpBar(bossContainer) {
    const bar = this.add.container(bossContainer.x, bossContainer.y - ASTEROID_RADIUS * BOSS_CONFIG.asteroidScale - 70)
      .setDepth(8);
    const w = 520;
    const h = 38;
    const radius = h / 2;

    // Soft drop shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-w / 2 + 1, -h / 2 + 5, w, h, radius);
    bar.add(shadow);

    // Track with inset depth
    const track = this.add.graphics();
    track.fillStyle(0x1a0a18, 1);
    track.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
    track.fillStyle(COLORS.bgDark, 0.7);
    track.fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h * 0.32, {
      tl: radius - 2, tr: radius - 2, bl: 6, br: 6
    });
    track.lineStyle(2, 0xff8080, 0.85);
    track.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
    bar.add(track);

    const fill = this.add.graphics();
    bar.add(fill);
    bar.fillG = fill;
    bar.barW = w;
    bar.barH = h;
    bar.barRadius = radius;

    bar.add(this.add.text(0, -h / 2 - 28, (this.world.villain || 'BOSS').toUpperCase(), style('caption', {
      fontSize: '22px', fill: '#ff8080', fontStyle: '900'
    })).setOrigin(0.5));

    this.bossHpBar = bar;
    this.bossContainer = bossContainer;
    this.drawBossHp();
  }

  drawBossHp() {
    if (!this.bossHpBar) return;
    const { fillG, barW, barH, barRadius } = this.bossHpBar;
    fillG.clear();
    const pct = Math.max(0, this.bossHp / this.bossMaxHp);
    if (pct <= 0) return;
    const fillW = Math.max(barH, Math.floor(barW * pct));
    const color = pct > 0.5 ? COLORS.error : pct > 0.25 ? 0xffaa44 : 0xff3030;
    const lighten = Phaser.Display.Color.ValueToColor(color).lighten(35).color;
    const darken = Phaser.Display.Color.ValueToColor(color).darken(25).color;

    // Body
    fillG.fillStyle(color, 1);
    fillG.fillRoundedRect(-barW / 2, -barH / 2, Math.min(fillW, barW), barH, barRadius);
    // Bottom shadow band
    fillG.fillStyle(darken, 0.5);
    fillG.fillRoundedRect(-barW / 2, -barH / 2 + barH * 0.55, Math.min(fillW, barW), barH * 0.45, {
      tl: 0, tr: 0, bl: barRadius, br: barRadius
    });
    // Top gloss
    fillG.fillStyle(lighten, 0.55);
    fillG.fillRoundedRect(-barW / 2 + 4, -barH / 2 + 4, Math.max(0, Math.min(fillW, barW) - 8), barH * 0.38, {
      tl: barRadius - 2, tr: barRadius - 2, bl: 4, br: 4
    });
    // Quartile dividers — readable regardless of total HP.
    fillG.lineStyle(2, COLORS.bgDark, 0.55);
    for (let i = 1; i < 4; i++) {
      const x = -barW / 2 + (barW / 4) * i;
      if (x - (-barW / 2) <= fillW) {
        fillG.lineBetween(x, -barH / 2 + 4, x, barH / 2 - 4);
      }
    }
  }

  drawAsteroidBody(container) {
    const g = this.add.graphics();
    drawQuestionBody(g, this.world.id, ASTEROID_RADIUS);
    container.add(g);
  }

  targetAsteroid(asteroid) {
    if (!asteroid || !this.activeAsteroids.includes(asteroid)) return;
    this.targetedAsteroid = asteroid;
    this.problemStartedAtMs = asteroid.startedAtMs;
    this.refreshMcButtons(asteroid.problem);

    if (this.targetReticle) this.targetReticle.destroy();
    if (this.asteroidSlots > 1) {
      const reticle = this.add.graphics();
      reticle.lineStyle(4, this.world.accentColor, 0.9);
      reticle.strokeCircle(0, 0, 160);
      asteroid.container.add(reticle);
      this.targetReticle = reticle;
    }
  }

  // ============================================================
  // MC BUTTONS — 4 for normal, 6 for boss
  // ============================================================
  createMcButtons() {
    const buttonCount = this.isBoss ? BOSS_CONFIG.buttonCount : 4;
    const cols = this.isBoss ? 3 : 2;
    const rows = Math.ceil(buttonCount / cols);
    const cellW = this.isBoss ? 320 : 480;
    const cellH = this.isBoss ? 150 : 170;
    const gap = 24;
    const totalW = cols * cellW + (cols - 1) * gap;
    const totalH = rows * cellH + (rows - 1) * gap;
    const startX = (W - totalW) / 2 + cellW / 2;
    const startY = H - 60 - totalH;

    this.mcButtons = [];
    for (let i = 0; i < buttonCount; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = startX + c * (cellW + gap);
      const y = startY + r * (cellH + gap) + cellH / 2;
      this.mcButtons.push(this.makeMcButton(x, y, cellW, cellH, i));
    }
  }

  makeMcButton(x, y, w, h, index) {
    const c = this.add.container(x, y).setDepth(10);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-w / 2 + 2, -h / 2 + 8, w, h, 28);
    c.add(shadow);

    const bg = this.add.graphics();
    c.add(bg);

    const label = this.add.text(0, 0, '', style('display', {
      fontSize: '72px',
      fill: '#ffffff'
    })).setOrigin(0.5);
    c.add(label);

    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerover', () => {
      this.tweens.add({ targets: c, scale: 1.04, duration: 110 });
    });
    hit.on('pointerout', () => {
      this.tweens.add({ targets: c, scale: 1, duration: 110 });
    });
    hit.on('pointerdown', () => {
      if (this.state !== 'playing') return;
      this.tweens.add({ targets: c, scaleX: 0.94, scaleY: 0.94, duration: 70, yoyo: true });
      this.handleMcChoice(index);
    });

    c.bg = bg;
    c.label = label;
    c.dimensions = { w, h };
    c.value = null;
    this.drawMcFace(c, this.isBoss ? 0x3a1a2a : 0x2a2a44);
    return c;
  }

  drawMcFace(container, color) {
    const { w, h } = container.dimensions;
    const radius = 26;
    const lighter = lighten(color, 0.18);
    const darker = darken(color, 0.20);

    container.bg.clear();
    container.bg.fillStyle(darker, 1);
    container.bg.fillRoundedRect(-w / 2, -h / 2 + 4, w, h - 4, radius);
    container.bg.fillStyle(color, 1);
    container.bg.fillRoundedRect(-w / 2, -h / 2, w, h - 6, radius);
    container.bg.fillStyle(lighter, 0.45);
    container.bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 3, w - 8, (h - 6) / 2.4,
      { tl: radius - 2, tr: radius - 2, bl: 4, br: 4 });
    container.bg.lineStyle(2, 0x000000, 0.25);
    container.bg.strokeRoundedRect(-w / 2, -h / 2, w, h - 6, radius);
  }

  refreshMcButtons(problem) {
    const want = this.mcButtons.length;
    const distractors = getDistractors(problem, want - 1);
    const choices = [problem.answer, ...distractors].slice(0, want);
    while (choices.length < want) choices.push(problem.answer + choices.length);
    choices.sort((a, b) => a - b);

    this.mcButtons.forEach((btn, i) => {
      btn.value = choices[i];
      btn.label.setText(choices[i].toString());
      btn.label.setColor('#ffffff');
      this.drawMcFace(btn, this.isBoss ? 0x3a1a2a : 0x2a2a44);
      btn.setAlpha(1);
    });
  }

  flashMcButton(btn, color) {
    const { w, h } = btn.dimensions;
    const flash = this.add.graphics();
    flash.fillStyle(color, 0.7);
    flash.fillRoundedRect(-w / 2, -h / 2, w, h - 6, 26);
    btn.add(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 320,
      onComplete: () => flash.destroy()
    });
  }

  // ============================================================
  // INPUT
  // ============================================================
  onKeyDown(event) {
    if (this.state !== 'playing') return;
    const map = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5 };
    const idx = map[event.key];
    if (idx !== undefined && idx < this.mcButtons.length) {
      this.handleMcChoice(idx);
    }
  }

  handleMcChoice(index) {
    if (this.state !== 'playing') return;
    const btn = this.mcButtons[index];
    if (!btn || btn.value === null) return;
    const asteroid = this.targetedAsteroid;
    if (!asteroid) return;

    const correct = btn.value === asteroid.problem.answer;
    if (correct) {
      this.handleCorrect(asteroid, btn);
    } else {
      this.handleWrong(asteroid, btn);
    }
  }

  // ============================================================
  // ANSWER FLOW
  // ============================================================
  handleCorrect(asteroid, btn) {
    this.state = 'feedback';
    this.attempts++;
    const elapsed = performance.now() - asteroid.startedAtMs;
    this.history.push({ problem: asteroid.problem, userAnswer: btn.value, correct: true });
    progress.recordFactAttempt(asteroid.problem.a, asteroid.problem.b, true);
    records.recordAnswer(asteroid.problem, true, elapsed);

    this.score++;
    this.streak++;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
    this.scoreText.setText(this.score.toString());
    this.streakText.setText(this.streak.toString());

    this.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.4, to: 1 },
      duration: 220,
      ease: 'Back.easeOut'
    });

    this.flashMcButton(btn, COLORS.success);

    this.cockpitPet?.bounceHappy?.();
    companion.feed();
    if (this.streak === 3 || this.streak === 7 || this.streak % 10 === 0) {
      audio.playPetChirp?.();
      // Streak-triggered cosmetic animations
      for (const item of cosmetics.itemsWithTrigger('streak')) {
        const fn = this.cockpitPet?.[item.animation];
        if (typeof fn === 'function') fn();
      }
    }

    audio.playLaser?.();
    this.fireLaserAt(asteroid);

    if (asteroid.isBoss) {
      this.bossHp = Math.max(0, this.bossHp - 1);
      this.drawBossHp();
      audio.playBossImpact?.();
      this.recoilBoss(asteroid);
      bossTwistOn(this, 'onCorrect', asteroid);

      this.time.delayedCall(360, () => {
        if (this.state === 'failed' || this.state === 'ended') return;
        if (this.bossHp <= 0) {
          this.defeatBoss(asteroid);
        } else {
          this.cycleBossProblem(asteroid);
          this.state = 'playing';
        }
      });
      return;
    }

    this.time.delayedCall(220, () => {
      audio.playAsteroidBoom?.();
      this.explodeAsteroid(asteroid, { big: true });
      this.removeAsteroid(asteroid);
      this.time.delayedCall(180, () => {
        if (this.state === 'feedback' || this.state === 'playing') {
          this.state = 'playing';
          this.spawnAsteroid();
        }
      });
    });
  }

  // Wrong answer on a normal asteroid → instant impact (no retry on the same
  // asteroid). Boss problems instead cost ship HP and let the boss counter-attack.
  handleWrong(asteroid, btn) {
    const pickedValue = btn.value;
    this.flashMcButton(btn, COLORS.error);
    audio.playWrong?.();

    this.streak = 0;
    this.streakText.setText('0');

    if (asteroid.isBoss) {
      this.state = 'feedback';
      this.attempts++;
      this.history.push({ problem: asteroid.problem, userAnswer: pickedValue, correct: false });
      progress.recordFactAttempt(asteroid.problem.a, asteroid.problem.b, false);
      records.recordAnswer(asteroid.problem, false, performance.now() - asteroid.startedAtMs);

      this.bossMockLaugh(asteroid);
      this.damageShip();
      this.cockpitPet?.slumpSad?.();
      audio.playShipDamage?.();
      this.setHp(this.shipHp - 1);
      bossTwistOn(this, 'onWrong', asteroid, btn);
      if (this.shipHp <= 0) {
        this.failLevel();
        return;
      }
      const correctionProblem = asteroid.problem;
      this.time.delayedCall(700, () => {
        if (this.state === 'failed' || this.state === 'ended') return;
        this.showCorrectionFlash(correctionProblem, () => {
          if (this.state === 'failed' || this.state === 'ended') return;
          this.cycleBossProblem(asteroid);
        });
      });
      return;
    }

    // Normal level: instant crash on the targeted asteroid
    this.onAsteroidImpact(asteroid, { fromWrongAnswer: true, userAnswer: pickedValue });
  }

  onAsteroidImpact(asteroid, opts = {}) {
    if (this.state === 'ended' || this.state === 'failed') return;
    if (asteroid.lockedOut) return;
    asteroid.lockedOut = true;

    this.attempts++;
    this.history.push({
      problem: asteroid.problem,
      userAnswer: opts.userAnswer ?? null,
      correct: false
    });
    progress.recordFactAttempt(asteroid.problem.a, asteroid.problem.b, false);
    records.recordAnswer(asteroid.problem, false, performance.now() - asteroid.startedAtMs);

    this.streak = 0;
    this.streakText.setText('0');

    this.damageShip();
    this.cockpitPet?.slumpSad?.();
    audio.playShipDamage?.();

    this.setHp(this.shipHp - 1);

    if (asteroid.isBoss) {
      asteroid.lockedOut = false;
      if (this.shipHp <= 0) {
        this.failLevel();
        return;
      }
      this.state = 'feedback';
      this.bossAttackBack(asteroid);
      const correctionProblem = asteroid.problem;
      this.time.delayedCall(220, () => {
        if (this.state === 'failed' || this.state === 'ended') return;
        this.showCorrectionFlash(correctionProblem, () => {
          if (this.state === 'failed' || this.state === 'ended') return;
          this.cycleBossProblem(asteroid);
        });
      });
      return;
    }

    // Stop the asteroid's fall and snap it to the ship (the "crash") for
    // a cleaner visual when the player tapped wrong well above the impact line.
    if (asteroid.fallTween) asteroid.fallTween.stop();
    if (asteroid.container?.active) {
      this.tweens.add({
        targets: asteroid.container,
        y: SHIP_Y - 80,
        duration: 220,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.explodeAsteroid(asteroid, { onShip: true });
          this.removeAsteroid(asteroid);
        }
      });
    } else {
      this.explodeAsteroid(asteroid, { onShip: true });
      this.removeAsteroid(asteroid);
    }

    if (this.shipHp <= 0) {
      this.failLevel();
      return;
    }

    const correctionProblem = asteroid.problem;
    this.time.delayedCall(450, () => {
      if (this.state !== 'playing' && this.state !== 'feedback') return;
      this.showCorrectionFlash(correctionProblem, () => {
        if (this.state !== 'playing' && this.state !== 'feedback') return;
        this.spawnAsteroid();
      });
    });
  }

  recoilBoss(asteroid) {
    if (!asteroid?.container?.active) return;
    if (asteroid.fallTween) asteroid.fallTween.stop();
    this.tweens.add({
      targets: asteroid.container,
      y: ASTEROID_TOP_Y - 30,
      duration: 280,
      ease: 'Quad.easeOut'
    });
    const flash = this.add.graphics();
    flash.fillStyle(0xffffff, 0.5);
    flash.fillCircle(0, 0, ASTEROID_RADIUS * BOSS_CONFIG.asteroidScale * 0.9);
    asteroid.container.add(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 320,
      onComplete: () => flash.destroy()
    });
  }

  bossAttackBack(asteroid) {
    if (!asteroid?.container?.active) return;
    const origY = asteroid.container.y;
    this.tweens.add({
      targets: asteroid.container,
      y: origY + 60,
      duration: 140,
      yoyo: true,
      ease: 'Quad.easeIn'
    });
  }

  // Wrong-answer reaction: boss does a bouncy "ha-ha" laugh in place while a
  // red vignette pulses. Halts the fall so cycleBossProblem can reset cleanly.
  bossMockLaugh(asteroid) {
    if (!asteroid?.container?.active) return;
    if (asteroid.fallTween) asteroid.fallTween.stop();

    const vignette = this.add.graphics().setDepth(50);
    vignette.fillStyle(0xff3b3b, 0.30);
    vignette.fillRect(0, 0, W, H);
    this.tweens.add({
      targets: vignette,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => vignette.destroy()
    });

    const c = asteroid.container;
    const baseScaleX = c.scaleX;
    const baseScaleY = c.scaleY;
    this.tweens.add({
      targets: c,
      scaleX: baseScaleX * 1.12,
      scaleY: baseScaleY * 1.12,
      duration: 180,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (!c.active) return;
        c.scaleX = baseScaleX;
        c.scaleY = baseScaleY;
      }
    });
    this.tweens.add({
      targets: c,
      rotation: { from: -0.12, to: 0.12 },
      duration: 180,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (!c.active) return;
        c.rotation = 0;
      }
    });
  }

  cycleBossProblem(asteroid) {
    if (!asteroid?.container?.active || this.bossDefeated) return;
    if (asteroid.fallTween) asteroid.fallTween.stop();

    const newProblem = getProblemForWorld(this.worldId, this.mode);
    asteroid.problem = newProblem;
    asteroid.startedAtMs = performance.now();
    asteroid.text?.setText(newProblem.display);

    asteroid.container.y = ASTEROID_TOP_Y;
    asteroid.fallTween = this.tweens.add({
      targets: asteroid.container,
      y: ASTEROID_IMPACT_Y - 80,
      duration: this.problemSeconds * 1000,
      ease: 'Linear',
      onComplete: () => this.onAsteroidImpact(asteroid)
    });

    this.refreshMcButtons(newProblem);
    this.problemStartedAtMs = asteroid.startedAtMs;
    bossTwistOn(this, 'onSpawn', asteroid);
  }

  // Pause-and-show overlay after a wrong answer or asteroid impact: displays
  // the full equation with the correct answer and waits for a tap before
  // calling onContinue. State flips to 'correction', which the timer/update
  // loop already treats as paused, and active asteroid falls are paused too
  // so a second slot can't crash mid-read.
  showCorrectionFlash(problem, onContinue) {
    if (!problem) { onContinue?.(); return; }
    this.state = 'correction';

    const pausedTweens = [];
    this.activeAsteroids.forEach(a => {
      if (a.fallTween && a.fallTween.isPlaying?.()) {
        a.fallTween.pause();
        pausedTweens.push(a.fallTween);
      }
    });

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0)
      .setDepth(65).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.72, duration: 220 });

    const cardW = 880;
    const cardH = 360;
    const card = this.add.container(W / 2, H / 2 - 40).setDepth(66);
    card.setAlpha(0);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.96);
    bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 32);
    bg.lineStyle(3, this.world.accentColor, 0.85);
    bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 32);
    card.add(bg);

    const equation = `${problem.display} = ${problem.answer}`;
    const eqText = this.add.text(0, -30, equation, style('display', {
      fontSize: '108px',
      fill: '#ffffff'
    })).setOrigin(0.5);
    card.add(eqText);

    const hint = this.add.text(0, cardH / 2 - 56, 'Tap to continue', style('caption', {
      fontSize: '28px',
      fill: '#cfcfe0'
    })).setOrigin(0.5);
    card.add(hint);

    this.tweens.add({
      targets: card,
      alpha: 1,
      y: H / 2 - 80,
      duration: 260,
      ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: hint,
      alpha: { from: 0.55, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      overlay.disableInteractive();
      audio.playClick?.();
      pausedTweens.forEach(t => t.resume?.());
      this.tweens.add({
        targets: [overlay, card],
        alpha: 0,
        duration: 160,
        onComplete: () => {
          overlay.destroy();
          card.destroy();
        }
      });
      this.state = 'playing';
      onContinue?.();
    };

    overlay.on('pointerdown', dismiss);
  }

  defeatBoss(asteroid) {
    this.bossDefeated = true;
    this.state = 'feedback';
    if (asteroid.fallTween) asteroid.fallTween.stop();
    this.tweens.killTweensOf(asteroid.container);

    this.playBossDefeatCeremony(asteroid, () => {
      this.endRound({ bossWin: true });
    });
  }

  // Multi-stage boss defeat ceremony (~2s blocking before endRound).
  // Sequence: white flash → cascading bursts → pet dance overlay → final blast.
  playBossDefeatCeremony(asteroid, onComplete) {
    const x = asteroid.container.x;
    const y = asteroid.container.y;
    const bossRadius = ASTEROID_RADIUS * BOSS_CONFIG.asteroidScale;

    const whiteOverlay = this.add.graphics().setDepth(8);
    whiteOverlay.fillStyle(0xffffff, 1);
    whiteOverlay.fillCircle(0, 0, bossRadius * 1.15);
    whiteOverlay.alpha = 0;
    asteroid.container.add(whiteOverlay);
    this.tweens.add({
      targets: whiteOverlay,
      alpha: { from: 0, to: 0.85 },
      duration: 75,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => whiteOverlay.destroy()
    });
    audio.playBossImpact?.();

    const burstCount = 4;
    for (let i = 0; i < burstCount; i++) {
      const delay = 220 + i * 200;
      this.time.delayedCall(delay, () => {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * bossRadius * 0.55;
        this.explodeAsteroid({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r });
        audio.playAsteroidBoom?.();
      });
    }

    this.time.delayedCall(1080, () => this.playPetVictoryDance());

    this.time.delayedCall(1200, () => {
      this.bossFinalBlast(x, y);
      if (asteroid.container?.active) asteroid.container.destroy();
      if (this.bossHpBar?.active) this.bossHpBar.destroy();
      this.bossContainer = null;
      this.bossHpBar = null;
    });

    this.time.delayedCall(2000, () => onComplete?.());
  }

  // Final huge blast: layers extra ring, shards, and screen flash on top of
  // a normal explodeAsteroid for the world-clear hit.
  bossFinalBlast(x, y) {
    this.explodeAsteroid({ x, y }, { big: true });

    const ring = this.add.graphics().setDepth(9);
    ring.lineStyle(14, 0xffffff, 1);
    ring.strokeCircle(0, 0, 80);
    ring.x = x;
    ring.y = y;
    this.tweens.add({
      targets: ring,
      scale: 7,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });

    const colors = [this.world.accentColor, 0xffffff, 0xf7dc6f, 0xff8b3d];
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 220 + Math.random() * 200;
      const shard = this.add.graphics().setDepth(9);
      shard.fillStyle(colors[i % colors.length], 1);
      shard.fillCircle(0, 0, 8 + Math.random() * 8);
      shard.x = x;
      shard.y = y;
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 800 + Math.random() * 320,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    }

    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(100);
    this.tweens.add({
      targets: flash,
      alpha: { from: 0, to: 0.4 },
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });

    this.cameras.main.shake(520, 0.026);
    audio.playAsteroidBoom?.();
    audio.playWorldClearFanfare?.();
  }

  // Pet pops out of the cockpit, bounces 3x with a tinted halo, retreats.
  // Shared animation across all species; tinted by species accent.
  playPetVictoryDance() {
    if (!this.shipContainer || !companion.hasStarter()) return;
    const sp = companion.getSpecies();
    const accent = sp ? sp.accent : COLORS.accentPurple;

    const portholeX = this.shipContainer.x + (this.shipContainer.portholeCenter?.x || 0);
    const portholeY = this.shipContainer.y + (this.shipContainer.portholeCenter?.y || -120);
    const petY = portholeY - 120;

    const halo = this.add.graphics().setDepth(11);
    halo.fillStyle(accent, 1);
    halo.fillCircle(0, 0, 90);
    halo.x = portholeX;
    halo.y = petY;
    halo.setScale(0.3);
    halo.alpha = 0;
    this.tweens.add({
      targets: halo,
      scale: 1.7,
      alpha: { from: 0.7, to: 0 },
      duration: 1100,
      ease: 'Quad.easeOut',
      onComplete: () => halo.destroy()
    });

    // Hide the cockpit pet so the dance pet reads as the same animal popping out.
    this.cockpitPet?.setVisible(false);

    const pet = drawCompanion(this, portholeX, petY, { scale: 1.4 }).setDepth(12);
    pet.setScale(0);

    this.tweens.add({
      targets: pet,
      scale: 1.4,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        let n = 0;
        const bounce = () => {
          if (n >= 3) {
            this.tweens.add({
              targets: pet,
              scale: 0,
              y: portholeY,
              duration: 200,
              ease: 'Back.easeIn',
              onComplete: () => {
                this.cockpitPet?.setVisible(true);
                pet.destroy();
              }
            });
            return;
          }
          n++;
          pet.bounceHappy?.();
          this.tweens.add({
            targets: pet,
            y: { from: petY, to: petY - 32 },
            duration: 250,
            yoyo: true,
            ease: 'Sine.easeInOut',
            onComplete: bounce
          });
        };
        bounce();
      }
    });
  }

  // Auto-dismissing world-clear banner: slides down from top, sits 2.5s, slides out.
  // Calls onComplete when fully dismissed.
  showWorldClearBanner(onComplete) {
    const bannerW = 960;
    const bannerH = 140;
    const accent = this.world.accentColor;
    const startY = -bannerH / 2 - 20;
    const restY = 200;

    const banner = this.add.container(W / 2, startY).setDepth(70);

    const bg = this.add.graphics();
    bg.fillStyle(accent, 0.95);
    bg.fillRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 24);
    bg.lineStyle(4, 0x0a0a1a, 1);
    bg.strokeRoundedRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 24);
    banner.add(bg);

    banner.add(this.add.text(0, 0, `${this.world.name.toUpperCase()} CLEARED!`, style('display', {
      fontSize: '54px',
      fill: '#ffffff',
      stroke: '#0a0a1a',
      strokeThickness: 5,
      fontStyle: '900'
    })).setOrigin(0.5));

    this.tweens.add({
      targets: banner,
      y: restY,
      duration: 350,
      ease: 'Back.easeOut'
    });

    // Triple-burst chord matches the first-mastery banner pattern in showSummary.
    audio.playStar?.();
    this.time.delayedCall(180, () => audio.playStar?.());
    this.time.delayedCall(360, () => audio.playStar?.());

    this.time.delayedCall(350 + 2500, () => {
      this.tweens.add({
        targets: banner,
        y: startY,
        duration: 350,
        ease: 'Back.easeIn',
        onComplete: () => {
          banner.destroy();
          onComplete?.();
        }
      });
    });
  }

  fireLaserAt(asteroid) {
    if (!asteroid?.container?.active) return;
    const startX = this.shipContainer.x;
    const startY = this.shipContainer.y - 60;
    const targetX = asteroid.container.x;
    const targetY = asteroid.container.y;

    const laser = this.add.graphics().setDepth(9);
    laser.lineStyle(10, 0x81ecec, 1);
    laser.lineBetween(startX, startY, targetX, targetY);
    laser.lineStyle(4, 0xffffff, 1);
    laser.lineBetween(startX, startY, targetX, targetY);
    this.tweens.add({
      targets: laser,
      alpha: 0,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => laser.destroy()
    });

    this.tweens.add({
      targets: this.shipContainer,
      y: SHIP_Y - 24,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  }

  explodeAsteroid(asteroid, opts = {}) {
    let x, y;
    if (asteroid?.container?.active) {
      x = asteroid.container.x;
      y = asteroid.container.y;
    } else if (typeof asteroid?.x === 'number') {
      x = asteroid.x;
      y = asteroid.y;
    } else {
      return;
    }

    const big = !!opts.big;
    const colors = opts.onShip
      ? [0xff6b6b, 0xff8b3d, 0xffd86b]
      : big
        ? [this.world.accentColor, 0xffffff, 0xf7dc6f, 0xff8b3d]
        : [0xf7dc6f, 0xff8b3d, 0xffffff];

    const shardCount = big ? 18 : 14;
    const distMin   = big ? 90 : 80;
    const distSpan  = big ? 110 : 100;
    const sizeMin   = big ? 4  : 5;
    const sizeSpan  = big ? 8  : 5;
    const durMin    = big ? 600 : 500;
    const durSpan   = big ? 240 : 200;

    for (let i = 0; i < shardCount; i++) {
      const angle = (i / shardCount) * Math.PI * 2 + Math.random() * 0.4;
      const dist = distMin + Math.random() * distSpan;
      const shard = this.add.graphics().setDepth(9);
      shard.fillStyle(colors[i % colors.length], 1);
      shard.fillCircle(0, 0, sizeMin + Math.random() * sizeSpan);
      shard.x = x;
      shard.y = y;
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: durMin + Math.random() * durSpan,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    }

    const ringRadius = big ? 50 : 40;
    const ring = this.add.graphics().setDepth(9);
    ring.lineStyle(big ? 9 : 7, 0xffffff, 1);
    ring.strokeCircle(0, 0, ringRadius);
    ring.x = x;
    ring.y = y;
    this.tweens.add({
      targets: ring,
      scale: big ? 5 : 4,
      alpha: 0,
      duration: big ? 450 : 380,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });

    if (!big) return;

    // Debris chunks: small polygonal shards with rotation + gravity-ish fall.
    const debrisColor = darken(this.world.color, 0.15);
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed * 0.6 - 60; // bias upward initially
      const size = 14 + Math.random() * 10;
      const chunk = this.add.graphics().setDepth(9);
      chunk.fillStyle(debrisColor, 1);
      // Quad shaped like an irregular shard
      const half = size / 2;
      chunk.fillTriangle(-half, -half * 0.6, half, -half * 0.4, half * 0.3, half * 0.7);
      chunk.fillTriangle(-half, -half * 0.6, half * 0.3, half * 0.7, -half * 0.4, half * 0.5);
      chunk.x = x;
      chunk.y = y;
      chunk.angle = Math.random() * 360;
      const targetX = x + vx * 0.6;
      const targetY = y + vy * 0.6 + 200; // gravity drop
      this.tweens.add({
        targets: chunk,
        x: targetX,
        y: targetY,
        angle: chunk.angle + (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 200),
        alpha: 0,
        duration: 600,
        ease: 'Quad.easeIn',
        onComplete: () => chunk.destroy()
      });
    }

    // Brief screen flash: full-screen white rect, alpha 0 -> 0.25 -> 0 over ~120ms.
    const flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(100);
    this.tweens.add({
      targets: flash,
      alpha: { from: 0, to: 0.25 },
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy()
    });
  }

  removeAsteroid(asteroid) {
    if (asteroid.fallTween) asteroid.fallTween.stop();
    if (asteroid.container?.active) {
      this.tweens.add({
        targets: asteroid.container,
        scale: 0,
        alpha: 0,
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => asteroid.container.destroy()
      });
    }
    this.activeAsteroids = this.activeAsteroids.filter(a => a !== asteroid);
    if (this.targetedAsteroid === asteroid) {
      this.targetedAsteroid = null;
      const next = this.activeAsteroids[0];
      if (next) this.targetAsteroid(next);
    }
  }

  damageShip() {
    const flash = this.add.graphics().setDepth(10);
    flash.fillStyle(COLORS.error, 0.6);
    flash.fillCircle(0, 0, 110);
    this.shipContainer.add(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 380,
      onComplete: () => flash.destroy()
    });
    this.cameras.main.shake(280, 0.012);
  }

  // ============================================================
  // UPDATE
  // ============================================================
  update(_time, delta) {
    if (this.state !== 'playing' && this.state !== 'feedback') return;

    if (this.bossHpBar?.active && this.bossContainer?.active) {
      this.bossHpBar.x = this.bossContainer.x;
      this.bossHpBar.y = this.bossContainer.y - ASTEROID_RADIUS * BOSS_CONFIG.asteroidScale - 60;
    }

    this.timeLeft -= delta;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endRound();
      return;
    }

    const pct = this.timeLeft / (this.duration * 1000);
    drawTimeBar(this, TOP_BAR_H, pct);
    this.timeText.setText(this.formatTime(this.timeLeft));

    if (this.timeLeft <= 5000) {
      const sec = Math.ceil(this.timeLeft / 1000);
      if (sec !== this.lastTickSec) {
        this.lastTickSec = sec;
        audio.playTick?.();
        this.tweens.add({
          targets: this.timeText,
          scale: { from: 1.3, to: 1 },
          duration: 250,
          ease: 'Quad.easeOut'
        });
      }
    }
  }

  // ============================================================
  // FAIL
  // ============================================================
  failLevel() {
    this.state = 'failed';
    audio.playLevelFailed?.();

    this.activeAsteroids.forEach(a => {
      if (a.fallTween) a.fallTween.stop();
      if (a.container?.active) a.container.destroy();
    });
    this.activeAsteroids = [];

    this.cameras.main.shake(600, 0.025);

    this.time.delayedCall(700, () => this.showFailScreen());
  }

  showFailScreen() {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.8, duration: 350 });

    const panelW = 800;
    const panelH = 600;
    const panel = this.add.container(W / 2, H + panelH / 2).setDepth(60);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.98);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32);
    bg.lineStyle(3, COLORS.error, 0.9);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32);
    panel.add(bg);

    panel.add(this.add.text(0, -panelH / 2 + 80, 'Ship Destroyed', style('display', {
      fontSize: '60px',
      fill: '#ff6b6b'
    })).setOrigin(0.5));

    panel.add(this.add.text(0, -panelH / 2 + 160, 'Five hits and the hull gave way.', style('body', {
      fill: '#cfcfe0', fontSize: '28px'
    })).setOrigin(0.5));

    panel.add(this.add.text(0, -panelH / 2 + 220, 'Try again, pilot.', style('body', {
      fill: '#cfcfe0', fontSize: '28px'
    })).setOrigin(0.5));

    panel.add(this.add.text(-150, 30, this.score.toString(), style('display', {
      fontSize: '70px', fill: '#ffffff'
    })).setOrigin(0.5));
    panel.add(this.add.text(-150, 90, 'CORRECT', style('caption')).setOrigin(0.5));

    panel.add(this.add.text(150, 30, this.bestStreak.toString(), style('display', {
      fontSize: '70px', fill: '#ff8b3d'
    })).setOrigin(0.5));
    panel.add(this.add.text(150, 90, 'BEST STREAK', style('caption')).setOrigin(0.5));

    const btnY = panelH / 2 - 100;
    panel.add(createButton(this, {
      x: -150, y: btnY, label: 'Retry',
      width: 280, height: 90,
      color: this.world.accentColor,
      onClick: () => this.scene.restart()
    }));
    panel.add(createButton(this, {
      x: 150, y: btnY, label: 'Exit',
      width: 280, height: 90,
      color: 0x4a4a6a,
      onClick: () => this.exitToLevelSelect()
    }));

    this.tweens.add({
      targets: panel,
      y: H / 2,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }

  // ============================================================
  // END OF ROUND
  // ============================================================
  endRound({ bossWin } = {}) {
    this.state = 'ended';
    audio.playRoundComplete?.();

    this.activeAsteroids.forEach(a => {
      if (a.fallTween) a.fallTween.stop();
    });

    const accuracy = this.attempts > 0 ? Math.round((this.score / this.attempts) * 100) : 0;
    const stars = bossWin ? this.calculateBossStars() : this.calculateStars(this.score, accuracy);

    const prevBestStars = progress.worldProgress[this.worldId]?.levelStars?.[this.currentLevel] || 0;
    const firstMastery = stars === 3 && prevBestStars < 3;

    // Capture pre-completion state so we know if THIS run cleared the world
    // (vs a replay of the boss after it was already cleared).
    const wasFullyCleared = progress.isWorldFullyCleared(this.worldId);

    progress.completeLevel(this.worldId, this.currentLevel, stars);

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

    // Check for evolution after this round
    const evolvedTo = companion.checkEvolutionEligibility();

    const worldFullyCleared = progress.isWorldFullyCleared(this.worldId);
    const clearedThisRun = bossWin && !wasFullyCleared && worldFullyCleared;

    const summaryArgs = { stars, accuracy, bossWin, evolvedTo, firstMastery, baseBonus, masteryBonus, dailyBonus };

    const proceedToSummary = () => {
      if (evolvedTo) {
        // Evolution gets a full-screen cinematic before the summary.
        import('../EvolutionCinematic.js').then(({ playEvolutionCinematic }) => {
          playEvolutionCinematic(this, evolvedTo, () => this.showSummary(summaryArgs));
        });
      } else {
        this.showSummary(summaryArgs);
      }
    };

    if (bossWin && this.worldId === 11 && worldFullyCleared) {
      this.showFinalCinematic();
    } else if (clearedThisRun) {
      this.showWorldClearBanner(() => proceedToSummary());
    } else {
      proceedToSummary();
    }
  }

  calculateStars(score, accuracy) {
    if (score === 0) return 0;
    const meetsAccuracy = accuracy >= 85;
    if (score >= this.scoreThreshold && meetsAccuracy) return 3;
    if (score >= Math.ceil(this.scoreThreshold * 0.7) || meetsAccuracy) return 2;
    return 1;
  }

  calculateBossStars() {
    const lost = SHIP_HP_MAX - this.shipHp;
    if (lost === 0) return 3;
    if (lost <= 2) return 2;
    return 1;
  }

  showSummary({ stars, accuracy, bossWin, evolvedTo, firstMastery, baseBonus = 0, masteryBonus = 0, dailyBonus = 0 }) {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.7, duration: 350 });

    const panelW = 880;
    const panelH = 1200;
    const panel = this.add.container(W / 2, H + panelH / 2).setDepth(60);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.98);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32);
    bg.lineStyle(3, bossWin ? COLORS.error : this.world.accentColor, 0.9);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32);
    panel.add(bg);

    panel.add(this.add.text(0, -panelH / 2 + 80, bossWin ? 'Boss Defeated!' : "Time's Up!", style('display', {
      fontSize: '60px'
    })).setOrigin(0.5));

    panel.add(this.add.text(0, -panelH / 2 + 145, this.modeConfig.label.toUpperCase(), style('caption', {
      fill: '#cfcfe0', fontSize: '24px'
    })).setOrigin(0.5));

    const starY = -panelH / 2 + 260;
    for (let i = 0; i < 3; i++) {
      const filled = i < stars;
      const star = this.makeStarShape(filled);
      star.x = -160 + i * 160;
      star.y = starY;
      star.setScale(0);
      panel.add(star);
      this.tweens.add({
        targets: star,
        scale: 1.2,
        duration: 250,
        delay: 700 + i * 200,
        ease: 'Back.easeOut',
        onStart: () => filled && audio.playStar()
      });
    }

    const statY = starY + 220;
    panel.add(this.add.text(-220, statY, this.score.toString(), style('display', {
      fontSize: '78px',
      fill: '#ffffff'
    })).setOrigin(0.5));
    panel.add(this.add.text(-220, statY + 60, 'CORRECT', style('caption')).setOrigin(0.5));

    panel.add(this.add.text(0, statY, `${accuracy}%`, style('display', {
      fontSize: '78px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0.5));
    panel.add(this.add.text(0, statY + 60, 'ACCURACY', style('caption')).setOrigin(0.5));

    panel.add(this.add.text(220, statY, this.bestStreak.toString(), style('display', {
      fontSize: '78px',
      fill: '#ff8b3d'
    })).setOrigin(0.5));
    panel.add(this.add.text(220, statY + 60, 'BEST STREAK', style('caption')).setOrigin(0.5));

    // Always-celebratory pet, top-right corner of the summary panel.
    // Spec: pet visible regardless of star count; positive reinforcement.
    if (companion.hasStarter()) {
      const pet = drawCompanion(this, 320, -260, { scale: 0.9 });
      panel.add(pet);
      pet.setScale(0);
      this.tweens.add({
        targets: pet,
        scale: 0.9,
        duration: 320,
        delay: 600,
        ease: 'Back.easeOut',
        onComplete: () => {
          pet.bounceHappy?.();
          const loop = this.time.addEvent({
            delay: 1600,
            loop: true,
            callback: () => pet.bounceHappy?.()
          });
          pet.once('destroy', () => loop.destroy());
        }
      });
    }

    if (evolvedTo) {
      const banner = this.add.container(0, -panelH / 2 + 30);
      const bg2 = this.add.graphics();
      bg2.fillStyle(COLORS.accentPurple, 1);
      bg2.fillRoundedRect(-320, -32, 640, 64, 32);
      banner.add(bg2);
      const sp = companion.getSpecies();
      const lore = sp.stages[evolvedTo];
      banner.add(this.add.text(0, 0, `EVOLVED — ${lore.name.toUpperCase()}!`, style('subhead', {
        fontSize: '26px',
        fill: '#1a0a26',
        fontStyle: '900'
      })).setOrigin(0.5));
      panel.add(banner);
    }

    if (firstMastery) {
      const banner = this.add.container(0, -panelH / 2 + (evolvedTo ? 90 : 30));
      const bg2 = this.add.graphics();
      bg2.fillStyle(COLORS.warning, 1);
      bg2.fillRoundedRect(-340, -34, 680, 68, 34);
      bg2.lineStyle(3, 0xffae3a, 1);
      bg2.strokeRoundedRect(-340, -34, 680, 68, 34);
      banner.add(bg2);
      const starG = this.add.graphics();
      drawStarIcon(starG, -290, 0, 16, COLORS.bgPanel, 0xffffff);
      banner.add(starG);
      banner.add(this.add.text(0, 0, 'FIRST MASTERY! +5 STARDUST', style('subhead', {
        fontSize: '26px',
        fill: '#1a1208',
        fontStyle: '900'
      })).setOrigin(0.5));
      panel.add(banner);

      // Extra confetti burst from the banner area
      this.tweens.add({
        targets: banner, scale: { from: 0.6, to: 1 },
        duration: 320, ease: 'Back.easeOut'
      });
      audio.playStar?.();
      this.time.delayedCall(180, () => audio.playStar?.());
      this.time.delayedCall(360, () => audio.playStar?.());
    }

    const weakFacts = this.getWeakFactsFromHistory();
    const reviewY = statY + 170;
    panel.add(this.add.text(0, reviewY, weakFacts.length ? 'Practice these' : 'No tricky facts!', style('subhead', {
      fontSize: '28px',
      fill: '#cfcfe0'
    })).setOrigin(0.5));

    weakFacts.slice(0, 3).forEach((wf, i) => {
      const wy = reviewY + 60 + i * 64;
      panel.add(this.add.text(0, wy, `${wf.display} = ${wf.answer}`, style('subhead', {
        fontSize: '36px',
        fill: '#f7dc6f'
      })).setOrigin(0.5));
    });

    const btnY = panelH / 2 - 110;

    // Stardust earned — pill chip with animated counter.
    if (this.stardustEarned > 0) {
      const dustY = btnY - 200;
      const total = this.stardustEarned;

      // Width is sized for the final value so the chip doesn't reflow mid-tween.
      const finalLabel = this.add.text(0, 0, `+${total} STARDUST`, style('subhead', {
        fontSize: '34px', fill: '#ffffff', fontStyle: '900',
        stroke: '#0a0a18', strokeThickness: 3
      })).setOrigin(0, 0.5);
      const finalLabelW = finalLabel.width;
      finalLabel.destroy();

      const iconBoxW = 50;
      const gap = 14;
      const totalW = iconBoxW + gap + finalLabelW;
      const chipW = Math.max(360, totalW + 70);
      const chipH = 76;
      const r = chipH / 2;
      const groupLeft = -totalW / 2;

      const chip = this.add.container(0, dustY);

      const halo = this.add.graphics();
      halo.fillStyle(COLORS.accentPurple, 0.20);
      halo.fillRoundedRect(-chipW / 2 - 8, -chipH / 2 - 4, chipW + 16, chipH + 8, r + 4);
      chip.add(halo);

      const pill = this.add.graphics();
      pill.fillStyle(COLORS.bgTrack, 1);
      pill.fillRoundedRect(-chipW / 2, -chipH / 2, chipW, chipH, r);
      pill.fillStyle(0xffffff, 0.06);
      pill.fillRoundedRect(-chipW / 2 + 4, -chipH / 2 + 3, chipW - 8, chipH * 0.30, {
        tl: r - 2, tr: r - 2, bl: 6, br: 6
      });
      pill.fillStyle(COLORS.bgDark, 0.40);
      pill.fillRoundedRect(-chipW / 2 + 4, chipH / 2 - chipH * 0.30 - 3, chipW - 8, chipH * 0.30, {
        tl: 6, tr: 6, bl: r - 2, br: r - 2
      });
      pill.lineStyle(2, COLORS.accentPurple, 0.85);
      pill.strokeRoundedRect(-chipW / 2, -chipH / 2, chipW, chipH, r);
      chip.add(pill);

      const iconG = this.add.graphics();
      iconG.x = groupLeft + iconBoxW / 2;
      drawSparkleIcon(iconG, 0, 0, 22, COLORS.accentPurple);
      chip.add(iconG);

      const labelObj = this.add.text(groupLeft + iconBoxW + gap, 0, `+0 STARDUST`, style('subhead', {
        fontSize: '34px', fill: '#ffffff', fontStyle: '900',
        stroke: '#0a0a18', strokeThickness: 3
      })).setOrigin(0, 0.5);
      chip.add(labelObj);

      // Bonus breakdown lines below the chip (briefly visible)
      const bonusLines = [];
      if (masteryBonus > 0) bonusLines.push({ text: `+${masteryBonus} first mastery`, color: '#f7dc6f' });
      if (dailyBonus > 0)   bonusLines.push({ text: `+${dailyBonus} welcome back!`,   color: '#9be8a3' });
      const bonusContainer = this.add.container(0, chipH / 2 + 24);
      bonusLines.forEach((bl, i) => {
        const t = this.add.text(0, i * 28, bl.text, style('caption', {
          fontSize: '20px', fill: bl.color, fontStyle: '900'
        })).setOrigin(0.5);
        t.alpha = 0;
        bonusContainer.add(t);
        this.tweens.add({
          targets: t,
          alpha: { from: 0, to: 1 },
          duration: 300,
          delay: 1700 + i * 200,
          ease: 'Sine.easeOut'
        });
      });
      chip.add(bonusContainer);

      panel.add(chip);

      // Counter ticks up from 0 to total. The chip animates with the panel
      // sliding in; the count animation conveys the reward.
      let lastTickAt = 0;
      this.tweens.addCounter({
        from: 0, to: total,
        duration: Math.min(900, 300 + total * 30),
        ease: 'Cubic.easeOut',
        onUpdate: (tw) => {
          const v = Math.round(tw.getValue());
          labelObj.setText(`+${v} STARDUST`);
          const now = this.time.now;
          if (v < total && now - lastTickAt > 80) {
            lastTickAt = now;
            audio.playStardustTick?.();
          }
        },
        onComplete: () => {
          labelObj.setText(`+${total} STARDUST`);
          audio.playStardustChime?.();
        }
      });
    }

    panel.add(createButton(this, {
      x: -160, y: btnY, label: 'Retry',
      width: 280, height: 92,
      color: 0x4a4a6a,
      onClick: () => this.scene.restart()
    }));
    panel.add(createButton(this, {
      x: 160, y: btnY, label: 'Continue',
      width: 280, height: 92,
      color: this.world.accentColor,
      onClick: () => this.exitToLevelSelect()
    }));

    this.tweens.add({
      targets: panel,
      y: H / 2,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }

  makeStarShape(filled) {
    const g = this.add.graphics();
    drawStarIcon(g, 0, 0, 44, filled ? COLORS.warning : 0x6a6a80, 0xffffff);
    if (!filled) {
      g.clear();
      g.lineStyle(3, 0x6a6a80, 1);
      const points = 5;
      const outerR = 44;
      const innerR = 18;
      g.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.strokePath();
    }
    return g;
  }

  getWeakFactsFromHistory() {
    const stats = new Map();
    for (const h of this.history) {
      const key = h.problem.display;
      const e = stats.get(key) || { display: h.problem.display, answer: h.problem.answer, correct: 0, total: 0 };
      e.total++;
      if (h.correct) e.correct++;
      stats.set(key, e);
    }
    return [...stats.values()]
      .filter(e => e.total >= 1 && e.correct < e.total)
      .sort((a, b) => (a.correct / a.total) - (b.correct / b.total));
  }

  showFinalCinematic() {
    const cards = [
      'The Void Devourer cracks. Light leaks through.',
      'Across the galaxy, dark worlds flicker awake.',
      'Stars relight. Old constellations remember their names.',
      'You did it, pilot. The universe is yours again.'
    ];

    const backdrop = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0)
      .setDepth(40).setInteractive();
    this.tweens.add({ targets: backdrop, alpha: 0.95, duration: 700 });

    const starLayer = this.add.container(0, 0).setDepth(45);
    for (let i = 0; i < 80; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * (H - 200) + 80;
      const r = Math.random() * 2 + 1.2;
      const star = this.add.graphics();
      star.fillStyle(0xffffff, 1);
      star.fillCircle(sx, sy, r);
      star.alpha = 0;
      starLayer.add(star);
      this.tweens.add({
        targets: star,
        alpha: 1,
        duration: 600 + Math.random() * 1200,
        delay: 400 + Math.random() * 2400,
        ease: 'Quad.easeOut'
      });
    }

    let cardIdx = 0;
    const cardContainer = this.add.container(W / 2, H / 2).setDepth(60);

    const showCard = (text, last) => {
      const cardW = 880;
      const cardH = 280;
      const card = this.add.container(0, 30);
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.bgPanel, 0.92);
      bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 28);
      bg.lineStyle(3, 0xffeaa7, 0.95);
      bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 28);
      card.add(bg);
      card.add(this.add.text(0, 0, text, style('subhead', {
        fontSize: '34px',
        fill: '#ffeaa7',
        align: 'center',
        wordWrap: { width: cardW - 80 }
      })).setOrigin(0.5));
      card.alpha = 0;
      cardContainer.add(card);
      this.tweens.add({
        targets: card,
        alpha: 1,
        y: 0,
        duration: 500,
        ease: 'Quad.easeOut'
      });

      const advance = () => {
        this.tweens.add({
          targets: card,
          alpha: 0,
          y: -30,
          duration: 400,
          onComplete: () => {
            card.destroy();
            cardIdx++;
            if (cardIdx < cards.length) {
              showCard(cards[cardIdx], cardIdx === cards.length - 1);
            }
          }
        });
      };

      if (last) {
        this.time.delayedCall(900, () => {
          const pet = drawCompanion(this, 0, cardH / 2 + 120, { scale: 1.2 });
          cardContainer.add(pet);
          this.tweens.add({
            targets: pet,
            y: cardH / 2 + 90,
            scaleX: 1.2,
            scaleY: 1.0,
            duration: 280,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut'
          });
          cardContainer.add(createButton(this, {
            x: 0, y: cardH / 2 + 280, label: 'Onward',
            width: 320, height: 92,
            color: 0xffeaa7,
            onClick: () => this.exitToLevelSelect()
          }));
        });
      } else {
        this.time.delayedCall(2400, advance);
      }
    };

    this.time.delayedCall(900, () => showCard(cards[0], false));
  }

  exitToLevelSelect() {
    this.scene.start('LevelSelectScene');
  }
}
