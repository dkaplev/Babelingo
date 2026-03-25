import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { trackEvent } from '@/lib/analytics';
import { currentPlayer, useGameStore } from '@/lib/gameStore';
import { languageByCode } from '@/lib/languages';
import { runEchoPipeline } from '@/lib/pipeline';
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

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const store = useGameStore.getState();
      const player = currentPlayer(store);
      const phrase = store.roundPhrase;
      const langCode = store.currentLanguageCode;
      const trans = store.translatedText;
      const recUri = store.pendingRecordingUri;

      if (!player || !phrase || !langCode) {
        router.replace('/turn');
        return;
      }
      const lang = languageByCode(langCode);
      const started = Date.now();
      const out = await runEchoPipeline({
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
      });

      const totalTurnScore = (out.closenessScore + out.languageBonus) as number;

      const result: TurnResult = {
        roundNumber: store.currentRound,
        playerId: player.id,
        playerName: player.name,
        phraseOriginal: phrase.text,
        phraseCategory: phrase.category,
        languageCode: langCode,
        languageLabel: lang?.label ?? langCode,
        translatedText: trans ?? '',
        recognizedText: out.recognizedText,
        reverseEnglish: out.reverseEnglish,
        closenessScore: out.closenessScore,
        languageBonus: out.languageBonus,
        funnyVoteBonus: 0,
        totalTurnScore,
        funnyLabel: out.funnyLabel,
        usedMockPipeline: out.usedMockPipeline,
      };

      useGameStore.getState().commitTurnResult(result);
      router.replace('/reveal');
    })();
  }, [router]);

  return (
    <Screen title="Hold tight" subtitle={line}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.party.accent} style={styles.spinner} />
        <Text style={styles.note}>Hype the player — this usually takes a few seconds.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingTop: 8 },
  spinner: { marginTop: 32, marginBottom: 24 },
  note: {
    color: Colors.party.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
});
