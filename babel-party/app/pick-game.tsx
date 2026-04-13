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

const GAMES: { id: AppGameId; title: string; body: string; emoji: string; skipVibe?: boolean }[] = [
  {
    id: 'echo_translator',
    title: 'Echo Translator',
    body: 'Hear a wild foreign line, throw your best mimic, then watch the scoreboard roast how close you got.',
    emoji: '🎙️',
  },
  {
    id: 'halloumi_mode',
    title: '🟦🟦 Halloumi Mode 🟦🟦',
    body: 'Echo Translator locked to Greek only — every player gets a different phrase every turn. Opa! Perfect for learning Greek the chaotic way.',
    emoji: '🏛️',
    skipVibe: true,
  },
  {
    id: 'babel_phone',
    title: 'Babel Phone',
    body: 'Each earful is a real language; English only mutates through the chain of recordings — solo is one hop, party is full chaos.',
    emoji: '📞',
  },
  {
    id: 'reverse_audio',
    title: 'Reverse Audio',
    body: 'Tiny English lines played backward, then reversed again after you mimic — say the real phrase before the room loses it.',
    emoji: '🔄',
  },
];

export default function PickGameScreen() {
  const router = useRouter();
  const updateSettings = useGameStore((s) => s.updateSettings);
  const sessionPassActive = useSessionEntitlementsStore((s) => s.sessionPassActive);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState('pick_game_locked_mode');

  const choose = (game: typeof GAMES[number]) => {
    const freeGames: AppGameId[] = ['echo_translator', 'halloumi_mode'];
    const locked = !sessionPassActive && !freeGames.includes(game.id);
    if (locked) {
      setPaywallTrigger(`pick_game_${game.id}`);
      setPaywallOpen(true);
      return;
    }
    updateSettings({ appGame: game.id, playbackSpeed: playbackSpeedForAppGame(game.id) });
    trackEvent('pick_game', { game: game.id });
    if (game.skipVibe) {
      router.push('/create-room');
    } else {
      router.push('/game-mode');
    }
  };

  return (
    <Screen
      title="Pick a game"
      subtitle="Three modes — tap a card to continue."
      neutralChrome>
      <PaywallModal visible={paywallOpen} triggerPoint={paywallTrigger} onClose={() => setPaywallOpen(false)} />
      <BackLink fallbackHref="/" />
      <View style={styles.stack}>
        {GAMES.map((g) => {
          const pal = getPartyPalette(g.id);
          const freeGames: AppGameId[] = ['echo_translator', 'halloumi_mode'];
          const locked = !sessionPassActive && !freeGames.includes(g.id);
          return (
            <View
              key={g.id}
              style={[styles.card, { borderColor: pal.neonStroke, backgroundColor: pal.card }]}>
              <Text style={[styles.cardTitle, { color: pal.accentPop }]}>
                {g.title}
                {locked ? ' 🔒' : ''}
              </Text>
              <Text style={[styles.cardBody, { color: pal.text }]}>{g.body}</Text>
              <PrimaryButton title={locked ? 'Unlock to play' : 'Play'} onPress={() => choose(g)} />
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
