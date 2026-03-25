import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SummaryScreen() {
  const router = useRouter();
  const resetSession = useGameStore((s) => s.resetSession);
  const players = useGameStore((s) => s.players);
  const results = useGameStore((s) => s.results);

  const winner = useMemo(() => [...players].sort((a, b) => b.totalScore - a.totalScore)[0], [players]);

  const funniest = useMemo(
    () =>
      [...results].sort((a, b) => a.closenessScore - b.closenessScore || b.reverseEnglish.length - a.reverseEnglish.length)[0],
    [results],
  );

  const closest = useMemo(
    () => [...results].sort((a, b) => b.closenessScore - a.closenessScore)[0],
    [results],
  );

  return (
    <Screen
      title="That’s a wrap"
      subtitle="Moments worth saving — the weird English only gets better each game."
      footer={
        <View style={{ gap: 10 }}>
          <PrimaryButton
            title="Play again"
            onPress={() => {
              trackEvent('summary_replay');
              resetSession();
              router.replace('/create-room');
            }}
          />
          <PrimaryButton variant="ghost" title="Home" onPress={() => {
            resetSession();
            router.replace('/');
          }} />
        </View>
      }>
      {winner ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>Winner</Text>
          <Text style={styles.hero}>{winner.name}</Text>
          <Text style={styles.sub}>{winner.totalScore} total points</Text>
        </View>
      ) : null}

      {funniest ? (
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.kicker}>Chaos award</Text>
          <Text style={styles.body}>“{funniest.reverseEnglish}”</Text>
          <Text style={styles.sub}>— {funniest.playerName}</Text>
        </View>
      ) : null}

      {closest && closest.closenessScore > 0 ? (
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.kicker}>Closest round</Text>
          <Text style={styles.body}>“{closest.reverseEnglish}”</Text>
          <Text style={styles.sub}>— {closest.playerName} ({closest.closenessScore}/3 closeness)</Text>
        </View>
      ) : null}

      <Text style={styles.footerNote}>
        Cast or mirror the reveal — big type and high contrast are built in for the room.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.party.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.party.borderSubtle,
  },
  kicker: {
    color: Colors.party.accent2,
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hero: { color: Colors.party.text, fontSize: 28, fontWeight: '900', marginTop: 8 },
  body: { color: Colors.party.text, fontSize: 16, lineHeight: 24, marginTop: 8, fontStyle: 'italic' },
  sub: { color: Colors.party.textMuted, marginTop: 10, fontSize: 14, lineHeight: 20 },
  footerNote: { marginTop: 28, color: Colors.party.textMuted, fontSize: 13, lineHeight: 20 },
});
