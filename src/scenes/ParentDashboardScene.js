import Phaser from 'phaser';
import { progress, WORLDS } from '../GameData.js';
import { achievements } from '../AchievementManager.js';
import { audio } from '../AudioManager.js';

export class ParentDashboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ParentDashboardScene' });
  }

  create() {
    // Background
    this.add.rectangle(400, 700, 800, 1400, 0x12121f);

    // Check if PIN verified this session
    const pinVerified = this.registry.get('parentPinVerified');

    if (!pinVerified) {
      this.showPinEntry();
    } else {
      this.showDashboard();
    }
  }

  showPinEntry() {
    // Title
    this.add.text(400, 160, 'Parent Dashboard', {
      fontSize: '48px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(400, 240, 'Enter PIN to access', {
      fontSize: '28px',
      fill: '#81ecec',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // PIN display
    this.pinDigits = ['', '', '', ''];
    this.currentPinIndex = 0;

    this.pinDisplay = this.add.text(400, 360, '_ _ _ _', {
      fontSize: '72px',
      fill: '#ffffff',
      fontFamily: 'monospace',
      letterSpacing: 40
    }).setOrigin(0.5);

    // Number pad
    this.createNumberPad();

    // Back button
    const backBtn = this.add.text(400, 1240, '< Back to Game', {
      fontSize: '32px',
      fill: '#888888',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive();

    backBtn.on('pointerover', () => backBtn.setFill('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setFill('#888888'));
    backBtn.on('pointerdown', () => {
      audio.playClick();
      this.scene.start('WorldMapScene');
    });

    // Hint text
    this.add.text(400, 1320, 'Default PIN: 0000', {
      fontSize: '24px',
      fill: '#555555',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }

  createNumberPad() {
    const buttonSize = 120;
    const spacing = 140;
    const startX = 400 - spacing; // Center the 3-column grid (middle column at 400)
    const startY = 560;

    // Numbers 1-9
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = startX + col * spacing;
      const y = startY + row * spacing;
      const num = i + 1;

      this.createPadButton(x, y, buttonSize, num.toString(), () => this.enterDigit(num.toString()));
    }

    // 0 button (center bottom)
    this.createPadButton(startX + spacing, startY + 3 * spacing, buttonSize, '0', () => this.enterDigit('0'));

    // Clear button (left bottom)
    this.createPadButton(startX, startY + 3 * spacing, buttonSize, 'C', () => this.clearPin(), 0xff6b6b);

    // Backspace button (right bottom)
    this.createPadButton(startX + 2 * spacing, startY + 3 * spacing, buttonSize, '<', () => this.backspace(), 0xf39c12);
  }

  createPadButton(x, y, size, label, callback, color = 0x2d2d44) {
    const btn = this.add.rectangle(x, y, size, size, color)
      .setStrokeStyle(4, 0x4ecdc4)
      .setInteractive();

    const text = this.add.text(x, y, label, {
      fontSize: '48px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.on('pointerover', () => btn.setStrokeStyle(6, 0xffffff));
    btn.on('pointerout', () => btn.setStrokeStyle(4, 0x4ecdc4));
    btn.on('pointerdown', () => {
      audio.playClick();
      callback();
    });
  }

  enterDigit(digit) {
    if (this.currentPinIndex >= 4) return;

    this.pinDigits[this.currentPinIndex] = digit;
    this.currentPinIndex++;
    this.updatePinDisplay();

    if (this.currentPinIndex === 4) {
      this.verifyPin();
    }
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
    const display = this.pinDigits.map(d => d || '_').join(' ');
    this.pinDisplay.setText(display);
  }

  verifyPin() {
    const enteredPin = this.pinDigits.join('');
    const savedPin = localStorage.getItem('cosmicMathParentPin') || '0000';

    if (enteredPin === savedPin) {
      this.registry.set('parentPinVerified', true);
      this.scene.restart();
    } else {
      // Wrong PIN - shake and reset
      this.cameras.main.shake(200, 0.01);
      this.pinDisplay.setFill('#ff6b6b');
      this.time.delayedCall(500, () => {
        this.pinDisplay.setFill('#ffffff');
        this.clearPin();
      });
    }
  }

  showDashboard() {
    this.currentTab = 'summary';

    // Header
    this.add.rectangle(400, 80, 800, 160, 0x2d2d44);

    this.add.text(400, 50, 'Parent Dashboard', {
      fontSize: '40px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(60, 50, '< Back', {
      fontSize: '28px',
      fill: '#888888',
      fontFamily: 'Arial'
    }).setInteractive();

    backBtn.on('pointerover', () => backBtn.setFill('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setFill('#888888'));
    backBtn.on('pointerdown', () => {
      audio.playClick();
      this.scene.start('WorldMapScene');
    });

    // Tab buttons
    this.createTabs();

    // Content area
    this.contentContainer = this.add.container(0, 0);
    this.showSummaryTab();
  }

  createTabs() {
    const tabs = [
      { id: 'summary', label: 'Summary' },
      { id: 'analytics', label: 'Analytics' },
      { id: 'settings', label: 'Settings' }
    ];

    const tabWidth = 240;
    const startX = 140;

    this.tabButtons = {};

    tabs.forEach((tab, index) => {
      const x = startX + index * tabWidth;
      const isActive = tab.id === this.currentTab;

      const bg = this.add.rectangle(x, 120, tabWidth - 20, 60, isActive ? 0x4ecdc4 : 0x2d2d44)
        .setStrokeStyle(2, 0x4ecdc4)
        .setInteractive();

      const text = this.add.text(x, 120, tab.label, {
        fontSize: '24px',
        fill: isActive ? '#1a1a2e' : '#ffffff',
        fontFamily: 'Arial',
        fontStyle: isActive ? 'bold' : 'normal'
      }).setOrigin(0.5);

      bg.on('pointerdown', () => {
        audio.playClick();
        this.switchTab(tab.id);
      });

      this.tabButtons[tab.id] = { bg, text };
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update tab visuals
    Object.entries(this.tabButtons).forEach(([id, { bg, text }]) => {
      const isActive = id === tabId;
      bg.setFillStyle(isActive ? 0x4ecdc4 : 0x2d2d44);
      text.setFill(isActive ? '#1a1a2e' : '#ffffff');
      text.setFontStyle(isActive ? 'bold' : 'normal');
    });

    // Clear and show new content
    this.contentContainer.removeAll(true);

    switch (tabId) {
      case 'summary':
        this.showSummaryTab();
        break;
      case 'analytics':
        this.showAnalyticsTab();
        break;
      case 'settings':
        this.showSettingsTab();
        break;
    }
  }

  showSummaryTab() {
    const startY = 200;
    let y = startY;

    // Calculate stats
    const stats = this.calculateStats();

    // Total Stars
    this.addStatCard(y, 'Total Stars', `${stats.totalStars}`, 0xf7dc6f);
    y += 140;

    // Levels Completed
    this.addStatCard(y, 'Levels Completed', `${stats.levelsCompleted}`, 0x4ecdc4);
    y += 140;

    // Current World
    this.addStatCard(y, 'Current World', stats.currentWorld, 0xa29bfe);
    y += 140;

    // Overall Accuracy
    const accuracyColor = stats.overallAccuracy >= 80 ? 0x58d68d : stats.overallAccuracy >= 60 ? 0xf7dc6f : 0xff6b6b;
    this.addStatCard(y, 'Overall Accuracy', `${stats.overallAccuracy}%`, accuracyColor);
    y += 140;

    // Achievements
    this.addStatCard(y, 'Achievements', `${stats.achievementsEarned} / ${stats.achievementsTotal}`, 0xff6b9d);
    y += 140;

    // Play Sessions (estimated)
    this.addStatCard(y, 'Total Sessions', `${stats.totalSessions}`, 0x81ecec);
  }

  addStatCard(y, label, value, accentColor) {
    const card = this.add.rectangle(400, y, 720, 110, 0x2d2d44, 0.9)
      .setStrokeStyle(4, accentColor);
    this.contentContainer.add(card);

    const labelText = this.add.text(80, y - 16, label, {
      fontSize: '28px',
      fill: '#888888',
      fontFamily: 'Arial'
    });
    this.contentContainer.add(labelText);

    const valueText = this.add.text(720, y, value, {
      fontSize: '48px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5);
    this.contentContainer.add(valueText);
  }

  showAnalyticsTab() {
    const startY = 200;
    let y = startY;

    // Title: Fact Mastery
    const title = this.add.text(400, y, 'Multiplication Fact Mastery', {
      fontSize: '32px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(title);
    y += 60;

    // Heat map grid (tables 1-10)
    this.createMasteryHeatMap(y);
    y += 560;

    // Most Missed Facts
    const missedTitle = this.add.text(400, y, 'Most Missed Facts', {
      fontSize: '32px',
      fill: '#ff6b6b',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(missedTitle);
    y += 50;

    this.showMostMissedFacts(y);
  }

  createMasteryHeatMap(startY) {
    const cellSize = 64;
    const startX = 90;

    // Column headers (1-10)
    for (let i = 1; i <= 10; i++) {
      const header = this.add.text(startX + i * cellSize, startY, i.toString(), {
        fontSize: '24px',
        fill: '#888888',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      this.contentContainer.add(header);
    }

    // Row headers and cells
    for (let row = 1; row <= 10; row++) {
      const rowY = startY + row * (cellSize - 12);

      // Row header
      const rowHeader = this.add.text(startX - 10, rowY + cellSize / 2, row.toString(), {
        fontSize: '24px',
        fill: '#888888',
        fontFamily: 'Arial'
      }).setOrigin(1, 0.5);
      this.contentContainer.add(rowHeader);

      // Cells
      for (let col = 1; col <= 10; col++) {
        const mastery = progress.getFactMastery(row, col);
        const color = this.getMasteryColor(mastery);

        const cellX = startX + col * cellSize;
        const cellY = rowY + cellSize / 2;

        const cell = this.add.rectangle(cellX, cellY, cellSize - 8, cellSize - 16, color);
        this.contentContainer.add(cell);

        // Show percentage on hover (simplified - just show if high mastery)
        if (mastery >= 90) {
          const check = this.add.text(cellX, cellY, '✓', {
            fontSize: '28px',
            fill: '#1a1a2e'
          }).setOrigin(0.5);
          this.contentContainer.add(check);
        }
      }
    }

    // Legend
    const legendY = startY + 11 * (cellSize - 12) + 20;
    const legendColors = [
      { color: 0x2d2d44, label: '0%' },
      { color: 0xff6b6b, label: '<50%' },
      { color: 0xf39c12, label: '50-75%' },
      { color: 0xf7dc6f, label: '75-90%' },
      { color: 0x58d68d, label: '90%+' }
    ];

    let legendX = 80;
    legendColors.forEach(({ color, label }) => {
      const box = this.add.rectangle(legendX, legendY, 30, 30, color);
      this.contentContainer.add(box);

      const text = this.add.text(legendX + 24, legendY, label, {
        fontSize: '20px',
        fill: '#888888',
        fontFamily: 'Arial'
      }).setOrigin(0, 0.5);
      this.contentContainer.add(text);

      legendX += 140;
    });
  }

  getMasteryColor(mastery) {
    if (mastery >= 90) return 0x58d68d; // Green
    if (mastery >= 75) return 0xf7dc6f; // Yellow
    if (mastery >= 50) return 0xf39c12; // Orange
    if (mastery > 0) return 0xff6b6b;   // Red
    return 0x2d2d44; // Gray (not attempted)
  }

  showMostMissedFacts(y) {
    const missedFacts = progress.getMostMissedFacts(5);

    if (missedFacts.length === 0) {
      const noData = this.add.text(400, y + 40, 'No data yet - keep playing!', {
        fontSize: '28px',
        fill: '#555555',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      this.contentContainer.add(noData);
      return;
    }

    missedFacts.forEach((fact, index) => {
      const text = this.add.text(400, y + index * 50, `${fact.a} × ${fact.b} = ${fact.a * fact.b}  (${fact.accuracy}% accuracy)`, {
        fontSize: '28px',
        fill: fact.accuracy < 50 ? '#ff6b6b' : '#f39c12',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      this.contentContainer.add(text);
    });
  }

  showSettingsTab() {
    const startY = 240;
    let y = startY;

    // Change PIN
    this.addSettingButton(y, 'Change PIN', () => this.showChangePinDialog());
    y += 120;

    // Reset Progress
    this.addSettingButton(y, 'Reset All Progress', () => this.showResetConfirmation(), 0xff6b6b);
    y += 120;

    // Difficulty adjustment info
    const diffTitle = this.add.text(400, y, 'Difficulty Adjustment', {
      fontSize: '32px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.contentContainer.add(diffTitle);
    y += 60;

    const diffInfo = this.add.text(400, y, 'The game automatically adjusts difficulty\nbased on your child\'s performance.\n\nAfter 4+ failures on a level, it becomes\neasier with more moves and lower targets.', {
      fontSize: '24px',
      fill: '#888888',
      fontFamily: 'Arial',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5, 0);
    this.contentContainer.add(diffInfo);
    y += 200;

    // Logout (clear PIN verification)
    this.addSettingButton(y, 'Lock Dashboard', () => {
      this.registry.set('parentPinVerified', false);
      this.scene.restart();
    });
  }

  addSettingButton(y, label, callback, color = 0x4ecdc4) {
    const btn = this.add.rectangle(400, y, 600, 90, 0x2d2d44)
      .setStrokeStyle(4, color)
      .setInteractive();
    this.contentContainer.add(btn);

    const text = this.add.text(400, y, label, {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    this.contentContainer.add(text);

    btn.on('pointerover', () => btn.setFillStyle(color, 0.3));
    btn.on('pointerout', () => btn.setFillStyle(0x2d2d44));
    btn.on('pointerdown', () => {
      audio.playClick();
      callback();
    });
  }

  showChangePinDialog() {
    // Create overlay
    const overlay = this.add.rectangle(400, 700, 800, 1400, 0x000000, 0.8)
      .setInteractive();

    const panel = this.add.rectangle(400, 600, 600, 500, 0x2d2d44)
      .setStrokeStyle(4, 0x4ecdc4);

    const title = this.add.text(400, 400, 'Change PIN', {
      fontSize: '36px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const instruction = this.add.text(400, 480, 'Enter new 4-digit PIN:', {
      fontSize: '28px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // PIN input display
    this.newPinDigits = ['', '', '', ''];
    this.newPinIndex = 0;
    const pinDisplay = this.add.text(400, 560, '_ _ _ _', {
      fontSize: '48px',
      fill: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    // Simple number buttons
    const numRow = this.add.text(400, 660, '1 2 3 4 5 6 7 8 9 0', {
      fontSize: '40px',
      fill: '#4ecdc4',
      fontFamily: 'monospace'
    }).setOrigin(0.5).setInteractive();

    // Cancel button
    const cancelBtn = this.add.text(260, 780, 'Cancel', {
      fontSize: '32px',
      fill: '#ff6b6b',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive();

    // Save button
    const saveBtn = this.add.text(540, 780, 'Save', {
      fontSize: '32px',
      fill: '#58d68d',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive();

    const elements = [overlay, panel, title, instruction, pinDisplay, numRow, cancelBtn, saveBtn];

    // Number input handling
    this.input.keyboard.on('keydown', (event) => {
      if (this.newPinIndex === undefined) return;

      if (event.key >= '0' && event.key <= '9' && this.newPinIndex < 4) {
        this.newPinDigits[this.newPinIndex] = event.key;
        this.newPinIndex++;
        pinDisplay.setText(this.newPinDigits.map(d => d || '_').join(' '));
      } else if (event.key === 'Backspace' && this.newPinIndex > 0) {
        this.newPinIndex--;
        this.newPinDigits[this.newPinIndex] = '';
        pinDisplay.setText(this.newPinDigits.map(d => d || '_').join(' '));
      }
    });

    cancelBtn.on('pointerdown', () => {
      audio.playClick();
      this.newPinIndex = undefined;
      elements.forEach(el => el.destroy());
    });

    saveBtn.on('pointerdown', () => {
      audio.playClick();
      if (this.newPinIndex === 4) {
        const newPin = this.newPinDigits.join('');
        localStorage.setItem('cosmicMathParentPin', newPin);
        this.newPinIndex = undefined;
        elements.forEach(el => el.destroy());

        // Show confirmation
        const confirm = this.add.text(400, 700, 'PIN Updated!', {
          fontSize: '36px',
          fill: '#58d68d',
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        this.time.delayedCall(1500, () => confirm.destroy());
      }
    });
  }

  showResetConfirmation() {
    // Create overlay
    const overlay = this.add.rectangle(400, 700, 800, 1400, 0x000000, 0.8)
      .setInteractive();

    const panel = this.add.rectangle(400, 600, 640, 400, 0x2d2d44)
      .setStrokeStyle(4, 0xff6b6b);

    const title = this.add.text(400, 460, 'Reset All Progress?', {
      fontSize: '36px',
      fill: '#ff6b6b',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const warning = this.add.text(400, 560, 'This will delete ALL game progress,\nincluding levels, stars, achievements,\nand learning data.\n\nThis cannot be undone!', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);

    // Cancel button
    const cancelBtn = this.add.text(260, 740, 'Cancel', {
      fontSize: '32px',
      fill: '#4ecdc4',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setInteractive();

    // Confirm button
    const confirmBtn = this.add.text(540, 740, 'Reset', {
      fontSize: '32px',
      fill: '#ff6b6b',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive();

    const elements = [overlay, panel, title, warning, cancelBtn, confirmBtn];

    cancelBtn.on('pointerdown', () => {
      audio.playClick();
      elements.forEach(el => el.destroy());
    });

    confirmBtn.on('pointerdown', () => {
      audio.playClick();
      this.resetAllProgress();
      elements.forEach(el => el.destroy());

      // Show confirmation and restart
      const confirm = this.add.text(400, 700, 'Progress Reset!', {
        fontSize: '36px',
        fill: '#ff6b6b',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.time.delayedCall(1500, () => {
        this.registry.set('tutorialComplete', false);
        this.registry.set('parentPinVerified', false);
        this.scene.start('TutorialScene');
      });
    });
  }

  resetAllProgress() {
    // Reset all localStorage data
    localStorage.removeItem('cosmicMathProgress');
    localStorage.removeItem('cosmicMathAchievements');
    localStorage.removeItem('cosmicMathPowerUps');
    // Keep parent PIN

    // Reset singletons
    progress.reset();
    achievements.reset();
  }

  calculateStats() {
    let totalStars = progress.totalStars || 0;
    let levelsCompleted = 0;
    let currentWorldId = 1;

    // Count completed levels and find current world
    for (let worldId = 1; worldId <= WORLDS.length; worldId++) {
      const wp = progress.getWorldProgress(worldId);
      levelsCompleted += wp.levelsCompleted || 0;
      if (progress.isWorldUnlocked(worldId)) {
        currentWorldId = worldId;
      }
    }

    const currentWorld = WORLDS[currentWorldId - 1]?.name || 'Moon Base';

    // Overall accuracy from achievements stats
    const achStats = achievements.stats || {};
    const totalCorrect = achStats.totalCorrect || 0;
    const totalWrong = achStats.totalWrong || 0;
    const totalAttempts = totalCorrect + totalWrong;
    const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    return {
      totalStars,
      levelsCompleted,
      currentWorld,
      overallAccuracy,
      achievementsEarned: achievements.getEarnedCount(),
      achievementsTotal: achievements.getTotalCount(),
      totalSessions: Math.max(1, Math.floor(levelsCompleted / 3)) // Rough estimate
    };
  }
}
