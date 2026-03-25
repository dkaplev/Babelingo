import Colors from '@/constants/Colors';
import { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

/** NES / Tetris-style double frame: white outer, grey inner, dark core. */
export function NesPanel(props: { children: ReactNode; style?: ViewStyle }) {
  const { children, style } = props;
  return (
    <View style={[styles.outer, style]}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderWidth: 3,
    borderColor: '#f4f4f4',
    padding: 2,
    backgroundColor: '#0a0a12',
  },
  inner: {
    borderWidth: 2,
    borderColor: '#7a8088',
    backgroundColor: Colors.party.card,
    padding: 14,
  },
});
