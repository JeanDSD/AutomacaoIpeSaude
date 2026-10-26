import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInRight, SlideOutLeft, ZoomIn } from 'react-native-reanimated';

import { playSound } from '../audio/sounds';
import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { PressableScale } from '../components/PressableScale';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { getMode } from '../data/gameModes';
import { ROLE_COLOR, ROLE_NAME } from '../data/roles';
import { checkGameEnd, speakingOrder, tallyVotes, type VoteTally } from '../logic/game';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/colors';
import { haptic } from '../utils/haptics';

type Phase = 'pass' | 'ballot' | 'counting' | 'result';
/** undefined = ainda não escolheu; null = "Pular Voto". */
type Choice = string | null | undefined;

export function VoteScreen() {
  const nav = useNavigation();
  const round = useAppStore((s) => s.round);
  const eliminatePlayer = useAppStore((s) => s.eliminatePlayer);
  const finishGame = useAppStore((s) => s.finishGame);

  // Eleitores fixados na entrada da tela: a lista não muda enquanto a votação acontece.
  const [voters] = useState(() => (round ? speakingOrder(round) : []));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('pass');
  const [choice, setChoice] = useState<Choice>(undefined);
  const [votes, setVotes] = useState<(string | null)[]>([]);
  const [tally, setTally] = useState<VoteTally | null>(null);

  useEffect(() => {
    nav.setBackInterceptor(() => {
      Alert.alert('Sair da partida?', 'A votação em andamento será perdida.', [
        { text: 'Ficar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => nav.reset('Home') },
      ]);
      return true;
    });
    return () => nav.setBackInterceptor(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!round || voters.length === 0) return null;

  const mode = getMode(round.modeId);
  const voter = voters[index];
  const candidates = voters.filter((v) => v.player.id !== voter.player.id);

  const confirmVote = () => {
    if (choice === undefined) return;
    const next = [...votes, choice];
    setVotes(next);
    setChoice(undefined);
    playSound('pop');
    haptic('medium');
    if (index + 1 >= voters.length) {
      setPhase('counting');
      return;
    }
    setIndex(index + 1);
    setPhase('pass');
  };

  const revealVotes = () => {
    const result = tallyVotes(votes);
    setTally(result);
    setPhase('result');
    if (result.eliminatedId) eliminatePlayer(result.eliminatedId);
    const updated = useAppStore.getState().round;
    const end = updated ? checkGameEnd(updated, { eliminatedId: result.eliminatedId, byVote: true }) : null;
    if (end) finishGame(end);
    playSound('reveal');
    haptic('heavy');
  };

  const continueGame = () => {
    if (useAppStore.getState().round?.end) {
      nav.replace('Result');
      return;
    }
    useAppStore.getState().nextCycle();
    playSound('whoosh');
    nav.replace('Discussion');
  };

  const title = mode.inverted ? 'Quem é o Sábio?' : 'Quem é o impostor?';

  if (phase === 'result' && tally) {
    const eliminated = tally.eliminatedId ? round.players.find((p) => p.player.id === tally.eliminatedId) : undefined;
    const rows = voters
      .map((v) => ({ rp: v, count: tally.counts[v.player.id] ?? 0 }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
    const maxCount = Math.max(1, tally.skips, ...rows.map((r) => r.count));
    const ended = Boolean(useAppStore.getState().round?.end);

    return (
      <Screen
        title={`Votação · Rodada ${round.cycle}`}
        subtitle={mode.name}
        showBack={false}
        footer={
          <Button
            title={ended ? 'Ver resultado final' : 'Próxima rodada'}
            icon={ended ? 'flag-checkered' : 'account-voice'}
            variant={ended ? 'success' : 'primary'}
            size="lg"
            onPress={continueGame}
          />
        }
      >
        <Animated.View entering={ZoomIn.springify().damping(12)}>
          {eliminated ? (
            <Card accent={ROLE_COLOR[eliminated.role]} style={styles.center}>
              <AppText variant="label" color={colors.textMuted}>
                Eliminado nesta rodada
              </AppText>
              <Avatar name={eliminated.player.name} color={eliminated.player.color} size={80} />
              <AppText variant="title" center>
                {eliminated.player.name}
              </AppText>
              <Animated.View entering={FadeIn.delay(600).duration(400)}>
                <AppText variant="heading" weight="bold" color={ROLE_COLOR[eliminated.role]} center>
                  {eliminated.role === 'impostor' ? 'Era um IMPOSTOR!' : `Era ${ROLE_NAME[eliminated.role]}`}
                </AppText>
              </Animated.View>
            </Card>
          ) : (
            <Card style={styles.center}>
              <Icon name={tally.reason === 'tie' ? 'scale-balance' : 'debug-step-over'} size={56} color={colors.warning} />
              <AppText variant="title" center>
                Ninguém foi eliminado
              </AppText>
              <AppText color={colors.textMuted} center>
                {tally.reason === 'tie'
                  ? 'Deu empate na votação.'
                  : 'Os votos "Pular" superaram os votos em qualquer jogador.'}
              </AppText>
            </Card>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <SectionTitle>Apuração</SectionTitle>
          <Card style={styles.tally}>
            {rows.map(({ rp, count }) => (
              <View key={rp.player.id} style={styles.tallyRow}>
                <Avatar name={rp.player.name} color={rp.player.color} size={30} />
                <View style={styles.flex}>
                  <AppText variant="caption" numberOfLines={1}>
                    {rp.player.name}
                  </AppText>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        { width: `${(count / maxCount) * 100}%`, backgroundColor: rp.player.id === tally.eliminatedId ? colors.danger : colors.primary },
                      ]}
                    />
                  </View>
                </View>
                <AppText weight="bold">{count}</AppText>
              </View>
            ))}
            <View style={styles.tallyRow}>
              <View style={styles.skipIcon}>
                <Icon name="debug-step-over" size={18} color={colors.textMuted} />
              </View>
              <View style={styles.flex}>
                <AppText variant="caption">Pular voto</AppText>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { width: `${(tally.skips / maxCount) * 100}%`, backgroundColor: colors.textDim }]} />
                </View>
              </View>
              <AppText weight="bold">{tally.skips}</AppText>
            </View>
          </Card>
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen
      title={`Votação · Rodada ${round.cycle}`}
      subtitle={phase === 'counting' ? 'Todos votaram' : `Eleitor ${index + 1} de ${voters.length}`}
      scroll={phase === 'ballot'}
      showBack={false}
      contentStyle={phase === 'ballot' ? undefined : styles.centered}
      footer={
        phase === 'ballot' ? (
          <Button
            title={choice === undefined ? 'Escolha uma opção' : 'Confirmar voto'}
            icon="check-decagram"
            size="lg"
            disabled={choice === undefined}
            sound={null}
            onPress={confirmVote}
          />
        ) : undefined
      }
    >
      <View style={styles.progress}>
        {voters.map((v, i) => (
          <View
            key={v.player.id}
            style={[
              styles.dot,
              { backgroundColor: i < index || phase === 'counting' ? colors.primary : i === index ? colors.accent : colors.surfaceAlt },
            ]}
          />
        ))}
      </View>

      {phase === 'pass' ? (
        <Animated.View key={`pass-${index}`} entering={SlideInRight.springify().damping(18)} exiting={SlideOutLeft.duration(220)} style={styles.passBox}>
          <Icon name="cellphone-arrow-down" size={42} color={colors.textMuted} />
          <AppText variant="body" color={colors.textMuted} center>
            Voto secreto · passe o celular para
          </AppText>
          <Animated.View entering={ZoomIn.delay(120).springify().damping(12)}>
            <Avatar name={voter.player.name} color={voter.player.color} size={110} />
          </Animated.View>
          <AppText variant="display" center numberOfLines={2} adjustsFontSizeToFit>
            {voter.player.name}
          </AppText>
          <Button
            title={`Sou ${voter.player.name.split(' ')[0]}, votar`}
            icon="vote"
            size="lg"
            style={styles.fullWidth}
            onPress={() => {
              setPhase('ballot');
              haptic('medium');
            }}
          />
        </Animated.View>
      ) : phase === 'ballot' ? (
        <Animated.View key={`ballot-${index}`} entering={FadeIn.duration(250)} style={styles.ballot}>
          <AppText variant="title" center>
            {title}
          </AppText>
          <AppText variant="caption" color={colors.textMuted} center>
            {voter.player.name}, escolha em segredo quem deve sair — ou pule o voto.
          </AppText>
          <View style={styles.grid}>
            {candidates.map((c) => {
              const selected = choice === c.player.id;
              return (
                <PressableScale key={c.player.id} style={styles.cell} onPress={() => setChoice(c.player.id)} sound="click">
                  <View style={[styles.option, selected && { borderColor: colors.danger, backgroundColor: `${colors.danger}22` }]}>
                    <Avatar name={c.player.name} color={c.player.color} size={44} />
                    <AppText variant="caption" weight="semibold" center numberOfLines={1}>
                      {c.player.name}
                    </AppText>
                  </View>
                </PressableScale>
              );
            })}
          </View>
          <PressableScale onPress={() => setChoice(null)} sound="click">
            <View style={[styles.option, styles.skip, choice === null && { borderColor: colors.accent, backgroundColor: `${colors.accent}22` }]}>
              <Icon name="debug-step-over" size={24} color={choice === null ? colors.accent : colors.textMuted} />
              <AppText weight="bold">Pular Voto</AppText>
            </View>
          </PressableScale>
        </Animated.View>
      ) : (
        <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.passBox}>
          <Icon name="ballot" size={84} color={colors.primary} />
          <AppText variant="title" center>
            Todos votaram!
          </AppText>
          <AppText color={colors.textMuted} center>
            Coloquem o celular no centro da roda para ver o resultado juntos.
          </AppText>
          <Button title="Revelar votação" icon="eye" variant="danger" size="lg" style={styles.fullWidth} sound={null} onPress={revealVotes} />
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center' },
  centered: { justifyContent: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  progress: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 6 },
  dot: { width: 22, height: 6, borderRadius: 3 },
  passBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  ballot: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cell: { width: '50%', padding: 4 },
  option: {
    alignItems: 'center',
    gap: 6,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  skip: { flexDirection: 'row', justifyContent: 'center' },
  tally: { gap: spacing.md },
  tallyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skipIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, overflow: 'hidden', marginTop: 4 },
  bar: { height: 8, borderRadius: 4 },
});
