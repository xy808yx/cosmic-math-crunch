// Full-screen tabbed shop. Five tabs: Engine Trails, Paint, Patterns, Pet Items,
// Ship Parts. Each tab renders a 3-column grid of item cards with live preview.

import Phaser from 'phaser';
import { audio } from '../AudioManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { economy } from '../EconomyManager.js';
import { ship, SHIP_PARTS } from '../ShipManager.js';
import { drawShip } from '../ShipRenderer.js';
import { cosmetics, PET_COSMETICS } from '../CosmeticManager.js';
import { drawCompanion } from '../PetRenderer.js';
import {
  drawArrowLeftIcon, drawSparkleIcon, drawLockIcon, drawCheckIcon
} from '../StatIcons.js';

const W = 1080;
const H = 1920;

const TABS = [
  { id: 'trail',   label: 'TRAILS',  accent: 0xff8b3d },
  { id: 'paint',   label: 'PAINT',   accent: 0xff5b6e },
  { id: 'pattern', label: 'PATTERNS', accent: 0xc77eff },
  { id: 'pet',     label: 'PET',     accent: 0xffd86b },
  { id: 'parts',   label: 'PARTS',   accent: 0x4ecdc4 }
];

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    audio.init();
    createStarfield(this, { width: W, height: H, accentStrength: 0 });

    this.activeTab = 'trail';
    this.cardObjects = [];

    this.createHeader();
    this.createTabBar();
    this.createBalanceFooter();
    this.renderActiveTab();

    new TransitionManager(this).fadeIn(280);
  }

  createHeader() {
    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(0x07071a, 0.95);
    bg.fillRect(0, 0, W, 180);

    createIconButton(this, {
      x: 90, y: 90, radius: 38,
      accentColor: 0xc77eff,
      drawIcon: (g, size) => drawArrowLeftIcon(g, 0, 0, size),
      onClick: () => {
        audio.playClick();
        new TransitionManager(this).fadeToScene('WorldMapScene');
      }
    }).setDepth(15);

    this.add.text(W / 2, 90, 'SHOP', style('display', {
      fontSize: '64px',
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(14);
  }

  createTabBar() {
    const tabY = 220;
    const tabW = 196;
    const tabH = 80;
    const gap = 12;
    const totalW = TABS.length * tabW + (TABS.length - 1) * gap;
    const startX = W / 2 - totalW / 2 + tabW / 2;

    this.tabContainers = {};
    TABS.forEach((tab, i) => {
      const x = startX + i * (tabW + gap);
      const c = this.add.container(x, tabY).setDepth(12);

      const bg = this.add.graphics();
      c.add(bg);
      const label = this.add.text(0, 0, tab.label, style('caption', {
        fontSize: '22px',
        fill: '#ffffff',
        fontStyle: '900'
      })).setOrigin(0.5);
      c.add(label);

      const hit = this.add.rectangle(0, 0, tabW, tabH, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      c.add(hit);
      hit.on('pointerdown', () => this.switchTab(tab.id));

      c.bg = bg;
      c.label = label;
      c.tab = tab;
      c.tabW = tabW;
      c.tabH = tabH;
      this.tabContainers[tab.id] = c;
    });

    this.refreshTabBar();
  }

  refreshTabBar() {
    Object.values(this.tabContainers).forEach(c => {
      const isActive = c.tab.id === this.activeTab;
      c.bg.clear();
      c.bg.fillStyle(isActive ? c.tab.accent : 0x1a1a30, isActive ? 0.95 : 0.85);
      c.bg.fillRoundedRect(-c.tabW / 2, -c.tabH / 2, c.tabW, c.tabH, 16);
      c.bg.lineStyle(2, c.tab.accent, isActive ? 1 : 0.5);
      c.bg.strokeRoundedRect(-c.tabW / 2, -c.tabH / 2, c.tabW, c.tabH, 16);
      c.label.setColor(isActive ? '#0a0a1a' : '#ffffff');
    });
  }

  switchTab(tabId) {
    if (this.activeTab === tabId) return;
    audio.playClick();
    this.activeTab = tabId;
    this.refreshTabBar();
    this.renderActiveTab();
  }

  // ============================================================
  // GRID RENDERING
  // ============================================================
  renderActiveTab() {
    // Wipe existing cards
    this.cardObjects.forEach(o => o.destroy());
    this.cardObjects = [];

    const items = this.itemsForTab(this.activeTab);

    const cols = 3;
    const cardW = 320;
    const cardH = 380;
    const gapX = 18;
    const gapY = 22;
    const startX = W / 2 - (cols * cardW + (cols - 1) * gapX) / 2 + cardW / 2;
    const startY = 360;

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      const card = this.makeShopCard(item, this.activeTab, cardW, cardH);
      card.x = x;
      card.y = y;
      this.cardObjects.push(card);
    });
  }

  itemsForTab(tabId) {
    if (tabId === 'trail') return SHIP_PARTS.filter(p => p.slot === 'trail');
    if (tabId === 'paint') return SHIP_PARTS.filter(p => p.slot === 'paint');
    if (tabId === 'pattern') return SHIP_PARTS.filter(p => p.slot === 'pattern');
    if (tabId === 'parts') return SHIP_PARTS.filter(p => p.slot === 'hull' || p.slot === 'wings' || p.slot === 'decal');
    return PET_COSMETICS;
  }

  makeShopCard(item, tabId, w, h) {
    const c = this.add.container(0, 0).setDepth(12);

    const isShipItem = tabId !== 'pet';
    const owned = isShipItem ? ship.ownsPart(item.id) : cosmetics.ownsItem(item.id);
    const equipped = isShipItem
      ? ship.getCurrentParts()[item.slot] === item.id
      : cosmetics.getEquipped()[item.slot] === item.id;
    const canAfford = economy.canAfford(item.price);

    let borderColor = 0x3a3a4a;
    if (equipped) borderColor = 0x58d68d;
    else if (owned) borderColor = 0x4ecdc4;
    else if (canAfford && !item.unlock) borderColor = 0xc77eff;
    else if (item.unlock) borderColor = 0xff8b3d;

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    bg.lineStyle(equipped || owned ? 4 : 3, borderColor, owned || canAfford ? 1 : 0.6);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    c.add(bg);

    // Preview area
    const previewY = -h / 2 + 130;
    if (tabId === 'pet') {
      const pet = drawCompanion(this, 0, previewY, { scale: 0.7, preview: true });
      c.add(pet);
      // Color disc accent at base
      const disc = this.add.graphics();
      disc.fillStyle(item.color, 1);
      disc.fillCircle(0, previewY + 90, 22);
      disc.lineStyle(3, 0x07071a, 0.6);
      disc.strokeCircle(0, previewY + 90, 22);
      c.add(disc);
    } else {
      const previewParts = { ...ship.getCurrentParts(), [item.slot]: item.id };
      const preview = drawShip(this, 0, previewY, { scale: 0.85, parts: previewParts, showTrail: tabId === 'trail' });
      c.add(preview);
    }

    // Name
    c.add(this.add.text(0, h / 2 - 130, item.name, style('subhead', {
      fontSize: '24px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: w - 32 }
    })).setOrigin(0.5));

    // Status badge
    const badgeY = h / 2 - 50;
    let badgeText = '';
    let badgeColor = 0x4ecdc4;
    let badgeFill = '#0a0a1a';
    if (equipped) { badgeText = 'EQUIPPED'; badgeColor = 0x58d68d; }
    else if (owned) { badgeText = 'TAP TO EQUIP'; badgeColor = 0x4ecdc4; }
    else if (item.unlock?.type === 'streak') { badgeText = `${item.unlock.days}-DAY STREAK`; badgeColor = 0xff8b3d; }
    else if (item.price === 0) { badgeText = 'FREE'; badgeColor = 0xc77eff; }
    else { badgeText = `${item.price} STARDUST`; badgeColor = canAfford ? 0xc77eff : 0x3a3a4a; if (!canAfford) badgeFill = '#7a7a90'; }

    const badge = this.add.graphics();
    badge.fillStyle(badgeColor, 0.95);
    badge.fillRoundedRect(-w / 2 + 24, badgeY - 22, w - 48, 44, 22);
    c.add(badge);
    c.add(this.add.text(0, badgeY, badgeText, style('caption', {
      fontSize: '20px',
      fill: badgeFill,
      fontStyle: '900'
    })).setOrigin(0.5));

    // Lock icon for unlock-required items
    if (item.unlock && !owned) {
      const lockG = this.add.graphics();
      drawLockIcon(lockG, 0, 0, 18);
      lockG.x = w / 2 - 28;
      lockG.y = -h / 2 + 28;
      c.add(lockG);
    }
    if (equipped) {
      const checkG = this.add.graphics();
      drawCheckIcon(checkG, 0, 0, 16);
      checkG.x = w / 2 - 28;
      checkG.y = -h / 2 + 28;
      c.add(checkG);
    }

    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerdown', () => this.handleTap(item, tabId, owned, equipped, canAfford));
    hit.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.03, duration: 100 }));
    hit.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 100 }));

    return c;
  }

  handleTap(item, tabId, owned, equipped, canAfford) {
    audio.playClick();
    if (equipped) return;
    const isShipItem = tabId !== 'pet';

    if (owned) {
      if (isShipItem) ship.equipPart(item.id);
      else cosmetics.equipItem(item.id);
      this.refreshBalance();
      this.renderActiveTab();
      return;
    }
    if (item.unlock) return; // milestone-only
    if (item.price > 0 && !canAfford) return;
    if (item.price > 0) economy.spendStardust(item.price);
    if (isShipItem) ship.addAndEquip(item.id);
    else cosmetics.addAndEquip(item.id);
    audio.playLevelComplete?.();
    this.refreshBalance();
    this.renderActiveTab();
  }

  // ============================================================
  // BALANCE FOOTER
  // ============================================================
  createBalanceFooter() {
    const bg = this.add.graphics().setDepth(15);
    bg.fillStyle(0x07071a, 0.92);
    bg.fillRect(0, H - 110, W, 110);

    const c = this.add.container(W / 2, H - 55).setDepth(16);
    const sparkle = this.add.graphics();
    drawSparkleIcon(sparkle, -100, 0, 18);
    c.add(sparkle);

    this.balanceText = this.add.text(0, 0, `${economy.getStardust()} STARDUST`, style('subhead', {
      fontSize: '32px',
      fill: '#c77eff',
      fontStyle: '900'
    })).setOrigin(0.5);
    c.add(this.balanceText);
  }

  refreshBalance() {
    if (this.balanceText) {
      this.balanceText.setText(`${economy.getStardust()} STARDUST`);
    }
  }
}
