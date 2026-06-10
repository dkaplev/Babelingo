import type { LanguageDifficultyBand } from '@/lib/languages';
import type { AppGameId, GameMode } from '@/lib/types';

/**
 * Full arc length — compressed to 4 rounds (~15 min party session).
 * Rounds beyond 4 are encores (summary “one more round”) and reuse final-boss rules.
 */
export const TOTAL_GAME_ROUNDS = 4;

/** Free tier (F-07): Echo + Regular + up to 3 players, 3 rounds without session pass. */
export const FREE_TIER_ROUNDS = 3;
export const FREE_TIER_MAX_PLAYERS = 3;
export const PAID_TIER_MAX_PLAYERS = 8;

export type RoundStage = {
  headline: string;
  tagline: string;
  /** Short tier label for UI (e.g. “Tier 3 · Phrase gym”). */
  tierBadge: string;
  /** Language pools to draw from this round */
  languageBands: LanguageDifficultyBand[];
  phraseMinWords: number;
  phraseMaxWords: number;
};

/** Regular mode: compressed 4-round climb — easy in, peak chaos out. */
export function regularRoundStage(roundIndex1Based: number): RoundStage {
  switch (roundIndex1Based) {
    case 1:
      return {
        headline: 'Round 1 · Warm-up',
        tagline: 'Short phrases, friendly languages — wake up the room.',
        tierBadge: 'Warm-up',
        languageBands: ['easy'],
        phraseMinWords: 3,
        phraseMaxWords: 5,
      };
    case 2:
      return {
        headline: 'Round 2 · Heating up',
        tagline: 'Trickier languages join the party.',
        tierBadge: 'Heating up',
        languageBands: ['easy', 'moderate'],
        phraseMinWords: 4,
        phraseMaxWords: 6,
      };
    case 3:
      return {
        headline: 'Round 3 · Full spice',
        tagline: 'Longer lines, harder tongues — chaos is the point now.',
        tierBadge: 'Full spice',
        languageBands: ['moderate', 'hard'],
        phraseMinWords: 5,
        phraseMaxWords: 7,
      };
    case 4:
      return {
        headline: 'Round 4 · Final boss',
        tagline: 'Hardest languages, longest lines — close the night loud.',
        tierBadge: 'Final boss',
        languageBands: ['hard'],
        phraseMinWords: 6,
        phraseMaxWords: 9,
      };
    default:
      return {
        headline: `Round ${roundIndex1Based} · Encore`,
        tagline: 'Final-boss rules — the crowd asked for more.',
        tierBadge: 'Encore',
        languageBands: ['hard'],
        phraseMinWords: 6,
        phraseMaxWords: 9,
      };
  }
}

/** Mayhem: always random heat, no micro-phrases. */
export function mayhemRoundStage(roundIndex1Based: number): RoundStage {
  return {
    headline: `Mayhem · Round ${roundIndex1Based}`,
    tagline: 'Random language, random long line — no tiny phrases, no mercy.',
    tierBadge: 'Mayhem · No brakes',
    languageBands: ['easy', 'moderate', 'hard'],
    phraseMinWords: 4,
    phraseMaxWords: 10,
  };
}

export function roundStageFor(mode: GameMode, roundIndex1Based: number): RoundStage {
  return mode === 'mayhem' ? mayhemRoundStage(roundIndex1Based) : regularRoundStage(roundIndex1Based);
}

/** Per-game tweaks: Babel Phone keeps short phrases; Reverse Audio is English-only scoring. */
export function roundStageForGame(
  appGame: AppGameId,
  mode: GameMode,
  roundIndex1Based: number,
): RoundStage {
  const base = roundStageFor(mode, roundIndex1Based);
  if (appGame === 'babel_phone') {
    return {
      ...base,
      phraseMinWords: 4,
      phraseMaxWords: 6,
    };
  }
  if (appGame === 'reverse_audio') {
    const tagline =
      mode === 'mayhem'
        ? 'English only — very short lines (4–5 words), unique clue per player, backward audio.'
        : 'English only — short backward clues (4–5 words); every player gets a fresh line in the round.';
    return {
      ...base,
      languageBands: ['easy'],
      phraseMinWords: 4,
      phraseMaxWords: 5,
      tagline,
    };
  }
  return base;
}
