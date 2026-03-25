import { NesBackground } from '@/components/NesBackground';
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
    <View style={styles.root}>
      <NesBackground />
      <View style={styles.bgOverlay} pointerEvents="none" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.party.surface },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 27, 75, 0.88)',
  },
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: 22, paddingBottom: 36 },
  title: {
    fontFamily: Font.title,
    fontSize: 22,
    color: Colors.party.accentPop,
    marginBottom: 10,
    lineHeight: 30,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: Font.body,
    fontSize: 18,
    color: Colors.party.textMuted,
    marginBottom: 22,
    lineHeight: 22,
  },
  subtitleHighlight: {
    fontFamily: Font.bodyBold,
    fontSize: 18,
    color: Colors.party.accentPop,
    marginBottom: 22,
    lineHeight: 22,
  },
  body: { flexGrow: 1 },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 22,
    borderTopWidth: 3,
    borderTopColor: Colors.party.neonStroke,
    borderStyle: Platform.OS === 'android' ? 'solid' : 'dashed',
    backgroundColor: Colors.party.surface,
  },
});
