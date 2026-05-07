// Mario-style world map. All 11 worlds share a single non-scrolling 1080×1920
// screen, connected by an S-curve path. Locked worlds stay hidden; the path
// reveals progressively. The ship+pet sit on the active world; tapping an
// unlocked next world animates the ship along the path to it.

import Phaser from 'phaser';
import { WORLDS, progress } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton, createPetPortraitButton, createButton, createProgressBar } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { companion, drawCompanion } from '../CompanionManager.js';
import { streak } from '../StreakManager.js';
import { economy } from '../EconomyManager.js';
import { ship } from '../ShipManager.js';
import { drawShip } from '../ShipRenderer.js';
import { buildMapPath, getNodePositions, drawPath, tForNodeIndex } from '../MapPath.js';
import { drawWorldNode } from '../WorldNodeArt.js';
import { createMapAmbience } from '../WorldAmbience.js';
import {
  drawFlameIcon, drawSparkleIcon, drawStarIcon,
  drawGearIcon, drawShoppingBagIcon, drawHelmetIcon
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
    // Layered gradient strip — three bands of decreasing opacity for depth
    bg.fillStyle(0x12122a, 0.96);
    bg.fillRect(0, 0, W, 220);
    bg.fillStyle(0x07071a, 0.45);
    bg.fillRect(0, 0, W, 220);
    // Soft top accent glow
    bg.fillStyle(0x4ecdc4, 0.05);
    bg.fillRect(0, 0, W, 90);
    // Bottom hairline
    bg.fillStyle(0x4ecdc4, 0.30);
    bg.fillRect(0, 218, W, 2);
    // Soft fade below the bar
    bg.fillStyle(0x07071a, 0.50);
    bg.fillRect(0, 220, W, 24);
    bg.fillStyle(0x07071a, 0.20);
    bg.fillRect(0, 244, W, 16);

    // Logo / title
    this.add.text(W / 2, 90, 'COSMIC MATH', style('display', {
      fontSize: '54px',
      fill: '#ffffff',
      stroke: '#0a0a1a',
      strokeThickness: 4
    })).setOrigin(0.5).setDepth(14);

    // Three-chip readout: stardust, streak, total stars
    this.createChipRow();

    // Top-left Parent Dashboard (was the small gear; now full-size primary)
    createIconButton(this, {
      x: 90, y: 88, radius: 38,
      accentColor: 0x4ecdc4,
      drawIcon: (g, size) => drawGearIcon(g, 0, 0, size),
      onClick: () => {
        audio.playClick();
        this.scene.start('ParentDashboardScene');
      }
    }).setDepth(15);

    // Top-right cluster: Logbook | Pet | Shop
    createIconButton(this, {
      x: W - 282, y: 88, radius: 38,
      accentColor: 0xffd86b,
      drawIcon: (g, size) => drawHelmetIcon(g, 0, 0, size),
      onClick: () => {
        audio.playClick();
        new TransitionManager(this).fadeToScene('RecordsScene');
      }
    }).setDepth(15);

    const sp = companion.getSpecies();
    const petAccent = sp ? sp.accent : 0xc77eff;
    createPetPortraitButton(this, {
      x: W - 186, y: 88, radius: 38,
      accentColor: petAccent,
      drawPet: (scene, x, y, opts) => drawCompanion(scene, x, y, opts),
      onClick: () => this.showLoreCard()
    }).setDepth(15);

    createIconButton(this, {
      x: W - 90, y: 88, radius: 38,
      accentColor: 0xc77eff,
      drawIcon: (g, size) => drawShoppingBagIcon(g, 0, 0, size),
      onClick: () => {
        audio.playClick();
        new TransitionManager(this).fadeToScene('ShopScene');
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
    const h = 60;
    const r = h / 2;

    // Drop shadow for depth
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.45);
    shadow.fillRoundedRect(-width / 2 + 1, -h / 2 + 4, width, h, r);
    c.add(shadow);

    // Track — pill body with inset highlight + bottom shadow
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-width / 2, -h / 2, width, h, r);
    bg.fillStyle(0xffffff, 0.06);
    bg.fillRoundedRect(-width / 2 + 4, -h / 2 + 3, width - 8, h * 0.32, {
      tl: r - 2, tr: r - 2, bl: 6, br: 6
    });
    bg.fillStyle(0x07071a, 0.40);
    bg.fillRoundedRect(-width / 2 + 4, h / 2 - h * 0.32 - 3, width - 8, h * 0.32, {
      tl: 6, tr: 6, bl: r - 2, br: r - 2
    });
    bg.lineStyle(2, opts.accent, 0.85);
    bg.strokeRoundedRect(-width / 2, -h / 2, width, h, r);
    c.add(bg);

    // Icon badge — accent-tinted disc with soft glow halo
    const badgeR = h * 0.34;
    const badgeX = -width / 2 + r;
    const halo = this.add.graphics();
    halo.fillStyle(opts.accent, 0.25);
    halo.fillCircle(badgeX, 0, badgeR + 6);
    c.add(halo);
    const badge = this.add.graphics();
    badge.fillStyle(0x07071a, 1);
    badge.fillCircle(badgeX, 0, badgeR);
    badge.lineStyle(2, opts.accent, 0.9);
    badge.strokeCircle(badgeX, 0, badgeR);
    c.add(badge);

    const iconG = this.add.graphics();
    iconG.x = badgeX;
    opts.icon(iconG);
    c.add(iconG);

    // Value text — bright white with stroke for readability on any backdrop
    const text = this.add.text(width / 2 - 22, 0, opts.value(), style('subhead', {
      fontSize: '32px',
      fill: '#ffffff',
      fontStyle: '900',
      stroke: '#0a0a18',
      strokeThickness: 3
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

    // Layered ambience: stars, drifting nebulae, shooting stars, theme particles
    createMapAmbience(this, {
      width: W,
      height: H,
      nodePositions: this.nodePositions,
      furthestUnlocked: this.furthestUnlockedIndex,
      accentColors: WORLDS.map(w => w.accentColor)
    });

    // Path — only segments up to (and including) the current world segment
    // are visible; locked tail is hidden.
    const visibleSegments = this.furthestUnlockedIndex; // segments equals (idx) since 0-based
    drawPath(this, this.path, visibleSegments, 0x4ecdc4).setDepth(2);

    // Nodes — unlocked render in full color, locked render as silhouette+?.
    this.nodeContainers = {};
    for (let i = 0; i < WORLDS.length; i++) {
      const world = WORLDS[i];
      const pos = this.nodePositions[i];
      const isLocked = i > this.furthestUnlockedIndex;

      if (isLocked) {
        // Render silhouette only — no label, no hit, no animation.
        const sil = drawWorldNode(this, pos.x, pos.y, world.id, { scale: 0.95, silhouette: true });
        sil.setDepth(5);
        sil.setAlpha(0.85);
        continue;
      }

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
        fontSize: '28px',
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

      // Soft static halo + "YOU ARE HERE" chip for the current world
      if (isCurrent) {
        const halo = this.add.graphics().setDepth(3);
        halo.fillStyle(world.accentColor, 0.18);
        halo.fillCircle(pos.x, pos.y, 90);
        halo.fillStyle(world.accentColor, 0.10);
        halo.fillCircle(pos.x, pos.y, 130);
        halo.fillStyle(world.accentColor, 0.05);
        halo.fillCircle(pos.x, pos.y, 170);

        const chip = this.add.container(pos.x, pos.y - 130).setDepth(8);
        const chipBg = this.add.graphics();
        chipBg.fillStyle(world.accentColor, 0.95);
        chipBg.fillRoundedRect(-92, -18, 184, 36, 18);
        chipBg.lineStyle(2, 0x0a0a1a, 0.4);
        chipBg.strokeRoundedRect(-92, -18, 184, 36, 18);
        chip.add(chipBg);
        const chipText = this.add.text(0, 0, 'YOU ARE HERE', style('caption', {
          fontSize: '18px',
          fill: '#0a0a1a',
          fontStyle: '900'
        })).setOrigin(0.5);
        chip.add(chipText);
        this.tweens.add({
          targets: chip,
          y: pos.y - 130 - 4,
          duration: 2400,
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
      fontSize: '28px',
      fill: '#' + world.accentColor.toString(16).padStart(6, '0'),
      align: 'center',
      wordWrap: { width: W - 160 }
    })).setOrigin(0.5).setDepth(11);

    this.add.text(W / 2, 1870, `${wp.levelsCompleted}/${world.levelsRequired} missions complete`, style('caption', {
      fontSize: '28px',
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

    const cw = 920;
    const ch = 1440;
    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 1);
    bg.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 28);
    bg.lineStyle(4, sp.accent, 0.95);
    bg.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 28);
    card.add(bg);

    // Portrait
    const portrait = drawCompanion(this, 0, -ch / 2 + 240, { scale: 1.8 });
    card.add(portrait);

    // Name (much bigger)
    card.add(this.add.text(0, -ch / 2 + 500, lore.name.toUpperCase(), style('display', {
      fontSize: '68px',
      fill: '#ffffff'
    })).setOrigin(0.5));
    // Type tag
    card.add(this.add.text(0, -ch / 2 + 560, lore.type, style('caption', {
      fontSize: '32px',
      fill: '#' + sp.accent.toString(16).padStart(6, '0')
    })).setOrigin(0.5));
    // Lore description (bigger, more line spacing)
    card.add(this.add.text(0, -ch / 2 + 660, lore.lore, style('body', {
      fontSize: '34px',
      fill: '#cfcfe0',
      align: 'center',
      wordWrap: { width: cw - 100 },
      lineSpacing: 8
    })).setOrigin(0.5));

    // Evolution progress block — sits in lower third of card
    const prog = companion.getStageProgress();
    const py = ch / 2 - 600;
    if (prog.nextStage) {
      const nextLore = sp.stages[prog.nextStage];
      card.add(this.add.text(0, py, `Next stage: ${nextLore.name}`, style('subhead', {
        fontSize: '34px',
        fill: '#ffffff'
      })).setOrigin(0.5));

      // Silhouette of next stage (use alpha; .setTint doesn't apply to Graphics)
      const sil = drawCompanion(this, 0, py + 130, { scale: 0.9, stage: prog.nextStage });
      sil.setAlpha(0.35);
      card.add(sil);

      // Sub-goals
      const goals = [
        `${prog.worldsCleared.current}/${prog.worldsCleared.target} worlds cleared`,
        `${prog.lifetimeCorrect.current}/${prog.lifetimeCorrect.target} correct answers`,
        `${prog.accuracy.current}%/${prog.accuracy.target}% accuracy`
      ];
      const goalsStartY = py + 290;
      goals.forEach((g, i) => {
        const gy = goalsStartY + i * 56;
        card.add(this.add.text(0, gy, g, style('caption', {
          fontSize: '30px',
          fill: '#cfcfe0'
        })).setOrigin(0.5));
      });

      // Overall progress bar — sits with its own band, well above card edge
      const barW = cw - 200;
      const barH = 36;
      const barY = goalsStartY + 3 * 56 + 30 + barH / 2;
      const pct = Math.round(Math.min(1, prog.ratio) * 100);
      const bar = createProgressBar(this, {
        x: 0, y: barY,
        width: barW,
        height: barH,
        ratio: prog.ratio,
        color: sp.accent,
        label: `${pct}%`
      });
      card.add(bar);
    } else {
      // Adult — show trophy count + "Raise another companion" CTA
      card.add(this.add.text(0, py, 'FULLY EVOLVED', style('subhead', {
        fontSize: '40px',
        fill: '#ffd86b'
      })).setOrigin(0.5));

      const completedCount = companion.getCompletedPets().length;
      if (completedCount > 0) {
        card.add(this.add.text(0, py + 60, `Trophy shelf: ${completedCount}`, style('caption', {
          fontSize: '28px',
          fill: '#cfcfe0'
        })).setOrigin(0.5));
      }

      // CTA button — uses createButton for consistency
      const btn = createButton(this, {
        x: 0, y: py + 200, width: 580, height: 96,
        label: 'RAISE ANOTHER COMPANION',
        color: 0xffd86b,
        textStyle: 'subhead',
        textOverrides: { fontSize: '28px', fill: '#0a0a1a', fontStyle: '900' },
        onClick: () => {
          companion.retireAndStartNew();
          ov.destroy();
          card.destroy();
          closeBtn.destroy();
          this.scene.start('StarterPickerScene');
        }
      });
      card.add(btn);
    }

    // Close hint — placed OUTSIDE the card on the dim backdrop, eliminating
    // overlap with stat lines/progress bar inside the card.
    const closeBtn = this.add.text(W / 2, H / 2 + ch / 2 + 50, 'tap anywhere to close', style('caption', {
      fontSize: '26px',
      fill: '#9a9aae'
    })).setOrigin(0.5).setDepth(81);

    const cleanup = () => {
      audio.playClick();
      ov.destroy();
      card.destroy();
      closeBtn.destroy();
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
