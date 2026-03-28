export type DifficultyPreset = 'chill' | 'spicy' | 'chaos';

/** Regular = curated 7-round climb; Mayhem = random heat, phrases always 4+ words. */
export type GameMode = 'regular' | 'mayhem';

export type PhraseCategory =
  | 'pop_culture'
  | 'animals'
  | 'food'
  | 'fantasy'
  | 'office'
  | 'absurd'
  | 'mixed';

export type LanguageTier = 'easy' | 'medium' | 'chaos';

export type Phrase = {
  id: string;
  text: string;
  category: PhraseCategory;
  /** Descriptive only; phrase length is not tied to difficulty */
  length: 'short' | 'medium' | 'long';
};

export type Player = {
  id: string;
  name: string;
  teamId: 'a' | 'b' | null;
  totalScore: number;
};

export type RoomSettings = {
  playerCount: number;
  teamsEnabled: boolean;
  /** Total rounds in the session (fixed arc; no longer chosen in UI). */
  rounds: number;
  gameMode: GameMode;
  difficulty: DifficultyPreset;
  category: PhraseCategory | 'mixed';
  languageCodes: string[];
};

/** Why the server used phrase-based mock STT (when `usedMockPipeline` is true). */
export type SttMockReason = 'no_server_key' | 'no_recording' | 'bad_audio_format' | 'google_stt_no_result';

export type TurnResult = {
  roundNumber: number;
  playerId: string;
  playerName: string;
  phraseOriginal: string;
  phraseCategory: PhraseCategory;
  languageCode: string;
  languageLabel: string;
  translatedText: string;
  recognizedText: string | null;
  reverseEnglish: string;
  closenessScore: 0 | 1 | 2 | 3;
  languageBonus: 0 | 1 | 2;
  funnyVoteBonus: 0 | 1;
  totalTurnScore: number;
  funnyLabel: string;
  usedMockPipeline: boolean;
  sttMockReason?: SttMockReason;
};
