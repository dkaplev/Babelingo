import { filterLanguagesForPreset } from '@/lib/languages';
import { pickPhrase } from '@/lib/phrases';
import type { Phrase, Player, RoomSettings, TurnResult } from '@/lib/types';
import { create } from 'zustand';

/** Max foreign phrase replays per turn; difficulty does not change this. */
export const MAX_PHRASE_PLAYS = 3;

type SessionPhase =
  | 'idle'
  | 'lobby'
  | 'instructions'
  | 'turn'
  | 'processing'
  | 'reveal'
  | 'scoreboard'
  | 'summary';

type GameState = {
  settings: RoomSettings;
  players: Player[];
  phase: SessionPhase;
  currentRound: number;
  /** Index into shuffled player order for this round */
  turnIndex: number;
  playerOrder: string[];
  roundPhrase: Phrase | null;
  listensRemaining: number;
  currentLanguageCode: string | null;
  translatedText: string | null;
  pendingRecordingUri: string | null;
  lastResult: TurnResult | null;
  results: TurnResult[];
  funnyVotePending: boolean;
};

const defaultSettings = (): RoomSettings => ({
  playerCount: 4,
  teamsEnabled: false,
  rounds: 3,
  difficulty: 'spicy',
  category: 'mixed',
  languageCodes: ['es', 'it', 'fr', 'de', 'el', 'tr', 'ja', 'ar', 'hi'],
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export const useGameStore = create<
  GameState & {
    resetSession: () => void;
    updateSettings: (partial: Partial<RoomSettings>) => void;
    setPlayerNames: (names: string[]) => void;
    startFromLobby: () => void;
    beginRound: () => void;
    nextListenConsumed: () => void;
    skipExtraPhrasePlays: () => void;
    setTranslation: (text: string, languageCode: string) => void;
    setRecordingUri: (uri: string | null) => void;
    setPhase: (p: SessionPhase) => void;
    commitTurnResult: (r: TurnResult) => void;
    grantFunnyBonus: () => void;
    advanceAfterReveal: () => void;
    goScoreboardToNext: () => void;
    pickLanguageForCurrentTurn: () => string;
  }
>((set, get) => ({
  settings: defaultSettings(),
  players: [],
  phase: 'idle',
  currentRound: 0,
  turnIndex: 0,
  playerOrder: [],
  roundPhrase: null,
  listensRemaining: MAX_PHRASE_PLAYS,
  currentLanguageCode: null,
  translatedText: null,
  pendingRecordingUri: null,
  lastResult: null,
  results: [],
  funnyVotePending: false,

  resetSession: () =>
    set({
      settings: defaultSettings(),
      players: [],
      phase: 'idle',
      currentRound: 0,
      turnIndex: 0,
      playerOrder: [],
      roundPhrase: null,
      listensRemaining: MAX_PHRASE_PLAYS,
      currentLanguageCode: null,
      translatedText: null,
      pendingRecordingUri: null,
      lastResult: null,
      results: [],
      funnyVotePending: false,
    }),

  updateSettings: (partial) =>
    set((s) => ({
      settings: { ...s.settings, ...partial },
    })),

  setPlayerNames: (names) => {
    const { settings } = get();
    const teamsEnabled = settings.teamsEnabled;
    const players: Player[] = names.map((name, i) => ({
      id: `p${i}`,
      name: name.trim() || `Player ${i + 1}`,
      teamId: teamsEnabled ? (i % 2 === 0 ? 'a' : 'b') : null,
      totalScore: 0,
    }));
    set({ players });
  },

  startFromLobby: () => {
    const { players, settings } = get();
    const order = shuffle(players.map((p) => p.id));
    set({
      phase: 'instructions',
      currentRound: 1,
      turnIndex: 0,
      playerOrder: order,
      listensRemaining: MAX_PHRASE_PLAYS,
      lastResult: null,
      pendingRecordingUri: null,
    });
  },

  beginRound: () => {
    const { settings, playerOrder, currentRound } = get();
    const pool = filterLanguagesForPreset(settings.languageCodes, settings.difficulty);
    const codes = pool.length ? pool : settings.languageCodes;
    const phrase = pickPhrase(settings.category);
    set({
      phase: 'turn',
      roundPhrase: phrase,
      turnIndex: 0,
      listensRemaining: MAX_PHRASE_PLAYS,
      currentLanguageCode: codes[Math.floor(Math.random() * codes.length)]!,
      translatedText: null,
      pendingRecordingUri: null,
      lastResult: null,
      funnyVotePending: false,
      playerOrder: currentRound === 1 ? playerOrder : shuffle(playerOrder),
    });
  },

  nextListenConsumed: () =>
    set((s) => ({
      listensRemaining: Math.max(0, s.listensRemaining - 1),
    })),

  skipExtraPhrasePlays: () => set({ listensRemaining: 0 }),

  setTranslation: (text, languageCode) =>
    set({ translatedText: text, currentLanguageCode: languageCode }),

  setRecordingUri: (uri) => set({ pendingRecordingUri: uri }),

  setPhase: (p) => set({ phase: p }),

  pickLanguageForCurrentTurn: () => {
    const { settings, currentLanguageCode } = get();
    const pool = filterLanguagesForPreset(settings.languageCodes, settings.difficulty);
    const codes = pool.length ? pool : settings.languageCodes;
    if (currentLanguageCode && codes.includes(currentLanguageCode)) return currentLanguageCode;
    return codes[Math.floor(Math.random() * codes.length)]!;
  },

  commitTurnResult: (r) =>
    set((s) => {
      const players = s.players.map((p) =>
        p.id === r.playerId ? { ...p, totalScore: p.totalScore + r.totalTurnScore } : p,
      );
      return {
        lastResult: r,
        results: [...s.results, r],
        players,
        funnyVotePending: true,
      };
    }),

  grantFunnyBonus: () =>
    set((s) => {
      if (!s.lastResult || !s.funnyVotePending) return s;
      const bonus = 1;
      const updated: TurnResult = {
        ...s.lastResult,
        funnyVoteBonus: 1,
        totalTurnScore: s.lastResult.totalTurnScore + bonus,
      };
      const players = s.players.map((p) =>
        p.id === updated.playerId ? { ...p, totalScore: p.totalScore + bonus } : p,
      );
      const results =
        s.results.length > 0 ? [...s.results.slice(0, -1), updated] : [updated];
      return {
        lastResult: updated,
        results,
        players,
        funnyVotePending: false,
      };
    }),

  advanceAfterReveal: () => {
    const { turnIndex, playerOrder, currentRound, settings } = get();
    if (turnIndex + 1 < playerOrder.length) {
      const pool = filterLanguagesForPreset(settings.languageCodes, settings.difficulty);
      const codes = pool.length ? pool : settings.languageCodes;
      set({
        turnIndex: turnIndex + 1,
        listensRemaining: MAX_PHRASE_PLAYS,
        currentLanguageCode: codes[Math.floor(Math.random() * codes.length)]!,
        translatedText: null,
        pendingRecordingUri: null,
        lastResult: null,
        phase: 'turn',
        funnyVotePending: false,
      });
      return;
    }
    set({ phase: 'scoreboard' });
  },

  goScoreboardToNext: () => {
    const { currentRound, settings } = get();
    if (currentRound >= settings.rounds) {
      set({ phase: 'summary' });
      return;
    }
    set({
      currentRound: currentRound + 1,
    });
    get().beginRound();
  },
}));

export function currentPlayer(store: GameState): Player | null {
  const id = store.playerOrder[store.turnIndex];
  return store.players.find((p) => p.id === id) ?? null;
}
