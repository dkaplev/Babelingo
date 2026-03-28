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
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const player = useGameStore((s) => currentPlayer(s));
  const lang = currentLanguageCode ? languageByCode(currentLanguageCode) : undefined;

  const hasListenedOnce = listensRemaining < MAX_PHRASE_PLAYS;
  const hasRecording = Boolean(pendingRecordingUri);
  const canStartRecord = hasListenedOnce && !phrasePlaybackBusy && !loadingTts;

  useEffect(() => {
    setHandoffDone(false);
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
        subtitle={`Then pass the phone to ${player.name} without showing this screen again.`}
        footer={
          <PrimaryButton
            title={`${player.name} has the phone — hide phrase`}
            onPress={() => setHandoffDone(true)}
          />
        }>
        {menuRow}
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
        />
      }>
      {menuRow}
      {translationLoadError ? (
        <Text style={styles.warn}>{translationLoadError}</Text>
      ) : null}
      {!loadingTts && translationSource === 'offline' ? (
        <Text style={styles.warn}>
          No translation service reached — phrase shown as a tagged fallback. Check Wi‑Fi and EXPO_PUBLIC_PIPELINE_URL,
          then retry.
        </Text>
      ) : null}
      {!loadingTts && translationSource === 'mymemory_fallback' ? (
        <Text style={styles.hint}>
          Your server did not return a translation; using the public fallback translator (rate limits may apply).
        </Text>
      ) : null}
      {!loadingTts && getPipelineBaseUrl() && !forceDevicePhraseTts() ? (
        <Text style={styles.hint}>Foreign phrase plays from your server when possible (loudspeaker-friendly).</Text>
      ) : null}

      {loadingTts ? (
        <ActivityIndicator color={Colors.party.accent} style={{ marginVertical: 24 }} />
      ) : (
        <>
          {translationSource === 'offline' || translationLoadError ? (
            <PrimaryButton title="Retry translation" onPress={retryTranslation} style={{ marginBottom: 12 }} />
          ) : null}
          <PrimaryButton
            title={listensRemaining <= 0 ? 'No replays left' : '① Play foreign phrase'}
            onPress={() => void onListen()}
            disabled={listensRemaining <= 0 || phrasePlaybackBusy || loadingTts}
            variant={playIsPrimary ? 'primary' : 'dim'}
          />

          <View style={{ height: 14 }} />

          {!isRecording ? (
            <PrimaryButton
              title={hasRecording ? 'Re-record your attempt' : '② Record your attempt'}
              onPress={() => void startRecording()}
              disabled={!canStartRecord || phrasePlaybackBusy}
              variant={recordIsPrimary ? 'primary' : 'dim'}
            />
          ) : (
            <Pressable style={[styles.recordBtn, styles.recordActive]} onPress={() => void stopRecording()}>
              <Text style={styles.recordLabel}>■ Stop recording ({seconds}s)</Text>
            </Pressable>
          )}
          <Text style={styles.mutedSmall}>
            Flow: listen at least once → record → submit. Extra replays optional.
          </Text>
        </>
      )}
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
});
