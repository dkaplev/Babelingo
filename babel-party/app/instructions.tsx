import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function InstructionsScreen() {
  const router = useRouter();
  const beginRound = useGameStore((s) => s.beginRound);

  return (
    <Screen
      title="Quick rules"
      subtitle="Pass the phone to the active player when it’s their turn."
      footer={
        <PrimaryButton
          title="We’re ready — deal the chaos"
          onPress={() => {
            beginRound();
            trackEvent('instructions_continue');
            router.replace('/turn');
          }}
        />
      }>
      <View style={styles.card}>
        <View style={styles.ruleRow}>
          <View style={styles.ruleNumWrap}>
            <Text style={styles.ruleNum}>1</Text>
          </View>
          <Text style={styles.rule}>
            Tap play to hear the foreign line — up to three replays, or skip when you are ready to say it.
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.ruleRow}>
          <View style={styles.ruleNumWrap}>
            <Text style={styles.ruleNum}>2</Text>
          </View>
          <Text style={styles.rule}>Record your impression. Rough and loud beats perfect and quiet.</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.ruleRow}>
          <View style={styles.ruleNumWrap}>
            <Text style={styles.ruleNum}>3</Text>
          </View>
          <Text style={styles.rule}>We transcribe and translate back — then the room sees the reveal.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.party.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
  },
  ruleRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  ruleNumWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.party.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.party.neonStroke,
  },
  ruleNum: { fontFamily: Font.bodyBold, color: '#fff', fontSize: 15 },
  rule: { flex: 1, fontFamily: Font.body, color: Colors.party.text, fontSize: 17, lineHeight: 26 },
  divider: {
    height: 2,
    backgroundColor: Colors.party.borderSubtle,
    marginVertical: 14,
    marginLeft: 44,
  },
});
