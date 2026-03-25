import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ScoreboardScreen() {
  const router = useRouter();
  const players = useGameStore((s) => s.players);
  const settings = useGameStore((s) => s.settings);
  const currentRound = useGameStore((s) => s.currentRound);
  const goScoreboardToNext = useGameStore((s) => s.goScoreboardToNext);

  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);

  const onNext = () => {
    goScoreboardToNext();
    const { phase } = useGameStore.getState();
    trackEvent('scoreboard_next', { phase });
    if (phase === 'summary') router.replace('/summary');
    else router.replace('/turn');
  };

  return (
    <Screen
      title="Scoreboard"
      subtitle={`After round ${currentRound} of ${settings.rounds}`}
      footer={
        <PrimaryButton
          title={currentRound >= settings.rounds ? 'Final summary' : 'Next round'}
          onPress={onNext}
        />
      }>
      <View style={styles.list}>
        {sorted.map((p, idx) => (
          <View
            key={p.id}
            style={[
              styles.row,
              idx === 0 && styles.rowFirst,
              idx === 1 && styles.rowSecond,
              idx === 2 && styles.rowThird,
            ]}>
            <Text style={[styles.rank, idx === 0 && styles.rankLead]}>{idx + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, idx === 0 && styles.nameLead]}>{p.name}</Text>
              {p.teamId ? (
                <Text style={styles.team}>Team {p.teamId.toUpperCase()}</Text>
              ) : null}
            </View>
            <Text style={[styles.pts, idx === 0 && styles.ptsLead]}>{p.totalScore}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.party.card,
    padding: 14,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.party.borderSubtle,
  },
  rowFirst: { borderLeftWidth: 4, borderLeftColor: Colors.party.podiumGold },
  rowSecond: { borderLeftWidth: 4, borderLeftColor: Colors.party.podiumSilver },
  rowThird: { borderLeftWidth: 4, borderLeftColor: Colors.party.podiumBronze },
  rank: { color: Colors.party.textMuted, fontWeight: '800', width: 26, fontSize: 15 },
  rankLead: { color: Colors.party.podiumGold, fontSize: 17 },
  name: { color: Colors.party.text, fontSize: 17, fontWeight: '700' },
  nameLead: { fontSize: 18 },
  team: { color: Colors.party.textMuted, fontSize: 12, marginTop: 2 },
  pts: { color: Colors.party.success, fontSize: 18, fontWeight: '900' },
  ptsLead: { fontSize: 22 },
});
