import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Platform } from 'react-native';

/**
 * Playback-only session: `AVAudioSessionCategoryPlayback` on iOS (no PlayAndRecord),
 * so expo-speech / speaker output routes to the loudspeaker, not the earpiece.
 * Re-applies after a short delay so the session wins over any stale recording state.
 */
const playbackMode = {
  allowsRecordingIOS: false,
  playsInSilentModeIOS: true,
  staysActiveInBackground: false,
  /** DoNotMix → Playback + no mix; avoids earpiece routing seen with DuckOthers after record. */
  interruptionModeIOS: InterruptionModeIOS.DoNotMix,
  interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
} as const;

export async function audioModePlaybackSpeaker(): Promise<void> {
  await Audio.setIsEnabledAsync(true);
  await Audio.setAudioModeAsync(playbackMode);
  await new Promise((r) => setTimeout(r, Platform.OS === 'ios' ? 70 : 35));
  await Audio.setAudioModeAsync(playbackMode);
  await new Promise((r) => setTimeout(r, Platform.OS === 'ios' ? 130 : 55));
}

/** Call before starting a microphone recording. */
export async function audioModeRecording(): Promise<void> {
  await Audio.setIsEnabledAsync(true);
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}
