import { getPipelineBaseUrl } from '@/lib/env';
import { Platform } from 'react-native';

/** Lightweight events: dev console + optional POST to hosted API (LOG_ANALYTICS=1 on server). */
export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (__DEV__) {
    console.log(`[analytics] ${name}`, props ?? {});
  }
  if (process.env.EXPO_PUBLIC_DISABLE_ANALYTICS === '1') return;
  const base = getPipelineBaseUrl();
  if (!base) return;
  void fetch(`${base}/analytics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: name,
      props: props ?? {},
      ts: Date.now(),
      platform: Platform.OS,
    }),
  }).catch(() => {});
}
