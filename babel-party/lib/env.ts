/** Production API (Render / Fly / Cloud Run / Railway). No trailing slash. */
export function getPipelineBaseUrl(): string | undefined {
  const raw = process.env.EXPO_PUBLIC_PIPELINE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;
  return raw?.replace(/\/$/, '') || undefined;
}

/** When set, skip server /tts and use device expo-speech for the foreign phrase only. */
export function forceDevicePhraseTts(): boolean {
  return (
    process.env.EXPO_PUBLIC_FORCE_DEVICE_PHRASE_TTS === '1' ||
    process.env.EXPO_PUBLIC_FORCE_DEVICE_PHRASE_TTS === 'true'
  );
}
