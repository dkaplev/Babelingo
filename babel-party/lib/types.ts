export type DifficultyPreset = 'chill' | 'spicy' | 'chaos';

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
  rounds: number;
  difficulty: DifficultyPreset;
  category: PhraseCategory | 'mixed';
  languageCodes: string[];
};

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
  languageBonus: 0 | 1;
  funnyVoteBonus: 0 | 1;
  totalTurnScore: number;
  funnyLabel: string;
  usedMockPipeline: boolean;
};
