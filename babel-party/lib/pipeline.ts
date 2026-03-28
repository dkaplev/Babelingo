import { getPipelineBaseUrl } from '@/lib/env';
import { languageByCode } from '@/lib/languages';
import { normalizeTranslationText } from '@/lib/normalizeTranslation';
import { closenessFromTexts, funnyLabel, languageBonusFromBand } from '@/lib/scoring';
import type { PhraseCategory, SttMockReason } from '@/lib/types';
import { translateEnTo, translateToEnglish } from '@/lib/translate';

const API = getPipelineBaseUrl();

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Light shuffle of words when STT is unavailable — avoids repeated “silly noun” inserts. */
export function mockReverseFromOriginal(original: string, languageCode: string): string {
  const words = original.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return original;
  const h = hashString(original + languageCode);
  const copy = [...words];
  const i = h % copy.length;
  const j = (h * 7) % copy.length;
  if (i !== j) [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  const out = copy.join(' ');
  return out.charAt(0).toUpperCase() + out.slice(1);
}

export type PipelineInput = {
  recordingUri: string | null;
  originalEnglish: string;
  translatedForeign: string;
  languageCode: string;
  category: PhraseCategory;
};

export type PipelineOutput = {
  recognizedText: string | null;
  reverseEnglish: string;
  closenessScore: 0 | 1 | 2 | 3;
  languageBonus: 0 | 1 | 2;
  funnyLabel: string;
  usedMockPipeline: boolean;
  sttMockReason?: SttMockReason;
};

export async function runEchoPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const lang = languageByCode(input.languageCode);
  const band = lang?.difficultyBand ?? 'easy';

  if (API) {
    try {
      const form = new FormData();
      if (input.recordingUri) {
        const name = input.recordingUri.split('/').pop() ?? 'clip.wav';
        const type = name.endsWith('.wav') ? 'audio/wav' : 'audio/m4a';
        form.append('audio', { uri: input.recordingUri, name, type } as never);
      }
      form.append('originalEnglish', input.originalEnglish);
      form.append('translatedForeign', input.translatedForeign);
      form.append('languageCode', input.languageCode);

      const res = await fetch(`${API.replace(/\/$/, '')}/process`, {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        const json = (await res.json()) as {
          recognizedText?: string | null;
          reverseEnglish?: string;
          closenessScore?: number;
          sttSource?: 'google' | 'mock';
          sttMockReason?: SttMockReason;
        };
        const reverseEnglish = normalizeTranslationText(
          json.reverseEnglish ?? mockReverseFromOriginal(input.originalEnglish, input.languageCode),
        );
        const closeness = (json.closenessScore ?? closenessFromTexts(input.originalEnglish, reverseEnglish)) as
          | 0
          | 1
          | 2
          | 3;
        const languageBonus = languageBonusFromBand(band);
        const hasTranscript = Boolean(json.recognizedText && String(json.recognizedText).trim());
        /** Treat as mock STT only when the server says so, or when there is no transcript and sttSource was never sent (older APIs). */
        const usedMockStt =
          json.sttSource === 'mock' || (json.sttSource == null && !hasTranscript);
        return {
          recognizedText: json.recognizedText ? normalizeTranslationText(json.recognizedText) : null,
          reverseEnglish,
          closenessScore: closeness,
          languageBonus,
          funnyLabel: funnyLabel(closeness),
          usedMockPipeline: usedMockStt,
          sttMockReason: usedMockStt ? json.sttMockReason : undefined,
        };
      }
    } catch {
      /* fall through to mock */
    }
  }

  let reverseEnglish = mockReverseFromOriginal(input.originalEnglish, input.languageCode);
  try {
    const foreignTwist = await translateEnTo(reverseEnglish, input.languageCode);
    reverseEnglish = normalizeTranslationText(
      await translateToEnglish(normalizeTranslationText(foreignTwist), input.languageCode),
    );
  } catch {
    /* keep local mock */
  }

  const closenessScore = closenessFromTexts(input.originalEnglish, reverseEnglish);
  return {
    recognizedText: null,
    reverseEnglish,
    closenessScore,
    languageBonus: languageBonusFromBand(band),
    funnyLabel: funnyLabel(closenessScore),
    usedMockPipeline: true,
  };
}
