// TransitionManager - Handles smooth scene transitions
export class TransitionManager {
  constructor(scene) {
    this.scene = scene;
  }

  // Fade out current scene, then start target scene
  fadeToScene(targetScene, data = {}, duration = 400) {
    this.scene.input.enabled = false;

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

  // Call in scene's create() for fade-in effect
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
}
