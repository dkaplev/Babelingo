import { ArcadeMenuPrompt } from '@/components/ArcadeMenuPrompt';
import { PressStartPrompt } from '@/components/PressStartPrompt';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { useRouter, type Href } from 'expo-router';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

/** Title art is 1024×558 — layout uses resizeMode contain */
const LOGO_ASPECT = 1024 / 558;

export default function HomeScreen() {
  const router = useRouter();
  const resetSession = useGameStore((s) => s.resetSession);
  const { width: windowWidth } = useWindowDimensions();
  const logoWidth = Math.min(windowWidth - 44, 400);
  const logoHeight = logoWidth / LOGO_ASPECT;

  const startGame = () => {
    resetSession();
    trackEvent('tap_start_game');
    router.push('/pick-game' as Href);
  };

  const openHowItWorks = () => {
    trackEvent('tap_how_it_works_home');
    router.push('/how-it-works');
  };

  const tryDemo = () => {
    trackEvent('tap_try_demo_home');
    router.push('/demo' as Href);
  };

  return (
    <Screen
      backdropColor={Colors.party.logoBackdrop}
      overlayColor={Colors.party.logoBackdropOverlay}>
      <View
        style={[
          styles.logoWrap,
          {
            width: Math.min(logoWidth + 40, windowWidth - 36),
            alignSelf: 'center',
          },
        ]}>
        <Image
          source={require('@/assets/images/babelingo-title.png')}
          style={[
            styles.logo,
            {
              width: logoWidth,
              height: logoHeight,
            },
          ]}
          resizeMode="contain"
          accessibilityLabel="Babelingo title"
        />
      </View>
      <Text style={styles.homeLead}>
        Hear a wild phrase, repeat the chaos, watch English melt — pass one phone around the whole crew.
      </Text>
      <PressStartPrompt onPress={startGame} />
      <PrimaryButton title="Try it now — solo demo" variant="dim" onPress={tryDemo} style={{ marginTop: 12 }} />
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
    backgroundColor: Colors.party.logoBackdrop,
    borderRadius: 12,
    overflow: 'visible',
    direction: 'ltr',
  },
  logo: {
    alignSelf: 'center',
    backgroundColor: Colors.party.logoBackdrop,
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
