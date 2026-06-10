import { getPipelineBaseUrl } from '@/lib/env';
import { languageByCode } from '@/lib/languages';
import { normalizeTranslationText } from '@/lib/normalizeTranslation';

export type TranslationSource = 'backend' | 'mymemory' | 'mymemory_fallback' | 'offline';

export type TranslateEnResult = {
  text: string;
  source: TranslationSource;
};

function apiBase(): string | undefined {
  return getPipelineBaseUrl();
}

async function translateViaBackend(
  text: string,
  source: string,
  target: string,
): Promise<string | null> {
  const base = apiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source, target }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { translatedText?: string };
    const out = data.translatedText?.trim();
    return out ? normalizeTranslationText(out) : null;
  } catch {
    return null;
  }
}

async function translateMyMemory(text: string, pair: string): Promise<string | null> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`;
  try {
    const res = await fetch(url);
    const data = (await res.json()) as {
      responseData?: { translatedText?: string };
    };
    const out = data.responseData?.translatedText?.trim();
    if (out && !/^MYMEMORY WARNING/i.test(out)) return normalizeTranslationText(out);
  } catch {
    /* fall through */
  }
  return null;
}

/**
 * In-memory cache of successful translations for the app session.
 * Lets round-intro prefetch every turn's translation so turn start is instant (no spinner / dead air).
 */
const translationCache = new Map<string, TranslateEnResult>();
const inflight = new Map<string, Promise<TranslateEnResult>>();

function cacheKey(text: string, languageCode: string): string {
  return `${languageCode}|${text}`;
}

/** EN → target with metadata for UI (retry / status banners). Successful results are cached per session. */
export async function translateEnToWithMeta(text: string, languageCode: string): Promise<TranslateEnResult> {
  const key = cacheKey(text, languageCode);
  const cached = translationCache.get(key);
  if (cached) return cached;
  const pending = inflight.get(key);
  if (pending) return pending;

  const work = (async (): Promise<TranslateEnResult> => {
    if (languageCode === 'en') {
      return { text: normalizeTranslationText(text), source: 'backend' };
    }
    const lang = languageByCode(languageCode);
    const target = lang?.myMemoryCode ?? languageCode;
    const hadBackendConfigured = Boolean(apiBase());

    const fromBackend = await translateViaBackend(text, 'en', target);
    if (fromBackend) return { text: fromBackend, source: 'backend' };

    const fromMm = await translateMyMemory(text, `en|${target}`);
    if (fromMm) {
      return {
        text: fromMm,
        source: hadBackendConfigured ? 'mymemory_fallback' : 'mymemory',
      };
    }

    return {
      text: `[${languageCode.toUpperCase()}] ${text}`,
      source: 'offline',
    };
  })();

  inflight.set(key, work);
  try {
    const result = await work;
    if (result.source !== 'offline') translationCache.set(key, result);
    return result;
  } finally {
    inflight.delete(key);
  }
}

/**
 * Fire-and-forget warm-up for a batch of (phrase, language) pairs — used by round-intro
 * so every turn's translation is already cached when the phone reaches the player.
 */
export function prefetchTranslations(pairs: { text: string; languageCode: string }[]): void {
  for (const p of pairs) {
    const key = cacheKey(p.text, p.languageCode);
    if (translationCache.has(key) || inflight.has(key)) continue;
    void translateEnToWithMeta(p.text, p.languageCode).catch(() => {});
  }
}

/**
 * EN → target. Uses your backend (Google) when `EXPO_PUBLIC_PIPELINE_URL` or
 * `EXPO_PUBLIC_API_BASE_URL` is set; otherwise MyMemory (normalized).
 */
export async function translateEnTo(text: string, languageCode: string): Promise<string> {
  const r = await translateEnToWithMeta(text, languageCode);
  return r.text;
}

export async function translateToEnglish(text: string, languageCode: string): Promise<string> {
  const lang = languageByCode(languageCode);
  const src = lang?.myMemoryCode ?? languageCode;

  const google = await translateViaBackend(text, src, 'en');
  if (google) return google;

  const mm = await translateMyMemory(text, `${src}|en`);
  if (mm) return mm;

  return normalizeTranslationText(text);
}
