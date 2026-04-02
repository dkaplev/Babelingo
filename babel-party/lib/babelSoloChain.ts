import { mockReverseFromOriginal } from '@/lib/pipeline';
import { normalizeTranslationText } from '@/lib/normalizeTranslation';
import { translateEnTo, translateToEnglish } from '@/lib/translate';

const HOP_LANGS = ['es', 'fr', 'de', 'it', 'pt'] as const;

/**
 * After the real solo Babel hop (player recording), synthesize extra English mutations
 * so the recap shows a full telephone-style chain without multiple players.
 */
export async function buildSoloBabelDisplayChain(
  seedEnglish: string,
  firstHopEnglish: string,
  extraHops: number,
): Promise<string[]> {
  const chain = [seedEnglish.trim(), firstHopEnglish.trim()];
  let current = firstHopEnglish.trim();
  for (let i = 0; i < extraHops; i++) {
    const code = HOP_LANGS[i % HOP_LANGS.length]!;
    try {
      const mid = await translateEnTo(current, code);
      const back = normalizeTranslationText(await translateToEnglish(normalizeTranslationText(mid), code));
      if (back && back.length > 2 && back.toLowerCase() !== current.toLowerCase()) {
        current = back;
        chain.push(current);
        continue;
      }
    } catch {
      /* fall through */
    }
    current = mockReverseFromOriginal(current, code);
    chain.push(current);
  }
  return chain;
}
