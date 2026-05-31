// Parent dashboard — clean, consistent space-themed layout. 8px spacing grid,
// dark base + cyan/coral/mint accents. Includes a Reset Progress button.

import Phaser from 'phaser';
import { progress, VISIBLE_WORLDS, findWorld } from '../GameData.js';
import { records } from '../RecordsManager.js';
import { audio } from '../AudioManager.js';
import { music } from '../MusicManager.js';
import { companion, drawCompanion } from '../CompanionManager.js';
import { style } from '../textStyles.js';
import { createIconButton, createButton } from '../buttonHelper.js';
import { createStarfield } from '../starfieldHelper.js';
import { drawArrowLeftIcon, drawSoundIcon } from '../StatIcons.js';
import { COLORS } from '../colorPalette.js';

const W = 1080;
const H = 1920;

const ACCENT = COLORS.accentTeal;
const WARN = COLORS.error;
const SUCCESS = COLORS.success;

export class ParentDashboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ParentDashboardScene' });
  }

  create() {
    music.ensurePlaying(this);
    createStarfield(this, { width: W, height: H, accentStrength: 0 });
    this.add.rectangle(W / 2, H / 2, W, H, COLORS.bgDark, 0.65).setDepth(0);

    const pinVerified = this.registry.get('parentPinVerified');
    if (!pinVerified) {
      this.showPinEntry();
    } else {
      this.showDashboard();
    }
  }

  showPinEntry() {
    this.add.text(W / 2, 240, 'Parent Dashboard', style('display', {
      fontSize: '64px',
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(10);

    this.add.text(W / 2, 320, 'Enter PIN to continue', style('body', {
      fontSize: '28px',
      fill: '#cfcfe0'
    })).setOrigin(0.5).setDepth(10);

    this.pinDigits = ['', '', '', ''];
    this.currentPinIndex = 0;
    this.pinDisplay = this.add.text(W / 2, 460, '_ _ _ _', style('display', {
      fontSize: '96px',
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(10);

    this.createNumberPad();

    const back = createButton(this, {
      x: W / 2, y: H - 130, label: '< Back to Game',
      width: 360, height: 80, color: 0x4a4a6a,
      onClick: () => this.scene.start('WorldMapScene')
    });
    back.setDepth(10);

    if (!localStorage.getItem('cosmicMathParentPin')) {
      this.add.text(W / 2, H - 60, 'Default PIN: 0000', style('caption', {
        fontSize: '22px',
        fill: '#7a7a90'
      })).setOrigin(0.5).setDepth(10);
    }
  }

  createNumberPad() {
    const buttonSize = 140;
    const spacing = 168;
    const startX = W / 2 - spacing;
    const startY = 700;

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = startX + col * spacing;
      const y = startY + row * spacing;
      const num = i + 1;
      this.makePadButton(x, y, buttonSize, num.toString(), () => this.enterDigit(num.toString()));
    }
    this.makePadButton(startX + spacing, startY + 3 * spacing, buttonSize, '0', () => this.enterDigit('0'));
    this.makePadButton(startX, startY + 3 * spacing, buttonSize, 'C', () => this.clearPin(), WARN);
    this.makePadButton(startX + 2 * spacing, startY + 3 * spacing, buttonSize, '<', () => this.backspace(), 0xffb142);
  }

  makePadButton(x, y, size, label, callback, color = ACCENT) {
    const c = this.add.container(x, y).setDepth(10);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.95);
    bg.fillRoundedRect(-size / 2, -size / 2, size, size, 16);
    bg.lineStyle(3, color, 0.8);
    bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 16);
    c.add(bg);
    c.add(this.add.text(0, 0, label, style('display', {
      fontSize: '52px',
      fill: '#ffffff'
    })).setOrigin(0.5));
    const hit = this.add.rectangle(0, 0, size, size, 0x000000, 0).setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerdown', () => {
      audio.playClick();
      callback();
    });
    hit.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1a1a30, 0.95);
      bg.fillRoundedRect(-size / 2, -size / 2, size, size, 16);
      bg.lineStyle(4, color, 1);
      bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 16);
    });
    hit.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.bgPanel, 0.95);
      bg.fillRoundedRect(-size / 2, -size / 2, size, size, 16);
      bg.lineStyle(3, color, 0.8);
      bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 16);
    });
  }

  enterDigit(digit) {
    if (this.currentPinIndex >= 4) return;
    this.pinDigits[this.currentPinIndex] = digit;
    this.currentPinIndex++;
    this.updatePinDisplay();
    if (this.currentPinIndex === 4) this.verifyPin();
  }

  backspace() {
    if (this.currentPinIndex > 0) {
      this.currentPinIndex--;
      this.pinDigits[this.currentPinIndex] = '';
      this.updatePinDisplay();
    }
  }

  clearPin() {
    this.pinDigits = ['', '', '', ''];
    this.currentPinIndex = 0;
    this.updatePinDisplay();
  }

  updatePinDisplay() {
    this.pinDisplay.setText(this.pinDigits.map(d => d || '_').join(' '));
  }

  verifyPin() {
    const enteredPin = this.pinDigits.join('');
    const savedPin = localStorage.getItem('cosmicMathParentPin') || '0000';
    if (enteredPin === savedPin) {
      this.registry.set('parentPinVerified', true);
      this.scene.restart();
    } else {
      this.cameras.main.shake(200, 0.01);
      this.pinDisplay.setColor('#ff6b6b');
      this.time.delayedCall(500, () => {
        this.pinDisplay.setColor('#ffffff');
        this.clearPin();
      });
    }
  }

  // ============================================================
  // DASHBOARD
  // ============================================================
  showDashboard() {
    this.currentTab = 'summary';

    const headerBg = this.add.graphics().setDepth(10);
    headerBg.fillStyle(COLORS.bgDark, 0.92);
    headerBg.fillRect(0, 0, W, 160);

    createIconButton(this, {
      x: 80, y: 80, radius: 36,
      accentColor: ACCENT,
      drawIcon: (g, size) => drawArrowLeftIcon(g, 0, 0, size),
      onClick: () => this.scene.start('WorldMapScene')
    }).setDepth(15);

    this.add.text(W / 2, 80, 'Parent Dashboard', style('display', {
      fontSize: '54px',
      fill: '#ffffff'
    })).setOrigin(0.5).setDepth(15);

    createIconButton(this, {
      x: W - 80, y: 80, radius: 36,
      accentColor: ACCENT,
      drawIcon: (g, size) => drawSoundIcon(g, 0, 0, size, 0xffffff, audio.enabled),
      onClick: () => audio.toggleEnabled()
    }).setDepth(15);

    this.contentContainer = this.add.container(0, 0).setDepth(11);
    this.createTabs();
    this.showSummaryTab();
  }

  createTabs() {
    const tabs = [
      { id: 'summary', label: 'Summary' },
      { id: 'companion', label: 'Pet' },
      { id: 'analytics', label: 'Analytics' },
      { id: 'settings', label: 'Settings' }
    ];

    const tabWidth = 240;
    const tabHeight = 64;
    const gap = 16;
    const totalW = tabs.length * tabWidth + (tabs.length - 1) * gap;
    const startX = W / 2 - totalW / 2 + tabWidth / 2;
    const tabY = 220;

    this.tabButtons = {};

    tabs.forEach((tab, i) => {
      const x = startX + i * (tabWidth + gap);
      const c = this.add.container(x, tabY).setDepth(12);
      const bg = this.add.graphics();
      c.add(bg);
      const text = this.add.text(0, 0, tab.label, style('subhead', {
        fontSize: '24px'
      })).setOrigin(0.5);
      c.add(text);
      const hit = this.add.rectangle(0, 0, tabWidth, tabHeight, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      c.add(hit);
      hit.on('pointerdown', () => {
        audio.playClick();
        this.switchTab(tab.id);
      });

      c.bg = bg;
      c.text = text;
      c.tabId = tab.id;
      c.tabW = tabWidth;
      c.tabH = tabHeight;
      this.tabButtons[tab.id] = c;
    });
    this.refreshTabs();
  }

  refreshTabs() {
    Object.values(this.tabButtons).forEach(c => {
      const isActive = c.tabId === this.currentTab;
      c.bg.clear();
      c.bg.fillStyle(isActive ? ACCENT : 0x1a1a30, 0.95);
      c.bg.fillRoundedRect(-c.tabW / 2, -c.tabH / 2, c.tabW, c.tabH, 16);
      c.bg.lineStyle(2, ACCENT, isActive ? 1 : 0.5);
      c.bg.strokeRoundedRect(-c.tabW / 2, -c.tabH / 2, c.tabW, c.tabH, 16);
      c.text.setColor(isActive ? '#0a0a1a' : '#ffffff');
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    this.refreshTabs();
    this.contentContainer.removeAll(true);
    if (tabId === 'summary') this.showSummaryTab();
    else if (tabId === 'companion') this.showCompanionTab();
    else if (tabId === 'analytics') this.showAnalyticsTab();
    else this.showSettingsTab();
  }

  // ----- SUMMARY -----
  showSummaryTab() {
    const stats = this.calculateStats();
    let y = 360;
    this.addStatCard(y, 'Total Stars', `${stats.totalStars}`, COLORS.warning); y += 152;
    this.addStatCard(y, 'Levels Completed', `${stats.levelsCompleted}`, ACCENT); y += 152;
    this.addStatCard(y, 'Current World', stats.currentWorld, 0xa29bfe); y += 152;
    const accColor = stats.overallAccuracy >= 80 ? SUCCESS : stats.overallAccuracy >= 60 ? COLORS.warning : WARN;
    this.addStatCard(y, 'Overall Accuracy', `${stats.overallAccuracy}%`, accColor);
  }

  addStatCard(y, label, value, accentColor) {
    const w = 880;
    const c = this.add.container(W / 2, y);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.95);
    bg.fillRoundedRect(-w / 2, -64, w, 128, 18);
    bg.lineStyle(3, accentColor, 0.85);
    bg.strokeRoundedRect(-w / 2, -64, w, 128, 18);
    c.add(bg);
    c.add(this.add.text(-w / 2 + 32, -16, label, style('caption', {
      fontSize: '24px',
      fill: '#cfcfe0',
      fontStyle: '900'
    })).setOrigin(0, 0.5));
    c.add(this.add.text(w / 2 - 32, 0, value, style('display', {
      fontSize: '54px',
      fill: '#ffffff'
    })).setOrigin(1, 0.5));
    this.contentContainer.add(c);
  }

  // ----- COMPANION -----
  showCompanionTab() {
    if (!companion.hasStarter()) {
      const msg = this.add.text(W / 2, H / 2, 'No companion picked yet.\nYour child will choose one\nthe next time they open the game.', style('body', {
        fontSize: '28px',
        fill: '#cfcfe0',
        align: 'center'
      })).setOrigin(0.5);
      this.contentContainer.add(msg);
      return;
    }
    const sp = companion.getSpecies();
    const card = this.add.container(W / 2, 460);
    const w = 880;
    const h = 320;
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    bg.lineStyle(3, sp.color, 0.85);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    card.add(bg);
    const pet = drawCompanion(this, -w / 2 + 160, 0, { scale: 1.1 });
    card.add(pet);
    card.add(this.add.text(-w / 2 + 320, -80, sp.name, style('display', {
      fontSize: '46px',
      fill: '#ffffff'
    })).setOrigin(0, 0.5));
    card.add(this.add.text(-w / 2 + 320, -28, `Stage: ${companion.getStage()}`, style('subhead', {
      fontSize: '28px',
      fill: '#' + sp.accent.toString(16).padStart(6, '0')
    })).setOrigin(0, 0.5));
    card.add(this.add.text(-w / 2 + 320, 22, `Pellets fed: ${companion.getTotalPellets()}`, style('body', {
      fontSize: '22px',
      fill: '#cfcfe0'
    })).setOrigin(0, 0.5));
    const stats = companion.getEvolutionStats();
    card.add(this.add.text(-w / 2 + 320, 70, `Worlds cleared: ${stats.worldsCleared} / 11`, style('body', {
      fontSize: '22px',
      fill: '#cfcfe0'
    })).setOrigin(0, 0.5));
    card.add(this.add.text(-w / 2 + 320, 112, `Lifetime correct: ${stats.lifetimeCorrect}`, style('body', {
      fontSize: '22px',
      fill: '#cfcfe0'
    })).setOrigin(0, 0.5));
    this.contentContainer.add(card);
  }

  // ----- ANALYTICS -----
  showAnalyticsTab() {
    const startY = 320;
    this.contentContainer.add(this.add.text(W / 2, startY, 'Multiplication Mastery', style('subhead', {
      fontSize: '32px',
      fill: '#ffd86b'
    })).setOrigin(0.5));
    this.createMasteryGrid(startY + 60);

    const missedY = startY + 920;
    this.contentContainer.add(this.add.text(W / 2, missedY, 'Most Missed Facts', style('subhead', {
      fontSize: '32px',
      fill: '#ff6b6b'
    })).setOrigin(0.5));
    const missed = progress.getMostMissedFacts(5);
    if (missed.length === 0) {
      this.contentContainer.add(this.add.text(W / 2, missedY + 60, 'No data yet — keep playing!', style('caption', {
        fontSize: '22px',
        fill: '#7a7a90'
      })).setOrigin(0.5));
      return;
    }
    missed.forEach((fact, i) => {
      const text = this.add.text(W / 2, missedY + 60 + i * 50,
        `${fact.a} × ${fact.b} = ${fact.a * fact.b}  (${fact.accuracy}% accuracy)`,
        style('body', {
          fontSize: '24px',
          fill: fact.accuracy < 50 ? '#ff6b6b' : '#f7dc6f'
        })).setOrigin(0.5);
      this.contentContainer.add(text);
    });
  }

  createMasteryGrid(startY) {
    const cellSize = 64;
    const startX = W / 2 - 6 * cellSize;
    for (let i = 1; i <= 12; i++) {
      this.contentContainer.add(this.add.text(startX + (i - 0.5) * cellSize, startY, i.toString(), style('caption', {
        fontSize: '16px', fill: '#7a7a90'
      })).setOrigin(0.5));
    }
    for (let r = 1; r <= 12; r++) {
      const rowY = startY + 24 + (r - 1) * cellSize;
      this.contentContainer.add(this.add.text(startX - 16, rowY + cellSize / 2, r.toString(), style('caption', {
        fontSize: '16px', fill: '#7a7a90'
      })).setOrigin(1, 0.5));
      for (let col = 1; col <= 12; col++) {
        const m = progress.getFactMastery(r, col);
        const color = m === 0 ? 0x2d2d44 : m >= 90 ? SUCCESS : m >= 75 ? COLORS.warning : m >= 50 ? 0xffb142 : WARN;
        const cell = this.add.graphics();
        cell.fillStyle(color, 1);
        cell.fillRoundedRect(startX + (col - 1) * cellSize + 2, rowY + 2, cellSize - 4, cellSize - 4, 4);
        this.contentContainer.add(cell);
      }
    }
  }

  // ----- SETTINGS -----
  showSettingsTab() {
    let y = 360;
    this.addSettingButton(y, 'Change PIN', () => this.showChangePinDialog(), ACCENT); y += 130;
    this.addSettingButton(y, 'Reset All Progress', () => this.showResetConfirmation(), WARN); y += 130;
    this.addSettingButton(y, 'Lock Dashboard', () => {
      this.registry.set('parentPinVerified', false);
      this.scene.restart();
    }, 0x8888a0); y += 160;

    this.contentContainer.add(this.add.text(W / 2, y, 'About difficulty', style('subhead', {
      fontSize: '28px',
      fill: '#ffd86b'
    })).setOrigin(0.5));
    y += 50;
    this.contentContainer.add(this.add.text(W / 2, y,
      'The game adapts to your child automatically — facts they miss\nresurface more often, and timing scales with the world they\'re in.',
      style('body', {
        fontSize: '22px',
        fill: '#cfcfe0',
        align: 'center',
        lineSpacing: 8
      })).setOrigin(0.5, 0));
  }

  addSettingButton(y, label, callback, color = ACCENT) {
    const w = 700;
    const c = this.add.container(W / 2, y);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.95);
    bg.fillRoundedRect(-w / 2, -52, w, 104, 18);
    bg.lineStyle(3, color, 0.85);
    bg.strokeRoundedRect(-w / 2, -52, w, 104, 18);
    c.add(bg);
    c.add(this.add.text(0, 0, label, style('subhead', {
      fontSize: '32px',
      fill: '#ffffff'
    })).setOrigin(0.5));
    const hit = this.add.rectangle(0, 0, w, 104, 0x000000, 0).setInteractive({ useHandCursor: true });
    c.add(hit);
    hit.on('pointerdown', () => {
      audio.playClick();
      callback();
    });
    this.contentContainer.add(c);
  }

  showChangePinDialog() {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(50).setInteractive();
    const c = this.add.container(W / 2, H / 2).setDepth(51);
    const w = 720;
    const h = 600;
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.98);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 22);
    bg.lineStyle(3, ACCENT, 0.9);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 22);
    c.add(bg);
    c.add(this.add.text(0, -h / 2 + 60, 'Change PIN', style('display', {
      fontSize: '44px',
      fill: '#ffd86b'
    })).setOrigin(0.5));
    c.add(this.add.text(0, -h / 2 + 130, 'Enter new 4-digit PIN', style('body', {
      fontSize: '24px',
      fill: '#cfcfe0'
    })).setOrigin(0.5));

    const newPin = ['', '', '', ''];
    let idx = 0;
    const pinDisplay = this.add.text(0, -h / 2 + 230, '_ _ _ _', style('display', {
      fontSize: '64px',
      fill: '#ffffff'
    })).setOrigin(0.5);
    c.add(pinDisplay);

    const onKey = e => {
      if (e.key >= '0' && e.key <= '9' && idx < 4) {
        newPin[idx] = e.key;
        idx++;
        pinDisplay.setText(newPin.map(d => d || '_').join(' '));
      } else if (e.key === 'Backspace' && idx > 0) {
        idx--;
        newPin[idx] = '';
        pinDisplay.setText(newPin.map(d => d || '_').join(' '));
      }
    };
    this.input.keyboard.on('keydown', onKey);

    c.add(this.add.text(0, 80, 'Use the keyboard to enter digits', style('caption', {
      fontSize: '20px',
      fill: '#7a7a90'
    })).setOrigin(0.5));

    const cleanup = () => {
      this.input.keyboard.off('keydown', onKey);
      overlay.destroy();
      c.destroy();
    };

    c.add(createButton(this, {
      x: -120, y: h / 2 - 80, label: 'Cancel',
      width: 240, height: 80, color: 0x4a4a6a,
      onClick: cleanup
    }));
    c.add(createButton(this, {
      x: 120, y: h / 2 - 80, label: 'Save',
      width: 240, height: 80, color: SUCCESS,
      onClick: () => {
        if (idx === 4) {
          localStorage.setItem('cosmicMathParentPin', newPin.join(''));
          cleanup();
          this.flashMessage('PIN updated', SUCCESS);
        }
      }
    }));
  }

  showResetConfirmation() {
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(50).setInteractive();
    const c = this.add.container(W / 2, H / 2).setDepth(51);
    const w = 760;
    const h = 540;
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgPanel, 0.98);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 22);
    bg.lineStyle(3, WARN, 0.9);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 22);
    c.add(bg);
    c.add(this.add.text(0, -h / 2 + 70, 'Reset All Progress?', style('display', {
      fontSize: '44px',
      fill: '#ff6b6b'
    })).setOrigin(0.5));
    c.add(this.add.text(0, 0,
      'This will delete ALL game progress —\nlevels, stars, pet, ship, and learning data.\n\nThis cannot be undone.',
      style('body', {
        fontSize: '24px',
        fill: '#cfcfe0',
        align: 'center',
        lineSpacing: 8
      })).setOrigin(0.5));

    const cleanup = () => {
      overlay.destroy();
      c.destroy();
    };

    c.add(createButton(this, {
      x: -130, y: h / 2 - 80, label: 'Cancel',
      width: 240, height: 80, color: ACCENT,
      onClick: cleanup
    }));
    c.add(createButton(this, {
      x: 130, y: h / 2 - 80, label: 'Reset',
      width: 240, height: 80, color: WARN,
      onClick: () => {
        progress.resetAll();
        records.reset();
        cleanup();
        this.flashMessage('Progress reset', WARN);
        this.time.delayedCall(900, () => {
          this.registry.set('parentPinVerified', false);
          this.scene.start('BootScene');
        });
      }
    }));
  }

  flashMessage(text, color) {
    const msg = this.add.text(W / 2, H - 220, text, style('display', {
      fontSize: '40px',
      fill: '#' + color.toString(16).padStart(6, '0')
    })).setOrigin(0.5).setDepth(70);
    this.tweens.add({
      targets: msg,
      alpha: 0,
      delay: 1200,
      duration: 600,
      onComplete: () => msg.destroy()
    });
  }

  calculateStats() {
    let totalStars = progress.totalStars || 0;
    let levelsCompleted = 0;
    let currentWorldId = 1;
    for (const world of VISIBLE_WORLDS) {
      const wp = progress.getWorldProgress(world.id);
      levelsCompleted += wp?.levelsCompleted || 0;
      if (progress.isWorldUnlocked(world.id)) currentWorldId = world.id;
    }
    const currentWorld = findWorld(currentWorldId)?.name || 'Moon Base';
    const accStats = records.getOverallStats();
    const overallAccuracy = accStats.totalAttempts > 0
      ? Math.round((accStats.totalCorrect / accStats.totalAttempts) * 100)
      : 0;
    return { totalStars, levelsCompleted, currentWorld, overallAccuracy };
  }
}
