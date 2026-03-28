import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { Platform, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

export function PrimaryButton(props: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  /** `dim` = low-emphasis (secondary step), still tappable unless `disabled`. */
  variant?: 'primary' | 'ghost' | 'dim';
  style?: ViewStyle;
}) {
  const { title, onPress, disabled, variant = 'primary', style } = props;
  const ghost = variant === 'ghost';
  const dim = variant === 'dim';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        ghost ? styles.ghost : dim ? styles.dim : styles.primary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, ghost && styles.labelGhost, dim && styles.labelDim]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
  },
  primary: {
    backgroundColor: Colors.party.accent,
    minHeight: 52,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.party.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  ghost: {
    backgroundColor: Colors.party.card,
    minHeight: 52,
    justifyContent: 'center',
    borderStyle: Platform.OS === 'android' ? 'solid' : 'dashed',
  },
  dim: {
    backgroundColor: Colors.party.surface2,
    minHeight: 52,
    justifyContent: 'center',
    borderColor: Colors.party.borderSubtle,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  label: {
    fontFamily: Font.bodyBold,
    color: '#fff',
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'center',
  },
  labelGhost: { color: Colors.party.text },
  labelDim: { color: Colors.party.textMuted },
});
