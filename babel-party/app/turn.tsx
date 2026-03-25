import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { audioModePlaybackSpeaker, audioModeRecording } from '@/lib/audioMode';
import { MAX_PHRASE_PLAYS, currentPlayer, useGameStore } from '@/lib/gameStore';
import { languageByCode } from '@/lib/languages';
import { RECORDING_OPTIONS_GOOGLE_STT } from '@/lib/recordingOptions';
import { playGoogleTts, stopPipelineTtsPlayback, useGoogleCloudTts } from '@/lib/playGoogleTts';
import { translateEnToWithMeta, type TranslationSource } from '@/lib/translate';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

export default function TurnScreen() {
  const router = useRouter();
  const roundPhrase = useGameStore((s) => s.roundPhrase);
  const currentLanguageCode = useGameStore((s) => s.currentLanguageCode);
  const translatedText = useGameStore((s) => s.translatedText);
  const listensRemaining = useGameStore((s) => s.listensRemaining);
  const setTranslation = useGameStore((s) => s.setTranslation);
  const nextListenConsumed = useGameStore((s) => s.nextListenConsumed);
  const skipExtraPhrasePlays = useGameStore((s) => s.skipExtraPhrasePlays);
  const setRecordingUri = useGameStore((s) => s.setRecordingUri);

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

  useEffect(() => {
    setHandoffDone(false);
  }, [roundPhrase?.id, player?.id]);

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

  /** iOS routes TTS to the earpiece while `allowsRecordingIOS` is true — reset after handoff. */
  useEffect(() => {
    if (handoffDone) {
      void audioModePlaybackSpeaker();
    }
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
        ...(Platform.OS === 'ios' ? { rate: 0.96 } : {}),
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
      if (useGoogleCloudTts()) {
        try {
          await playGoogleTts(translatedText, lang.speechLocale);
        } catch {
          await audioModePlaybackSpeaker();
          await new Promise((r) => setTimeout(r, 80));
          await speakDeviceTtsUntilDone(translatedText, lang.speechLocale);
        }
      } else {
        await audioModePlaybackSpeaker();
        await new Promise((r) => setTimeout(r, 80));
        await speakDeviceTtsUntilDone(translatedText, lang.speechLocale);
      }
      nextListenConsumed();
    } finally {
      setPhrasePlaybackBusy(false);
    }
  };

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
    }
  };

  const onSubmit = async () => {
    if (isRecording) await stopRecording();
    router.push('/processing');
  };

  if (!roundPhrase || !player) {
    return (
      <Screen title="Turn">
        <Text style={styles.muted}>Nothing to play — head back and start a room.</Text>
      </Screen>
    );
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

  return (
    <Screen
      title={`${player.name}’s turn`}
      subtitle={
        lang
          ? `${lang.label} · up to ${MAX_PHRASE_PLAYS} phrase replays (${listensRemaining} left)`
          : 'Loading…'
      }
      footer={<PrimaryButton title="Submit turn" onPress={onSubmit} />}>
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
      {!loadingTts && useGoogleCloudTts() ? (
        <Text style={styles.hint}>Using Google Cloud TTS from your server (uses TTS quota).</Text>
      ) : null}

      {loadingTts ? (
        <ActivityIndicator color={Colors.party.accent} style={{ marginVertical: 24 }} />
      ) : (
        <>
          {translationSource === 'offline' || translationLoadError ? (
            <PrimaryButton title="Retry translation" onPress={retryTranslation} style={{ marginBottom: 12 }} />
          ) : null}
          <PrimaryButton
            title="Play foreign phrase"
            onPress={() => void onListen()}
            disabled={listensRemaining <= 0 || phrasePlaybackBusy}
          />
          {listensRemaining > 0 ? (
            <PrimaryButton
              variant="ghost"
              title="I am ready to record — skip extra replays"
              onPress={skipExtraPhrasePlays}
              style={{ marginTop: 10 }}
            />
          ) : null}
          <Text style={styles.mutedSmall}>
            Replay the phrase up to {MAX_PHRASE_PLAYS} times, or skip early when you are ready to pronounce it.
          </Text>

          <View style={{ height: 20 }} />

          {!isRecording ? (
            <Pressable
              style={[styles.recordBtn, phrasePlaybackBusy && styles.recordBtnDisabled]}
              onPress={() => void startRecording()}
              disabled={phrasePlaybackBusy}>
              <Text style={styles.recordLabel}>● Record your attempt</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.recordBtn, styles.recordActive]} onPress={() => void stopRecording()}>
              <Text style={styles.recordLabel}>■ Stop ({seconds}s)</Text>
            </Pressable>
          )}
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
});
