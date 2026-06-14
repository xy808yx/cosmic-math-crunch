// Mission Briefing — the world's biome art fills the background, four mission
// cards in front (×, ÷, mixed, boss). Locked modes show a lock icon.

import Phaser from 'phaser';
import { WORLDS, MODES, progress, findWorld } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { music } from '../MusicManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton, createProgressBar } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { drawWorldNode } from '../WorldNodeArt.js';
import {
  drawArrowLeftIcon, drawSoundIcon, drawSkullIcon,
  drawStarIcon, drawLockIcon
} from '../StatIcons.js';
import { COLORS } from '../colorPalette.js';

const W = 1080;
const H = 1920;

const LEVEL_MODES = ['mult', 'div', 'mixed', 'boss'];

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  create() {
    music.ensurePlaying(this);
    // Defense-in-depth: LevelSelect is a campaign / free-play entry, never an
    // arcade one. Clear any arcadeMode left over so a level tapped here can't
    // accidentally launch GameScene in arcade mode.
    this.registry.set('arcadeMode', null);
    this.registry.set('arcadeState', null);
    const worldId = this.registry.get('selectedWorld') || 1;
    this.world = findWorld(worldId) || WORLDS[0];
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
    bg.fillStyle(COLORS.bgDark, 0.92);
    bg.fillRect(0, 0, W, 220);

    createIconButton(this, {
      x: 80, y: 110, radius: 44,
      accentColor: this.world.accentColor,
      drawIcon: (g, size) => drawArrowLeftIcon(g, 0, 0, size),
      onClick: () => new TransitionManager(this).fadeToScene('WorldMapScene')
    }).setDepth(15);

    this.add.text(W / 2, 70, 'MISSION BRIEFING', style('headline', {
      fill: '#cfcfe0',
      fontStyle: '900'
    })).setOrigin(0.5).setDepth(15);

    this.add.text(W / 2, 145, this.world.name, style('display', {
      fontSize: '76px',
      fill: '#' + this.world.accentColor.toString(16).padStart(6, '0')
    })).setOrigin(0.5).setDepth(15);

    const soundBtn = createIconButton(this, {
      x: W - 80, y: 110, radius: 44,
      accentColor: this.world.accentColor,
      drawIcon: (g, size) => drawSoundIcon(g, 0, 0, size, 0xffffff, audio.enabled),
      onClick: () => { audio.toggleEnabled(); soundBtn.redrawIcon(); }
    });
    soundBtn.setDepth(15);
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
    const accent = isBoss ? COLORS.error : this.world.accentColor;

    // Drop shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.5);
    shadow.fillRoundedRect(-w / 2 + 2, -h / 2 + 8, w, h, 24);
    c.add(shadow);

    // Card body
    const card = this.add.graphics();
    card.fillStyle(COLORS.bgPanel, 0.96);
    card.fillRoundedRect(-w / 2, -h / 2, w, h, 24);
    card.lineStyle(3, accent, isLocked ? 0.4 : 0.9);
    card.strokeRoundedRect(-w / 2, -h / 2, w, h, 24);
    c.add(card);

    // Polish: faint accent wash in the upper section
    const accentWash = this.add.graphics();
    accentWash.fillStyle(accent, isLocked ? 0.04 : 0.10);
    accentWash.fillRoundedRect(-w / 2 + 10, -h / 2 + 10, w - 20, h * 0.46, 16);
    c.add(accentWash);

    // Polish: thin accent rule under the title block
    const ruleY = isBoss ? 14 : 6;
    const ruleG = this.add.graphics();
    ruleG.fillStyle(accent, isLocked ? 0.25 : 0.55);
    ruleG.fillRect(-w / 2 + 60, ruleY, w - 120, 2);
    c.add(ruleG);

    // ---- Title row: icon + label, centered as a unit ------------------------
    const titleY = isBoss ? -h / 4 - 8 : -h / 4 + 8;
    const labelStr = isBoss ? 'BOSS' : MODES[modeKey].label.toUpperCase();
    const iconBoxW = 64;
    const gap = 22;

    const labelObj = this.add.text(0, 0, labelStr, style('display', {
      fontSize: '46px',
      fill: '#ffffff',
      fontStyle: '900'
    })).setOrigin(0, 0.5);

    const groupW = iconBoxW + gap + labelObj.width;
    const groupLeft = -groupW / 2;

    const iconG = this.add.graphics();
    iconG.x = groupLeft + iconBoxW / 2;
    iconG.y = titleY;
    if (isBoss) {
      drawSkullIcon(iconG, 0, 0, 34);
    } else {
      this.drawModeGlyph(iconG, modeKey, accent);
    }
    c.add(iconG);

    labelObj.x = groupLeft + iconBoxW + gap;
    labelObj.y = titleY;
    c.add(labelObj);

    if (isBoss) {
      c.add(this.add.text(0, 32, this.world.villain || 'BOSS', style('subhead', {
        fontSize: '28px',
        fill: '#ff8b8b',
        fontStyle: '900'
      })).setOrigin(0.5));
    }

    // ---- Stars row: centered along the bottom -------------------------------
    const starY = h / 2 - 38;
    const starGap = 64;
    for (let s = 0; s < 3; s++) {
      const earned = s < stars;
      if (earned) {
        const glow = this.add.graphics();
        glow.fillStyle(COLORS.warning, 0.22);
        glow.fillCircle((s - 1) * starGap, starY, 22);
        c.add(glow);
      }
      const starG = this.add.graphics();
      drawStarIcon(starG, 0, 0, 26, earned ? COLORS.warning : 0x3a3a50);
      starG.x = (s - 1) * starGap;
      starG.y = starY;
      c.add(starG);
    }

    if (isLocked) {
      const lockBg = this.add.graphics();
      lockBg.fillStyle(COLORS.bgDark, 0.85);
      lockBg.fillCircle(w / 2 - 40, -h / 2 + 40, 28);
      lockBg.lineStyle(2, accent, 0.5);
      lockBg.strokeCircle(w / 2 - 40, -h / 2 + 40, 28);
      c.add(lockBg);
      const lockG = this.add.graphics();
      drawLockIcon(lockG, 0, 0, 24);
      lockG.x = w / 2 - 40;
      lockG.y = -h / 2 + 38;
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
    if (modeKey === 'mult') {
      // Bold ×
      g.lineStyle(9, color, 1);
      g.lineBetween(-22, -22, 22, 22);
      g.lineBetween(22, -22, -22, 22);
    } else if (modeKey === 'div') {
      // Bold ÷
      g.lineStyle(9, color, 1);
      g.lineBetween(-26, 0, 26, 0);
      g.fillStyle(color, 1);
      g.fillCircle(0, -16, 6);
      g.fillCircle(0, 16, 6);
    } else if (modeKey === 'mixed') {
      // × on the left, ÷ on the right — both readable at a glance
      const dx = 18;
      const sym = 13;
      // ×
      g.lineStyle(7, color, 1);
      g.lineBetween(-dx - sym, -sym, -dx + sym, sym);
      g.lineBetween(-dx + sym, -sym, -dx - sym, sym);
      // ÷
      g.lineStyle(7, color, 1);
      g.lineBetween(dx - sym, 0, dx + sym, 0);
      g.fillStyle(color, 1);
      g.fillCircle(dx, -sym + 1, 4.5);
      g.fillCircle(dx, sym - 1, 4.5);
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

    this.add.text(W / 2, y, 'FACT MASTERY', style('subhead', {
      fontSize: '44px',
      fill: '#cfcfe0',
      fontStyle: '900'
    })).setOrigin(0.5).setDepth(11);

    const barW = 820;
    const barH = 56;
    const barY = y + 90;
    const fillColor = avg >= 70 ? COLORS.success : avg >= 40 ? this.world.accentColor : COLORS.error;

    createProgressBar(this, {
      x: W / 2,
      y: barY,
      width: barW,
      height: barH,
      ratio: avg / 100,
      color: fillColor,
      label: `${avg}%`,
      depth: 11
    });

    const totalStars = Object.values(this.worldProgress.levelStars).reduce((s, v) => s + v, 0);
    this.add.text(W / 2, barY + barH / 2 + 60, `${totalStars} / 12 stars in ${this.world.name}`, style('subhead', {
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
