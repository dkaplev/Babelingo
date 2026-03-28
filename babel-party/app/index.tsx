import { ArcadeMenuPrompt } from '@/components/ArcadeMenuPrompt';
import { PressStartPrompt } from '@/components/PressStartPrompt';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

/** Processed logo asset is 904×502 — keeps layout centered with resizeMode contain */
const LOGO_ASPECT = 904 / 502;
/** Fine-tune if the PNG’s padding makes BABELINGO look off-center (try ±4–20). */
const LOGO_OPTICAL_SHIFT_X = -20;

export default function HomeScreen() {
  const router = useRouter();
  const resetSession = useGameStore((s) => s.resetSession);
  const { width: windowWidth } = useWindowDimensions();
  const logoWidth = Math.min(windowWidth - 44, 400);
  const logoHeight = logoWidth / LOGO_ASPECT;

  useEffect(() => {
    trackEvent('session_start');
  }, []);

  const startGame = () => {
    resetSession();
    trackEvent('tap_start_game');
    router.push('/pick-game' as Href);
  };

  const openHowItWorks = () => {
    trackEvent('tap_how_it_works_home');
    router.push('/how-it-works');
  };

  return (
    <Screen>
      <View
        style={[
          styles.logoWrap,
          {
            width: Math.min(logoWidth + 40, windowWidth - 36),
            alignSelf: 'center',
          },
        ]}>
        <Image
          source={require('@/assets/images/babelingo-logo.png')}
          style={[
            styles.logo,
            {
              width: logoWidth,
              height: logoHeight,
              transform: [{ translateX: LOGO_OPTICAL_SHIFT_X }],
            },
          ]}
          resizeMode="contain"
          accessibilityLabel="Babelingo logo"
        />
      </View>
      <Text style={styles.homeLead}>
        Hear a wild phrase, repeat the chaos, watch English melt — pass one phone around the whole crew.
      </Text>
      <PressStartPrompt onPress={startGame} />
      <ArcadeMenuPrompt
        onPress={openHowItWorks}
        headline="▶ HOW IT WORKS"
        tagline="RULES IN UNDER A MINUTE"
        accessibilityLabel="How it works"
      />
      <Text style={styles.copyright}>© PARTY MODULE · NES MODE</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    marginBottom: 10,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.party.surface,
    borderRadius: 12,
    overflow: 'visible',
    direction: 'ltr',
  },
  logo: {
    alignSelf: 'center',
    backgroundColor: Colors.party.surface,
  },
  homeLead: {
    fontFamily: Font.body,
    fontSize: 17,
    color: Colors.party.textMuted,
    lineHeight: 24,
    marginBottom: 18,
    textAlign: 'center',
  },
  copyright: {
    fontFamily: Font.title,
    fontSize: 8,
    color: Colors.party.textMuted,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.85,
  },
});
