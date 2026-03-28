import type { TurnResult } from '@/lib/types';

export function resultsForRound(results: TurnResult[], roundNumber: number): TurnResult[] {
  return results.filter((r) => r.roundNumber === roundNumber);
}

/** “Funniest” = lowest closeness (most mangled), tie-break longer reverse text. */
export function funniestResultInRound(results: TurnResult[], roundNumber: number): TurnResult | null {
  const inRound = resultsForRound(results, roundNumber);
  if (inRound.length === 0) return null;
  const sorted = [...inRound].sort(
    (a, b) => a.closenessScore - b.closenessScore || b.reverseEnglish.length - a.reverseEnglish.length,
  );
  return sorted[0] ?? null;
}

export type RoundTopScorer = { playerId: string; playerName: string; points: number };

/** Players who earned the most points in a single round (ties included). */
export function topScorersInRound(results: TurnResult[], roundNumber: number): RoundTopScorer[] {
  const inRound = resultsForRound(results, roundNumber);
  if (inRound.length === 0) return [];
  const byPlayer = new Map<string, { playerName: string; points: number }>();
  for (const r of inRound) {
    const prev = byPlayer.get(r.playerId);
    const pts = (prev?.points ?? 0) + r.totalTurnScore;
    byPlayer.set(r.playerId, { playerName: r.playerName, points: pts });
  }
  let max = 0;
  for (const v of byPlayer.values()) max = Math.max(max, v.points);
  const out: RoundTopScorer[] = [];
  for (const [playerId, v] of byPlayer.entries()) {
    if (v.points === max) out.push({ playerId, playerName: v.playerName, points: v.points });
  }
  return out;
}
