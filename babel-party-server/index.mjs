import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });
const PORT = process.env.PORT ?? 3847;

/** Render/Linux env names are case-sensitive; accept a few common variants. */
function readGoogleCloudApiKey() {
  const e = process.env;
  const candidates = ['GOOGLE_CLOUD_API_KEY', 'Google_Cloud_API_Key', 'google_cloud_api_key'];
  for (const k of candidates) {
    const v = e[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

const GOOGLE_KEY = readGoogleCloudApiKey();

/** App sends ISO 639-1 codes; map to BCP-47 for Speech-to-Text (same locales work for TTS). */
const STT_LOCALE = {
  en: 'en-US',
  es: 'es-ES',
  it: 'it-IT',
  fr: 'fr-FR',
  de: 'de-DE',
  el: 'el-GR',
  tr: 'tr-TR',
  ja: 'ja-JP',
  ar: 'ar-SA',
  hi: 'hi-IN',
  no: 'nb-NO',
  fi: 'fi-FI',
  hu: 'hu-HU',
  pl: 'pl-PL',
  sv: 'sv-SE',
  da: 'da-DK',
  cs: 'cs-CZ',
  ro: 'ro-RO',
  nl: 'nl-NL',
  pt: 'pt-BR',
  ko: 'ko-KR',
  id: 'id-ID',
  vi: 'vi-VN',
  th: 'th-TH',
  uk: 'uk-UA',
  sk: 'sk-SK',
  he: 'he-IL',
};

const corsOrigin = process.env.CORS_ORIGIN?.trim();
app.use(
  cors(
    corsOrigin
      ? {
          origin: corsOrigin.split(',').map((s) => s.trim()),
        }
      : {},
  ),
);
app.use(express.json({ limit: '512kb' }));

function normalizeTranslationText(raw) {
  if (!raw || typeof raw !== 'string') return raw;
  let t = raw.trim().replace(/\+/g, ' ');
  for (let k = 0; k < 6; k++) {
    const next = t.replace(/%25([0-9A-Fa-f]{2})/gi, '%$1');
    if (next === t) break;
    t = next;
  }
  for (let i = 0; i < 10; i++) {
    if (!/%[0-9A-Fa-f]{2}/.test(t)) break;
    try {
      const decoded = decodeURIComponent(t);
      if (decoded === t) break;
      t = decoded;
    } catch {
      t = t
        .replace(/%20/gi, ' ')
        .replace(/%0[0-9a-f]/gi, ' ')
        .replace(/%2[Cc]/g, ',')
        .replace(/%2[Ee]/g, '.')
        .replace(/%21/g, '!')
        .replace(/%3[Ff]/g, '?')
        .replace(/%3[Aa]/g, ':')
        .replace(/%3[Bb]/g, ';');
    }
  }
  return t
    .replace(/%20/gi, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function googleTranslate(text, source, target) {
  if (!GOOGLE_KEY) throw new Error('no_google_key');
  const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source, target, format: 'text' }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('translate error', data);
    throw new Error(data.error?.message ?? 'translate_failed');
  }
  const out = data.data?.translations?.[0]?.translatedText;
  return normalizeTranslationText(String(out ?? ''));
}

async function googleTextToSpeech(text, languageBcp47, speakingRate = 0.95) {
  if (!GOOGLE_KEY) throw new Error('no_google_key');
  const rate = Math.min(1, Math.max(0.25, Number(speakingRate) || 0.95));
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_KEY}`;
  const body = {
    input: { text },
    voice: {
      languageCode: languageBcp47,
      ssmlGender: 'NEUTRAL',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: rate,
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('tts error', data);
    throw new Error(data.error?.message ?? 'tts_failed');
  }
  if (!data.audioContent) throw new Error('no_audio');
  return data.audioContent;
}

const TTS_LINEAR16_RATE = 16000;

/** Raw mono PCM16 LE from Google (LINEAR16). `speakingRate` 0.25–1.0 per Google TTS. */
async function googleTtsLinear16Pcm(text, languageBcp47, speakingRate = 0.95) {
  if (!GOOGLE_KEY) throw new Error('no_google_key');
  const rate = Math.min(1, Math.max(0.25, Number(speakingRate) || 0.95));
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_KEY}`;
  const body = {
    input: { text },
    voice: { languageCode: languageBcp47, ssmlGender: 'NEUTRAL' },
    audioConfig: {
      audioEncoding: 'LINEAR16',
      sampleRateHertz: TTS_LINEAR16_RATE,
      speakingRate: rate,
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('tts linear16 error', data);
    throw new Error(data.error?.message ?? 'tts_failed');
  }
  if (!data.audioContent) throw new Error('no_audio');
  return { pcm: Buffer.from(data.audioContent, 'base64'), sampleRate: TTS_LINEAR16_RATE };
}

function reversePcm16LE(pcm) {
  const len = Math.floor(pcm.length / 2);
  const out = Buffer.alloc(pcm.length);
  for (let i = 0; i < len; i++) {
    const s = pcm.readUInt16LE((len - 1 - i) * 2);
    out.writeUInt16LE(s, i * 2);
  }
  return out;
}

function pcm16MonoToWav(pcm, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

/** Find PCM data subchunk and reverse samples in-place copy. */
function reverseWavPcm16Buffer(buf) {
  if (!isWavPcm(buf)) return null;
  let offset = 12;
  let dataStart = 0;
  let dataSize = 0;
  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString('ascii', offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    const padded = chunkSize + (chunkSize % 2);
    if (chunkId === 'data') {
      dataStart = offset + 8;
      dataSize = chunkSize;
      break;
    }
    offset += 8 + padded;
  }
  if (!dataStart || dataSize < 2) return null;
  const pcm = buf.subarray(dataStart, dataStart + dataSize);
  const revPcm = reversePcm16LE(Buffer.from(pcm));
  return Buffer.concat([buf.subarray(0, dataStart), revPcm]);
}

function mockEnglishStt(originalEnglish) {
  const words = originalEnglish.split(/\s+/).filter(Boolean);
  const take = Math.max(1, Math.min(3, words.length));
  return words.slice(0, take).join(' ');
}

async function myMemoryTranslate(q, pair) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${pair}`;
  const res = await fetch(url);
  const data = await res.json();
  const out = data.responseData?.translatedText?.trim();
  if (out && !/^MYMEMORY WARNING/i.test(out)) return normalizeTranslationText(out);
  return normalizeTranslationText(q);
}

function isWavPcm(buf) {
  return buf?.length > 28 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WAVE';
}

function wavSampleRateHertz(buf) {
  try {
    return buf.readUInt32LE(24);
  } catch {
    return 16000;
  }
}

async function googleSpeechRecognizeOnce(audioBuffer, languageCode) {
  const locale = STT_LOCALE[languageCode] ?? `${languageCode}-${languageCode.toUpperCase()}`;
  const rate = wavSampleRateHertz(audioBuffer) || 16000;
  const url = `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_KEY}`;
  const body = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: rate,
      /** Single fixed locale for the round — never set alternativeLanguageCodes (no language guessing). */
      languageCode: locale,
      enableAutomaticPunctuation: true,
      maxAlternatives: 1,
    },
    audio: { content: audioBuffer.toString('base64') },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, status: res.status, transcript: null, data };
  }
  const t = data.results?.[0]?.alternatives?.[0]?.transcript;
  return {
    ok: true,
    status: res.status,
    transcript: t ? normalizeTranslationText(String(t)) : null,
    data,
  };
}

async function googleSpeechToText(audioBuffer, languageCode) {
  if (!GOOGLE_KEY || !audioBuffer?.length) return null;
  if (!isWavPcm(audioBuffer)) {
    console.warn('STT: expected 16-bit PCM WAV from the app; got non-WAV buffer — skipping Google STT');
    return null;
  }
  const retryable = (status) => [429, 500, 502, 503, 504].includes(Number(status));
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const r = await googleSpeechRecognizeOnce(audioBuffer, languageCode);
    if (r.transcript) return r.transcript;
    if (!r.ok && r.status && !retryable(r.status)) {
      console.error('speech error', r.data);
      break;
    }
    if (!r.ok) console.warn('STT attempt failed, retrying', r.status, attempt + 1);
    if (attempt < maxAttempts - 1) {
      await new Promise((res) => setTimeout(res, 400 * (attempt + 1)));
    }
  }
  return null;
}

function mockRecognized(translatedForeign, languageCode, audioBuffer) {
  const seed = (audioBuffer?.length ?? 0) % 7;
  const words = translatedForeign.split(/\s+/).filter(Boolean);
  if (!words.length) return `[${languageCode}] ???`;
  const take = Math.max(1, Math.min(words.length, 2 + (seed % 2)));
  return words.slice(0, take).join(' ');
}

app.post('/translate', async (req, res) => {
  try {
    const text = String(req.body.text ?? '').trim();
    const source = String(req.body.source ?? 'en');
    const target = String(req.body.target ?? 'es');
    if (!text) return res.status(400).json({ error: 'missing_text' });
    let translatedText;
    if (GOOGLE_KEY) {
      translatedText = await googleTranslate(text, source, target);
    } else {
      translatedText = await myMemoryTranslate(text, `${source}|${target}`);
    }
    res.json({ translatedText });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'translate_failed' });
  }
});

app.post('/tts', async (req, res) => {
  try {
    const text = String(req.body.text ?? '').trim();
    const languageCode = String(req.body.languageCode ?? 'en-US');
    if (!text) return res.status(400).json({ error: 'missing_text' });
    if (!GOOGLE_KEY) return res.status(503).json({ error: 'tts_requires_google_key' });
    const speakingRate =
      req.body.speakingRate != null && req.body.speakingRate !== ''
        ? Number(req.body.speakingRate)
        : 0.95;
    const audioContent = await googleTextToSpeech(text, languageCode, speakingRate);
    res.json({ audioContent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'tts_failed' });
  }
});

app.post('/process', upload.single('audio'), async (req, res) => {
  try {
    const originalEnglish = String(req.body.originalEnglish ?? '');
    const translatedForeign = normalizeTranslationText(String(req.body.translatedForeign ?? ''));
    const languageCode = String(req.body.languageCode ?? 'es');
    const buf = req.file?.buffer;

    let recognizedText = null;
    let sttSource = 'mock';
    /** Why we fell back to phrase-based mock STT (only set when sttSource ends up mock). */
    let sttMockReason = null;
    if (!buf?.length) {
      sttMockReason = 'no_recording';
    } else if (!GOOGLE_KEY) {
      sttMockReason = 'no_server_key';
    } else if (!isWavPcm(buf)) {
      sttMockReason = 'bad_audio_format';
    } else {
      const fromGoogle = await googleSpeechToText(buf, languageCode);
      if (fromGoogle) {
        recognizedText = fromGoogle;
        sttSource = 'google';
      } else {
        sttMockReason = 'google_stt_no_result';
      }
    }
    if (!recognizedText) {
      recognizedText = mockRecognized(translatedForeign, languageCode, buf);
      sttSource = 'mock';
    }

    /** Round language only for translate source (ISO-style code from the app, e.g. de, ja). */
    const translateSource = languageCode;
    let reverseEnglish;
    if (GOOGLE_KEY) {
      try {
        reverseEnglish = await googleTranslate(recognizedText, translateSource, 'en');
      } catch {
        reverseEnglish = await myMemoryTranslate(recognizedText, `${translateSource}|en`);
      }
    } else {
      reverseEnglish = await myMemoryTranslate(recognizedText, `${translateSource}|en`);
    }

    res.json({
      recognizedText,
      reverseEnglish: normalizeTranslationText(String(reverseEnglish ?? '')),
      closenessScore: null,
      sttSource,
      ...(sttSource === 'mock' && sttMockReason ? { sttMockReason } : {}),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'process_failed' });
  }
});

/** English phrase → TTS → reverse PCM → WAV (for Reverse Audio game). */
app.post('/tts-reversed-wav', async (req, res) => {
  try {
    const text = String(req.body.text ?? '').trim();
    if (!text) return res.status(400).json({ error: 'missing_text' });
    if (!GOOGLE_KEY) return res.status(503).json({ error: 'tts_requires_google_key' });
    const speakingRate =
      req.body.speakingRate != null && req.body.speakingRate !== ''
        ? Number(req.body.speakingRate)
        : 0.95;
    const { pcm, sampleRate } = await googleTtsLinear16Pcm(text, 'en-US', speakingRate);
    const rev = reversePcm16LE(pcm);
    const wav = pcm16MonoToWav(rev, sampleRate);
    res.json({ audioContentWavBase64: wav.toString('base64') });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'tts_reversed_failed' });
  }
});

/** Reverse a mono PCM WAV in time (same sample format as app recordings). */
app.post('/reverse-audio-wav', upload.single('audio'), async (req, res) => {
  try {
    const buf = req.file?.buffer;
    if (!buf?.length) return res.status(400).json({ error: 'missing_audio' });
    const out = reverseWavPcm16Buffer(buf);
    if (!out) return res.status(400).json({ error: 'invalid_wav' });
    res.json({ audioContentWavBase64: out.toString('base64') });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'reverse_audio_failed' });
  }
});

/** STT in English only; transcript compared to original on the client for scoring. */
app.post('/process-english', upload.single('audio'), async (req, res) => {
  try {
    const originalEnglish = String(req.body.originalEnglish ?? '').trim();
    const buf = req.file?.buffer;
    let recognizedText = null;
    let sttSource = 'mock';
    let sttMockReason = null;
    if (!buf?.length) {
      sttMockReason = 'no_recording';
    } else if (!GOOGLE_KEY) {
      sttMockReason = 'no_server_key';
    } else if (!isWavPcm(buf)) {
      sttMockReason = 'bad_audio_format';
    } else {
      const fromGoogle = await googleSpeechToText(buf, 'en');
      if (fromGoogle) {
        recognizedText = fromGoogle;
        sttSource = 'google';
      } else {
        sttMockReason = 'google_stt_no_result';
      }
    }
    if (!recognizedText) {
      recognizedText = mockEnglishStt(originalEnglish);
      sttSource = 'mock';
    }
    res.json({
      recognizedText,
      reverseEnglish: recognizedText,
      sttSource,
      ...(sttSource === 'mock' && sttMockReason ? { sttMockReason } : {}),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'process_english_failed' });
  }
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    google: Boolean(GOOGLE_KEY),
    features: {
      translate: true,
      stt: Boolean(GOOGLE_KEY),
      tts: Boolean(GOOGLE_KEY),
      ttsReversedWav: Boolean(GOOGLE_KEY),
      reverseAudioWav: true,
      processEnglish: Boolean(GOOGLE_KEY),
    },
  });
});

/** Opt-in event sink for Phase 5 analytics (logs one JSON line per event when LOG_ANALYTICS=1). */
app.post('/analytics', (req, res) => {
  if (process.env.LOG_ANALYTICS === '1') {
    console.log(
      JSON.stringify({
        type: 'client_event',
        receivedAt: new Date().toISOString(),
        body: req.body,
      }),
    );
  }
  res.json({ ok: true });
});

const HOST = process.env.HOST ?? '0.0.0.0';
app.listen(Number(PORT), HOST, () => {
  console.log(`babel-party-server listening on http://${HOST}:${PORT}`);
  console.log(
    GOOGLE_KEY
      ? 'GOOGLE_CLOUD_API_KEY loaded from environment (.env or shell).'
      : 'No GOOGLE_CLOUD_API_KEY — using MyMemory for translate / mock STT.',
  );
});
