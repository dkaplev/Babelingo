import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
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
              ? 'STT used a demo fallback. The Google key lives only on the API host: set GOOGLE_CLOUD_API_KEY on Render (exact spelling). Visit your API /health — "google" should be true.'
              : 'Pipeline could not run live STT. Use EXPO_PUBLIC_PIPELINE_URL in the app; put GOOGLE_CLOUD_API_KEY only on the server (.env locally, Environment on Render), not in babel-party.'}
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
  muted: { fontFamily: Font.body, color: Colors.party.textMuted },
  block: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: Colors.party.card,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
    marginBottom: 12,
  },
  blockAccent: {
    borderLeftWidth: 6,
    borderLeftColor: Colors.party.accentPop,
  },
  originalLabel: { fontFamily: Font.bodyBold, color: Colors.party.textMuted, fontSize: 12, letterSpacing: 0.4 },
  original: { fontFamily: Font.body, color: Colors.party.text, fontSize: 18, marginTop: 6, lineHeight: 26 },
  bigLabel: { fontFamily: Font.bodyBold, color: Colors.party.accent2, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  big: {
    fontFamily: Font.title,
    color: Colors.party.accentPop,
    fontSize: 24,
    lineHeight: 32,
    marginTop: 10,
  },
  meta: { marginTop: 8, gap: 8 },
  metaText: { fontFamily: Font.body, color: Colors.party.textMuted, fontSize: 14, lineHeight: 20 },
  scoreRow: {
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    backgroundColor: Colors.party.surface2,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
  },
  scoreMain: { fontFamily: Font.title, color: Colors.party.success, fontSize: 22 },
  scoreSub: { fontFamily: Font.body, color: Colors.party.textMuted, marginTop: 8, fontSize: 14, lineHeight: 20 },
});
