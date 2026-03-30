import type { Phrase, PhraseCategory } from '@/lib/types';

function p(
  id: string,
  text: string,
  category: PhraseCategory,
  length: Phrase['length'],
): Phrase {
  return { id, text, category, length };
}

/**
 * Deliberately plain English so humor comes from echo translation, not the setup.
 * Length tags are descriptive only; selection ignores them (random length in play).
 */
export const PHRASES: Phrase[] = [
  p('pc1', 'I am watching a show after dinner tonight', 'pop_culture', 'medium'),
  p('pc2', 'We booked tickets online for the game', 'pop_culture', 'short'),
  p('pc3', 'My brother plays guitar in a local band', 'pop_culture', 'medium'),
  p('pc4', 'The radio station plays mostly pop music', 'pop_culture', 'medium'),
  p('pc5', 'I have not finished that season yet', 'pop_culture', 'short'),
  p('pc6', 'The movie starts at eight thirty', 'pop_culture', 'short'),
  p('pc7', 'She sings in the church choir on Sundays', 'pop_culture', 'medium'),
  p('pc8', 'I follow the news on my phone', 'pop_culture', 'short'),
  p('pc9', 'The documentary was about two hours long', 'pop_culture', 'medium'),
  p('pc10', 'We stream shows on the living room television', 'pop_culture', 'medium'),
  p('pc11', 'The actor gave an interview yesterday', 'pop_culture', 'short'),
  p('pc12', 'I bought the album as a digital download', 'pop_culture', 'medium'),
  p('pc13', 'The festival happens every summer downtown', 'pop_culture', 'medium'),
  p('pc14', 'My cousin works behind the scenes in television', 'pop_culture', 'medium'),
  p('pc15', 'The comedy special made us laugh a lot', 'pop_culture', 'medium'),
  p('pc16', 'I muted the commercials during the break', 'pop_culture', 'short'),
  p('pc17', 'The playlist is mostly songs from the nineties', 'pop_culture', 'medium'),
  p('pc18', 'We sat in the balcony at the theatre', 'pop_culture', 'short'),

  p('an1', 'The dog needs fresh water in his bowl', 'animals', 'medium'),
  p('an2', 'I walked to the park with the puppy', 'animals', 'short'),
  p('an3', 'Our cat likes to sit by the window', 'animals', 'medium'),
  p('an4', 'The vet said the rabbit is healthy', 'animals', 'short'),
  p('an5', 'I cleaned the fish tank this morning', 'animals', 'short'),
  p('an6', 'She grooms her horse twice a week', 'animals', 'short'),
  p('an7', 'The chickens lay eggs in the coop', 'animals', 'short'),
  p('an8', 'Please keep the gate closed for the sheep', 'animals', 'medium'),
  p('an9', 'I bought dry food for the kitten', 'animals', 'short'),
  p('an10', 'The turtle eats lettuce and pellets', 'animals', 'short'),
  p('an11', 'We heard an owl outside last night', 'animals', 'short'),
  p('an12', 'The neighbors are looking for their lost cat', 'animals', 'medium'),
  p('an13', 'I put a blanket in the dog crate', 'animals', 'short'),
  p('an14', 'The guinea pig squeaks when it hears footsteps', 'animals', 'medium'),
  p('an15', 'Wild ducks were swimming in the pond', 'animals', 'medium'),
  p('an16', 'I take the parrot to the vet each spring', 'animals', 'medium'),
  p('an17', 'The farm has several cows in the field', 'animals', 'medium'),
  p('an18', 'She volunteers at the animal shelter on Saturdays', 'animals', 'medium'),

  p('fd1', 'I made pasta with tomato sauce for dinner', 'food', 'medium'),
  p('fd2', 'We are having rice and vegetables tonight', 'food', 'medium'),
  p('fd3', 'I drank a glass of orange juice at breakfast', 'food', 'medium'),
  p('fd4', 'The bakery sells fresh bread on Main Street', 'food', 'medium'),
  p('fd5', 'She ordered a salad with grilled chicken', 'food', 'medium'),
  p('fd6', 'I added butter to the mashed potatoes', 'food', 'medium'),
  p('fd7', 'The recipe calls for two cups of flour', 'food', 'medium'),
  p('fd8', 'We are out of sugar in the pantry', 'food', 'short'),
  p('fd9', 'He prefers his coffee black without milk', 'food', 'medium'),
  p('fd10', 'I packed an apple and a sandwich for lunch', 'food', 'medium'),
  p('fd11', 'The soup is still hot on the stove', 'food', 'short'),
  p('fd12', 'We bought ice cream for dessert', 'food', 'short'),
  p('fd13', 'The restaurant was crowded on Friday night', 'food', 'medium'),
  p('fd14', 'I stirred the oatmeal while it was cooking', 'food', 'medium'),
  p('fd15', 'She cut the watermelon into small slices', 'food', 'medium'),
  p('fd16', 'The eggs boil for about seven minutes', 'food', 'medium'),
  p('fd17', 'I need to pick up milk on the way home', 'food', 'medium'),
  p('fd18', 'We shared a pizza with extra cheese', 'food', 'medium'),

  p('fn1', 'I finished the last chapter before bed', 'fantasy', 'medium'),
  p('fn2', 'The library book is due next Tuesday', 'fantasy', 'short'),
  p('fn3', 'She reads novels on her commute', 'fantasy', 'short'),
  p('fn4', 'I wrote three pages in my notebook today', 'fantasy', 'medium'),
  p('fn5', 'The bookstore has a sale this weekend', 'fantasy', 'medium'),
  p('fn6', 'I am on page two hundred of this biography', 'fantasy', 'medium'),
  p('fn7', 'He prefers nonfiction to fiction most of the time', 'fantasy', 'medium'),
  p('fn8', 'The audiobook narrator has a calm voice', 'fantasy', 'medium'),
  p('fn9', 'I folded the corner of the page by mistake', 'fantasy', 'medium'),
  p('fn10', 'We discussed the plot in our reading group', 'fantasy', 'medium'),
  p('fn11', 'The sequel came out in hardcover first', 'fantasy', 'medium'),
  p('fn12', 'I borrowed the magazine from the waiting room', 'fantasy', 'medium'),
  p('fn13', 'The poem was short but easy to remember', 'fantasy', 'medium'),
  p('fn14', 'She keeps a stack of paperbacks by her bed', 'fantasy', 'medium'),
  p('fn15', 'I underlined a sentence I liked', 'fantasy', 'short'),
  p('fn16', 'The author signed copies at the event', 'fantasy', 'medium'),
  p('fn17', 'I am halfway through the second volume', 'fantasy', 'medium'),
  p('fn18', 'The newspaper arrived late this morning', 'fantasy', 'medium'),

  p('of1', 'The weekly meeting is scheduled for Monday', 'office', 'medium'),
  p('of2', 'I replied to the client email this afternoon', 'office', 'medium'),
  p('of3', 'Please save the file on the shared drive', 'office', 'medium'),
  p('of4', 'The printer is out of toner again', 'office', 'short'),
  p('of5', 'I took notes during the conference call', 'office', 'medium'),
  p('of6', 'My badge scans at the front entrance', 'office', 'medium'),
  p('of7', 'The deadline for the report is Friday at five', 'office', 'medium'),
  p('of8', 'She works remotely two days each week', 'office', 'medium'),
  p('of9', 'I organized the folders on my desktop', 'office', 'medium'),
  p('of10', 'The office closes early on public holidays', 'office', 'medium'),
  p('of11', 'I booked a small room for the interview', 'office', 'medium'),
  p('of12', 'The spreadsheet lists the numbers for this quarter', 'office', 'medium'),
  p('of13', 'Please forward the message to the team', 'office', 'medium'),
  p('of14', 'I am waiting for approval from my manager', 'office', 'medium'),
  p('of15', 'The lunch break starts at noon sharp', 'office', 'medium'),
  p('of16', 'I stapled the pages in the correct order', 'office', 'medium'),
  p('of17', 'The Wi-Fi password is posted near reception', 'office', 'medium'),
  p('of18', 'I left a voicemail when nobody answered', 'office', 'medium'),

  p('ab1', 'I set my alarm for six thirty tomorrow', 'absurd', 'medium'),
  p('ab2', 'The bus was a few minutes late today', 'absurd', 'short'),
  p('ab3', 'I hung my coat on the hook by the door', 'absurd', 'medium'),
  p('ab4', 'I need to wash towels this weekend', 'absurd', 'short'),
  p('ab5', 'The parking meter ran out of time', 'absurd', 'short'),
  p('ab6', 'I charged my phone before leaving home', 'absurd', 'medium'),
  p('ab7', 'The weather forecast said light rain', 'absurd', 'short'),
  p('ab8', 'I brushed my teeth after breakfast', 'absurd', 'medium'),
  p('ab9', 'We are meeting at the train station entrance', 'absurd', 'medium'),
  p('ab10', 'I folded the laundry on the couch', 'absurd', 'medium'),
  p('ab11', 'The light bulb in the hallway burned out', 'absurd', 'medium'),
  p('ab12', 'I watered the plant on the windowsill', 'absurd', 'medium'),
  p('ab13', 'I locked the front door when I left', 'absurd', 'medium'),
  p('ab14', 'The grocery store closes at nine o clock', 'absurd', 'medium'),
  p('ab15', 'I took the stairs instead of the elevator', 'absurd', 'medium'),
  p('ab16', 'My keys were in my jacket pocket', 'absurd', 'short'),
  p('ab17', 'I replaced the batteries in the remote', 'absurd', 'medium'),
  p('ab18', 'The recycling truck came early this morning', 'absurd', 'medium'),

  /** Short lines (3–5 words) for warm-up / compact rounds */
  p('sh1', 'The pizza arrived cold', 'food', 'short'),
  p('sh2', 'We need more ice', 'food', 'short'),
  p('sh3', 'She makes great coffee', 'food', 'short'),
  p('sh4', 'Pass the hot sauce', 'food', 'short'),
  p('sh5', 'Breakfast was already finished', 'food', 'short'),
  p('sh6', 'The cat knocked something over', 'animals', 'short'),
  p('sh7', 'Walk the dog tonight', 'animals', 'short'),
  p('sh8', 'Birds are loud at dawn', 'animals', 'short'),
  p('sh9', 'That goldfish looks surprised', 'animals', 'short'),
  p('sh10', 'Horses hate loud plastic bags', 'animals', 'short'),
  p('sh11', 'The movie starts soon', 'pop_culture', 'short'),
  p('sh12', 'Skip this song please', 'pop_culture', 'short'),
  p('sh13', 'Band practice ran late', 'pop_culture', 'short'),
  p('sh14', 'I lost the remote again', 'pop_culture', 'short'),
  p('sh15', 'Rewind that funny part', 'pop_culture', 'short'),
  p('sh16', 'Meeting moved to Tuesday', 'office', 'short'),
  p('sh17', 'Reply all by mistake', 'office', 'short'),
  p('sh18', 'Stapler is missing again', 'office', 'short'),
  p('sh19', 'Out of toner completely', 'office', 'short'),
  p('sh20', 'Elevator smells like coffee', 'office', 'short'),
  p('sh21', 'Bus left without us', 'absurd', 'short'),
  p('sh22', 'Phone battery is dying', 'absurd', 'short'),
  p('sh23', 'Wrong floor sorry everyone', 'absurd', 'short'),
  p('sh24', 'Alarm did not go off', 'absurd', 'short'),
  p('sh25', 'Forgot my keys inside', 'absurd', 'short'),
  p('sh26', 'This line is not moving', 'absurd', 'short'),
  p('sh27', 'Library book is overdue', 'fantasy', 'short'),
  p('sh28', 'One more chapter tonight', 'fantasy', 'short'),
  p('sh29', 'Spoilers ruin everything honestly', 'fantasy', 'short'),
];

