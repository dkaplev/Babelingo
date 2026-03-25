import { NesPanel } from '@/components/NesPanel';
import { PressStartPrompt } from '@/components/PressStartPrompt';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const resetSession = useGameStore((s) => s.resetSession);

  useEffect(() => {
    trackEvent('session_start');
  }, []);

  return (
    <Screen
      title="Babelingo"
      subtitle="Hear a wild phrase, repeat the chaos, watch English melt — one phone, the whole room.">
      <PressStartPrompt />
      <NesPanel style={styles.hero}>
        <Text style={styles.tagline}>TELEPHONE × KARAOKE × TRANSLATION</Text>
        <Text style={styles.copyHint}>Insert chaos. No quarters required.</Text>
      </NesPanel>
      <PrimaryButton
        title="START GAME"
        onPress={() => {
          resetSession();
          trackEvent('tap_start_game');
          router.push('/create-room');
        }}
        style={styles.cta}
      />
      <Link href="/how-it-works" asChild>
        <Pressable style={styles.linkWrap}>
          <Text style={styles.link}>HOW IT WORKS</Text>
        </Pressable>
      </Link>
      <Text style={styles.copyright}>© PARTY MODULE · NES MODE</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: 20,
  },
  tagline: { fontFamily: Font.bodyBold, color: Colors.party.accentPop, fontSize: 17, lineHeight: 22, textAlign: 'center' },
  copyHint: {
    fontFamily: Font.body,
    color: Colors.party.textMuted,
    fontSize: 15,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: { marginBottom: 12 },
  linkWrap: { marginTop: 16, alignSelf: 'center', padding: 8 },
  link: { fontFamily: Font.bodyBold, color: Colors.party.accent, fontSize: 17 },
  copyright: {
    fontFamily: Font.title,
    fontSize: 8,
    color: Colors.party.textMuted,
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.85,
  },
});
