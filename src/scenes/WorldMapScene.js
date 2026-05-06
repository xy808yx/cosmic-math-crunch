// Mario-style world map. All 11 worlds share a single non-scrolling 1080×1920
// screen, connected by an S-curve path. Locked worlds stay hidden; the path
// reveals progressively. The ship+pet sit on the active world; tapping an
// unlocked next world animates the ship along the path to it.

import Phaser from 'phaser';
import { WORLDS, progress } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { companion, drawCompanion, SPECIES } from '../CompanionManager.js';
import { streak } from '../StreakManager.js';
import { economy } from '../EconomyManager.js';
import { ship } from '../ShipManager.js';
import { drawShip } from '../ShipRenderer.js';
import { buildMapPath, getNodePositions, drawPath, tForNodeIndex } from '../MapPath.js';
import { drawWorldNode } from '../WorldNodeArt.js';
import {
  drawFlameIcon, drawSparkleIcon, drawStarIcon,
  drawShopIcon, drawTrophyIcon, drawGearIcon, drawLockIcon
} from '../StatIcons.js';

const W = 1080;
const H = 1920;

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create() {
    audio.init();

    createStarfield(this, { width: W, height: H, accentStrength: 0 });

    this.path = buildMapPath();
    this.nodePositions = getNodePositions();
    this.currentWorldIndex = this.findCurrentWorldIndex();
    this.furthestUnlockedIndex = this.findFurthestUnlockedIndex();
    this._mapFootprint = this.computeMapFootprint();

    this.createHeader();
    this.createMap();
    this.createShipOnActiveWorld();
    this.createBottomChrome();

    this.events.on('wake', this.onSceneWake, this);
    this.events.on('resume', this.onSceneWake, this);
    this.events.once('shutdown', () => {
      this.events.off('wake', this.onSceneWake, this);
      this.events.off('resume', this.onSceneWake, this);
    });

    new TransitionManager(this).fadeIn(300);
  }

  // ============================================================
  // HEADER
  // ============================================================
  createHeader() {
    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(0x07071a, 0.92);
    bg.fillRect(0, 0, W, 220);
    bg.fillStyle(0x07071a, 0.55);
    bg.fillRect(0, 220, W, 30);

    // Logo / title
    this.add.text(W / 2, 90, 'COSMIC MATH', style('display', {
      fontSize: '70px',
      fill: '#ffffff',
      stroke: '#0a0a1a',
      strokeThickness: 4
    })).setOrigin(0.5).setDepth(14);

    // Three-chip readout: stardust, streak, total stars
    this.createChipRow();

    // Top-right Shop
    createIconButton(this, {
      x: W - 90, y: 88, radius: 38,
      accentColor: 0xc77eff,
      drawIcon: (g, size) => drawShopIcon(g, 0, 0, size),
      onClick: () => {
        audio.playClick();
        new TransitionManager(this).fadeToScene('ShopScene');
      }
    }).setDepth(15);

    // Top-left Records
    createIconButton(this, {
      x: 90, y: 88, radius: 38,
      accentColor: 0xffd86b,
      drawIcon: (g, size) => drawTrophyIcon(g, 0, 0, size),
      onClick: () => {
        audio.playClick();
        new TransitionManager(this).fadeToScene('RecordsScene');
      }
    }).setDepth(15);

    // Settings (slightly smaller)
    createIconButton(this, {
      x: 90, y: 175, radius: 28,
      accentColor: 0x4ecdc4,
      drawIcon: (g, size) => drawGearIcon(g, 0, 0, size),
      onClick: () => {
        audio.playClick();
        this.scene.start('ParentDashboardScene');
      }
    }).setDepth(15);
  }

  createChipRow() {
    const cy = 175;
    const chipW = 200;
    const gap = 24;
    const totalW = chipW * 3 + gap * 2;
    const startX = W / 2 - totalW / 2 + chipW / 2;

    this.starsChip = this.makeChip(startX, cy, chipW, {
      icon: g => drawStarIcon(g, 0, 0, 18),
      accent: 0xf7dc6f,
      value: () => `${progress.totalStars}`
    });
    this.stardustChip = this.makeChip(startX + chipW + gap, cy, chipW, {
      icon: g => drawSparkleIcon(g, 0, 0, 18),
      accent: 0xc77eff,
      value: () => `${economy.getStardust()}`
    });
    this.streakChip = this.makeChip(startX + (chipW + gap) * 2, cy, chipW, {
      icon: g => drawFlameIcon(g, 0, 0, 18),
      accent: 0xff8b3d,
      value: () => `${streak.getCurrent()}d`
    });
  }

  makeChip(x, y, width, opts) {
    const c = this.add.container(x, y).setDepth(14);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.92);
    bg.fillRoundedRect(-width / 2, -28, width, 56, 28);
    bg.lineStyle(2, opts.accent, 0.7);
    bg.strokeRoundedRect(-width / 2, -28, width, 56, 28);
    c.add(bg);

    const iconG = this.add.graphics();
    iconG.x = -width / 2 + 28;
    opts.icon(iconG);
    c.add(iconG);

    const text = this.add.text(width / 2 - 24, 0, opts.value(), style('subhead', {
      fontSize: '28px',
      fill: '#' + opts.accent.toString(16).padStart(6, '0')
    })).setOrigin(1, 0.5);
    c.add(text);
    c.text = text;
    c.refresh = () => text.setText(opts.value());
    return c;
  }

  // ============================================================
  // MAP
  // ============================================================
  createMap() {
    // Subtle accent bloom behind the map for visual interest
    const bloom = this.add.graphics().setDepth(0);
    bloom.fillStyle(0x4ecdc4, 0.04);
    bloom.fillEllipse(W / 2, H * 0.55, W * 1.4, H * 0.55);

    // Path — only segments up to (and including) the current world segment
    // are visible; locked tail is hidden.
    const visibleSegments = this.furthestUnlockedIndex; // segments equals (idx) since 0-based
    drawPath(this, this.path, visibleSegments, 0x4ecdc4).setDepth(2);

    // Nodes — only render up to furthestUnlocked. Locked beyond stay hidden.
    this.nodeContainers = {};
    for (let i = 0; i < WORLDS.length; i++) {
      if (i > this.furthestUnlockedIndex) continue;
      const world = WORLDS[i];
      const pos = this.nodePositions[i];
      const isCurrent = i === this.currentWorldIndex;
      const isCleared = progress.isWorldFullyCleared(world.id);
      const node = drawWorldNode(this, pos.x, pos.y, world.id, { scale: 0.95 });
      node.setDepth(5);
      this.nodeContainers[world.id] = node;

      // Idle gentle bob
      this.tweens.add({
        targets: node,
        y: pos.y - 6,
        duration: 1800 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Cleared badge: small star
      if (isCleared) {
        const badge = this.add.graphics().setDepth(6);
        badge.x = pos.x + 60;
        badge.y = pos.y - 60;
        drawStarIcon(badge, 0, 0, 18);
        this.tweens.add({
          targets: badge,
          scale: { from: 0.9, to: 1.1 },
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      // World label
      const label = this.add.text(pos.x, pos.y + 90, world.name.toUpperCase(), style('caption', {
        fontSize: '22px',
        fill: '#' + world.accentColor.toString(16).padStart(6, '0'),
        fontStyle: '900',
        stroke: '#0a0a1a',
        strokeThickness: 3
      })).setOrigin(0.5).setDepth(6);

      // Tap hit area
      const hit = this.add.circle(pos.x, pos.y, 90, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(7);
      hit.on('pointerdown', () => this.handleNodeTap(i));
      hit.on('pointerover', () => {
        this.tweens.add({ targets: node, scale: 1.06, duration: 120 });
      });
      hit.on('pointerout', () => {
        this.tweens.add({ targets: node, scale: 0.95, duration: 120 });
      });

      // Pulsing ring for the current world
      if (isCurrent) {
        const ring = this.add.graphics().setDepth(4);
        ring.lineStyle(4, world.accentColor, 0.85);
        ring.strokeCircle(pos.x, pos.y, 80);
        this.tweens.add({
          targets: ring,
          scaleX: 1.18,
          scaleY: 1.18,
          alpha: 0.3,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }
  }

  // ============================================================
  // SHIP + PET ON ACTIVE WORLD
  // ============================================================
  createShipOnActiveWorld() {
    const pos = this.nodePositions[this.currentWorldIndex];
    this.shipPet = this.add.container(pos.x, pos.y - 30).setDepth(20);

    const shipG = drawShip(this, 0, 0, {
      scale: 1.2,
      parts: ship.getCurrentParts()
    });
    this.shipPet.add(shipG);
    this.shipPet.shipG = shipG;

    if (companion.hasStarter()) {
      const pc = shipG.portholeCenter;
      const pet = drawCompanion(this, pc.x, pc.y, { scale: 0.42 });
      shipG.add(pet);
      this.shipPet.pet = pet;

      // Pet hit area for lore card
      const hit = this.add.circle(pc.x, pc.y, shipG.portholeRadius + 10, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      shipG.add(hit);
      hit.on('pointerdown', () => this.showLoreCard());
    }

    // Idle bob
    this.tweens.add({
      targets: this.shipPet,
      y: pos.y - 30 - 8,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // ============================================================
  // BOTTOM CHROME
  // ============================================================
  createBottomChrome() {
    // Subtle starfield band hint at bottom
    const fade = this.add.graphics().setDepth(0);
    fade.fillStyle(0x07071a, 0.7);
    fade.fillRect(0, 1700, W, 220);

    // Current world label / play hint
    const world = WORLDS[this.currentWorldIndex];
    const wp = progress.getWorldProgress(world.id);
    const fullyCleared = progress.isWorldFullyCleared(world.id);

    this.add.text(W / 2, 1760, world.name, style('display', {
      fontSize: '54px',
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(11);

    const subtitle = fullyCleared
      ? 'World cleared — replay any mission'
      : world.description;
    this.add.text(W / 2, 1815, subtitle, style('body', {
      fontSize: '24px',
      fill: '#' + world.accentColor.toString(16).padStart(6, '0'),
      align: 'center',
      wordWrap: { width: W - 160 }
    })).setOrigin(0.5).setDepth(11);

    this.add.text(W / 2, 1870, `${wp.levelsCompleted}/${world.levelsRequired} missions complete`, style('caption', {
      fontSize: '22px',
      fill: '#cfcfe0'
    })).setOrigin(0.5).setDepth(11);
  }

  // ============================================================
  // INTERACTION
  // ============================================================
  handleNodeTap(targetIndex) {
    audio.playClick();
    if (targetIndex > this.furthestUnlockedIndex) return;

    if (targetIndex === this.currentWorldIndex) {
      // Already there — go to mission briefing
      this.enterWorld(targetIndex);
      return;
    }

    // Animate ship along path to the new world
    this.travelTo(targetIndex);
  }

  travelTo(targetIndex) {
    if (this._traveling) return;
    this._traveling = true;
    this.input.enabled = false;

    const startT = tForNodeIndex(this.currentWorldIndex);
    const endT = tForNodeIndex(targetIndex);

    audio.playLaser?.();

    const tween = { t: startT };
    this.tweens.add({
      targets: tween,
      t: endT,
      duration: 1500,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const pt = this.path.getPoint(tween.t);
        this.shipPet.x = pt.x;
        this.shipPet.y = pt.y - 30;
        // Tilt the ship in the direction of travel
        const ahead = this.path.getPoint(Math.min(1, tween.t + 0.02));
        const dx = ahead.x - pt.x;
        const dy = ahead.y - pt.y;
        const angle = Math.atan2(dy, dx) - Math.PI / 2;
        this.shipPet.rotation = angle * 0.3;
      },
      onComplete: () => {
        this.shipPet.rotation = 0;
        this.currentWorldIndex = targetIndex;
        this._traveling = false;
        this.input.enabled = true;
        // Subtle landing shake
        this.cameras.main.shake(180, 0.004);
        this.time.delayedCall(180, () => this.enterWorld(targetIndex));
      }
    });
  }

  enterWorld(idx) {
    const world = WORLDS[idx];
    this.registry.set('selectedWorld', world.id);
    new TransitionManager(this).fadeToScene('LevelSelectScene');
  }

  // ============================================================
  // PET LORE CARD
  // ============================================================
  showLoreCard() {
    audio.playClick();
    const sp = companion.getSpecies();
    const lore = companion.getCurrentLore();
    if (!sp || !lore) return;

    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
      .setDepth(80).setInteractive();
    const card = this.add.container(W / 2, H / 2).setDepth(81);

    const cw = 880;
    const ch = 1100;
    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 1);
    bg.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 28);
    bg.lineStyle(4, sp.accent, 0.95);
    bg.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 28);
    card.add(bg);

    // Portrait
    const portrait = drawCompanion(this, 0, -ch / 2 + 220, { scale: 1.6 });
    card.add(portrait);

    card.add(this.add.text(0, -ch / 2 + 460, lore.name.toUpperCase(), style('display', {
      fontSize: '52px',
      fill: '#ffffff'
    })).setOrigin(0.5));
    card.add(this.add.text(0, -ch / 2 + 510, lore.type, style('caption', {
      fontSize: '22px',
      fill: '#' + sp.accent.toString(16).padStart(6, '0')
    })).setOrigin(0.5));
    card.add(this.add.text(0, -ch / 2 + 580, lore.lore, style('body', {
      fontSize: '24px',
      fill: '#cfcfe0',
      align: 'center',
      wordWrap: { width: cw - 100 }
    })).setOrigin(0.5));

    // Evolution progress
    const prog = companion.getStageProgress();
    const py = ch / 2 - 380;
    if (prog.nextStage) {
      const nextLore = sp.stages[prog.nextStage];
      card.add(this.add.text(0, py, `Next stage: ${nextLore.name}`, style('subhead', {
        fontSize: '28px',
        fill: '#ffffff'
      })).setOrigin(0.5));

      // Silhouette of next stage (a darker pet drawn at the next stage)
      const sil = drawCompanion(this, 0, py + 100, { scale: 0.8, stage: prog.nextStage });
      sil.setAlpha(0.35);
      sil.list.forEach(child => child.setTint?.(0x000000));
      card.add(sil);

      // Sub-goals
      const goals = [
        `${prog.worldsCleared.current}/${prog.worldsCleared.target} worlds cleared`,
        `${prog.lifetimeCorrect.current}/${prog.lifetimeCorrect.target} correct answers`,
        `${prog.accuracy.current}%/${prog.accuracy.target}% accuracy`
      ];
      goals.forEach((g, i) => {
        const gy = py + 240 + i * 40;
        card.add(this.add.text(0, gy, g, style('caption', {
          fontSize: '22px',
          fill: '#cfcfe0'
        })).setOrigin(0.5));
      });

      // Overall progress bar
      const barW = cw - 200;
      const barG = this.add.graphics();
      barG.fillStyle(0x2a2a44, 1);
      barG.fillRoundedRect(-barW / 2, ch / 2 - 90, barW, 18, 9);
      barG.fillStyle(sp.accent, 1);
      barG.fillRoundedRect(-barW / 2, ch / 2 - 90, barW * Math.min(1, prog.ratio), 18, 9);
      card.add(barG);
    } else {
      card.add(this.add.text(0, py + 100, 'FULLY EVOLVED', style('subhead', {
        fontSize: '36px',
        fill: '#ffd86b'
      })).setOrigin(0.5));
    }

    const closeBtn = this.add.text(0, ch / 2 - 40, 'tap anywhere to close', style('caption', {
      fontSize: '20px',
      fill: '#7a7a90'
    })).setOrigin(0.5);
    card.add(closeBtn);

    const cleanup = () => {
      audio.playClick();
      ov.destroy();
      card.destroy();
    };
    ov.on('pointerdown', cleanup);
    bg.setInteractive(new Phaser.Geom.Rectangle(-cw / 2, -ch / 2, cw, ch), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerdown', cleanup);
  }

  // ============================================================
  // PROGRESS HELPERS
  // ============================================================
  findCurrentWorldIndex() {
    for (let i = 0; i < WORLDS.length; i++) {
      const w = WORLDS[i];
      if (!progress.isWorldUnlocked(w.id)) return Math.max(0, i - 1);
      const wp = progress.getWorldProgress(w.id);
      if (wp.levelsCompleted < w.levelsRequired) return i;
    }
    return WORLDS.length - 1;
  }

  findFurthestUnlockedIndex() {
    let idx = 0;
    for (let i = 0; i < WORLDS.length; i++) {
      if (progress.isWorldUnlocked(WORLDS[i].id)) idx = i;
    }
    return idx;
  }

  onSceneWake() {
    // Restart only if the map's unlock/clear footprint changed; otherwise
    // refresh the live chips in place. Avoids tearing down + rebuilding all
    // node graphics on every back-from-shop / back-from-records.
    const newFootprint = this.computeMapFootprint();
    if (newFootprint !== this._mapFootprint) {
      this.scene.restart();
      return;
    }
    this.starsChip?.refresh();
    this.stardustChip?.refresh();
    this.streakChip?.refresh();
  }

  computeMapFootprint() {
    let s = '';
    for (const w of WORLDS) {
      const wp = progress.getWorldProgress(w.id);
      s += `${wp?.unlocked ? '1' : '0'}${wp?.levelsCompleted || 0};`;
    }
    return s;
  }
}
