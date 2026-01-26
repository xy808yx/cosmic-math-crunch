/**
 * TransitionManager - Handles smooth scene transitions
 */
export class TransitionManager {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Fade out current scene, then start target scene
   */
  fadeToScene(targetScene, data = {}, duration = 400) {
    // Disable input during transition
    this.scene.input.enabled = false;

    // Create overlay
    const overlay = this.scene.add.rectangle(200, 350, 400, 700, 0x0a0a1a, 0);
    overlay.setDepth(1000);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: duration,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.scene.scene.start(targetScene, data);
      }
    });
  }

  /**
   * Slide transition (camera pan effect)
   */
  slideToScene(targetScene, direction = 'left', data = {}) {
    const sign = direction === 'left' ? -1 : 1;

    // Disable input
    this.scene.input.enabled = false;

    // Create slide-out overlay
    const overlay = this.scene.add.rectangle(
      200 - (400 * sign),
      350,
      400,
      700,
      0x0a0a1a,
      1
    );
    overlay.setDepth(1000);

    this.scene.tweens.add({
      targets: overlay,
      x: 200,
      duration: 350,
      ease: 'Power2.easeIn',
      onComplete: () => {
        this.scene.scene.start(targetScene, data);
      }
    });
  }

  /**
   * Call in scene's create() for fade-in effect
   */
  fadeIn(duration = 300) {
    const overlay = this.scene.add.rectangle(200, 350, 400, 700, 0x0a0a1a, 1);
    overlay.setDepth(1000);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        overlay.destroy();
      }
    });
  }

  /**
   * Quick flash transition (for restarts)
   */
  flashRestart(duration = 200) {
    const overlay = this.scene.add.rectangle(200, 350, 400, 700, 0xffffff, 0);
    overlay.setDepth(1000);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: duration / 2,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        overlay.destroy();
      }
    });
  }
}
