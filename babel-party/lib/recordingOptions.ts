import {
  AndroidAudioEncoder,
  AndroidOutputFormat,
  IOSAudioQuality,
  IOSOutputFormat,
} from 'expo-av/build/Audio/RecordingConstants';
import type { RecordingOptions } from 'expo-av/build/Audio/Recording.types';

/**
 * 16 kHz mono LINEAR16 WAV (iOS) / best-effort WAV (Android) for Google Speech-to-Text.
 */
export const RECORDING_OPTIONS_GOOGLE_STT: RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.wav',
    outputFormat: AndroidOutputFormat.DEFAULT,
    audioEncoder: AndroidAudioEncoder.DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};
