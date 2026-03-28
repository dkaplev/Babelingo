import { BackLink } from '@/components/BackLink';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { TOTAL_GAME_ROUNDS } from '@/lib/progression';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function LobbyScreen() {
  const router = useRouter();
  const settings = useGameStore((s) => s.settings);
  const startSessionFromLobby = useGameStore((s) => s.startSessionFromLobby);

  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: settings.playerCount }, (_, i) => `Player ${i + 1}`),
  );

  useEffect(() => {
    setNames((prev) => {
      const next = Array.from({ length: settings.playerCount }, (_, i) => prev[i] ?? `Player ${i + 1}`);
      return next;
    });
  }, [settings.playerCount]);

  const onStart = () => {
    startSessionFromLobby(names);
    trackEvent('lobby_start');
    router.replace('/round-intro');
  };

  return (
    <Screen
      title="Lobby"
      subtitle={`${settings.gameMode === 'mayhem' ? 'Mayhem' : 'Regular'} · ${TOTAL_GAME_ROUNDS} rounds · ${settings.teamsEnabled ? 'Team totals win' : 'Solo scoring'}`}
      footer={<PrimaryButton title="Everyone’s in — start" onPress={onStart} />}>
      <BackLink fallbackHref="/create-room" />
      <Text style={styles.hint}>Rename everyone — scores and turns use these names out loud.</Text>
      {names.map((n, i) => (
        <View key={i} style={styles.field}>
          <Text style={styles.label}>{settings.teamsEnabled ? (i % 2 === 0 ? 'Team A' : 'Team B') : 'Player'}</Text>
          <TextInput
            value={n}
            onChangeText={(t) => {
              const copy = [...names];
              copy[i] = t;
              setNames(copy);
            }}
            placeholder={`Player ${i + 1}`}
            placeholderTextColor={Colors.party.textMuted}
            style={styles.input}
          />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { fontFamily: Font.body, color: Colors.party.textMuted, marginBottom: 16, fontSize: 16 },
  field: { marginBottom: 12 },
  label: { fontFamily: Font.bodyBold, color: Colors.party.textMuted, fontSize: 12, marginBottom: 6 },
  input: {
    fontFamily: Font.body,
    backgroundColor: Colors.party.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.party.text,
    fontSize: 17,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
  },
});
