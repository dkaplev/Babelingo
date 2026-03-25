import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
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
      title="Babelingo"
      subtitle="Hear a wild phrase, repeat the chaos, watch English melt — one phone, the whole room.">
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
  hero: {
    marginBottom: 28,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.party.card,
    borderWidth: 3,
    borderColor: Colors.party.doodleInk,
  },
  tagline: { fontFamily: Font.bodyBold, color: Colors.party.accent2, fontSize: 17, lineHeight: 24 },
  cta: { marginBottom: 12 },
  linkWrap: { marginTop: 16, alignSelf: 'center', padding: 8 },
  link: { fontFamily: Font.bodyBold, color: Colors.party.accent, fontSize: 17 },
});
