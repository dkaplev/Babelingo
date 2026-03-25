import { Font } from '@/constants/Typography';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

/** Blinking “insert coin” era prompt — does not capture touches. */
export function PressStartPrompt() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 520);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={[styles.line, { opacity: on ? 1 : 0.28 }]}>▶ PRESS START</Text>
      <Text style={styles.sub}>2 PLAYERS · 1 PHONE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 18, gap: 6 },
  line: {
    fontFamily: Font.title,
    fontSize: 13,
    color: '#f9c46b',
    letterSpacing: 0.5,
  },
  sub: {
    fontFamily: Font.body,
    fontSize: 16,
    color: '#9ba3e8',
  },
});
