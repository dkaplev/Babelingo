import { getPartyPalette, type PartyPalette } from '@/lib/partyPalette';
import { useGameStore } from '@/lib/gameStore';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

const GameThemeContext = createContext<PartyPalette | null>(null);

export function GameThemeProvider({ children }: { children: ReactNode }) {
  const appGame = useGameStore((s) => s.settings.appGame);
  const palette = useMemo(() => getPartyPalette(appGame), [appGame]);
  return <GameThemeContext.Provider value={palette}>{children}</GameThemeContext.Provider>;
}

export function usePartyPalette(): PartyPalette {
  const ctx = useContext(GameThemeContext);
  if (ctx) return ctx;
  return getPartyPalette('echo_translator');
}
