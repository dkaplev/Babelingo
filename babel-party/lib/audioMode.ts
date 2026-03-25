import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

/**
 * Loudspeaker + media playback. iOS: avoid MixWithOthers routing TTS to earpiece when
 * recording was active; we still use allowsRecordingIOS: false for playback.
 * Android: DuckOthers avoids DoNotMix blocking expo-speech / AV playback.
 */
export async function audioModePlaybackSpeaker(): Promise<void> {
  await Audio.setIsEnabledAsync(true);
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
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
