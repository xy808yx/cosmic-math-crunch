// Compact pet HUD shown in GameScene. Munches on each correct answer,
// droops on wrong. Backed by procedural drawing — no sprite assets.

import { drawCompanion, companion } from './CompanionManager.js';
import { style } from './textStyles.js';

export class PetHUD {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.pelletsThisLevel = 0;
    this.container = scene.add.container(x, y).setDepth(20);
    this.build();
  }

  build() {
    const species = companion.getSpecies();
    if (!species) return;

    // Background chip
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x12122a, 0.9);
    bg.fillRoundedRect(-58, -42, 116, 84, 16);
    bg.lineStyle(2, species.accent, 0.7);
    bg.strokeRoundedRect(-58, -42, 116, 84, 16);
    this.container.add(bg);

    // Procedural pet drawn at small scale.
    this.petSprite = drawCompanion(this.scene, -16, 0, {
      preview: false,
      scale: 0.45
    });
    this.container.add(this.petSprite);

    // Pellet counter
    this.pelletText = this.scene.add.text(28, -8, '0', style('stat', {
      fontSize: '22px',
      fill: '#f7dc6f'
    })).setOrigin(0.5);
    this.container.add(this.pelletText);

    this.pelletLabel = this.scene.add.text(28, 16, 'fed', style('caption', {
      fontSize: '14px',
      fill: '#cfcfe0'
    })).setOrigin(0.5);
    this.container.add(this.pelletLabel);
  }

  // Animate the pet munching, increment pellet count, and feed via manager.
  munch(pellets = 1) {
    if (!companion.hasStarter()) return;
    companion.feed(pellets);
    this.pelletsThisLevel += pellets;
    this.pelletText.setText(this.pelletsThisLevel.toString());

    // Pop animation on the sprite
    this.scene.tweens.add({
      targets: this.petSprite,
      scaleX: 1.18,
      scaleY: 0.85,
      duration: 90,
      yoyo: true,
      ease: 'Quad.easeOut'
    });

    // Yellow pellet flying into pet
    const pellet = this.scene.add.circle(this.x + 50, this.y - 8, 6, 0xf7dc6f, 1).setDepth(21);
    this.scene.tweens.add({
      targets: pellet,
      x: this.x - 16,
      y: this.y,
      scale: 0.4,
      alpha: 0,
      duration: 280,
      ease: 'Quad.easeIn',
      onComplete: () => pellet.destroy()
    });
  }

  // Quick droop on wrong answer.
  droop() {
    this.scene.tweens.add({
      targets: this.petSprite,
      angle: { from: -8, to: 0 },
      duration: 280,
      ease: 'Sine.easeOut'
    });
  }

  destroy() {
    this.container.destroy();
  }
}
