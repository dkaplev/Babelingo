/** Client-side chaos fallback when the pipeline omits `chaosScore` (offline / older server). Mirrors server Jaccard heuristic. */

function tokenize(s: string): string[] {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function estimateChaosFromTexts(originalEnglish: string, reverseEnglish: string): number {
  const t1 = tokenize(originalEnglish);
  const t2 = tokenize(reverseEnglish);
  const set1 = new Set(t1);
  const set2 = new Set(t2);
  let inter = 0;
  for (const w of set1) if (set2.has(w)) inter += 1;
  const union = new Set([...set1, ...set2]).size || 1;
  const jaccard = inter / union;
  let chaos = Math.round((1 - jaccard) * 100);
  const w1 = t1.length;
  const w2 = t2.length;
  const maxw = Math.max(w1, w2, 1);
  if (Math.abs(w1 - w2) / maxw > 0.5) chaos += 10;
  return Math.min(99, Math.max(0, chaos));
}

export type ChaosTierLabel = 'Decent' | 'Twisted' | 'Pure Chaos';

export function chaosTierLabel(score: number): ChaosTierLabel {
  if (score <= 30) return 'Decent';
  if (score <= 60) return 'Twisted';
  return 'Pure Chaos';
}
