import { usePartyPalette } from '@/components/GameThemeProvider';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RecordingErrorBanner } from '@/components/RecordingErrorBanner';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { audioModePlaybackSpeaker, audioModeRecording } from '@/lib/audioMode';
import { MAX_PHRASE_PLAYS, currentPlayer, useGameStore } from '@/lib/gameStore';
import { requestMicrophonePermission } from '@/lib/recording';
import { clampPlaybackSpeed, PLAYBACK_SPEED_DEFAULT } from '@/lib/playbackSpeed';
import { languageByCode } from '@/lib/languages';
import { RECORDING_OPTIONS_GOOGLE_STT } from '@/lib/recordingOptions';
import { forceDevicePhraseTts, getPipelineBaseUrl } from '@/lib/env';
import {
  fetchReverseRecordingWavBase64,
  fetchTtsReversedWavBase64,
  playGoogleTts,
  playPipelineWavBase64,
  stopPipelineTtsPlayback,
  useGoogleCloudTts,
} from '@/lib/playGoogleTts';
import { translateEnToWithMeta, type TranslationSource } from '@/lib/translate';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function ListenReplayCountdown(props: { listensRemaining: number; caption: string }) {
  const { listensRemaining, caption } = props;
  return (
    <View style={styles.listenCountWrap}>
      <Text style={styles.listenCountLine}>
        <Text style={styles.listenCountNum}>{listensRemaining}</Text>
        <Text style={styles.listenCountRest}> / {MAX_PHRASE_PLAYS} replays left</Text>
      </Text>
      <Text style={styles.listenCountHint}>{caption}</Text>
    </View>
  );
}

/** Random handoff title so even passing the phone gets a laugh. */
const PASS_TITLES = [
  'Minister of Mispronunciation',
  'Captain of Chaos',
  'Director of Beautiful Mistakes',
  'Head of Accidental Poetry',
  'Chief Tongue Twister',
  'Ambassador of Gibberish',
  'Professor of Wrong Answers',
  'DJ of Disaster',
];

function passTitleFor(playerId: string, round: number, turn: number): string {
  let h = 0;
  const seed = `${playerId}-${round}-${turn}`;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return PASS_TITLES[Math.abs(h) % PASS_TITLES.length]!;
}

