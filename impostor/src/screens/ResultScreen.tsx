import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { playSound, stopSound } from '../audio/sounds';
import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Confetti } from '../components/Confetti';
import { Icon } from '../components/Icon';
import { PressableScale } from '../components/PressableScale';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { getMode } from '../data/gameModes';
import { useThemes } from '../hooks/useThemes';
import { startRound } from '../logic/startRound';
import { decoys } from '../logic/wordPicker';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/colors';
import type { RoleKind } from '../types';
import { haptic } from '../utils/haptics';
import { shuffle } from '../utils/random';

type Outcome = 'civilians' | 'impostor' | 'jester' | 'sage' | 'circle';

const ROLE_NAME: Record<RoleKind, string> = {
  civilian: 'Civil',
  impostor: 'Impostor',
  seer: 'Vidente',
  accomplice: 'Cúmplice',
  jester: 'Bobo da Corte',
  master: 'Mestre',
  sage: 'Sábio',
};
const ROLE_COLOR: Record<RoleKind, string> = {
  civilian: colors.accent,
  impostor: colors.danger,
  seer: '#C084FC',
  accomplice: '#F97316',
  jester: '#D946EF',
  master: colors.special,
  sage: '#0EA5E9',
};

export function ResultScreen() {
  const nav = useNavigation();
  const round = useAppStore((s) => s.round);
  const addPoints = useAppStore((s) => s.addPoints);
  const scores = useAppStore((s) => s.scores);
  const themes = useThemes();
  const preset = nav.route.params?.outcome as Outcome | undefined;

  const [revealed, setRevealed] = useState(Boolean(preset));
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [guess, setGuess] = useState<string | null>(null);

  const mode = getMode(round?.modeId ?? 'classic');
  const theme = themes.find((t) => t.id === round?.themeId);
  const guessOptions = useMemo(() => {
    if (!round) return [];
    if (theme) return shuffle([round.word, ...decoys(theme, round.word, 5)]);
    // Quem da Roda: as opções são os nomes dos jogadores.
    const others = shuffle(round.players.map((p) => p.player.name).filter((n) => n !== round.word)).slice(0, 5);
    return shuffle([round.word, ...others]);
  }, [round, theme]);

  useEffect(() => {
    if (preset) decide(preset);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!round) return null;

  const impostors = round.players.filter((p) => p.role === 'impostor');
  const specials = round.players.filter((p) => p.role !== 'impostor' && p.role !== 'civilian');
  const hasJester = round.players.some((p) => p.role === 'jester');

  const reveal = () => {
    setRevealed(true);
    playSound(impostors.length ? 'suspense' : 'reveal');
    haptic('heavy');
  };

  function decide(result: Outcome) {
    if (!round) return;
    setOutcome(result);
    stopSound('suspense');
    const ids = (pred: (r: RoleKind) => boolean) => round.players.filter((p) => pred(p.role)).map((p) => p.player.id);
    switch (result) {
      case 'civilians':
        addPoints(ids((r) => r === 'civilian' || r === 'seer' || r === 'jester'), 1);
        playSound('victory');
        break;
      case 'impostor':
        addPoints(ids((r) => r === 'impostor' || r === 'accomplice'), 2);
        playSound('defeat');
        break;
      case 'jester':
        addPoints(ids((r) => r === 'jester'), 3);
        playSound('victory');
        break;
      case 'sage':
        addPoints(ids((r) => r === 'sage'), 3);
        playSound('victory');
        break;
      case 'circle':
        addPoints(ids((r) => r === 'civilian'), 1);
        playSound('victory');
        break;
    }
    haptic('success');
  }

  const playAgain = () => {
    if (startRound()) nav.replace('Reveal');
  };

  const ranking = round.players
    .map((p) => ({ ...p.player, score: scores[p.player.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const outcomeOptions: { id: Outcome; label: string; variant: 'success' | 'danger' | 'special' | 'accent' }[] = mode.inverted
    ? [
        { id: 'circle', label: 'Descobrimos o Sábio', variant: 'success' },
        { id: 'sage', label: 'O Sábio escapou', variant: 'special' },
      ]
    : [
        { id: 'civilians', label: impostors.length ? 'Civis venceram' : 'Ninguém era impostor!', variant: 'success' },
        ...(impostors.length ? [{ id: 'impostor' as const, label: 'Impostor venceu', variant: 'danger' as const }] : []),
        ...(hasJester ? [{ id: 'jester' as const, label: 'O Bobo foi votado', variant: 'special' as const }] : []),
      ];

  return (
    <Screen title="Resultado" subtitle={mode.name} showBack={false}>
      {!revealed ? (
        <Animated.View entering={FadeIn} style={styles.suspense}>
          <Icon name="incognito" size={96} color={colors.danger} />
          <AppText variant="title" center>
            {mode.inverted ? 'Quem era o Sábio?' : 'Quem era o impostor?'}
          </AppText>
          <AppText color={colors.textMuted} center>
            Façam a votação final e, quando todos tiverem apontado, revelem a verdade.
          </AppText>
          <Button title="REVELAR" icon="eye" variant="danger" size="lg" style={styles.full} onPress={reveal} sound={null} />
        </Animated.View>
      ) : (
        <>
          <Animated.View entering={ZoomIn.springify().damping(12)}>
            <Card accent={colors.danger} style={styles.center}>
              <AppText variant="label" color={colors.textMuted}>
                {mode.inverted ? 'O Sábio era' : impostors.length > 1 ? 'Os impostores eram' : impostors.length ? 'O impostor era' : 'Resultado'}
              </AppText>
              {(mode.inverted ? specials.filter((s) => s.role === 'sage') : impostors).map((p, i) => (
                <Animated.View key={p.player.id} entering={ZoomIn.delay(250 + i * 250).springify().damping(10)} style={styles.impostor}>
                  <Avatar name={p.player.name} color={p.player.color} size={72} />
                  <AppText variant="title">{p.player.name}</AppText>
                </Animated.View>
              ))}
              {!mode.inverted && impostors.length === 0 ? (
                <AppText variant="title" center>
                  Não havia impostores! 😱
                </AppText>
              ) : null}
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Card style={styles.center}>
              <AppText variant="label" color={colors.textMuted}>
                Palavra secreta
              </AppText>
              <AppText variant="display" center adjustsFontSizeToFit numberOfLines={2}>
                {round.word}
              </AppText>
              <AppText variant="caption" color={colors.textDim}>
                {round.themeName}
              </AppText>
              {round.decoyWord ? (
                <AppText variant="body" color={colors.warning} center>
                  Palavra do infiltrado: {round.decoyWord}
                </AppText>
              ) : null}
            </Card>
          </Animated.View>

          {specials.length ? (
            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <SectionTitle>Papéis especiais</SectionTitle>
              <View style={styles.roles}>
                {specials.map((p) => (
                  <View key={p.player.id} style={[styles.roleChip, { borderColor: ROLE_COLOR[p.role] }]}>
                    <AppText variant="caption" weight="bold" color={ROLE_COLOR[p.role]}>
                      {ROLE_NAME[p.role]}
                    </AppText>
                    <AppText variant="caption">{p.player.name}</AppText>
                  </View>
                ))}
              </View>
            </Animated.View>
          ) : null}

          {impostors.length && guessOptions.length > 1 && !outcome ? (
            <Animated.View entering={FadeInDown.delay(600).springify()}>
              <Card accent={colors.warning}>
                <AppText variant="heading" weight="bold">
                  Última chance do impostor
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  Se o impostor foi pego, ele pode tentar adivinhar a palavra. Acertou? Rouba a vitória!
                </AppText>
                <View style={styles.guessGrid}>
                  {guessOptions.map((option) => {
                    const chosen = guess === option;
                    const correct = option === round.word;
                    const bg = guess ? (correct ? `${colors.success}33` : chosen ? `${colors.danger}33` : colors.surfaceAlt) : colors.surfaceAlt;
                    return (
                      <PressableScale
                        key={option}
                        style={styles.guessCell}
                        disabled={Boolean(guess)}
                        sound={null}
                        onPress={() => {
                          setGuess(option);
                          if (option === round.word) {
                            haptic('warning');
                            decide('impostor');
                          } else {
                            haptic('error');
                            playSound('pop');
                          }
                        }}
                      >
                        <View style={[styles.guessOption, { backgroundColor: bg }]}>
                          <AppText variant="caption" weight="semibold" center numberOfLines={2}>
                            {option}
                          </AppText>
                        </View>
                      </PressableScale>
                    );
                  })}
                </View>
                {guess && guess !== round.word ? (
                  <AppText variant="caption" color={colors.danger}>
                    Errou! A palavra era "{round.word}".
                  </AppText>
                ) : null}
              </Card>
            </Animated.View>
          ) : null}

          {!outcome ? (
            <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.outcomes}>
              <SectionTitle>Quem venceu?</SectionTitle>
              {outcomeOptions.map((o) => (
                <Button key={o.id} title={o.label} variant={o.variant} onPress={() => decide(o.id)} sound={null} />
              ))}
            </Animated.View>
          ) : (
            <Animated.View entering={ZoomIn.springify()} style={styles.outcomes}>
              <Card accent={outcome === 'impostor' ? colors.danger : colors.success} style={styles.center}>
                <Icon
                  name={outcome === 'impostor' ? 'skull' : 'trophy'}
                  size={56}
                  color={outcome === 'impostor' ? colors.danger : colors.warning}
                />
                <AppText variant="title" center>
                  {
                    {
                      civilians: 'Vitória dos civis!',
                      impostor: 'O impostor venceu!',
                      jester: 'O Bobo da Corte venceu!',
                      sage: 'O Sábio escapou!',
                      circle: 'A roda venceu!',
                    }[outcome]
                  }
                </AppText>
              </Card>
              <SectionTitle>Placar</SectionTitle>
              {ranking.map((p, i) => (
                <View key={p.id} style={styles.rankRow}>
                  <AppText weight="bold" color={i === 0 ? colors.warning : colors.textDim} style={styles.rankPos}>
                    {i + 1}º
                  </AppText>
                  <Avatar name={p.name} color={p.color} size={30} />
                  <AppText style={styles.flex}>{p.name}</AppText>
                  <AppText weight="bold">{p.score} pts</AppText>
                </View>
              ))}
              <Button title="Nova rodada" icon="refresh" size="lg" onPress={playAgain} />
              <Button title="Menu inicial" icon="home" variant="ghost" onPress={() => nav.reset('Home')} />
            </Animated.View>
          )}
        </>
      )}
      {outcome && outcome !== 'impostor' ? <Confetti colors={[colors.primary, colors.accent, colors.warning, colors.success, colors.danger]} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  full: { alignSelf: 'stretch' },
  suspense: { alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xxl },
  center: { alignItems: 'center' },
  impostor: { alignItems: 'center', gap: 6 },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  roleChip: { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  guessGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  guessCell: { width: '50%', padding: 4 },
  guessOption: { minHeight: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', padding: 8 },
  outcomes: { gap: spacing.sm },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  rankPos: { width: 28 },
});
