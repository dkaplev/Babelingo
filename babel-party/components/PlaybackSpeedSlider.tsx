import { usePartyPalette } from '@/components/GameThemeProvider';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { useGameStore } from '@/lib/gameStore';
import {
  clampPlaybackSpeed,
  PLAYBACK_SPEED_DEFAULT,
  PLAYBACK_SPEED_MAX,
  PLAYBACK_SPEED_MIN,
} from '@/lib/playbackSpeed';
import Slider from '@react-native-community/slider';
import { Platform, StyleSheet, Text, View } from 'react-native';

type Props = {
  /** Reverse: step 2 plays your clip reversed at fixed speed; slider still labels the same for consistency. */
  hint?: string;
};

export function PlaybackSpeedSlider(props: Props) {
  const { hint } = props;
  const party = usePartyPalette();
  const raw = useGameStore((s) => s.settings.playbackSpeed);
  const speed = clampPlaybackSpeed(raw ?? PLAYBACK_SPEED_DEFAULT);
  const updateSettings = useGameStore((s) => s.updateSettings);

  return (
    <View
      style={[styles.wrap, { borderColor: party.borderSubtle, backgroundColor: party.surface2 }]}
      accessibilityLabel="Listen speed">
      <View style={styles.row}>
        <Text style={[styles.title, { color: party.accentPop }]}>Listen speed</Text>
        <Text style={[styles.value, { color: party.text }]}>{speed.toFixed(2)}×</Text>
      </View>
      <Text style={[styles.sub, { color: party.textMuted }]}>
        {hint ??
          (Platform.OS === 'web'
            ? 'Web: slower clips use server-side synthesis. On iOS/Android the app time-stretches playback (expo-av).'
            : 'Left = slower playback (time-stretch on device). Right = normal speed. Affects phrase audio and backward clue.')}
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={PLAYBACK_SPEED_MIN}
        maximumValue={PLAYBACK_SPEED_MAX}
        value={speed}
        onValueChange={(v) => updateSettings({ playbackSpeed: clampPlaybackSpeed(v) })}
        minimumTrackTintColor={party.accentPop}
        maximumTrackTintColor={party.borderSubtle}
        thumbTintColor={party.accent2}
        accessibilityLabel={`Listen speed ${speed.toFixed(2)} times normal`}
      />
      <View style={styles.ticks}>
        <Text style={[styles.tick, { color: Colors.party.textMuted }]}>slow</Text>
        <Text style={[styles.tick, { color: Colors.party.textMuted }]}>normal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  title: {
    fontFamily: Font.bodyBold,
    fontSize: 14,
    letterSpacing: 0.4,
  },
  value: {
    fontFamily: Font.title,
    fontSize: 16,
  },
  sub: {
    fontFamily: Font.body,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  slider: { width: '100%', height: 36 },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  tick: {
    fontFamily: Font.body,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
