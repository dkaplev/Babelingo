import { audioModePlaybackSpeaker } from '@/lib/audioMode';
import { getPipelineBaseUrl } from '@/lib/env';
import { Audio } from 'expo-av';
import {
  cacheDirectory,
  deleteAsync,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';

export function useGoogleCloudTts(): boolean {
  return (
    process.env.EXPO_PUBLIC_USE_GOOGLE_TTS === '1' ||
    process.env.EXPO_PUBLIC_USE_GOOGLE_TTS === 'true'
  );
}

type ActiveTts = { sound: Audio.Sound; path: string };
let activeTts: ActiveTts | null = null;

/** Stop server TTS playback (e.g. before recording) so audio does not bleed into the mic phase. */
export async function stopPipelineTtsPlayback(): Promise<void> {
  const cur = activeTts;
  activeTts = null;
  if (!cur) return;
  try {
    const st = await cur.sound.getStatusAsync();
    if (st.isLoaded) await cur.sound.stopAsync();
  } catch {
    /* ignore */
  }
  try {
    await cur.sound.unloadAsync();
  } catch {
    /* ignore */
  }
  try {
    await deleteAsync(cur.path, { idempotent: true });
  } catch {
    /* ignore */
  }
}

/** Synthesize via API (Google Cloud TTS) and play through the loudspeaker. */
export async function playGoogleTts(text: string, languageBcp47: string): Promise<void> {
  const base = getPipelineBaseUrl();
  if (!base) throw new Error('missing_pipeline_url');
  await stopPipelineTtsPlayback();

  const res = await fetch(`${base}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, languageCode: languageBcp47 }),
  });
  if (!res.ok) throw new Error(`tts_http_${res.status}`);
  const data = (await res.json()) as { audioContent?: string; error?: string };
  if (!data.audioContent) throw new Error(data.error ?? 'no_audio');

  const dir = cacheDirectory;
  if (!dir) throw new Error('no_cache_directory');

  const path = `${dir}babel-tts-${Date.now()}.mp3`;
  await writeAsStringAsync(path, data.audioContent, { encoding: EncodingType.Base64 });
  await audioModePlaybackSpeaker();

  const { sound } = await Audio.Sound.createAsync(
    { uri: path },
    { shouldPlay: true, volume: 1, isMuted: false },
  );
  try {
    await sound.setVolumeAsync(1);
  } catch {
    /* ignore */
  }

  activeTts = { sound, path };
  try {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('tts_playback_timeout')), 120_000);
      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;
        if (s.didJustFinish) {
          clearTimeout(t);
          resolve();
        }
      });
    });
  } finally {
    if (activeTts?.sound === sound) activeTts = null;
    try {
      await sound.unloadAsync();
    } catch {
      /* ignore */
    }
    try {
      await deleteAsync(path, { idempotent: true });
    } catch {
      /* ignore */
    }
  }
}

/** Play a mono PCM WAV returned as base64 from the pipeline (Reverse Audio). */
export async function playPipelineWavBase64(audioContentWavBase64: string): Promise<void> {
  const base = getPipelineBaseUrl();
  if (!base) throw new Error('missing_pipeline_url');
  await stopPipelineTtsPlayback();

  const dir = cacheDirectory;
  if (!dir) throw new Error('no_cache_directory');

  const path = `${dir}babel-wav-${Date.now()}.wav`;
  await writeAsStringAsync(path, audioContentWavBase64, { encoding: EncodingType.Base64 });
  await audioModePlaybackSpeaker();

  const { sound } = await Audio.Sound.createAsync(
    { uri: path },
    { shouldPlay: true, volume: 1, isMuted: false },
  );
  activeTts = { sound, path };
  try {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('wav_playback_timeout')), 120_000);
      sound.setOnPlaybackStatusUpdate((s) => {
        if (!s.isLoaded) return;
        if (s.didJustFinish) {
          clearTimeout(t);
          resolve();
        }
      });
    });
  } finally {
    if (activeTts?.sound === sound) activeTts = null;
    try {
      await sound.unloadAsync();
    } catch {
      /* ignore */
    }
    try {
      await deleteAsync(path, { idempotent: true });
    } catch {
      /* ignore */
    }
  }
}

export async function fetchTtsReversedWavBase64(text: string): Promise<string> {
  const base = getPipelineBaseUrl();
  if (!base) throw new Error('missing_pipeline_url');
  const res = await fetch(`${base.replace(/\/$/, '')}/tts-reversed-wav`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`tts_reversed_${res.status}`);
  const data = (await res.json()) as { audioContentWavBase64?: string };
  if (!data.audioContentWavBase64) throw new Error('no_wav');
  return data.audioContentWavBase64;
}

export async function fetchReverseRecordingWavBase64(recordingUri: string): Promise<string> {
  const base = getPipelineBaseUrl();
  if (!base) throw new Error('missing_pipeline_url');
  const form = new FormData();
  const name = recordingUri.split('/').pop() ?? 'clip.wav';
  const type = name.endsWith('.wav') ? 'audio/wav' : 'audio/wav';
  form.append('audio', { uri: recordingUri, name, type } as never);
  const res = await fetch(`${base.replace(/\/$/, '')}/reverse-audio-wav`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`reverse_wav_${res.status}`);
  const data = (await res.json()) as { audioContentWavBase64?: string };
  if (!data.audioContentWavBase64) throw new Error('no_wav');
  return data.audioContentWavBase64;
}
