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
import { playGoogleTts, stopPipelineTtsPlayback, useGoogleCloudTts } from '@/lib/playGoogleTts';
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

export default function TurnScreen() {
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

  const [handoffDone, setHandoffDone] = useState(false);
  const [loadingTts, setLoadingTts] = useState(true);
  const [translationSource, setTranslationSource] = useState<TranslationSource | null>(null);
  const [translationLoadError, setTranslationLoadError] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [phrasePlaybackBusy, setPhrasePlaybackBusy] = useState(false);
  const [handoffCountdown, setHandoffCountdown] = useState(3);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = useGameStore((s) => currentPlayer(s));
  const lang = currentLanguageCode ? languageByCode(currentLanguageCode) : undefined;

  const hasListenedOnce = listensRemaining < MAX_PHRASE_PLAYS;
  const hasRecording = Boolean(pendingRecordingUri);
  const canStartRecord = hasListenedOnce && !phrasePlaybackBusy && !loadingTts;
  const translationReady = Boolean(translatedText?.trim());
  const needsTranslationFix =
    !loadingTts && !translationReady && (translationLoadError != null || translationSource === null);

  useEffect(() => {
    setHandoffDone(false);
    setHandoffCountdown(3);
  }, [roundPhrase?.id, player?.id]);

  useEffect(() => {
    if (handoffDone || handoffCountdown <= 0) return;
    const id = setTimeout(() => {
      setHandoffCountdown((c) => {
        const next = c - 1;
        if (next === 0 && Platform.OS !== 'web') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [handoffDone, handoffCountdown]);

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

  /** Warm playback session after handoff so first “Play” isn’t silent (iOS session timing). */
  useEffect(() => {
    if (!handoffDone) return;
    const id = setTimeout(() => {
      void audioModePlaybackSpeaker();
    }, Platform.OS === 'ios' ? 240 : 100);
    return () => clearTimeout(id);
  }, [handoffDone]);

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
      <Text style={styles.menuText}>◀ MAIN MENU</Text>
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

  if (!handoffDone) {
    return (
      <Screen
        title="Host: read to the room"
        subtitle={`Pass the phone to ${player.name} after the countdown — they should not read this English text.`}
        footer={
          <PrimaryButton
            title={
              handoffCountdown > 0
                ? `Pass phone in ${handoffCountdown}…`
                : `${player.name} has the phone — hide phrase`
            }
            onPress={() => setHandoffDone(true)}
            disabled={handoffCountdown > 0}
            accessibilityLabel={
              handoffCountdown > 0
                ? `Wait ${handoffCountdown} seconds before handing over the phone`
                : `Confirm ${player.name} has the phone and hide the English phrase`
            }
          />
        }>
        {menuRow}
        {handoffCountdown > 0 ? (
          <View style={styles.countdownWrap} accessibilityLiveRegion="polite">
            <Text style={styles.countdownNum}>{handoffCountdown}</Text>
            <Text style={styles.countdownHint}>Get ready to pass the device…</Text>
          </View>
        ) : null}
        <View style={styles.card}>
          <Text style={styles.whisper}>English phrase — read aloud to the room</Text>
          <Text style={styles.en}>{roundPhrase.text}</Text>
        </View>
        <Text style={styles.mutedSmall}>
          Player should only hear the foreign audio and their own recording — not this text.
        </Text>
      </Screen>
    );
  }

  const playIsPrimary =
    !loadingTts && !isRecording && listensRemaining > 0 && !hasListenedOnce;
  const recordIsPrimary = !loadingTts && !isRecording && hasListenedOnce && !hasRecording;

  return (
    <Screen
      title={`${player.name}’s turn`}
      subtitle={
        lang
          ? `${lang.label} · tap Play first, then Record, then Submit (${listensRemaining} replays left)`
          : 'Loading…'
      }
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
        <ActivityIndicator color={Colors.party.accent} style={{ marginVertical: 24 }} />
      ) : !needsTranslationFix ? (
        <>
          <PrimaryButton
            title={listensRemaining <= 0 ? 'No replays left' : '① Play foreign phrase'}
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
  menuText: { fontFamily: Font.bodyBold, color: Colors.party.accent2, fontSize: 16 },
  countdownWrap: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: Colors.party.surface2,
    borderWidth: 3,
    borderColor: Colors.party.accent2,
  },
  countdownNum: {
    fontFamily: Font.title,
    fontSize: 56,
    lineHeight: 62,
    color: Colors.party.accentPop,
  },
  countdownHint: {
    fontFamily: Font.bodyBold,
    fontSize: 15,
    color: Colors.party.textMuted,
    marginTop: 8,
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
