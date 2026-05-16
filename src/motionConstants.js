// Shared motion vocabulary for the polish pass.
//
// Gameplay motion is snappy (short Quad.easeOut) so taps feel immediate.
// Transitions and ambient effects are dreamier (longer Cubic.easeInOut /
// Sine.easeInOut) so screen changes and idle loops breathe. Cinematic
// moments earn their own beats — short intro/outro framing a longer hold.
//
// Use these instead of hand-rolling magic numbers; if a phase needs a new
// timing band, add it here so the whole game stays coherent.

export const MOTION = {
  gameplay:    { ease: 'Quad.easeOut',    fast: 120, normal: 200 },
  transitions: { ease: 'Cubic.easeInOut', fast: 300, normal: 500, slow: 800 },
  cinematic:   { intro: 240, hold: 600, peak: 1200, outro: 400 },
};
