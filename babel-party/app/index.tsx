import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const resetSession = useGameStore((s) => s.resetSession);

  useEffect(() => {
    trackEvent('session_start');
  }, []);

  return (
    <Screen
      title="Babel Party"
      subtitle="Hear a wild phrase, repeat the chaos, watch English melt. Shared-phone party mode.">
      <View style={styles.hero}>
        <Text style={styles.tagline}>Telephone × karaoke × translation</Text>
      </View>
      <PrimaryButton
        title="Start game"
        onPress={() => {
          resetSession();
          trackEvent('tap_start_game');
          router.push('/create-room');
        }}
        style={styles.cta}
      />
      <Link href="/how-it-works" asChild>
        <Pressable style={styles.linkWrap}>
          <Text style={styles.link}>How it works</Text>
        </Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: 28 },
  tagline: { color: '#c4b5fd', fontSize: 16, fontWeight: '600' },
  cta: { marginBottom: 12 },
  linkWrap: { marginTop: 16, alignSelf: 'center', padding: 8 },
  link: { color: '#a78bfa', fontSize: 16, fontWeight: '600' },
});
