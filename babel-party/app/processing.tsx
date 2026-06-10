import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { audioModePlaybackSpeaker } from '@/lib/audioMode';
import { currentPlayer, useGameStore } from '@/lib/gameStore';
import { languageByCode } from '@/lib/languages';
import { buildSoloBabelDisplayChain } from '@/lib/babelSoloChain';
import { runEchoPipeline, runReversePipeline } from '@/lib/pipeline';
import type { TurnResult } from '@/lib/types';
import { Audio } from 'expo-av';
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
  const replaySound = useRef<Audio.Sound | null>(null);

  /**
   * Party moment: while the server works, play the player's attempt out loud
   * so the whole room hears the gibberish — kills the silent wait.
   */
  useEffect(() => {
    const uri = useGameStore.getState().pendingRecordingUri;
    if (!uri) return;
    let cancelled = false;
    void (async () => {
      try {
        await audioModePlaybackSpeaker();
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1 });
        if (cancelled) {
          await sound.unloadAsync();
          return;
        }
        replaySound.current = sound;
      } catch {
        /* non-fatal — the wait just stays quiet */
      }
    })();
    return () => {
      cancelled = true;
      const s = replaySound.current;
      replaySound.current = null;
      if (s) void s.unloadAsync().catch(() => {});
    };
  }, []);

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

      if (!player || !phrase || !langCode) {
        useGameStore.getState().resetSession();
        router.replace('/');
        return;
      }
      const lang = languageByCode(langCode);
      const started = Date.now();
      const appGame = store.settings.appGame;
      const out =
        appGame === 'reverse_audio'
          ? await runReversePipeline({
              recordingUri: recUri,
              originalEnglish: phrase.text,
            })
          : await runEchoPipeline({
              recordingUri: recUri,
              originalEnglish: phrase.text,
              translatedForeign: trans ?? '',
              languageCode: langCode,
              category: phrase.category,
            });
      trackEvent('round_processing_done', {
        latency_ms: Date.now() - started,
        mock: out.usedMockPipeline,
        language: langCode,
        app_game: appGame,
        chaos_score: out.chaosScore,
        timed_out: out.timedOut,
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
      <Screen title="Taking too long" subtitle="The room shouldn’t stall — try again or skip.">
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
    <Screen title="Listen back!" subtitle={line}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.party.accent} style={styles.spinner} />
        <Text style={styles.betPrompt}>🗣 That's what they said…</Text>
        <Text style={styles.note}>Shout your guesses — what is it in English?</Text>
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
