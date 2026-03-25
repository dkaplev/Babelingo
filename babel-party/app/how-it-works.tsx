import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { StyleSheet, Text, View } from 'react-native';

const steps = [
  'You get a plain English line in the room, then hear it in a foreign language on the phone.',
  'Replay the audio up to three times, or stop early when you are ready to say it.',
  'Your imitation is transcribed and translated back to English for the reveal.',
  'The fun is normal words turning strange — then laugh and pass the phone.',
];

export default function HowItWorksScreen() {
  return (
    <Screen title="How it works" subtitle="Echo Translator in one shared device — fast, silly, social.">
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
        Tip: put the phone on speaker so the room can share the suspense before the reveal.
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
    borderColor: Colors.party.doodleInk,
  },
  badgeText: { fontFamily: Font.bodyBold, color: '#fff', fontSize: 15 },
  step: { flex: 1, fontFamily: Font.body, color: Colors.party.text, fontSize: 17, lineHeight: 26 },
  note: { fontFamily: Font.body, marginTop: 28, color: Colors.party.textMuted, fontSize: 15, lineHeight: 24 },
});
