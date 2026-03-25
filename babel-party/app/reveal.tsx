import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { normalizeTranslationText } from '@/lib/normalizeTranslation';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function RevealScreen() {
  const router = useRouter();
  const lastResult = useGameStore((s) => s.lastResult);
  const funnyVotePending = useGameStore((s) => s.funnyVotePending);
  const grantFunnyBonus = useGameStore((s) => s.grantFunnyBonus);
  const advanceAfterReveal = useGameStore((s) => s.advanceAfterReveal);

  if (!lastResult) {
    return (
      <Screen title="Reveal">
        <Text style={styles.muted}>No result yet.</Text>
      </Screen>
    );
  }

  const onNext = () => {
    advanceAfterReveal();
    const { phase } = useGameStore.getState();
    trackEvent('reveal_next', { next_phase: phase });
    if (phase === 'turn') router.replace('/turn');
    else if (phase === 'scoreboard') router.replace('/scoreboard');
    else router.replace('/summary');
  };

  return (
    <Screen
      title="The reveal"
      subtitle={lastResult.funnyLabel}
      footer={
        <View style={{ gap: 10 }}>
          {funnyVotePending ? (
            <PrimaryButton
              variant="ghost"
              title="+1 group funny vote"
              onPress={() => {
                grantFunnyBonus();
                trackEvent('funny_vote');
              }}
            />
          ) : null}
          <PrimaryButton title="Next" onPress={onNext} />
        </View>
      }>
      <Text style={styles.originalLabel}>Original English</Text>
      <Text style={styles.original}>{lastResult.phraseOriginal}</Text>

      <View style={{ height: 16 }} />

      <Text style={styles.bigLabel}>What English came back</Text>
      <Text style={styles.big}>{normalizeTranslationText(lastResult.reverseEnglish)}</Text>

      <View style={styles.meta}>
        <Text style={styles.metaText}>Language: {lastResult.languageLabel}</Text>
        {lastResult.recognizedText ? (
          <Text style={styles.metaText}>Heard: {normalizeTranslationText(lastResult.recognizedText)}</Text>
        ) : null}
        {lastResult.usedMockPipeline ? (
          <Text style={styles.metaText}>
            {lastResult.recognizedText
              ? 'Speech-to-text used a fallback clip. For live transcription, run babel-party-server with GOOGLE_CLOUD_API_KEY (WAV upload + Cloud Speech API).'
              : 'Offline or mock pipeline. Point EXPO_PUBLIC_PIPELINE_URL at your server with GOOGLE_CLOUD_API_KEY for Google Translate + Speech.'}
          </Text>
        ) : null}
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreMain}>+{lastResult.totalTurnScore} pts</Text>
        <Text style={styles.scoreSub}>
          closeness {lastResult.closenessScore} · lang bonus {lastResult.languageBonus} · funny{' '}
          {lastResult.funnyVoteBonus}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: Colors.party.textMuted },
  originalLabel: { color: Colors.party.textMuted, fontSize: 12, fontWeight: '700' },
  original: { color: Colors.party.text, fontSize: 18, fontWeight: '600', marginTop: 4 },
  bigLabel: { color: Colors.party.accent2, fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  big: {
    color: Colors.party.text,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    marginTop: 8,
  },
  meta: { marginTop: 18, gap: 6 },
  metaText: { color: Colors.party.textMuted, fontSize: 13, lineHeight: 18 },
  scoreRow: { marginTop: 24, padding: 14, borderRadius: 14, backgroundColor: Colors.party.card },
  scoreMain: { color: Colors.party.success, fontSize: 22, fontWeight: '900' },
  scoreSub: { color: Colors.party.textMuted, marginTop: 6, fontSize: 13 },
});
