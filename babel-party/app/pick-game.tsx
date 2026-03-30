import { BackLink } from '@/components/BackLink';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { getPartyPalette } from '@/lib/partyPalette';
import type { AppGameId } from '@/lib/types';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const GAMES: { id: AppGameId; title: string; body: string }[] = [
  {
    id: 'echo_translator',
    title: 'Echo Translator',
    body: 'Foreign audio → mimic → scored. Listen-speed slider on each turn. Same line each round (solo or party), revealed at the end.',
  },
  {
    id: 'babel_phone',
    title: 'Babel Phone',
    body: 'Each turn you hear a real foreign language; English mutates only on the chain between turns. Solo = one hop; group = full telephone.',
  },
  {
    id: 'reverse_audio',
    title: 'Reverse Audio',
    body: 'Backward clue (speed slider) → mimic → your clip reversed at normal speed → say the line. English only.',
  },
];

export default function PickGameScreen() {
  const router = useRouter();
  const updateSettings = useGameStore((s) => s.updateSettings);

  const choose = (id: AppGameId) => {
    updateSettings({ appGame: id });
    trackEvent('pick_game', { game: id });
    router.push('/game-mode');
  };

  return (
    <Screen title="Pick a game" subtitle="Three modes — tap a card to continue.">
      <BackLink fallbackHref="/" />
      <View style={styles.stack}>
        {GAMES.map((g) => {
          const pal = getPartyPalette(g.id);
          return (
            <View
              key={g.id}
              style={[styles.card, { borderColor: pal.neonStroke, backgroundColor: pal.card }]}>
              <Text style={[styles.cardTitle, { color: pal.accentPop }]}>{g.title}</Text>
              <Text style={[styles.cardBody, { color: pal.text }]}>{g.body}</Text>
              <PrimaryButton title="Play" onPress={() => choose(g.id)} />
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10, marginTop: 6 },
  card: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 3,
    gap: 8,
  },
  cardTitle: {
    fontFamily: Font.title,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  cardBody: {
    fontFamily: Font.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
