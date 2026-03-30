import type { LanguageTier } from '@/lib/types';

/** Three bands for progression + scoring: +0 / +1 / +2 language bonus. */
export type LanguageDifficultyBand = 'easy' | 'moderate' | 'hard';

export type LanguageDef = {
  code: string;
  label: string;
  tier: LanguageTier;
  difficultyBand: LanguageDifficultyBand;
  /** BCP-47 for expo-speech and Google TTS */
  speechLocale: string;
  /** MyMemory / generic API pair */
  myMemoryCode: string;
};

/**
 * Pool used in play — every entry must have a matching STT_LOCALE + TTS voice on the pipeline server
 * (see babel-party-server/index.mjs).
 */
export const LANGUAGES: LanguageDef[] = [
  { code: 'en', label: 'English', tier: 'easy', difficultyBand: 'easy', speechLocale: 'en-US', myMemoryCode: 'en' },
  { code: 'es', label: 'Spanish', tier: 'easy', difficultyBand: 'easy', speechLocale: 'es-ES', myMemoryCode: 'es' },
  { code: 'it', label: 'Italian', tier: 'easy', difficultyBand: 'easy', speechLocale: 'it-IT', myMemoryCode: 'it' },
  { code: 'fr', label: 'French', tier: 'easy', difficultyBand: 'easy', speechLocale: 'fr-FR', myMemoryCode: 'fr' },
  { code: 'de', label: 'German', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'de-DE', myMemoryCode: 'de' },
  { code: 'nl', label: 'Dutch', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'nl-NL', myMemoryCode: 'nl' },
  { code: 'pt', label: 'Portuguese', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'pt-BR', myMemoryCode: 'pt' },
  { code: 'sv', label: 'Swedish', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'sv-SE', myMemoryCode: 'sv' },
  { code: 'da', label: 'Danish', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'da-DK', myMemoryCode: 'da' },
  { code: 'no', label: 'Norwegian', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'nb-NO', myMemoryCode: 'no' },
  { code: 'fi', label: 'Finnish', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'fi-FI', myMemoryCode: 'fi' },
  { code: 'pl', label: 'Polish', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'pl-PL', myMemoryCode: 'pl' },
  { code: 'cs', label: 'Czech', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'cs-CZ', myMemoryCode: 'cs' },
  { code: 'sk', label: 'Slovak', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'sk-SK', myMemoryCode: 'sk' },
  { code: 'hu', label: 'Hungarian', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'hu-HU', myMemoryCode: 'hu' },
  { code: 'ro', label: 'Romanian', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'ro-RO', myMemoryCode: 'ro' },
  { code: 'el', label: 'Greek', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'el-GR', myMemoryCode: 'el' },
  { code: 'tr', label: 'Turkish', tier: 'medium', difficultyBand: 'moderate', speechLocale: 'tr-TR', myMemoryCode: 'tr' },
  { code: 'uk', label: 'Ukrainian', tier: 'chaos', difficultyBand: 'hard', speechLocale: 'uk-UA', myMemoryCode: 'uk' },
  { code: 'he', label: 'Hebrew', tier: 'chaos', difficultyBand: 'hard', speechLocale: 'he-IL', myMemoryCode: 'he' },
  { code: 'ja', label: 'Japanese', tier: 'chaos', difficultyBand: 'hard', speechLocale: 'ja-JP', myMemoryCode: 'ja' },
  { code: 'ko', label: 'Korean', tier: 'chaos', difficultyBand: 'hard', speechLocale: 'ko-KR', myMemoryCode: 'ko' },
  { code: 'ar', label: 'Arabic', tier: 'chaos', difficultyBand: 'hard', speechLocale: 'ar-SA', myMemoryCode: 'ar' },
  { code: 'hi', label: 'Hindi', tier: 'chaos', difficultyBand: 'hard', speechLocale: 'hi-IN', myMemoryCode: 'hi' },
  { code: 'id', label: 'Indonesian', tier: 'chaos', difficultyBand: 'hard', speechLocale: 'id-ID', myMemoryCode: 'id' },
  { code: 'vi', label: 'Vietnamese', tier: 'chaos', difficultyBand: 'hard', speechLocale: 'vi-VN', myMemoryCode: 'vi' },
  { code: 'th', label: 'Thai', tier: 'chaos', difficultyBand: 'hard', speechLocale: 'th-TH', myMemoryCode: 'th' },
];

export function languageByCode(code: string): LanguageDef | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

export function defaultLanguagePool(): string[] {
  return LANGUAGES.map((l) => l.code);
}

/** Echo Translator: English is never the “foreign” clue language. */
export function excludeEnglishFromPool(codes: string[]): string[] {
  const filtered = codes.filter((c) => c !== 'en');
  if (filtered.length > 0) return filtered;
  return LANGUAGES.filter((l) => l.code !== 'en').map((l) => l.code);
}

export function languageCodesForBands(bands: LanguageDifficultyBand[]): string[] {
  const set = new Set<LanguageDifficultyBand>(bands);
  return LANGUAGES.filter((l) => set.has(l.difficultyBand)).map((l) => l.code);
}

export function filterLanguagesForPreset(
  codes: string[],
  preset: 'chill' | 'spicy' | 'chaos',
): string[] {
  const set = new Set(codes);
  const tierOk = (tier: LanguageTier) => {
    if (preset === 'chill') return tier === 'easy';
    if (preset === 'spicy') return tier === 'easy' || tier === 'medium';
    return true;
  };
  return LANGUAGES.filter((l) => set.has(l.code) && tierOk(l.tier)).map((l) => l.code);
}
