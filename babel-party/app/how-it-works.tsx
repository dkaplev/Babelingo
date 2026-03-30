import { BackLink } from '@/components/BackLink';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { StyleSheet, Text, View } from 'react-native';

const steps = [
  'Use one shared phone and pass it to whoever is up. Let them finish their turn before you take it back — no peeking at answers meant for later.',
  'Keep the room loud and kind: hype messy tries, laugh at the weird sounds, and save quiet judging for after the round.',
  'Use replays when the game offers them — rushing someone who is still listening usually kills the joke.',
  'Take short breaks between rounds (drinks, stretch, swap seats) so the group stays engaged for the whole night.',
];

export default function HowItWorksScreen() {
  return (
    <Screen
      title="How it works"
      subtitle="General tips for any Babelingo game — Echo, Babel Phone, or Reverse Audio.">
      <BackLink fallbackHref="/" />
      <View style={styles.list}>
        {steps.map((s, i) => (
          <View key={i} style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{i + 1}</Text>
            </View>
            <Text style={styles.step}>{s}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>
        Tip: when the room is stuck on a rule, read the quick rules on round 1 together — then play first and argue later.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.party.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.party.neonStroke,
  },
  badgeText: { fontFamily: Font.bodyBold, color: '#fff', fontSize: 15 },
  step: { flex: 1, fontFamily: Font.body, color: Colors.party.text, fontSize: 17, lineHeight: 26 },
  note: { fontFamily: Font.body, marginTop: 28, color: Colors.party.textMuted, fontSize: 15, lineHeight: 24 },
});
