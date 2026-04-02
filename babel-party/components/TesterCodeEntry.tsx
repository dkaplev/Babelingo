import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import {
  devSessionPassUnlockEnabled,
  getPaywallBackdoorCode,
  tryPaywallBackdoorCode,
} from '@/lib/purchases';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  onCodeApplied?: () => void;
  variant?: 'paywall' | 'standalone';
  /** When false, parent should not render this block at all */
  busy?: boolean;
};

export function TesterCodeEntry({ onCodeApplied, variant = 'standalone', busy = false }: Props) {
  const [testerCode, setTesterCode] = useState('');
  const backdoor = getPaywallBackdoorCode();
  const dev = devSessionPassUnlockEnabled();

  const apply = () => {
    const t = testerCode.trim();
    if (!t) return;
    if (tryPaywallBackdoorCode(t)) {
      setTesterCode('');
      onCodeApplied?.();
      Alert.alert('Unlocked', 'Full session access is active on this device.');
    } else {
      Alert.alert('Code not recognized', 'Double-check spelling and caps.');
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        {variant === 'paywall' ? 'Tester code' : 'Enter tester code'}
      </Text>
      {backdoor ? (
        <>
          <Text style={styles.sub}>
            {variant === 'standalone'
              ? 'Same code works on the paywall (locked game or fourth player).'
              : 'Unlocks this session’s full modes and player limits on this device.'}
          </Text>
          <TextInput
            value={testerCode}
            onChangeText={setTesterCode}
            placeholder="Type code, then Apply"
            placeholderTextColor={Colors.party.textMuted}
            style={styles.codeInput}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
          />
          <Pressable
            onPress={apply}
            disabled={busy || !testerCode.trim()}
            style={styles.applyWrap}>
            <Text style={[styles.apply, (!testerCode.trim() || busy) && styles.applyDisabled]}>Apply code</Text>
          </Pressable>
        </>
      ) : null}
      {!backdoor && dev ? (
        <Text style={styles.devNote}>
          Dev build: open any paywall (locked mode or fourth player) and tap Unlock — no purchase required.
        </Text>
      ) : null}
      {!backdoor && !dev ? (
        <Text style={styles.missingNote}>
          This install does not include an embedded tester code. Add EXPO_PUBLIC_PAYWALL_BACKDOOR_CODE to your EAS
          build environment (same value you share with testers), create a new binary, then enter the code here or on the
          paywall. Purchases use the Unlock button below.
        </Text>
      ) : null}
      {dev && backdoor ? (
        <Text style={styles.devNoteSmall}>Dev: the paywall Unlock shortcut still works too.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  title: {
    fontFamily: Font.title,
    fontSize: 17,
    color: Colors.party.accentPop,
  },
  sub: {
    fontFamily: Font.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.party.textMuted,
  },
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
  applyWrap: { alignSelf: 'flex-start', paddingVertical: 4 },
  apply: {
    fontFamily: Font.bodyBold,
    fontSize: 15,
    color: Colors.party.accent2,
    textDecorationLine: 'underline',
  },
  applyDisabled: { opacity: 0.4 },
  devNote: {
    fontFamily: Font.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.party.accent2,
  },
  devNoteSmall: {
    fontFamily: Font.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.party.textMuted,
  },
  missingNote: {
    fontFamily: Font.body,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.party.textMuted,
  },
});
