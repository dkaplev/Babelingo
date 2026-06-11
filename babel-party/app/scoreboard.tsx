import { ChaosCounter } from '@/components/ChaosCounter';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ShareModal } from '@/components/ShareModal';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { CHAOS_AWARD_THRESHOLD } from '@/lib/recordingPlayback';
import {
  babelEnglishChainForRound,
  reverseAnswerLinesForRound,
  roundSeedPhrase,
  topScorersInRound,
} from '@/lib/sessionHighlights';
import { computeTeamTotals } from '@/lib/teamScores';
import { normalizeTranslationText } from '@/lib/normalizeTranslation';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

/** Chaos score that earns the rare “legendary moment” share banner. */
const LEGENDARY_CHAOS = 90;

export default function ScoreboardScreen() {
  const router = useRouter();
  const players = useGameStore((s) => s.players);
  const settings = useGameStore((s) => s.settings);
  const currentRound = useGameStore((s) => s.currentRound);
  const results = useGameStore((s) => s.results);
  const goScoreboardToNext = useGameStore((s) => s.goScoreboardToNext);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const chaoticTurns = useMemo(
    () =>
      results.filter(
        (r) =>
          !r.turnSkipped &&
          r.roundNumber === currentRound &&
          (r.chaosScore ?? 0) >= CHAOS_AWARD_THRESHOLD,
      ),
    [results, currentRound],
  );
  const teamTotals = useMemo(() => computeTeamTotals(players), [players]);
  const roundLeaders = useMemo(() => topScorersInRound(results, currentRound), [results, currentRound]);
  const babelChain = useMemo(
    () => (settings.appGame === 'babel_phone' ? babelEnglishChainForRound(results, currentRound) : []),
    [settings.appGame, results, currentRound],
  );
  const roundAnswerPhrase = useMemo(() => roundSeedPhrase(results, currentRound), [results, currentRound]);
  const reverseLines = useMemo(
    () =>
      settings.appGame === 'reverse_audio'
        ? reverseAnswerLinesForRound(results, currentRound)
        : [],
    [settings.appGame, results, currentRound],
  );
  const showEchoRoundPhrase = Boolean(roundAnswerPhrase) && (settings.appGame === 'echo_translator');

  const onNext = () => {
    goScoreboardToNext();
    const { phase } = useGameStore.getState();
    trackEvent('scoreboard_next', { phase });
    if (phase === 'summary') router.replace('/summary');
    else if (phase === 'round_intro') router.replace('/round-intro');
    else router.replace('/turn');
  };

  const funniest = useMemo(
    () =>
      [...chaoticTurns].sort((a, b) => (b.chaosScore ?? 0) - (a.chaosScore ?? 0))[0] ?? null,
    [chaoticTurns],
  );

  const isLegendary = funniest != null && (funniest.chaosScore ?? 0) >= LEGENDARY_CHAOS;

  return (
    <>
      <ShareModal
        visible={shareModalOpen}
        result={funniest}
        onClose={() => setShareModalOpen(false)}
      />
    <Screen
      title="Scoreboard"
      subtitle={`After round ${currentRound} of ${settings.rounds}`}
      footer={
        <View style={{ gap: 10 }}>
          {funniest ? (
            <PrimaryButton
              variant="ghost"
              title="Share this moment"
              onPress={() => {
                trackEvent('share_moment_tap', { trigger: 'scoreboard' });
                setShareModalOpen(true);
              }}
            />
          ) : null}
          <PrimaryButton
            title={currentRound >= settings.rounds ? 'Final summary' : 'Next round'}
            onPress={onNext}
          />
        </View>
      }>
      {reverseLines.length > 0 ? (
        <View style={styles.phraseBanner}>
          <Text style={styles.phraseTitle}>Reverse Audio — answers (revealed)</Text>
          <Text style={styles.phraseSub}>
            Each player had a different short line (4–5 words) so no one was spoiled mid-round.
          </Text>
          {reverseLines.map((row, i) => (
            <Text key={`${i}-${row.playerName}`} style={styles.phraseLine}>
              {row.playerName}: “{row.phrase}”
            </Text>
          ))}
        </View>
      ) : null}

      {showEchoRoundPhrase && roundAnswerPhrase ? (
        <View style={styles.phraseBanner}>
          <Text style={styles.phraseTitle}>This round’s line (revealed)</Text>
          <Text style={styles.phraseLine}>“{roundAnswerPhrase}”</Text>
        </View>
      ) : null}

      {babelChain.length > 1 ? (
        <View style={styles.chainBanner}>
          <Text style={styles.chainTitle}>Babel Phone — English chain (round {currentRound})</Text>
          {babelChain.map((line, i) => (
            <Text key={`${i}-${line.slice(0, 12)}`} style={styles.chainLine}>
              {i + 1}. {line}
            </Text>
          ))}
        </View>
      ) : null}

      {roundLeaders.length > 0 ? (
        <View style={styles.heatBanner}>
          <Text style={styles.heatTitle}>Round {currentRound} — most points this round</Text>
          <Text style={styles.heatNames}>
            {roundLeaders.map((l) => `${l.playerName} (+${l.points})`).join(' · ')}
          </Text>
        </View>
      ) : null}

      {chaoticTurns.length > 0 ? (
        <View style={styles.chaosRoundBanner}>
          <Text style={styles.chaosRoundTitle}>Chaos awards — round {currentRound}</Text>
          <Text style={styles.chaosRoundSub}>
            The wildest mangled phrases this round — saved for the scoreboard, not mid-turn.
          </Text>
          {chaoticTurns.map((r) => (
            <View key={`${r.playerId}-${r.turnOrderInRound}`} style={styles.chaosRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chaosName}>{r.playerName}</Text>
                <Text style={styles.chaosQuote} numberOfLines={2}>
                  "{normalizeTranslationText(r.reverseEnglish)}"
                </Text>
              </View>
              <ChaosCounter variant="compact" score={r.chaosScore ?? 0} />
            </View>
          ))}
          {isLegendary ? (
            <Text style={styles.legendTag}>🏆 Legendary chaos — share-worthy moment</Text>
          ) : null}
        </View>
      ) : null}

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
        {sorted.map((p, idx) => {
          const roundLeader = roundLeaders.some((l) => l.playerId === p.id);
          return (
          <View
            key={p.id}
            style={[
              styles.row,
              idx === 0 && styles.rowFirst,
              idx === 1 && styles.rowSecond,
              idx === 2 && styles.rowThird,
              roundLeader && styles.rowRoundLeader,
            ]}>
            <Text style={[styles.rank, idx === 0 && styles.rankLead]}>{idx + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, idx === 0 && styles.nameLead]}>{p.name}</Text>
              {p.teamId ? (
                <Text style={styles.team}>Team {p.teamId.toUpperCase()}</Text>
              ) : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {roundLeader ? <Text style={styles.heatTag}>ROUND HEAT</Text> : null}
              <Text style={[styles.pts, idx === 0 && styles.ptsLead]}>{p.totalScore}</Text>
            </View>
          </View>
        );
        })}
      </View>
    </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  phraseBanner: {
    backgroundColor: Colors.party.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: Colors.party.accentPop,
    gap: 8,
  },
  phraseTitle: {
    fontFamily: Font.bodyBold,
    fontSize: 11,
    color: Colors.party.accentPop,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  phraseSub: {
    fontFamily: Font.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.party.textMuted,
    marginBottom: 4,
  },
  phraseLine: {
    fontFamily: Font.body,
    fontSize: 17,
    lineHeight: 26,
    color: Colors.party.text,
  },
  chainBanner: {
    backgroundColor: Colors.party.surface2,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: Colors.party.accent2,
    gap: 8,
  },
  chainTitle: {
    fontFamily: Font.bodyBold,
    fontSize: 12,
    color: Colors.party.accent2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chainLine: {
    fontFamily: Font.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.party.text,
  },
  heatBanner: {
    backgroundColor: Colors.party.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: Colors.party.accentPop,
  },
  heatTitle: {
    fontFamily: Font.bodyBold,
    fontSize: 11,
    color: Colors.party.accentPop,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  heatNames: {
    fontFamily: Font.body,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.party.text,
  },
  rowRoundLeader: {
    borderColor: Colors.party.accentPop,
  },
  heatTag: {
    fontFamily: Font.bodyBold,
    fontSize: 9,
    color: Colors.party.accentPop,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
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
  chaosRoundBanner: {
    backgroundColor: Colors.party.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: Colors.party.accentPop,
    gap: 10,
  },
  chaosRoundTitle: {
    fontFamily: Font.bodyBold,
    fontSize: 12,
    color: Colors.party.accentPop,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chaosRoundSub: {
    fontFamily: Font.body,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.party.textMuted,
    marginBottom: 4,
  },
  chaosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.party.borderSubtle,
  },
  chaosName: {
    fontFamily: Font.bodyBold,
    fontSize: 15,
    color: Colors.party.text,
    marginBottom: 4,
  },
  chaosQuote: {
    fontFamily: Font.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.party.textMuted,
    fontStyle: 'italic',
  },
  legendTag: {
    fontFamily: Font.bodyBold,
    fontSize: 13,
    color: Colors.party.podiumGold,
    marginTop: 4,
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
