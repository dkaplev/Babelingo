import { PrimaryButton } from '@/components/PrimaryButton';
import { TesterCodeEntry } from '@/components/TesterCodeEntry';
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
  grantSessionPassForDevTesting,
  purchaseSessionPassWithReceipt,
  showTesterUi,
} from '@/lib/purchases';
import { useSessionEntitlementsStore } from '@/lib/sessionEntitlementsStore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  const showTester = showTesterUi();

  useEffect(() => {
    if (!visible) setBusy(false);
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
          <ScrollView
            style={{ maxHeight: Dimensions.get('window').height * 0.88 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <Text style={styles.headline}>Unlock the full chaos</Text>
            {showTester ? (
              <View style={styles.testerSection}>
                <TesterCodeEntry
                  variant="paywall"
                  busy={busy}
                  onCodeApplied={() => {
                    onUnlocked?.();
                    onClose();
                  }}
                />
              </View>
            ) : null}
            <Text style={styles.check}>✓ All 3 game modes</Text>
            <Text style={styles.check}>✓ Mayhem vibe</Text>
            <Text style={styles.check}>✓ Up to 8 players + full 7 rounds (this session)</Text>
            <Text style={styles.price}>$3.99 for this session</Text>
            <Text style={styles.split}>Split 4 ways? That&apos;s less than a queueing drink.</Text>
            <Text style={styles.legal}>
              Payment charged to your Apple ID account at confirmation. Purchases are validated on Babelingo servers.
            </Text>
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
          </ScrollView>
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
    marginBottom: 4,
  },
  testerSection: {
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.party.borderSubtle,
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
