import {
  FREE_TIER_MAX_PLAYERS,
  FREE_TIER_ROUNDS,
  PAID_TIER_MAX_PLAYERS,
  TOTAL_GAME_ROUNDS,
} from '@/lib/progression';
import { create } from 'zustand';

export const SESSION_PASS_PRODUCT_ID = 'com.babelingo.app.session_pass';

type State = {
  /** Unlocks all modes, Mayhem, up to 8 players, full 7 rounds for this app session (memory only). */
  sessionPassActive: boolean;
  paywallVariant: string;
  setSessionPassActive: (v: boolean) => void;
  setPaywallVariant: (v: string) => void;
};

export const useSessionEntitlementsStore = create<State>((set) => ({
  sessionPassActive: false,
  paywallVariant: 'default',
  setSessionPassActive: (v) => set({ sessionPassActive: v }),
  setPaywallVariant: (v) => set({ paywallVariant: v }),
}));

export function effectiveMaxPlayers(passActive: boolean): number {
  return passActive ? PAID_TIER_MAX_PLAYERS : FREE_TIER_MAX_PLAYERS;
}

export function effectiveTotalRounds(passActive: boolean): number {
  return passActive ? TOTAL_GAME_ROUNDS : FREE_TIER_ROUNDS;
}
