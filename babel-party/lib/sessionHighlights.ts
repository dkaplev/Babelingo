import type { TurnResult } from '@/lib/types';

export function resultsForRound(results: TurnResult[], roundNumber: number): TurnResult[] {
  return results.filter((r) => r.roundNumber === roundNumber);
}

/** First English seed phrase for the round (Echo: shared line; Reverse: first player’s line only — prefer `reverseAnswerLinesForRound` for Reverse). */
export function roundSeedPhrase(results: TurnResult[], roundNumber: number): string | null {
  const inRound = resultsForRound(results, roundNumber);
  if (inRound.length === 0) return null;
  const sorted = [...inRound].sort((a, b) => a.turnOrderInRound - b.turnOrderInRound);
  const text = sorted[0]?.phraseOriginal?.trim();
  return text || null;
}

/** Reverse Audio: each turn has its own target line — ordered by play order for scoreboard reveal. */
export function reverseAnswerLinesForRound(
  results: TurnResult[],
  roundNumber: number,
): { playerName: string; phrase: string }[] {
  const inRound = resultsForRound(results, roundNumber).sort(
    (a, b) => a.turnOrderInRound - b.turnOrderInRound,
  );
  return inRound.map((r) => ({
    playerName: r.playerName,
    phrase: r.phraseOriginal.trim(),
  }));
}

/** Babel Phone: ordered English mutations for the round (seed → each player’s echo-back). */
export function babelEnglishChainForRound(results: TurnResult[], roundNumber: number): string[] {
  const inRound = resultsForRound(results, roundNumber).sort(
    (a, b) => a.turnOrderInRound - b.turnOrderInRound,
  );
  if (inRound.length === 0) return [];
  const withDisplay = inRound.find((r) => r.babelDisplayChain && r.babelDisplayChain.length > 1);
  if (withDisplay?.babelDisplayChain) return withDisplay.babelDisplayChain;
  const chain: string[] = [inRound[0]!.phraseOriginal];
  for (const r of inRound) chain.push(r.reverseEnglish.trim());
  return chain;
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
