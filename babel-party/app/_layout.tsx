import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
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
    VT323_400Regular,
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
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.party.surface2 },
          headerTintColor: Colors.party.text,
          headerTitleStyle: { fontFamily: Font.title, fontSize: 11 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: Colors.party.surface },
        }}>
        <Stack.Screen name="index" options={{ title: 'Babelingo', headerLargeTitle: false }} />
        <Stack.Screen name="how-it-works" options={{ title: 'How it works' }} />
        <Stack.Screen name="create-room" options={{ title: 'Create room' }} />
        <Stack.Screen name="lobby" options={{ title: 'Lobby' }} />
        <Stack.Screen name="instructions" options={{ title: 'Quick rules', headerBackVisible: true }} />
        <Stack.Screen name="turn" options={{ title: 'Your turn', headerBackVisible: false }} />
        <Stack.Screen name="processing" options={{ title: 'Processing', headerBackVisible: false }} />
        <Stack.Screen name="reveal" options={{ title: 'Reveal', headerBackVisible: false }} />
        <Stack.Screen name="scoreboard" options={{ title: 'Scoreboard', headerBackVisible: false }} />
        <Stack.Screen name="summary" options={{ title: 'Game over', headerBackVisible: false }} />
      </Stack>
    </ThemeProvider>
  );
}
