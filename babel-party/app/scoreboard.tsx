import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { computeTeamTotals } from '@/lib/teamScores';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ScoreboardScreen() {
  const router = useRouter();
  const players = useGameStore((s) => s.players);
  const settings = useGameStore((s) => s.settings);
  const currentRound = useGameStore((s) => s.currentRound);
  const goScoreboardToNext = useGameStore((s) => s.goScoreboardToNext);

  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const teamTotals = useMemo(() => computeTeamTotals(players), [players]);

  const onNext = () => {
    goScoreboardToNext();
    const { phase } = useGameStore.getState();
    trackEvent('scoreboard_next', { phase });
    if (phase === 'summary') router.replace('/summary');
    else if (phase === 'round_intro') router.replace('/round-intro');
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
      {settings.teamsEnabled && teamTotals ? (
        <View style={styles.teamBanner}>
          <Text style={styles.teamBannerTitle}>Team totals</Text>
          <View style={styles.teamRow}>
            <View style={styles.teamCol}>
              <Text style={styles.teamLabel}>Team A</Text>
              <Text style={styles.teamPts}>{teamTotals.teamA}</Text>
            </View>
            <Text style={styles.teamVs}>vs</Text>
            <View style={styles.teamCol}>
              <Text style={styles.teamLabel}>Team B</Text>
              <Text style={styles.teamPts}>{teamTotals.teamB}</Text>
            </View>
          </View>
          <Text style={styles.teamFoot}>
            Individual rows below are who scored on the phone — the match is which side adds up higher.
          </Text>
        </View>
      ) : null}

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
  teamBanner: {
    backgroundColor: Colors.party.surface2,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
  },
  teamBannerTitle: {
    fontFamily: Font.bodyBold,
    color: Colors.party.accent2,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  teamRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  teamCol: { flex: 1, alignItems: 'center' },
  teamLabel: { fontFamily: Font.bodyBold, color: Colors.party.textMuted, fontSize: 14 },
  teamPts: { fontFamily: Font.title, color: Colors.party.accentPop, fontSize: 26, marginTop: 4 },
  teamVs: { fontFamily: Font.bodyBold, color: Colors.party.textMuted, fontSize: 14 },
  teamFoot: {
    fontFamily: Font.body,
    color: Colors.party.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    textAlign: 'center',
  },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.party.card,
    padding: 14,
    borderRadius: 18,
    gap: 12,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
  },
  rowFirst: { borderLeftWidth: 6, borderLeftColor: Colors.party.podiumGold },
  rowSecond: { borderLeftWidth: 6, borderLeftColor: Colors.party.podiumSilver },
  rowThird: { borderLeftWidth: 6, borderLeftColor: Colors.party.podiumBronze },
  rank: { fontFamily: Font.bodyBold, color: Colors.party.textMuted, width: 28, fontSize: 16 },
  rankLead: { color: Colors.party.podiumGold, fontSize: 20 },
  name: { fontFamily: Font.bodyBold, color: Colors.party.text, fontSize: 18 },
  nameLead: { fontSize: 20 },
  team: { fontFamily: Font.body, color: Colors.party.textMuted, fontSize: 13, marginTop: 2 },
  pts: { fontFamily: Font.title, color: Colors.party.success, fontSize: 18 },
  ptsLead: { fontSize: 22 },
});
