// Mission Briefing — the world's biome art fills the background, four mission
// cards in front (×, ÷, mixed, boss). Locked modes show a lock icon.

import Phaser from 'phaser';
import { WORLDS, MODES, progress } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { drawWorldNode } from '../WorldNodeArt.js';
import {
  drawArrowLeftIcon, drawSoundIcon, drawSkullIcon,
  drawStarIcon, drawLockIcon
} from '../StatIcons.js';

const W = 1080;
const H = 1920;

const LEVEL_MODES = ['mult', 'div', 'mixed', 'boss'];

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

    createStarfield(this, {
      width: W, height: H,
      accentColor: this.world.accentColor,
      accentStrength: 0.20
    });

    this.createTopBar();
    this.createWorldHero();
    this.createMissionCards();
    this.createMasteryFooter();

    new TransitionManager(this).fadeIn(280);
  }

  createTopBar() {
    const bg = this.add.graphics().setDepth(4);
    bg.fillStyle(0x07071a, 0.92);
    bg.fillRect(0, 0, W, 220);

    createIconButton(this, {
      x: 80, y: 110, radius: 44,
      accentColor: this.world.accentColor,
      drawIcon: (g, size) => drawArrowLeftIcon(g, 0, 0, size),
      onClick: () => new TransitionManager(this).fadeToScene('WorldMapScene')
    }).setDepth(15);

    this.add.text(W / 2, 70, 'MISSION BRIEFING', style('caption', {
      fontSize: '40px',
      fill: '#cfcfe0',
      fontStyle: '900'
    })).setOrigin(0.5).setDepth(15);

    this.add.text(W / 2, 145, this.world.name, style('display', {
      fontSize: '78px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0.5).setDepth(15);

    createIconButton(this, {
      x: W - 80, y: 110, radius: 44,
      accentColor: this.world.accentColor,
      drawIcon: (g, size) => drawSoundIcon(g, 0, 0, size, 0xffffff, audio.enabled),
      onClick: () => audio.toggleEnabled()
    }).setDepth(15);
  }

  createWorldHero() {
    const hero = drawWorldNode(this, W / 2, 530, this.world.id, { scale: 3.0 });
    hero.setDepth(5).setAlpha(0.75);
    this.tweens.add({
      targets: hero,
      y: 520,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(W / 2, 800, this.world.description, style('subhead', {
      fontSize: '40px',
      fill: '#e8e8f0',
      align: 'center',
      wordWrap: { width: W - 120 }
    })).setOrigin(0.5).setDepth(8);
  }

  createMissionCards() {
    const startY = 900;
    const cardW = 480;
    const cardH = 220;
    const gapX = 28;
    const gapY = 36;
    const cols = 2;
    const rowWidth = cols * cardW + (cols - 1) * gapX;
    const startX = W / 2 - rowWidth / 2 + cardW / 2;

    LEVEL_MODES.forEach((modeKey, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY) + cardH / 2;
      const levelNum = i + 1;
      const isBoss = modeKey === 'boss';
      const stars = this.worldProgress.levelStars[levelNum] || 0;

      // Boss is locked until the other 3 are done
      const others = [1, 2, 3].filter(n => n !== levelNum);
      const otherStars = others.every(n => (this.worldProgress.levelStars[n] || 0) > 0);
      const isLocked = isBoss && !otherStars;

      this.createMissionCard(x, y, cardW, cardH, levelNum, modeKey, stars, isBoss, isLocked);
    });
  }

  createMissionCard(x, y, w, h, levelNum, modeKey, stars, isBoss, isLocked) {
    const c = this.add.container(x, y).setDepth(10);
    const accent = isBoss ? 0xff6b6b : this.world.accentColor;

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-w / 2 + 2, -h / 2 + 8, w, h, 24);
    c.add(shadow);

    const card = this.add.graphics();
    card.fillStyle(0x12122a, 0.94);
    card.fillRoundedRect(-w / 2, -h / 2, w, h, 24);
    card.lineStyle(3, accent, isLocked ? 0.4 : 0.9);
    card.strokeRoundedRect(-w / 2, -h / 2, w, h, 24);
    c.add(card);

    // Title row sits in the top half so stars can breathe at the bottom.
    const titleRowY = -h / 4 + 6;

    const iconG = this.add.graphics();
    iconG.x = -w / 2 + 78;
    iconG.y = titleRowY;
    if (isBoss) {
      drawSkullIcon(iconG, 0, 0, 36);
    } else {
      this.drawModeGlyph(iconG, modeKey, accent);
    }
    c.add(iconG);

    const label = isBoss ? 'BOSS' : MODES[modeKey].label.toUpperCase();
    c.add(this.add.text(-w / 2 + 138, titleRowY, label, style('display', {
      fontSize: '46px',
      fill: '#ffffff',
      fontStyle: '900'
    })).setOrigin(0, 0.5));

    if (isBoss) {
      c.add(this.add.text(0, 14, this.world.villain || 'BOSS', style('subhead', {
        fontSize: '28px',
        fill: '#ff8b8b',
        fontStyle: '900'
      })).setOrigin(0.5));
    }

    // Stars centered along the bottom — three slots with even gaps.
    const starY = h / 2 - 36;
    const starGap = 64;
    for (let s = 0; s < 3; s++) {
      const starG = this.add.graphics();
      drawStarIcon(starG, 0, 0, 24, s < stars ? 0xf7dc6f : 0x4a4a60);
      starG.x = (s - 1) * starGap;
      starG.y = starY;
      c.add(starG);
    }

    if (isLocked) {
      const lockG = this.add.graphics();
      drawLockIcon(lockG, 0, 0, 30);
      lockG.x = w / 2 - 38;
      lockG.y = -h / 2 + 36;
      c.add(lockG);
      const overlay = this.add.graphics();
      overlay.fillStyle(0x000000, 0.5);
      overlay.fillRoundedRect(-w / 2, -h / 2, w, h, 24);
      c.add(overlay);
    }

    if (!isLocked) {
      const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
      c.add(hit);
      hit.on('pointerover', () => this.tweens.add({ targets: c, scaleX: 1.04, scaleY: 1.04, duration: 110 }));
      hit.on('pointerout', () => this.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 110 }));
      hit.on('pointerdown', () => {
        audio.playClick();
        this.startLevel(levelNum, modeKey);
      });
    }
  }

  drawModeGlyph(g, modeKey, color) {
    g.lineStyle(8, color, 1);
    if (modeKey === 'mult') {
      g.lineBetween(-22, -22, 22, 22);
      g.lineBetween(22, -22, -22, 22);
    } else if (modeKey === 'div') {
      g.fillStyle(color, 1);
      g.fillCircle(0, -16, 6);
      g.fillCircle(0, 16, 6);
      g.lineBetween(-24, 0, 24, 0);
    } else if (modeKey === 'mixed') {
      g.lineBetween(-20, -16, 20, 16);
      g.lineBetween(20, -16, -20, 16);
      g.fillStyle(color, 1);
      g.fillCircle(0, 22, 4);
    }
  }

  createMasteryFooter() {
    const y = 1560;
    let masterySum = 0;
    let count = 0;
    for (let t = 1; t <= 12; t++) {
      const m = progress.getTableMastery(t);
      if (m > 0) {
        masterySum += m;
        count++;
      }
    }
    const avg = count > 0 ? Math.round(masterySum / count) : 0;

    this.add.text(W / 2, y, 'OVERALL MASTERY', style('subhead', {
      fontSize: '44px',
      fill: '#cfcfe0',
      fontStyle: '900'
    })).setOrigin(0.5).setDepth(11);

    const barW = 800;
    const barX = W / 2 - barW / 2;
    const barY = y + 70;
    const barH = 36;
    const trackG = this.add.graphics().setDepth(11);
    trackG.fillStyle(0x12122a, 1);
    trackG.fillRoundedRect(barX, barY, barW, barH, 18);
    trackG.lineStyle(2, 0x2a2a44, 1);
    trackG.strokeRoundedRect(barX, barY, barW, barH, 18);

    const fillW = Math.max(2, Math.round((avg / 100) * barW));
    const fillG = this.add.graphics().setDepth(12);
    const fillColor = avg >= 70 ? 0x58d68d : avg >= 40 ? this.world.accentColor : 0xff6b6b;
    fillG.fillStyle(fillColor, 1);
    fillG.fillRoundedRect(barX, barY, fillW, barH, 18);

    this.add.text(W / 2, barY + barH / 2, `${avg}%`, style('subhead', {
      fontSize: '28px',
      fill: '#0a0a1a',
      fontStyle: '900'
    })).setOrigin(0.5).setDepth(13);

    const totalStars = Object.values(this.worldProgress.levelStars).reduce((s, v) => s + v, 0);
    this.add.text(W / 2, barY + barH + 50, `${totalStars} / 12 stars in this world`, style('subhead', {
      fontSize: '34px',
      fill: '#aaaac0'
    })).setOrigin(0.5).setDepth(11);
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
