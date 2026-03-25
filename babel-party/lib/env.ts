/** Production API (Render / Fly / Cloud Run / Railway). No trailing slash. */
export function getPipelineBaseUrl(): string | undefined {
  const raw = process.env.EXPO_PUBLIC_PIPELINE_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;
  return raw?.replace(/\/$/, '') || undefined;
}
