import Colors from '@/constants/Colors';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

export function PrimaryButton(props: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
  style?: ViewStyle;
}) {
  const { title, onPress, disabled, variant = 'primary', style } = props;
  const ghost = variant === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        ghost ? styles.ghost : styles.primary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, ghost && styles.labelGhost]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Colors.party.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.party.textMuted,
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.45 },
  label: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  labelGhost: { color: Colors.party.text },
});
