/** Curated demo lines for solo “Try it now” (F-04). Short, speech-friendly. */

export type DemoPhrase = {
  id: string;
  english: string;
  /** ISO 639-1 target for TTS (easy listen). */
  languageCode: string;
};

export const DEMO_PHRASES: DemoPhrase[] = [
  { id: 'd1', english: 'The cat wore sunglasses at midnight.', languageCode: 'es' },
  { id: 'd2', english: 'My toaster is plotting against me.', languageCode: 'fr' },
  { id: 'd3', english: 'Never trust a duck with a briefcase.', languageCode: 'de' },
  { id: 'd4', english: 'The moon is just a shy spotlight.', languageCode: 'it' },
  { id: 'd5', english: 'Pizza is a mood, not a meal.', languageCode: 'pt' },
  { id: 'd6', english: 'The Wi‑Fi password is definitely wrong.', languageCode: 'ja' },
  { id: 'd7', english: 'Socks in the fridge again, classic.', languageCode: 'ko' },
  { id: 'd8', english: 'The cactus asked for a hug politely.', languageCode: 'nl' },
  { id: 'd9', english: 'Running late is my cardio.', languageCode: 'sv' },
  { id: 'd10', english: 'The karaoke was illegal but beautiful.', languageCode: 'pl' },
];

export function pickRandomDemoPhrase(): DemoPhrase {
  return DEMO_PHRASES[Math.floor(Math.random() * DEMO_PHRASES.length)]!;
}
