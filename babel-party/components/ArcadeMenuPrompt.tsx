import { Font } from '@/constants/Typography';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  onPress: () => void;
  /** Main line (e.g. Tap to play) */
  headline: string;
  /** Smaller static line under the headline */
  tagline: string;
  accessibilityLabel: string;
};

/** Big bordered menu prompt with a gentle pulse — shared by home "Tap to play" and "How it works". */
export function ArcadeMenuPrompt({ onPress, headline, tagline, accessibilityLabel }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.hit, pressed && styles.hitPressed]}
      hitSlop={12}>
      <Animated.View style={[styles.wrap, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.line}>{headline}</Text>
        <Text style={styles.sub}>{tagline}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignSelf: 'stretch',
    marginBottom: 18,
    minHeight: 88,
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(72, 214, 210, 0.55)',
    backgroundColor: 'rgba(26, 27, 75, 0.65)',
  },
  hitPressed: { opacity: 0.85 },
  wrap: { alignItems: 'center', gap: 4 },
  line: {
    fontFamily: Font.titleHeavy,
    fontSize: 24,
    color: '#f9c46b',
    letterSpacing: 0.5,
  },
  sub: {
    fontFamily: Font.body,
    fontSize: 14,
    lineHeight: 20,
    color: '#9ba3e8',
  },
});
