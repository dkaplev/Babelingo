import { SharePoster, SHARE_POSTER_HEIGHT, SHARE_POSTER_WIDTH } from '@/components/SharePoster';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackSharePosterTapped } from '@/lib/analytics';
import { normalizeTranslationText } from '@/lib/normalizeTranslation';
import { POSTER_THEMES, type PosterTheme, type PosterThemeId } from '@/lib/posterThemes';
import type { AppGameId, TurnResult } from '@/lib/types';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

function pickHighlight(
  results: TurnResult[],
  mode: 'round' | 'session',
  currentRound?: number,
): TurnResult | null {
  const ok = results.filter((r) => !r.turnSkipped);
  if (!ok.length) return null;
  if (mode === 'session') {
    return [...ok].sort((a, b) => (b.chaosScore ?? 0) - (a.chaosScore ?? 0))[0] ?? null;
  }
  if (currentRound == null) return null;
  const rs = ok.filter((r) => r.roundNumber === currentRound);
  if (!rs.length) return null;
  return [...rs].sort((a, b) => (b.chaosScore ?? 0) - (a.chaosScore ?? 0))[0] ?? null;
}

function themeById(id: PosterThemeId): PosterTheme {
  return POSTER_THEMES.find((t) => t.id === id) ?? POSTER_THEMES[0]!;
}

type Props = {
  results: TurnResult[];
  mode: 'round' | 'session';
  currentRound?: number;
  themeId: PosterThemeId;
  onThemeChange: (id: PosterThemeId) => void;
  appGame: AppGameId;
};

export function ScoreboardRecapShare({
  results,
  mode,
  currentRound,
  themeId,
  onThemeChange,
  appGame,
}: Props) {
  const highlight = pickHighlight(results, mode, currentRound);
  const posterRef = useRef<View>(null);

  const sharePoster = useCallback(async () => {
    if (!highlight || highlight.turnSkipped) return;
    const chaos = highlight.chaosScore ?? 0;
    const caption = `Chaos ${chaos} on Babelingo — can you beat this? #Babelingo #BabelChaos`;
    trackSharePosterTapped(chaos, themeId);
    try {
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      const ref = posterRef.current;
      if (!ref) return;
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 0.92,
        width: SHARE_POSTER_WIDTH,
        height: SHARE_POSTER_HEIGHT,
        result: 'tmpfile',
      });
      const fileUri =
        Platform.OS === 'android' && uri && !uri.startsWith('file') ? `file://${uri}` : uri;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'image/png', dialogTitle: caption });
      } else {
        await Share.share({ message: caption, url: fileUri });
      }
    } catch {
      await Share.share({
        message: `${normalizeTranslationText(highlight.reverseEnglish)}\n\n${caption}`,
      });
    }
  }, [highlight, themeId]);

  if (!highlight || highlight.turnSkipped) return null;

  const foreignForPoster =
    appGame === 'reverse_audio'
      ? normalizeTranslationText(highlight.phraseOriginal)
      : normalizeTranslationText(highlight.translatedText?.trim() || '· · ·');

  const englishLine = normalizeTranslationText(highlight.reverseEnglish);

  const langLine =
    appGame === 'reverse_audio'
      ? 'ORIGINAL LINE'
      : highlight.languageLabel || 'FOREIGN CLUE';

  const theme = themeById(themeId);
  const titleCopy = mode === 'session' ? 'Session chaos recap' : 'Recap reel';

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{titleCopy}</Text>
      <Text style={styles.hint}>
        Share once when the party wraps — pick a poster style for stories or group chats.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {POSTER_THEMES.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => onThemeChange(t.id)}
            style={[styles.chip, themeId === t.id && styles.chipOn]}>
            <Text style={styles.chipText}>{t.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable style={styles.shareBtn} onPress={() => void sharePoster()}>
        <Text style={styles.shareBtnText}>Share recap</Text>
      </Pressable>

      <View style={styles.offscreen} pointerEvents="none">
        <View ref={posterRef} collapsable={false}>
          <SharePoster
            theme={theme}
            foreignPhrase={foreignForPoster}
            englishMangled={englishLine}
            playerName={highlight.playerName}
            chaosScore={highlight.chaosScore ?? 0}
            languageLabel={langLine}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18, gap: 8 },
  title: {
    fontFamily: Font.bodyBold,
    color: Colors.party.accent2,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hint: { fontFamily: Font.body, color: Colors.party.textMuted, fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: 'row', gap: 8, paddingVertical: 6 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.party.neonStroke,
    backgroundColor: Colors.party.card,
  },
  chipOn: { borderColor: Colors.party.accentPop, backgroundColor: Colors.party.surface2 },
  chipText: { fontFamily: Font.bodyBold, color: Colors.party.accentPop, fontSize: 14 },
  shareBtn: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: Colors.party.accent,
  },
  shareBtnText: { fontFamily: Font.bodyBold, color: '#fff', fontSize: 16 },
  offscreen: { position: 'absolute', left: -10000, top: 0, opacity: 1 },
});
