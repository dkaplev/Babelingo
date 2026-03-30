import type { LanguageDifficultyBand } from '@/lib/languages';
import type { AppGameId, GameMode } from '@/lib/types';

/** Full arc length (rounds 1–7 scripted; round 7+ reuses “all-out” rules if extended later). */
export const TOTAL_GAME_ROUNDS = 7;

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

/** Regular mode: curated climb — language heat + phrase length. */
export function regularRoundStage(roundIndex1Based: number): RoundStage {
  switch (roundIndex1Based) {
    case 1:
      return {
        headline: 'Round 1 · Warm-up',
        tagline: 'Short phrases, friendly languages — wake up the room.',
        tierBadge: 'Tier 1 · Tourist tracks',
        languageBands: ['easy'],
        phraseMinWords: 3,
        phraseMaxWords: 5,
      };
    case 2:
      return {
        headline: 'Round 2 · Spicier tongues',
        tagline: 'Still compact lines — but the languages bite back a little.',
        tierBadge: 'Tier 2 · Border crossing',
        languageBands: ['moderate'],
        phraseMinWords: 3,
        phraseMaxWords: 5,
      };
    case 3:
      return {
        headline: 'Round 3 · Stretch mode',
        tagline: 'Easier languages, longer phrases — more syllables to juggle.',
        tierBadge: 'Tier 3 · Phrase gym',
        languageBands: ['easy'],
        phraseMinWords: 6,
        phraseMaxWords: 7,
      };
    case 4:
      return {
        headline: 'Round 4 · Double stack',
        tagline: 'Longer phrases meet trickier languages. Stack the chaos.',
        tierBadge: 'Tier 4 · Double decker',
        languageBands: ['moderate'],
        phraseMinWords: 6,
        phraseMaxWords: 7,
      };
    case 5:
      return {
        headline: 'Round 5 · World-stage heat',
        tagline: 'Hardest languages — we keep the phrase shorter so you can focus.',
        tierBadge: 'Tier 5 · World stage',
        languageBands: ['hard'],
        phraseMinWords: 3,
        phraseMaxWords: 5,
      };
    case 6:
      return {
        headline: 'Round 6 · Boss wave',
        tagline: 'Maximum heat: tough languages and long phrases together.',
        tierBadge: 'Tier 6 · Boss wave',
        languageBands: ['hard'],
        phraseMinWords: 6,
        phraseMaxWords: 7,
      };
    case 7:
      return {
        headline: 'Round 7 · Final boss',
        tagline: 'Hardest languages only, longest lines — peak chaos to close the night.',
        tierBadge: 'Tier 7 · Maximum heat',
        languageBands: ['hard'],
        phraseMinWords: 7,
        phraseMaxWords: 10,
      };
    default:
      return {
        headline: `Round ${roundIndex1Based} · Encore`,
        tagline: 'Same final-boss rules — hardest pool, long phrases.',
        tierBadge: `Tier ${roundIndex1Based} · Encore`,
        languageBands: ['hard'],
        phraseMinWords: 7,
        phraseMaxWords: 10,
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
        ? 'English only — backward audio, random phrase lengths each round.'
        : 'English only — you hear the line backward, then untangle it forward.';
    return {
      ...base,
      languageBands: ['easy'],
      phraseMinWords: 4,
      phraseMaxWords: 6,
      tagline,
    };
  }
  return base;
}
