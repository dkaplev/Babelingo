import type { Player } from '@/lib/types';

export type TeamTotals = { teamA: number; teamB: number };

export function computeTeamTotals(players: Player[]): TeamTotals | null {
  if (!players.some((p) => p.teamId)) return null;
  let teamA = 0;
  let teamB = 0;
  for (const p of players) {
    if (p.teamId === 'a') teamA += p.totalScore;
    if (p.teamId === 'b') teamB += p.totalScore;
  }
  return { teamA, teamB };
}
