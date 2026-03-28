import { BackLink } from '@/components/BackLink';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { defaultLanguagePool } from '@/lib/languages';
import { useGameStore } from '@/lib/gameStore';
import { TOTAL_GAME_ROUNDS } from '@/lib/progression';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function Stepper(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const { label, value, min, max, onChange } = props;
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable
          style={[styles.stepperBtn, value <= min && styles.stepperBtnDisabled]}
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}>
          <Text style={styles.stepperBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable
          style={[styles.stepperBtn, value >= max && styles.stepperBtnDisabled]}
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}>
          <Text style={styles.stepperBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function CreateRoomScreen() {
  const router = useRouter();
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  const [playerCount, setPlayerCount] = useState(settings.playerCount);
  const [teams, setTeams] = useState(settings.teamsEnabled);

  const onContinue = () => {
    updateSettings({
      playerCount,
      rounds: TOTAL_GAME_ROUNDS,
      teamsEnabled: teams,
      difficulty: 'chaos',
      category: 'mixed',
      languageCodes: defaultLanguagePool(),
    });
    trackEvent('room_created', {
      playerCount,
      rounds: TOTAL_GAME_ROUNDS,
      teams,
    });
    router.push('/lobby');
  };

  return (
    <Screen
      title="Create room"
      subtitle="How many people pass the phone — rounds and difficulty follow the mode you picked on the last screen.">
      <BackLink fallbackHref="/game-mode" />
      <Stepper label="Players" value={playerCount} min={2} max={16} onChange={setPlayerCount} />

      <Text style={styles.section}>Teams</Text>
      <Pressable style={[styles.toggle, teams && styles.toggleOn]} onPress={() => setTeams(!teams)}>
        <Text style={styles.toggleText}>{teams ? 'Teams: A / B' : 'Individuals'}</Text>
      </Pressable>
      <Text style={styles.teamHint}>
        {teams
          ? 'Players alternate A · B · A · B in the lobby. Points still go to whoever held the phone — but the scoreboard and final winner are by team total (sum of both players on that team).'
          : 'Everyone competes solo; high score wins.'}
      </Text>

      <PrimaryButton title="Continue to lobby" onPress={onContinue} style={{ marginTop: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginBottom: 10,
    fontFamily: Font.bodyBold,
    color: Colors.party.textMuted,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  stepper: { marginBottom: 16 },
  stepperLabel: { fontFamily: Font.bodyBold, color: Colors.party.text, marginBottom: 8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.party.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.party.neonStroke,
  },
  stepperBtnDisabled: { opacity: 0.35 },
  stepperBtnText: { fontFamily: Font.bodyBold, color: Colors.party.text, fontSize: 22 },
  stepperValue: { fontFamily: Font.bodyBold, color: Colors.party.text, fontSize: 20, minWidth: 36, textAlign: 'center' },
  toggle: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.party.card,
    borderWidth: 2,
    borderColor: Colors.party.neonStroke,
  },
  toggleOn: { borderColor: Colors.party.accent, backgroundColor: Colors.party.surface2 },
  toggleText: { fontFamily: Font.bodyBold, color: Colors.party.text },
  teamHint: {
    fontFamily: Font.body,
    color: Colors.party.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
});
