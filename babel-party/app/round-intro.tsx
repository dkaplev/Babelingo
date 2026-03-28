import { BackLink } from '@/components/BackLink';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { roundStageFor, TOTAL_GAME_ROUNDS } from '@/lib/progression';
import { funniestResultInRound } from '@/lib/sessionHighlights';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export default function RoundIntroScreen() {
  const router = useRouter();
  const currentRound = useGameStore((s) => s.currentRound);
  const gameMode = useGameStore((s) => s.settings.gameMode);
  const results = useGameStore((s) => s.results);
  const beginRound = useGameStore((s) => s.beginRound);

  const stage = roundStageFor(gameMode, currentRound);
  const modeLabel = gameMode === 'mayhem' ? 'Mayhem' : 'Regular';

  const prevRoundMvp = useMemo(() => {
    if (currentRound <= 1) return null;
    return funniestResultInRound(results, currentRound - 1);
  }, [results, currentRound]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentRound]);

  const onStart = () => {
    beginRound();
    trackEvent('round_intro_start', { round: currentRound, mode: gameMode });
    router.replace('/turn');
  };

  const progress = currentRound / TOTAL_GAME_ROUNDS;

  return (
    <Screen
      title={stage.headline}
      subtitle={`${modeLabel} · Round ${currentRound} of ${TOTAL_GAME_ROUNDS}`}
      footer={<PrimaryButton title="Start this round" onPress={onStart} />}>
      {currentRound === 1 ? <BackLink fallbackHref="/lobby" label="← Lobby" /> : null}

      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
        </View>
        <View style={styles.chipsRow}>
          {Array.from({ length: TOTAL_GAME_ROUNDS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.chip,
                i < currentRound - 1 && styles.chipDone,
                i === currentRound - 1 && styles.chipCurrent,
              ]}
            />
          ))}
        </View>
      </View>

      <Text style={styles.tierBadge}>{stage.tierBadge}</Text>

      <View style={styles.hype}>
        <Text style={styles.tagline}>{stage.tagline}</Text>
      </View>

      {prevRoundMvp ? (
        <View style={styles.mvpBanner}>
          <Text style={styles.mvpTitle}>Last round’s chaos MVP</Text>
          <Text style={styles.mvpLine}>
            {prevRoundMvp.playerName} — “{prevRoundMvp.reverseEnglish.trim()}”
          </Text>
          <Text style={styles.mvpSub}>(wildest echo back to English)</Text>
        </View>
      ) : null}

      {currentRound === 1 ? (
        <View style={styles.rules}>
          <Text style={styles.rulesTitle}>Quick rules</Text>
          <Text style={styles.rule}>① Pass the phone to whoever is up — they only hear the foreign line.</Text>
          <Text style={styles.rule}>② Play the phrase, mimic it out loud, record, submit — then the reveal.</Text>
          <Text style={styles.rule}>③ Louder and messier usually beats quiet and perfect.</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressWrap: { marginBottom: 12 },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: Colors.party.surface2,
    borderWidth: 2,
    borderColor: Colors.party.borderSubtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: Colors.party.accent,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 6,
  },
  chip: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.party.borderSubtle,
  },
  chipDone: {
    backgroundColor: Colors.party.accent2,
  },
  chipCurrent: {
    backgroundColor: Colors.party.accentPop,
  },
  tierBadge: {
    fontFamily: Font.bodyBold,
    fontSize: 13,
    color: Colors.party.accentPop,
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  hype: {
    backgroundColor: Colors.party.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
    marginBottom: 16,
  },
  tagline: {
    fontFamily: Font.body,
    fontSize: 19,
    lineHeight: 28,
    color: Colors.party.text,
  },
  mvpBanner: {
    backgroundColor: Colors.party.surface2,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.party.accentPop,
    marginBottom: 16,
  },
  mvpTitle: {
    fontFamily: Font.bodyBold,
    fontSize: 12,
    color: Colors.party.accentPop,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  mvpLine: {
    fontFamily: Font.body,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.party.text,
  },
  mvpSub: {
    fontFamily: Font.body,
    fontSize: 13,
    color: Colors.party.textMuted,
    marginTop: 6,
  },
  rules: {
    backgroundColor: Colors.party.surface2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.party.borderSubtle,
    gap: 10,
  },
  rulesTitle: {
    fontFamily: Font.bodyBold,
    fontSize: 13,
    color: Colors.party.accent2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rule: {
    fontFamily: Font.body,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.party.textMuted,
  },
});
