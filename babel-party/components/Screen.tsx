import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen(props: {
  title?: string;
  subtitle?: string;
  /** Emphasized subtitle (e.g. funny line on reveal). */
  subtitleVariant?: 'default' | 'highlight';
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { title, subtitle, subtitleVariant = 'default', children, footer } = props;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {title ? (
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={subtitleVariant === 'highlight' ? styles.subtitleHighlight : styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.body}>{children}</View>
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.party.surface },
  scroll: { paddingHorizontal: 22, paddingBottom: 36 },
  title: {
    fontFamily: Font.title,
    fontSize: 36,
    color: Colors.party.doodleInk,
    marginBottom: 8,
    letterSpacing: -0.5,
    transform: [{ rotate: Platform.OS === 'ios' ? '-0.8deg' : '0deg' }],
  },
  subtitle: {
    fontFamily: Font.body,
    fontSize: 17,
    color: Colors.party.textMuted,
    marginBottom: 22,
    lineHeight: 24,
  },
  subtitleHighlight: {
    fontFamily: Font.bodyBold,
    fontSize: 18,
    color: Colors.party.accent2,
    marginBottom: 22,
    lineHeight: 26,
  },
  body: { flexGrow: 1 },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 22,
    borderTopWidth: 3,
    borderTopColor: Colors.party.borderSubtle,
    borderStyle: Platform.OS === 'android' ? 'solid' : 'dashed',
    backgroundColor: Colors.party.surface,
  },
});
