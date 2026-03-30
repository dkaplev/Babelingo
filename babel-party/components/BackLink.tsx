import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  /** Used when there is nothing to pop (e.g. cold open). */
  fallbackHref: Href;
  label?: string;
};

export function BackLink({ fallbackHref, label = '← Back' }: Props) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace(fallbackHref);
      }}
      hitSlop={12}
      style={styles.hit}>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { alignSelf: 'flex-start', marginBottom: 14, paddingVertical: 6, paddingRight: 12 },
  text: { fontFamily: Font.bodyBold, color: Colors.party.accent2, fontSize: 16 },
});
