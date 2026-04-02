import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import type { MomentPayload, MomentTemplate } from '@/lib/momentCards';
import { StyleSheet, Text, View } from 'react-native';

/** Logical width for export (capture scales with device pixel ratio). */
export const MOMENT_CARD_WIDTH = 360;
export const MOMENT_CARD_MIN_HEIGHT = 580;

type Props = {
  template: MomentTemplate;
  payload: MomentPayload;
};

/** Retro “poster” layout for PNG share. */
export function MomentShareGraphic({ template, payload }: Props) {
  const attribution = payload.playerName ? `— ${payload.playerName}` : '— Babelingo room';

  return (
    <View style={styles.root} collapsable={false}>
      <View style={styles.topStripe} />
      <View style={styles.inner}>
        <Text style={styles.banner}>{template.graphicBanner}</Text>
        {template.graphicStamp ? <Text style={styles.stamp}>{template.graphicStamp}</Text> : null}
        <View style={styles.quoteBox}>
          <Text style={styles.quote} numberOfLines={10}>
            “{payload.mangled}”
          </Text>
        </View>
        {payload.originalEnglish ? (
          <Text style={styles.original} numberOfLines={4}>
            Original: {payload.originalEnglish}
          </Text>
        ) : null}
        <Text style={styles.attrib}>{attribution}</Text>
        <View style={styles.footerRow}>
          <Text style={styles.brand}>BABELINGO</Text>
          <Text style={styles.subbrand}>WORD TRANSLATING PARTY</Text>
        </View>
      </View>
      <View style={styles.bottomStripe} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: MOMENT_CARD_WIDTH,
    height: MOMENT_CARD_MIN_HEIGHT,
    backgroundColor: Colors.party.surface,
    borderWidth: 4,
    borderColor: Colors.party.neonStroke,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  topStripe: {
    height: 10,
    backgroundColor: Colors.party.accent,
  },
  bottomStripe: {
    height: 6,
    backgroundColor: Colors.party.accentPop,
  },
  inner: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  banner: {
    fontFamily: Font.title,
    fontSize: 11,
    color: Colors.party.accentPop,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  stamp: {
    fontFamily: Font.bodyBold,
    fontSize: 13,
    color: Colors.party.accent2,
    marginTop: 6,
    letterSpacing: 1,
  },
  quoteBox: {
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: Colors.party.card,
    borderLeftWidth: 5,
    borderLeftColor: Colors.party.accentPop,
    borderWidth: 2,
    borderColor: Colors.party.borderSubtle,
  },
  quote: {
    fontFamily: Font.body,
    fontSize: 17,
    lineHeight: 24,
    color: Colors.party.text,
  },
  original: {
    fontFamily: Font.body,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.party.textMuted,
    marginTop: 14,
    fontStyle: 'italic',
  },
  attrib: {
    fontFamily: Font.body,
    fontSize: 14,
    color: Colors.party.textMuted,
    marginTop: 16,
  },
  footerRow: {
    marginTop: 'auto',
    paddingTop: 14,
    borderTopWidth: 2,
    borderTopColor: Colors.party.neonStroke,
    borderStyle: 'dashed',
  },
  brand: {
    fontFamily: Font.title,
    fontSize: 16,
    color: Colors.party.accent,
    letterSpacing: 1,
  },
  subbrand: {
    fontFamily: Font.body,
    fontSize: 11,
    color: Colors.party.textMuted,
    marginTop: 6,
    letterSpacing: 0.8,
  },
});
