export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

export const HAPITCS = {
  MAJOR_CLICK: 15,
  COMPLETE: [20, 50, 20],
  FAILURE: 100,
  GUIDANCE: 10
};
