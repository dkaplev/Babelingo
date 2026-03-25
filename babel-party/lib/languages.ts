import type { LanguageTier } from '@/lib/types';

export type LanguageDef = {
  code: string;
  label: string;
  tier: LanguageTier;
  /** BCP-47 for expo-speech */
  speechLocale: string;
  /** MyMemory / generic API pair */
  myMemoryCode: string;
};

export const LANGUAGES: LanguageDef[] = [
  { code: 'es', label: 'Spanish', tier: 'easy', speechLocale: 'es-ES', myMemoryCode: 'es' },
  { code: 'it', label: 'Italian', tier: 'easy', speechLocale: 'it-IT', myMemoryCode: 'it' },
  { code: 'fr', label: 'French', tier: 'easy', speechLocale: 'fr-FR', myMemoryCode: 'fr' },
  { code: 'de', label: 'German', tier: 'medium', speechLocale: 'de-DE', myMemoryCode: 'de' },
  { code: 'el', label: 'Greek', tier: 'medium', speechLocale: 'el-GR', myMemoryCode: 'el' },
  { code: 'tr', label: 'Turkish', tier: 'medium', speechLocale: 'tr-TR', myMemoryCode: 'tr' },
  { code: 'ja', label: 'Japanese', tier: 'chaos', speechLocale: 'ja-JP', myMemoryCode: 'ja' },
  { code: 'ar', label: 'Arabic', tier: 'chaos', speechLocale: 'ar-SA', myMemoryCode: 'ar' },
  { code: 'hi', label: 'Hindi', tier: 'chaos', speechLocale: 'hi-IN', myMemoryCode: 'hi' },
];

export function languageByCode(code: string): LanguageDef | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

export function defaultLanguagePool(): string[] {
  return LANGUAGES.map((l) => l.code);
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
