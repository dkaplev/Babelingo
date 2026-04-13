import type { AppGameId } from '@/lib/types';

/** Maps to expo-av playback rate (iOS/Android) or server speakingRate on web. Clamped 0.25–1. */
export const PLAYBACK_SPEED_MIN = 0.25;
export const PLAYBACK_SPEED_MAX = 1;
/** Echo Translator + Babel Phone — normal-speed clue. */
export const PLAYBACK_SPEED_DEFAULT_ECHO = 1;
/** Reverse Audio — slower default backward clue. */
export const PLAYBACK_SPEED_DEFAULT_REVERSE = 0.5;
/** Alias for Echo/Babel defaults (game store, sliders). */
export const PLAYBACK_SPEED_DEFAULT = PLAYBACK_SPEED_DEFAULT_ECHO;

export function playbackSpeedForAppGame(appGame: AppGameId): number {
  return appGame === 'reverse_audio' ? PLAYBACK_SPEED_DEFAULT_REVERSE : PLAYBACK_SPEED_DEFAULT_ECHO;
}

export function clampPlaybackSpeed(n: number): number {
  if (Number.isNaN(n)) return PLAYBACK_SPEED_DEFAULT_ECHO;
  return Math.min(PLAYBACK_SPEED_MAX, Math.max(PLAYBACK_SPEED_MIN, n));
}
