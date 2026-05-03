import Phaser from 'phaser';
import { WORLDS, MODES, progress } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';

const W = 800;
const H = 1400;

// Level number → mode key
const LEVEL_MODES = ['mult', 'div', 'mixed', 'speed', 'missing', 'multi'];

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create() {
    const worldId = this.registry.get('selectedWorld') || 1;
    this.world = WORLDS[worldId - 1];
    this.worldProgress = progress.getWorldProgress(worldId);

    this.events.on('wake', this.onSceneWake, this);
    this.events.on('resume', this.onSceneWake, this);
    this.events.once('shutdown', () => {
      this.events.off('wake', this.onSceneWake, this);
      this.events.off('resume', this.onSceneWake, this);
    });

    // === Background ===
    createStarfield(this, {
      accentColor: this.world.accentColor,
      accentStrength: 0.18
    });

    // === Top bar ===
    this.createTopBar();

    // === World identity ===
    this.createWorldHeader();

    // === Mode cards (4 cards in 2x2 grid) ===
    this.createModeGrid();

    // === Mastery section ===
    this.createMasterySection();

    new TransitionManager(this).fadeIn(300);
  }

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
      onClick: () => {
        new TransitionManager(this).fadeToScene('WorldMapScene');
      }
    }).setDepth(15);

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

  createWorldHeader() {
    const icon = this.add.image(400, 200, `world_${this.world.id}`).setScale(2.4).setDepth(10);
    this.tweens.add({
      targets: icon,
      y: 188,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(400, 290, this.world.name, style('display', {
      fontSize: '52px'
    })).setOrigin(0.5).setDepth(10);

    this.add.text(400, 348, this.world.description, style('body', {
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0'),
      fontSize: '22px',
      align: 'center',
      wordWrap: { width: 700 }
    })).setOrigin(0.5).setDepth(10);
  }

  createModeGrid() {
    const startY = 410;
    const cardW = 230;
    const cardH = 220;
    const gapX = 18;
    const gapY = 22;
    const cols = 3;
    const rowWidth = cols * cardW + (cols - 1) * gapX;
    const startX = 400 - rowWidth / 2 + cardW / 2;

    LEVEL_MODES.forEach((modeKey, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY) + cardH / 2;
      const levelNum = i + 1;
      const mode = MODES[modeKey];
      const stars = this.worldProgress.levelStars[levelNum] || 0;
      // All modes are always playable — no sequential gate.
      this.createModeCard(x, y, cardW, cardH, levelNum, modeKey, mode, stars, true);
    });
  }

  createModeCard(x, y, w, h, levelNum, modeKey, mode, stars, isUnlocked) {
    const container = this.add.container(x, y).setDepth(10);

    const accent = isUnlocked ? this.world.accentColor : 0x3a3a4a;

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-w / 2 + 2, -h / 2 + 6, w, h, 22);
    container.add(shadow);

    const card = this.add.graphics();
    card.fillStyle(0x12122a, isUnlocked ? 0.95 : 0.75);
    card.fillRoundedRect(-w / 2, -h / 2, w, h, 22);
    card.lineStyle(3, accent, isUnlocked ? 0.85 : 0.4);
    card.strokeRoundedRect(-w / 2, -h / 2, w, h, 22);
    container.add(card);

    // Mode icon (the operator symbol)
    const symbolText = this.add.text(0, -h / 2 + 60, mode.symbol, style('display', {
      fontSize: '64px',
      fill: '#' + accent.toString(16).padStart(6, '0'),
      strokeThickness: 0
    })).setOrigin(0.5);
    container.add(symbolText);

    // Mode label
    const labelText = this.add.text(0, -h / 2 + 130, mode.label, style('headline', {
      fontSize: '26px',
      fill: isUnlocked ? '#ffffff' : '#5a5a72'
    })).setOrigin(0.5);
    container.add(labelText);

    if (isUnlocked) {
      // Stars row
      const starY = h / 2 - 38;
      for (let s = 0; s < 3; s++) {
        const filled = s < stars;
        const star = this.makeMiniStar(filled);
        star.x = -54 + s * 54;
        star.y = starY;
        container.add(star);
      }

      // Hit area
      const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
      container.add(hit);

      hit.on('pointerover', () => {
        this.tweens.add({ targets: container, scaleX: 1.04, scaleY: 1.04, duration: 110 });
      });
      hit.on('pointerout', () => {
        this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 110 });
      });
      hit.on('pointerdown', () => {
        audio.playClick();
        this.startLevel(levelNum, modeKey);
      });
    } else {
      // Lock indicator
      const lockY = h / 2 - 50;
      const lock = this.add.graphics();
      lock.fillStyle(0x5a5a72, 1);
      lock.fillRoundedRect(-18, lockY - 12, 36, 24, 4);
      lock.lineStyle(4, 0x5a5a72, 1);
      lock.beginPath();
      lock.arc(0, lockY - 14, 12, Math.PI, 0);
      lock.strokePath();
      container.add(lock);
    }
  }

  makeMiniStar(filled) {
    const g = this.add.graphics();
    const points = 5;
    const outerR = 18;
    const innerR = 8;
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
    } else {
      g.lineStyle(2, 0x4a4a60, 1);
      g.strokePath();
    }
    return g;
  }

  createMasterySection() {
    const y = 1180;
    // Global 12×12 mastery, averaged across every fact the player has attempted.
    const masteries = [];
    for (let t = 1; t <= 12; t++) {
      const m = progress.getTableMastery(t);
      if (m > 0) masteries.push(m);
    }
    const avgMastery = masteries.length
      ? Math.round(masteries.reduce((a, b) => a + b, 0) / masteries.length)
      : 0;

    this.add.text(400, y, 'Overall Mastery', style('subhead', {
      fontSize: '24px',
      fill: '#cfcfe0'
    })).setOrigin(0.5).setDepth(10);

    const barW = 520;
    const barX = 400 - barW / 2;
    const barY = y + 38;

    const trackG = this.add.graphics().setDepth(10);
    trackG.fillStyle(0x12122a, 1);
    trackG.fillRoundedRect(barX, barY, barW, 18, 9);
    trackG.lineStyle(2, 0x2a2a44, 1);
    trackG.strokeRoundedRect(barX, barY, barW, 18, 9);

    const fillW = Math.max(2, Math.round((avgMastery / 100) * barW));
    const fillG = this.add.graphics().setDepth(11);
    const fillColor = avgMastery >= 70 ? 0x58d68d : avgMastery >= 40 ? this.world.accentColor : 0xff6b6b;
    fillG.fillStyle(fillColor, 1);
    fillG.fillRoundedRect(barX, barY, fillW, 18, 9);

    this.add.text(400, barY + 9, `${avgMastery}%`, style('caption', {
      fontSize: '16px',
      fill: '#0a0a1a',
      fontStyle: '900'
    })).setOrigin(0.5).setDepth(12);

    const totalStars = Object.values(this.worldProgress.levelStars).reduce((s, v) => s + v, 0);
    this.add.text(400, barY + 60, `${totalStars} / 12 stars in this world`, style('caption', {
      fontSize: '20px',
      fill: '#8888a0'
    })).setOrigin(0.5).setDepth(10);
  }

  startLevel(levelNum, modeKey) {
    this.registry.set('currentWorldId', this.world.id);
    this.registry.set('currentLevel', levelNum);
    this.registry.set('levelMode', modeKey);

    this.input.enabled = false;
    new TransitionManager(this).fadeToScene('GameScene');
  }

  onSceneWake() {
    this.scene.restart();
  }
}
