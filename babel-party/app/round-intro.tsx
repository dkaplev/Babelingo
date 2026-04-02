import { usePartyPalette } from '@/components/GameThemeProvider';
import { BackLink } from '@/components/BackLink';
import { HowToPlayModal } from '@/components/HowToPlayModal';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { hasSeenHowToForMode, markHowToSeenForMode } from '@/lib/onboarding';
import { roundStageForGame } from '@/lib/progression';
import { funniestResultInRound } from '@/lib/sessionHighlights';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function RoundIntroScreen() {
  const party = usePartyPalette();
  const router = useRouter();
  const currentRound = useGameStore((s) => s.currentRound);
  const gameMode = useGameStore((s) => s.settings.gameMode);
  const appGame = useGameStore((s) => s.settings.appGame);
  const players = useGameStore((s) => s.players);
  const results = useGameStore((s) => s.results);
  const totalRounds = useGameStore((s) => s.settings.rounds);
  const beginRound = useGameStore((s) => s.beginRound);
  const soloMode = players.length === 1;

  const stage = roundStageForGame(appGame, gameMode, currentRound);
  const modeLabel = gameMode === 'mayhem' ? 'Mayhem' : 'Regular';
  const gameTitle =
    appGame === 'babel_phone' ? 'Babel Phone' : appGame === 'reverse_audio' ? 'Reverse Audio' : 'Echo Translator';

  const prevRoundMvp = useMemo(() => {
    if (currentRound <= 1) return null;
    return funniestResultInRound(results, currentRound - 1);
  }, [results, currentRound]);

  const [howToOpen, setHowToOpen] = useState(false);
  const startLock = useRef(false);

  const doStart = () => {
    if (startLock.current) return;
    startLock.current = true;
    beginRound();
    trackEvent('round_intro_start', { round: currentRound, mode: gameMode });
    router.replace('/turn');
  };

  const onStart = () => {
    void (async () => {
      if (currentRound === 1 && !(await hasSeenHowToForMode(appGame))) {
        setHowToOpen(true);
        return;
      }
      doStart();
    })();
  };

  const dismissHowTo = () => {
    void (async () => {
      await markHowToSeenForMode(appGame);
      setHowToOpen(false);
      doStart();
    })();
  };

  return (
    <Screen
      title={stage.headline}
      subtitle={`${gameTitle} · ${modeLabel} · Round ${currentRound} of ${totalRounds}`}
      footer={<PrimaryButton title="Start this round" onPress={onStart} />}>
      <HowToPlayModal visible={howToOpen} appGame={appGame} onClose={dismissHowTo} />
      {currentRound === 1 ? <BackLink fallbackHref="/lobby" label="← Lobby" /> : null}

      <View style={styles.progressRow} accessibilityLabel={`Round ${currentRound} of ${totalRounds}`}>
        {Array.from({ length: totalRounds }, (_, i) => (
          <View
            key={i}
            style={[
              styles.progressSeg,
              { backgroundColor: Colors.party.borderSubtle },
              (i < currentRound - 1 || i === currentRound - 1) && { backgroundColor: Colors.party.accentPop },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.tierBadge, { color: party.accentPop }]}>{stage.tierBadge}</Text>

      <View style={[styles.hype, { borderColor: party.neonStroke }]}>
        <Text style={styles.tagline}>{stage.tagline}</Text>
      </View>

      {prevRoundMvp ? (
        <View style={styles.mvpBanner}>
          <Text style={styles.mvpTitle}>Last round’s chaos MVP</Text>
          <Text style={styles.mvpLine}>
            {prevRoundMvp.playerName} — “{prevRoundMvp.reverseEnglish.trim()}”
          </Text>
          <Text style={styles.mvpSub}>(wildest echo back to English)</Text>
        </View>
      ) : null}

      {currentRound === 1 ? (
        <View style={styles.rules}>
          <Text style={[styles.rulesTitle, { color: party.accent2 }]}>Quick rules</Text>
          {soloMode && appGame === 'reverse_audio' ? (
            <>
              <Text style={styles.rule}>
                ① Very short English line (4–5 words) each round — text stays hidden until the scoreboard.
              </Text>
              <Text style={styles.rule}>
                ② Hear the backward clue, mimic it, then hear your clip reversed the right way round — record the real
                phrase.
              </Text>
              <Text style={styles.rule}>
                ③ Arcade practice: beat your last closeness score, or switch to multi-player when friends arrive.
              </Text>
            </>
          ) : soloMode && appGame === 'babel_phone' ? (
            <>
              <Text style={styles.rule}>
                ① One turn per round: you hear a non-English clue, record once — the scoreboard shows how the English
                chain shifted in one hop.
              </Text>
              <Text style={styles.rule}>② Seed phrase stays secret until the round ends — no reading it aloud early.</Text>
              <Text style={styles.rule}>
                ③ Try for a tight translation or lean into silly sounds; either way you get a chain to laugh at.
              </Text>
            </>
          ) : soloMode ? (
            <>
              <Text style={styles.rule}>
                ① One turn per round: foreign audio only, then your recording — the answer phrase unlocks at the
                scoreboard.
              </Text>
              <Text style={styles.rule}>② Replay the foreign clip if you need another listen — then record your mimic.</Text>
              <Text style={styles.rule}>③ Chase higher closeness scores across rounds or use it as quiet rehearsal.</Text>
              <Text style={styles.rule}>
                ④ Go back to create-room and use the group player count when you want pass-the-phone chaos.
              </Text>
            </>
          ) : appGame === 'reverse_audio' ? (
            <>
              <Text style={styles.rule}>
                ① Every player gets a different short line (4–5 words) in the same round — so a reveal never spoils the
                next turn.
              </Text>
              <Text style={styles.rule}>
                ② Pass the phone — backward clue, mimic, hear your clip reversed at normal speed, then record the real
                phrase.
              </Text>
              <Text style={styles.rule}>③ All answers show on the scoreboard after the round.</Text>
            </>
          ) : appGame === 'babel_phone' ? (
            <>
              <Text style={styles.rule}>
                ① Only the active player hears a non-English foreign line; English is the chain language only — nobody
                reads it aloud until the round ends.
              </Text>
              <Text style={styles.rule}>
                ② Each turn the next English line is whatever came back from the last recording — telephone through
                languages.
              </Text>
              <Text style={styles.rule}>③ After the round, the scoreboard shows the full English mutation chain.</Text>
            </>
          ) : (
            <>
              <Text style={styles.rule}>① Pass the phone — only the player hears the foreign audio clue.</Text>
              <Text style={styles.rule}>② Play the clue, mimic, record, submit — replay the phrase if you need another listen.</Text>
              <Text style={styles.rule}>③ The shared English line is revealed for the room after the whole round.</Text>
            </>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  progressSeg: {
    flex: 1,
    height: 10,
    borderRadius: 4,
  },
  tierBadge: {
    fontFamily: Font.bodyBold,
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  hype: {
    backgroundColor: Colors.party.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 3,
    borderColor: Colors.party.neonStroke,
    marginBottom: 16,
  },
  tagline: {
    fontFamily: Font.body,
    fontSize: 19,
    lineHeight: 28,
    color: Colors.party.text,
  },
  mvpBanner: {
    backgroundColor: Colors.party.surface2,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.party.accentPop,
    marginBottom: 16,
  },
  mvpTitle: {
    fontFamily: Font.bodyBold,
    fontSize: 12,
    color: Colors.party.accentPop,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  mvpLine: {
    fontFamily: Font.body,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.party.text,
  },
  mvpSub: {
    fontFamily: Font.body,
    fontSize: 13,
    color: Colors.party.textMuted,
    marginTop: 6,
  },
  rules: {
    backgroundColor: Colors.party.surface2,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.party.borderSubtle,
    gap: 10,
  },
  rulesTitle: {
    fontFamily: Font.bodyBold,
    fontSize: 13,
    color: Colors.party.accent2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  rule: {
    fontFamily: Font.body,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.party.textMuted,
  },
});
