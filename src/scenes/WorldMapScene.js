import Phaser from 'phaser';
import { WORLDS, progress } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { achievements } from '../AchievementManager.js';
import { TransitionManager } from '../TransitionManager.js';

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
    this.stars = [];
    this.shootingStarTimer = null;
  }

  create() {
    audio.init();

    // === ANIMATED STARFIELD BACKGROUND ===
    this.createStarfield();

    // === ANIMATED LOGO ===
    this.createAnimatedLogo();

    // === FLOATING HEADER BUTTONS ===
    this.createFloatingHeader();

    // === WORLD LIST ===
    this.createWorldList();

    // === FLOATING FOOTER ===
    this.createFloatingFooter();

    // Scene events
    this.events.on('wake', this.onSceneWake, this);
    this.events.on('resume', this.onSceneWake, this);

    new TransitionManager(this).fadeIn(300);
  }

  // ============================================
  // PHASE 2: ANIMATED STARFIELD BACKGROUND
  // ============================================
  createStarfield() {
    // Dark gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a2e, 0x1a1a2e, 1);
    bg.fillRect(0, 0, 800, 1400);
    bg.setDepth(0);

    // Create star layers (far, mid, near)
    this.starLayers = [
      { stars: [], speed: 0.15, count: 40, sizeMin: 1, sizeMax: 2, alpha: 0.3 },  // Far
      { stars: [], speed: 0.25, count: 25, sizeMin: 2, sizeMax: 3, alpha: 0.5 },  // Mid
      { stars: [], speed: 0.4, count: 15, sizeMin: 2, sizeMax: 4, alpha: 0.8 }   // Near
    ];

    this.starLayers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.count; i++) {
        const x = Phaser.Math.Between(0, 800);
        const y = Phaser.Math.Between(0, 1400);
        const size = Phaser.Math.Between(layer.sizeMin, layer.sizeMax);

        const star = this.add.circle(x, y, size, 0xffffff, layer.alpha);
        star.setDepth(1);
        star.baseAlpha = layer.alpha;
        star.twinkleSpeed = Phaser.Math.FloatBetween(0.5, 2);
        star.twinkleOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
        layer.stars.push(star);
      }
    });

    // Shooting star timer
    this.shootingStarTimer = this.time.addEvent({
      delay: Phaser.Math.Between(10000, 15000),
      callback: this.createShootingStar,
      callbackScope: this,
      loop: true
    });

    // Start animation update
    this.time.addEvent({
      delay: 50,
      callback: this.updateStarfield,
      callbackScope: this,
      loop: true
    });
  }

  updateStarfield() {
    const time = this.time.now / 1000;

    this.starLayers.forEach(layer => {
      layer.stars.forEach(star => {
        // Slow drift
        star.y += layer.speed;
        if (star.y > 1420) {
          star.y = -20;
          star.x = Phaser.Math.Between(0, 800);
        }

        // Twinkling effect
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        star.setAlpha(star.baseAlpha * (0.6 + 0.4 * twinkle));
      });
    });
  }

  createShootingStar() {
    const startX = Phaser.Math.Between(100, 700);
    const startY = Phaser.Math.Between(-50, 200);

    // Create shooting star with trail
    const shootingStar = this.add.graphics();
    shootingStar.setDepth(2);

    // Draw gradient trail
    const trailLength = 80;
    for (let i = 0; i < trailLength; i++) {
      const alpha = (1 - i / trailLength) * 0.8;
      const size = 3 * (1 - i / trailLength);
      shootingStar.fillStyle(0xffffff, alpha);
      shootingStar.fillCircle(-i * 0.7, i * 0.4, size);
    }

    shootingStar.x = startX;
    shootingStar.y = startY;

    this.tweens.add({
      targets: shootingStar,
      x: startX + 300,
      y: startY + 180,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeIn',
      onComplete: () => shootingStar.destroy()
    });

    // Schedule next shooting star
    if (this.shootingStarTimer) {
      this.shootingStarTimer.delay = Phaser.Math.Between(10000, 15000);
    }
  }

  // ============================================
  // PHASE 3: ANIMATED LOGO
  // ============================================
  createAnimatedLogo() {
    // Create logo container for animation
    this.logoContainer = this.add.container(400, 70).setDepth(15);

    // Glow behind logo
    const glow = this.add.graphics();
    glow.fillStyle(0xf7dc6f, 0.15);
    glow.fillEllipse(0, 0, 500, 80);
    this.logoContainer.add(glow);
    this.logoGlow = glow;

    // Main title text with stroke
    const title = this.add.text(0, 0, 'Cosmic Math Crunch', {
      fontSize: '52px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: {
        offsetX: 3,
        offsetY: 3,
        color: '#000000',
        blur: 8,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    this.logoContainer.add(title);
    this.logoTitle = title;

    // Sparkle particles around logo
    this.logoSparkles = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const sparkle = this.add.star(
        Math.cos(angle) * 200,
        Math.sin(angle) * 30,
        5, 4, 8, 0xf7dc6f, 0.6
      );
      sparkle.angle = angle;
      sparkle.baseX = Math.cos(angle) * 200;
      sparkle.baseY = Math.sin(angle) * 30;
      this.logoContainer.add(sparkle);
      this.logoSparkles.push(sparkle);
    }

    // Floating/breathing animation
    this.tweens.add({
      targets: this.logoContainer,
      y: 75,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Glow pulse animation
    this.tweens.add({
      targets: glow,
      alpha: 0.25,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Sparkle animation
    this.time.addEvent({
      delay: 100,
      callback: () => {
        const time = this.time.now / 1000;
        this.logoSparkles.forEach((sparkle, i) => {
          const offset = (i / 6) * Math.PI * 2;
          sparkle.x = sparkle.baseX + Math.sin(time * 2 + offset) * 10;
          sparkle.y = sparkle.baseY + Math.cos(time * 1.5 + offset) * 5;
          sparkle.alpha = 0.4 + Math.sin(time * 3 + offset) * 0.3;
          sparkle.rotation = time * 0.5;
        });
      },
      loop: true
    });
  }

  // ============================================
  // PHASE 4 & 10: FLOATING HEADER
  // ============================================
  createFloatingHeader() {
    // Settings button (top-left)
    this.createIconButton(60, 150, 'settings', () => {
      audio.playClick();
      this.scene.start('ParentDashboardScene');
    });

    // Star counter (center)
    this.createStarCounter();

    // Trophy button (top-right)
    this.createIconButton(740, 150, 'trophy', () => {
      audio.playClick();
      this.showAchievements();
    });
  }

  createIconButton(x, y, iconType, callback) {
    const container = this.add.container(x, y).setDepth(15);

    // Button background with glow
    const bgGlow = this.add.circle(0, 0, 32, 0x4ecdc4, 0.2);
    container.add(bgGlow);

    const bg = this.add.circle(0, 0, 28, 0x1a1a2e, 0.8);
    bg.setStrokeStyle(2, 0x4ecdc4, 0.6);
    container.add(bg);

    // Icon
    let icon;
    if (iconType === 'settings') {
      icon = this.createGearIcon(0, 0, 20);
    } else if (iconType === 'sound_on' || iconType === 'sound_off') {
      icon = this.createSoundIcon(0, 0, 18, iconType === 'sound_on');
      container.soundIcon = icon;
    } else if (iconType === 'trophy') {
      icon = this.createTrophyIcon(0, 0, 18);
    }
    if (icon) container.add(icon);

    // Interactive
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 100
      });
      bgGlow.setAlpha(0.4);
    });
    bg.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
      bgGlow.setAlpha(0.2);
    });
    bg.on('pointerdown', callback);

    return container;
  }

  createGearIcon(x, y, size) {
    const g = this.add.graphics();
    g.lineStyle(3, 0x81ecec, 1);

    // Outer gear teeth
    const teeth = 8;
    const outerR = size;
    const innerR = size * 0.7;

    g.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.strokePath();

    // Center hole
    g.fillStyle(0x1a1a2e, 1);
    g.fillCircle(x, y, size * 0.35);
    g.lineStyle(2, 0x81ecec, 1);
    g.strokeCircle(x, y, size * 0.35);

    return g;
  }

  createSoundIcon(x, y, size, isOn) {
    const g = this.add.graphics();
    g.lineStyle(3, 0x81ecec, 1);

    // Speaker body
    g.fillStyle(0x81ecec, 1);
    g.fillRect(x - size * 0.4, y - size * 0.25, size * 0.3, size * 0.5);

    // Speaker cone
    g.beginPath();
    g.moveTo(x - size * 0.1, y - size * 0.25);
    g.lineTo(x + size * 0.2, y - size * 0.5);
    g.lineTo(x + size * 0.2, y + size * 0.5);
    g.lineTo(x - size * 0.1, y + size * 0.25);
    g.closePath();
    g.fillPath();

    if (isOn) {
      // Sound waves
      g.lineStyle(2, 0x81ecec, 0.8);
      g.beginPath();
      g.arc(x + size * 0.3, y, size * 0.3, -Math.PI / 4, Math.PI / 4);
      g.strokePath();

      g.lineStyle(2, 0x81ecec, 0.5);
      g.beginPath();
      g.arc(x + size * 0.3, y, size * 0.5, -Math.PI / 4, Math.PI / 4);
      g.strokePath();
    } else {
      // X mark
      g.lineStyle(3, 0xff6b6b, 1);
      g.beginPath();
      g.moveTo(x + size * 0.3, y - size * 0.3);
      g.lineTo(x + size * 0.7, y + size * 0.3);
      g.moveTo(x + size * 0.7, y - size * 0.3);
      g.lineTo(x + size * 0.3, y + size * 0.3);
      g.strokePath();
    }

    return g;
  }

  createTrophyIcon(x, y, size) {
    const g = this.add.graphics();

    // Trophy cup
    g.fillStyle(0xf7dc6f, 1);
    g.beginPath();
    g.moveTo(x - size * 0.5, y - size * 0.5);
    g.lineTo(x + size * 0.5, y - size * 0.5);
    g.lineTo(x + size * 0.35, y + size * 0.1);
    g.lineTo(x - size * 0.35, y + size * 0.1);
    g.closePath();
    g.fillPath();

    // Handles
    g.lineStyle(3, 0xf7dc6f, 1);
    g.beginPath();
    g.arc(x - size * 0.55, y - size * 0.2, size * 0.2, -Math.PI / 2, Math.PI / 2);
    g.strokePath();
    g.beginPath();
    g.arc(x + size * 0.55, y - size * 0.2, size * 0.2, Math.PI / 2, -Math.PI / 2);
    g.strokePath();

    // Base
    g.fillStyle(0xf7dc6f, 1);
    g.fillRect(x - size * 0.15, y + size * 0.1, size * 0.3, size * 0.2);
    g.fillRect(x - size * 0.3, y + size * 0.3, size * 0.6, size * 0.15);

    // Shine
    g.fillStyle(0xffffff, 0.4);
    g.fillRect(x - size * 0.3, y - size * 0.4, size * 0.15, size * 0.35);

    return g;
  }

  createStarCounter() {
    const container = this.add.container(400, 150).setDepth(15);

    // Background pill
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.85);
    bg.fillRoundedRect(-100, -24, 200, 48, 24);
    bg.lineStyle(2, 0xf7dc6f, 0.5);
    bg.strokeRoundedRect(-100, -24, 200, 48, 24);
    container.add(bg);

    // Star icon (custom drawn)
    const star = this.createCustomStar(-60, 0, 16);
    container.add(star);

    // Star count text
    this.totalStarsText = this.add.text(10, 0, `${progress.totalStars} Stars`, {
      fontSize: '32px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    container.add(this.totalStarsText);
  }

  createCustomStar(x, y, size) {
    const g = this.add.graphics();
    g.fillStyle(0xf7dc6f, 1);

    const points = 5;
    const outerR = size;
    const innerR = size * 0.4;

    g.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();

    // Shine highlight
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(x - size * 0.2, y - size * 0.2, size * 0.25);

    return g;
  }

  // ============================================
  // PHASES 5-9: WORLD LIST WITH CARDS
  // ============================================
  createWorldList() {
    const startY = 260;
    const cardHeight = 180;
    const gap = 20;

    this.worldContainer = this.add.container(0, 0).setDepth(5);
    this.cardHeight = cardHeight;
    this.cardGap = gap;
    this.startY = startY;

    // Find current world (first unlocked but not fully completed, or last unlocked)
    this.currentWorldIndex = this.findCurrentWorldIndex();

    WORLDS.forEach((world, i) => {
      const y = startY + i * (cardHeight + gap);
      this.createWorldCard(world, y, cardHeight, i === this.currentWorldIndex);
    });

    // Setup scrolling
    this.setupScrolling(startY, cardHeight, gap);

    // Auto-scroll to current world
    this.scrollToWorld(this.currentWorldIndex, false);
  }

  findCurrentWorldIndex() {
    for (let i = 0; i < WORLDS.length; i++) {
      const world = WORLDS[i];
      if (!progress.isWorldUnlocked(world.id)) {
        return Math.max(0, i - 1);
      }
      const wp = progress.getWorldProgress(world.id);
      if (wp.levelsCompleted < world.levelsRequired) {
        return i;
      }
    }
    return WORLDS.length - 1;
  }

  createWorldCard(world, y, height, isCurrent) {
    const isUnlocked = progress.isWorldUnlocked(world.id);
    const wp = progress.getWorldProgress(world.id);
    const cardWidth = 720;

    // Card container
    const cardContainer = this.add.container(400, y);
    this.worldContainer.add(cardContainer);

    // Glow effect for unlocked cards
    if (isUnlocked) {
      const glowColor = world.accentColor;
      const glow = this.add.graphics();
      glow.fillStyle(glowColor, isCurrent ? 0.25 : 0.12);
      glow.fillRoundedRect(-cardWidth / 2 - 8, -height / 2 - 8, cardWidth + 16, height + 16, 20);
      cardContainer.add(glow);

      if (isCurrent) {
        // Pulsing beacon animation for current world
        this.tweens.add({
          targets: glow,
          alpha: 0.35,
          duration: 1000,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      }
    }

    // Card background
    const cardColor = isUnlocked ? Phaser.Display.Color.ValueToColor(world.color).darken(10).color : 0x1a1a2e;
    const card = this.add.graphics();
    card.fillStyle(cardColor, isUnlocked ? 0.95 : 0.7);
    card.fillRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, 16);

    // Border
    const borderColor = isUnlocked ? world.accentColor : 0x3a3a4a;
    const borderWidth = isCurrent ? 4 : 3;
    card.lineStyle(borderWidth, borderColor, isUnlocked ? 1 : 0.5);
    card.strokeRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, 16);
    cardContainer.add(card);

    // Hit area for interaction
    const hitArea = this.add.rectangle(0, 0, cardWidth, height, 0x000000, 0);
    cardContainer.add(hitArea);

    if (isUnlocked) {
      hitArea.setInteractive({ useHandCursor: true });

      hitArea.on('pointerover', () => {
        card.clear();
        const hoverColor = Phaser.Display.Color.ValueToColor(world.color).lighten(10).color;
        card.fillStyle(hoverColor, 0.95);
        card.fillRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, 16);
        card.lineStyle(4, 0xffffff, 1);
        card.strokeRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, 16);
      });

      hitArea.on('pointerout', () => {
        card.clear();
        card.fillStyle(cardColor, 0.95);
        card.fillRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, 16);
        card.lineStyle(borderWidth, borderColor, 1);
        card.strokeRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, 16);
      });

      hitArea.on('pointerdown', () => {
        audio.playClick();
        this.selectWorldWithFeedback(world, cardContainer);
      });
    }

    // World icon (larger)
    const iconX = -cardWidth / 2 + 80;
    const icon = this.add.image(iconX, 0, `world_${world.id}`).setScale(2.5);

    if (!isUnlocked) {
      // Silhouette effect for locked worlds
      icon.setTint(0x000000);
      icon.setAlpha(0.5);

      // Fog/mist overlay
      const fog = this.add.graphics();
      fog.fillStyle(0x2a2a4a, 0.6);
      fog.fillCircle(iconX, 0, 55);
      cardContainer.add(fog);

      // Animate fog subtly
      this.tweens.add({
        targets: fog,
        alpha: 0.4,
        duration: 2000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    }
    cardContainer.add(icon);

    // Text content
    const textX = -cardWidth / 2 + 170;

    // World name (larger, bolder)
    const nameText = this.add.text(textX, -35, world.name, {
      fontSize: '48px',
      fill: isUnlocked ? '#ffffff' : '#555555',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: isUnlocked ? 3 : 0
    }).setOrigin(0, 0.5);
    cardContainer.add(nameText);

    // Table info (smaller, secondary)
    const tableText = world.tables.length > 1
      ? `${world.tables[0]}x and ${world.tables[1]}x tables`
      : `${world.tables[0]}x table`;
    const infoText = this.add.text(textX, 20, tableText, {
      fontSize: '28px',
      fill: isUnlocked ? '#aaaaaa' : '#444444',
      fontFamily: 'Arial'
    }).setOrigin(0, 0.5);
    cardContainer.add(infoText);

    // Right side - stars/progress or lock
    const rightX = cardWidth / 2 - 70;

    if (isUnlocked) {
      // Stars earned
      const starContainer = this.add.container(rightX, -25);

      const starIcon = this.createCustomStar(-25, 0, 14);
      starContainer.add(starIcon);

      const starsText = this.add.text(5, 0, `${wp.starsEarned}`, {
        fontSize: '36px',
        fill: '#f7dc6f',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0, 0.5);
      starContainer.add(starsText);
      cardContainer.add(starContainer);

      // Progress
      const progressText = this.add.text(rightX, 25, `${wp.levelsCompleted}/${world.levelsRequired}`, {
        fontSize: '28px',
        fill: '#81ecec',
        fontFamily: 'Arial'
      }).setOrigin(0.5);
      cardContainer.add(progressText);

      // "PLAY!" badge for current world
      if (isCurrent && wp.levelsCompleted < world.levelsRequired) {
        const playBadge = this.add.container(rightX, 60);

        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(0x58d68d, 1);
        badgeBg.fillRoundedRect(-40, -14, 80, 28, 14);
        playBadge.add(badgeBg);

        const playText = this.add.text(0, 0, 'PLAY!', {
          fontSize: '20px',
          fill: '#ffffff',
          fontFamily: 'Arial',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        playBadge.add(playText);
        cardContainer.add(playBadge);

        // Bounce animation
        this.tweens.add({
          targets: playBadge,
          y: 55,
          duration: 600,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1
        });
      }
    } else {
      // Lock icon for locked worlds
      const lockIcon = this.createLockIcon(rightX, 0);
      cardContainer.add(lockIcon);

      // "???" text
      const mysteryText = this.add.text(rightX, 45, '???', {
        fontSize: '24px',
        fill: '#555555',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      cardContainer.add(mysteryText);
    }

    // Store reference
    cardContainer.worldData = world;
    cardContainer.cardGraphics = card;
  }

  createLockIcon(x, y) {
    const g = this.add.graphics();
    const size = 24;

    // Lock body
    g.fillStyle(0x555555, 1);
    g.fillRoundedRect(x - size * 0.6, y - size * 0.2, size * 1.2, size, 4);

    // Shackle
    g.lineStyle(4, 0x555555, 1);
    g.beginPath();
    g.arc(x, y - size * 0.3, size * 0.4, Math.PI, 0);
    g.strokePath();

    // Keyhole
    g.fillStyle(0x333333, 1);
    g.fillCircle(x, y + size * 0.1, size * 0.15);
    g.fillRect(x - size * 0.08, y + size * 0.1, size * 0.16, size * 0.3);

    return g;
  }

  // ============================================
  // PHASE 9: JUICY TAP FEEDBACK
  // ============================================
  selectWorldWithFeedback(world, cardContainer) {
    // Disable further input
    this.input.enabled = false;

    // Scale up animation
    this.tweens.add({
      targets: cardContainer,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 100,
      ease: 'Back.easeOut'
    });

    // Burst of star particles
    const particles = this.add.particles(cardContainer.x, cardContainer.y + this.worldContainer.y, 'particle_glow', {
      speed: { min: 100, max: 250 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [world.accentColor, 0xf7dc6f, 0xffffff],
      lifespan: 600,
      quantity: 15,
      emitting: false
    });
    particles.setDepth(100);
    particles.explode();

    // Brief dramatic pause then transition
    this.time.delayedCall(200, () => {
      this.registry.set('selectedWorld', world.id);
      new TransitionManager(this).fadeToScene('LevelSelectScene');
    });
  }

  // ============================================
  // PHASE 8: SNAP-TO-CARD SCROLLING
  // ============================================
  setupScrolling(startY, cardHeight, gap) {
    const totalHeight = WORLDS.length * (cardHeight + gap);
    const viewHeight = 980;
    this.maxScroll = Math.max(0, totalHeight - viewHeight);
    this.scrollVelocity = 0;
    this.isScrolling = false;

    if (this.maxScroll > 0) {
      // Mouse wheel
      this.input.on('wheel', (p, g, dx, dy) => {
        this.worldContainer.y = Phaser.Math.Clamp(
          this.worldContainer.y - dy * 0.8,
          -this.maxScroll,
          0
        );
        this.scrollVelocity = -dy * 0.5;
        this.isScrolling = true;
      });

      // Touch/drag scrolling
      let dragStart = 0;
      let containerStart = 0;
      let lastY = 0;
      let lastTime = 0;

      this.input.on('pointerdown', p => {
        if (p.y > 220 && p.y < 1280) {
          dragStart = p.y;
          containerStart = this.worldContainer.y;
          lastY = p.y;
          lastTime = Date.now();
          this.scrollVelocity = 0;
          this.isScrolling = true;
        }
      });

      this.input.on('pointermove', p => {
        if (p.isDown && dragStart > 0) {
          const delta = p.y - dragStart;
          this.worldContainer.y = Phaser.Math.Clamp(
            containerStart + delta,
            -this.maxScroll - 50, // Allow overscroll for bounce
            50
          );

          // Calculate velocity
          const now = Date.now();
          const dt = now - lastTime;
          if (dt > 0) {
            this.scrollVelocity = (p.y - lastY) / dt * 16;
          }
          lastY = p.y;
          lastTime = now;
        }
      });

      this.input.on('pointerup', () => {
        if (dragStart > 0) {
          dragStart = 0;
          // Apply momentum and snap
          this.applyScrollMomentum();
        }
      });
    }
  }

  applyScrollMomentum() {
    const friction = 0.95;
    const minVelocity = 0.5;

    const update = () => {
      if (!this.isScrolling) return;

      // Apply velocity
      this.worldContainer.y += this.scrollVelocity;
      this.scrollVelocity *= friction;

      // Bounce at boundaries
      if (this.worldContainer.y > 0) {
        this.worldContainer.y *= 0.8;
        this.scrollVelocity *= 0.5;
      } else if (this.worldContainer.y < -this.maxScroll) {
        const overscroll = this.worldContainer.y + this.maxScroll;
        this.worldContainer.y = -this.maxScroll + overscroll * 0.8;
        this.scrollVelocity *= 0.5;
      }

      // Check if should stop and snap
      if (Math.abs(this.scrollVelocity) < minVelocity) {
        this.isScrolling = false;
        this.snapToNearestCard();
        return;
      }

      this.time.delayedCall(16, update);
    };

    update();
  }

  snapToNearestCard() {
    const currentY = -this.worldContainer.y;
    const cardTotal = this.cardHeight + this.cardGap;
    const nearestIndex = Math.round(currentY / cardTotal);
    const targetY = -Phaser.Math.Clamp(nearestIndex * cardTotal, 0, this.maxScroll);

    this.tweens.add({
      targets: this.worldContainer,
      y: targetY,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }

  scrollToWorld(worldIndex, animate = true) {
    const targetY = -Phaser.Math.Clamp(
      worldIndex * (this.cardHeight + this.cardGap),
      0,
      this.maxScroll
    );

    if (animate) {
      this.tweens.add({
        targets: this.worldContainer,
        y: targetY,
        duration: 500,
        ease: 'Cubic.easeOut'
      });
    } else {
      this.worldContainer.y = targetY;
    }
  }

  // ============================================
  // PHASE 10: FLOATING FOOTER
  // ============================================
  createFloatingFooter() {
    // Tutorial button (floating, minimal)
    const container = this.add.container(400, 1340).setDepth(15);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.8);
    bg.fillRoundedRect(-120, -22, 240, 44, 22);
    bg.lineStyle(2, 0x4a4a6a, 0.5);
    bg.strokeRoundedRect(-120, -22, 240, 44, 22);
    container.add(bg);

    const text = this.add.text(0, 0, 'Review Tutorial', {
      fontSize: '26px',
      fill: '#888888',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
    container.add(text);

    // Hit area
    const hitArea = this.add.rectangle(0, 0, 240, 44, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      text.setFill('#ffffff');
      bg.clear();
      bg.fillStyle(0x2a2a4e, 0.9);
      bg.fillRoundedRect(-120, -22, 240, 44, 22);
      bg.lineStyle(2, 0x81ecec, 0.7);
      bg.strokeRoundedRect(-120, -22, 240, 44, 22);
    });

    hitArea.on('pointerout', () => {
      text.setFill('#888888');
      bg.clear();
      bg.fillStyle(0x1a1a2e, 0.8);
      bg.fillRoundedRect(-120, -22, 240, 44, 22);
      bg.lineStyle(2, 0x4a4a6a, 0.5);
      bg.strokeRoundedRect(-120, -22, 240, 44, 22);
    });

    hitArea.on('pointerdown', () => {
      audio.playClick();
      this.registry.set('tutorialComplete', false);
      this.scene.start('TutorialScene');
    });
  }

  // ============================================
  // SCENE LIFECYCLE
  // ============================================
  onSceneWake() {
    this.totalStarsText.setText(`${progress.totalStars} Stars`);

    // Rebuild world list
    this.worldContainer.removeAll(true);
    this.currentWorldIndex = this.findCurrentWorldIndex();

    WORLDS.forEach((world, i) => {
      const y = this.startY + i * (this.cardHeight + this.cardGap);
      this.createWorldCard(world, y, this.cardHeight, i === this.currentWorldIndex);
    });

    // Scroll to current world
    this.scrollToWorld(this.currentWorldIndex, true);
  }

  // ============================================
  // ACHIEVEMENTS OVERLAY
  // ============================================
  showAchievements() {
    const overlay = this.add.rectangle(400, 700, 800, 1400, 0x000000, 0.9)
      .setInteractive().setDepth(100);

    const panel = this.add.graphics().setDepth(101);
    panel.fillStyle(0x1a1a2e, 1);
    panel.fillRoundedRect(40, 150, 720, 1100, 20);
    panel.lineStyle(3, 0xf7dc6f, 1);
    panel.strokeRoundedRect(40, 150, 720, 1100, 20);

    const title = this.add.text(400, 200, 'Achievements', {
      fontSize: '48px',
      fill: '#f7dc6f',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(102);

    const closeBtn = this.add.text(720, 180, '✕', {
      fontSize: '48px',
      fill: '#ff6b6b'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(102);

    const elements = [overlay, panel, title, closeBtn];

    const allAch = achievements.getAllAchievements();
    let yPos = 290;

    allAch.forEach(ach => {
      if (yPos > 1180) return;

      const row = this.add.graphics().setDepth(102);
      row.fillStyle(ach.earned ? 0x2a4a2a : 0x252535, 1);
      row.fillRoundedRect(70, yPos - 45, 660, 90, 12);
      row.lineStyle(2, ach.earned ? 0x58d68d : 0x3a3a4a, 1);
      row.strokeRoundedRect(70, yPos - 45, 660, 90, 12);
      elements.push(row);

      elements.push(this.add.text(120, yPos, ach.icon, { fontSize: '40px' })
        .setOrigin(0.5).setAlpha(ach.earned ? 1 : 0.4).setDepth(102));

      elements.push(this.add.text(170, yPos - 14, ach.name, {
        fontSize: '26px',
        fill: ach.earned ? '#ffffff' : '#888888',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(102));

      elements.push(this.add.text(170, yPos + 18, ach.description, {
        fontSize: '20px',
        fill: ach.earned ? '#81ecec' : '#666666',
        fontFamily: 'Arial'
      }).setOrigin(0, 0.5).setDepth(102));

      yPos += 100;
    });

    closeBtn.on('pointerdown', () => {
      audio.playClick();
      elements.forEach(el => el.destroy());
    });

    closeBtn.on('pointerover', () => closeBtn.setScale(1.2));
    closeBtn.on('pointerout', () => closeBtn.setScale(1));
  }
}
