// Background music manager. Wraps Phaser's global sound manager so looping
// tracks persist across scenes, share the mute state of AudioManager, and
// can be swapped per-scene (home theme on the map, hidden-world themes in
// Glitch World / Dad's Garage).

class MusicManager {
  constructor() {
    this.tracks = {};        // key -> Phaser sound instance
    this.enabled = true;
    this.volume = 0.35;
    this.currentKey = null;  // last-requested track key
  }

  // Ensure `key` is the actively playing track. If a different track is
  // playing, it's stopped first. Missing audio (file not provided yet) is
  // a quiet no-op rather than a crash.
  ensurePlaying(scene, key = 'homeTheme') {
    if (!scene.cache.audio.exists(key)) {
      if (this.currentKey && this.currentKey !== key) this._stopCurrent();
      this.currentKey = key;
      return;
    }

    if (this.currentKey && this.currentKey !== key) this._stopCurrent();

    if (!this.tracks[key]) {
      this.tracks[key] = scene.sound.add(key, { loop: true, volume: this.volume });
      this._applyMuteToTrack(this.tracks[key]);
    }
    const t = this.tracks[key];
    if (t.isPaused) t.resume();
    else if (!t.isPlaying) t.play();
    this.currentKey = key;
  }

  pause() {
    if (!this.currentKey) return;
    const t = this.tracks[this.currentKey];
    if (t && t.isPlaying) t.pause();
  }

  _stopCurrent() {
    const cur = this.tracks[this.currentKey];
    if (cur && (cur.isPlaying || cur.isPaused)) cur.stop();
  }

  setEnabled(bool) {
    this.enabled = bool;
    for (const t of Object.values(this.tracks)) this._applyMuteToTrack(t);
  }

  // Phaser 3.90's WebAudioSound.mute setter uses setValueAtTime(_, 0), which
  // is silently ignored by Chrome once the audio context has been running past
  // time zero. Writing the gain node value directly is the reliable workaround.
  _applyMuteToTrack(t) {
    if (t && t.muteNode) t.muteNode.gain.value = this.enabled ? 1 : 0;
  }
}

export const music = new MusicManager();
