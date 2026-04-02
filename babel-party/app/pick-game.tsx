import { BackLink } from '@/components/BackLink';
import { PaywallModal } from '@/components/PaywallModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { playbackSpeedForAppGame } from '@/lib/playbackSpeed';
import { getPartyPalette } from '@/lib/partyPalette';
import { useSessionEntitlementsStore } from '@/lib/sessionEntitlementsStore';
import type { AppGameId } from '@/lib/types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
    body: '4–5 word lines, unique per player each round. Backward clue (slider) → mimic → clip reversed → say it. English only.',
  },
];

export default function PickGameScreen() {
  const router = useRouter();
  const updateSettings = useGameStore((s) => s.updateSettings);
  const sessionPassActive = useSessionEntitlementsStore((s) => s.sessionPassActive);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState('pick_game_locked_mode');

  const choose = (id: AppGameId) => {
    const locked = !sessionPassActive && id !== 'echo_translator';
    if (locked) {
      setPaywallTrigger(`pick_game_${id}`);
      setPaywallOpen(true);
      return;
    }
    updateSettings({ appGame: id, playbackSpeed: playbackSpeedForAppGame(id) });
    trackEvent('pick_game', { game: id });
    router.push('/game-mode');
  };

  return (
    <Screen title="Pick a game" subtitle="Three modes — tap a card to continue.">
      <PaywallModal visible={paywallOpen} triggerPoint={paywallTrigger} onClose={() => setPaywallOpen(false)} />
      <BackLink fallbackHref="/" />
      <View style={styles.stack}>
        {GAMES.map((g) => {
          const pal = getPartyPalette(g.id);
          const locked = !sessionPassActive && g.id !== 'echo_translator';
          return (
            <View
              key={g.id}
              style={[styles.card, { borderColor: pal.neonStroke, backgroundColor: pal.card }]}>
              <Text style={[styles.cardTitle, { color: pal.accentPop }]}>
                {g.title}
                {locked ? ' 🔒' : ''}
              </Text>
              <Text style={[styles.cardBody, { color: pal.text }]}>{g.body}</Text>
              <PrimaryButton title={locked ? 'Unlock to play' : 'Play'} onPress={() => choose(g.id)} />
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
