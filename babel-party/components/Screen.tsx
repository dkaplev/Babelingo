import { usePartyPalette } from '@/components/GameThemeProvider';
import { NesBackground } from '@/components/NesBackground';
import { Font } from '@/constants/Typography';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen(props: {
  title?: string;
  subtitle?: string;
  subtitleVariant?: 'default' | 'highlight';
  children: ReactNode;
  footer?: ReactNode;
  keyboardAvoiding?: boolean;
  /** e.g. `Colors.party.logoBackdrop` so the home screen matches `babelingo-title.png`. */
  backdropColor?: string;
  /** Scrim over `NesBackground`; default matches `party.surface`. */
  overlayColor?: string;
}) {
  const {
    title,
    subtitle,
    subtitleVariant = 'default',
    children,
    footer,
    keyboardAvoiding = false,
    backdropColor,
    overlayColor,
  } = props;
  const party = usePartyPalette();
  const rootBg = backdropColor ?? party.surface;
  const scrim = overlayColor ?? 'rgba(26, 27, 75, 0.88)';
  const scroll = (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {title ? (
        <Text style={[styles.title, { color: party.accentPop }]} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text
          style={
            subtitleVariant === 'highlight'
              ? [styles.subtitleHighlight, { color: party.accentPop }]
              : [styles.subtitle, { color: party.textMuted }]
          }>
          {subtitle}
        </Text>
      ) : null}
      <View style={styles.body}>{children}</View>
    </ScrollView>
  );

  return (
    <View style={[styles.root, { backgroundColor: rootBg }]}>
      <NesBackground baseColor={rootBg} />
      <View style={[styles.bgOverlay, { backgroundColor: scrim }]} pointerEvents="none" />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {keyboardAvoiding ? (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
            {scroll}
          </KeyboardAvoidingView>
        ) : (
          scroll
        )}
        {footer ? (
          <View style={[styles.footer, { borderTopColor: party.neonStroke, backgroundColor: rootBg }]}>
            {footer}
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1 },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 36,
  },
  title: {
    fontFamily: Font.title,
    fontSize: 22,
    marginBottom: 10,
    lineHeight: 30,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: Font.body,
    fontSize: 17,
    marginBottom: 22,
    lineHeight: 24,
  },
  subtitleHighlight: {
    fontFamily: Font.bodyBold,
    fontSize: 17,
    marginBottom: 22,
    lineHeight: 24,
  },
  body: { flexGrow: 1 },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 22,
    borderTopWidth: 3,
    borderStyle: Platform.OS === 'android' ? 'solid' : 'dashed',
  },
});
