import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });
const PORT = process.env.PORT ?? 3847;
const GOOGLE_KEY = process.env.GOOGLE_CLOUD_API_KEY ?? '';

const STT_LOCALE = {
  es: 'es-ES',
  it: 'it-IT',
  fr: 'fr-FR',
  de: 'de-DE',
  el: 'el-GR',
  tr: 'tr-TR',
  ja: 'ja-JP',
  ar: 'ar-SA',
  hi: 'hi-IN',
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

async function googleTextToSpeech(text, languageBcp47) {
  if (!GOOGLE_KEY) throw new Error('no_google_key');
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_KEY}`;
  const body = {
    input: { text },
    voice: {
      languageCode: languageBcp47,
      ssmlGender: 'NEUTRAL',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.95,
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

async function googleSpeechToText(audioBuffer, languageCode) {
  if (!GOOGLE_KEY || !audioBuffer?.length) return null;
  const locale = STT_LOCALE[languageCode] ?? `${languageCode}-${languageCode.toUpperCase()}`;
  if (!isWavPcm(audioBuffer)) {
    console.warn('STT: expected 16-bit PCM WAV from the app; got non-WAV buffer — skipping Google STT');
    return null;
  }
  const rate = wavSampleRateHertz(audioBuffer) || 16000;
  const url = `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_KEY}`;
  const body = {
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: rate,
      languageCode: locale,
      enableAutomaticPunctuation: true,
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
    console.error('speech error', data);
    return null;
  }
  const t = data.results?.[0]?.alternatives?.[0]?.transcript;
  return t ? normalizeTranslationText(String(t)) : null;
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
    const audioContent = await googleTextToSpeech(text, languageCode);
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
    if (buf?.length) {
      const fromGoogle = await googleSpeechToText(buf, languageCode);
      if (fromGoogle) {
        recognizedText = fromGoogle;
        sttSource = 'google';
      }
    }
    if (!recognizedText) {
      recognizedText = mockRecognized(translatedForeign, languageCode, buf);
      sttSource = 'mock';
    }

    let reverseEnglish;
    if (GOOGLE_KEY) {
      try {
        reverseEnglish = await googleTranslate(recognizedText, languageCode, 'en');
      } catch {
        reverseEnglish = await myMemoryTranslate(recognizedText, `${languageCode}|en`);
      }
    } else {
      reverseEnglish = await myMemoryTranslate(recognizedText, `${languageCode}|en`);
    }

    res.json({
      recognizedText,
      reverseEnglish: normalizeTranslationText(String(reverseEnglish ?? '')),
      closenessScore: null,
      sttSource,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'process_failed' });
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