export function phraseWordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function pickPhraseFromPool(pool: Phrase[]): Phrase {
  if (pool.length === 0) return pickPhrase('mixed');
  return pool[Math.floor(Math.random() * pool.length)]!;
}

/** Pick a random phrase whose English word count falls in [minWords, maxWords] (inclusive). */
export function pickPhraseForWordRange(
  category: PhraseCategory | 'mixed',
  minWords: number,
  maxWords: number,
): Phrase {
  let pool = category === 'mixed' ? PHRASES : PHRASES.filter((x) => x.category === category);
  pool = pool.filter((p) => {
    const n = phraseWordCount(p.text);
    return n >= minWords && n <= maxWords;
  });
  if (pool.length === 0) {
    pool = PHRASES.filter((p) => {
      const n = phraseWordCount(p.text);
      return n >= Math.min(minWords, 6) && n <= Math.max(maxWords, 10);
    });
  }
  return pickPhraseFromPool(pool);
}

function shufflePhrases<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Pick `count` different phrases in the word range (by phrase id). If the pool is smaller than `count`,
 * cycles through shuffled picks without immediate repeats.
 */
export function pickDistinctPhrasesForWordRange(
  count: number,
  category: PhraseCategory | 'mixed',
  minWords: number,
  maxWords: number,
): Phrase[] {
  let pool = category === 'mixed' ? PHRASES : PHRASES.filter((x) => x.category === category);
  pool = pool.filter((p) => {
    const n = phraseWordCount(p.text);
    return n >= minWords && n <= maxWords;
  });
  if (pool.length === 0) {
    return Array.from({ length: count }, () => pickPhraseForWordRange(category, minWords, maxWords));
  }
  const shuffled = shufflePhrases(pool);
  const out: Phrase[] = [];
  const usedThisPass = new Set<string>();
  for (let i = 0; i < count; i++) {
    let candidates = shuffled.filter((p) => !usedThisPass.has(p.id));
    if (candidates.length === 0) {
      usedThisPass.clear();
      candidates = shuffled;
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)]!;
    usedThisPass.add(pick.id);
    out.push(pick);
  }
  return out;
}

export function pickPhrase(category: PhraseCategory | 'mixed'): Phrase {
  let pool = PHRASES;
  if (category !== 'mixed') {
    pool = PHRASES.filter((x) => x.category === category);
  }
  return pool[Math.floor(Math.random() * pool.length)]!;
}
