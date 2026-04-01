import { Audio } from 'expo-av';

export type RecordingOk = { ok: true };
export type RecordingErr = { ok: false; code: RecordingErrorCode; message: string };

export type RecordingResult = RecordingOk | RecordingErr;

export type RecordingErrorCode =
  | 'permission_denied'
  | 'prepare_failed'
  | 'start_failed'
  | 'stop_failed'
  | 'unknown';

export async function requestMicrophonePermission(): Promise<RecordingResult> {
  try {
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) {
      return { ok: false, code: 'permission_denied', message: 'Microphone access is off for Babelingo.' };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      code: 'unknown',
      message: e instanceof Error ? e.message : 'Could not check microphone permission.',
    };
  }
}
