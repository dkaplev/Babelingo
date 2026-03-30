import { BackLink } from '@/components/BackLink';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { defaultLanguagePool } from '@/lib/languages';
import { useGameStore } from '@/lib/gameStore';
import { TOTAL_GAME_ROUNDS } from '@/lib/progression';
import type { AppGameId } from '@/lib/types';
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

function gameLabel(appGame: string): string {
  if (appGame === 'babel_phone') return 'Babel Phone';
  if (appGame === 'reverse_audio') return 'Reverse Audio';
  return 'Echo Translator';
}

function soloCardCopy(appGame: AppGameId): { title: string; body: string } {
  if (appGame === 'reverse_audio') {
    return {
      title: 'Solo · Reverse Audio',
      body: 'You run the full chain each round: every backward clue listen is half-speed, then you mimic, hear your clip reversed at normal speed, and say the real line. Chase a better closeness score each round or warm up before a group game.',
    };
  }
  if (appGame === 'babel_phone') {
    return {
      title: 'Solo · Babel Phone',
      body: 'You are the whole telephone in one turn: hear the foreign line, record once, and see how the English mutates on the scoreboard. Try to stay close to the seed — or lean into chaos for practice.',
    };
  }
  return {
    title: 'Solo · Echo Translator',
    body: 'One turn per round: foreign audio in, your mimic scored, phrase revealed at the scoreboard. Great with headphones to rehearse before hosting a party.',
  };
}

function defaultGroupCount(saved: number): number {
  if (saved >= 2) return saved;
  return 4;
}

export default function CreateRoomScreen() {
  const router = useRouter();
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  const [groupPlayerCount, setGroupPlayerCount] = useState(() => defaultGroupCount(settings.playerCount));
  const [teams, setTeams] = useState(settings.teamsEnabled);
  const soloCopy = soloCardCopy(settings.appGame);

  const applyAndGoLobby = (opts: { playerCount: number; teamsEnabled: boolean; roomMode: 'solo' | 'party' }) => {
    updateSettings({
      playerCount: opts.playerCount,
      rounds: TOTAL_GAME_ROUNDS,
      teamsEnabled: opts.teamsEnabled,
      difficulty: 'chaos',
      category: 'mixed',
      languageCodes: defaultLanguagePool(),
    });
    trackEvent('room_created', {
      playerCount: opts.playerCount,
      rounds: TOTAL_GAME_ROUNDS,
      teams: opts.teamsEnabled,
      room_mode: opts.roomMode,
    });
    router.push('/lobby');
  };

  const onSoloMode = () => {
    applyAndGoLobby({ playerCount: 1, teamsEnabled: false, roomMode: 'solo' });
  };

  const onPartyContinue = () => {
    applyAndGoLobby({
      playerCount: groupPlayerCount,
      teamsEnabled: teams,
      roomMode: 'party',
    });
  };

  return (
    <Screen
      title="Create room"
      subtitle={`${gameLabel(settings.appGame)} · solo or group.`}>
      <BackLink fallbackHref="/game-mode" />

      <View style={styles.soloCard}>
        <Text style={styles.soloTitle}>{soloCopy.title}</Text>
        <Text style={styles.soloBody}>{soloCopy.body}</Text>
      </View>
      <PrimaryButton title="Solo mode — go to lobby" onPress={onSoloMode} />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or play with a group</Text>
        <View style={styles.dividerLine} />
      </View>

      <Stepper label="Players" value={groupPlayerCount} min={2} max={16} onChange={setGroupPlayerCount} />

      <Text style={styles.section}>Teams</Text>
      <Pressable style={[styles.toggle, teams && styles.toggleOn]} onPress={() => setTeams(!teams)}>
        <Text style={styles.toggleText}>{teams ? 'Teams: A / B' : 'Individuals'}</Text>
      </Pressable>
      <Text style={styles.teamHint}>
        {teams
          ? 'Players alternate A · B · A · B in the lobby. Points still go to whoever held the phone — but the scoreboard and final winner are by team total (sum of both players on that team).'
          : 'Everyone competes solo; high score wins.'}
      </Text>

      <PrimaryButton title="Continue to lobby (group)" onPress={onPartyContinue} variant="dim" style={{ marginTop: 20 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  soloCard: {
    marginTop: 8,
    marginBottom: 14,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 22,
  },
  dividerLine: { flex: 1, height: 2, backgroundColor: Colors.party.borderSubtle, borderRadius: 1 },
  dividerText: {
    fontFamily: Font.bodyBold,
    fontSize: 12,
    color: Colors.party.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  section: {
    marginTop: 8,
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
