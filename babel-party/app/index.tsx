import { ArcadeMenuPrompt } from '@/components/ArcadeMenuPrompt';
import { PressStartPrompt } from '@/components/PressStartPrompt';
import { Screen } from '@/components/Screen';
import { TesterCodeEntry, testerCodeUiEnabled } from '@/components/TesterCodeEntry';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

/** Title art is 1024×558 — layout uses resizeMode contain */
const LOGO_ASPECT = 1024 / 558;

export default function HomeScreen() {
  const router = useRouter();
  const resetSession = useGameStore((s) => s.resetSession);
  const { width: windowWidth } = useWindowDimensions();
  const logoWidth = Math.min(windowWidth - 44, 400);
  const logoHeight = logoWidth / LOGO_ASPECT;
  const [testerOpen, setTesterOpen] = useState(false);
  const showTesterEntry = testerCodeUiEnabled();

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
    <Screen decoration="flat" backdropColor={Colors.party.logoBackdrop}>
      <Modal visible={testerOpen} animationType="fade" transparent onRequestClose={() => setTesterOpen(false)}>
        <Pressable style={styles.testerBackdrop} onPress={() => setTesterOpen(false)}>
          <Pressable style={styles.testerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.testerSheetTitle}>Beta / tester access</Text>
            <TesterCodeEntry variant="standalone" onCodeApplied={() => setTesterOpen(false)} />
            <Pressable onPress={() => setTesterOpen(false)} style={styles.testerCloseWrap}>
              <Text style={styles.testerClose}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <View style={[styles.logoClip, { width: logoWidth, height: logoHeight, alignSelf: 'center' }]}>
        <Image
          source={require('@/assets/images/babelingo-title.png')}
          style={[
            styles.logo,
            {
              width: logoWidth,
              height: logoHeight,
              transform: [{ scale: 1.04 }],
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
      <ArcadeMenuPrompt
        onPress={openHowItWorks}
        headline="▶ HOW IT WORKS"
        tagline="RULES IN UNDER A MINUTE"
        accessibilityLabel="How it works"
      />
      {showTesterEntry ? (
        <Pressable onPress={() => setTesterOpen(true)} style={styles.testerLinkWrap} hitSlop={10}>
          <Text style={styles.testerLink}>Beta / tester code</Text>
        </Pressable>
      ) : null}
      <Text style={styles.copyright}>© PARTY MODULE · NES MODE</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  /** Slight scale + clip hides PNG fringe where title art meets the page background */
  logoClip: {
    marginBottom: 10,
    marginTop: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  testerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  testerSheet: {
    backgroundColor: Colors.party.surface2,
    borderRadius: 20,
    padding: 22,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
    gap: 12,
  },
  testerSheetTitle: {
    fontFamily: Font.title,
    fontSize: 20,
    color: Colors.party.accentPop,
    marginBottom: 4,
  },
  testerCloseWrap: { alignSelf: 'center', paddingVertical: 8 },
  testerClose: { fontFamily: Font.bodyBold, fontSize: 15, color: Colors.party.textMuted },
  testerLinkWrap: { alignSelf: 'center', marginTop: 4, marginBottom: 2, paddingVertical: 8 },
  testerLink: {
    fontFamily: Font.bodyBold,
    fontSize: 13,
    color: Colors.party.accent2,
    textDecorationLine: 'underline',
    letterSpacing: 0.3,
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
