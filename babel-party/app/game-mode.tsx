import { BackLink } from '@/components/BackLink';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { TOTAL_GAME_ROUNDS } from '@/lib/progression';
import type { GameMode } from '@/lib/types';
import { useRouter, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function GameModeScreen() {
  const router = useRouter();
  const updateSettings = useGameStore((s) => s.updateSettings);

  const choose = (mode: GameMode) => {
    updateSettings({ gameMode: mode, rounds: TOTAL_GAME_ROUNDS });
    trackEvent('game_mode_selected', { mode });
    router.push('/create-room');
  };

  return (
    <Screen title="Pick your vibe" subtitle="Same party energy — two ways to ramp the chaos.">
      <BackLink fallbackHref={'/pick-game' as Href} />
      <Text style={styles.topHint}>{TOTAL_GAME_ROUNDS} rounds either way. Headcount comes next.</Text>

      <View style={[styles.card, styles.cardRegular]}>
        <Text style={styles.cardTitle}>Regular</Text>
        <Text style={styles.cardBody}>
          A guided climb: each round dials up phrase length, language heat, or both — ending in an all-out mix.
        </Text>
        <PrimaryButton title="Play Regular" onPress={() => choose('regular')} />
      </View>

      <View style={[styles.card, styles.cardMayhem]}>
        <Text style={styles.cardTitle}>Mayhem</Text>
        <Text style={styles.cardBody}>
          For crews who already know the drill: random languages every round, random phrases — never shorter than four
          words.
        </Text>
        <PrimaryButton title="Play Mayhem" onPress={() => choose('mayhem')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topHint: {
    fontFamily: Font.body,
    fontSize: 15,
    color: Colors.party.textMuted,
    marginBottom: 8,
    lineHeight: 22,
  },
  card: {
    marginTop: 14,
    padding: 18,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
    backgroundColor: Colors.party.card,
    gap: 12,
  },
  cardRegular: { borderLeftWidth: 6, borderLeftColor: Colors.party.accent2 },
  cardMayhem: { borderLeftWidth: 6, borderLeftColor: Colors.party.accentPop },
  cardTitle: {
    fontFamily: Font.title,
    fontSize: 14,
    color: Colors.party.accentPop,
  },
  cardBody: {
    fontFamily: Font.body,
    fontSize: 16,
    color: Colors.party.text,
    lineHeight: 24,
  },
});
