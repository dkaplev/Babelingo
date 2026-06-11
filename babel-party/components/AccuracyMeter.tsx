import { usePartyPalette } from '@/components/GameThemeProvider';
import { Font } from '@/constants/Typography';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type Props = {
  score: 0 | 1 | 2 | 3;
  /** Show language bonus as extra star row when > 0 */
  languageBonus?: 0 | 1 | 2;
};

const LABELS: Record<0 | 1 | 2 | 3, string> = {
  0: 'Wide miss',
  1: 'Getting there',
  2: 'Pretty close!',
  3: 'Nailed it',
};

export function AccuracyMeter({ score, languageBonus = 0 }: Props) {
  const party = usePartyPalette();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    pulse.setValue(0.85);
    Animated.spring(pulse, {
      toValue: 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [score, pulse]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        { borderColor: party.neonStroke, backgroundColor: party.surface2, transform: [{ scale: pulse }] },
      ]}>
      <Text style={[styles.label, { color: party.accent2 }]}>Pronunciation</Text>
      <View style={styles.stars}>
        {[0, 1, 2].map((i) => (
          <Text
            key={i}
            style={[styles.star, { color: i < score ? party.accentPop : party.borderSubtle }]}>
            {i < score ? '★' : '☆'}
          </Text>
        ))}
      </View>
      <Text style={[styles.scoreLine, { color: party.text }]}>
        {score}/3 · {LABELS[score]}
      </Text>
      {languageBonus > 0 ? (
        <Text style={[styles.bonus, { color: party.success }]}>
          +{languageBonus} tough-language bonus
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    padding: 18,
    borderRadius: 20,
    borderWidth: 3,
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: Font.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stars: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  star: { fontSize: 36, lineHeight: 40 },
  scoreLine: { fontFamily: Font.bodyBold, fontSize: 16 },
  bonus: { fontFamily: Font.body, fontSize: 13, marginTop: 2 },
});
