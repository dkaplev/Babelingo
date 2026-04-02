import { PrimaryButton } from '@/components/PrimaryButton';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import type { AppGameId } from '@/lib/types';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Slide = { title: string; body: string; emoji: string };

const ECHO: Slide[] = [
  { title: 'Listen to the phrase', body: 'Hear the foreign line — no peeking at English.', emoji: '🎧' },
  { title: 'Mimic what you hear', body: 'Record your best impression after the clue.', emoji: '🎙️' },
  { title: 'See what it became', body: 'English comes back weird — that’s the joke.', emoji: '😂' },
];

const BABEL: Slide[] = [
  { title: 'Listen to the phrase', body: 'Only you hear the foreign audio on your turn.', emoji: '🎧' },
  { title: 'Mimic what you hear', body: 'Your clip becomes the next English seed in the chain.', emoji: '📞' },
  { title: 'See what it became', body: 'After the round, the full mutation line is revealed.', emoji: '🔥' },
];

const REVERSE: Slide[] = [
  { title: 'Listen to the phrase', body: 'Backward audio clue — weird on purpose, funny on purpose.', emoji: '⏪' },
  { title: 'Mimic what you hear', body: 'Record your backward guess, then hear it reversed.', emoji: '🎙️' },
  { title: 'See what it became', body: 'Say the real short line — scoreboard shows everyone’s answers.', emoji: '✨' },
];

function slidesFor(game: AppGameId): Slide[] {
  if (game === 'babel_phone') return BABEL;
  if (game === 'reverse_audio') return REVERSE;
  return ECHO;
}

const { width: W } = Dimensions.get('window');
const PAGE = Math.min(W - 32, 340);

type Props = {
  visible: boolean;
  appGame: AppGameId;
  onClose: () => void;
};

export function HowToPlayModal({ visible, appGame, onClose }: Props) {
  const slides = slidesFor(appGame);
  const [idx, setIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const lastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setIdx(0);
      if (lastTimer.current) clearTimeout(lastTimer.current);
      return;
    }
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [visible, appGame]);

  useEffect(() => {
    if (!visible) return;
    if (idx !== slides.length - 1) {
      if (lastTimer.current) clearTimeout(lastTimer.current);
      return;
    }
    lastTimer.current = setTimeout(() => {
      onClose();
    }, 3000);
    return () => {
      if (lastTimer.current) clearTimeout(lastTimer.current);
    };
  }, [visible, idx, slides.length, onClose]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / PAGE);
    if (i >= 0 && i < slides.length) setIdx(i);
  };

  const goNext = () => {
    if (idx + 1 < slides.length) {
      scrollRef.current?.scrollTo({ x: (idx + 1) * PAGE, animated: true });
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.wrap}>
        <Pressable style={styles.skip} onPress={onClose} hitSlop={12}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
        <Text style={styles.kicker}>How to play</Text>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ width: PAGE }}
          contentContainerStyle={{ width: PAGE * slides.length }}>
          {slides.map((s, i) => (
            <View key={i} style={[styles.page, { width: PAGE }]}>
              <Text style={styles.emoji}>{s.emoji}</Text>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === idx && styles.dotOn]} />
          ))}
        </View>
        {idx < slides.length - 1 ? (
          <PrimaryButton title="Next" onPress={goNext} />
        ) : (
          <PrimaryButton title="Got it" onPress={onClose} />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: 'rgba(26,27,75,0.94)',
    paddingTop: 56,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  skip: { position: 'absolute', top: 52, right: 20, zIndex: 2, padding: 8 },
  skipText: { fontFamily: Font.bodyBold, color: Colors.party.textMuted, fontSize: 16 },
  kicker: {
    fontFamily: Font.bodyBold,
    color: Colors.party.accent2,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  page: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  emoji: { fontSize: 52, marginBottom: 12 },
  title: {
    fontFamily: Font.title,
    fontSize: 18,
    color: Colors.party.accentPop,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontFamily: Font.body,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.party.text,
    textAlign: 'center',
  },
  dots: { flexDirection: 'row', gap: 8, marginVertical: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.party.borderSubtle },
  dotOn: { backgroundColor: Colors.party.accentPop, width: 22 },
});
