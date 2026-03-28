import type { LanguageDifficultyBand } from '@/lib/languages';
import type { GameMode } from '@/lib/types';

/** Full arc length (rounds 1–7 scripted; round 7+ reuses “all-out” rules if extended later). */
export const TOTAL_GAME_ROUNDS = 7;

export type RoundStage = {
  headline: string;
  tagline: string;
  /** Language pools to draw from this round */
  languageBands: LanguageDifficultyBand[];
  phraseMinWords: number;
  phraseMaxWords: number;
};

/** Regular mode: curated climb — language heat + phrase length. */
export function regularRoundStage(roundIndex1Based: number): RoundStage {
  switch (roundIndex1Based) {
    case 1:
      return {
        headline: 'Round 1 · Warm-up',
        tagline: 'Short phrases, friendly languages — wake up the room.',
        languageBands: ['easy'],
        phraseMinWords: 3,
        phraseMaxWords: 5,
      };
    case 2:
      return {
        headline: 'Round 2 · Spicier tongues',
        tagline: 'Still compact lines — but the languages bite back a little.',
        languageBands: ['moderate'],
        phraseMinWords: 3,
        phraseMaxWords: 5,
      };
    case 3:
      return {
        headline: 'Round 3 · Stretch mode',
        tagline: 'Easier languages, longer phrases — more syllables to juggle.',
        languageBands: ['easy'],
        phraseMinWords: 6,
        phraseMaxWords: 7,
      };
    case 4:
      return {
        headline: 'Round 4 · Double stack',
        tagline: 'Longer phrases meet trickier languages. Stack the chaos.',
        languageBands: ['moderate'],
        phraseMinWords: 6,
        phraseMaxWords: 7,
      };
    case 5:
      return {
        headline: 'Round 5 · World-stage heat',
        tagline: 'Hardest languages — we keep the phrase shorter so you can focus.',
        languageBands: ['hard'],
        phraseMinWords: 3,
        phraseMaxWords: 5,
      };
    case 6:
      return {
        headline: 'Round 6 · Boss wave',
        tagline: 'Maximum heat: tough languages and long phrases together.',
        languageBands: ['hard'],
        phraseMinWords: 6,
        phraseMaxWords: 7,
      };
    case 7:
    default:
      return {
        headline:
          roundIndex1Based === 7 ? 'Round 7 · All-out babel' : `Round ${roundIndex1Based} · Encore`,
        tagline: 'Every language in the deck, wild phrase lengths — pure party energy.',
        languageBands: ['easy', 'moderate', 'hard'],
        phraseMinWords: 4,
        phraseMaxWords: 10,
      };
  }
}

/** Mayhem: always random heat, no micro-phrases. */
export function mayhemRoundStage(_roundIndex1Based: number): RoundStage {
  return {
    headline: 'Mayhem round',
    tagline: 'Random language, random long line — no tiny phrases, no mercy.',
    languageBands: ['easy', 'moderate', 'hard'],
    phraseMinWords: 4,
    phraseMaxWords: 10,
  };
}

export function roundStageFor(mode: GameMode, roundIndex1Based: number): RoundStage {
  return mode === 'mayhem' ? mayhemRoundStage(roundIndex1Based) : regularRoundStage(roundIndex1Based);
}
