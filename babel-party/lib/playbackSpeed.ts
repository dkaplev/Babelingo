/** Maps to expo-av playback rate (iOS/Android) or server speakingRate on web. Clamped 0.25–1. */
export const PLAYBACK_SPEED_MIN = 0.25;
export const PLAYBACK_SPEED_MAX = 1;
/** Default slightly slow vs full speed; user can raise on the slider. */
export const PLAYBACK_SPEED_DEFAULT = 0.5;

export function clampPlaybackSpeed(n: number): number {
  if (Number.isNaN(n)) return PLAYBACK_SPEED_DEFAULT;
  return Math.min(PLAYBACK_SPEED_MAX, Math.max(PLAYBACK_SPEED_MIN, n));
}
