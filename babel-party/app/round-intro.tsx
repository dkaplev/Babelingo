import { BackLink } from '@/components/BackLink';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { roundStageFor, TOTAL_GAME_ROUNDS } from '@/lib/progression';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function RoundIntroScreen() {
  const router = useRouter();
  const currentRound = useGameStore((s) => s.currentRound);
  const gameMode = useGameStore((s) => s.settings.gameMode);
  const beginRound = useGameStore((s) => s.beginRound);

  const stage = roundStageFor(gameMode, currentRound);
  const modeLabel = gameMode === 'mayhem' ? 'Mayhem' : 'Regular';

  const onStart = () => {
    beginRound();
    trackEvent('round_intro_start', { round: currentRound, mode: gameMode });
    router.replace('/turn');
  };

  return (
    <Screen
      title={stage.headline}
      subtitle={`${modeLabel} · Round ${currentRound} of ${TOTAL_GAME_ROUNDS}`}
      footer={<PrimaryButton title="Start this round" onPress={onStart} />}>
      {currentRound === 1 ? <BackLink fallbackHref="/lobby" label="← Lobby" /> : null}

      <View style={styles.hype}>
        <Text style={styles.tagline}>{stage.tagline}</Text>
      </View>

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
