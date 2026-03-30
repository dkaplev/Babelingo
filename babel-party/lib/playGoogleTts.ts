import { audioModePlaybackSpeaker } from '@/lib/audioMode';
import { getPipelineBaseUrl } from '@/lib/env';
import { Audio, PitchCorrectionQuality } from 'expo-av';
import {
  cacheDirectory,
  deleteAsync,
  writeAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export function useGoogleCloudTts(): boolean {
  return (
    process.env.EXPO_PUBLIC_USE_GOOGLE_TTS === '1' ||
    process.env.EXPO_PUBLIC_USE_GOOGLE_TTS === 'true'
  );
}

type ActiveTts = { sound: Audio.Sound; path: string };
let activeTts: ActiveTts | null = null;

/** Slider maps to real-time playback speed (expo-av), not only Google synthesis. */
export function clampPipelinePlaybackRate(r: number): number {
  if (Number.isNaN(r)) return 1;
  return Math.min(1, Math.max(0.25, r));
}

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

async function prepareSoundPlaybackRate(sound: Audio.Sound, playbackRate: number): Promise<void> {
  const r = clampPipelinePlaybackRate(playbackRate);
  if (r === 1) return;
  try {
    await sound.setRateAsync(r, true, PitchCorrectionQuality.Medium);
  } catch {
    /* Web or older Android may not support rate; caller may use server-side speakingRate on web */
  }
}

async function waitUntilSoundFinishes(sound: Audio.Sound): Promise<void> {
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
}

/**
 * Synthesize via pipeline (Google MP3) and play through the loudspeaker.
 * iOS/Android: audio is generated near normal speed, then **timestretched** with expo-av `setRateAsync`
 * so the slider always changes what you hear.
 * Web: `setRateAsync` is unreliable — we pass `speakingRate` to `/tts` instead.
 */
export async function playGoogleTts(
  text: string,
  languageBcp47: string,
  opts?: { playbackRate?: number },
): Promise<void> {
  const base = getPipelineBaseUrl();
  if (!base) throw new Error('missing_pipeline_url');
  await stopPipelineTtsPlayback();

  const playbackRate = clampPipelinePlaybackRate(opts?.playbackRate ?? 1);
  const body: { text: string; languageCode: string; speakingRate?: number } = {
    text,
    languageCode: languageBcp47,
  };
  if (Platform.OS === 'web') {
    body.speakingRate = playbackRate;
  }

  const res = await fetch(`${base}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
    { shouldPlay: false, volume: 1, isMuted: false },
  );
  try {
    await sound.setVolumeAsync(1);
  } catch {
    /* ignore */
  }

  if (Platform.OS !== 'web') {
    await prepareSoundPlaybackRate(sound, playbackRate);
  }
  await sound.playAsync();

  activeTts = { sound, path };
  try {
    await waitUntilSoundFinishes(sound);
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

/**
 * Play pipeline WAV (e.g. reversed TTS). Same playback-rate rules as `playGoogleTts`.
 * Step 2 (user clip reversed) should pass `playbackRate: 1`.
 */
export async function playPipelineWavBase64(
  audioContentWavBase64: string,
  opts?: { playbackRate?: number },
): Promise<void> {
  const base = getPipelineBaseUrl();
  if (!base) throw new Error('missing_pipeline_url');
  await stopPipelineTtsPlayback();

  const playbackRate = clampPipelinePlaybackRate(opts?.playbackRate ?? 1);

  const dir = cacheDirectory;
  if (!dir) throw new Error('no_cache_directory');

  const path = `${dir}babel-wav-${Date.now()}.wav`;
  await writeAsStringAsync(path, audioContentWavBase64, { encoding: EncodingType.Base64 });
  await audioModePlaybackSpeaker();

  const { sound } = await Audio.Sound.createAsync(
    { uri: path },
    { shouldPlay: false, volume: 1, isMuted: false },
  );

  if (Platform.OS !== 'web') {
    await prepareSoundPlaybackRate(sound, playbackRate);
  }
  await sound.playAsync();

  activeTts = { sound, path };
  try {
    await waitUntilSoundFinishes(sound);
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

export async function fetchTtsReversedWavBase64(
  text: string,
  opts?: { speakingRate?: number },
): Promise<string> {
  const base = getPipelineBaseUrl();
  if (!base) throw new Error('missing_pipeline_url');
  const body: { text: string; speakingRate?: number } = { text };
  if (opts?.speakingRate != null) body.speakingRate = opts.speakingRate;
  const res = await fetch(`${base.replace(/\/$/, '')}/tts-reversed-wav`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
