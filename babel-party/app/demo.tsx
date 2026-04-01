import { ChaosCounter } from '@/components/ChaosCounter';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackDemoCompleted, trackDemoStarted } from '@/lib/analytics';
import { audioModePlaybackSpeaker, audioModeRecording } from '@/lib/audioMode';
import { pickRandomDemoPhrase } from '@/lib/demoPhrases';
import { getPipelineBaseUrl } from '@/lib/env';
import { languageByCode } from '@/lib/languages';
import { playGoogleTts, stopPipelineTtsPlayback, useGoogleCloudTts } from '@/lib/playGoogleTts';
import { runEchoPipeline } from '@/lib/pipeline';
import { RECORDING_OPTIONS_GOOGLE_STT } from '@/lib/recordingOptions';
import { translateEnToWithMeta } from '@/lib/translate';
import { Audio } from 'expo-av';
import { useRouter, type Href } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Phase = 'intro' | 'active' | 'busy' | 'done';

export default function DemoScreen() {
  const router = useRouter();
  const phrase = useRef(pickRandomDemoPhrase()).current;
  const [phase, setPhase] = useState<Phase>('intro');
  const [translated, setTranslated] = useState<string | null>(null);
  const [loadingT, setLoadingT] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recUri, setRecUri] = useState<string | null>(null);
  const [chaos, setChaos] = useState(0);
  const [mangled, setMangled] = useState('');
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const [seconds, setSeconds] = useState(0);

  const lang = languageByCode(phrase.languageCode);

  useEffect(() => {
    trackDemoStarted();
    return () => {
      Speech.stop();
      void stopPipelineTtsPlayback();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'active') return;
    let c = false;
    void (async () => {
      setLoadingT(true);
      try {
        const { text } = await translateEnToWithMeta(phrase.english, phrase.languageCode);
        if (!c) setTranslated(text);
      } finally {
        if (!c) setLoadingT(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [phase, phrase.english, phrase.languageCode]);

  const onPlay = async () => {
    if (!translated || !lang) return;
    Speech.stop();
    await stopPipelineTtsPlayback();
    await audioModePlaybackSpeaker();
    const pipeline = getPipelineBaseUrl();
    if (pipeline) {
      try {
        await playGoogleTts(translated, lang.speechLocale, { playbackRate: 0.95 });
        return;
      } catch {
        /* fall through */
      }
    }
    if (useGoogleCloudTts()) {
      try {
        await playGoogleTts(translated, lang.speechLocale, { playbackRate: 0.95 });
        return;
      } catch {
        /* fall through */
      }
    }
    await new Promise<void>((r) => setTimeout(r, 80));
    Speech.speak(translated, {
      language: lang.speechLocale,
      rate: 0.92,
      ...(Platform.OS === 'ios' ? { useApplicationAudioSession: false } : {}),
    });
  };

  const startRec = async () => {
    Speech.stop();
    await stopPipelineTtsPlayback();
    setRecUri(null);
    const perm = await Audio.requestPermissionsAsync();
    if (!perm.granted) return;
    await audioModeRecording();
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(RECORDING_OPTIONS_GOOGLE_STT);
    await rec.startAsync();
    setRecording(rec);
    setSeconds(0);
    if (tick.current) clearInterval(tick.current);
    tick.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stopRec = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecUri(uri ?? null);
    } finally {
      setRecording(null);
      if (tick.current) {
        clearInterval(tick.current);
        tick.current = null;
      }
      await audioModePlaybackSpeaker();
    }
  };

  const runProcess = async () => {
    if (!translated) return;
    setPhase('busy');
    const out = await runEchoPipeline({
      recordingUri: recUri,
      originalEnglish: phrase.english,
      translatedForeign: translated,
      languageCode: phrase.languageCode,
      category: 'mixed',
    });
    setMangled(out.reverseEnglish);
    setChaos(out.chaosScore ?? 0);
    setPhase('done');
    trackDemoCompleted(out.chaosScore ?? 0);
  };

  if (phase === 'intro') {
    return (
      <Screen
        title="Try it now"
        subtitle="One round of Echo Translator — no room code, no lobby."
        footer={<PrimaryButton title="Start demo" onPress={() => setPhase('active')} />}>
        <Text style={styles.body}>
          You’ll hear a phrase in another language, repeat it, and see how English comes back. Under a minute.
        </Text>
        <Text style={styles.quote}>“{phrase.english}”</Text>
      </Screen>
    );
  }

  if (phase === 'active') {
    return (
      <Screen
        title="Demo round"
        subtitle={lang ? `${lang.label} · listen, then record` : 'Loading…'}
        footer={
          <View style={{ gap: 10 }}>
            <PrimaryButton
              title="Process my clip"
              onPress={() => void runProcess()}
              disabled={!recUri || Boolean(recording)}
              variant={recUri && !recording ? 'primary' : 'dim'}
            />
            <PrimaryButton variant="ghost" title="Exit demo" onPress={() => router.replace('/')} />
          </View>
        }>
        {loadingT ? <ActivityIndicator color={Colors.party.accent} style={{ marginVertical: 24 }} /> : null}
        {!loadingT && translated ? (
          <>
            <PrimaryButton title="① Play foreign phrase" onPress={() => void onPlay()} />
            <View style={{ height: 16 }} />
            {!recording ? (
              <PrimaryButton
                title={recUri ? 'Re-record' : '② Record your attempt'}
                onPress={() => void startRec()}
              />
            ) : (
              <Pressable style={styles.recording} onPress={() => void stopRec()}>
                <Text style={styles.recordingText}>■ Stop ({seconds}s)</Text>
              </Pressable>
            )}
          </>
        ) : null}
      </Screen>
    );
  }

  if (phase === 'busy') {
    return (
      <Screen title="Hold tight" subtitle="Running the same pipeline as a real party round…">
        <ActivityIndicator size="large" color={Colors.party.accent} style={{ marginTop: 40 }} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Your demo reveal"
      subtitle="This is the joke — pass the phone for the real chaos."
      footer={
        <View style={{ gap: 10 }}>
          <PrimaryButton title="Play with friends" onPress={() => router.replace('/pick-game' as Href)} />
          <PrimaryButton variant="ghost" title="Home" onPress={() => router.replace('/')} />
        </View>
      }>
      <Text style={styles.label}>Started as</Text>
      <Text style={styles.en}>{phrase.english}</Text>
      <Text style={styles.label}>Came back as</Text>
      <Text style={styles.mangled}>{mangled}</Text>
      <ChaosCounter variant="hero" score={chaos} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: Font.body,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.party.textMuted,
    marginBottom: 16,
  },
  quote: {
    fontFamily: Font.body,
    fontSize: 18,
    lineHeight: 26,
    color: Colors.party.text,
    fontStyle: 'italic',
  },
  label: {
    fontFamily: Font.bodyBold,
    fontSize: 12,
    color: Colors.party.textMuted,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  en: { fontFamily: Font.body, fontSize: 18, color: Colors.party.text, marginTop: 6 },
  mangled: {
    fontFamily: Font.title,
    fontSize: 22,
    color: Colors.party.accentPop,
    marginTop: 8,
    lineHeight: 30,
  },
  recording: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: Colors.party.card,
    borderWidth: 3,
    borderColor: Colors.party.danger,
    alignItems: 'center',
  },
  recordingText: { fontFamily: Font.bodyBold, color: Colors.party.accentPop, fontSize: 18 },
});
