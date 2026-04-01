import { getPipelineBaseUrl } from '@/lib/env';
import { Platform } from 'react-native';

let anonSessionId = '';

function sessionId(): string {
  if (!anonSessionId) {
    anonSessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
  return anonSessionId;
}

/** Fire-and-forget product telemetry (F-12). Never await in gameplay paths. */
export function track(event: string, props?: Record<string, unknown>) {
  try {
    if (__DEV__) {
      console.log(`[analytics] ${event}`, props ?? {});
    }
    if (process.env.EXPO_PUBLIC_DISABLE_ANALYTICS === '1') return;
    const base = getPipelineBaseUrl();
    if (!base) return;
    void fetch(`${base.replace(/\/$/, '')}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        props: { ...props, session_id: sessionId() },
        ts: Date.now(),
        platform: Platform.OS,
      }),
    }).catch(() => {});
  } catch {
    /* never break the game */
  }
}

/** @deprecated Prefer named track* helpers below; kept for gradual migration. */
export const trackEvent = track;

export function trackAppOpen(firstLaunch: boolean) {
  track('app_open', { first_launch: firstLaunch });
}

export function trackDemoStarted() {
  track('demo_started', { demo: true });
}

export function trackDemoCompleted(chaosScore: number) {
  track('demo_completed', { chaos_score: chaosScore, demo: true });
}

export function trackRoomCreated(payload: {
  mode: string;
  vibe: string;
  player_count: number;
  is_solo: boolean;
}) {
  track('room_created', payload);
}

export function trackSessionCompleted(payload: {
  mode: string;
  vibe: string;
  rounds_played: number;
  total_chaos: number;
}) {
  track('session_completed', payload);
}

export function trackSharePosterTapped(chaosScore: number, theme: string) {
  track('share_poster_tapped', { chaos_score: chaosScore, theme });
}

export function trackPaywallShown(triggerPoint: string, paywallVariant?: string) {
  track('paywall_shown', { trigger_point: triggerPoint, paywall_variant: paywallVariant ?? 'default' });
}

export function trackPaywallDismissed() {
  track('paywall_dismissed');
}

export function trackPurchaseStarted() {
  track('purchase_started');
}

export function trackPurchaseCompleted(revenueUsd: number) {
  track('purchase_completed', { revenue_usd: revenueUsd });
}

export function trackPurchaseFailed(errorCode: string) {
  track('purchase_failed', { error_code: errorCode });
}

export function trackChallengeLinkSent(mode: string) {
  track('challenge_link_sent', { mode });
}
