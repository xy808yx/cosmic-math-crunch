// Mario-style world map. All 11 worlds share a single non-scrolling 1080×1920
// screen, connected by an S-curve path. Locked worlds stay hidden; the path
// reveals progressively. The ship+pet sit on the active world; tapping an
// unlocked next world animates the ship along the path to it.

import Phaser from 'phaser';
import {
  WORLDS, VISIBLE_WORLDS, HIDDEN_WORLDS,
  progress, getNextVisibleWorldId
} from '../GameData.js';
import { audio } from '../AudioManager.js';
import { music } from '../MusicManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton, createPetPortraitButton, createButton, createProgressBar } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { companion, drawCompanion, CAROUSEL_STAGE_ORDER } from '../CompanionManager.js';
import { economy } from '../EconomyManager.js';
import { ship } from '../ShipManager.js';
import { drawShip } from '../ShipRenderer.js';
import {
  buildMapPath, getNodePositions, drawPath, tForNodeIndex,
  HIDDEN_NODE_POSITIONS, HIDDEN_HOST_INDEX,
  hiddenBranchControlPoint, sampleHiddenBranch
} from '../MapPath.js';
import { drawWorldNode } from '../WorldNodeArt.js';
import { drawGlitchPlanetNode, drawGarageNode } from './HiddenWorldScene.js';
import { createMapAmbience } from '../WorldAmbience.js';
import {
  drawSparkleIcon, drawStarIcon,
  drawGearIcon, drawShoppingBagIcon, drawHelmetIcon, drawSoundIcon
} from '../StatIcons.js';
import { COLORS } from '../colorPalette.js';
import { createModal } from '../modalHelper.js';

const W = 1080;
const H = 1920;

