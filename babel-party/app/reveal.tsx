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
      subtitleVariant="highlight"
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
      <View style={styles.block}>
        <Text style={styles.originalLabel}>Started as</Text>
        <Text style={styles.original}>{lastResult.phraseOriginal}</Text>
      </View>

      <View style={[styles.block, styles.blockAccent]}>
        <Text style={styles.bigLabel}>Came back as</Text>
        <Text style={styles.big}>{normalizeTranslationText(lastResult.reverseEnglish)}</Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaText}>Language: {lastResult.languageLabel}</Text>
        {lastResult.recognizedText ? (
          <Text style={styles.metaText}>Heard: {normalizeTranslationText(lastResult.recognizedText)}</Text>
        ) : null}
        {lastResult.usedMockPipeline ? (
          <Text style={styles.metaText}>
            {lastResult.recognizedText
              ? 'Speech used a demo fallback. For live transcription, run the API with GOOGLE_CLOUD_API_KEY.'
              : 'Offline / demo pipeline. Set EXPO_PUBLIC_PIPELINE_URL to your deployed API with a Google key.'}
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
  block: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.party.card,
    borderWidth: 1,
    borderColor: Colors.party.borderSubtle,
    marginBottom: 12,
  },
  blockAccent: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.party.accent2,
  },
  originalLabel: { color: Colors.party.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  original: { color: Colors.party.text, fontSize: 18, fontWeight: '600', marginTop: 6, lineHeight: 26 },
  bigLabel: { color: Colors.party.accent2, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  big: {
    color: Colors.party.text,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '900',
    marginTop: 10,
  },
  meta: { marginTop: 8, gap: 8 },
  metaText: { color: Colors.party.textMuted, fontSize: 13, lineHeight: 19 },
  scoreRow: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.party.surface2,
    borderWidth: 1,
    borderColor: Colors.party.borderSubtle,
  },
  scoreMain: { color: Colors.party.success, fontSize: 24, fontWeight: '900' },
  scoreSub: { color: Colors.party.textMuted, marginTop: 8, fontSize: 13, lineHeight: 18 },
});
