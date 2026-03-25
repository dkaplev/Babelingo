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

/** Synthesize via babel-party-server (Google Cloud TTS) and play through the loudspeaker. */
export async function playGoogleTts(text: string, languageBcp47: string): Promise<void> {
  const base = getPipelineBaseUrl();
  if (!base) throw new Error('missing_pipeline_url');
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
    await sound.unloadAsync();
    try {
      await deleteAsync(path, { idempotent: true });
    } catch {
      /* ignore */
    }
  }
}
