import { SharePoster, SHARE_POSTER_HEIGHT, SHARE_POSTER_WIDTH } from '@/components/SharePoster';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackSharePosterTapped } from '@/lib/analytics';
import { normalizeTranslationText } from '@/lib/normalizeTranslation';
import { POSTER_THEMES, type PosterTheme } from '@/lib/posterThemes';
import type { TurnResult } from '@/lib/types';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

const APP_LINK = 'https://babelingo.app';

function themeForResult(result: TurnResult): PosterTheme {
  const chaos = result.chaosScore ?? 0;
  if (chaos >= 90) return POSTER_THEMES.find((t) => t.id === 'neon') ?? POSTER_THEMES[0]!;
  return POSTER_THEMES.find((t) => t.id === 'retro') ?? POSTER_THEMES[0]!;
}

type Props = {
  visible: boolean;
  result: TurnResult | null;
  onClose: () => void;
};

export function ShareModal({ visible, result, onClose }: Props) {
  const posterRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const onShare = useCallback(async () => {
    if (!result || busy) return;
    setBusy(true);
    const original = result.phraseOriginal;
    const mangled = normalizeTranslationText(result.reverseEnglish);
    const caption =
      `It was meant to be "${original}", but actually sounded like "${mangled}". Hilarious!\n\n` +
      `Translation party game Babelingo — ${APP_LINK}`;
    trackSharePosterTapped(result.chaosScore ?? 0, 'share_modal');
    try {
      // Two frames so the offscreen poster has laid out before capture.
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      const ref = posterRef.current;
      if (!ref) throw new Error('no poster');
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
      // Image capture failed — text share still carries the joke and the link.
      try {
        await Share.share(
          Platform.OS === 'ios' ? { message: caption, url: APP_LINK } : { message: caption },
        );
      } catch {
        /* dismissed */
      }
    } finally {
      setBusy(false);
    }
  }, [result, busy]);

  if (!result) return null;

  const original = result.phraseOriginal;
  const mangled = normalizeTranslationText(result.reverseEnglish);
  const theme = themeForResult(result);
  const foreignForPoster =
    result.translatedText?.trim() && !result.translatedText.startsWith('(')
      ? normalizeTranslationText(result.translatedText)
      : normalizeTranslationText(result.phraseOriginal);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <Text style={styles.heading}>Share this moment</Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>IT WAS MEANT TO BE</Text>
            <Text style={styles.cardText}>"{original}"</Text>
          </View>

          <View style={[styles.card, styles.cardAccent]}>
            <Text style={styles.cardLabelAccent}>BUT ACTUALLY SOUNDED LIKE</Text>
            <Text style={styles.cardTextAccent}>"{mangled}"</Text>
          </View>

          {result.funnyLabel ? (
            <Text style={styles.funnyLabel}>{result.funnyLabel}</Text>
          ) : null}

          <Text style={styles.byline}>Shares as a poster image with the game link on it.</Text>

          <Pressable style={[styles.shareBtn, busy && styles.shareBtnBusy]} onPress={() => void onShare()}>
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.shareBtnText}>Share the poster 🔗</Text>
            )}
          </Pressable>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>

          <View style={styles.offscreen} pointerEvents="none">
            <View ref={posterRef} collapsable={false}>
              <SharePoster
                theme={theme}
                foreignPhrase={foreignForPoster}
                englishMangled={mangled}
                playerName={result.playerName}
                chaosScore={result.chaosScore ?? 0}
                languageLabel={result.languageLabel || 'FOREIGN CLUE'}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.party.surface2,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
    borderTopWidth: 3,
    borderTopColor: Colors.party.neonStroke,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.party.borderSubtle,
    alignSelf: 'center',
    marginBottom: 8,
  },
  heading: {
    fontFamily: Font.title,
    fontSize: 20,
    color: Colors.party.accentPop,
    textAlign: 'center',
    lineHeight: 28,
  },
  card: {
    backgroundColor: Colors.party.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.party.neonStroke,
    gap: 6,
  },
  cardAccent: {
    borderColor: Colors.party.accentPop,
    borderLeftWidth: 6,
  },
  cardLabel: {
    fontFamily: Font.bodyBold,
    fontSize: 10,
    color: Colors.party.textMuted,
    letterSpacing: 0.8,
  },
  cardLabelAccent: {
    fontFamily: Font.bodyBold,
    fontSize: 10,
    color: Colors.party.accent2,
    letterSpacing: 0.8,
  },
  cardText: {
    fontFamily: Font.body,
    fontSize: 17,
    color: Colors.party.text,
    lineHeight: 26,
  },
  cardTextAccent: {
    fontFamily: Font.title,
    fontSize: 20,
    color: Colors.party.accentPop,
    lineHeight: 30,
  },
  funnyLabel: {
    fontFamily: Font.body,
    fontSize: 15,
    color: Colors.party.accent2,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  byline: {
    fontFamily: Font.body,
    fontSize: 13,
    color: Colors.party.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  shareBtn: {
    backgroundColor: Colors.party.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    minHeight: 50,
    justifyContent: 'center',
  },
  shareBtnBusy: { opacity: 0.7 },
  shareBtnText: {
    fontFamily: Font.bodyBold,
    fontSize: 17,
    color: '#fff',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeBtnText: {
    fontFamily: Font.body,
    fontSize: 15,
    color: Colors.party.textMuted,
  },
  offscreen: { position: 'absolute', left: -10000, top: 0, opacity: 1 },
});
