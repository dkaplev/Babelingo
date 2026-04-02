import { phraseWordCount } from '@/lib/phrases';
import type { Phrase } from '@/lib/types';

/**
 * Very plain, common English lines (4–5 words) so backward playback is guessable by ear,
 * not by obscure vocabulary.
 */
const REVERSE_LINES: string[] = [
  'I will call you later',
  'Please pass the salt shaker',
  'We need a little more time',
  'It is getting late outside',
  'Can you help me please',
  'I forgot my keys again',
  'Let us order some pizza',
  'The meeting starts at nine',
  'I need more sleep tonight',
  'Turn down the music please',
  'Where did I put my phone',
  'The bus is running late',
  'I love this song so much',
  'Do not forget your jacket',
  'The coffee tastes really good',
  'I am almost home now',
  'Please send me the file',
  'The kids are in bed now',
  'We should leave pretty soon',
  'I have a doctor appointment',
  'The weather is nice today',
  'Can I get some water',
  'My phone battery is dying',
  'I will be there shortly',
  'Thanks for dinner tonight',
  'The line is way too long',
  'I need to buy milk',
  'What time does it close',
  'I am on my way home',
  'Please hold the door open',
  'The movie was really funny',
  'I lost my wallet somewhere',
  'We are out of paper towels',
  'I feel a little tired',
  'The train leaves in ten',
  'I will text you tomorrow',
  'Do you want some dessert',
  'The dog needs a walk',
  'I cannot find my glasses',
  'Let me think about it',
  'The answer is on the board',
  'I spilled coffee on myself',
  'We should book a table',
  'I heard that on the news',
  'The lights are too bright',
  'I need to charge my watch',
  'Please speak a bit louder',
  'The soup is still hot',
  'I will take the next one',
  'We parked on the street',
  'I am waiting for a friend',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Distinct phrases per player for Reverse Audio — only from the common pool. */
export function pickReverseRoundPhrases(
  count: number,
  minWords: number,
  maxWords: number,
): Phrase[] {
  const pool = REVERSE_LINES.filter((t) => {
    const n = phraseWordCount(t);
    return n >= minWords && n <= maxWords;
  });
  const base = pool.length > 0 ? pool : REVERSE_LINES;
  const shuffled = shuffle(base);
  const out: Phrase[] = [];
  for (let i = 0; i < count; i++) {
    const text = shuffled[i % shuffled.length]!;
    const n = phraseWordCount(text);
    out.push({
      id: `rev-${i}-${text.slice(0, 12).replace(/\s+/g, '-')}`,
      text,
      category: 'mixed',
      length: n <= 5 ? 'short' : 'medium',
    });
  }
  return out;
}
