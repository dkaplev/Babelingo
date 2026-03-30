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
import { useEffect, useState } from 'react';
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

function gameLabel(appGame: string): string {
  if (appGame === 'babel_phone') return 'Babel Phone';
  if (appGame === 'reverse_audio') return 'Reverse Audio';
  return 'Echo Translator';
}

export default function CreateRoomScreen() {
  const router = useRouter();
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  const minPlayers = settings.appGame === 'reverse_audio' ? 1 : 2;
  const [playerCount, setPlayerCount] = useState(() =>
    Math.max(minPlayers, settings.playerCount),
  );
  const [teams, setTeams] = useState(settings.teamsEnabled);
  const reverseSolo = settings.appGame === 'reverse_audio' && playerCount === 1;

  useEffect(() => {
    setPlayerCount((c) => Math.max(minPlayers, c));
  }, [minPlayers]);

  const onContinue = () => {
    const count = Math.max(minPlayers, playerCount);
    const soloReverse = settings.appGame === 'reverse_audio' && count === 1;
    updateSettings({
      playerCount: count,
      rounds: TOTAL_GAME_ROUNDS,
      teamsEnabled: soloReverse ? false : teams,
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
      subtitle={`${gameLabel(settings.appGame)} · how many pass the phone (rounds follow the mode you picked).`}>
      <BackLink fallbackHref="/game-mode" />
      <Stepper label="Players" value={playerCount} min={minPlayers} max={16} onChange={setPlayerCount} />

      {reverseSolo ? (
        <View style={styles.soloCard}>
          <Text style={styles.soloTitle}>Reverse Audio · solo practice</Text>
          <Text style={styles.soloBody}>
            One player runs every “turn” on the same phone: backward clue → mimic → your clip reversed → say the real
            line. Compare your closeness scores round to round, or use it as a warm-up before a group game.
          </Text>
        </View>
      ) : null}

      {!reverseSolo ? (
        <>
          <Text style={styles.section}>Teams</Text>
          <Pressable style={[styles.toggle, teams && styles.toggleOn]} onPress={() => setTeams(!teams)}>
            <Text style={styles.toggleText}>{teams ? 'Teams: A / B' : 'Individuals'}</Text>
          </Pressable>
          <Text style={styles.teamHint}>
            {teams
              ? 'Players alternate A · B · A · B in the lobby. Points still go to whoever held the phone — but the scoreboard and final winner are by team total (sum of both players on that team).'
              : 'Everyone competes solo; high score wins.'}
          </Text>
        </>
      ) : (
        <Text style={styles.teamHint}>Teams are off in solo Reverse Audio — it’s just you vs. the backward audio.</Text>
      )}

      <PrimaryButton title="Continue to lobby" onPress={onContinue} style={{ marginTop: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  soloCard: {
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.party.card,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
    gap: 10,
  },
  soloTitle: {
    fontFamily: Font.bodyBold,
    fontSize: 13,
    color: Colors.party.accentPop,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  soloBody: {
    fontFamily: Font.body,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.party.textMuted,
  },
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
