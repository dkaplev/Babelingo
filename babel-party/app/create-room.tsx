import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { LANGUAGES, defaultLanguagePool } from '@/lib/languages';
import { trackEvent } from '@/lib/analytics';
import type { DifficultyPreset, PhraseCategory } from '@/lib/types';
import { useGameStore } from '@/lib/gameStore';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const categories: { key: PhraseCategory | 'mixed'; label: string }[] = [
  { key: 'mixed', label: 'Mixed' },
  { key: 'pop_culture', label: 'Pop culture' },
  { key: 'animals', label: 'Animals' },
  { key: 'food', label: 'Food' },
  { key: 'fantasy', label: 'Fantasy' },
  { key: 'office', label: 'Office / work' },
  { key: 'absurd', label: 'Everyday life' },
];

const difficulties: { key: DifficultyPreset; label: string; hint: string }[] = [
  { key: 'chill', label: 'Chill', hint: 'Simpler languages only (e.g. Spanish, Italian, French)' },
  { key: 'spicy', label: 'Spicy', hint: 'Adds medium languages (e.g. German, Greek, Turkish)' },
  {
    key: 'chaos',
    label: 'Chaos',
    hint: 'All picks including hard languages (Japanese, Arabic, Hindi)',
  },
];

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
  const [rounds, setRounds] = useState(settings.rounds);
  const [teams, setTeams] = useState(settings.teamsEnabled);
  const [difficulty, setDifficulty] = useState<DifficultyPreset>(settings.difficulty);
  const [category, setCategory] = useState<PhraseCategory | 'mixed'>(settings.category);
  const [langSet, setLangSet] = useState(() => new Set(settings.languageCodes));

  const langList = useMemo(() => defaultLanguagePool(), []);

  const toggleLang = (code: string) => {
    setLangSet((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        if (next.size <= 2) return prev;
        next.delete(code);
      } else next.add(code);
      return next;
    });
  };

  const onContinue = () => {
    updateSettings({
      playerCount,
      rounds,
      teamsEnabled: teams,
      difficulty,
      category,
      languageCodes: langList.filter((c) => langSet.has(c)),
    });
    trackEvent('room_created', {
      playerCount,
      rounds,
      teams,
      difficulty,
      category,
    });
    router.push('/lobby');
  };

  return (
    <Screen
      title="Create room"
      subtitle="Dial the vibe. You can tweak languages to match your crowd.">
      <Stepper label="Players" value={playerCount} min={2} max={8} onChange={setPlayerCount} />
      <Stepper label="Rounds" value={rounds} min={1} max={6} onChange={setRounds} />

      <Text style={styles.section}>Teams</Text>
      <Pressable style={[styles.toggle, teams && styles.toggleOn]} onPress={() => setTeams(!teams)}>
        <Text style={styles.toggleText}>{teams ? 'Teams: A / B' : 'Individuals'}</Text>
      </Pressable>

      <Text style={styles.section}>Difficulty</Text>
      <View style={styles.chips}>
        {difficulties.map((d) => (
          <Pressable
            key={d.key}
            onPress={() => setDifficulty(d.key)}
            style={[styles.chip, difficulty === d.key && styles.chipOn]}>
            <Text style={styles.chipTitle}>{d.label}</Text>
            <Text style={styles.chipHint}>{d.hint}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Phrase category</Text>
      <View style={styles.rowWrap}>
        {categories.map((c) => (
          <Pressable
            key={c.key}
            onPress={() => setCategory(c.key)}
            style={[styles.miniChip, category === c.key && styles.miniChipOn]}>
            <Text style={[styles.miniChipText, category === c.key && styles.miniChipTextOn]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Language pool</Text>
      <View style={styles.rowWrap}>
        {LANGUAGES.map((l) => (
          <Pressable
            key={l.code}
            onPress={() => toggleLang(l.code)}
            style={[styles.miniChip, langSet.has(l.code) && styles.miniChipOn]}>
            <Text style={[styles.miniChipText, langSet.has(l.code) && styles.miniChipTextOn]}>{l.label}</Text>
          </Pressable>
        ))}
      </View>

      <PrimaryButton title="Continue to lobby" onPress={onContinue} style={{ marginTop: 20 }} />
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
    borderColor: Colors.party.doodleInk,
  },
  stepperBtnDisabled: { opacity: 0.35 },
  stepperBtnText: { fontFamily: Font.bodyBold, color: Colors.party.text, fontSize: 22 },
  stepperValue: { fontFamily: Font.bodyBold, color: Colors.party.text, fontSize: 20, minWidth: 36, textAlign: 'center' },
  toggle: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.party.card,
    borderWidth: 2,
    borderColor: Colors.party.doodleInk,
  },
  toggleOn: { borderColor: Colors.party.accent, backgroundColor: Colors.party.surface2 },
  toggleText: { fontFamily: Font.bodyBold, color: Colors.party.text },
  chips: { gap: 10 },
  chip: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.party.card,
    borderWidth: 2,
    borderColor: Colors.party.doodleInk,
  },
  chipOn: { borderColor: Colors.party.accent, backgroundColor: Colors.party.surface2 },
  chipTitle: { fontFamily: Font.bodyBold, color: Colors.party.text, fontSize: 17 },
  chipHint: { fontFamily: Font.body, color: Colors.party.textMuted, marginTop: 4, fontSize: 14 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.party.card,
    borderWidth: 2,
    borderColor: Colors.party.doodleInk,
  },
  miniChipOn: { backgroundColor: Colors.party.accent2, borderColor: Colors.party.doodleInk },
  miniChipText: { fontFamily: Font.bodyBold, color: Colors.party.text, fontSize: 14 },
  miniChipTextOn: { color: '#fff' },
});
