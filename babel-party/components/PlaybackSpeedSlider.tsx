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
import { StyleSheet, Text, View } from 'react-native';

export function PlaybackSpeedSlider() {
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
    marginBottom: 8,
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
