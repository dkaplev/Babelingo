import { Baloo2_700Bold, Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { Nunito_500Medium, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { GameThemeProvider } from '@/components/GameThemeProvider';
import Colors from '@/constants/Colors';
import { trackAppOpen } from '@/lib/analytics';
import { audioModePlaybackSpeaker } from '@/lib/audioMode';
import { isFirstAppLaunch, markFirstLaunchDone } from '@/lib/onboarding';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.party.accent,
    background: Colors.party.surface,
    card: Colors.party.surface2,
    text: Colors.party.text,
    border: Colors.party.borderSubtle,
    notification: Colors.party.accent,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    Nunito_500Medium,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync();
  }, [loaded]);

  /** Prime iOS/Android audio session so expo-speech and TTS are audible (not stuck after cold start). */
  useEffect(() => {
    if (!loaded) return;
    void (async () => {
      try {
        await Audio.setIsEnabledAsync(true);
        await audioModePlaybackSpeaker();
      } catch {
        /* non-fatal */
      }
    })();
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    void (async () => {
      const first = await isFirstAppLaunch();
      trackAppOpen(first);
      await markFirstLaunchDone();
    })();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={navTheme}>
      <GameThemeProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.party.surface },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="demo" />
          <Stack.Screen name="pick-game" />
          <Stack.Screen name="how-it-works" />
          <Stack.Screen name="create-room" />
          <Stack.Screen name="lobby" />
          <Stack.Screen name="instructions" />
          <Stack.Screen name="round-intro" />
          <Stack.Screen name="turn" />
          <Stack.Screen name="processing" />
          <Stack.Screen name="reveal" />
          <Stack.Screen name="scoreboard" />
          <Stack.Screen name="summary" />
        </Stack>
      </GameThemeProvider>
    </ThemeProvider>
  );
}
