import type { LanguageDifficultyBand } from '@/lib/languages';
import type { LanguageTier } from '@/lib/types';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

function tokenJaccard(a: string, b: string): number {
  const A = new Set(normalize(a).split(' '));
  const B = new Set(normalize(b).split(' '));
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** 0 unrelated .. 3 very close */
export function closenessFromTexts(original: string, reverseEnglish: string): 0 | 1 | 2 | 3 {
  const o = normalize(original);
  const r = normalize(reverseEnglish);
  if (!r.length) return 0;
  const jac = tokenJaccard(o, r);
  if (jac >= 0.55) return 3;
  if (jac >= 0.35) return 2;
  if (jac >= 0.15) return 1;
  return 0;
}

/** Language bonus by progression band: easy +0, moderate +1, hard +2. */
export function languageBonusFromBand(band: LanguageDifficultyBand): 0 | 1 | 2 {
  if (band === 'easy') return 0;
  if (band === 'moderate') return 1;
  return 2;
}

/** @deprecated Prefer languageBonusFromBand; kept for older call sites. */
export function languageBonusPoints(tier: LanguageTier): 0 | 1 {
  return tier === 'medium' || tier === 'chaos' ? 1 : 0;
}

const LABELS_GOOD = ['Chef’s kiss', 'Uncanny valley', 'Actually coherent?!', 'Babel who?'];
const LABELS_MID = ['Beautiful chaos', 'Telephone damage', 'Accent unknown object', 'Spirit was there'];
const LABELS_BAD = ['Full moon howl energy', 'The spirits are confused', 'Legendary nonsense', 'New language just dropped'];

export function funnyLabel(closeness: 0 | 1 | 2 | 3): string {
  const pool = closeness >= 2 ? LABELS_GOOD : closeness === 1 ? LABELS_MID : LABELS_BAD;
  return pool[Math.floor(Math.random() * pool.length)]!;
}
