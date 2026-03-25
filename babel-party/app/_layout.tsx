import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import Colors from '@/constants/Colors';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.party.surface,
    card: Colors.party.surface2,
    text: Colors.party.text,
    primary: Colors.party.accent,
    border: Colors.party.surface2,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.party.surface2 },
          headerTintColor: Colors.party.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.party.surface },
        }}>
        <Stack.Screen name="index" options={{ title: 'Babel Party', headerLargeTitle: false }} />
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
