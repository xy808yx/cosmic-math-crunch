// Smooth scene transitions using a fade overlay sized to the camera viewport.
export class TransitionManager {
  constructor(scene) {
    this.scene = scene;
  }

  fadeToScene(targetScene, data = {}, duration = 400) {
    this.scene.input.enabled = false;

    const cam = this.scene.cameras.main;
    const w = cam.width;
    const h = cam.height;
    const overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x0a0a1a, 0);
    overlay.setDepth(1000);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.scene.scene.start(targetScene, data);
      }
    });
  }

  fadeIn(duration = 300) {
    const cam = this.scene.cameras.main;
    const w = cam.width;
    const h = cam.height;
    const overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x0a0a1a, 1);
    overlay.setDepth(1000);

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => overlay.destroy()
    });
  }
}
