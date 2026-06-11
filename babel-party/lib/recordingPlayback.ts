import { audioModePlaybackSpeaker } from '@/lib/audioMode';
import { Audio, type AVPlaybackStatus } from 'expo-av';

/** Typical pipeline latency — play replay only when clip fits inside this window. */
export const EXPECTED_PIPELINE_MS = 4500;

/** Minimum chaos to show a round-end chaos award on the scoreboard. */
export const CHAOS_AWARD_THRESHOLD = 55;

export function shouldReplayRecordingDuringProcessing(durationSec: number | null | undefined): boolean {
  if (!durationSec || durationSec <= 0) return false;
  return durationSec * 1000 <= EXPECTED_PIPELINE_MS;
}

/** Play a recording to completion; resolves when playback finishes or errors. */
export async function playRecordingToCompletion(uri: string): Promise<void> {
  await audioModePlaybackSpeaker();
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false, volume: 1 });
  try {
    const initial = await sound.getStatusAsync();
    const fallbackMs =
      initial.isLoaded && initial.durationMillis != null ? initial.durationMillis + 400 : 8000;

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) finish();
      });
      void sound.playAsync().catch(finish);
      setTimeout(finish, fallbackMs);
    });
  } finally {
    await sound.unloadAsync().catch(() => {});
  }
}
