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
import { PetHUD } from '../PetHUD.js';
import { records } from '../RecordsManager.js';

const W = 800;
const H = 1400;

const SHIP_HP_MAX = 5;

// Where things sit on the play area
const ASTEROID_TOP_Y = 340;          // spawn line just under stats row
const ASTEROID_IMPACT_Y = 880;       // y at which asteroid "hits" the ship
const SHIP_Y = 980;                  // ship draws here
const ASTEROID_RADIUS = 90;

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

    this.modeConfig = this.isBoss
      ? { label: `${this.world.villain || 'Boss'}`, symbol: '☠', duration: 90, scoreThreshold: BOSS_CONFIG.hp }
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

    this.bossHp = BOSS_CONFIG.hp;
    this.bossDefeated = false;

    this.activeAsteroids = [];
    this.targetedAsteroid = null;

    this.state = 'ready';
  }

  create() {
    audio.init();

    createStarfield(this, {
      accentColor: this.world.accentColor,
      accentStrength: 0.18
    });

    this.createTopBar();

    if (companion.hasStarter()) {
      this.petHud = new PetHUD(this, 80, 170);
    }

    this.timeBarBg = this.add.graphics().setDepth(5);
    this.timeBarBg.fillStyle(0x1a1a2e, 0.8);
    this.timeBarBg.fillRect(0, 100, W, 8);
    this.timeBar = this.add.graphics().setDepth(6);
    this.drawTimeBar(1);

    this.createHpRow();
    this.createStatsRow();
    this.createPlayArea();
    this.createMcButtons();

    this._onKeyDown = this.onKeyDown.bind(this);
    this.input.keyboard?.on('keydown', this._onKeyDown);
    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown', this._onKeyDown);
    });

    new TransitionManager(this).fadeIn(300);

    if (this.isBoss) {
      audio.playBossRumble?.();
      this.cameras.main.flash(280, 90, 0, 0);
      this.cameras.main.shake(420, 0.008);
      this.spawnAsteroid();
      this.time.delayedCall(700, () => {
        this.state = 'playing';
      });
    } else {
      // Stagger spawns so multi-asteroid worlds enter the field at different y.
      for (let i = 0; i < this.asteroidSlots; i++) {
        this.time.delayedCall(i * 600, () => {
          if (this.state === 'failed' || this.state === 'ended') return;
          this.spawnAsteroid();
        });
      }
      this.time.delayedCall(450, () => {
        this.state = 'playing';
      });
    }
  }

  // ============================================================
  // TOP BAR
  // ============================================================
  createTopBar() {
    const bg = this.add.graphics().setDepth(4);
    bg.fillStyle(0x07071a, 0.85);
    bg.fillRect(0, 0, W, 100);

    createIconButton(this, {
      x: 60, y: 50, radius: 28,
      accentColor: this.world.accentColor,
      drawIcon: (g, size) => {
        g.lineStyle(5, 0xffffff, 1);
        g.lineBetween(size * 0.4, 0, -size * 0.3, 0);
        g.lineBetween(-size * 0.3, 0, 0, -size * 0.4);
        g.lineBetween(-size * 0.3, 0, 0, size * 0.4);
      },
      onClick: () => this.exitToLevelSelect()
    }).setDepth(15);

    this.add.text(400, 38, this.world.name, style('subhead', {
      fontSize: '28px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0.5).setDepth(15);

    this.add.text(400, 70, this.modeConfig.label.toUpperCase(), style('caption', {
      fontSize: '18px',
      fill: '#cfcfe0'
    })).setOrigin(0.5).setDepth(15);

    createIconButton(this, {
      x: 740, y: 50, radius: 28,
      accentColor: this.world.accentColor,
      drawIcon: (g, size) => this.drawSoundIcon(g, size, audio.enabled),
      onClick: () => audio.toggleEnabled()
    }).setDepth(15);
  }

  drawSoundIcon(g, size, isOn) {
    g.fillStyle(0xffffff, 1);
    g.fillRect(-size * 0.5, -size * 0.25, size * 0.3, size * 0.5);
    g.beginPath();
    g.moveTo(-size * 0.2, -size * 0.25);
    g.lineTo(size * 0.1, -size * 0.5);
    g.lineTo(size * 0.1, size * 0.5);
    g.lineTo(-size * 0.2, size * 0.25);
    g.closePath();
    g.fillPath();
    if (isOn) {
      g.lineStyle(3, 0xffffff, 0.9);
      g.beginPath();
      g.arc(size * 0.25, 0, size * 0.35, -Math.PI / 4, Math.PI / 4);
      g.strokePath();
    } else {
      g.lineStyle(3, 0xff6b6b, 1);
      g.lineBetween(size * 0.25, -size * 0.3, size * 0.6, size * 0.3);
      g.lineBetween(size * 0.6, -size * 0.3, size * 0.25, size * 0.3);
    }
  }

  drawTimeBar(pct) {
    this.timeBar.clear();
    const fillW = Math.max(0, Math.floor(W * pct));
    const color = pct > 0.4 ? this.world.accentColor : pct > 0.2 ? 0xf7dc6f : 0xff6b6b;
    this.timeBar.fillStyle(color, 1);
    this.timeBar.fillRect(0, 100, fillW, 8);
  }

  // ============================================================
  // SHIP HP ICONS
  // ============================================================
  createHpRow() {
    // HP row sits to the right of the pet HUD chip, above the stats row.
    const cx = 470;
    const cy = 140;
    this.hpIcons = [];
    for (let i = 0; i < SHIP_HP_MAX; i++) {
      const ix = cx + i * 42;
      const icon = this.add.container(ix, cy).setDepth(20);
      const heart = this.add.graphics();
      this.drawHeart(heart, true);
      icon.add(heart);
      icon.fullColor = true;
      icon.heart = heart;
      this.hpIcons.push(icon);
    }
    this.add.text(cx - 50, cy, 'HP', style('caption', {
      fontSize: '20px', fill: '#cfcfe0', fontStyle: '900'
    })).setOrigin(0.5).setDepth(20);
  }

  drawHeart(g, full) {
    g.clear();
    // Two circles + a downward triangle.
    const strokeColor = full ? 0xff8ba3 : 0x4a4a60;

    if (full) {
      g.fillStyle(0xff5c7c, 1);
      g.fillCircle(-7, -6, 9);
      g.fillCircle(7, -6, 9);
      g.fillTriangle(-15, -3, 15, -3, 0, 14);
    }
    g.lineStyle(2, strokeColor, full ? 0.9 : 1);
    g.strokeCircle(-7, -6, 9);
    g.strokeCircle(7, -6, 9);
    g.beginPath();
    g.moveTo(-15, -3);
    g.lineTo(0, 14);
    g.lineTo(15, -3);
    g.strokePath();

    if (full) {
      g.fillStyle(0xffffff, 0.45);
      g.fillCircle(-7, -8, 3);
    }
  }

  setHp(newHp) {
    this.shipHp = Math.max(0, newHp);
    this.hpIcons.forEach((icon, i) => {
      const filled = i < this.shipHp;
      if (icon.fullColor !== filled) {
        icon.fullColor = filled;
        this.drawHeart(icon.heart, filled);
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

  // ============================================================
  // STATS ROW
  // ============================================================
  createStatsRow() {
    // Compact band above the asteroid playfield. Smaller text so the asteroid
    // never visually clips the score row at spawn.
    const y = 215;
    this.streakText = this.add.text(180, y, '0', style('stat', {
      fontSize: '28px',
      fill: '#ff8b3d'
    })).setOrigin(0.5).setDepth(10);
    this.add.text(180, y + 24, 'STREAK', style('statLabel', {
      fontSize: '12px'
    })).setOrigin(0.5).setDepth(10);

    this.scoreText = this.add.text(400, y, '0', style('stat', {
      fontSize: '28px',
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(10);
    this.add.text(400, y + 24, 'SCORE', style('statLabel', {
      fontSize: '12px'
    })).setOrigin(0.5).setDepth(10);

    this.timeText = this.add.text(620, y, this.formatTime(this.timeLeft), style('stat', {
      fontSize: '28px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0.5).setDepth(10);
    this.add.text(620, y + 24, 'TIME', style('statLabel', {
      fontSize: '12px'
    })).setOrigin(0.5).setDepth(10);
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
    // Faint horizon line near the impact zone — gives the asteroid something
    // to "land on" visually rather than floating into the ship from nowhere.
    const horizon = this.add.graphics().setDepth(2);
    horizon.lineStyle(2, this.world.accentColor, 0.18);
    horizon.lineBetween(40, ASTEROID_IMPACT_Y + 24, W - 40, ASTEROID_IMPACT_Y + 24);

    // Player ship sits at the bottom of the play area.
    this.shipContainer = this.add.container(W / 2, SHIP_Y).setDepth(8);
    const ship = drawShip(this, 0, 0, {
      scale: 1.4,
      parts: progress.ship?.parts
    });
    this.shipContainer.add(ship);
    this.shipSprite = ship;

    // Pet rides on top of the ship — small overlay so the pet is always visible.
    if (companion.hasStarter()) {
      this.cockpitPet = drawCompanion(this, 0, -52, { scale: 0.36 });
      this.shipContainer.add(this.cockpitPet);
    }

    // Idle hover bob
    this.tweens.add({
      targets: this.shipContainer,
      y: SHIP_Y - 6,
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
      xLane = W / 2 + Phaser.Math.Between(-40, 40);
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
      fontSize: this.isBoss ? '72px' : '52px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6
    })).setOrigin(0.5);
    container.add(text);

    // Less rotation for boss — menacing, not chaotic.
    this.tweens.add({
      targets: container,
      angle: this.isBoss ? Phaser.Math.Between(-3, 3) : Phaser.Math.Between(-6, 6),
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Vary fall duration per asteroid in multi-asteroid mode so they desync.
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
      y: this.isBoss ? ASTEROID_IMPACT_Y - 60 : ASTEROID_IMPACT_Y,
      duration: fallSeconds * 1000,
      ease: 'Linear',
      onComplete: () => this.onAsteroidImpact(asteroid)
    });

    if (this.isBoss) {
      this.attachBossHpBar(container);
    }

    this.activeAsteroids.push(asteroid);

    // In multi-asteroid mode every asteroid is tappable so the player can
    // freely switch targets. Targeting the same asteroid is a no-op.
    if (this.asteroidSlots > 1) {
      const hit = this.add.rectangle(0, 0, 220, 220, 0x000000, 0).setInteractive({ useHandCursor: true });
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
    const points = 11;
    const path = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = radius * Phaser.Math.FloatBetween(0.88, 1.04);
      path.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }

    g.fillStyle(0x000000, 0.55);
    g.beginPath();
    g.moveTo(path[0].x + 8, path[0].y + 12);
    for (let i = 1; i < path.length; i++) g.lineTo(path[i].x + 8, path[i].y + 12);
    g.closePath();
    g.fillPath();

    // Tint the body in the world's accent so each villain has its own identity.
    const bodyColor = Phaser.Display.Color.ValueToColor(this.world.accentColor)
      .darken(50).color;
    g.fillStyle(bodyColor, 1);
    g.beginPath();
    g.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) g.lineTo(path[i].x, path[i].y);
    g.closePath();
    g.fillPath();

    g.fillStyle(this.world.accentColor, 0.45);
    g.beginPath();
    g.moveTo(path[0].x, path[0].y - 30);
    for (let i = 1; i < path.length / 2; i++) {
      g.lineTo(path[i].x * 0.85, path[i].y - 22);
    }
    g.closePath();
    g.fillPath();

    const eyeOffsetX = radius * 0.32;
    const eyeY = -radius * 0.22;
    g.fillStyle(0xff3b3b, 0.85);
    g.fillCircle(-eyeOffsetX, eyeY, 18);
    g.fillCircle(eyeOffsetX, eyeY, 18);
    g.fillStyle(0xffffaa, 1);
    g.fillCircle(-eyeOffsetX, eyeY, 8);
    g.fillCircle(eyeOffsetX, eyeY, 8);

    g.fillStyle(0x07071a, 0.85);
    for (let i = 0; i < 8; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.65;
      g.fillCircle(Math.cos(ang) * dist, Math.sin(ang) * dist + radius * 0.25,
        12 + Math.random() * 14);
    }

    g.lineStyle(5, 0x07071a, 0.95);
    g.beginPath();
    g.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) g.lineTo(path[i].x, path[i].y);
    g.closePath();
    g.strokePath();

    container.add(g);
  }

  attachBossHpBar(bossContainer) {
    // Sibling of the boss container so rotation drift doesn't affect the bar.
    const bar = this.add.container(bossContainer.x, bossContainer.y - ASTEROID_RADIUS * BOSS_CONFIG.asteroidScale - 50)
      .setDepth(8);
    const w = 360;
    const h = 22;
    const bg = this.add.graphics();
    bg.fillStyle(0x07071a, 0.92);
    bg.fillRoundedRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 12);
    bg.lineStyle(2, 0xff8080, 0.85);
    bg.strokeRoundedRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 12);
    bar.add(bg);

    const fill = this.add.graphics();
    bar.add(fill);
    bar.fillG = fill;
    bar.barW = w;
    bar.barH = h;

    const villainText = this.add.text(0, -h / 2 - 26, (this.world.villain || 'BOSS').toUpperCase(), style('caption', {
      fontSize: '18px', fill: '#ff8080', fontStyle: '900'
    })).setOrigin(0.5);
    bar.add(villainText);

    this.bossHpBar = bar;
    this.bossContainer = bossContainer;
    this.drawBossHp();
  }

  drawBossHp() {
    if (!this.bossHpBar) return;
    const { fillG, barW, barH } = this.bossHpBar;
    fillG.clear();
    const pct = Math.max(0, this.bossHp / BOSS_CONFIG.hp);
    const fillW = Math.max(0, Math.floor(barW * pct));
    const color = pct > 0.5 ? 0xff6b6b : pct > 0.25 ? 0xffaa44 : 0xff3030;
    fillG.fillStyle(color, 1);
    fillG.fillRoundedRect(-barW / 2, -barH / 2, fillW, barH, 8);
    fillG.lineStyle(2, 0x07071a, 0.6);
    for (let i = 1; i < BOSS_CONFIG.hp; i++) {
      const x = -barW / 2 + (barW / BOSS_CONFIG.hp) * i;
      fillG.lineBetween(x, -barH / 2, x, barH / 2);
    }
  }

  drawAsteroidBody(container) {
    const g = this.add.graphics();
    const radius = ASTEROID_RADIUS;
    const points = 9;
    const path = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = radius * Phaser.Math.FloatBetween(0.85, 1.05);
      path.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }

    // Shadow
    g.fillStyle(0x000000, 0.4);
    g.beginPath();
    g.moveTo(path[0].x + 4, path[0].y + 6);
    for (let i = 1; i < path.length; i++) g.lineTo(path[i].x + 4, path[i].y + 6);
    g.closePath();
    g.fillPath();

    // Rock body
    g.fillStyle(0x6a5a4a, 1);
    g.beginPath();
    g.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) g.lineTo(path[i].x, path[i].y);
    g.closePath();
    g.fillPath();

    // Highlight
    g.fillStyle(0x9a8a72, 0.7);
    g.beginPath();
    g.moveTo(path[0].x, path[0].y - 18);
    for (let i = 1; i < path.length / 2; i++) {
      g.lineTo(path[i].x * 0.85, path[i].y - 12);
    }
    g.closePath();
    g.fillPath();

    // Crater pocks
    g.fillStyle(0x3a2e22, 0.7);
    for (let i = 0; i < 4; i++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius * 0.55;
      g.fillCircle(Math.cos(ang) * dist, Math.sin(ang) * dist, 6 + Math.random() * 6);
    }

    // Outline
    g.lineStyle(3, 0x07071a, 0.9);
    g.beginPath();
    g.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) g.lineTo(path[i].x, path[i].y);
    g.closePath();
    g.strokePath();

    container.add(g);
  }

  targetAsteroid(asteroid) {
    if (!asteroid || !this.activeAsteroids.includes(asteroid)) return;
    this.targetedAsteroid = asteroid;
    this.problemStartedAtMs = asteroid.startedAtMs;
    this.refreshMcButtons(asteroid.problem);

    // Highlight the targeted asteroid (subtle outline pulse)
    if (this.targetReticle) this.targetReticle.destroy();
    if (this.asteroidSlots > 1) {
      const reticle = this.add.graphics();
      reticle.lineStyle(3, this.world.accentColor, 0.9);
      reticle.strokeCircle(0, 0, 130);
      asteroid.container.add(reticle);
      this.targetReticle = reticle;
    }
  }

  // ============================================================
  // MC BUTTONS — 4 for normal levels, 6 for boss (3×2 grid)
  // ============================================================
  createMcButtons() {
    const buttonCount = this.isBoss ? BOSS_CONFIG.buttonCount : 4;
    const cols = this.isBoss ? 3 : 2;
    const rows = Math.ceil(buttonCount / cols);
    const cellW = this.isBoss ? 230 : 340;
    const cellH = this.isBoss ? 110 : 120;
    const gap = 18;
    const totalW = cols * cellW + (cols - 1) * gap;
    const totalH = rows * cellH + (rows - 1) * gap;
    const startX = (W - totalW) / 2 + cellW / 2;
    const startY = 1240 - totalH;

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
    const container = this.add.container(x, y).setDepth(10);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-w / 2 + 2, -h / 2 + 6, w, h, 22);
    container.add(shadow);

    const bg = this.add.graphics();
    container.add(bg);

    const label = this.add.text(0, 0, '', style('display', {
      fontSize: '52px',
      fill: '#ffffff'
    })).setOrigin(0.5);
    container.add(label);

    // Index pill (1..4) — desktop keyboard hint
    const pill = this.add.graphics();
    pill.fillStyle(0x07071a, 0.7);
    pill.fillRoundedRect(-w / 2 + 12, -h / 2 + 12, 32, 28, 8);
    container.add(pill);
    const pillText = this.add.text(-w / 2 + 28, -h / 2 + 26, (index + 1).toString(), style('caption', {
      fontSize: '18px', fill: '#cfcfe0', fontStyle: '900'
    })).setOrigin(0.5);
    container.add(pillText);

    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
    container.add(hit);

    hit.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.04, duration: 110 });
    });
    hit.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 110 });
    });
    hit.on('pointerdown', () => {
      if (this.state !== 'playing') return;
      this.tweens.add({ targets: container, scaleX: 0.94, scaleY: 0.94, duration: 70, yoyo: true });
      this.handleMcChoice(index);
    });

    container.bg = bg;
    container.label = label;
    container.dimensions = { w, h };
    container.value = null;
    this.drawMcFace(container, 0x2a2a44);
    return container;
  }

  drawMcFace(container, color) {
    const { w, h } = container.dimensions;
    const radius = 22;
    const lighter = Phaser.Display.Color.ValueToColor(color).lighten(18).color;
    const darker = Phaser.Display.Color.ValueToColor(color).darken(20).color;

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
    // Shuffle
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }

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
    flash.fillRoundedRect(-w / 2, -h / 2, w, h - 6, 22);
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
    this.petHud?.munch(1);
    if (this.streak === 3 || this.streak === 7 || this.streak % 10 === 0) {
      audio.playPetChirp?.();
    }

    audio.playLaser?.();
    this.fireLaserAt(asteroid);

    economy.addStardust(1);

    if (asteroid.isBoss) {
      this.bossHp = Math.max(0, this.bossHp - 1);
      this.drawBossHp();
      audio.playBossImpact?.();
      this.recoilBoss(asteroid);

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

  handleWrong(asteroid, btn) {
    const pickedValue = btn.value;
    this.flashMcButton(btn, 0xff6b6b);
    audio.playWrong?.();

    // Disable this button so the same wrong tap can't spam.
    btn.value = null;
    btn.label.setColor('#5a5a72');
    btn.setAlpha(0.45);

    this.streak = 0;
    this.streakText.setText('0');

    if (asteroid.isBoss) {
      // Boss is harsher than a normal asteroid — wrong tap costs ship HP.
      this.attempts++;
      this.history.push({ problem: asteroid.problem, userAnswer: pickedValue, correct: false });
      progress.recordFactAttempt(asteroid.problem.a, asteroid.problem.b, false);
      records.recordAnswer(asteroid.problem, false, performance.now() - asteroid.startedAtMs);

      this.bossAttackBack(asteroid);
      this.damageShip();
      this.cockpitPet?.slumpSad?.();
      this.petHud?.droop();
      audio.playShipDamage?.();
      this.setHp(this.shipHp - 1);
      if (this.shipHp <= 0) this.failLevel();
    }
  }

  onAsteroidImpact(asteroid) {
    if (this.state === 'ended' || this.state === 'failed') return;
    if (asteroid.lockedOut) return;
    asteroid.lockedOut = true;

    this.attempts++;
    this.history.push({ problem: asteroid.problem, userAnswer: null, correct: false });
    progress.recordFactAttempt(asteroid.problem.a, asteroid.problem.b, false);
    records.recordAnswer(asteroid.problem, false, performance.now() - asteroid.startedAtMs);

    this.streak = 0;
    this.streakText.setText('0');

    this.damageShip();
    this.cockpitPet?.slumpSad?.();
    this.petHud?.droop();
    audio.playShipDamage?.();

    this.setHp(this.shipHp - 1);

    if (asteroid.isBoss) {
      // Re-arm so the next problem cycle can also trip impact.
      asteroid.lockedOut = false;
      if (this.shipHp <= 0) {
        this.failLevel();
        return;
      }
      // Lock input until the next boss problem is in place — otherwise the
      // stale buttons (still tied to the previous problem) accept clicks.
      this.state = 'feedback';
      this.bossAttackBack(asteroid);
      this.time.delayedCall(220, () => {
        if (this.state === 'failed' || this.state === 'ended') return;
        this.cycleBossProblem(asteroid);
        this.state = 'playing';
      });
      return;
    }

    this.explodeAsteroid(asteroid, { onShip: true });
    this.removeAsteroid(asteroid);

    if (this.shipHp <= 0) {
      this.failLevel();
      return;
    }

    this.time.delayedCall(280, () => {
      if (this.state === 'playing' || this.state === 'feedback') {
        this.spawnAsteroid();
      }
    });
  }

  // ============================================================
  // BOSS-SPECIFIC HELPERS
  // ============================================================
  recoilBoss(asteroid) {
    if (!asteroid?.container?.active) return;
    if (asteroid.fallTween) asteroid.fallTween.stop();
    // Recoil up + flash
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
    // Quick lurch toward the ship as the "attack" tell.
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
      y: ASTEROID_IMPACT_Y - 60,
      duration: this.problemSeconds * 1000,
      ease: 'Linear',
      onComplete: () => this.onAsteroidImpact(asteroid)
    });

    this.refreshMcButtons(newProblem);
    this.problemStartedAtMs = asteroid.startedAtMs;
  }

  defeatBoss(asteroid) {
    this.bossDefeated = true;
    this.state = 'feedback';
    if (asteroid.fallTween) asteroid.fallTween.stop();

    audio.playAsteroidBoom?.();
    this.cameras.main.shake(620, 0.022);

    // Big multi-burst explosion
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
    const startY = this.shipContainer.y - 40;
    const targetX = asteroid.container.x;
    const targetY = asteroid.container.y;

    const laser = this.add.graphics().setDepth(9);
    laser.lineStyle(8, 0x81ecec, 1);
    laser.lineBetween(startX, startY, targetX, targetY);
    laser.lineStyle(3, 0xffffff, 1);
    laser.lineBetween(startX, startY, targetX, targetY);
    this.tweens.add({
      targets: laser,
      alpha: 0,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => laser.destroy()
    });

    // Slight forward thrust on the ship
    this.tweens.add({
      targets: this.shipContainer,
      y: SHIP_Y - 18,
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
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 60 + Math.random() * 80;
      const shard = this.add.graphics().setDepth(9);
      shard.fillStyle(colors[i % colors.length], 1);
      shard.fillCircle(0, 0, 4 + Math.random() * 4);
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

    // Flash ring
    const ring = this.add.graphics().setDepth(9);
    ring.lineStyle(6, 0xffffff, 1);
    ring.strokeCircle(0, 0, 30);
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
    if (asteroid.fallTween) {
      asteroid.fallTween.stop();
    }
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
      // Hand off to next active asteroid if there is one (multi-asteroid mode).
      const next = this.activeAsteroids[0];
      if (next) this.targetAsteroid(next);
    }
  }

  damageShip() {
    // Red flash on ship sprite
    const flash = this.add.graphics().setDepth(10);
    flash.fillStyle(0xff6b6b, 0.6);
    flash.fillCircle(0, 0, 80);
    this.shipContainer.add(flash);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 380,
      onComplete: () => flash.destroy()
    });

    // Screen shake
    this.cameras.main.shake(280, 0.012);
  }

  // ============================================================
  // UPDATE LOOP — round timer
  // ============================================================
  update(_time, delta) {
    if (this.state !== 'playing' && this.state !== 'feedback') return;

    if (this.bossHpBar?.active && this.bossContainer?.active) {
      this.bossHpBar.x = this.bossContainer.x;
      this.bossHpBar.y = this.bossContainer.y - ASTEROID_RADIUS * BOSS_CONFIG.asteroidScale - 50;
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
  // FAIL — ship destroyed
  // ============================================================
  failLevel() {
    this.state = 'failed';
    audio.playLevelFailed?.();

    // Stop all asteroids
    this.activeAsteroids.forEach(a => {
      if (a.fallTween) a.fallTween.stop();
      if (a.container?.active) a.container.destroy();
    });
    this.activeAsteroids = [];

    // Big screen shake to sell the destruction
    this.cameras.main.shake(600, 0.025);

    streak.registerPlayDay();

    this.time.delayedCall(700, () => this.showFailScreen());
  }

  showFailScreen() {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.8, duration: 350 });

    const panelW = 640;
    const panelH = 480;
    const panel = this.add.container(W / 2, H + panelH / 2).setDepth(60);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.98);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 28);
    bg.lineStyle(3, 0xff6b6b, 0.9);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 28);
    panel.add(bg);

    panel.add(this.add.text(0, -panelH / 2 + 70, 'Ship Destroyed', style('display', {
      fontSize: '48px',
      fill: '#ff6b6b'
    })).setOrigin(0.5));

    panel.add(this.add.text(0, -panelH / 2 + 130, 'Five hits and the hull gave way.', style('body', {
      fill: '#cfcfe0', fontSize: '22px'
    })).setOrigin(0.5));

    panel.add(this.add.text(0, -panelH / 2 + 170, 'Try again, pilot.', style('body', {
      fill: '#cfcfe0', fontSize: '22px'
    })).setOrigin(0.5));

    // Stats: how far they got
    panel.add(this.add.text(-120, 0, this.score.toString(), style('display', {
      fontSize: '54px', fill: '#ffffff'
    })).setOrigin(0.5));
    panel.add(this.add.text(-120, 50, 'CORRECT', style('caption')).setOrigin(0.5));

    panel.add(this.add.text(120, 0, this.bestStreak.toString(), style('display', {
      fontSize: '54px', fill: '#ff8b3d'
    })).setOrigin(0.5));
    panel.add(this.add.text(120, 50, 'BEST STREAK', style('caption')).setOrigin(0.5));

    const btnY = panelH / 2 - 80;
    const retryBtn = createButton(this, {
      x: -120, y: btnY, label: 'Retry',
      width: 220, height: 76,
      color: this.world.accentColor,
      onClick: () => this.scene.restart()
    });
    panel.add(retryBtn);

    const exitBtn = createButton(this, {
      x: 120, y: btnY, label: 'Exit',
      width: 220, height: 76,
      color: 0x4a4a6a,
      onClick: () => this.exitToLevelSelect()
    });
    panel.add(exitBtn);

    this.tweens.add({
      targets: panel,
      y: H / 2,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }

  // ============================================================
  // END OF ROUND — round timer hit zero or boss defeated
  // ============================================================
  endRound({ bossWin } = {}) {
    this.state = 'ended';
    audio.playRoundComplete?.();

    // Halt remaining asteroids
    this.activeAsteroids.forEach(a => {
      if (a.fallTween) a.fallTween.stop();
    });

    const accuracy = this.attempts > 0 ? Math.round((this.score / this.attempts) * 100) : 0;
    const stars = bossWin
      ? this.calculateBossStars()
      : this.calculateStars(this.score, accuracy);

    progress.completeLevel(this.worldId, this.currentLevel, stars);

    if (stars > 0) {
      economy.addStardust(stars * 5);
    }

    streak.registerPlayDay();
    this.newStreakMilestones = streak.consumeNewMilestones();
    this.streakRewards = grantStreakRewards(this.newStreakMilestones || []);
    this.randomDrop = stars > 0 ? rollLevelEndDrop(stars) : null;
    records.recordLevelComplete(this.worldId, stars, this.bestStreak);

    // World fully cleared (4/4)? Story card or full cinematic.
    const worldFullyCleared = progress.isWorldFullyCleared(this.worldId);

    if (bossWin && this.worldId === 11 && worldFullyCleared) {
      this.showFinalCinematic({ stars, accuracy });
    } else if (bossWin && worldFullyCleared) {
      this.showStoryCard({ stars, accuracy });
    } else {
      this.showSummary({ stars, accuracy, bossWin });
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

  showSummary({ stars, accuracy, bossWin }) {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setDepth(50).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.7, duration: 350 });

    const panelW = 700;
    const panelH = 980;
    const panel = this.add.container(W / 2, H + panelH / 2).setDepth(60);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.98);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 28);
    bg.lineStyle(3, bossWin ? 0xff6b6b : this.world.accentColor, 0.9);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 28);
    panel.add(bg);

    panel.add(this.add.text(0, -panelH / 2 + 60, bossWin ? 'Boss Defeated!' : 'Time’s Up!', style('display', {
      fontSize: '48px'
    })).setOrigin(0.5));

    panel.add(this.add.text(0, -panelH / 2 + 110, this.modeConfig.label.toUpperCase(), style('caption', {
      fill: '#cfcfe0', fontSize: '20px'
    })).setOrigin(0.5));

    const starY = -panelH / 2 + 200;
    for (let i = 0; i < 3; i++) {
      const filled = i < stars;
      const star = this.makeStarShape(filled);
      star.x = -110 + i * 110;
      star.y = starY;
      star.setScale(0);
      panel.add(star);
      this.tweens.add({
        targets: star,
        scale: 1,
        duration: 250,
        delay: 700 + i * 200,
        ease: 'Back.easeOut',
        onStart: () => filled && audio.playStar()
      });
    }

    const statY = starY + 160;
    panel.add(this.add.text(-160, statY, this.score.toString(), style('display', {
      fontSize: '64px',
      fill: '#ffffff'
    })).setOrigin(0.5));
    panel.add(this.add.text(-160, statY + 50, 'CORRECT', style('caption')).setOrigin(0.5));

    panel.add(this.add.text(0, statY, `${accuracy}%`, style('display', {
      fontSize: '64px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0.5));
    panel.add(this.add.text(0, statY + 50, 'ACCURACY', style('caption')).setOrigin(0.5));

    panel.add(this.add.text(160, statY, this.bestStreak.toString(), style('display', {
      fontSize: '64px',
      fill: '#ff8b3d'
    })).setOrigin(0.5));
    panel.add(this.add.text(160, statY + 50, 'BEST STREAK', style('caption')).setOrigin(0.5));

    if (this.newStreakMilestones && this.newStreakMilestones.length > 0) {
      const m = this.newStreakMilestones[0];
      const reward = (this.streakRewards || []).find(r => r);
      const banner = this.add.container(0, -panelH / 2 + 30);
      const bannerBg = this.add.graphics();
      bannerBg.fillStyle(0xff8b3d, 1);
      bannerBg.fillRoundedRect(-260, -28, 520, 56, 28);
      banner.add(bannerBg);
      const label = reward
        ? `🔥 ${m}-day streak — unlocked ${reward.item.name}!`
        : `🔥 ${m}-day streak unlocked!`;
      banner.add(this.add.text(0, 0, label, style('subhead', {
        fontSize: '22px',
        fill: '#1a0a00',
        fontStyle: '900'
      })).setOrigin(0.5));
      panel.add(banner);
      this.tweens.add({
        targets: banner,
        scale: { from: 0.6, to: 1 },
        duration: 400,
        delay: 1200,
        ease: 'Back.easeOut'
      });
    }

    if (this.randomDrop) {
      const dropY = (this.newStreakMilestones && this.newStreakMilestones.length > 0)
        ? -panelH / 2 + 92
        : -panelH / 2 + 30;
      const banner = this.add.container(0, dropY);
      const bannerBg = this.add.graphics();
      bannerBg.fillStyle(0xc77eff, 1);
      bannerBg.fillRoundedRect(-260, -26, 520, 52, 26);
      banner.add(bannerBg);
      banner.add(this.add.text(0, 0, `✨ Surprise drop: ${this.randomDrop.item.name}!`, style('subhead', {
        fontSize: '22px',
        fill: '#1a0a26',
        fontStyle: '900'
      })).setOrigin(0.5));
      panel.add(banner);
      this.tweens.add({
        targets: banner,
        scale: { from: 0.6, to: 1 },
        duration: 400,
        delay: 1500,
        ease: 'Back.easeOut'
      });
    }

    const weakFacts = this.getWeakFactsFromHistory();
    const reviewY = statY + 130;
    panel.add(this.add.text(0, reviewY, weakFacts.length ? 'Practice these' : 'No tricky facts!', style('subhead', {
      fontSize: '24px',
      fill: '#cfcfe0'
    })).setOrigin(0.5));

    weakFacts.slice(0, 3).forEach((wf, i) => {
      const wy = reviewY + 50 + i * 56;
      panel.add(this.add.text(0, wy, `${wf.display} = ${wf.answer}`, style('subhead', {
        fontSize: '32px',
        fill: '#f7dc6f'
      })).setOrigin(0.5));
    });

    if (companion.hasStarter() && this.petHud) {
      const petY = reviewY + 230;
      const pet = drawCompanion(this, 0, petY, { scale: 0.7 });
      panel.add(pet);

      const fedText = this.add.text(0, petY + 60,
        `Fed ${this.petHud.pelletsThisLevel} pellets to ${companion.getSpecies().name}!`,
        style('subhead', { fontSize: '22px', fill: '#f7dc6f' })
      ).setOrigin(0.5);
      panel.add(fedText);

      this.tweens.add({
        targets: pet,
        scaleX: 0.92,
        scaleY: 0.6,
        duration: 180,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
        delay: 600
      });
    }

    const btnY = panelH / 2 - 130;
    const retryBtn = createButton(this, {
      x: -130, y: btnY, label: 'Retry',
      width: 240, height: 80,
      color: 0x4a4a6a,
      onClick: () => this.scene.restart()
    });
    panel.add(retryBtn);

    const continueBtn = createButton(this, {
      x: 130, y: btnY, label: 'Continue',
      width: 240, height: 80,
      color: this.world.accentColor,
      onClick: () => this.exitToLevelSelect()
    });
    panel.add(continueBtn);

    this.tweens.add({
      targets: panel,
      y: H / 2,
      duration: 500,
      ease: 'Back.easeOut'
    });
  }

  makeStarShape(filled) {
    const g = this.add.graphics();
    const points = 5;
    const outerR = 36;
    const innerR = 16;
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
    if (filled) {
      g.fillStyle(0xf7dc6f, 1);
      g.fillPath();
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(-outerR * 0.3, -outerR * 0.3, outerR * 0.18);
    } else {
      g.lineStyle(3, 0x6a6a80, 1);
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

  // ============================================================
  // STORY CARD — shown after world is fully cleared (boss + 3 levels done)
  // ============================================================
  showStoryCard({ stars }) {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0)
      .setDepth(50).setInteractive();
    this.tweens.add({ targets: overlay, alpha: 0.85, duration: 400 });

    const panelW = 720;
    const panelH = 460;
    const panel = this.add.container(W / 2, H + panelH / 2).setDepth(60);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.98);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 28);
    bg.lineStyle(3, this.world.accentColor, 0.95);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 28);
    panel.add(bg);

    panel.add(this.add.text(0, -panelH / 2 + 60, 'World Cleared', style('display', {
      fontSize: '44px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0.5));

    panel.add(this.add.text(0, -panelH / 2 + 120, this.world.name, style('subhead', {
      fontSize: '28px',
      fill: '#ffffff'
    })).setOrigin(0.5));

    // Stars row for the boss level itself
    const starY = -panelH / 2 + 190;
    for (let i = 0; i < 3; i++) {
      const filled = i < stars;
      const star = this.makeStarShape(filled);
      star.x = -90 + i * 90;
      star.y = starY;
      star.setScale(0);
      panel.add(star);
      this.tweens.add({
        targets: star,
        scale: 0.85,
        duration: 250,
        delay: 600 + i * 180,
        ease: 'Back.easeOut',
        onStart: () => filled && audio.playStar()
      });
    }

    // Story flavor — single line read-and-dismiss
    panel.add(this.add.text(0, 50, this.world.flavorText || 'World cleared.', style('body', {
      fontSize: '24px',
      fill: '#cfcfe0',
      align: 'center',
      wordWrap: { width: panelW - 100 }
    })).setOrigin(0.5));

    const continueBtn = createButton(this, {
      x: 0, y: panelH / 2 - 80, label: 'Onward',
      width: 280, height: 80,
      color: this.world.accentColor,
      onClick: () => this.exitToLevelSelect()
    });
    panel.add(continueBtn);

    this.tweens.add({
      targets: panel,
      y: H / 2,
      duration: 520,
      ease: 'Back.easeOut'
    });
  }

  // ============================================================
  // FINAL CINEMATIC — world 11 boss defeated, the universe is saved
  // ============================================================
  showFinalCinematic() {
    const cards = [
      'The Void Devourer cracks. Light leaks through.',
      'Across the galaxy, dark worlds flicker awake.',
      'Stars relight. Old constellations remember their names.',
      'You did it, pilot. The universe is yours again.'
    ];

    // Solid black backdrop covering the whole scene
    const backdrop = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0)
      .setDepth(40).setInteractive();
    this.tweens.add({ targets: backdrop, alpha: 0.95, duration: 700 });

    // Stars relighting effect: dozens of dots fade in across the field
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
      const cardW = 700;
      const cardH = 220;
      const card = this.add.container(0, 30);
      const bg = this.add.graphics();
      bg.fillStyle(0x12122a, 0.92);
      bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 22);
      bg.lineStyle(3, 0xffeaa7, 0.95);
      bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 22);
      card.add(bg);
      card.add(this.add.text(0, 0, text, style('subhead', {
        fontSize: '28px',
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
          const pet = drawCompanion(this, 0, cardH / 2 + 90, { scale: 0.85 });
          cardContainer.add(pet);
          this.tweens.add({
            targets: pet,
            y: cardH / 2 + 60,
            scaleX: 0.92,
            scaleY: 0.78,
            duration: 280,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut'
          });
          const btn = createButton(this, {
            x: 0, y: cardH / 2 + 220, label: 'Onward',
            width: 280, height: 80,
            color: 0xffeaa7,
            onClick: () => this.exitToLevelSelect()
          });
          cardContainer.add(btn);
        });
      } else {
        this.time.delayedCall(2400, advance);
      }
    };

    this.time.delayedCall(900, () => showCard(cards[0], false));
  }

  // ============================================================
  // EXIT
  // ============================================================
  exitToLevelSelect() {
    this.scene.start('LevelSelectScene');
  }
}
