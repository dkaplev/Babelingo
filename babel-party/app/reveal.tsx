import { MomentSharePanel } from '@/components/MomentSharePanel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { normalizeTranslationText } from '@/lib/normalizeTranslation';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TurnResult } from '@/lib/types';

const REVEAL_FLAVOR_LINES = [
  'The spirits have spoken.',
  'English went on vacation.',
  'Somewhere, a linguist wept.',
  'This is canon now.',
  'The room will remember this.',
  'Poetry? Accident? Both.',
];

function mockSttExplanation(r: TurnResult): string {
  const hasHeard = Boolean(r.recognizedText?.trim());
  switch (r.sttMockReason) {
    case 'no_server_key':
      return hasHeard
        ? 'STT used a demo fallback: the API host has no Google key. Set GOOGLE_CLOUD_API_KEY on the server (exact spelling). Open your API /health — "google" should be true.'
        : 'Pipeline could not run live STT. Set GOOGLE_CLOUD_API_KEY only on the server (Render env or .env), not in the Expo app.';
    case 'no_recording':
      return 'No recording reached the server, so STT used a short stand-in from the phrase.';
    case 'bad_audio_format':
      return 'The clip was not valid WAV for Google STT, so a phrase stand-in was used. If this keeps happening, report it (iOS recording should be linear PCM WAV).';
    case 'google_stt_no_result':
      return hasHeard
        ? 'Google STT did not return usable text this time (quiet mic, background noise, very short clip, or API hiccup). “Heard” below is a stand-in from the target phrase — try speaking a bit louder and longer.'
        : 'Google STT did not return usable text; scoring used a fallback.';
    default:
      return hasHeard
        ? 'STT used a demo fallback. If your API /health shows "google": true, this can still happen when Google returns no transcript — try a clearer recording.'
        : 'Pipeline could not run live STT. Set EXPO_PUBLIC_PIPELINE_URL in the app build; put GOOGLE_CLOUD_API_KEY only on the server, not in babel-party.';
  }
}

export default function RevealScreen() {
  const router = useRouter();
  const lastResult = useGameStore((s) => s.lastResult);
  const funnyVotePending = useGameStore((s) => s.funnyVotePending);
  const grantFunnyBonus = useGameStore((s) => s.grantFunnyBonus);
  const advanceAfterReveal = useGameStore((s) => s.advanceAfterReveal);
  const [flavorIdx, setFlavorIdx] = useState(() => Math.floor(Math.random() * REVEAL_FLAVOR_LINES.length));

  const revealKey = lastResult
    ? `${lastResult.playerId}-${lastResult.roundNumber}-${lastResult.phraseOriginal}`
    : '';

  useEffect(() => {
    if (!revealKey) return;
    setFlavorIdx(Math.floor(Math.random() * REVEAL_FLAVOR_LINES.length));
  }, [revealKey]);

  useEffect(() => {
    if (!revealKey) return;
    const id = setInterval(() => {
      setFlavorIdx((i) => (i + 1) % REVEAL_FLAVOR_LINES.length);
    }, 2800);
    return () => clearInterval(id);
  }, [revealKey]);

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
      <Text style={styles.flavorLine} accessibilityLiveRegion="polite">
        {REVEAL_FLAVOR_LINES[flavorIdx]}
      </Text>
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
          <Text style={styles.metaText}>{mockSttExplanation(lastResult)}</Text>
        ) : null}
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreMain}>+{lastResult.totalTurnScore} pts</Text>
        <Text style={styles.scoreSub}>
          closeness {lastResult.closenessScore} · lang bonus {lastResult.languageBonus} · funny{' '}
          {lastResult.funnyVoteBonus}
        </Text>
      </View>

      <MomentSharePanel
        context="reveal"
        payload={{
          mangled: normalizeTranslationText(lastResult.reverseEnglish),
          originalEnglish: lastResult.phraseOriginal,
          languageLabel: lastResult.languageLabel,
          playerName: lastResult.playerName,
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flavorLine: {
    fontFamily: Font.body,
    fontSize: 15,
    color: Colors.party.accent2,
    marginBottom: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
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
