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
import { createButton, createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { companion, drawCompanion } from '../CompanionManager.js';
import { drawShip } from '../ShipRenderer.js';
import { streak } from '../StreakManager.js';
import { economy } from '../EconomyManager.js';
import { grantStreakRewards } from '../MilestoneRewards.js';
import { rollLevelEndDrop } from '../RandomDrops.js';
import { records } from '../RecordsManager.js';
import {
  drawFlameIcon, drawStarIcon, drawHourglassIcon,
  drawHeartIcon, drawSkullIcon, drawSoundIcon, drawArrowLeftIcon
} from '../StatIcons.js';
import { cosmetics } from '../CosmeticManager.js';
import { drawQuestionBody, drawBossBody as drawWorldBoss } from '../QuestionObjectArt.js';
import { applyBossTwist, bossTwistOn } from '../BossMechanics.js';
import { darken, lighten } from '../colorUtils.js';

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
    createStarfield(this, {
      width: W, height: H,
      accentColor: this.world.accentColor,
      accentStrength: 0.18
    });

    this.createTopBar();
    this.createPlayArea();
    this.createMcButtons();

    this._onKeyDown = this.onKeyDown.bind(this);
    this.input.keyboard?.on('keydown', this._onKeyDown);
    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown', this._onKeyDown);
    });

    new TransitionManager(this).fadeIn(280);

    if (this.isBoss) {
      audio.playBossRumble?.();
      this.cameras.main.flash(280, 90, 0, 0);
      this.cameras.main.shake(420, 0.008);
      applyBossTwist(this, this.world.id);
      this.spawnAsteroid();
      this.time.delayedCall(700, () => { this.state = 'playing'; });
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

  // ============================================================
  // TOP BAR — two rows + HP hearts + time bar at very bottom
  // ============================================================
  createTopBar() {
    const bg = this.add.graphics().setDepth(4);
    bg.fillStyle(0x07071a, 0.92);
    bg.fillRect(0, 0, W, TOP_BAR_H);

    // Back button
    createIconButton(this, {
      x: 80, y: 70, radius: 36,
      accentColor: this.world.accentColor,
      drawIcon: (g, size) => drawArrowLeftIcon(g, 0, 0, size),
      onClick: () => this.exitToLevelSelect()
    }).setDepth(15);

    // World name + mode in upper-right area
    const titleX = W / 2;
    this.add.text(titleX, 50, this.world.name, style('subhead', {
      fontSize: '36px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0.5).setDepth(15);

    const modeRow = this.add.container(titleX, 100).setDepth(15);
    if (this.isBoss) {
      const skullG = this.add.graphics();
      drawSkullIcon(skullG, -120, 0, 16);
      modeRow.add(skullG);
    }
    modeRow.add(this.add.text(0, 0, this.modeConfig.label.toUpperCase(), style('caption', {
      fontSize: '26px',
      fill: '#cfcfe0',
      fontStyle: '900'
    })).setOrigin(0.5));

    // Sound toggle (top-right)
    createIconButton(this, {
      x: W - 80, y: 70, radius: 36,
      accentColor: this.world.accentColor,
      drawIcon: (g, size) => drawSoundIcon(g, 0, 0, size, 0xffffff, audio.enabled),
      onClick: () => audio.toggleEnabled()
    }).setDepth(15);

    // Row 1: STREAK / SCORE / TIME with pixel icons
    const row1Y = 170;
    this.streakIcon = this.add.graphics().setDepth(10);
    drawFlameIcon(this.streakIcon, 0, 0, 18);
    this.streakIcon.x = W * 0.18 - 60;
    this.streakIcon.y = row1Y;
    this.streakText = this.add.text(W * 0.18, row1Y, '0', style('display', {
      fontSize: '52px',
      fill: '#ff8b3d'
    })).setOrigin(0, 0.5).setDepth(10);
    this.add.text(W * 0.18 - 60, row1Y + 42, 'STREAK', style('caption', {
      fontSize: '22px',
      fill: '#7a7a90',
      fontStyle: '900'
    })).setOrigin(0, 0.5).setDepth(10);

    this.scoreIcon = this.add.graphics().setDepth(10);
    drawStarIcon(this.scoreIcon, 0, 0, 18);
    this.scoreIcon.x = W * 0.50 - 60;
    this.scoreIcon.y = row1Y;
    this.scoreText = this.add.text(W * 0.50, row1Y, '0', style('display', {
      fontSize: '52px',
      fill: '#ffffff'
    })).setOrigin(0, 0.5).setDepth(10);
    this.add.text(W * 0.50 - 60, row1Y + 42, 'SCORE', style('caption', {
      fontSize: '22px',
      fill: '#7a7a90',
      fontStyle: '900'
    })).setOrigin(0, 0.5).setDepth(10);

    this.timeIcon = this.add.graphics().setDepth(10);
    drawHourglassIcon(this.timeIcon, 0, 0, 16);
    this.timeIcon.x = W * 0.78 - 60;
    this.timeIcon.y = row1Y;
    this.timeText = this.add.text(W * 0.78, row1Y, this.formatTime(this.timeLeft), style('display', {
      fontSize: '52px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0, 0.5).setDepth(10);
    this.add.text(W * 0.78 - 60, row1Y + 42, 'TIME', style('caption', {
      fontSize: '22px',
      fill: '#7a7a90',
      fontStyle: '900'
    })).setOrigin(0, 0.5).setDepth(10);

    // Row 2: HP hearts (5)
    const row2Y = 260;
    const hpStartX = W / 2 - 4 * 60;
    this.hpIcons = [];
    for (let i = 0; i < SHIP_HP_MAX; i++) {
      const ix = hpStartX + i * 120;
      const c = this.add.container(ix, row2Y).setDepth(20);
      const heart = this.add.graphics();
      drawHeartIcon(heart, 0, 0, 28, true);
      c.add(heart);
      c.fullColor = true;
      c.heart = heart;
      this.hpIcons.push(c);
    }

    // Time bar at very bottom of the top bar
    this.timeBarBg = this.add.graphics().setDepth(5);
    this.timeBarBg.fillStyle(0x1a1a2e, 0.85);
    this.timeBarBg.fillRect(0, TOP_BAR_H - 12, W, 12);
    this.timeBar = this.add.graphics().setDepth(6);
    this.drawTimeBar(1);
  }

  drawTimeBar(pct) {
    const fillW = Math.max(0, Math.floor(W * pct));
    const color = pct > 0.4 ? this.world.accentColor : pct > 0.2 ? 0xf7dc6f : 0xff6b6b;
    if (fillW === this._lastTimeBarW && color === this._lastTimeBarColor) return;
    this._lastTimeBarW = fillW;
    this._lastTimeBarColor = color;
    this.timeBar.clear();
    this.timeBar.fillStyle(color, 1);
    this.timeBar.fillRect(0, TOP_BAR_H - 12, fillW, 12);
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
    // Faint horizon
    const horizon = this.add.graphics().setDepth(2);
    horizon.lineStyle(2, this.world.accentColor, 0.18);
    horizon.lineBetween(60, ASTEROID_IMPACT_Y + 24, W - 60, ASTEROID_IMPACT_Y + 24);

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
    track.fillStyle(0x07071a, 0.7);
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
    const color = pct > 0.5 ? 0xff6b6b : pct > 0.25 ? 0xffaa44 : 0xff3030;
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
    fillG.lineStyle(2, 0x07071a, 0.55);
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

    this.flashMcButton(btn, 0x58d68d);

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

    economy.addStardust(1);

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
      this.explodeAsteroid(asteroid);
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
    this.flashMcButton(btn, 0xff6b6b);
    audio.playWrong?.();

    this.streak = 0;
    this.streakText.setText('0');

    if (asteroid.isBoss) {
      this.attempts++;
      this.history.push({ problem: asteroid.problem, userAnswer: pickedValue, correct: false });
      progress.recordFactAttempt(asteroid.problem.a, asteroid.problem.b, false);
      records.recordAnswer(asteroid.problem, false, performance.now() - asteroid.startedAtMs);

      this.bossAttackBack(asteroid);
      this.damageShip();
      this.cockpitPet?.slumpSad?.();
      audio.playShipDamage?.();
      this.setHp(this.shipHp - 1);
      bossTwistOn(this, 'onWrong', asteroid, btn);
      // Disable this button until next problem cycle
      btn.value = null;
      btn.label.setColor('#5a5a72');
      btn.setAlpha(0.45);
      if (this.shipHp <= 0) this.failLevel();
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
      this.time.delayedCall(220, () => {
        if (this.state === 'failed' || this.state === 'ended') return;
        this.cycleBossProblem(asteroid);
        this.state = 'playing';
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

    this.time.delayedCall(450, () => {
      if (this.state === 'playing' || this.state === 'feedback') {
        this.spawnAsteroid();
      }
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

  defeatBoss(asteroid) {
    this.bossDefeated = true;
    this.state = 'feedback';
    if (asteroid.fallTween) asteroid.fallTween.stop();

    audio.playAsteroidBoom?.();
    this.cameras.main.shake(620, 0.022);

    const x = asteroid.container.x;
    const y = asteroid.container.y;
    for (let burst = 0; burst < 3; burst++) {
      this.time.delayedCall(burst * 160, () => {
        this.explodeAsteroid({ x, y });
        audio.playAsteroidBoom?.();
      });
    }

    this.time.delayedCall(180, () => {
      if (asteroid.container?.active) asteroid.container.destroy();
      if (this.bossHpBar?.active) this.bossHpBar.destroy();
      this.bossContainer = null;
      this.bossHpBar = null;
    });

    audio.playWorldClearFanfare?.();

    this.time.delayedCall(900, () => {
      this.endRound({ bossWin: true });
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

    const colors = opts.onShip
      ? [0xff6b6b, 0xff8b3d, 0xffd86b]
      : [0xf7dc6f, 0xff8b3d, 0xffffff];
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 80 + Math.random() * 100;
      const shard = this.add.graphics().setDepth(9);
      shard.fillStyle(colors[i % colors.length], 1);
      shard.fillCircle(0, 0, 5 + Math.random() * 5);
      shard.x = x;
      shard.y = y;
      this.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 500 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => shard.destroy()
      });
    }

    const ring = this.add.graphics().setDepth(9);
    ring.lineStyle(7, 0xffffff, 1);
    ring.strokeCircle(0, 0, 40);
    ring.x = x;
    ring.y = y;
    this.tweens.add({
      targets: ring,
      scale: 4,
      alpha: 0,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
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
    flash.fillStyle(0xff6b6b, 0.6);
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
    this.drawTimeBar(pct);
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

    streak.registerPlayDay();

    this.time.delayedCall(700, () => this.showFailScreen());
  }

  showFailScreen() {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.8, duration: 350 });

    const panelW = 800;
    const panelH = 600;
    const panel = this.add.container(W / 2, H + panelH / 2).setDepth(60);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.98);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32);
    bg.lineStyle(3, 0xff6b6b, 0.9);
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

    progress.completeLevel(this.worldId, this.currentLevel, stars);

    if (stars > 0) economy.addStardust(stars * 5);

    streak.registerPlayDay();
    this.newStreakMilestones = streak.consumeNewMilestones();
    this.streakRewards = grantStreakRewards(this.newStreakMilestones || []);
    this.randomDrop = stars > 0 ? rollLevelEndDrop(stars) : null;
    records.recordLevelComplete(this.worldId, stars, this.bestStreak);

    // Check for evolution after this round
    const evolvedTo = companion.checkEvolutionEligibility();

    const worldFullyCleared = progress.isWorldFullyCleared(this.worldId);

    if (bossWin && this.worldId === 11 && worldFullyCleared) {
      this.showFinalCinematic();
    } else if (bossWin && worldFullyCleared) {
      this.showStoryCard({ stars, accuracy });
    } else {
      this.showSummary({ stars, accuracy, bossWin, evolvedTo });
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

  showSummary({ stars, accuracy, bossWin, evolvedTo }) {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.7, duration: 350 });

    const panelW = 880;
    const panelH = 1200;
    const panel = this.add.container(W / 2, H + panelH / 2).setDepth(60);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.98);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32);
    bg.lineStyle(3, bossWin ? 0xff6b6b : this.world.accentColor, 0.9);
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

    if (evolvedTo) {
      const banner = this.add.container(0, -panelH / 2 + 30);
      const bg2 = this.add.graphics();
      bg2.fillStyle(0xc77eff, 1);
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

    if (this.newStreakMilestones && this.newStreakMilestones.length > 0) {
      const m = this.newStreakMilestones[0];
      const reward = (this.streakRewards || [])[0];
      const banner = this.add.container(0, -panelH / 2 + 90);
      const bg2 = this.add.graphics();
      bg2.fillStyle(0xff8b3d, 1);
      bg2.fillRoundedRect(-300, -28, 600, 56, 28);
      banner.add(bg2);
      const flameG = this.add.graphics();
      drawFlameIcon(flameG, -260, 0, 14);
      banner.add(flameG);
      const label = reward
        ? `${m}-day streak — unlocked ${reward.item.name}!`
        : `${m}-day streak unlocked!`;
      banner.add(this.add.text(0, 0, label, style('subhead', {
        fontSize: '22px',
        fill: '#1a0a00',
        fontStyle: '900'
      })).setOrigin(0.5));
      panel.add(banner);
    }

    if (this.randomDrop) {
      const dropY = (this.newStreakMilestones && this.newStreakMilestones.length > 0)
        ? -panelH / 2 + 152
        : -panelH / 2 + 90;
      const banner = this.add.container(0, dropY);
      const bg2 = this.add.graphics();
      bg2.fillStyle(0xc77eff, 1);
      bg2.fillRoundedRect(-300, -28, 600, 56, 28);
      banner.add(bg2);
      banner.add(this.add.text(0, 0, `Surprise drop: ${this.randomDrop.item.name}!`, style('subhead', {
        fontSize: '22px',
        fill: '#1a0a26',
        fontStyle: '900'
      })).setOrigin(0.5));
      panel.add(banner);
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
    drawStarIcon(g, 0, 0, 44, filled ? 0xf7dc6f : 0x6a6a80, 0xffffff);
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

  showStoryCard({ stars }) {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0)
      .setDepth(50).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.85, duration: 400 });

    const panelW = 920;
    const panelH = 600;
    const panel = this.add.container(W / 2, H + panelH / 2).setDepth(60);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.98);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32);
    bg.lineStyle(3, this.world.accentColor, 0.95);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 32);
    panel.add(bg);

    panel.add(this.add.text(0, -panelH / 2 + 80, 'World Cleared', style('display', {
      fontSize: '54px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0.5));

    panel.add(this.add.text(0, -panelH / 2 + 150, this.world.name, style('subhead', {
      fontSize: '36px',
      fill: '#ffffff'
    })).setOrigin(0.5));

    const starY = -panelH / 2 + 260;
    for (let i = 0; i < 3; i++) {
      const filled = i < stars;
      const star = this.makeStarShape(filled);
      star.x = -120 + i * 120;
      star.y = starY;
      star.setScale(0);
      panel.add(star);
      this.tweens.add({
        targets: star,
        scale: 0.95,
        duration: 250,
        delay: 600 + i * 180,
        ease: 'Back.easeOut',
        onStart: () => filled && audio.playStar()
      });
    }

    panel.add(this.add.text(0, 100, this.world.flavorText || 'World cleared.', style('body', {
      fontSize: '28px',
      fill: '#cfcfe0',
      align: 'center',
      wordWrap: { width: panelW - 120 }
    })).setOrigin(0.5));

    panel.add(createButton(this, {
      x: 0, y: panelH / 2 - 100, label: 'Onward',
      width: 320, height: 92,
      color: this.world.accentColor,
      onClick: () => this.exitToLevelSelect()
    }));

    this.tweens.add({
      targets: panel,
      y: H / 2,
      duration: 520,
      ease: 'Back.easeOut'
    });
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
      bg.fillStyle(0x12122a, 0.92);
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
