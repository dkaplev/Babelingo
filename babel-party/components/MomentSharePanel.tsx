import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { MomentShareGraphic } from '@/components/MomentShareGraphic';
import { trackEvent } from '@/lib/analytics';
import { MOMENT_TEMPLATES, type MomentPayload, type MomentTemplate } from '@/lib/momentCards';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

type Props = {
  payload: MomentPayload;
  context: 'reveal' | 'summary';
};

export function MomentSharePanel({ payload, context }: Props) {
  const cardRef = useRef<View>(null);
  const pendingRef = useRef<{ template: MomentTemplate; fallbackText: string } | null>(null);
  const captureLock = useRef(false);
  const [captureKey, setCaptureKey] = useState<number | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const shareTextFallback = async (id: string, message: string) => {
    trackEvent('moment_share', { template: id, context, mode: 'text' });
    try {
      await Share.share({ message });
    } catch {
      /* dismissed */
    }
  };

  const runCaptureAndShare = useCallback(async () => {
    const pending = pendingRef.current;
    const ref = cardRef.current;
    if (!pending || !ref) {
      captureLock.current = false;
      setIsSharing(false);
      return;
    }
    const { template, fallbackText } = pending;
    try {
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      const uri = await captureRef(ref, {
        format: 'png',
        quality: 0.95,
        result: 'tmpfile',
      });
      const fileUri =
        Platform.OS === 'android' && uri && !uri.startsWith('file') ? `file://${uri}` : uri;
      if (await Sharing.isAvailableAsync()) {
        trackEvent('moment_share', { template: template.id, context, mode: 'image' });
        await Sharing.shareAsync(fileUri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Babelingo moment',
        });
      } else {
        await shareTextFallback(template.id, fallbackText);
      }
    } catch {
      await shareTextFallback(template.id, fallbackText);
    } finally {
      pendingRef.current = null;
      captureLock.current = false;
      setCaptureKey(null);
      setIsSharing(false);
    }
  }, [context]);

  const onCardLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (!pendingRef.current || captureLock.current) return;
      const { width, height } = e.nativeEvent.layout;
      if (width < 8 || height < 8) return;
      captureLock.current = true;
      void runCaptureAndShare();
    },
    [runCaptureAndShare],
  );

  const onPickTemplate = (t: MomentTemplate) => {
    if (isSharing || captureLock.current) return;
    setIsSharing(true);
    pendingRef.current = { template: t, fallbackText: t.build(payload) };
    setCaptureKey(Date.now());
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Share this moment</Text>
      <Text style={styles.hint}>Pick a style — we’ll build a poster image for your camera roll or chats.</Text>
      <View style={styles.chips}>
        {MOMENT_TEMPLATES.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => onPickTemplate(t)}
            disabled={isSharing}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed, isSharing && styles.chipDisabled]}>
            <Text style={styles.chipText}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {captureKey != null && pendingRef.current ? (
        <View style={styles.offscreenHost} pointerEvents="none" key={captureKey}>
          <View ref={cardRef} collapsable={false} onLayout={onCardLayout}>
            <MomentShareGraphic template={pendingRef.current.template} payload={payload} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20, gap: 10 },
  title: {
    fontFamily: Font.bodyBold,
    color: Colors.party.accent2,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hint: { fontFamily: Font.body, color: Colors.party.textMuted, fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.party.neonStroke,
    borderStyle: 'dashed',
    backgroundColor: Colors.party.surface2,
  },
  chipPressed: { opacity: 0.85 },
  chipDisabled: { opacity: 0.45 },
  chipText: { fontFamily: Font.bodyBold, color: Colors.party.accentPop, fontSize: 14 },
  offscreenHost: {
    position: 'absolute',
    left: -8000,
    top: 0,
    opacity: 1,
  },
});