const PORTRAIT_SCALE_BY_STAGE = { egg: 2.4, baby: 2.4, teen: 2.0, adult: 2.0, cosmic: 2.6 };

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create() {
    audio.init();
    music.ensurePlaying(this);

    // Returning to the map always ends a free-play session, so the next
    // normal tap into a level plays for progression as usual.
    this.registry.set('freePlay', false);

    // Heal saves bitten by the old cosmic-unlock bug: if the kid already beat
    // the final boss (endingSeen) but never got the permanent Cosmic form,
    // grant it now — runs before the pet badge is drawn so it renders cosmic.
    if (progress.endingSeen && companion.hasStarter() && !progress.companion?.cosmicForm) {
      companion.unlockCosmic();
    }

    createStarfield(this, { width: W, height: H, accentStrength: 0 });

    this.path = buildMapPath();
    this.nodePositions = getNodePositions();
    this.currentWorldIndex = this.findCurrentWorldIndex();
    this.furthestUnlockedIndex = this.findFurthestUnlockedIndex();
    this._mapFootprint = this.computeMapFootprint();

    this.createHeader();
    this.createMap();
    this.createHiddenNodes();
    this.createShipOnActiveWorld();
    this.createBottomChrome();

    // Warp arrival (from the warp asteroid) takes precedence over the
    // normal auto-advance flow. If a warp arrival is in flight, still
    // consume any stale clear-world flag so it doesn't replay later.
    const warpArrived = this.tryWarpArrival();
    if (warpArrived) {
      progress.consumeJustClearedWorld();
    } else {
      this.tryAutoAdvance();
    }

    this.events.on('wake', this.onSceneWake, this);
    this.events.on('resume', this.onSceneWake, this);
    this.events.once('shutdown', () => {
      this.events.off('wake', this.onSceneWake, this);
      this.events.off('resume', this.onSceneWake, this);
    });

    // One-time nudge after the pet reaches its Cosmic form: point kids at the
    // pet badge (top-right), which now opens the form picker where they can
    // choose & keep ANY unlocked form. Fires once (healed or freshly earned).
    if (progress.companion?.cosmicForm && !progress.cosmicHintSeen) {
      progress.markCosmicHintSeen();
      this.showToast('Your pet went Cosmic! Tap it ↗ to pick its look');
      if (this.petBadge) {
        this.tweens.add({
          targets: this.petBadge,
          scale: { from: 1, to: 1.18 },
          duration: 420, yoyo: true, repeat: 3, ease: 'Sine.easeInOut',
        });
      }
    }

    new TransitionManager(this).fadeIn(300);
  }

  // ============================================================
  // HEADER
  // ============================================================
  createHeader() {
    const bg = this.add.graphics().setDepth(10);
    // Layered gradient strip — three bands of decreasing opacity for depth
    bg.fillStyle(COLORS.bgPanel, 0.96);
    bg.fillRect(0, 0, W, 220);
    bg.fillStyle(COLORS.bgDark, 0.45);
    bg.fillRect(0, 0, W, 220);
    // Soft top accent glow
    bg.fillStyle(COLORS.accentTeal, 0.05);
    bg.fillRect(0, 0, W, 90);
    // Bottom hairline
    bg.fillStyle(COLORS.accentTeal, 0.30);
    bg.fillRect(0, 218, W, 2);
    // Soft fade below the bar
    bg.fillStyle(COLORS.bgDark, 0.50);
    bg.fillRect(0, 220, W, 24);
    bg.fillStyle(COLORS.bgDark, 0.20);
    bg.fillRect(0, 244, W, 16);

    const title = this.add.text(W / 2, 90, 'COSMIC MATH', style('display', {
      fontSize: '54px',
      fill: '#ffffff',
      stroke: '#0a0a1a',
      strokeThickness: 4
    })).setOrigin(0.5).setDepth(14).setInteractive({ useHandCursor: true });

    // Hidden dev-menu trigger: long-press (~1.5s) on the title opens the
    // parent menu. Kids tapping briefly do nothing.
    let pressTimer = null;
    title.on('pointerdown', () => {
      pressTimer = this.time.delayedCall(1500, () => {
        audio.playClick?.();
        new TransitionManager(this).fadeToScene('DevMenuScene');
      });
    });
    const cancelPress = () => {
      if (pressTimer) { pressTimer.remove(); pressTimer = null; }
    };
    title.on('pointerup', cancelPress);
    title.on('pointerout', cancelPress);

    this.createChipRow();

    // Cosmic Arcade chip — appears only after the kid has seen the endgame.
    // Anchored to the bottom-right corner so it never collides with map nodes.
    if (progress.endingSeen) {
      const ax = W - 200, ay = 1640;
      const arcade = this.add.container(ax, ay).setDepth(18);
      const bg = this.add.graphics();
      bg.fillStyle(0x0a0a1a, 0.95);
      bg.fillRoundedRect(-150, -28, 300, 56, 18);
      bg.lineStyle(3, 0xfbbf24, 1);
      bg.strokeRoundedRect(-150, -28, 300, 56, 18);
      arcade.add(bg);
      arcade.add(this.add.text(0, 0, '★ COSMIC ARCADE ★', style('caption', {
        fontSize: '24px',
        fill: '#fbbf24',
        fontStyle: '900'
      })).setOrigin(0.5));
      this.tweens.add({
        targets: arcade,
        scale: { from: 1, to: 1.06 },
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      const hit = this.add.rectangle(ax, ay, 300, 56, 0, 0)
        .setInteractive({ useHandCursor: true }).setDepth(19);
      hit.on('pointerdown', () => {
        audio.playClick();
        new TransitionManager(this).fadeToScene('ArcadeMenuScene');
      });
    }

    // Top-left cluster: Gear | Logbook
    createIconButton(this, {
      x: 90, y: 88, radius: 38,
      accentColor: COLORS.accentTeal,
      drawIcon: (g, size) => drawGearIcon(g, 0, 0, size),
      onClick: () => {
        audio.playClick();
        this.scene.start('ParentDashboardScene');
      }
    }).setDepth(15);

    createIconButton(this, {
      x: 186, y: 88, radius: 38,
      accentColor: COLORS.accentWarm,
      drawIcon: (g, size) => drawHelmetIcon(g, 0, 0, size),
      onClick: () => {
        audio.playClick();
        new TransitionManager(this).fadeToScene('RecordsScene');
      }
    }).setDepth(15);

    createIconButton(this, {
      x: 282, y: 88, radius: 38,
      accentColor: 0xb6e0ff,
      drawIcon: (g, size) => drawSoundIcon(g, 0, 0, size, 0xffffff, audio.enabled && music.enabled),
      onClick: () => {
        audio.playClick();
        new TransitionManager(this).fadeToScene('SettingsScene');
      }
    }).setDepth(15);

    // Top-right cluster: Pet | Shop
    this._petBadgeX = W - 186;
    this._petBadgeY = 88;
    this._petBadgeRadius = 38;
    this.buildPetBadge();

    createIconButton(this, {
      x: W - 90, y: 88, radius: 38,
      accentColor: COLORS.accentPurple,
      drawIcon: (g, size) => drawShoppingBagIcon(g, 0, 0, size),
      onClick: () => {
        audio.playClick();
        new TransitionManager(this).fadeToScene('ShopScene');
      }
    }).setDepth(15);
  }

  createChipRow() {
    const cy = 175;
    const chipW = 240;
    const gap = 32;
    const totalW = chipW * 2 + gap;
    const startX = W / 2 - totalW / 2 + chipW / 2;

    this.starsChip = this.makeChip(startX, cy, chipW, {
      icon: g => drawStarIcon(g, 0, 0, 18),
      accent: COLORS.warning,
      value: () => `${progress.totalStars}`,
      onClick: () => this.showInfoPopup({
        accent: COLORS.warning,
        drawIcon: (g, size) => drawStarIcon(g, 0, 0, size),
        title: 'STARS',
        body: 'You earn up to 3 stars on every mission — more answers right, more stars. They track how well you\'re mastering each math fact.'
      })
    });
    this.stardustChip = this.makeChip(startX + chipW + gap, cy, chipW, {
      icon: g => drawSparkleIcon(g, 0, 0, 18),
      accent: COLORS.accentPurple,
      value: () => `${economy.getStardust()}`,
      onClick: () => this.showInfoPopup({
        accent: COLORS.accentPurple,
        drawIcon: (g, size) => drawSparkleIcon(g, 0, 0, size),
        title: 'STARDUST',
        body: 'Stardust is your space money. You earn it from missions and your daily login bonus, then spend it in the Shop on hats, ship parts, and other cosmetics.'
      })
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
    bg.fillStyle(COLORS.bgTrack, 1);
    bg.fillRoundedRect(-width / 2, -h / 2, width, h, r);
    bg.fillStyle(0xffffff, 0.06);
    bg.fillRoundedRect(-width / 2 + 4, -h / 2 + 3, width - 8, h * 0.32, {
      tl: r - 2, tr: r - 2, bl: 6, br: 6
    });
    bg.fillStyle(COLORS.bgDark, 0.40);
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
    badge.fillStyle(COLORS.bgDark, 1);
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

    if (opts.onClick) {
      const hit = this.add.rectangle(0, 0, width, h, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      c.add(hit);
      hit.on('pointerover', () => {
        this.tweens.add({ targets: c, scaleX: 1.04, scaleY: 1.04, duration: 100 });
      });
      hit.on('pointerout', () => {
        this.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 100 });
      });
      hit.on('pointerdown', () => {
        audio.playClick();
        opts.onClick();
      });
    }

    return c;
  }

  // ============================================================
  // INFO POPUP (chip tooltips)
  // ============================================================
  showInfoPopup({ accent, drawIcon, title, body }) {
    const cw = 760;
    const ch = 520;
    const { card } = createModal(this, {
      width: cw, height: ch, accentColor: accent, radius: 24, strokeWidth: 4
    });

    // Icon badge with halo
    const iconY = -ch / 2 + 110;
    const halo = this.add.graphics();
    halo.fillStyle(accent, 0.22);
    halo.fillCircle(0, iconY, 76);
    halo.fillStyle(accent, 0.10);
    halo.fillCircle(0, iconY, 100);
    card.add(halo);

    const badge = this.add.graphics();
    badge.fillStyle(COLORS.bgDark, 1);
    badge.fillCircle(0, iconY, 56);
    badge.lineStyle(3, accent, 0.95);
    badge.strokeCircle(0, iconY, 56);
    card.add(badge);

    const iconG = this.add.graphics();
    iconG.y = iconY;
    drawIcon(iconG, 56);
    card.add(iconG);

    card.add(this.add.text(0, iconY + 110, title, style('display', {
      fontSize: '52px',
      fill: '#ffffff',
      stroke: '#0a0a1a',
      strokeThickness: 3
    })).setOrigin(0.5));

    card.add(this.add.text(0, iconY + 200, body, style('body', {
      fontSize: '30px',
      fill: '#cfcfe0',
      align: 'center',
      wordWrap: { width: cw - 80 },
      lineSpacing: 8
    })).setOrigin(0.5, 0));
  }

  // ============================================================
  // MAP
  // ============================================================
  createMap() {
    // Subtle accent bloom behind the map for visual interest
    const bloom = this.add.graphics().setDepth(0);
    bloom.fillStyle(COLORS.accentTeal, 0.04);
    bloom.fillEllipse(W / 2, H * 0.55, W * 1.4, H * 0.55);

    // Layered ambience: stars, drifting nebulae, shooting stars, theme particles
    createMapAmbience(this, {
      width: W,
      height: H,
      nodePositions: this.nodePositions,
      furthestUnlocked: this.furthestUnlockedIndex,
      accentColors: VISIBLE_WORLDS.map(w => w.accentColor)
    });

    // Path — only segments up to (and including) the current world segment
    // are visible; locked tail is hidden.
    const visibleSegments = this.furthestUnlockedIndex; // segments equals (idx) since 0-based
    drawPath(this, this.path, visibleSegments, COLORS.accentTeal).setDepth(2);

    // Nodes — unlocked render in full color, locked render as silhouette+?.
    this.nodeContainers = {};
    for (let i = 0; i < VISIBLE_WORLDS.length; i++) {
      const world = VISIBLE_WORLDS[i];
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

        // Flip the chip below the world when the world sits near the top
        // of the map, where the header would otherwise crop the chip.
        const chipAbove = pos.y > 480;
        const chipY = chipAbove ? pos.y - 130 : pos.y + 140;
        const chip = this.add.container(pos.x, chipY).setDepth(16);
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
          y: chipY - 4,
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

    this._startShipBob();
  }

  _startShipBob() {
    if (this._bobTween) {
      this._bobTween.stop();
      this._bobTween = null;
    }
    const baseY = this.shipPet.y;
    this._bobTween = this.tweens.add({
      targets: this.shipPet,
      y: baseY - 8,
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
    fade.fillStyle(COLORS.bgDark, 0.7);
    fade.fillRect(0, 1700, W, 220);

    const world = VISIBLE_WORLDS[this.currentWorldIndex];
    const wp = progress.getWorldProgress(world.id);
    const fullyCleared = progress.isWorldFullyCleared(world.id);

    // Top hairline tinted to the current world's accent — frames the chrome
    // the way the header's teal hairline frames the top.
    const hairline = this.add.graphics().setDepth(11);
    hairline.fillStyle(world.accentColor, 0.30);
    hairline.fillRect(0, 1700, W, 2);

    const nameText = this.add.text(W / 2, 1760, world.name, style('display', {
      fontSize: '54px',
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(11);
    this.tweens.add({
      targets: nameText,
      y: 1758,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const subtitle = fullyCleared
      ? 'World cleared — replay any mission'
      : world.description;
    this.add.text(W / 2, 1820, subtitle, style('body', {
      fontSize: '38px',
      fontStyle: '600',
      fill: '#' + world.accentColor.toString(16).padStart(6, '0'),
      align: 'center',
      wordWrap: { width: W - 160 }
    })).setOrigin(0.5).setDepth(11);

    this.add.text(W / 2, 1880, `${wp.levelsCompleted}/${world.levelsRequired} missions complete`, style('caption', {
      fontSize: '32px',
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
    this.travelTo(targetIndex, () => this.enterWorld(targetIndex));
  }

  travelTo(targetIndex, onArrive) {
    if (this._traveling) return;
    this._traveling = true;
    this.input.enabled = false;

    if (this._bobTween) {
      this._bobTween.stop();
      this._bobTween = null;
    }

    const startT = tForNodeIndex(this.currentWorldIndex);
    const endT = tForNodeIndex(targetIndex);

    audio.playLaser?.();

    const tween = { t: startT };
    return this.tweens.add({
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
        this._startShipBob();
        this.cameras.main.shake(180, 0.004);
        if (onArrive) {
          this.time.delayedCall(180, onArrive);
        }
      }
    });
  }

  enterWorld(idx) {
    const world = VISIBLE_WORLDS[idx];
    this.registry.set('selectedWorld', world.id);
    this.registry.set('shipParkedWorldId', world.id);
    new TransitionManager(this).fadeToScene('LevelSelectScene');
  }

  // ============================================================
  // HIDDEN WORLD NODES
  // ============================================================
  createHiddenNodes() {
    for (const h of HIDDEN_WORLDS) {
      if (!progress.isHiddenWorldDiscovered(h.id)) continue;
      const pos = HIDDEN_NODE_POSITIONS[h.id];
      if (!pos) continue;

      // Dashed branch path from host visible world → hidden world. Read as a
      // "side route" that branches off the main S-curve.
      const hostIdx = HIDDEN_HOST_INDEX[h.id];
      if (hostIdx != null) {
        const host = this.nodePositions[hostIdx];
        if (host) this.drawHiddenBranch(host, pos, h.accentColor);
      }

      const node = this.add.container(pos.x, pos.y).setDepth(5);
      const NODE_R = 62;

      if (h.id === 15) {
        const planet = drawGlitchPlanetNode(this, 0, 0, NODE_R);
        node.add(planet);
        this.tweens.add({
          targets: node,
          x: pos.x + 3,
          duration: 110,
          yoyo: true,
          repeat: -1,
          ease: 'Linear'
        });
      } else if (h.id === 16) {
        const garage = drawGarageNode(this, 0, 0, NODE_R);
        node.add(garage);
        this.tweens.add({
          targets: node,
          y: pos.y - 6,
          duration: 1800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      // Label — sits below the larger node
      this.add.text(pos.x, pos.y + NODE_R + 22, h.name.toUpperCase(), style('caption', {
        fontSize: '24px',
        fill: '#' + h.accentColor.toString(16).padStart(6, '0'),
        fontStyle: '900',
        stroke: '#0a0a1a',
        strokeThickness: 3
      })).setOrigin(0.5).setDepth(6);

      const hit = this.add.circle(pos.x, pos.y, NODE_R + 8, 0, 0)
        .setInteractive({ useHandCursor: true }).setDepth(7);
      hit.on('pointerdown', () => {
        audio.playClick();
        this.registry.set('selectedWorld', h.id);
        this.registry.set('hiddenWorldId', h.id);
        if (h.id === 15) {
          this.registry.set('currentWorldId', 15);
          this.registry.set('currentLevel', 1);
          this.registry.set('levelMode', 'boss');
          new TransitionManager(this).fadeToScene('GameScene');
        } else {
          new TransitionManager(this).fadeToScene('HiddenWorldScene');
        }
      });
    }
  }

  drawHiddenBranch(host, dest, accent) {
    // Sampled dashed line with a midpoint pull so the branch arcs slightly.
    // Shares the control-point math with the ship-travel tween so the ship
    // visibly follows this same curve.
    const control = hiddenBranchControlPoint(host, dest);
    const g = this.add.graphics().setDepth(2);
    const samples = 60;
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      pts.push(sampleHiddenBranch(host, dest, i / samples, control));
    }
    // Dark underlay
    g.lineStyle(6, 0x121225, 0.85);
    for (let i = 1; i < pts.length; i++) {
      g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    }
    // Dashed accent on top
    g.lineStyle(3, accent, 0.85);
    for (let i = 1; i < pts.length; i += 2) {
      g.lineBetween(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    }
    // Sparkles along the branch
    g.fillStyle(0xffffff, 0.55);
    for (let i = 4; i < pts.length; i += 10) {
      g.fillCircle(pts[i].x, pts[i].y, 2);
    }
  }

  // ============================================================
  // WARP ARRIVAL (after the warp asteroid is solved)
  //
  // GameScene.triggerWarp hands off here via registry flags so the player
  // sees the ship physically traveling from the host world to the freshly
  // discovered hidden world before the destination scene loads.
  // ============================================================
  tryWarpArrival() {
    const hiddenId = this.registry.get('warpArrivalHiddenId');
    if (!hiddenId) return false;

    const hostIdx = HIDDEN_HOST_INDEX[hiddenId];
    const hiddenPos = HIDDEN_NODE_POSITIONS[hiddenId];
    const hostPos = hostIdx != null ? this.nodePositions[hostIdx] : null;

    // Validate BEFORE clearing flags. If anything is missing the kid still
    // ended up on the map (triggerWarp already did discoverHiddenWorld) — drop
    // them straight into the destination so the warp isn't silently dropped.
    if (hostIdx == null || !hiddenPos || !hostPos) {
      this.registry.set('warpArrivalHiddenId', null);
      this.registry.set('warpArrivalFromWorldId', null);
      this._enterHiddenDestination(hiddenId);
      return true;
    }

    this.registry.set('warpArrivalHiddenId', null);
    this.registry.set('warpArrivalFromWorldId', null);

    // Snap the ship to the host world so the journey starts where the
    // player was actually playing. Stop the idle bob so it doesn't fight
    // the travel tween.
    this.currentWorldIndex = hostIdx;
    if (this._bobTween) {
      this._bobTween.stop();
      this._bobTween = null;
    }
    this.shipPet.x = hostPos.x;
    this.shipPet.y = hostPos.y - 30;
    this.shipPet.rotation = 0;
    // NB: scene input stays ENABLED — the full-screen skipHit overlay below
    // (created at depth 900) both captures the tap-to-skip and shields the map
    // nodes. Disabling input here previously killed the skip entirely.

    // Glitch path: GameScene swaps to bossTheme on arrival. Pause the home
    // theme here so the brief travel beat isn't backed by the wrong music.
    if (hiddenId === 15) {
      music.pause();
    }

    let skipped = false;
    let arrived = false;
    let travelTween = null;
    const skipHit = this.add.rectangle(W / 2, H / 2, W, H, 0, 0)
      .setInteractive().setDepth(900);

    // Guard against the natural-completion path and the tap-skip path both
    // firing in the same frame — without the `arrived` flag the tooltip and
    // dwell timer would fire twice.
    const finishArrival = () => {
      if (arrived) return;
      arrived = true;
      // Keep skipHit alive (it's invisible) as an input shield through the
      // arrival dwell so a stray tap can't hit a map node and race the scene
      // swap below; the `arrived` guard makes further taps no-ops, and
      // scene.start in _enterHiddenDestination tears the overlay down.
      this._showArrivalTooltip(this._arrivalTooltipConfig(hiddenId, hiddenPos));
      const dwell = skipped ? 900 : 1600;
      this.time.delayedCall(dwell, () => this._enterHiddenDestination(hiddenId));
    };

    skipHit.on('pointerdown', () => {
      if (skipped || arrived) return;
      skipped = true;
      if (travelTween) travelTween.stop();
      this.tweens.killTweensOf(this.shipPet);
      this.shipPet.x = hiddenPos.x;
      this.shipPet.y = hiddenPos.y - 30;
      this.shipPet.rotation = 0;
      finishArrival();
    });

    // Brief settle so the warp cinematic's fade has fully cleared before
    // the ship animates off.
    this.time.delayedCall(450, () => {
      if (skipped) return;
      travelTween = this._travelAlongBranch(hostPos, hiddenPos, () => {
        if (skipped) return;
        finishArrival();
      });
    });

    return true;
  }

  _arrivalTooltipConfig(hiddenId, pos) {
    if (hiddenId === 16) {
      // Dad's Garage — warm single-line, "you found it" framing.
      return {
        x: pos.x,
        y: pos.y,
        label: "YOU FOUND DAD'S GARAGE",
        accent: 0xffd86b,
        sound: 'playStardustChime'
      };
    }
    // Glitch — celebratory two-line: gold "SECRET WORLD DISCOVERED" +
    // magenta "GLITCH WORLD" subtitle.
    return {
      x: pos.x,
      y: pos.y,
      label: 'SECRET WORLD DISCOVERED',
      subtitle: 'GLITCH WORLD',
      accent: 0xfbbf24,
      subtitleColor: '#ff5cf2',
      sound: 'playStar'
    };
  }

  _travelAlongBranch(host, dest, onArrive) {
    const control = hiddenBranchControlPoint(host, dest);
    audio.playLaser?.();
    const tween = { t: 0 };
    return this.tweens.add({
      targets: tween,
      t: 1,
      duration: 1500,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const pt = sampleHiddenBranch(host, dest, tween.t, control);
        this.shipPet.x = pt.x;
        this.shipPet.y = pt.y - 30;
        const ahead = sampleHiddenBranch(host, dest, Math.min(1, tween.t + 0.02), control);
        const angle = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) - Math.PI / 2;
        this.shipPet.rotation = angle * 0.3;
      },
      onComplete: () => {
        this.shipPet.rotation = 0;
        this.cameras.main.shake(180, 0.004);
        onArrive?.();
      }
    });
  }

  _enterHiddenDestination(hiddenId) {
    if (hiddenId === 15) {
      this.registry.set('currentWorldId', 15);
      this.registry.set('currentLevel', 1);
      this.registry.set('levelMode', 'boss');
      this.scene.start('GameScene');
    } else {
      this.scene.start('HiddenWorldScene', { worldId: hiddenId });
    }
  }

  // ============================================================
  // AUTO-ADVANCE SHIP (after a world is cleared)
  // ============================================================
  tryAutoAdvance() {
    const cleared = progress.justClearedWorld;
    if (!cleared) return;

    const nextId = getNextVisibleWorldId(cleared);
    if (!nextId) {
      // Just cleared the final world — credits handle the flow, nothing to do.
      progress.consumeJustClearedWorld();
      return;
    }

    const clearedIdx = VISIBLE_WORLDS.findIndex(w => w.id === cleared);
    const nextIdx = VISIBLE_WORLDS.findIndex(w => w.id === nextId);

    if (clearedIdx < 0 || nextIdx < 0) {
      progress.consumeJustClearedWorld();
      return;
    }

    // Position ship at cleared world, animate to next.
    this.currentWorldIndex = clearedIdx;
    const startPos = this.nodePositions[clearedIdx];
    this.shipPet.x = startPos.x;
    this.shipPet.y = startPos.y - 30;

    progress.consumeJustClearedWorld();

    // Allow a tap to skip the animation.
    const skipHit = this.add.rectangle(W / 2, H / 2, W, H, 0, 0)
      .setInteractive().setDepth(50);
    let skipped = false;
    let travelTween = null;
    const skip = () => {
      if (skipped) return;
      skipped = true;
      if (travelTween) travelTween.stop();
      const dest = this.nodePositions[nextIdx];
      this.shipPet.x = dest.x;
      this.shipPet.y = dest.y - 30;
      this.shipPet.rotation = 0;
      this.currentWorldIndex = nextIdx;
      this._traveling = false;
      this._startShipBob();
      skipHit.destroy();
      this.input.enabled = true;
      this.showNewWorldTooltip(nextIdx);
    };
    skipHit.on('pointerdown', skip);

    // 600ms hold on the cleared world so the kid registers "you cleared this,"
    // then ship walks the path toward the freshly-unlocked node.
    this.time.delayedCall(600, () => {
      if (skipped) return;
      travelTween = this.travelTo(nextIdx, () => {
        skipHit.destroy();
        this.showNewWorldTooltip(nextIdx);
      });
    });
  }

  showNewWorldTooltip(nextIdx) {
    const pos = this.nodePositions[nextIdx];
    if (!pos) return;
    const world = VISIBLE_WORLDS[nextIdx];
    // Pulse the freshly-unlocked node — three cycles, scale 1.0 → 1.15 → 1.0.
    // Signals "this is the new spot you can play now" before the tooltip fires.
    const node = this.nodeContainers?.[world?.id];
    if (node) {
      this.tweens.add({
        targets: node,
        scale: { from: 1, to: 1.15 },
        duration: 320,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.easeInOut',
      });
    }
    this._showArrivalTooltip({ x: pos.x, y: pos.y });
  }

  _showArrivalTooltip({
    x, y,
    label = 'NEW WORLD UNLOCKED',
    subtitle = null,
    accent = 0xfbbf24,
    subtitleColor = '#ffffff',
    sound = null
  }) {
    const accentHex = '#' + accent.toString(16).padStart(6, '0');

    // Build the text(s) first so we can size the pill to fit any label.
    const labelText = this.add.text(0, subtitle ? -14 : 0, label, style('caption', {
      fontSize: '20px',
      fill: accentHex,
      fontStyle: '900'
    })).setOrigin(0.5);
    let subtitleText = null;
    if (subtitle) {
      subtitleText = this.add.text(0, 16, subtitle, style('caption', {
        fontSize: '16px',
        fill: subtitleColor,
        fontStyle: '900'
      })).setOrigin(0.5);
    }

    const padX = 28;
    const widestText = subtitleText
      ? Math.max(labelText.width, subtitleText.width)
      : labelText.width;
    const halfW = Math.max(140, Math.ceil(widestText / 2) + padX);
    const halfH = subtitle ? 38 : 22;

    // Keep the pill on-screen even when the target node sits near the canvas
    // edge (Glitch lives at x=970, only ~110px from the right edge).
    const margin = 12;
    const clampedX = Math.max(halfW + margin, Math.min(W - halfW - margin, x));

    const tip = this.add.container(clampedX, y - 150).setDepth(18);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 0.92);
    bg.fillRoundedRect(-halfW, -halfH, halfW * 2, halfH * 2, 12);
    bg.lineStyle(2, accent, 0.95);
    bg.strokeRoundedRect(-halfW, -halfH, halfW * 2, halfH * 2, 12);
    tip.add(bg);
    tip.add(labelText);
    if (subtitleText) tip.add(subtitleText);

    tip.alpha = 0;
    this.tweens.add({
      targets: tip,
      alpha: 1,
      y: tip.y - 10,
      duration: 300,
      ease: 'Quad.easeOut'
    });
    if (sound && typeof audio[sound] === 'function') {
      audio[sound]();
    }
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: tip,
        alpha: 0,
        duration: 400,
        onComplete: () => tip.destroy()
      });
    });
  }

  // ============================================================
  // PET BADGE (top-right pet button)
  // ============================================================
  buildPetBadge() {
    const sp = companion.getSpecies();
    const petAccent = sp ? sp.accent : COLORS.accentPurple;
    this.petBadge = createPetPortraitButton(this, {
      x: this._petBadgeX, y: this._petBadgeY, radius: this._petBadgeRadius,
      accentColor: petAccent,
      drawPet: (scene, x, y, opts) => drawCompanion(scene, x, y, opts),
      onClick: () => this.showLoreCard()
    }).setDepth(15);
  }

  refreshPetBadge() {
    if (this.petBadge) this.petBadge.destroy();
    this.buildPetBadge();
  }

  // ============================================================
  // TOAST (fading status text bottom-of-screen)
  // ============================================================
  showToast(message) {
    const toast = this.add.container(W / 2, H - 240).setDepth(120);
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 0.94);
    bg.fillRoundedRect(-280, -36, 560, 72, 20);
    bg.lineStyle(2, 0xfbbf24, 0.95);
    bg.strokeRoundedRect(-280, -36, 560, 72, 20);
    toast.add(bg);
    toast.add(this.add.text(0, 0, message, style('subhead', {
      fontSize: '28px',
      fill: '#ffeaa7',
      fontStyle: '900'
    })).setOrigin(0.5));
    toast.alpha = 0;
    this.tweens.add({
      targets: toast, alpha: 1, y: H - 290,
      duration: 240, ease: 'Quad.easeOut'
    });
    this.time.delayedCall(1800, () => {
      this.tweens.add({
        targets: toast, alpha: 0, y: H - 240,
        duration: 360,
        onComplete: () => toast.destroy()
      });
    });
  }

  showLoreCard() {
    audio.playClick();
    if (progress.companion?.cosmicForm) {
      this.showStageCarousel();
    } else {
      this.showEvolutionLoreCard();
    }
  }

  showStageCarousel() {
    const sp = companion.getSpecies();
    if (!sp) return;

    const cw = 920;
    const ch = 1440;
    const { card } = createModal(this, {
      width: cw, height: ch,
      accentColor: sp.accent,
      radius: 28, strokeWidth: 4,
      overlayAlpha: 0.85,
    });

    const stages = CAROUSEL_STAGE_ORDER;
    let viewIdx = Math.max(0, stages.indexOf(progress.companion.displayStage || companion.getActiveStage()));

    // Chrome (arrows + dots) lives in the outer container so it persists
    // across stage swaps; the per-stage content lives in `slidePane` so we
    // can slide between stages without rebuilding the chrome.
    const chrome = this.add.container(0, 0);
    card.add(chrome);

    let slidePane = null;
    const topY = -ch / 2 + 100;

    const arrowLeft = this.add.text(-cw / 2 + 80, topY, '◀', style('display', {
      fontSize: '54px', fill: '#ffffff',
      stroke: '#0a0a1a', strokeThickness: 4,
    })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    arrowLeft.on('pointerdown', () => slideTo(-1));
    chrome.add(arrowLeft);

    const arrowRight = this.add.text(cw / 2 - 80, topY, '▶', style('display', {
      fontSize: '54px', fill: '#ffffff',
      stroke: '#0a0a1a', strokeThickness: 4,
    })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    arrowRight.on('pointerdown', () => slideTo(1));
    chrome.add(arrowRight);

    const dotSpacing = 58;
    const dotsStartX = -(stages.length - 1) * dotSpacing / 2;
    const dotG = this.add.graphics();
    chrome.add(dotG);

    const renderDots = () => {
      dotG.clear();
      stages.forEach((s, i) => {
        const x = dotsStartX + i * dotSpacing;
        const unlocked = companion.isStageUnlocked(s);
        const isSel = (i === viewIdx);
        if (unlocked) {
          const dotColor = isSel ? sp.accent : 0xcfcfe0;
          dotG.fillStyle(dotColor, 1);
          dotG.fillCircle(x, topY, isSel ? 14 : 10);
        } else {
          dotG.lineStyle(3, 0xcfcfe0, 0.7);
          dotG.strokeCircle(x, topY, 10);
        }
      });
    };

    // Build the per-stage content into a fresh sub-container (so old + new
    // can co-exist mid-slide). Returns the container.
    const buildStagePane = (idx) => {
      const pane = this.add.container(0, 0);
      const stage = stages[idx];
      const isLocked = !companion.isStageUnlocked(stage);
      const stageLore = sp.stages[stage] || {};
      const isActive = stage === companion.getActiveStage();

      const portraitY = -ch / 2 + 480;
      if (isLocked) {
        // Locked stages: silhouette of the actual pet sprite + "???" overlay.
        // Far more evocative than a generic "?" — kid sees the SHAPE coming.
        const portraitScale = PORTRAIT_SCALE_BY_STAGE[stage] ?? 2.0;
        const silhouette = drawCompanion(this, 0, portraitY, { scale: portraitScale, stage });
        silhouette.setAlpha(0.35);
        pane.add(silhouette);
        pane.add(this.add.text(0, portraitY, '???', style('display', {
          fontSize: '120px',
          fill: '#ffffff',
          stroke: '#0a0a1a',
          strokeThickness: 6,
        })).setOrigin(0.5));
      } else {
        const portraitScale = PORTRAIT_SCALE_BY_STAGE[stage] ?? 2.0;
        const portrait = drawCompanion(this, 0, portraitY, { scale: portraitScale, stage });
        pane.add(portrait);
      }

      const nameY = -ch / 2 + 820;
      const displayName = isLocked ? '???' : (stageLore.name || '').toUpperCase();
      pane.add(this.add.text(0, nameY, displayName, style('display', {
        fontSize: '64px',
        fill: '#ffffff',
      })).setOrigin(0.5));

      pane.add(this.add.text(0, nameY + 60, `— ${stage.toUpperCase()} —`, style('caption', {
        fontSize: '30px',
        fill: '#' + sp.accent.toString(16).padStart(6, '0'),
      })).setOrigin(0.5));

      const loreText = isLocked
        ? 'Keep playing to unlock this form.'
        : (stageLore.lore || '');
      pane.add(this.add.text(0, nameY + 150, loreText, style('body', {
        fontSize: '32px',
        fill: isLocked ? '#9a9aae' : '#cfcfe0',
        align: 'center',
        wordWrap: { width: cw - 100 },
        lineSpacing: 8,
      })).setOrigin(0.5));

      const btnY = ch / 2 - 260;
      if (!isLocked && !isActive) {
        pane.add(createButton(this, {
          x: 0, y: btnY,
          width: 520, height: 96,
          label: 'Set as my pet',
          color: sp.accent,
          textStyle: 'subhead',
          textOverrides: { fontSize: '30px', fill: '#0a0a1a', fontStyle: '900' },
          onClick: () => {
            companion.setDisplayStage(stage);
            this.refreshPetBadge();
            this.showToast(`Now showing: ${stageLore.name}`);
            // Replace the current pane so the button flips to "✓ ACTIVE".
            const fresh = buildStagePane(idx);
            card.add(fresh);
            slidePane.destroy();
            slidePane = fresh;
            renderDots();
          },
        }));
      } else if (!isLocked && isActive) {
        const chip = this.add.container(0, btnY);
        const cbg = this.add.graphics();
        cbg.fillStyle(0x58d68d, 0.95);
        cbg.fillRoundedRect(-130, -28, 260, 56, 28);
        chip.add(cbg);
        chip.add(this.add.text(0, 0, '✓ ACTIVE', style('subhead', {
          fontSize: '26px', fill: '#0a0a1a', fontStyle: '900',
        })).setOrigin(0.5));
        pane.add(chip);
      }

      if (companion.isFullyEvolved()) {
        pane.add(createButton(this, {
          x: 0, y: ch / 2 - 140,
          width: 580, height: 84,
          label: 'RAISE ANOTHER COMPANION',
          color: COLORS.accentWarm,
          textStyle: 'subhead',
          textOverrides: { fontSize: '24px', fill: '#0a0a1a', fontStyle: '900' },
          onClick: () => this.confirmRaiseAnother(),
        }));
      }

      return pane;
    };

    let sliding = false;
    const slideTo = (dir) => {
      if (sliding) return;
      audio.playClick?.();
      const nextIdx = (viewIdx + dir + stages.length) % stages.length;
      const outX = dir * -cw;
      const inFromX = dir * cw;

      const newPane = buildStagePane(nextIdx);
      newPane.x = inFromX;
      card.add(newPane);

      const oldPane = slidePane;
      sliding = true;
      this.tweens.add({
        targets: oldPane, x: outX, duration: 250, ease: 'Quad.easeOut',
        onComplete: () => oldPane.destroy(),
      });
      this.tweens.add({
        targets: newPane, x: 0, duration: 250, ease: 'Quad.easeOut',
        onComplete: () => { sliding = false; },
      });

      viewIdx = nextIdx;
      slidePane = newPane;
      renderDots();
    };

    slidePane = buildStagePane(viewIdx);
    card.add(slidePane);
    renderDots();
  }

  confirmRaiseAnother() {
    const sp = companion.getSpecies();
    const { card, close } = createModal(this, {
      width: 820, height: 700,
      accentColor: COLORS.accentWarm,
      radius: 24, strokeWidth: 4,
      overlayAlpha: 0.92,
      closeOnCardTap: false,
      showCloseHint: false
    });
    card.add(this.add.text(0, -240, 'RAISE A NEW COMPANION?', style('display', {
      fontSize: '44px',
      fill: '#ffd86b',
      stroke: '#0a0a1a',
      strokeThickness: 5,
      align: 'center'
    })).setOrigin(0.5));
    card.add(this.add.text(0, -100, `${sp?.stages?.adult?.name || 'Your pet'} will retire to your trophy shelf.\nYou'll pick a brand-new starter and raise it from an egg.\n\nYour cosmetics and ship stay with you.`, style('body', {
      fontSize: '26px',
      fill: '#cfcfe0',
      align: 'center',
      wordWrap: { width: 700 },
      lineSpacing: 8
    })).setOrigin(0.5));

    card.add(createButton(this, {
      x: -180, y: 220, width: 280, height: 92,
      label: 'CANCEL',
      color: 0x6a6a8e,
      textOverrides: { fontSize: '26px', fill: '#0a0a1a', fontStyle: '900' },
      onClick: () => close()
    }));
    card.add(createButton(this, {
      x: 180, y: 220, width: 320, height: 92,
      label: "LET'S DO IT",
      color: COLORS.accentWarm,
      textOverrides: { fontSize: '26px', fill: '#0a0a1a', fontStyle: '900' },
      onClick: () => {
        companion.retireAndStartNew();
        close();
        this.scene.start('StarterPickerScene');
      }
    }));
  }

  showEvolutionLoreCard() {
    const sp = companion.getSpecies();
    const lore = companion.getCurrentLore();
    if (!sp || !lore) return;

    const cw = 920;
    const ch = 1440;
    const { card, close } = createModal(this, {
      width: cw, height: ch,
      accentColor: sp.accent,
      radius: 28, strokeWidth: 4,
      overlayAlpha: 0.85,
      closeOnCardTap: true,
    });

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
        color: COLORS.accentWarm,
        textStyle: 'subhead',
        textOverrides: { fontSize: '28px', fill: '#0a0a1a', fontStyle: '900' },
        onClick: () => {
          companion.retireAndStartNew();
          close();
          this.scene.start('StarterPickerScene');
        }
      });
      card.add(btn);
    }
  }

  // ============================================================
  // PROGRESS HELPERS
  // ============================================================
  findCurrentWorldIndex() {
    const parkedId = this.registry.get('shipParkedWorldId');
    if (parkedId) {
      const parkedIdx = VISIBLE_WORLDS.findIndex(w => w.id === parkedId);
      if (parkedIdx >= 0 && progress.isWorldUnlocked(VISIBLE_WORLDS[parkedIdx].id)) {
        return parkedIdx;
      }
    }
    for (let i = 0; i < VISIBLE_WORLDS.length; i++) {
      const w = VISIBLE_WORLDS[i];
      if (!progress.isWorldUnlocked(w.id)) return Math.max(0, i - 1);
      const wp = progress.getWorldProgress(w.id);
      if (wp.levelsCompleted < w.levelsRequired) return i;
    }
    return VISIBLE_WORLDS.length - 1;
  }

  findFurthestUnlockedIndex() {
    let idx = 0;
    for (let i = 0; i < VISIBLE_WORLDS.length; i++) {
      if (progress.isWorldUnlocked(VISIBLE_WORLDS[i].id)) idx = i;
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
