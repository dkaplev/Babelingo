import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
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
        <Text style={styles.rule}>
          1. Tap play to hear the foreign phrase — up to three replays, or skip early when you are ready.
        </Text>
        <Text style={styles.rule}>2. Record your best impression. Messy is fine.</Text>
        <Text style={styles.rule}>3. We transcribe & translate back for the reveal.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.party.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  rule: { color: Colors.party.text, fontSize: 16, lineHeight: 22 },
});
