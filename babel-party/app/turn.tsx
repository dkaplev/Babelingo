import { usePartyPalette } from '@/components/GameThemeProvider';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { audioModePlaybackSpeaker, audioModeRecording } from '@/lib/audioMode';
import { MAX_PHRASE_PLAYS, currentPlayer, useGameStore } from '@/lib/gameStore';
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
  const pendingRecordingUri = useGameStore((s) => s.pendingRecordingUri);
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
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = useGameStore((s) => currentPlayer(s));
  const players = useGameStore((s) => s.players);
  const solo = players.length === 1;
  const lang = currentLanguageCode ? languageByCode(currentLanguageCode) : undefined;

  const hasListenedOnce = listensRemaining < MAX_PHRASE_PLAYS;
  const hasRecording = Boolean(pendingRecordingUri);
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

  const speakDeviceTtsUntilDone = (text: string, speechLocale: string) =>
    new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      Speech.speak(text, {
        language: speechLocale,
        volume: 1,
        pitch: 1,
        ...(Platform.OS === 'ios'
          ? {
              rate: 1,
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
      let played = false;
      const pipeline = getPipelineBaseUrl();
      const preferPipeline = Boolean(pipeline) && !forceDevicePhraseTts();
      if (preferPipeline) {
        try {
          await playGoogleTts(translatedText, lang.speechLocale);
          played = true;
        } catch {
          /* fall through to device */
        }
      }
      if (!played && useGoogleCloudTts()) {
        try {
          await playGoogleTts(translatedText, lang.speechLocale);
          played = true;
        } catch {
          /* fall through */
        }
      }
      if (!played) {
        await audioModePlaybackSpeaker();
        await new Promise<void>((res) => InteractionManager.runAfterInteractions(() => res()));
        await speakDeviceTtsUntilDone(translatedText, lang.speechLocale);
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
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return;
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
      /* ignore */
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
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
            ? `${player.name}, you’re playing solo — the real line stays secret until the scoreboard. The next screen is audio only.`
            : `${player.name} is up. The real line stays secret until the round ends — they only get the audio clue on the next screen.`
        }
        footer={
          <PrimaryButton
            title={solo ? 'Continue to audio clue' : `${player.name} has the phone — continue`}
            onPress={() => setPassConfirmed(true)}
            accessibilityLabel={solo ? 'Continue to audio clue' : `Confirm ${player.name} is holding the phone`}
          />
        }>
        {menuRow}
        <View style={[styles.card, { borderColor: party.neonStroke }]}>
          <Text style={styles.whisper}>No peeking</Text>
          <Text style={styles.en}>
            {solo
              ? 'Keep the phrase to yourself until the scoreboard — treat it like a private practice run you can repeat with friends later.'
              : 'Don’t read any English aloud yet. Everyone finds out the phrase at the scoreboard after all turns in this round.'}
          </Text>
        </View>
      </Screen>
    );
  }

  const playIsPrimary =
    !loadingTts && !isRecording && !phrasePlaybackBusy && listensRemaining > 0 && !hasListenedOnce;
  const recordIsPrimary = !loadingTts && !isRecording && !phrasePlaybackBusy && hasListenedOnce && !hasRecording;

  return (
    <Screen
      title={`${player.name}’s turn`}
      subtitle={lang ? `${lang.label} · listen, then record, then submit` : 'Loading…'}
      footer={
        <PrimaryButton
          title="Submit turn"
          onPress={onSubmit}
          disabled={!pendingRecordingUri || isRecording}
          variant={pendingRecordingUri && !isRecording ? 'primary' : 'dim'}
          accessibilityLabel="Submit turn for processing"
          accessibilityState={{ selected: Boolean(pendingRecordingUri && !isRecording) }}
        />
      }>
      {menuRow}
      {needsTranslationFix ? (
        <View style={styles.errorCard}>
          <Text style={styles.warn}>
            {translationLoadError ??
              'No translation loaded. Check Wi‑Fi and EXPO_PUBLIC_PIPELINE_URL, then retry.'}
          </Text>
          <PrimaryButton title="Retry translation" onPress={retryTranslation} />
        </View>
      ) : null}

      {!needsTranslationFix && !loadingTts && translationSource === 'mymemory_fallback' ? (
        <Text style={styles.hint}>
          Your server did not return a translation; using the public fallback translator (rate limits may apply).
        </Text>
      ) : null}
      {!needsTranslationFix && !loadingTts && getPipelineBaseUrl() && !forceDevicePhraseTts() ? (
        <Text style={styles.hint}>Foreign phrase plays from your server when possible (loudspeaker-friendly).</Text>
      ) : null}

      {loadingTts ? (
        <ActivityIndicator color={party.accent} style={{ marginVertical: 24 }} />
      ) : !needsTranslationFix ? (
        <>
          <View style={[styles.listenStrip, { borderColor: party.accentPop }]}>
            <Text style={[styles.listenStripTitle, { color: party.accentPop }]}>
              Listens left: {listensRemaining} / {MAX_PHRASE_PLAYS}
            </Text>
            <Text style={styles.listenStripSub}>
              {listensRemaining <= 0
                ? 'No replays left — record when you’re ready.'
                : hasListenedOnce
                  ? `You can replay up to ${listensRemaining} more time${listensRemaining === 1 ? '' : 's'}, or move on to record.`
                  : `Tap Play below (${listensRemaining} time${listensRemaining === 1 ? '' : 's'}) — then Record your attempt.`}
            </Text>
          </View>

          <PrimaryButton
            title={
              listensRemaining <= 0
                ? 'No replays left'
                : hasListenedOnce
                  ? `Replay foreign phrase (${listensRemaining} left)`
                  : '① Play foreign phrase'
            }
            onPress={() => void onListen()}
            disabled={listensRemaining <= 0 || phrasePlaybackBusy || loadingTts}
            variant={playIsPrimary ? 'primary' : 'dim'}
            accessibilityLabel="Play foreign phrase audio"
            accessibilityState={{ selected: playIsPrimary }}
          />

          <View style={{ height: 14 }} />

          {!isRecording ? (
            <PrimaryButton
              title={hasRecording ? 'Re-record your attempt' : '② Record your attempt'}
              onPress={() => void startRecording()}
              disabled={!canStartRecord || phrasePlaybackBusy}
              variant={recordIsPrimary ? 'primary' : 'dim'}
              accessibilityLabel={hasRecording ? 'Re-record your attempt' : 'Record your attempt'}
              accessibilityState={{ selected: recordIsPrimary }}
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
            Flow: listen at least once → record → submit. Extra replays optional.
          </Text>
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

  const [passConfirmed, setPassConfirmed] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [phrasePlaybackBusy, setPhrasePlaybackBusy] = useState(false);
  const [reverseError, setReverseError] = useState<string | null>(null);
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
      const b64 = await fetchTtsReversedWavBase64(roundPhrase.text, { speakingRate: 0.5 });
      await playPipelineWavBase64(b64);
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
      await playPipelineWavBase64(b64);
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
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return;
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
      /* ignore */
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        if (reverseStep === 1) {
          commitReverseGuess(uri);
        } else {
          setRecordingUri(uri);
        }
      }
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
            ? `${player.name}, solo run — the answer stays hidden until the scoreboard. Half-speed backward audio is on the next screen.`
            : `${player.name} is up. The real phrase is revealed at the end of the round — backward audio is on the next screen.`
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
            All backward clue listens are half-speed. After you record your mimic, your clip plays reversed at normal
            speed before you say the real line.
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
          ? 'Step 1 of 2 — slowed backward clue, then mimic'
          : 'Step 2 of 2 — your clip backward, then say the line'
      }
      footer={
        <View style={{ gap: 10 }}>
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

      <View style={[styles.listenStrip, { borderColor: party.accentPop }]}>
        <Text style={[styles.listenStripTitle, { color: party.accentPop }]}>
          Listens left: {listensRemaining} / {MAX_PHRASE_PLAYS}
        </Text>
        <Text style={styles.listenStripSub}>
          {reverseStep === 1
            ? listensRemaining <= 0
              ? 'Record your backward mimic when ready.'
              : hasListenedOnce
                ? `Replay backward clue (${listensRemaining} left, all at half-speed) or record your mimic.`
                : 'Every backward listen is half-speed — then record your mimic.'
            : listensRemaining <= 0
              ? 'Record the real phrase when ready.'
              : hasListenedOnce
                ? `Replay your clip reversed at normal speed (${listensRemaining} left) or record the answer.`
                : 'Hear your attempt reversed at normal speed, then record the real phrase.'}
        </Text>
      </View>

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
  listenStrip: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.party.surface2,
    borderWidth: 3,
  },
  listenStripTitle: {
    fontFamily: Font.title,
    fontSize: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  listenStripSub: {
    fontFamily: Font.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.party.textMuted,
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
});