function EchoBabelTurnScreen() {
  const party = usePartyPalette();
  const router = useRouter();
  const roundPhrase = useGameStore((s) => s.roundPhrase);
  const currentLanguageCode = useGameStore((s) => s.currentLanguageCode);
  const translatedText = useGameStore((s) => s.translatedText);
  const listensRemaining = useGameStore((s) => s.listensRemaining);
  const setTranslation = useGameStore((s) => s.setTranslation);
  const nextListenConsumed = useGameStore((s) => s.nextListenConsumed);
  const setRecordingUri = useGameStore((s) => s.setRecordingUri);
  const commitSkippedTurn = useGameStore((s) => s.commitSkippedTurn);
  const resetSession = useGameStore((s) => s.resetSession);
  const phase = useGameStore((s) => s.phase);

  const [passConfirmed, setPassConfirmed] = useState(false);
  const [loadingTts, setLoadingTts] = useState(true);
  const [translationSource, setTranslationSource] = useState<TranslationSource | null>(null);
  const [translationLoadError, setTranslationLoadError] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [phrasePlaybackBusy, setPhrasePlaybackBusy] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [tooShort, setTooShort] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = useGameStore((s) => currentPlayer(s));
  const players = useGameStore((s) => s.players);
  const turnIndex = useGameStore((s) => s.turnIndex);
  const currentRound = useGameStore((s) => s.currentRound);
  const solo = players.length === 1;
  const lang = currentLanguageCode ? languageByCode(currentLanguageCode) : undefined;

  const hasListenedOnce = listensRemaining < MAX_PHRASE_PLAYS;
  const canStartRecord = hasListenedOnce && !phrasePlaybackBusy && !loadingTts;
  const translationReady = Boolean(translatedText?.trim());
  const needsTranslationFix =
    !loadingTts && !translationReady && (translationLoadError != null || translationSource === null);

  useEffect(() => {
    setPassConfirmed(false);
  }, [roundPhrase?.id, player?.id]);

  /**
   * Only bail out when we are actually in the turn phase but state is still invalid.
   * Otherwise a stale /turn mount (e.g. after returning home) would call resetSession and
   * wipe a newly started lobby session.
   */
  useEffect(() => {
    if (phase !== 'turn') return;
    if (roundPhrase && player) return;
    const timer = setTimeout(() => {
      const s = useGameStore.getState();
      if (s.phase !== 'turn') return;
      const p = currentPlayer(s);
      if (s.roundPhrase && p) return;
      resetSession();
      router.replace('/');
    }, 200);
    return () => clearTimeout(timer);
  }, [roundPhrase?.id, player?.id, phase, resetSession, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!roundPhrase || !currentLanguageCode) return;
      setLoadingTts(true);
      setTranslationLoadError(null);
      try {
        const { text, source } = await translateEnToWithMeta(roundPhrase.text, currentLanguageCode);
        if (!cancelled) {
          setTranslation(text, currentLanguageCode);
          setTranslationSource(source);
        }
      } catch (e) {
        if (!cancelled) {
          setTranslationLoadError(e instanceof Error ? e.message : 'Translation failed');
          setTranslationSource('offline');
        }
      } finally {
        if (!cancelled) setLoadingTts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roundPhrase?.id, currentLanguageCode, setTranslation]);

  const retryTranslation = () => {
    if (!roundPhrase || !currentLanguageCode) return;
    void (async () => {
      setLoadingTts(true);
      setTranslationLoadError(null);
      try {
        const { text, source } = await translateEnToWithMeta(roundPhrase.text, currentLanguageCode);
        setTranslation(text, currentLanguageCode);
        setTranslationSource(source);
      } catch (e) {
        setTranslationLoadError(e instanceof Error ? e.message : 'Translation failed');
        setTranslationSource('offline');
      } finally {
        setLoadingTts(false);
      }
    })();
  };

  useEffect(() => {
    return () => {
      if (tick.current) clearInterval(tick.current);
      Speech.stop();
    };
  }, []);

  /** Warm playback session so first “Play” isn’t silent (iOS session timing). */
  useEffect(() => {
    if (!passConfirmed) return;
    const id = setTimeout(() => {
      void audioModePlaybackSpeaker();
    }, Platform.OS === 'ios' ? 240 : 100);
    return () => clearTimeout(id);
  }, [passConfirmed]);

  const speakDeviceTtsUntilDone = (text: string, speechLocale: string, speechRate: number) =>
    new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const rate = Math.max(0.25, Math.min(1, speechRate));
      Speech.speak(text, {
        language: speechLocale,
        volume: 1,
        pitch: 1,
        rate,
        ...(Platform.OS === 'ios'
          ? {
              /** Separate system TTS session — avoids routing to the earpiece with the app’s PlayAndRecord session. */
              useApplicationAudioSession: false,
            }
          : {}),
        onDone: finish,
        onStopped: finish,
        onError: finish,
      });
      setTimeout(finish, 120_000);
    });

  const onListen = async () => {
    if (!translatedText || !lang) return;
    if (listensRemaining <= 0) return;
    if (phrasePlaybackBusy) return;
    Speech.stop();
    await stopPipelineTtsPlayback();
    setPhrasePlaybackBusy(true);
    try {
      const playbackRate = clampPlaybackSpeed(
        useGameStore.getState().settings.playbackSpeed ?? PLAYBACK_SPEED_DEFAULT,
      );
      let played = false;
      const pipeline = getPipelineBaseUrl();
      const preferPipeline = Boolean(pipeline) && !forceDevicePhraseTts();
      if (preferPipeline) {
        try {
          await playGoogleTts(translatedText, lang.speechLocale, { playbackRate });
          played = true;
        } catch {
          /* fall through to device */
        }
      }
      if (!played && useGoogleCloudTts()) {
        try {
          await playGoogleTts(translatedText, lang.speechLocale, { playbackRate });
          played = true;
        } catch {
          /* fall through */
        }
      }
      if (!played) {
        await audioModePlaybackSpeaker();
        await new Promise<void>((res) => InteractionManager.runAfterInteractions(() => res()));
        await speakDeviceTtsUntilDone(translatedText, lang.speechLocale, playbackRate);
      }
      nextListenConsumed();
    } finally {
      setPhrasePlaybackBusy(false);
    }
  };

  const confirmMainMenu = () => {
    Alert.alert('Leave game?', 'This clears the current session and returns home.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Main menu',
        style: 'destructive',
        onPress: () => {
          Speech.stop();
          void stopPipelineTtsPlayback();
          trackEvent('turn_exit_main_menu');
          resetSession();
          router.replace('/');
        },
      },
    ]);
  };

  const menuRow = (
    <Pressable onPress={confirmMainMenu} style={styles.menuRow} hitSlop={8}>
      <Text style={[styles.menuText, { color: party.accent2 }]}>◀ MAIN MENU</Text>
    </Pressable>
  );

  const startRecording = async () => {
    if (phrasePlaybackBusy) return;
    Speech.stop();
    await stopPipelineTtsPlayback();
    setRecordingUri(null);
    setTooShort(false);
    const pr = await requestMicrophonePermission();
    if (!pr.ok) {
      setMicDenied(true);
      setShowSkip(true);
      return;
    }
    setMicDenied(false);
    try {
      await new Promise((r) => setTimeout(r, 50));
      await audioModeRecording();
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(RECORDING_OPTIONS_GOOGLE_STT);
      await rec.startAsync();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setRecording(rec);
      setIsRecording(true);
      setSeconds(0);
      if (tick.current) clearInterval(tick.current);
      tick.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setShowSkip(true);
    }
  };

  /** Stop and immediately submit — the round shouldn't wait for an extra confirm tap. */
  const stopAndSubmit = async () => {
    if (!recording) return;
    const elapsed = seconds;
    let uri: string | null = null;
    try {
      await recording.stopAndUnloadAsync();
      uri = recording.getURI();
      setRecordingUri(uri, elapsed);
    } finally {
      setRecording(null);
      setIsRecording(false);
      if (tick.current) {
        clearInterval(tick.current);
        tick.current = null;
      }
      await audioModePlaybackSpeaker();
      await new Promise((r) => setTimeout(r, Platform.OS === 'ios' ? 90 : 40));
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    if (uri && elapsed >= 1) {
      router.push('/processing');
    } else {
      setTooShort(true);
      setRecordingUri(null);
    }
  };

  if (!roundPhrase || !player) {
    return null;
  }

  if (!passConfirmed) {
    const passTitle = passTitleFor(player.id, currentRound, turnIndex);
    return (
      <Screen
        title={solo ? 'Your turn' : 'Pass the phone'}
        subtitle={solo ? 'The real line stays secret until the scoreboard.' : 'Hand it over — no peeking from the bench.'}
        footer={
          <PrimaryButton
            title={solo ? 'Continue to audio clue' : `${player.name} has the phone — go!`}
            onPress={() => setPassConfirmed(true)}
            accessibilityLabel={solo ? 'Continue to audio clue' : `Confirm ${player.name} is holding the phone`}
          />
        }>
        {menuRow}
        <View style={[styles.passCard, { borderColor: party.neonStroke }]}>
          <Text style={styles.passArrow}>📲</Text>
          <Text style={[styles.passName, { color: party.accentPop }]}>{player.name}</Text>
          <Text style={[styles.passTitle, { color: party.accent2 }]}>{passTitle}</Text>
        </View>
        <View style={[styles.card, { borderColor: party.neonStroke }]}>
          <Text style={styles.whisper}>No peeking</Text>
          <Text style={styles.en}>
            {solo
              ? 'Keep the phrase to yourself until the scoreboard.'
              : 'No English read aloud yet — the phrase is revealed for everyone after the round.'}
          </Text>
        </View>
      </Screen>
    );
  }

  /** One morphing action button — the player always has exactly one obvious thing to tap. */
  const step: 'loading' | 'play' | 'playing' | 'record' | 'recording' = loadingTts
    ? 'loading'
    : isRecording
      ? 'recording'
      : phrasePlaybackBusy
        ? 'playing'
        : !hasListenedOnce
          ? 'play'
          : 'record';

  const mainButton =
    step === 'loading'
      ? { title: 'Loading…', onPress: () => {}, disabled: true }
      : step === 'play'
        ? { title: '▶  Play the clue', onPress: () => void onListen(), disabled: false }
        : step === 'playing'
          ? { title: 'Listening…', onPress: () => {}, disabled: true }
          : step === 'record'
            ? {
                title: tooShort ? '●  Record again' : '●  Record your take',
                onPress: () => void startRecording(),
                disabled: !canStartRecord,
              }
            : { title: `■  Done (${seconds}s)`, onPress: () => void stopAndSubmit(), disabled: false };

  const stepHint =
    step === 'play'
      ? 'Only you should hear this — hold the phone close.'
      : step === 'recording'
        ? 'Say it loud — tap Done when you finish.'
        : step === 'record'
          ? tooShort
            ? 'That was too short — hold it for at least a second.'
            : 'Your turn to speak. Replays are optional.'
          : ' ';

  return (
    <Screen
      title={`${player.name}’s turn`}
      subtitle={lang ? `Mystery language: ${lang.label}` : 'Loading…'}
      footer={
        <View style={{ gap: 10 }}>
          {showSkip || micDenied ? (
            <PrimaryButton
              variant="ghost"
              title="Skip this turn"
              onPress={() => {
                commitSkippedTurn();
                router.replace('/reveal');
              }}
            />
          ) : null}
          <PrimaryButton
            title={mainButton.title}
            onPress={mainButton.onPress}
            disabled={mainButton.disabled}
            accessibilityLabel={mainButton.title}
          />
        </View>
      }>
      {menuRow}
      {micDenied ? (
        <RecordingErrorBanner message="Microphone is off — turn it on so we can hear your attempt, or skip this turn." />
      ) : null}
      {needsTranslationFix ? (
        <View style={styles.errorCard}>
          <Text style={styles.warn}>
            {translationLoadError ??
              'No translation loaded. Check Wi‑Fi and EXPO_PUBLIC_PIPELINE_URL, then retry.'}
          </Text>
          <PrimaryButton title="Retry translation" onPress={retryTranslation} />
        </View>
      ) : null}

      {loadingTts ? (
        <ActivityIndicator color={party.accent} style={{ marginVertical: 24 }} />
      ) : !needsTranslationFix ? (
        <>
          <View style={[styles.stepCard, { borderColor: party.neonStroke }]}>
            <Text style={[styles.stepBig, { color: party.accentPop }]}>
              {step === 'play'
                ? 'Listen'
                : step === 'playing'
                  ? 'Listen…'
                  : step === 'recording'
                    ? `Recording · ${seconds}s`
                    : 'Speak'}
            </Text>
            <Text style={styles.stepHintText}>{stepHint}</Text>
          </View>

          {hasListenedOnce && listensRemaining > 0 && !isRecording ? (
            <Pressable
              onPress={() => void onListen()}
              disabled={phrasePlaybackBusy}
              style={styles.replayLink}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Replay the clue">
              <Text style={[styles.replayLinkText, { color: party.accent2 }]}>
                ↻ Replay the clue ({listensRemaining} left)
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

function ReverseTurnScreen() {
  const party = usePartyPalette();
  const router = useRouter();
  const roundPhrase = useGameStore((s) => s.roundPhrase);
  const listensRemaining = useGameStore((s) => s.listensRemaining);
  const nextListenConsumed = useGameStore((s) => s.nextListenConsumed);
  const setRecordingUri = useGameStore((s) => s.setRecordingUri);
  const pendingRecordingUri = useGameStore((s) => s.pendingRecordingUri);
  const resetSession = useGameStore((s) => s.resetSession);
  const phase = useGameStore((s) => s.phase);
  const reverseStep = useGameStore((s) => s.reverseStep);
  const reverseGuessUri = useGameStore((s) => s.reverseGuessUri);
  const commitReverseGuess = useGameStore((s) => s.commitReverseGuess);
  const resetReverseTurn = useGameStore((s) => s.resetReverseTurn);
  const commitSkippedTurn = useGameStore((s) => s.commitSkippedTurn);

  const [passConfirmed, setPassConfirmed] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [phrasePlaybackBusy, setPhrasePlaybackBusy] = useState(false);
  const [reverseError, setReverseError] = useState<string | null>(null);
  const [micDenied, setMicDenied] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = useGameStore((s) => currentPlayer(s));
  const players = useGameStore((s) => s.players);
  const solo = players.length === 1;
  const hasListenedOnce = listensRemaining < MAX_PHRASE_PLAYS;
  const hasFinalRecording = Boolean(pendingRecordingUri);
  const canStartRecord =
    hasListenedOnce && !phrasePlaybackBusy && (reverseStep === 1 || Boolean(reverseGuessUri));
  const pipelineOk = Boolean(getPipelineBaseUrl());

  useEffect(() => {
    setPassConfirmed(false);
    setReverseError(null);
  }, [roundPhrase?.id, player?.id]);

  useEffect(() => {
    if (phase !== 'turn') return;
    if (roundPhrase && player) return;
    const timer = setTimeout(() => {
      const s = useGameStore.getState();
      if (s.phase !== 'turn') return;
      const p = currentPlayer(s);
      if (s.roundPhrase && p) return;
      resetSession();
      router.replace('/');
    }, 200);
    return () => clearTimeout(timer);
  }, [roundPhrase?.id, player?.id, phase, resetSession, router]);

  useEffect(() => {
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, []);

  useEffect(() => {
    if (!passConfirmed) return;
    const id = setTimeout(() => {
      void audioModePlaybackSpeaker();
    }, Platform.OS === 'ios' ? 240 : 100);
    return () => clearTimeout(id);
  }, [passConfirmed]);

  const confirmMainMenu = () => {
    Alert.alert('Leave game?', 'This clears the current session and returns home.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Main menu',
        style: 'destructive',
        onPress: () => {
          void stopPipelineTtsPlayback();
          trackEvent('turn_exit_main_menu');
          resetSession();
          router.replace('/');
        },
      },
    ]);
  };

  const menuRow = (
    <Pressable onPress={confirmMainMenu} style={styles.menuRow} hitSlop={8}>
      <Text style={[styles.menuText, { color: party.accent2 }]}>◀ MAIN MENU</Text>
    </Pressable>
  );

  const onPlayBackwardTarget = async () => {
    if (!roundPhrase || listensRemaining <= 0 || phrasePlaybackBusy) return;
    setReverseError(null);
    setPhrasePlaybackBusy(true);
    try {
      await stopPipelineTtsPlayback();
      const playbackRate = clampPlaybackSpeed(
        useGameStore.getState().settings.playbackSpeed ?? PLAYBACK_SPEED_DEFAULT,
      );
      const isWeb = Platform.OS === 'web';
      const b64 = await fetchTtsReversedWavBase64(
        roundPhrase.text,
        isWeb ? { speakingRate: playbackRate } : undefined,
      );
      await playPipelineWavBase64(b64, { playbackRate: isWeb ? 1 : playbackRate });
      nextListenConsumed();
    } catch (e) {
      setReverseError(e instanceof Error ? e.message : 'Could not play reversed phrase');
    } finally {
      setPhrasePlaybackBusy(false);
    }
  };

  const onPlayGuessReversed = async () => {
    if (!reverseGuessUri || listensRemaining <= 0 || phrasePlaybackBusy) return;
    setReverseError(null);
    setPhrasePlaybackBusy(true);
    try {
      await stopPipelineTtsPlayback();
      const b64 = await fetchReverseRecordingWavBase64(reverseGuessUri);
      await playPipelineWavBase64(b64, { playbackRate: 1 });
      nextListenConsumed();
    } catch (e) {
      setReverseError(e instanceof Error ? e.message : 'Could not reverse your recording');
    } finally {
      setPhrasePlaybackBusy(false);
    }
  };

  const startRecording = async () => {
    if (phrasePlaybackBusy) return;
    await stopPipelineTtsPlayback();
    if (reverseStep === 2) {
      setRecordingUri(null);
    }
    const pr = await requestMicrophonePermission();
    if (!pr.ok) {
      setMicDenied(true);
      setShowSkip(true);
      return;
    }
    setMicDenied(false);
    try {
      await new Promise((r) => setTimeout(r, 50));
      await audioModeRecording();
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(RECORDING_OPTIONS_GOOGLE_STT);
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
      setSeconds(0);
      if (tick.current) clearInterval(tick.current);
      tick.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setShowSkip(true);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    const elapsed = seconds;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        if (reverseStep === 1) {
          commitReverseGuess(uri);
        } else {
          setRecordingUri(uri, elapsed);
        }
      }
      if (elapsed < 1) setShowSkip(true);
    } finally {
      setRecording(null);
      setIsRecording(false);
      if (tick.current) {
        clearInterval(tick.current);
        tick.current = null;
      }
      await audioModePlaybackSpeaker();
      await new Promise((r) => setTimeout(r, Platform.OS === 'ios' ? 90 : 40));
    }
  };

  const onSubmit = async () => {
    if (isRecording) await stopRecording();
    router.push('/processing');
  };

  if (!roundPhrase || !player) {
    return null;
  }

  if (!passConfirmed) {
    return (
      <Screen
        title={solo ? 'Your turn' : 'Pass the phone'}
        subtitle={
          solo
            ? `${player.name}, solo run — the answer stays hidden until the scoreboard. Next: backward clue, then your turn to mimic.`
            : `${player.name} is up. Each player has a different short line this round — nothing is revealed until the scoreboard. Next: backward audio on the following screen.`
        }
        footer={
          <PrimaryButton
            title={solo ? 'Continue to backward audio' : `${player.name} has the phone — continue`}
            onPress={() => setPassConfirmed(true)}
            accessibilityLabel={solo ? 'Continue to backward audio' : `Confirm ${player.name} is holding the phone`}
          />
        }>
        {menuRow}
        <View style={[styles.card, { borderColor: party.neonStroke }]}>
          <Text style={styles.whisper}>Secret until scoreboard</Text>
          <Text style={styles.en}>
            Clues are only 4–5 words but brutal backward. After your mimic, your clip plays reversed at normal speed
            before you say the real line.
          </Text>
        </View>
      </Screen>
    );
  }

  const playLabel =
    reverseStep === 1 ? '① Play phrase backward' : '② Play your attempt backward';
  const onPlay = reverseStep === 1 ? onPlayBackwardTarget : onPlayGuessReversed;
  const playDisabled =
    listensRemaining <= 0 ||
    phrasePlaybackBusy ||
    (reverseStep === 2 && !reverseGuessUri) ||
    !pipelineOk;
  const playIsPrimary =
    !isRecording && listensRemaining > 0 && !hasListenedOnce && !phrasePlaybackBusy;
  const recordIsPrimary =
    !isRecording &&
    !phrasePlaybackBusy &&
    hasListenedOnce &&
    (reverseStep === 1 ? !reverseGuessUri : !hasFinalRecording);

  return (
    <Screen
      title={`${player.name} · Reverse Audio`}
      subtitle={
        reverseStep === 1
          ? 'Step 1 of 2 — backward clue, then mimic'
          : 'Step 2 of 2 — your clip backward, then say the line'
      }
      footer={
        <View style={{ gap: 10 }}>
          {showSkip || micDenied ? (
            <PrimaryButton
              variant="ghost"
              title="Skip this turn"
              onPress={() => {
                commitSkippedTurn();
                router.replace('/reveal');
              }}
            />
          ) : null}
          {reverseStep === 2 ? (
            <PrimaryButton variant="ghost" title="Re-do step 1 (discard progress)" onPress={resetReverseTurn} />
          ) : null}
          <PrimaryButton
            title="Submit turn"
            onPress={onSubmit}
            disabled={reverseStep !== 2 || !pendingRecordingUri || isRecording}
            variant={reverseStep === 2 && pendingRecordingUri && !isRecording ? 'primary' : 'dim'}
            accessibilityLabel="Submit turn for processing"
          />
        </View>
      }>
      {menuRow}
      {micDenied ? (
        <RecordingErrorBanner message="Microphone is off — enable it in Settings, or skip this turn so the party keeps moving." />
      ) : null}

      {!pipelineOk ? (
        <View style={styles.errorCard}>
          <Text style={styles.warn}>
            Set EXPO_PUBLIC_PIPELINE_URL so the app can build reversed audio (Google key on the server).
          </Text>
        </View>
      ) : null}

      {reverseError ? (
        <View style={styles.errorCard}>
          <Text style={styles.warn}>{reverseError}</Text>
        </View>
      ) : null}

      <ListenReplayCountdown
        listensRemaining={listensRemaining}
        caption={
          reverseStep === 1
            ? listensRemaining <= 0
              ? 'Record your backward mimic when ready.'
              : hasListenedOnce
                ? `Replay backward clue (${listensRemaining} left) or record your mimic.`
                : 'Listen to the backward clue — then record your mimic.'
            : listensRemaining <= 0
              ? 'Record the real phrase when ready.'
              : hasListenedOnce
                ? `Replay your clip reversed (${listensRemaining} left) or record the answer.`
                : 'Hear your attempt reversed, then record the real phrase.'
        }
      />

      <PrimaryButton
        title={
          listensRemaining <= 0
            ? 'No replays left'
            : hasListenedOnce
              ? `${reverseStep === 1 ? 'Replay backward clue' : 'Replay reversed clip'} (${listensRemaining} left)`
              : playLabel
        }
        onPress={() => void onPlay()}
        disabled={playDisabled}
        variant={playIsPrimary ? 'primary' : 'dim'}
        accessibilityLabel={playLabel}
      />

      <View style={{ height: 14 }} />

      {!isRecording ? (
        <PrimaryButton
          title={
            reverseStep === 1
              ? reverseGuessUri
                ? 'Re-record backward mimic'
                : 'Record your backward mimic'
              : hasFinalRecording
                ? 'Re-record final phrase'
                : 'Record the real phrase'
          }
          onPress={() => void startRecording()}
          disabled={!canStartRecord || phrasePlaybackBusy}
          variant={recordIsPrimary ? 'primary' : 'dim'}
          accessibilityLabel="Record"
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Stop recording"
          style={[styles.recordBtn, styles.recordActive]}
          onPress={() => void stopRecording()}>
          <Text style={styles.recordLabel}>■ Stop recording ({seconds}s)</Text>
        </Pressable>
      )}
      <Text style={styles.mutedSmall}>
        Listen at least once each step → record → next step or submit on step 2.
      </Text>
    </Screen>
  );
}

export default function TurnScreen() {
  const appGame = useGameStore((s) => s.settings.appGame);
  if (appGame === 'reverse_audio') return <ReverseTurnScreen />;
  return <EchoBabelTurnScreen />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.party.card,
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
  },
  whisper: { fontFamily: Font.bodyBold, color: Colors.party.textMuted, fontSize: 12, marginBottom: 6 },
  en: { fontFamily: Font.body, color: Colors.party.text, fontSize: 19, lineHeight: 26 },
  muted: { fontFamily: Font.body, color: Colors.party.textMuted, fontSize: 16 },
  mutedSmall: { fontFamily: Font.body, color: Colors.party.textMuted, marginTop: 10, fontSize: 14 },
  recordBtn: {
    marginTop: 8,
    padding: 18,
    borderRadius: 20,
    backgroundColor: Colors.party.surface2,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
  },
  recordActive: { borderColor: Colors.party.danger, backgroundColor: Colors.party.card },
  recordBtnDisabled: { opacity: 0.4 },
  recordLabel: { fontFamily: Font.bodyBold, color: Colors.party.accentPop, fontSize: 18 },
  warn: {
    fontFamily: Font.body,
    color: Colors.party.danger,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  hint: {
    fontFamily: Font.body,
    color: Colors.party.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  menuRow: { alignSelf: 'flex-start', marginBottom: 14, paddingVertical: 6, paddingRight: 12 },
  menuText: { fontFamily: Font.bodyBold, fontSize: 16 },
  listenCountWrap: {
    marginBottom: 14,
    marginTop: 2,
    paddingVertical: 4,
  },
  listenCountLine: {
    fontFamily: Font.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.party.textMuted,
    opacity: 0.88,
  },
  listenCountNum: {
    fontFamily: Font.bodyBold,
    color: Colors.party.textMuted,
  },
  listenCountRest: {
    fontFamily: Font.body,
    color: Colors.party.textMuted,
  },
  listenCountHint: {
    fontFamily: Font.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.party.textMuted,
    opacity: 0.62,
    marginTop: 4,
  },
  errorCard: {
    backgroundColor: Colors.party.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 3,
    borderColor: Colors.party.danger,
    gap: 14,
    marginBottom: 16,
  },
  stepCard: {
    backgroundColor: Colors.party.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 3,
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stepBig: {
    fontFamily: Font.titleHeavy,
    fontSize: 34,
    lineHeight: 42,
    textAlign: 'center',
  },
  stepHintText: {
    fontFamily: Font.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.party.textMuted,
    textAlign: 'center',
  },
  replayLink: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16 },
  replayLinkText: { fontFamily: Font.bodyBold, fontSize: 15 },
  passCard: {
    backgroundColor: Colors.party.card,
    borderRadius: 20,
    padding: 26,
    borderWidth: 3,
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  passArrow: { fontSize: 40, marginBottom: 2 },
  passName: {
    fontFamily: Font.titleHeavy,
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
  },
  passTitle: {
    fontFamily: Font.bodyBold,
    fontSize: 15,
    textAlign: 'center',
  },
});
