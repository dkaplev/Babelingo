import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { chaosTierLabel } from '@/lib/chaosScore';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

function chaosColor(score: number): string {
  if (score <= 30) return Colors.party.success;
  if (score <= 60) return '#e8a317';
  return Colors.party.accentPop;
}

type Props = {
  score: number;
  /** Larger layout for reveal hero. */
  variant?: 'compact' | 'hero';
};

export function ChaosCounter({ score, variant = 'compact' }: Props) {
  const [display, setDisplay] = useState(0);
  const safe = Math.max(0, Math.min(99, Math.round(score)));

  useEffect(() => {
    if (safe <= 0) {
      setDisplay(0);
      return;
    }
    let raf = 0;
    const start = Date.now();
    const duration = 900;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplay(Math.round(safe * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [safe]);

  const tier = chaosTierLabel(safe);
  const color = chaosColor(safe);
  const big = variant === 'hero';

  return (
    <View style={[styles.wrap, big && styles.wrapHero]} accessibilityRole="text" accessibilityLabel={`Chaos score ${safe}, ${tier}`}>
      <Text style={[styles.label, big && styles.labelHero, { color }]}>Chaos score</Text>
      <Text style={[styles.num, big && styles.numHero, { color }]}>{display}</Text>
      <Text style={[styles.tier, { color: Colors.party.textMuted }]}>{tier}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.party.surface2,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
    marginTop: 12,
  },
  wrapHero: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 18,
  },
  label: {
    fontFamily: Font.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  labelHero: { fontSize: 13 },
  num: {
    fontFamily: Font.title,
    fontSize: 36,
    marginTop: 4,
  },
  numHero: { fontSize: 48, marginTop: 8 },
  tier: {
    fontFamily: Font.bodyBold,
    fontSize: 14,
    marginTop: 6,
  },
});
