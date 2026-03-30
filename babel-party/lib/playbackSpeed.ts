/** Google Cloud TTS speakingRate is clamped 0.25–1.0 on the server. */
export const PLAYBACK_SPEED_MIN = 0.25;
export const PLAYBACK_SPEED_MAX = 1;
/** Slightly below 0.5 so reverse clues feel slower out of the box; user can raise with the slider. */
export const PLAYBACK_SPEED_DEFAULT = 0.4;

export function clampPlaybackSpeed(n: number): number {
  if (Number.isNaN(n)) return PLAYBACK_SPEED_DEFAULT;
  return Math.min(PLAYBACK_SPEED_MAX, Math.max(PLAYBACK_SPEED_MIN, n));
}
