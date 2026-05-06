// CockpitScene — replaces the old shop. Single rich tappable screen, retro
// 80s arcade vibe (chunky pixel buttons, scanlines on the viewport, blinking
// lights). Holds the shop, the personal-records dashboard, the pet, and the
// ship — everything that isn't gameplay or world map.

import Phaser from 'phaser';
import { audio } from '../AudioManager.js';
import { progress, WORLDS } from '../GameData.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { economy } from '../EconomyManager.js';
import { ship, SHIP_PARTS } from '../ShipManager.js';
import { drawShip } from '../ShipRenderer.js';
import { cosmetics, PET_COSMETICS } from '../CosmeticManager.js';
import { companion, SPECIES } from '../CompanionManager.js';
import { drawCompanion } from '../PetRenderer.js';
import { records, formatFactKey } from '../RecordsManager.js';
import { streak } from '../StreakManager.js';

const W = 800;
const H = 1400;

export class CockpitScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CockpitScene' });
  }

  create() {
    audio.init();

    // Refresh worldsCleared so the dashboard reflects the latest progress.
    records.refreshWorldsCleared(progress, WORLDS);

    this.activeShopTab = null; // null = no panel open; 'paint'|'parts'|'pet'

    this.createBackdrop();
    this.createHeader();
    this.createViewport();
    this.createStatsPanel();
    this.createConsoleButtons();
    this.createPetPerch();
    this.createLaunchButton();

    // Pet "missed you" greeting — fires once per session if the kid was away.
    if (companion.shouldShowMissedYou() && this.petSprite) {
      this.time.delayedCall(450, () => {
        this.petSprite.missedYou?.();
        this.showGreetingBanner();
        companion.markMissedYouShown();
      });
    }

    new TransitionManager(this).fadeIn(280);
  }

  // ============================================================
  // BACKDROP — dark cockpit interior with subtle scanlines
  // ============================================================
  createBackdrop() {
    // Solid dark background
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(0x07071a, 1);
    bg.fillRect(0, 0, W, H);

    // Cockpit floor — chunky perspective-y rectangle at bottom 1/3
    const floor = this.add.graphics().setDepth(1);
    floor.fillStyle(0x12122a, 1);
    floor.fillRect(0, H * 0.55, W, H * 0.45);

    // Floor grid lines (retro arcade vibe)
    floor.lineStyle(2, 0x1f1f3a, 1);
    for (let i = 0; i < 12; i++) {
      const y = H * 0.55 + i * (H * 0.45 / 11);
      floor.lineBetween(0, y, W, y);
    }
    for (let i = 0; i <= 8; i++) {
      const x = i * (W / 8);
      floor.lineBetween(x, H * 0.55, x, H);
    }

    // Scanline overlay across whole scene
    const scan = this.add.graphics().setDepth(60);
    for (let y = 0; y < H; y += 4) {
      scan.fillStyle(0x000000, 0.10);
      scan.fillRect(0, y, W, 1);
    }
  }

  // ============================================================
  // HEADER (back + title + stardust chip)
  // ============================================================
  createHeader() {
    const headerBg = this.add.graphics().setDepth(10);
    headerBg.fillStyle(0x07071a, 0.95);
    headerBg.fillRect(0, 0, W, 110);
    headerBg.lineStyle(3, 0xc77eff, 0.6);
    headerBg.lineBetween(0, 110, W, 110);

    // Back to map
    createIconButton(this, {
      x: 60, y: 60, radius: 28,
      accentColor: 0xc77eff,
      drawIcon: (g, size) => this.drawBackIcon(g, size),
      onClick: () => this.exit()
    }).setDepth(15);

    // Title
    this.add.text(W / 2, 60, 'COCKPIT', style('display', {
      fontSize: '40px',
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(14);

    // Stardust chip
    this.balanceText = this.add.text(W - 60, 60, `${economy.getStardust()}`, style('subhead', {
      fontSize: '28px',
      fill: '#c77eff'
    })).setOrigin(1, 0.5).setDepth(14);
    this.add.text(W - 60 - this.balanceText.width - 12, 60, '✦', {
      fontSize: '28px',
      fill: '#c77eff',
      fontFamily: 'Arial Black'
    }).setOrigin(1, 0.5).setDepth(14);
  }

  drawBackIcon(g, size) {
    g.lineStyle(4, 0xc77eff, 1);
    g.beginPath();
    g.moveTo(size * 0.4, -size * 0.5);
    g.lineTo(-size * 0.4, 0);
    g.lineTo(size * 0.4, size * 0.5);
    g.strokePath();
  }

  // ============================================================
  // VIEWPORT — top half, scanlined window onto the current sector
  // ============================================================
  createViewport() {
    const vpX = W / 2;
    const vpY = 280;
    const vpW = 640;
    const vpH = 280;

    // Frame
    const frame = this.add.graphics().setDepth(11);
    frame.fillStyle(0x1a1a30, 1);
    frame.fillRoundedRect(vpX - vpW / 2 - 10, vpY - vpH / 2 - 10, vpW + 20, vpH + 20, 24);
    frame.lineStyle(4, 0x4ecdc4, 0.8);
    frame.strokeRoundedRect(vpX - vpW / 2 - 10, vpY - vpH / 2 - 10, vpW + 20, vpH + 20, 24);

    // Inner viewport — animated star sprinkles
    const inner = this.add.graphics().setDepth(12);
    inner.fillStyle(0x05051a, 1);
    inner.fillRoundedRect(vpX - vpW / 2, vpY - vpH / 2, vpW, vpH, 16);

    // Stars in the viewport (parallax-like)
    const stars = this.add.graphics().setDepth(13);
    const starList = [];
    for (let i = 0; i < 40; i++) {
      const sx = vpX - vpW / 2 + Math.random() * vpW;
      const sy = vpY - vpH / 2 + Math.random() * vpH;
      const sr = Math.random() < 0.7 ? 1 : 2;
      starList.push({ x: sx, y: sy, r: sr, baseAlpha: 0.5 + Math.random() * 0.5, phase: Math.random() * Math.PI * 2 });
    }
    this.starList = starList;
    this.viewportStars = stars;

    // Current world planet
    const currentWorldId = progress.currentWorld || 1;
    const world = WORLDS[currentWorldId - 1] || WORLDS[0];
    const planet = this.add.graphics().setDepth(14);
    planet.fillStyle(world.accentColor, 0.9);
    planet.fillCircle(vpX + 140, vpY + 30, 50);
    planet.fillStyle(0x000000, 0.20);
    planet.fillCircle(vpX + 160, vpY + 30, 50);
    // Tiny ring for some worlds
    if (currentWorldId === 5 || currentWorldId === 9) {
      planet.lineStyle(3, world.accentColor, 0.7);
      planet.strokeEllipse(vpX + 140, vpY + 30, 130, 22);
    }

    this.add.text(vpX - vpW / 2 + 16, vpY - vpH / 2 + 16, world.name.toUpperCase(), style('caption', {
      fontSize: '16px',
      fill: '#4ecdc4',
      fontStyle: '900'
    })).setDepth(15);

    this.add.text(vpX - vpW / 2 + 16, vpY - vpH / 2 + 38, '— SECTOR VIEW —', style('caption', {
      fontSize: '12px',
      fill: '#4ecdc4'
    })).setDepth(15).setAlpha(0.7);

    // Scanline overlay just on viewport (denser)
    const vpScan = this.add.graphics().setDepth(16);
    for (let y = vpY - vpH / 2; y < vpY + vpH / 2; y += 3) {
      vpScan.fillStyle(0x4ecdc4, 0.04);
      vpScan.fillRect(vpX - vpW / 2, y, vpW, 1);
    }

    // Hit area — tap viewport to launch back to map
    const hit = this.add.rectangle(vpX, vpY, vpW, vpH, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(18);
    hit.on('pointerdown', () => {
      audio.playClick?.();
      this.exit();
    });

    // Tip text under viewport
    this.add.text(vpX, vpY + vpH / 2 + 24, '↑ tap viewport to launch ↑', style('caption', {
      fontSize: '14px',
      fill: '#4ecdc4'
    })).setOrigin(0.5).setDepth(15).setAlpha(0.7);
  }

  // ============================================================
  // STATS PANEL — left wall, personal records readout
  // ============================================================
  createStatsPanel() {
    const px = 24;
    const py = 470;
    const pw = 360;
    const ph = 280;

    const panel = this.add.graphics().setDepth(11);
    panel.fillStyle(0x12122a, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 14);
    panel.lineStyle(3, 0xffd86b, 0.7);
    panel.strokeRoundedRect(px, py, pw, ph, 14);

    // Tiny status LED
    const led = this.add.circle(px + 18, py + 18, 5, 0x58d68d, 1).setDepth(13);
    this.tweens.add({
      targets: led,
      alpha: { from: 0.4, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add.text(px + 38, py + 18, 'LOG // PERSONAL RECORDS', style('caption', {
      fontSize: '14px',
      fill: '#ffd86b',
      fontStyle: '900'
    })).setDepth(13).setOrigin(0, 0.5);

    // Body lines (CRT readout style)
    const lineH = 26;
    let y = py + 50;
    const todayMs = records.getTodayAvgMs();
    const todaySamples = records.getTodaySamples();
    const todayLabel = todayMs > 0
      ? `${(todayMs / 1000).toFixed(2)}s avg (${todaySamples})`
      : '— no plays today —';
    this.addStatLine(px + 20, y, 'TODAY AVG', todayLabel); y += lineH;
    this.addStatLine(px + 20, y, 'BEST STREAK', `${records.getLongestStreak()}`); y += lineH;
    this.addStatLine(px + 20, y, 'WORLDS DONE', `${records.getWorldsCleared()} / ${WORLDS.length}`); y += lineH;
    this.addStatLine(px + 20, y, 'TOTAL STARS', `${progress.totalStars}`); y += lineH;
    this.addStatLine(px + 20, y, 'DAY STREAK', `${streak.getCurrent()}d (best ${streak.getBest()})`); y += lineH + 6;

    // Top fastest facts header
    this.add.text(px + 20, y, '// FASTEST FACTS', style('caption', {
      fontSize: '12px',
      fill: '#ffd86b'
    })).setDepth(13);
    y += 18;
    const top = records.getTopFastFacts(3);
    if (top.length === 0) {
      this.add.text(px + 20, y, '— none yet —', style('caption', {
        fontSize: '14px',
        fill: '#7a7a90'
      })).setDepth(13);
    } else {
      top.forEach((f) => {
        this.add.text(px + 20, y, `${formatFactKey(f.key)}`, style('caption', {
          fontSize: '14px',
          fill: '#cfcfe0'
        })).setDepth(13);
        this.add.text(px + pw - 20, y, `${(f.ms / 1000).toFixed(2)}s`, style('caption', {
          fontSize: '14px',
          fill: '#58d68d'
        })).setDepth(13).setOrigin(1, 0);
        y += 18;
      });
    }

    // Pending flash (new record celebration)
    const flash = records.consumeFlash();
    if (flash) {
      const flashLabel = this.add.text(px + pw / 2, py + ph - 20, `★ NEW: ${flash}`, style('caption', {
        fontSize: '14px',
        fill: '#ffd86b',
        fontStyle: '900'
      })).setOrigin(0.5).setDepth(13);
      this.tweens.add({
        targets: flashLabel,
        alpha: { from: 1, to: 0.4 },
        duration: 600,
        yoyo: true,
        repeat: 4,
        ease: 'Sine.easeInOut'
      });
    }
  }

  addStatLine(x, y, label, value) {
    this.add.text(x, y, label, style('caption', {
      fontSize: '13px',
      fill: '#7a7a90'
    })).setDepth(13);
    this.add.text(x + 340, y, value, style('caption', {
      fontSize: '14px',
      fill: '#ffffff',
      fontStyle: '900'
    })).setDepth(13).setOrigin(1, 0);
  }

  // ============================================================
  // CONSOLE BUTTONS — right wall, opens shop categories as overlays
  // ============================================================
  createConsoleButtons() {
    const x = W - 24;
    const startY = 470;
    const w = 220;
    const h = 88;
    const gap = 14;

    const buttons = [
      { id: 'paint', label: 'PAINT',     accent: 0xff6b9d, drawIcon: g => this.drawPaintIcon(g) },
      { id: 'parts', label: 'PARTS',     accent: 0x4ecdc4, drawIcon: g => this.drawPartsIcon(g) },
      { id: 'pet',   label: 'PET ITEMS', accent: 0xffd86b, drawIcon: g => this.drawPetItemsIcon(g) }
    ];

    buttons.forEach((b, i) => {
      const y = startY + i * (h + gap);
      const c = this.add.container(x - w + w / 2 - 24 + 24, y + h / 2).setDepth(12);
      c.x = x - w / 2;

      const bg = this.add.graphics();
      bg.fillStyle(0x1a1a30, 0.95);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      bg.lineStyle(3, b.accent, 0.85);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
      c.add(bg);

      // Chunky icon on left
      const icon = this.add.graphics();
      icon.x = -w / 2 + 36;
      b.drawIcon(icon);
      c.add(icon);

      // Label
      const label = this.add.text(20, 0, b.label, style('subhead', {
        fontSize: '20px',
        fill: '#ffffff'
      })).setOrigin(0.5);
      c.add(label);

      // Blinking light
      const led = this.add.circle(w / 2 - 14, -h / 2 + 12, 4, b.accent, 1);
      c.add(led);
      this.tweens.add({
        targets: led,
        alpha: { from: 0.3, to: 1 },
        duration: 800 + i * 130,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      c.add(hit);
      hit.on('pointerdown', () => this.openShopPanel(b.id));
      hit.on('pointerover', () => this.tweens.add({ targets: c, scaleX: 1.04, scaleY: 1.04, duration: 100 }));
      hit.on('pointerout', () => this.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 100 }));
    });
  }

  drawPaintIcon(g) {
    g.fillStyle(0xff6b9d, 1);
    g.fillRoundedRect(-12, -10, 24, 22, 4);
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(-8, -6, 4, 4);
    g.fillStyle(0x07071a, 1);
    g.fillRect(-14, 12, 28, 4);
  }

  drawPartsIcon(g) {
    g.lineStyle(3, 0x4ecdc4, 1);
    const teeth = 8;
    const outer = 13;
    const inner = 9;
    g.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? outer : inner;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.strokePath();
    g.fillStyle(0x07071a, 1);
    g.fillCircle(0, 0, 4);
  }

  drawPetItemsIcon(g) {
    // Tiny hat
    g.fillStyle(0xffd86b, 1);
    g.fillRoundedRect(-12, -6, 24, 8, 4);
    g.fillRect(-14, 2, 28, 4);
    g.fillStyle(0xff6b9d, 1);
    g.fillCircle(0, -10, 3);
  }

  // ============================================================
  // PET PERCH — front-and-center: pet sits on a chunky pedestal
  // ============================================================
  createPetPerch() {
    const cx = W / 2;
    const cy = 850;

    // Perch pedestal (pixel art-ish)
    const ped = this.add.graphics().setDepth(11);
    ped.fillStyle(0x2a2a44, 1);
    ped.fillRoundedRect(cx - 70, cy + 20, 140, 26, 8);
    ped.fillStyle(0x4ecdc4, 0.4);
    ped.fillRoundedRect(cx - 60, cy + 22, 120, 6, 3);
    ped.lineStyle(3, 0x4ecdc4, 0.8);
    ped.strokeRoundedRect(cx - 70, cy + 20, 140, 26, 8);
    // Side bolts
    ped.fillStyle(0x4ecdc4, 0.85);
    ped.fillCircle(cx - 60, cy + 33, 3);
    ped.fillCircle(cx + 60, cy + 33, 3);

    if (companion.hasStarter()) {
      this.petSprite = drawCompanion(this, cx, cy - 30, { scale: 1.1 });
      this.petSprite.setDepth(13);

      // Hit area for tapping pet → lore card
      const hit = this.add.circle(cx, cy - 30, 80, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(20);
      hit.on('pointerdown', () => this.showLoreCard());

      // Pet name plaque
      const sp = companion.getSpecies();
      const lore = companion.getCurrentLore();
      this.add.text(cx, cy + 70, lore?.name || sp.name, style('subhead', {
        fontSize: '24px',
        fill: '#ffffff'
      })).setOrigin(0.5).setDepth(13);
      this.add.text(cx, cy + 96, '— tap pet for lore —', style('caption', {
        fontSize: '13px',
        fill: '#7a7a90'
      })).setOrigin(0.5).setDepth(13);
    } else {
      this.add.text(cx, cy - 20, 'NO PILOT', style('caption', {
        fontSize: '20px',
        fill: '#7a7a90'
      })).setOrigin(0.5).setDepth(13);
    }
  }

  // Lore card overlay — tap pet to show
  showLoreCard() {
    audio.playClick?.();
    const sp = companion.getSpecies();
    const lore = companion.getCurrentLore();
    if (!sp || !lore) return;

    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
      .setDepth(80).setInteractive();
    const card = this.add.container(W / 2, H / 2).setDepth(81);

    const cw = 600;
    const ch = 520;
    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 1);
    bg.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 22);
    bg.lineStyle(4, sp.accent, 0.9);
    bg.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 22);
    card.add(bg);

    // Stage portrait — bigger
    const portrait = drawCompanion(this, 0, -ch / 2 + 150, { scale: 1.3 });
    card.add(portrait);

    card.add(this.add.text(0, -ch / 2 + 280, lore.name.toUpperCase(), style('display', {
      fontSize: '36px',
      fill: '#ffffff'
    })).setOrigin(0.5));
    card.add(this.add.text(0, -ch / 2 + 320, lore.type, style('caption', {
      fontSize: '16px',
      fill: '#' + sp.accent.toString(16).padStart(6, '0')
    })).setOrigin(0.5));
    card.add(this.add.text(0, -ch / 2 + 380, lore.lore, style('body', {
      fontSize: '18px',
      fill: '#cfcfe0',
      align: 'center',
      wordWrap: { width: cw - 80 }
    })).setOrigin(0.5));

    // Stage progress
    const prog = companion.getStageProgress();
    if (prog.nextStage) {
      const pct = Math.min(1, prog.current / prog.target);
      const barW = cw - 100;
      const barG = this.add.graphics();
      barG.fillStyle(0x2a2a44, 1);
      barG.fillRoundedRect(-barW / 2, ch / 2 - 60, barW, 12, 6);
      barG.fillStyle(sp.accent, 1);
      barG.fillRoundedRect(-barW / 2, ch / 2 - 60, barW * pct, 12, 6);
      card.add(barG);
      card.add(this.add.text(0, ch / 2 - 40, `${prog.current} / ${prog.target} pellets → next stage`, style('caption', {
        fontSize: '12px',
        fill: '#7a7a90'
      })).setOrigin(0.5));
    } else {
      card.add(this.add.text(0, ch / 2 - 50, 'FULLY EVOLVED', style('caption', {
        fontSize: '14px',
        fill: '#ffd86b',
        fontStyle: '900'
      })).setOrigin(0.5));
    }

    const close = this.add.text(0, ch / 2 - 10, '× CLOSE ×', style('caption', {
      fontSize: '14px',
      fill: '#ff6b6b',
      fontStyle: '900'
    })).setOrigin(0.5);
    card.add(close);

    const cardHit = this.add.rectangle(W / 2, H / 2, cw, ch, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(82);

    const cleanup = () => {
      audio.playClick?.();
      ov.destroy();
      card.destroy();
      cardHit.destroy();
    };
    cardHit.on('pointerdown', cleanup);
    ov.on('pointerdown', cleanup);
  }

  // ============================================================
  // LAUNCH BUTTON — chunky rocker switch, returns to current world
  // ============================================================
  createLaunchButton() {
    const cx = W / 2;
    const cy = 1050;
    const c = this.add.container(cx, cy).setDepth(13);

    // Switch base
    const base = this.add.graphics();
    base.fillStyle(0x2a2a44, 1);
    base.fillRoundedRect(-160, -60, 320, 120, 18);
    base.lineStyle(4, 0xff8b3d, 0.95);
    base.strokeRoundedRect(-160, -60, 320, 120, 18);
    c.add(base);

    // Inner button
    const btn = this.add.graphics();
    btn.fillStyle(0xff6b9d, 1);
    btn.fillRoundedRect(-130, -38, 260, 76, 12);
    btn.lineStyle(3, 0xff8b3d, 1);
    btn.strokeRoundedRect(-130, -38, 260, 76, 12);
    btn.fillStyle(0xffffff, 0.18);
    btn.fillRoundedRect(-120, -32, 240, 18, 8);
    c.add(btn);

    c.add(this.add.text(0, 0, '◤  LAUNCH  ◢', style('display', {
      fontSize: '38px',
      fill: '#ffffff',
      stroke: '#5a1730',
      strokeThickness: 3
    })).setOrigin(0.5));

    // Pulsing accent
    this.tweens.add({
      targets: btn,
      alpha: { from: 1, to: 0.85 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const hit = this.add.rectangle(0, 0, 320, 120, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerdown', () => {
      audio.playClick?.();
      this.exit();
    });
    hit.on('pointerover', () => this.tweens.add({ targets: c, scaleX: 1.04, scaleY: 1.04, duration: 100 }));
    hit.on('pointerout', () => this.tweens.add({ targets: c, scaleX: 1, scaleY: 1, duration: 100 }));

    // Ship preview right under the button — shows the current ship config
    const shipPreview = drawShip(this, cx, cy + 200, { scale: 1.3, parts: ship.getCurrentParts() });
    shipPreview.setDepth(13);
    this.tweens.add({
      targets: shipPreview,
      y: cy + 195,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // ============================================================
  // SHOP PANEL OVERLAY — tap a console button to open category
  // ============================================================
  openShopPanel(category) {
    audio.playClick?.();
    this.closeShopPanel();
    this.activeShopTab = category;

    const ov = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
      .setDepth(80).setInteractive();
    const panel = this.add.container(W / 2, H / 2).setDepth(81);
    this._shopOverlay = [ov, panel];

    const pw = 720;
    const ph = 1140;
    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 1);
    bg.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 22);
    bg.lineStyle(4, 0xc77eff, 0.9);
    bg.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 22);
    panel.add(bg);

    const titleMap = { paint: 'SHIP PAINT', parts: 'SHIP PARTS', pet: 'PET ITEMS' };
    panel.add(this.add.text(0, -ph / 2 + 50, titleMap[category], style('display', {
      fontSize: '36px',
      fill: '#ffffff'
    })).setOrigin(0.5));

    const items = this.itemsForCategory(category);

    const cardW = 200;
    const cardH = 240;
    const cols = 3;
    const colGap = 14;
    const rowGap = 16;
    const rowWidth = cols * cardW + (cols - 1) * colGap;
    const startX = -rowWidth / 2 + cardW / 2;
    const startY = -ph / 2 + 130;

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + colGap);
      const y = startY + row * (cardH + rowGap);
      const card = this.makeShopCard(item, category, cardW, cardH);
      card.x = x;
      card.y = y;
      panel.add(card);
    });

    // Stardust balance + close button at the bottom
    const balY = ph / 2 - 80;
    panel.add(this.add.text(-pw / 2 + 30, balY, `✦ ${economy.getStardust()} stardust`, style('subhead', {
      fontSize: '22px',
      fill: '#c77eff'
    })).setOrigin(0, 0.5));

    const close = this.add.text(pw / 2 - 30, balY, '× CLOSE', style('subhead', {
      fontSize: '22px',
      fill: '#ff6b6b'
    })).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    panel.add(close);
    close.on('pointerdown', () => this.closeShopPanel());
    ov.on('pointerdown', () => this.closeShopPanel());
  }

  closeShopPanel() {
    if (!this._shopOverlay) return;
    this._shopOverlay.forEach(el => el.destroy());
    this._shopOverlay = null;
    this.activeShopTab = null;
    // Refresh stardust display in header
    this.balanceText.setText(`${economy.getStardust()}`);
  }

  itemsForCategory(category) {
    if (category === 'paint') return SHIP_PARTS.filter(p => p.slot === 'paint');
    if (category === 'parts') return SHIP_PARTS.filter(p => p.slot !== 'paint');
    return PET_COSMETICS;
  }

  makeShopCard(item, category, w, h) {
    const card = this.add.container(0, 0);
    const isShipItem = category === 'paint' || category === 'parts';
    const owned = isShipItem ? ship.ownsPart(item.id) : cosmetics.ownsItem(item.id);
    const equipped = isShipItem
      ? ship.getCurrentParts()[item.slot] === item.id
      : cosmetics.getEquipped()[item.slot] === item.id;
    const canAfford = economy.canAfford(item.price);

    let borderColor = 0x3a3a4a;
    if (equipped) borderColor = 0x58d68d;
    else if (owned) borderColor = 0x4ecdc4;
    else if (canAfford) borderColor = 0xc77eff;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a30, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    bg.lineStyle(equipped || owned ? 3 : 2, borderColor, owned || canAfford ? 0.95 : 0.4);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
    card.add(bg);

    // Preview
    if (isShipItem) {
      const previewParts = { ...ship.getCurrentParts(), [item.slot]: item.id };
      const preview = drawShip(this, 0, -h / 2 + 70, { scale: 0.6, parts: previewParts });
      card.add(preview);
    } else {
      // Cosmetic swatch — color disc with item name
      const disc = this.add.graphics();
      disc.fillStyle(item.color, 1);
      disc.fillCircle(0, -h / 2 + 70, 36);
      disc.lineStyle(3, 0x07071a, 0.8);
      disc.strokeCircle(0, -h / 2 + 70, 36);
      card.add(disc);
    }

    // Name
    card.add(this.add.text(0, h / 2 - 90, item.name, style('subhead', {
      fontSize: '16px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: w - 16 }
    })).setOrigin(0.5));

    // Status / price chip
    let badgeText = '';
    let badgeColor = 0x4ecdc4;
    if (equipped) { badgeText = 'EQUIPPED'; badgeColor = 0x58d68d; }
    else if (owned) { badgeText = 'TAP TO EQUIP'; badgeColor = 0x4ecdc4; }
    else if (item.unlock?.type === 'streak') { badgeText = `${item.unlock.days}-DAY`; badgeColor = 0xff8b3d; }
    else if (item.price === 0) { badgeText = 'FREE'; badgeColor = 0xc77eff; }
    else { badgeText = `✦ ${item.price}`; badgeColor = canAfford ? 0xc77eff : 0x3a3a4a; }

    const badge = this.add.graphics();
    badge.fillStyle(badgeColor, 0.9);
    badge.fillRoundedRect(-w / 2 + 12, h / 2 - 50, w - 24, 32, 16);
    card.add(badge);
    card.add(this.add.text(0, h / 2 - 34, badgeText, style('caption', {
      fontSize: '14px',
      fill: '#0a0a1a',
      fontStyle: '900'
    })).setOrigin(0.5));

    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    card.add(hit);
    hit.on('pointerdown', () => this.handleShopTap(item, category, owned, equipped, canAfford));
    return card;
  }

  handleShopTap(item, category, owned, equipped, canAfford) {
    audio.playClick?.();
    if (equipped) return;

    const isShipItem = category === 'paint' || category === 'parts';

    if (owned) {
      if (isShipItem) ship.equipPart(item.id);
      else cosmetics.equipItem(item.id);
      this.openShopPanel(category);
      return;
    }
    if (item.unlock) return;
    if (item.price > 0 && !canAfford) return;
    if (item.price > 0) economy.spendStardust(item.price);
    if (isShipItem) {
      ship.addOwnedPart(item.id);
      ship.equipPart(item.id);
    } else {
      cosmetics.addOwned(item.id);
      cosmetics.equipItem(item.id);
    }
    audio.playLevelComplete?.();
    this.openShopPanel(category);
  }

  // ============================================================
  // GREETING BANNER (missed-you)
  // ============================================================
  showGreetingBanner() {
    const sp = companion.getSpecies();
    const lore = companion.getCurrentLore();
    const text = `${lore?.name || sp?.name || 'Pet'} missed you!`;

    const c = this.add.container(W / 2, 200).setDepth(70);
    c.alpha = 0;

    const bg = this.add.graphics();
    bg.fillStyle(sp?.accent || 0xffd86b, 0.9);
    bg.fillRoundedRect(-180, -22, 360, 44, 22);
    c.add(bg);

    c.add(this.add.text(0, 0, text, style('subhead', {
      fontSize: '20px',
      fill: '#0a0a1a',
      fontStyle: '900'
    })).setOrigin(0.5));

    this.tweens.add({
      targets: c,
      alpha: 1,
      y: 220,
      duration: 350,
      ease: 'Back.easeOut'
    });
    this.time.delayedCall(2400, () => {
      this.tweens.add({
        targets: c,
        alpha: 0,
        y: 200,
        duration: 350,
        onComplete: () => c.destroy()
      });
    });
  }

  // ============================================================
  // UPDATE LOOP — animate viewport stars
  // ============================================================
  update(time) {
    if (!this.viewportStars || !this.starList) return;
    this.viewportStars.clear();
    const t = time / 1000;
    for (const s of this.starList) {
      const a = s.baseAlpha * (0.7 + 0.3 * Math.sin(t * 1.6 + s.phase));
      this.viewportStars.fillStyle(0xffffff, a);
      this.viewportStars.fillCircle(s.x, s.y, s.r);
    }
  }

  exit() {
    new TransitionManager(this).fadeToScene('WorldMapScene');
  }
}
