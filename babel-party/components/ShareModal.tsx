import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { normalizeTranslationText } from '@/lib/normalizeTranslation';
import type { TurnResult } from '@/lib/types';
import { useCallback } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const APP_LINK = 'https://babelingo.app';

type Props = {
  visible: boolean;
  result: TurnResult | null;
  onClose: () => void;
};

export function ShareModal({ visible, result, onClose }: Props) {
  const onShare = useCallback(async () => {
    if (!result) return;
    const original = result.phraseOriginal;
    const mangled = normalizeTranslationText(result.reverseEnglish);
    const playerPart = result.playerName ? ` (${result.playerName})` : '';
    const text =
      `It was meant to be "${original}", but actually sounded like "${mangled}". Hilarious!\n\n` +
      `Play Translation Game Babelingo${playerPart}: ${APP_LINK}`;
    try {
      await Share.share(
        Platform.OS === 'ios' ? { message: text, url: APP_LINK } : { message: text },
      );
    } catch {
      // dismissed by user
    }
  }, [result]);

  if (!result) return null;

  const original = result.phraseOriginal;
  const mangled = normalizeTranslationText(result.reverseEnglish);

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

          <Text style={styles.byline}>
            Translation Game "Babelingo" — play it with your friends
          </Text>

          <Pressable style={styles.shareBtn} onPress={() => void onShare()}>
            <Text style={styles.shareBtnText}>Share 🔗</Text>
          </Pressable>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
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
  },
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
});
