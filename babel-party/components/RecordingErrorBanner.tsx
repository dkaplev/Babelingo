import { PrimaryButton } from '@/components/PrimaryButton';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import * as Linking from 'expo-linking';
import { Platform, StyleSheet, Text, View } from 'react-native';

type Props = {
  message: string;
};

export function RecordingErrorBanner({ message }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{message}</Text>
      <PrimaryButton
        title="Open Settings"
        variant="dim"
        onPress={() => void Linking.openSettings()}
      />
      {Platform.OS === 'ios' ? (
        <Text style={styles.sub}>Settings → Babelingo → Microphone</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.party.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 3,
    borderColor: Colors.party.danger,
    gap: 12,
    marginBottom: 16,
  },
  text: {
    fontFamily: Font.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.party.text,
  },
  sub: {
    fontFamily: Font.body,
    fontSize: 13,
    color: Colors.party.textMuted,
  },
});
