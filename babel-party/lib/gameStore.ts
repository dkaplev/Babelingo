import {
  defaultLanguagePool,
  excludeEnglishFromPool,
  languageCodesForBands,
  type LanguageDifficultyBand,
} from '@/lib/languages';
import { PLAYBACK_SPEED_DEFAULT } from '@/lib/playbackSpeed';
import { pickPhraseForWordRange } from '@/lib/phrases';
import { roundStageForGame, type RoundStage, TOTAL_GAME_ROUNDS } from '@/lib/progression';
import type { Phrase, Player, RoomSettings, TurnResult } from '@/lib/types';
import { create } from 'zustand';

/** Max foreign phrase replays per turn. */
export const MAX_PHRASE_PLAYS = 3;

type SessionPhase =
  | 'idle'
  | 'lobby'
  | 'instructions'
  | 'round_intro'
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
  /** Per-turn language for the current round, same order as turns (playerOrder indices). */
  roundLanguages: string[];
  /** Phrase for each turn; repeats when a language is reused get a fresh phrase. */
  roundPhrases: Phrase[];
  /** Reverse Audio: 1 = record backward guess after hearing target; 2 = record final English after hearing guess reversed. */
  reverseStep: 1 | 2;
  reverseGuessUri: string | null;
};

const defaultSettings = (): RoomSettings => ({
  playerCount: 4,
  teamsEnabled: false,
  rounds: TOTAL_GAME_ROUNDS,
  gameMode: 'regular',
  appGame: 'echo_translator',
  difficulty: 'chaos',
  category: 'mixed',
  languageCodes: defaultLanguagePool(),
  playbackSpeed: PLAYBACK_SPEED_DEFAULT,
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function languageHistoryFromResults(results: TurnResult[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  for (const r of results) {
    let set = m.get(r.playerId);
    if (!set) {
      set = new Set();
      m.set(r.playerId, set);
    }
    set.add(r.languageCode);
  }
  return m;
}

/**
 * Pick one language per player in turn order for this round.
 * Prefer: not used by that player in earlier rounds, and not already taken this round.
 * Relax in stages when the pool is too small — see inline comments.
 */
function assignLanguagesForRound(pool: string[], playerOrder: string[], history: Map<string, Set<string>>): string[] {
  if (playerOrder.length === 0) return [];
  const shuffledPool = shuffle([...pool]);
  const takenThisRound = new Set<string>();
  const out: string[] = [];

  for (const playerId of playerOrder) {
    const usedBefore = history.get(playerId) ?? new Set<string>();
    let candidates = shuffledPool.filter((l) => !usedBefore.has(l) && !takenThisRound.has(l));
    if (candidates.length === 0) {
      candidates = shuffledPool.filter((l) => !usedBefore.has(l));
    }
    if (candidates.length === 0) {
      candidates = shuffledPool.filter((l) => !takenThisRound.has(l));
    }
    if (candidates.length === 0) {
      candidates = [...shuffledPool];
    }
    const lang = candidates[Math.floor(Math.random() * candidates.length)]!;
    out.push(lang);
    takenThisRound.add(lang);
  }
  return out;
}

/** First time each language appears in the round shares one phrase; later repeats get a new random phrase. */
function buildRoundPhrasesForStage(roundLanguages: string[], stage: RoundStage): Phrase[] {
  if (!roundLanguages.length) return [];
  const base = pickPhraseForWordRange('mixed', stage.phraseMinWords, stage.phraseMaxWords);
  const phrases: Phrase[] = [];
  const seenLang = new Set<string>();
  for (const lang of roundLanguages) {
    if (seenLang.has(lang)) {
      phrases.push(pickPhraseForWordRange('mixed', stage.phraseMinWords, stage.phraseMaxWords));
    } else {
      seenLang.add(lang);
      phrases.push(base);
    }
  }
  return phrases;
}

export const useGameStore = create<
  GameState & {
    resetSession: () => void;
    updateSettings: (partial: Partial<RoomSettings>) => void;
    setPlayerNames: (names: string[]) => void;
    startFromLobby: () => void;
    /** One atomic update: players + order + instructions phase (avoids empty order between two sets). */
    startSessionFromLobby: (names: string[]) => void;
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
    resetReverseTurn: () => void;
    commitReverseGuess: (uri: string) => void;
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
  roundLanguages: [],
  roundPhrases: [],
  reverseStep: 1,
  reverseGuessUri: null,

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
      roundLanguages: [],
      roundPhrases: [],
      reverseStep: 1,
      reverseGuessUri: null,
    }),

  resetReverseTurn: () =>
    set({
      reverseStep: 1,
      reverseGuessUri: null,
      listensRemaining: MAX_PHRASE_PLAYS,
      pendingRecordingUri: null,
    }),

  commitReverseGuess: (uri) =>
    set({
      reverseGuessUri: uri,
      reverseStep: 2,
      listensRemaining: MAX_PHRASE_PLAYS,
      pendingRecordingUri: null,
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
    const { players } = get();
    const order = shuffle(players.map((p) => p.id));
    set({
      phase: 'round_intro',
      currentRound: 1,
      turnIndex: 0,
      playerOrder: order,
      listensRemaining: MAX_PHRASE_PLAYS,
      lastResult: null,
      pendingRecordingUri: null,
      results: [],
      funnyVotePending: false,
      roundLanguages: [],
      roundPhrases: [],
      roundPhrase: null,
      currentLanguageCode: null,
      translatedText: null,
      reverseStep: 1,
      reverseGuessUri: null,
    });
  },

  startSessionFromLobby: (names) => {
    const { settings } = get();
    const teamsEnabled = settings.teamsEnabled;
    const players: Player[] = names.map((name, i) => ({
      id: `p${i}`,
      name: name.trim() || `Player ${i + 1}`,
      teamId: teamsEnabled ? (i % 2 === 0 ? 'a' : 'b') : null,
      totalScore: 0,
    }));
    const order = shuffle(players.map((p) => p.id));
    set({
      players,
      phase: 'round_intro',
      currentRound: 1,
      turnIndex: 0,
      playerOrder: order,
      listensRemaining: MAX_PHRASE_PLAYS,
      lastResult: null,
      pendingRecordingUri: null,
      results: [],
      funnyVotePending: false,
      roundLanguages: [],
      roundPhrases: [],
      roundPhrase: null,
      currentLanguageCode: null,
      translatedText: null,
      reverseStep: 1,
      reverseGuessUri: null,
    });
  },

  beginRound: () => {
    const { settings } = get();
    let { playerOrder, currentRound, results, players } = get();
    if (playerOrder.length === 0 && players.length > 0) {
      playerOrder = shuffle(players.map((p) => p.id));
    }
    if (playerOrder.length === 0) return;
    const appGame = settings.appGame;
    const stage = roundStageForGame(appGame, settings.gameMode, currentRound);
    const order = currentRound === 1 ? playerOrder : shuffle(playerOrder);
    const history = languageHistoryFromResults(results);
    let codes: string[];
    if (appGame === 'reverse_audio') {
      codes = ['en'];
    } else if (settings.gameMode === 'mayhem') {
      const mayhemBands: LanguageDifficultyBand[] = ['easy', 'moderate', 'hard'];
      const band = mayhemBands[Math.floor(Math.random() * mayhemBands.length)]!;
      codes = languageCodesForBands([band]);
      if (codes.length === 0) codes = defaultLanguagePool();
    } else {
      codes = languageCodesForBands(stage.languageBands);
      if (codes.length === 0) codes = defaultLanguagePool();
    }
    if (appGame === 'echo_translator') {
      codes = excludeEnglishFromPool(codes);
    }
    let roundLanguages: string[];
    let roundPhrases: Phrase[];
    if (appGame === 'reverse_audio') {
      const phrase = pickPhraseForWordRange('mixed', stage.phraseMinWords, stage.phraseMaxWords);
      roundLanguages = order.map(() => 'en');
      roundPhrases = order.map(() => phrase);
    } else {
      roundLanguages = assignLanguagesForRound(codes, order, history);
      if (appGame === 'babel_phone') {
        const seed = pickPhraseForWordRange('mixed', stage.phraseMinWords, stage.phraseMaxWords);
        roundPhrases = order.map(() => seed);
      } else {
        roundPhrases = buildRoundPhrasesForStage(roundLanguages, stage);
      }
    }
    set({
      phase: 'turn',
      roundPhrase: roundPhrases[0] ?? null,
      turnIndex: 0,
      listensRemaining: MAX_PHRASE_PLAYS,
      currentLanguageCode: roundLanguages[0] ?? codes[0]!,
      translatedText: null,
      pendingRecordingUri: null,
      lastResult: null,
      funnyVotePending: false,
      playerOrder: order,
      roundLanguages,
      roundPhrases,
      reverseStep: 1,
      reverseGuessUri: null,
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
    const { currentLanguageCode, roundLanguages, turnIndex } = get();
    const fromRound = roundLanguages[turnIndex];
    if (fromRound) return fromRound;
    const codes = defaultLanguagePool();
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
    const { turnIndex, playerOrder, roundLanguages, roundPhrases, settings, lastResult, roundPhrase } = get();
    if (turnIndex + 1 < playerOrder.length) {
      const codes = defaultLanguagePool();
      const nextLang =
        roundLanguages[turnIndex + 1] ?? codes[Math.floor(Math.random() * codes.length)]!;
      let nextPhrase: Phrase | null;
      if (settings.appGame === 'babel_phone' && lastResult?.reverseEnglish?.trim() && roundPhrase) {
        nextPhrase = { ...roundPhrase, text: lastResult.reverseEnglish.trim() };
      } else {
        nextPhrase = roundPhrases[turnIndex + 1] ?? null;
      }
      set({
        turnIndex: turnIndex + 1,
        listensRemaining: MAX_PHRASE_PLAYS,
        currentLanguageCode: nextLang,
        roundPhrase: nextPhrase,
        translatedText: null,
        pendingRecordingUri: null,
        lastResult: null,
        phase: 'turn',
        funnyVotePending: false,
        reverseStep: 1,
        reverseGuessUri: null,
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
      phase: 'round_intro',
    });
  },
}));

export function currentPlayer(store: GameState): Player | null {
  const id = store.playerOrder[store.turnIndex];
  return store.players.find((p) => p.id === id) ?? null;
}
