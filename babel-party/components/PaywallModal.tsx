import { PrimaryButton } from '@/components/PrimaryButton';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import {
  trackPaywallDismissed,
  trackPaywallShown,
  trackPurchaseCompleted,
  trackPurchaseFailed,
  trackPurchaseStarted,
} from '@/lib/analytics';
import {
  devSessionPassUnlockEnabled,
  getPaywallBackdoorCode,
  grantSessionPassForDevTesting,
  purchaseSessionPassWithReceipt,
  tryPaywallBackdoorCode,
} from '@/lib/purchases';
import { useSessionEntitlementsStore } from '@/lib/sessionEntitlementsStore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  triggerPoint: string;
  onClose: () => void;
  onUnlocked?: () => void;
};

export function PaywallModal({ visible, triggerPoint, onClose, onUnlocked }: Props) {
  const paywallVariant = useSessionEntitlementsStore((s) => s.paywallVariant);
  const [busy, setBusy] = useState(false);
  const [testerCode, setTesterCode] = useState('');
  const backdoorCodeConfigured = Boolean(getPaywallBackdoorCode());

  useEffect(() => {
    if (!visible) {
      setBusy(false);
      setTesterCode('');
    }
  }, [visible]);

  useEffect(() => {
    if (visible) trackPaywallShown(triggerPoint, paywallVariant);
  }, [visible, triggerPoint, paywallVariant]);

  const onUnlock = async () => {
    trackPurchaseStarted();
    setBusy(true);
    try {
      if (devSessionPassUnlockEnabled()) {
        grantSessionPassForDevTesting();
        trackPurchaseCompleted(3.99);
        onUnlocked?.();
        onClose();
        return;
      }
      const r = await purchaseSessionPassWithReceipt('');
      if (r.ok) {
        trackPurchaseCompleted(3.99);
        onUnlocked?.();
        onClose();
      } else {
        trackPurchaseFailed(r.errorCode ?? String(r.errorMessage).slice(0, 120));
        Alert.alert('Could not unlock', r.errorMessage);
      }
    } finally {
      setBusy(false);
    }
  };

  const onMaybeLater = () => {
    trackPaywallDismissed();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onMaybeLater}>
      <Pressable style={styles.backdrop} onPress={onMaybeLater}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.headline}>Unlock the full chaos</Text>
          <Text style={styles.check}>✓ All 3 game modes</Text>
          <Text style={styles.check}>✓ Mayhem vibe</Text>
          <Text style={styles.check}>✓ Up to 8 players + full 7 rounds (this session)</Text>
          <Text style={styles.price}>$3.99 for this session</Text>
          <Text style={styles.split}>Split 4 ways? That&apos;s less than a queueing drink.</Text>
          <Text style={styles.legal}>
            Payment charged to your Apple ID account at confirmation. Purchases are validated on Babelingo servers.
          </Text>
          {devSessionPassUnlockEnabled() ? (
            <Text style={styles.devHint}>Dev: EXPO_PUBLIC_DEV_SESSION_PASS unlocks without StoreKit.</Text>
          ) : null}
          {backdoorCodeConfigured ? (
            <View style={styles.testerBlock}>
              <Text style={styles.devHint}>TestFlight / internal: enter tester code</Text>
              <TextInput
                value={testerCode}
                onChangeText={setTesterCode}
                placeholder="Session code"
                placeholderTextColor={Colors.party.textMuted}
                style={styles.codeInput}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
              />
              <Pressable
                onPress={() => {
                  const t = testerCode.trim();
                  if (!t) return;
                  if (tryPaywallBackdoorCode(t)) {
                    setTesterCode('');
                    onUnlocked?.();
                    onClose();
                    Alert.alert('Unlocked', 'Full session access is active on this device.');
                  } else {
                    Alert.alert('Code not recognized', 'Double-check the value from your host.');
                  }
                }}
                disabled={busy || !testerCode.trim()}
                style={styles.testerApplyWrap}>
                <Text style={[styles.testerApply, (!testerCode.trim() || busy) && styles.testerApplyDisabled]}>
                  Apply tester code
                </Text>
              </Pressable>
            </View>
          ) : null}
          <PrimaryButton
            title={busy ? 'Working…' : 'Unlock now — $3.99'}
            onPress={() => void onUnlock()}
            disabled={busy}
          />
          {busy ? <ActivityIndicator color={Colors.party.accent} style={{ marginTop: 12 }} /> : null}
          <Pressable onPress={onMaybeLater} style={styles.secondaryWrap}>
            <Text style={styles.secondary}>Maybe later</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert(
                'Restore purchases',
                'Connects to Apple with a receipt from this device. Requires a TestFlight or App Store build with in-app purchase configured.',
              )
            }>
            <Text style={styles.restore}>Restore purchases</Text>
          </Pressable>
          <Text style={styles.variantTag}>variant: {paywallVariant}</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.party.surface2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
    gap: 10,
  },
  headline: {
    fontFamily: Font.title,
    fontSize: 22,
    color: Colors.party.accentPop,
    marginBottom: 6,
  },
  check: { fontFamily: Font.body, fontSize: 16, color: Colors.party.text, lineHeight: 24 },
  price: {
    fontFamily: Font.title,
    fontSize: 28,
    color: Colors.party.text,
    marginTop: 12,
  },
  split: {
    fontFamily: Font.body,
    fontSize: 15,
    color: Colors.party.textMuted,
    lineHeight: 22,
  },
  legal: {
    fontFamily: Font.body,
    fontSize: 11,
    color: Colors.party.textMuted,
    lineHeight: 16,
    marginTop: 4,
  },
  devHint: {
    fontFamily: Font.bodyBold,
    fontSize: 12,
    color: Colors.party.accent2,
  },
  testerBlock: { gap: 8, marginTop: 4 },
  codeInput: {
    fontFamily: Font.body,
    fontSize: 16,
    color: Colors.party.text,
    backgroundColor: Colors.party.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.party.neonStroke,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  testerApplyWrap: { alignSelf: 'flex-start', paddingVertical: 4 },
  testerApply: {
    fontFamily: Font.bodyBold,
    fontSize: 14,
    color: Colors.party.accent2,
    textDecorationLine: 'underline',
  },
  testerApplyDisabled: { opacity: 0.4 },
  secondaryWrap: { alignSelf: 'center', paddingVertical: 12 },
  secondary: { fontFamily: Font.body, fontSize: 15, color: Colors.party.textMuted },
  restore: {
    fontFamily: Font.body,
    fontSize: 13,
    color: Colors.party.accent2,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  variantTag: {
    fontFamily: Font.body,
    fontSize: 10,
    color: Colors.party.textMuted,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
});
