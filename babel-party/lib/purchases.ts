import { getPipelineBaseUrl } from '@/lib/env';
import {
  SESSION_PASS_PRODUCT_ID,
  useSessionEntitlementsStore,
} from '@/lib/sessionEntitlementsStore';
import { Platform } from 'react-native';

export type PurchaseAttemptResult =
  | { ok: true }
  | { ok: false; errorMessage: string; errorCode?: string };

/**
 * Validates receipt with babel-party-server (Apple verifyReceipt).
 * Call with base64 receipt from StoreKit once native IAP is wired (TestFlight / App Store).
 */
export async function validateReceiptOnServer(receiptData: string): Promise<PurchaseAttemptResult> {
  const base = getPipelineBaseUrl();
  if (!base) {
    return { ok: false, errorMessage: 'No API URL — set EXPO_PUBLIC_PIPELINE_URL.', errorCode: 'no_server' };
  }
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/validate-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptData, productId: SESSION_PASS_PRODUCT_ID }),
    });
    const data = (await res.json()) as { ok?: boolean; valid?: boolean; error?: string; status?: number };
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        errorMessage: data.error ?? 'Receipt validation failed',
        errorCode: data.status != null ? String(data.status) : undefined,
      };
    }
    if (!data.valid) {
      return { ok: false, errorMessage: 'This Apple ID has not purchased the session pass.', errorCode: 'not_found' };
    }
    useSessionEntitlementsStore.getState().setSessionPassActive(true);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      errorMessage: e instanceof Error ? e.message : 'Network error during validation',
      errorCode: 'network',
    };
  }
}

/**
 * Session pass purchase entry point. Native StoreKit flow should obtain `receiptData` then call
 * `validateReceiptOnServer`. Until IAP is linked in a dev client build, use EXPO_PUBLIC_DEV_SESSION_PASS=1
 * from PaywallModal for internal testing.
 */
export async function purchaseSessionPassWithReceipt(receiptData: string): Promise<PurchaseAttemptResult> {
  if (Platform.OS === 'web') {
    return { ok: false, errorMessage: 'In-app purchases are not available on web.', errorCode: 'web' };
  }
  return validateReceiptOnServer(receiptData);
}

export function devSessionPassUnlockEnabled(): boolean {
  return process.env.EXPO_PUBLIC_DEV_SESSION_PASS === '1' || process.env.EXPO_PUBLIC_DEV_SESSION_PASS === 'true';
}

export function grantSessionPassForDevTesting(): void {
  useSessionEntitlementsStore.getState().setSessionPassActive(true);
}
