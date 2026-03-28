import { BackLink } from '@/components/BackLink';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import type { AppGameId } from '@/lib/types';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

const GAMES: { id: AppGameId; title: string; body: string }[] = [
  {
    id: 'echo_translator',
    title: 'Echo Translator',
    body: 'Everyone shares one English line per round. Each player hears it in a different language, repeats what they can, and we translate the recording back to English.',
  },
  {
    id: 'babel_phone',
    title: 'Babel Phone',
    body: 'Short phrases, languages get spicier each round. Each player hears the line in a new language — but the English line updates from the previous player’s “translation back.” After the round, see the full mutation chain.',
  },
  {
    id: 'reverse_audio',
    title: 'Reverse Audio',
    body: 'English only: hear the line played backward, mimic it, hear your own clip backward, then say the real phrase. Works solo or as a pass-the-phone relay.',
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
    <Screen title="Pick a game" subtitle="Same app, three different kinds of chaos.">
      <BackLink fallbackHref="/" />
      {GAMES.map((g) => (
        <View key={g.id} style={styles.card}>
          <Text style={styles.cardTitle}>{g.title}</Text>
          <Text style={styles.cardBody}>{g.body}</Text>
          <PrimaryButton title={`Play ${g.title}`} onPress={() => choose(g.id)} />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    padding: 18,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
    backgroundColor: Colors.party.card,
    gap: 12,
  },
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
