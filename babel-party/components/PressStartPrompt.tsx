import { Font } from '@/constants/Typography';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onPress: () => void;
};

/** Main title-screen control: blinking NES-style prompt (large tap target). */
export function PressStartPrompt(props: Props) {
  const { onPress } = props;
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 520);
    return () => clearInterval(id);
  }, []);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Start game"
      onPress={onPress}
      style={({ pressed }) => [styles.hit, pressed && styles.hitPressed]}
      hitSlop={12}>
      <View style={styles.wrap}>
        <Text style={[styles.line, { opacity: on ? 1 : 0.28 }]}>▶ PRESS START</Text>
        <Text style={styles.sub}>2 PLAYERS · 1 PHONE</Text>
      </View>
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
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(72, 214, 210, 0.55)',
    backgroundColor: 'rgba(26, 27, 75, 0.65)',
  },
  hitPressed: { opacity: 0.85 },
  wrap: { alignItems: 'center', gap: 6 },
  line: {
    fontFamily: Font.title,
    fontSize: 14,
    color: '#f9c46b',
    letterSpacing: 0.5,
  },
  sub: {
    fontFamily: Font.body,
    fontSize: 16,
    color: '#9ba3e8',
  },
});
