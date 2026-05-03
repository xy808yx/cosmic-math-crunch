import Phaser from 'phaser';
import { audio } from '../AudioManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { economy } from '../EconomyManager.js';
import { ship, SHIP_PARTS } from '../ShipManager.js';
import { cosmetics, PET_COSMETICS } from '../CosmeticManager.js';
import { drawShip } from '../ShipRenderer.js';
import { getFeaturedIds } from '../FeaturedItems.js';

const W = 800;
const H = 1400;

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    audio.init();
    createStarfield(this, { accentStrength: 0 });

    this.activeTab = this.registry.get('shopTab') || 'pet';
    this.featuredIds = getFeaturedIds();

    this.createHeader();
    this.createFeaturedBanner();
    this.createTabStrip();
    this.cardLayer = this.add.container(0, 0).setDepth(8);
    this.renderGrid();

    new TransitionManager(this).fadeIn(300);
  }

  createFeaturedBanner() {
    if (this.featuredIds.size === 0) return;
    // Sits between the tab strip and the grid.
    const banner = this.add.container(W / 2, 240).setDepth(13);
    const bg = this.add.graphics();
    bg.fillStyle(0xffd86b, 0.14);
    bg.fillRoundedRect(-280, -16, 560, 32, 16);
    bg.lineStyle(2, 0xffd86b, 0.5);
    bg.strokeRoundedRect(-280, -16, 560, 32, 16);
    banner.add(bg);

    banner.add(this.add.text(0, 0, '✦ Featured this week — gold-bordered cards', style('caption', {
      fontSize: '16px',
      fill: '#ffd86b',
      fontStyle: '900'
    })).setOrigin(0.5));
  }

  // ============================================================
  // HEADER
  // ============================================================
  createHeader() {
    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(0x07071a, 0.95);
    bg.fillRect(0, 0, W, 220);
    bg.fillStyle(0x07071a, 0.7);
    bg.fillRect(0, 220, W, 20);

    // Back button
    createIconButton(this, {
      x: 60, y: 60, radius: 28,
      accentColor: 0xc77eff,
      drawIcon: (g, size) => this.drawBackIcon(g, size),
      onClick: () => this.exit()
    }).setDepth(15);

    // Title
    this.add.text(W / 2, 70, 'Cosmic Shop', style('display', {
      fontSize: '50px',
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(14);

    // Stardust balance chip
    this.balanceChip = this.add.container(W - 120, 60).setDepth(14);
    const chipBg = this.add.graphics();
    chipBg.fillStyle(0x12122a, 0.85);
    chipBg.fillRoundedRect(-90, -28, 180, 56, 28);
    chipBg.lineStyle(2, 0xc77eff, 0.7);
    chipBg.strokeRoundedRect(-90, -28, 180, 56, 28);
    this.balanceChip.add(chipBg);

    const sparkle = this.add.graphics();
    sparkle.fillStyle(0xc77eff, 1);
    sparkle.beginPath();
    sparkle.moveTo(-58, -10);
    sparkle.lineTo(-50, 0);
    sparkle.lineTo(-58, 10);
    sparkle.lineTo(-66, 0);
    sparkle.closePath();
    sparkle.fillPath();
    sparkle.fillStyle(0xffffff, 0.9);
    sparkle.fillCircle(-58, -2, 2);
    this.balanceChip.add(sparkle);

    this.balanceText = this.add.text(10, 0, `${economy.getStardust()}`, style('subhead', {
      fontSize: '30px',
      fill: '#c77eff'
    })).setOrigin(0.5);
    this.balanceChip.add(this.balanceText);
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
  // TAB STRIP
  // ============================================================
  createTabStrip() {
    const tabs = [
      { id: 'pet', label: 'Pet' },
      { id: 'ship', label: 'Ship' }
    ];
    const tabW = 220;
    const tabH = 64;
    const gap = 20;
    const total = tabs.length * tabW + (tabs.length - 1) * gap;
    const startX = W / 2 - total / 2 + tabW / 2;

    this.tabContainers = {};
    tabs.forEach((tab, i) => {
      const x = startX + i * (tabW + gap);
      const c = this.add.container(x, 170).setDepth(13);

      const isActive = this.activeTab === tab.id;
      const tabBg = this.add.graphics();
      tabBg.fillStyle(isActive ? 0xc77eff : 0x12122a, isActive ? 1 : 0.85);
      tabBg.fillRoundedRect(-tabW / 2, -tabH / 2, tabW, tabH, 14);
      tabBg.lineStyle(2, 0xc77eff, isActive ? 1 : 0.4);
      tabBg.strokeRoundedRect(-tabW / 2, -tabH / 2, tabW, tabH, 14);
      c.add(tabBg);

      const label = this.add.text(0, 0, tab.label, style('subhead', {
        fontSize: '28px',
        fill: isActive ? '#0a0a1a' : '#ffffff'
      })).setOrigin(0.5);
      c.add(label);

      const hit = this.add.rectangle(0, 0, tabW, tabH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      c.add(hit);
      hit.on('pointerdown', () => this.switchTab(tab.id));

      this.tabContainers[tab.id] = c;
    });
  }

  switchTab(tabId) {
    if (tabId === this.activeTab) return;
    audio.playClick();
    this.activeTab = tabId;
    this.registry.set('shopTab', tabId);

    // Re-render the tab strip + grid
    Object.values(this.tabContainers).forEach(c => c.destroy());
    this.tabContainers = {};
    this.createTabStrip();

    this.cardLayer.removeAll(true);
    this.renderGrid();
  }

  // ============================================================
  // GRID
  // ============================================================
  renderGrid() {
    const items = this.activeTab === 'pet' ? PET_COSMETICS : SHIP_PARTS;
    const cardW = 220;
    const cardH = 280;
    const cols = 3;
    const colGap = 20;
    const rowGap = 24;
    const startY = 410;
    const rowWidth = cols * cardW + (cols - 1) * colGap;
    const startX = W / 2 - rowWidth / 2 + cardW / 2;

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + colGap);
      const y = startY + row * (cardH + rowGap);
      this.createItemCard(item, x, y, cardW, cardH);
    });
  }

  createItemCard(item, x, y, w, h) {
    const card = this.add.container(x, y);
    this.cardLayer.add(card);

    const isShip = this.activeTab === 'ship';
    const owned = isShip ? ship.ownsPart(item.id) : cosmetics.ownsItem(item.id);
    const equipped = isShip
      ? ship.getCurrentParts()[item.slot] === item.id
      : cosmetics.getEquipped()[item.slot] === item.id;
    const canAfford = economy.canAfford(item.price);
    const isFeatured = this.featuredIds.has(item.id) && !owned;
    const isNew = isShip ? ship.isNew(item.id) : cosmetics.isNew(item.id);

    // Card background
    const bg = this.add.graphics();
    let borderColor = 0x3a3a4a;
    if (equipped) borderColor = 0x58d68d;
    else if (owned) borderColor = 0x4ecdc4;
    else if (isFeatured) borderColor = 0xffd86b;
    else if (canAfford) borderColor = 0xc77eff;

    bg.fillStyle(0x12122a, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    bg.lineStyle(equipped || owned || isFeatured ? 4 : 3, borderColor, owned || canAfford || isFeatured ? 0.95 : 0.45);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    card.add(bg);

    // FEATURED ribbon (top-left)
    if (isFeatured) {
      const ribbon = this.add.graphics();
      ribbon.fillStyle(0xffd86b, 1);
      ribbon.fillRoundedRect(-w / 2 + 6, -h / 2 + 6, 78, 22, 11);
      card.add(ribbon);
      card.add(this.add.text(-w / 2 + 45, -h / 2 + 17, 'FEATURED', style('caption', {
        fontSize: '11px',
        fill: '#1a1a26',
        fontStyle: '900'
      })).setOrigin(0.5));
    }

    // NEW! ribbon (top-right) — only for owned-but-unseen items
    if (isNew) {
      const ribbon = this.add.graphics();
      ribbon.fillStyle(0xff5b6e, 1);
      ribbon.fillRoundedRect(w / 2 - 56, -h / 2 + 6, 50, 22, 11);
      card.add(ribbon);
      card.add(this.add.text(w / 2 - 31, -h / 2 + 17, 'NEW!', style('caption', {
        fontSize: '12px',
        fill: '#ffffff',
        fontStyle: '900'
      })).setOrigin(0.5));
    }

    // Preview thumbnail
    const previewY = -h / 2 + 80;
    if (isShip) {
      const previewParts = { ...ship.getCurrentParts(), [item.slot]: item.id };
      const preview = drawShip(this, 0, previewY + 10, { scale: 0.8, parts: previewParts });
      card.add(preview);
    } else {
      const swatch = this.drawCosmeticSwatch(item, 0, previewY);
      card.add(swatch);
    }

    // Item name
    card.add(this.add.text(0, h / 2 - 110, item.name, style('subhead', {
      fontSize: '22px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: w - 30 }
    })).setOrigin(0.5));

    // State badge / price
    if (equipped) {
      this.drawStateBadge(card, w, h, 'EQUIPPED', 0x58d68d);
    } else if (owned) {
      this.drawStateBadge(card, w, h, 'OWNED — TAP', 0x4ecdc4);
    } else if (item.unlock?.type === 'streak') {
      this.drawStateBadge(card, w, h, `${item.unlock.days}-DAY STREAK`, 0xff8b3d);
    } else if (item.price === 0) {
      this.drawStateBadge(card, w, h, 'FREE', 0xc77eff);
    } else {
      this.drawPriceChip(card, w, h, item.price, canAfford);
    }

    // Hit area
    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    card.add(hit);

    hit.on('pointerover', () => {
      this.tweens.add({ targets: card, scaleX: 1.04, scaleY: 1.04, duration: 100 });
    });
    hit.on('pointerout', () => {
      this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 100 });
    });
    hit.on('pointerdown', () => this.handleTap(item, owned, equipped, canAfford, card));
  }

  // ============================================================
  // PREVIEW SWATCHES
  // ============================================================
  drawCosmeticSwatch(item, x, y) {
    const c = this.add.container(x, y);

    // Background disc
    const disc = this.add.graphics();
    disc.fillStyle(0x1a1a30, 1);
    disc.fillCircle(0, 0, 56);
    disc.lineStyle(2, item.color, 0.6);
    disc.strokeCircle(0, 0, 56);
    c.add(disc);

    if (item.slot === 'hat') {
      // Pet head outline + hat on top
      const head = this.add.graphics();
      head.fillStyle(0x4a4a6a, 1);
      head.fillCircle(0, 10, 28);
      c.add(head);

      const hat = this.add.graphics();
      hat.fillStyle(item.color, 1);
      if (item.id === 'hat_crown') {
        // Crown — zigzag top
        hat.beginPath();
        hat.moveTo(-26, -14);
        hat.lineTo(-18, -32);
        hat.lineTo(-10, -16);
        hat.lineTo(0, -36);
        hat.lineTo(10, -16);
        hat.lineTo(18, -32);
        hat.lineTo(26, -14);
        hat.lineTo(-26, -14);
        hat.closePath();
        hat.fillPath();
        // Gem
        hat.fillStyle(0xff5b6e, 1);
        hat.fillCircle(0, -22, 4);
      } else {
        // Pilot cap — rounded bowl with brim
        hat.fillRoundedRect(-22, -22, 44, 18, { tl: 14, tr: 14, bl: 0, br: 0 });
        hat.fillRoundedRect(-26, -8, 52, 6, 3);
        // Goggle band
        hat.fillStyle(0x12122a, 1);
        hat.fillRect(-22, -10, 44, 4);
      }
      c.add(hat);
    } else {
      // accessory
      const head = this.add.graphics();
      head.fillStyle(0x4a4a6a, 1);
      head.fillCircle(0, -4, 28);
      c.add(head);

      const acc = this.add.graphics();
      acc.fillStyle(item.color, 1);
      if (item.id === 'acc_shades') {
        // Sunglasses — two rounded rects with bridge
        acc.fillRoundedRect(-22, -8, 18, 12, 4);
        acc.fillRoundedRect(4, -8, 18, 12, 4);
        acc.lineStyle(3, item.color, 1);
        acc.beginPath();
        acc.moveTo(-4, -2);
        acc.lineTo(4, -2);
        acc.strokePath();
        // White glints
        acc.fillStyle(0xffffff, 0.6);
        acc.fillCircle(-15, -4, 2);
        acc.fillCircle(11, -4, 2);
      } else {
        // Scarf — wavy band below the head
        acc.fillRoundedRect(-32, 22, 64, 14, 6);
        acc.fillRoundedRect(-8, 32, 16, 22, 4);
      }
      c.add(acc);
    }

    return c;
  }

  // ============================================================
  // BADGES
  // ============================================================
  drawStateBadge(card, w, h, text, color) {
    const y = h / 2 - 44;
    const badge = this.add.graphics();
    badge.fillStyle(color, 0.9);
    badge.fillRoundedRect(-w / 2 + 24, y - 18, w - 48, 36, 18);
    card.add(badge);

    card.add(this.add.text(0, y, text, style('caption', {
      fontSize: '18px',
      fill: '#0a0a1a',
      fontStyle: '900'
    })).setOrigin(0.5));
  }

  drawPriceChip(card, w, h, price, canAfford) {
    const y = h / 2 - 44;
    const chip = this.add.graphics();
    const baseColor = canAfford ? 0xc77eff : 0x3a3a4a;
    chip.fillStyle(baseColor, canAfford ? 0.9 : 0.7);
    chip.fillRoundedRect(-w / 2 + 24, y - 18, w - 48, 36, 18);
    card.add(chip);

    // Sparkle icon
    const sparkle = this.add.graphics();
    sparkle.fillStyle(canAfford ? 0xffffff : 0x6a6a82, 1);
    sparkle.beginPath();
    sparkle.moveTo(-w / 2 + 50, y - 8);
    sparkle.lineTo(-w / 2 + 56, y);
    sparkle.lineTo(-w / 2 + 50, y + 8);
    sparkle.lineTo(-w / 2 + 44, y);
    sparkle.closePath();
    sparkle.fillPath();
    card.add(sparkle);

    card.add(this.add.text(8, y, `${price}`, style('caption', {
      fontSize: '22px',
      fill: canAfford ? '#ffffff' : '#6a6a82',
      fontStyle: '900'
    })).setOrigin(0.5));
  }

  // ============================================================
  // TAP HANDLING
  // ============================================================
  handleTap(item, owned, equipped, canAfford, card) {
    audio.playClick();

    if (equipped) {
      this.wiggle(card);
      return;
    }

    if (owned) {
      this.equip(item);
      return;
    }

    // Milestone-locked items are not tappable until earned.
    if (item.unlock) {
      audio.playWrong?.();
      this.wiggle(card);
      return;
    }

    if (item.price === 0) {
      this.purchase(item);
      return;
    }

    if (!canAfford) {
      audio.playWrong?.();
      this.wiggle(card);
      return;
    }

    this.purchase(item);
  }

  purchase(item) {
    if (item.price > 0) {
      const ok = economy.spendStardust(item.price);
      if (!ok) return;
    }
    if (this.activeTab === 'ship') {
      ship.addOwnedPart(item.id);
      ship.equipPart(item.id);
    } else {
      cosmetics.addOwned(item.id);
      cosmetics.equipItem(item.id);
      cosmetics.markSeen(item.id);
    }
    audio.playLevelComplete?.();
    this.refresh();
  }

  equip(item) {
    if (this.activeTab === 'ship') {
      ship.equipPart(item.id);
      ship.markSeen(item.id);
    } else {
      cosmetics.equipItem(item.id);
      cosmetics.markSeen(item.id);
    }
    this.refresh();
  }

  refresh() {
    this.balanceText.setText(`${economy.getStardust()}`);
    this.cardLayer.removeAll(true);
    this.renderGrid();
  }

  wiggle(card) {
    this.tweens.add({
      targets: card,
      angle: { from: -3, to: 3 },
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => { card.angle = 0; }
    });
  }

  exit() {
    // Clear NEW! flags for owned items the kid has now seen on screen.
    PET_COSMETICS.forEach(c => { if (cosmetics.ownsItem(c.id)) cosmetics.markSeen(c.id); });
    SHIP_PARTS.forEach(p => { if (ship.ownsPart(p.id)) ship.markSeen(p.id); });
    new TransitionManager(this).fadeToScene('WorldMapScene');
  }
}
