import { usePartyPalette } from '@/components/GameThemeProvider';
import Colors from '@/constants/Colors';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type Props = {
  baseColor?: string;
};

const PARTICLES: { l: `${number}%`; b: `${number}%`; size: number; delay: number }[] = [
  { l: '12%', b: '18%', size: 6, delay: 0 },
  { l: '78%', b: '24%', size: 5, delay: 800 },
  { l: '44%', b: '12%', size: 4, delay: 1600 },
  { l: '28%', b: '30%', size: 5, delay: 2400 },
  { l: '62%', b: '20%', size: 7, delay: 3200 },
  { l: '88%', b: '35%', size: 4, delay: 4000 },
];

/** Floating orbs + drifting particles — casual-game energy inspired by Color Switch / Bingo Cash. */
export function PartyBackground({ baseColor }: Props) {
  const party = usePartyPalette();
  const root = baseColor ?? Colors.party.surface;

  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;
  const orb3 = useRef(new Animated.Value(0)).current;
  const particleDrift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (val: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );

    const a = pulse(orb1, 5200);
    const b = pulse(orb2, 6800);
    const c = pulse(orb3, 7400);
    const d = Animated.loop(
      Animated.timing(particleDrift, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    a.start();
    b.start();
    c.start();
    d.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
      d.stop();
    };
  }, [orb1, orb2, orb3, particleDrift]);

  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const orb2Y = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 22] });
  const orb3X = orb3.interpolate({ inputRange: [0, 1], outputRange: [-12, 14] });
  const driftY = particleDrift.interpolate({ inputRange: [0, 1], outputRange: [0, -100] });

  return (
    <View style={[styles.wrap, { backgroundColor: root }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.orb,
          styles.orbLarge,
          { backgroundColor: party.accent, opacity: 0.14, transform: [{ translateY: orb1Y }] },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orbMid,
          { backgroundColor: party.accent2, opacity: 0.1, transform: [{ translateY: orb2Y }] },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orbSmall,
          { backgroundColor: party.accentPop, opacity: 0.08, transform: [{ translateX: orb3X }] },
        ]}
      />

      <Animated.View style={[styles.particleLayer, { transform: [{ translateY: driftY }] }]}>
        {PARTICLES.map((p, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: p.l,
                bottom: p.b,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: i % 2 === 0 ? party.accentPop : party.accent2,
                opacity: 0.28 + (i % 3) * 0.08,
              },
            ]}
          />
        ))}
      </Animated.View>

      <View style={[styles.floorGlow, { backgroundColor: party.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999 },
  orbLarge: { width: 220, height: 220, top: '8%', right: -60 },
  orbMid: { width: 160, height: 160, top: '42%', left: -50 },
  orbSmall: { width: 100, height: 100, bottom: '18%', right: '20%' },
  particleLayer: { ...StyleSheet.absoluteFillObject },
  particle: { position: 'absolute' },
  floorGlow: {
    position: 'absolute',
    left: -40,
    right: -40,
    bottom: -80,
    height: 160,
    borderRadius: 999,
    opacity: 0.06,
  },
});
