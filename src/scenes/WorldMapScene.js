import Phaser from 'phaser';
import { WORLDS, progress } from '../GameData.js';
import { audio } from '../AudioManager.js';
import { TransitionManager } from '../TransitionManager.js';
import { createStarfield } from '../starfieldHelper.js';
import { createIconButton } from '../buttonHelper.js';
import { style } from '../textStyles.js';
import { companion, drawCompanion } from '../CompanionManager.js';
import { streak } from '../StreakManager.js';
import { economy } from '../EconomyManager.js';
import { ship } from '../ShipManager.js';
import { drawShip } from '../ShipRenderer.js';

const W = 800;
const H = 1400;

export class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldMapScene' });
  }

  create() {
    audio.init();

    createStarfield(this, { accentStrength: 0 });

    this.createHeader();
    this.createWorldList();

    this.events.on('wake', this.onSceneWake, this);
    this.events.on('resume', this.onSceneWake, this);
    this.events.once('shutdown', () => {
      this.events.off('wake', this.onSceneWake, this);
      this.events.off('resume', this.onSceneWake, this);
    });

    new TransitionManager(this).fadeIn(300);
  }

  // ============================================================
  // HEADER (logo + chrome)
  // ============================================================
  createHeader() {
    // Solid header backdrop so cards never bleed through
    const bg = this.add.graphics().setDepth(10);
    bg.fillStyle(0x07071a, 0.95);
    bg.fillRect(0, 0, W, 340);
    bg.fillStyle(0x07071a, 0.7);
    bg.fillRect(0, 340, W, 30);

    // Settings (Parent Dashboard) — top-left
    createIconButton(this, {
      x: 60, y: 60, radius: 28,
      accentColor: 0x4ecdc4,
      drawIcon: (g, size) => this.drawGearIcon(g, size),
      onClick: () => {
        this.scene.start('ParentDashboardScene');
      }
    }).setDepth(15);

    // Cockpit — top-right (replaces shop + trophy: cockpit holds shop & records)
    createIconButton(this, {
      x: 740, y: 60, radius: 28,
      accentColor: 0xc77eff,
      drawIcon: (g, size) => this.drawShopIcon(g, size),
      onClick: () => this.openShop()
    }).setDepth(15);

    // Logo / wordmark — clean and confident
    const logo = this.add.container(W / 2, 110).setDepth(14);

    const glow = this.add.graphics();
    glow.fillStyle(0xf7dc6f, 0.12);
    glow.fillEllipse(0, 0, 540, 60);
    logo.add(glow);
    this.tweens.add({
      targets: glow,
      alpha: 0.22,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const title = this.add.text(0, 0, 'Cosmic Math', style('display', {
      fontSize: '64px',
      fill: '#ffffff',
      stroke: '#0a0a1a',
      strokeThickness: 4
    })).setOrigin(0.5);
    logo.add(title);

    this.tweens.add({
      targets: logo,
      y: 116,
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Stars / Stardust / Streak — three-chip row under the logo
    this.createStarCounter();
    this.createStardustChip();
    this.createStreakChip();

    // Pet companion floating below the chips
    this.createCompanionDisplay();
  }

  createStarCounter() {
    const container = this.add.container(W / 2 - 200, 200).setDepth(14);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.85);
    bg.fillRoundedRect(-70, -22, 140, 44, 22);
    bg.lineStyle(2, 0xf7dc6f, 0.5);
    bg.strokeRoundedRect(-70, -22, 140, 44, 22);
    container.add(bg);

    const star = this.makeMiniStar(-46, 0, 12);
    container.add(star);

    this.totalStarsText = this.add.text(12, 0, `${progress.totalStars}`, style('subhead', {
      fontSize: '24px',
      fill: '#f7dc6f'
    })).setOrigin(0.5);
    container.add(this.totalStarsText);
  }

  createStardustChip() {
    const container = this.add.container(W / 2, 200).setDepth(14);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.85);
    bg.fillRoundedRect(-70, -22, 140, 44, 22);
    bg.lineStyle(2, 0xc77eff, 0.6);
    bg.strokeRoundedRect(-70, -22, 140, 44, 22);
    container.add(bg);

    // Sparkle icon — diamond with a small twinkle
    const sparkle = this.add.graphics();
    sparkle.fillStyle(0xc77eff, 1);
    sparkle.beginPath();
    sparkle.moveTo(-46, -10);
    sparkle.lineTo(-38, 0);
    sparkle.lineTo(-46, 10);
    sparkle.lineTo(-54, 0);
    sparkle.closePath();
    sparkle.fillPath();
    sparkle.fillStyle(0xffffff, 0.9);
    sparkle.fillCircle(-46, -2, 2);
    container.add(sparkle);

    this.stardustText = this.add.text(12, 0, `${economy.getStardust()}`, style('subhead', {
      fontSize: '24px',
      fill: '#c77eff'
    })).setOrigin(0.5);
    container.add(this.stardustText);
  }

  createStreakChip() {
    const container = this.add.container(W / 2 + 200, 200).setDepth(14);

    const bg = this.add.graphics();
    bg.fillStyle(0x12122a, 0.85);
    bg.fillRoundedRect(-70, -22, 140, 44, 22);
    bg.lineStyle(2, 0xff8b3d, 0.6);
    bg.strokeRoundedRect(-70, -22, 140, 44, 22);
    container.add(bg);

    // Flame icon
    const flame = this.add.graphics();
    flame.fillStyle(0xff8b3d, 1);
    flame.beginPath();
    flame.moveTo(-46, -8);
    flame.lineTo(-54, 4);
    flame.lineTo(-48, 12);
    flame.lineTo(-38, 12);
    flame.lineTo(-32, 4);
    flame.lineTo(-38, -8);
    flame.lineTo(-42, -4);
    flame.closePath();
    flame.fillPath();
    flame.fillStyle(0xffd86b, 0.8);
    flame.fillCircle(-43, 4, 3);
    container.add(flame);

    const current = streak.getCurrent();
    this.streakText = this.add.text(14, 0, `${current}d`, style('subhead', {
      fontSize: '24px',
      fill: '#ff8b3d'
    })).setOrigin(0.5);
    container.add(this.streakText);
  }

  createCompanionDisplay() {
    if (!companion.hasStarter()) return;
    this.companionDisplay = drawCompanion(this, W / 2, 290, {
      scale: 0.85
    });
    this.companionDisplay.setDepth(13);

    // Tap pet → open CompanionScene
    const petHit = this.add.circle(W / 2, 290, 70, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(16);
    petHit.on('pointerdown', () => {
      audio.playClick();
      new TransitionManager(this).fadeToScene('CompanionScene');
    });
    petHit.on('pointerover', () => {
      this.tweens.add({ targets: this.companionDisplay, scale: 0.92, duration: 120 });
    });
    petHit.on('pointerout', () => {
      this.tweens.add({ targets: this.companionDisplay, scale: 0.85, duration: 120 });
    });

  }

  drawGearIcon(g, size) {
    g.lineStyle(3, 0x81ecec, 1);
    const teeth = 8;
    const outerR = size;
    const innerR = size * 0.7;
    g.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i / (teeth * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.strokePath();
    g.fillStyle(0x07071a, 1);
    g.fillCircle(0, 0, size * 0.35);
    g.lineStyle(2, 0x81ecec, 1);
    g.strokeCircle(0, 0, size * 0.35);
  }

  drawShopIcon(g, size) {
    // Shopping bag — rounded rectangle body + handle arc
    g.fillStyle(0xc77eff, 1);
    g.fillRoundedRect(-size * 0.55, -size * 0.15, size * 1.1, size * 0.85, 6);
    g.lineStyle(3, 0xc77eff, 1);
    g.beginPath();
    g.arc(0, -size * 0.15, size * 0.32, Math.PI, 0);
    g.strokePath();
    // Sparkle accent on the bag
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(size * 0.18, size * 0.22, size * 0.1);
    g.fillStyle(0xc77eff, 1);
    g.fillCircle(size * 0.18, size * 0.22, size * 0.04);
  }

  openShop() {
    audio.playClick();
    new TransitionManager(this).fadeToScene('CockpitScene');
  }

  makeMiniStar(x, y, size) {
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
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(x - size * 0.2, y - size * 0.2, size * 0.25);
    return g;
  }

  // ============================================================
  // WORLD LIST (scrollable cards)
  // ============================================================
  createWorldList() {
    const startY = 480;
    const cardHeight = 180;
    const gap = 20;

    this.cardHeight = cardHeight;
    this.cardGap = gap;
    this.startY = startY;

    this.worldContainer = this.add.container(0, 0).setDepth(5);
    this.currentWorldIndex = this.findCurrentWorldIndex();

    WORLDS.forEach((world, i) => {
      const y = startY + i * (cardHeight + gap);
      this.createWorldCard(world, y, cardHeight, i === this.currentWorldIndex);
    });

    this.setupScrolling(startY, cardHeight, gap);
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

    const cardContainer = this.add.container(W / 2, y);
    this.worldContainer.add(cardContainer);

    if (isUnlocked) {
      const glow = this.add.graphics();
      glow.fillStyle(world.accentColor, isCurrent ? 0.22 : 0.1);
      glow.fillRoundedRect(-cardWidth / 2 - 8, -height / 2 - 8, cardWidth + 16, height + 16, 22);
      cardContainer.add(glow);

      if (isCurrent) {
        this.tweens.add({
          targets: glow,
          alpha: 0.32,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    }

    const card = this.add.graphics();
    const fillColor = isUnlocked ? 0x12122a : 0x0c0c1c;
    card.fillStyle(fillColor, isUnlocked ? 0.95 : 0.7);
    card.fillRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, 18);
    card.lineStyle(isCurrent ? 4 : 3, isUnlocked ? world.accentColor : 0x3a3a4a, isUnlocked ? 0.85 : 0.4);
    card.strokeRoundedRect(-cardWidth / 2, -height / 2, cardWidth, height, 18);
    cardContainer.add(card);

    const hit = this.add.rectangle(0, 0, cardWidth, height, 0x000000, 0);
    cardContainer.add(hit);

    if (isUnlocked) {
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => {
        this.tweens.add({ targets: cardContainer, scaleX: 1.02, scaleY: 1.02, duration: 100 });
      });
      hit.on('pointerout', () => {
        this.tweens.add({ targets: cardContainer, scaleX: 1, scaleY: 1, duration: 100 });
      });
      hit.on('pointerdown', () => {
        audio.playClick();
        this.selectWorldWithFeedback(world, cardContainer);
      });
    }

    // World icon
    const iconX = -cardWidth / 2 + 90;
    const icon = this.add.image(iconX, 0, `world_${world.id}`).setScale(2.4);
    if (!isUnlocked) {
      icon.setTint(0x000000);
      icon.setAlpha(0.5);
    }
    cardContainer.add(icon);

    // World name & subtitle
    const textX = -cardWidth / 2 + 190;
    const textW = cardWidth - 280;

    cardContainer.add(this.add.text(textX, -34, world.name, style('headline', {
      fontSize: '38px',
      fill: isUnlocked ? '#ffffff' : '#5a5a72'
    })).setOrigin(0, 0.5));

    const prevWorld = WORLDS.find(w => w.id === world.id - 1);
    const subtitle = isUnlocked
      ? world.description
      : prevWorld
        ? `Clear ${prevWorld.name} to unlock`
        : 'Locked';
    cardContainer.add(this.add.text(textX, 22, subtitle, style('body', {
      fontSize: isUnlocked ? 18 : 22,
      fill: isUnlocked ? '#' + world.accentColor.toString(16).padStart(6, '0') : '#7a7a90',
      wordWrap: { width: textW }
    })).setOrigin(0, 0.5));

    // Right-side stats
    const rightX = cardWidth / 2 - 80;
    if (isUnlocked) {
      const starContainer = this.add.container(rightX, -28);
      starContainer.add(this.makeMiniStar(-26, 0, 14));
      starContainer.add(this.add.text(8, 0, `${wp.starsEarned}`, style('headline', {
        fontSize: '32px',
        fill: '#f7dc6f'
      })).setOrigin(0, 0.5));
      cardContainer.add(starContainer);

      cardContainer.add(this.add.text(rightX, 22, `${wp.levelsCompleted}/${world.levelsRequired}`, style('body', {
        fontSize: '24px',
        fill: '#' + world.accentColor.toString(16).padStart(6, '0')
      })).setOrigin(0.5));

      if (isCurrent) {
        // Park the ship in the upper-right of the kid's current world card.
        const parkedShip = drawShip(this, rightX - 30, -height / 2 - 20, {
          scale: 0.55,
          parts: ship.getCurrentParts()
        });
        cardContainer.add(parkedShip);
        this.tweens.add({
          targets: parkedShip,
          y: -height / 2 - 28,
          duration: 1600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      if (isCurrent && wp.levelsCompleted < world.levelsRequired) {
        const playBadge = this.add.container(rightX, 60);
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(0x58d68d, 1);
        badgeBg.fillRoundedRect(-44, -14, 88, 28, 14);
        playBadge.add(badgeBg);
        playBadge.add(this.add.text(0, 0, 'PLAY', style('caption', {
          fontSize: '18px',
          fill: '#0a1f0a',
          fontStyle: '900'
        })).setOrigin(0.5));
        cardContainer.add(playBadge);

        this.tweens.add({
          targets: playBadge,
          y: 54,
          duration: 700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else {
      const lock = this.add.graphics();
      lock.fillStyle(0x4a4a60, 1);
      lock.fillRoundedRect(rightX - 18, -8, 36, 26, 4);
      lock.lineStyle(4, 0x4a4a60, 1);
      lock.beginPath();
      lock.arc(rightX, -10, 12, Math.PI, 0);
      lock.strokePath();
      cardContainer.add(lock);
    }
  }

  selectWorldWithFeedback(world, cardContainer) {
    this.input.enabled = false;
    this.tweens.add({
      targets: cardContainer,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 120,
      ease: 'Back.easeOut'
    });
    this.time.delayedCall(180, () => {
      this.registry.set('selectedWorld', world.id);
      new TransitionManager(this).fadeToScene('LevelSelectScene');
    });
  }

  // ============================================================
  // SCROLLING
  // ============================================================
  setupScrolling(startY, cardHeight, gap) {
    const totalHeight = WORLDS.length * (cardHeight + gap);
    const viewHeight = 1100;
    this.maxScroll = Math.max(0, totalHeight - viewHeight);
    this.scrollVelocity = 0;
    this.isScrolling = false;

    if (this.maxScroll <= 0) return;

    this.input.on('wheel', (_p, _g, _dx, dy) => {
      this.worldContainer.y = Phaser.Math.Clamp(
        this.worldContainer.y - dy * 0.8,
        -this.maxScroll,
        0
      );
      this.scrollVelocity = -dy * 0.5;
      this.isScrolling = true;
    });

    let dragStart = 0;
    let containerStart = 0;
    let lastY = 0;
    let lastTime = 0;

    this.input.on('pointerdown', p => {
      if (p.y > 370 && p.y < 1300) {
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
          -this.maxScroll - 50,
          50
        );
        const now = Date.now();
        const dt = now - lastTime;
        if (dt > 0) this.scrollVelocity = (p.y - lastY) / dt * 16;
        lastY = p.y;
        lastTime = now;
      }
    });

    this.input.on('pointerup', () => {
      if (dragStart > 0) {
        dragStart = 0;
        this.applyScrollMomentum();
      }
    });
  }

  applyScrollMomentum() {
    const friction = 0.95;
    const minVelocity = 0.5;

    const update = () => {
      if (!this.isScrolling) return;
      this.worldContainer.y += this.scrollVelocity;
      this.scrollVelocity *= friction;

      if (this.worldContainer.y > 0) {
        this.worldContainer.y *= 0.8;
        this.scrollVelocity *= 0.5;
      } else if (this.worldContainer.y < -this.maxScroll) {
        const overscroll = this.worldContainer.y + this.maxScroll;
        this.worldContainer.y = -this.maxScroll + overscroll * 0.8;
        this.scrollVelocity *= 0.5;
      }

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
      duration: 220,
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

  // ============================================================
  // LIFECYCLE
  // ============================================================
  onSceneWake() {
    if (this.totalStarsText) this.totalStarsText.setText(`${progress.totalStars}`);

    if (this.stardustText) this.stardustText.setText(`${economy.getStardust()}`);

    if (this.streakText) {
      const current = streak.getCurrent();
      this.streakText.setText(`${current}d`);
    }

    // Rebuild companion display so the stage updates
    if (this.companionDisplay) {
      this.companionDisplay.destroy();
      this.companionDisplay = null;
    }
    if (companion.hasStarter()) {
      this.companionDisplay = drawCompanion(this, W / 2, 290, { scale: 0.85 });
      this.companionDisplay.setDepth(13);
    }

    this.worldContainer.removeAll(true);
    this.currentWorldIndex = this.findCurrentWorldIndex();

    WORLDS.forEach((world, i) => {
      const y = this.startY + i * (this.cardHeight + this.cardGap);
      this.createWorldCard(world, y, this.cardHeight, i === this.currentWorldIndex);
    });

    this.scrollToWorld(this.currentWorldIndex, true);
  }

}
