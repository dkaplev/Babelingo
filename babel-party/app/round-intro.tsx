import { usePartyPalette } from '@/components/GameThemeProvider';
import { BackLink } from '@/components/BackLink';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import Colors from '@/constants/Colors';
import { Font } from '@/constants/Typography';
import { trackEvent } from '@/lib/analytics';
import { useGameStore } from '@/lib/gameStore';
import { roundStageForGame, TOTAL_GAME_ROUNDS } from '@/lib/progression';
import { funniestResultInRound } from '@/lib/sessionHighlights';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function RoundIntroScreen() {
  const party = usePartyPalette();
  const router = useRouter();
  const currentRound = useGameStore((s) => s.currentRound);
  const gameMode = useGameStore((s) => s.settings.gameMode);
  const appGame = useGameStore((s) => s.settings.appGame);
  const players = useGameStore((s) => s.players);
  const results = useGameStore((s) => s.results);
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

  const onStart = () => {
    beginRound();
    trackEvent('round_intro_start', { round: currentRound, mode: gameMode });
    router.replace('/turn');
  };

  return (
    <Screen
      title={stage.headline}
      subtitle={`${gameTitle} · ${modeLabel} · Round ${currentRound} of ${TOTAL_GAME_ROUNDS}`}
      footer={<PrimaryButton title="Start this round" onPress={onStart} />}>
      {currentRound === 1 ? <BackLink fallbackHref="/lobby" label="← Lobby" /> : null}

      <View style={styles.progressRow} accessibilityLabel={`Round ${currentRound} of ${TOTAL_GAME_ROUNDS}`}>
        {Array.from({ length: TOTAL_GAME_ROUNDS }, (_, i) => (
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
                ① Fresh English line each round — text stays hidden until the scoreboard, same as party mode.
              </Text>
              <Text style={styles.rule}>
                ② Every backward clue listen is half-speed; after your mimic, your clip plays reversed at normal speed;
                then record the real phrase.
              </Text>
              <Text style={styles.rule}>
                ③ Arcade practice: beat your last closeness score, or switch to multi-player when friends arrive.
              </Text>
            </>
          ) : soloMode && appGame === 'babel_phone' ? (
            <>
              <Text style={styles.rule}>
                ① One turn per round: you hear the foreign line, record once — the scoreboard shows how the English
                shifted in one hop.
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
              <Text style={styles.rule}>② Chase higher closeness scores across rounds or use it as quiet rehearsal.</Text>
              <Text style={styles.rule}>
                ③ Go back to create-room and use the group player count when you want pass-the-phone chaos.
              </Text>
            </>
          ) : appGame === 'reverse_audio' ? (
            <>
              <Text style={styles.rule}>
                ① Pass the phone — every backward clue listen is half-speed; they mimic, then hear their clip reversed at
                normal speed, then record the real phrase.
              </Text>
              <Text style={styles.rule}>② Pipeline URL + Google key on the server required for reversed playback.</Text>
              <Text style={styles.rule}>③ The answer phrase is revealed for everyone only after the round ends.</Text>
            </>
          ) : appGame === 'babel_phone' ? (
            <>
              <Text style={styles.rule}>
                ① Only the active player hears the foreign line; nobody reads the English aloud until the round ends.
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
              <Text style={styles.rule}>② Play, mimic, record, submit — then the personal reveal.</Text>
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
