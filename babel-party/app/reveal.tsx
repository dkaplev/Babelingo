import { ChaosCounter } from '@/components/ChaosCounter';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { ShareModal } from '@/components/ShareModal';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { babelEnglishChainForRound } from '@/lib/sessionHighlights';
import { useGameStore } from '@/lib/gameStore';
import { normalizeTranslationText } from '@/lib/normalizeTranslation';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { TurnResult } from '@/lib/types';

/** Chaos score that earns the rare “legendary moment” share banner. */
const LEGENDARY_CHAOS = 90;

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
  const results = useGameStore((s) => s.results);
  const appGame = useGameStore((s) => s.settings.appGame);
  const funnyVotePending = useGameStore((s) => s.funnyVotePending);
  const grantFunnyBonus = useGameStore((s) => s.grantFunnyBonus);
  const advanceAfterReveal = useGameStore((s) => s.advanceAfterReveal);
  const [flavorIdx, setFlavorIdx] = useState(() => Math.floor(Math.random() * REVEAL_FLAVOR_LINES.length));
  const [shareOpen, setShareOpen] = useState(false);

  const revealKey = lastResult
    ? `${lastResult.playerId}-${lastResult.roundNumber}-${lastResult.phraseOriginal}`
    : '';

  /** The phone reads the mangled English out loud — the reveal lands as a sound, not just text. */
  useEffect(() => {
    if (!revealKey || !lastResult || lastResult.turnSkipped) return;
    const text = normalizeTranslationText(lastResult.reverseEnglish);
    if (!text.trim()) return;
    const chaos = lastResult.chaosScore ?? 0;
    void Haptics.notificationAsync(
      chaos >= LEGENDARY_CHAOS
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning,
    ).catch(() => {});
    const id = setTimeout(() => {
      Speech.speak(text, { language: 'en-US', volume: 1, pitch: 1, rate: 0.95 });
    }, 600);
    return () => {
      clearTimeout(id);
      Speech.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealKey]);

  const babelChain = useMemo(
    () =>
      lastResult && appGame === 'babel_phone'
        ? babelEnglishChainForRound(results, lastResult.roundNumber)
        : [],
    [lastResult, appGame, results],
  );

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
    Speech.stop();
    advanceAfterReveal();
    const { phase } = useGameStore.getState();
    trackEvent('reveal_next', { next_phase: phase });
    if (phase === 'turn') router.replace('/turn');
    else if (phase === 'scoreboard') router.replace('/scoreboard');
    else router.replace('/summary');
  };

  const isLegendary = !lastResult.turnSkipped && (lastResult.chaosScore ?? 0) >= LEGENDARY_CHAOS;

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
      <ShareModal visible={shareOpen} result={lastResult} onClose={() => setShareOpen(false)} />
      {isLegendary ? (
        <View style={styles.legendBanner}>
          <Text style={styles.legendTitle}>🏆 LEGENDARY CHAOS</Text>
          <Text style={styles.legendBody}>
            Chaos {lastResult.chaosScore} — moments like this don't happen every game.
          </Text>
          <PrimaryButton
            title="Share this legend"
            onPress={() => {
              trackEvent('share_moment_tap', { trigger: 'reveal_legendary' });
              setShareOpen(true);
            }}
          />
        </View>
      ) : null}
      <Text style={styles.flavorLine} accessibilityLiveRegion="polite">
        {REVEAL_FLAVOR_LINES[flavorIdx]}
      </Text>
      <View style={styles.block}>
        <Text style={styles.originalLabel}>
          {appGame === 'reverse_audio'
            ? 'Target phrase'
            : appGame === 'babel_phone'
              ? 'English they echoed from'
              : 'Started as'}
        </Text>
        <Text style={styles.original}>{lastResult.phraseOriginal}</Text>
      </View>

      <View style={[styles.block, styles.blockAccent]}>
        <Text style={styles.bigLabel}>
          {lastResult.turnSkipped
            ? 'Skipped'
            : appGame === 'reverse_audio'
              ? 'You said (final take)'
              : 'Came back as'}
        </Text>
        <Text style={styles.big}>{normalizeTranslationText(lastResult.reverseEnglish)}</Text>
      </View>

      {lastResult.turnSkipped ? null : (
        <ChaosCounter variant="hero" score={lastResult.chaosScore ?? 0} />
      )}

      {babelChain.length > 1 ? (
        <View style={styles.chainBox}>
          <Text style={styles.chainBoxTitle}>Chain so far this round</Text>
          {babelChain.map((line, i) => (
            <Text key={`${i}-${line.slice(0, 10)}`} style={styles.chainBoxLine}>
              → {line}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.meta}>
        {appGame === 'reverse_audio' ? null : (
          <Text style={styles.metaText}>Language: {lastResult.languageLabel}</Text>
        )}
        {lastResult.recognizedText ? (
          <Text style={styles.metaText}>Heard: {normalizeTranslationText(lastResult.recognizedText)}</Text>
        ) : null}
        {lastResult.usedMockPipeline ? (
          <Text style={styles.metaText}>{mockSttExplanation(lastResult)}</Text>
        ) : null}
      </View>

      <View style={styles.scoreRow}>
        <Text style={styles.scoreMain}>+{lastResult.totalTurnScore} pts</Text>
      </View>

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
  legendBanner: {
    backgroundColor: Colors.party.surface2,
    borderRadius: 18,
    padding: 16,
    borderWidth: 3,
    borderColor: Colors.party.podiumGold,
    gap: 10,
    marginBottom: 14,
  },
  legendTitle: {
    fontFamily: Font.titleHeavy,
    fontSize: 18,
    color: Colors.party.podiumGold,
    letterSpacing: 0.6,
  },
  legendBody: {
    fontFamily: Font.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.party.textMuted,
  },
  chainBox: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.party.surface2,
    borderWidth: 2,
    borderColor: Colors.party.borderSubtle,
    marginBottom: 12,
    gap: 6,
  },
  chainBoxTitle: {
    fontFamily: Font.bodyBold,
    fontSize: 12,
    color: Colors.party.accent2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chainBoxLine: {
    fontFamily: Font.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.party.textMuted,
  },
});
