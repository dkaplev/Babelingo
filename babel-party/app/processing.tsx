import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { currentPlayer, useGameStore } from '@/lib/gameStore';
import { languageByCode } from '@/lib/languages';
import { buildSoloBabelDisplayChain } from '@/lib/babelSoloChain';
import { runEchoPipeline, runReversePipeline } from '@/lib/pipeline';
import {
  playRecordingToCompletion,
  shouldReplayRecordingDuringProcessing,
} from '@/lib/recordingPlayback';
import type { TurnResult } from '@/lib/types';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const COPY = [
  'Consulting the language spirits…',
  'Asking the phrase what it meant…',
  'Teaching the microphone new feelings…',
  'Translating your beautiful mistakes…',
];

export default function ProcessingScreen() {
  const router = useRouter();
  const ran = useRef(false);
  const [line] = useState(() => COPY[Math.floor(Math.random() * COPY.length)]!);
  const [timedOut, setTimedOut] = useState(false);
  const durationSec = useGameStore((s) => s.pendingRecordingDurationSec);
  const willReplay = shouldReplayRecordingDuringProcessing(durationSec);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      const store = useGameStore.getState();
      const player = currentPlayer(store);
      const phrase = store.roundPhrase;
      const langCode = store.currentLanguageCode;
      const trans = store.translatedText;
      const recUri = store.pendingRecordingUri;
      const replay = Boolean(recUri && shouldReplayRecordingDuringProcessing(store.pendingRecordingDurationSec));

      if (!player || !phrase || !langCode) {
        useGameStore.getState().resetSession();
        router.replace('/');
        return;
      }
      const lang = languageByCode(langCode);
      const started = Date.now();
      const appGame = store.settings.appGame;

      const pipelinePromise =
        appGame === 'reverse_audio'
          ? runReversePipeline({
              recordingUri: recUri,
              originalEnglish: phrase.text,
            })
          : runEchoPipeline({
              recordingUri: recUri,
              originalEnglish: phrase.text,
              translatedForeign: trans ?? '',
              languageCode: langCode,
              category: phrase.category,
            });

      const out = replay && recUri
        ? (await Promise.all([pipelinePromise, playRecordingToCompletion(recUri)]))[0]!
        : await pipelinePromise;

      trackEvent('round_processing_done', {
        latency_ms: Date.now() - started,
        mock: out.usedMockPipeline,
        language: langCode,
        app_game: appGame,
        chaos_score: out.chaosScore,
        timed_out: out.timedOut,
        replay_during_processing: replay,
        recording_duration_sec: store.pendingRecordingDurationSec ?? 0,
      });

      if (out.timedOut) {
        setTimedOut(true);
        return;
      }

      const totalTurnScore = (out.closenessScore + out.languageBonus) as number;

      let babelDisplayChain: string[] | undefined;
      if (appGame === 'babel_phone' && store.players.length === 1 && !out.timedOut) {
        try {
          babelDisplayChain = await buildSoloBabelDisplayChain(phrase.text, out.reverseEnglish, 4);
        } catch {
          babelDisplayChain = undefined;
        }
      }

      const result: TurnResult = {
        roundNumber: store.currentRound,
        turnOrderInRound: store.turnIndex,
        playerId: player.id,
        playerName: player.name,
        phraseOriginal: phrase.text,
        phraseCategory: phrase.category,
        languageCode: langCode,
        languageLabel: lang?.label ?? langCode,
        translatedText: appGame === 'reverse_audio' ? '(reversed audio)' : (trans ?? ''),
        recognizedText: out.recognizedText,
        reverseEnglish: out.reverseEnglish,
        closenessScore: out.closenessScore,
        languageBonus: out.languageBonus,
        funnyVoteBonus: 0,
        totalTurnScore,
        funnyLabel: out.funnyLabel,
        usedMockPipeline: out.usedMockPipeline,
        sttMockReason: out.sttMockReason,
        chaosScore: out.chaosScore,
        babelDisplayChain,
      };

      useGameStore.getState().commitTurnResult(result);
      router.replace('/reveal');
    })();
  }, [router]);

  const retry = () => {
    ran.current = false;
    setTimedOut(false);
    router.replace('/turn');
  };

  const skipTurn = () => {
    useGameStore.getState().commitSkippedTurn();
    router.replace('/reveal');
  };

  if (timedOut) {
    return (
      <Screen title="Taking too long" subtitle="The room shouldn't stall — try again or skip.">
        <View style={styles.center}>
          <Text style={styles.warn}>Something went wrong — usually network or a busy server.</Text>
          <PrimaryButton title="Retry" onPress={retry} />
          <View style={{ height: 12 }} />
          <PrimaryButton variant="ghost" title="Skip this turn" onPress={skipTurn} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title={willReplay ? 'Listen back!' : 'Translating…'} subtitle={line}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.party.accent} style={styles.spinner} />
        {willReplay ? (
          <>
            <Text style={styles.betPrompt}>🗣 That's what they said…</Text>
            <Text style={styles.note}>Shout your guesses — what is it in English?</Text>
          </>
        ) : (
          <Text style={styles.note}>Hang tight — the room hears the reveal in a moment.</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingTop: 8 },
  spinner: { marginTop: 32, marginBottom: 24 },
  betPrompt: {
    fontFamily: Font.bodyBold,
    color: Colors.party.accentPop,
    fontSize: 20,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 10,
  },
  note: {
    fontFamily: Font.body,
    color: Colors.party.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 280,
  },
  warn: {
    fontFamily: Font.body,
    color: Colors.party.danger,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 24,
  },
});
