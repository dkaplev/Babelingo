import Colors from '@/constants/Colors';
import { StyleSheet, View } from 'react-native';

type Props = {
  /** Defaults to party surface; use `Colors.party.logoBackdrop` on the home screen. */
  baseColor?: string;
};

/** Fixed “stars” (deterministic, cheap) — sits under the dim overlay in Screen. */
const STARS: { l: `${number}%`; t: `${number}%` }[] = [
  { l: '8%', t: '10%' },
  { l: '18%', t: '22%' },
  { l: '88%', t: '8%' },
  { l: '72%', t: '18%' },
  { l: '42%', t: '14%' },
  { l: '55%', t: '28%' },
  { l: '12%', t: '38%' },
  { l: '92%', t: '34%' },
  { l: '28%', t: '48%' },
  { l: '65%', t: '52%' },
  { l: '8%', t: '58%' },
  { l: '48%', t: '62%' },
  { l: '82%', t: '58%' },
  { l: '22%', t: '72%' },
  { l: '58%', t: '78%' },
  { l: '38%', t: '88%' },
];

export function NesBackground({ baseColor }: Props) {
  return (
    <View style={[styles.wrap, { backgroundColor: baseColor ?? Colors.party.surface }]} pointerEvents="none">
      {STARS.map((p, i) => (
        <View key={i} style={[styles.star, { left: p.l, top: p.t }]} />
      ))}
      <View style={styles.hillLeft} />
      <View style={styles.hillRight} />
      <View style={styles.brickRow}>
        {Array.from({ length: 16 }, (_, i) => (
          <View key={i} style={[styles.brick, i % 2 === 0 ? styles.brickA : styles.brickB]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#c8d4ff',
    opacity: 0.35,
  },
  hillLeft: {
    position: 'absolute',
    left: -20,
    bottom: 28,
    width: 120,
    height: 36,
    borderTopRightRadius: 60,
    borderTopLeftRadius: 60,
    backgroundColor: '#1f6b2c',
    borderWidth: 2,
    borderColor: '#0f3d18',
    opacity: 0.45,
  },
  hillRight: {
    position: 'absolute',
    right: -30,
    bottom: 28,
    width: 100,
    height: 28,
    borderTopRightRadius: 50,
    borderTopLeftRadius: 50,
    backgroundColor: '#1a5c26',
    borderWidth: 2,
    borderColor: '#0f3d18',
    opacity: 0.4,
  },
  brickRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#1a0f08',
  },
  brick: { flex: 1, borderRightWidth: 1, borderRightColor: '#1a0f08' },
  brickA: { backgroundColor: '#c86c38' },
  brickB: { backgroundColor: '#a05028' },
});
