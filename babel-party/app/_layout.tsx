import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { Silkscreen_400Regular, Silkscreen_700Bold } from '@expo-google-fonts/silkscreen';
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
import { audioModePlaybackSpeaker } from '@/lib/audioMode';

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
    PressStart2P_400Regular,
    Silkscreen_400Regular,
    Silkscreen_700Bold,
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
          <Stack.Screen name="pick-game" />
          <Stack.Screen name="how-it-works" />
          <Stack.Screen name="game-mode" />
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
