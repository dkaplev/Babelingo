import Colors from '@/constants/Colors';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
        {title ? <Text style={styles.title}>{title}</Text> : null}
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
    fontSize: 30,
    fontWeight: '800',
    color: Colors.party.text,
    marginBottom: 10,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.party.textMuted,
    marginBottom: 22,
    lineHeight: 24,
  },
  subtitleHighlight: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.party.accent2,
    marginBottom: 22,
    lineHeight: 24,
  },
  body: { flexGrow: 1 },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.party.borderSubtle,
    backgroundColor: Colors.party.surface,
  },
});
