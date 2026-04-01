import { MomentSharePanel } from '@/components/MomentSharePanel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent, trackSessionCompleted } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { computeTeamTotals } from '@/lib/teamScores';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SummaryScreen() {
  const router = useRouter();
  const resetSession = useGameStore((s) => s.resetSession);
  const players = useGameStore((s) => s.players);
  const results = useGameStore((s) => s.results);
  const settings = useGameStore((s) => s.settings);

  const winner = useMemo(() => [...players].sort((a, b) => b.totalScore - a.totalScore)[0], [players]);
  const teamTotals = useMemo(() => computeTeamTotals(players), [players]);

  const funniest = useMemo(
    () =>
      [...results].sort(
        (a, b) =>
          (b.chaosScore ?? 0) - (a.chaosScore ?? 0) ||
          b.reverseEnglish.length - a.reverseEnglish.length,
      )[0],
    [results],
  );

  const closest = useMemo(
    () => [...results].sort((a, b) => b.closenessScore - a.closenessScore)[0],
    [results],
  );

  const telemetryOnce = useRef(false);
  useEffect(() => {
    if (telemetryOnce.current) return;
    telemetryOnce.current = true;
    const totalChaos = results.reduce((acc, r) => acc + (r.chaosScore ?? 0), 0);
    trackSessionCompleted({
      mode: settings.appGame,
      vibe: settings.gameMode,
      rounds_played: settings.rounds,
      total_chaos: totalChaos,
    });
  }, [results, settings.appGame, settings.gameMode, settings.rounds]);

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
              router.replace('/game-mode');
            }}
          />
          <PrimaryButton variant="ghost" title="Home" onPress={() => {
            resetSession();
            router.replace('/');
          }} />
        </View>
      }>
      {settings.teamsEnabled && teamTotals ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>Winning side</Text>
          {teamTotals.teamA === teamTotals.teamB ? (
            <>
              <Text style={styles.hero}>Draw</Text>
              <Text style={styles.sub}>Team A and Team B tied at {teamTotals.teamA} pts each</Text>
            </>
          ) : (
            <>
              <Text style={styles.hero}>Team {teamTotals.teamA > teamTotals.teamB ? 'A' : 'B'}</Text>
              <Text style={styles.sub}>
                {Math.max(teamTotals.teamA, teamTotals.teamB)} combined pts · Team A {teamTotals.teamA} · Team B{' '}
                {teamTotals.teamB}
              </Text>
              {winner ? (
                <Text style={styles.sub}>Top individual scorer: {winner.name} ({winner.totalScore} pts)</Text>
              ) : null}
            </>
          )}
        </View>
      ) : winner ? (
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

      {funniest ? (
        <MomentSharePanel
          context="summary"
          payload={{
            mangled: funniest.reverseEnglish,
            originalEnglish: funniest.phraseOriginal,
            languageLabel: funniest.languageLabel,
            playerName: funniest.playerName,
          }}
        />
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
    borderRadius: 18,
    padding: 18,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
  },
  kicker: {
    fontFamily: Font.bodyBold,
    color: Colors.party.accent2,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hero: { fontFamily: Font.title, color: Colors.party.accentPop, fontSize: 22, marginTop: 8, lineHeight: 30 },
  body: { fontFamily: Font.body, color: Colors.party.text, fontSize: 17, lineHeight: 26, marginTop: 8, fontStyle: 'italic' },
  sub: { fontFamily: Font.body, color: Colors.party.textMuted, marginTop: 10, fontSize: 15, lineHeight: 22 },
  footerNote: { fontFamily: Font.body, marginTop: 28, color: Colors.party.textMuted, fontSize: 14, lineHeight: 22 },
});
