export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export const playTickSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
};

export const HAPITCS = {
  MAJOR_CLICK: 15,
  MINOR_CLICK: 10,
  COMPLETE: [20, 50, 20],
  SUCCESS: [10, 30, 50],
  FAILURE: 100,
  GUIDANCE: 10
};
