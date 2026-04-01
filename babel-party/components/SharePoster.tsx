import { Font } from '@/constants/Typography';
import type { PosterTheme } from '@/lib/posterThemes';
import { StyleSheet, Text, View } from 'react-native';

/** 9:16 capture target (F-01). view-shot scales from layout. */
export const SHARE_POSTER_WIDTH = 1080;
export const SHARE_POSTER_HEIGHT = 1920;

type Props = {
  theme: PosterTheme;
  /** Phrase in foreign language (large centre). */
  foreignPhrase: string;
  /** English mutation (big coloured). */
  englishMangled: string;
  playerName: string;
  chaosScore: number;
  languageLabel: string;
};

export function SharePoster({ theme, foreignPhrase, englishMangled, playerName, chaosScore, languageLabel }: Props) {
  return (
    <View
      style={[styles.root, { backgroundColor: theme.bg, width: SHARE_POSTER_WIDTH, height: SHARE_POSTER_HEIGHT }]}
      collapsable={false}>
      <Text style={[styles.wordmark, { color: theme.accent2 }]}>BABELINGO</Text>

      <View style={styles.centerBlock}>
        <Text style={[styles.langHint, { color: theme.accent2 }]}>{languageLabel}</Text>
        <Text style={[styles.foreign, { color: theme.ink }]} numberOfLines={6}>
          {foreignPhrase}
        </Text>
        <Text style={[styles.arrow, { color: theme.accent2 }]}>became →</Text>
        <Text style={[styles.english, { color: theme.accent }]} numberOfLines={8}>
          {englishMangled}
        </Text>
        <Text style={[styles.via, { color: theme.ink }]}>
          via {playerName} {chaosScore >= 70 ? '😭' : ''}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.qrCol}>
          <Text style={[styles.qrLabel, { color: theme.ink }]}>GET THE APP</Text>
          <Text style={[styles.qrUrl, { color: theme.accent }]}>babelingo.app</Text>
        </View>
        <View style={[styles.chaosBadge, { backgroundColor: theme.badgeBg, borderColor: theme.accent }]}>
          <Text style={[styles.chaosLabel, { color: theme.accent2 }]}>CHAOS</Text>
          <Text style={[styles.chaosNum, { color: theme.accent }]}>{chaosScore}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 56,
    paddingTop: 72,
    paddingBottom: 64,
    justifyContent: 'space-between',
  },
  wordmark: {
    fontFamily: Font.title,
    fontSize: 36,
    letterSpacing: 4,
  },
  centerBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
    paddingVertical: 40,
  },
  langHint: {
    fontFamily: Font.bodyBold,
    fontSize: 28,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  foreign: {
    fontFamily: Font.body,
    fontSize: 56,
    lineHeight: 72,
    fontWeight: '700',
  },
  arrow: {
    fontFamily: Font.bodyBold,
    fontSize: 40,
  },
  english: {
    fontFamily: Font.title,
    fontSize: 64,
    lineHeight: 80,
  },
  via: {
    fontFamily: Font.body,
    fontSize: 36,
    marginTop: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  qrCol: { maxWidth: '55%' },
  qrLabel: {
    fontFamily: Font.bodyBold,
    fontSize: 22,
    letterSpacing: 2,
  },
  qrUrl: {
    fontFamily: Font.body,
    fontSize: 30,
    marginTop: 8,
  },
  chaosBadge: {
    borderWidth: 6,
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingVertical: 24,
    alignItems: 'center',
  },
  chaosLabel: {
    fontFamily: Font.bodyBold,
    fontSize: 22,
    letterSpacing: 4,
  },
  chaosNum: {
    fontFamily: Font.title,
    fontSize: 72,
    marginTop: 4,
  },
});
