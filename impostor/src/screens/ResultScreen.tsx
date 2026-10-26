import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { playSound } from '../audio/sounds';
import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Confetti } from '../components/Confetti';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { getMode } from '../data/gameModes';
import { ROLE_COLOR, ROLE_NAME } from '../data/roles';
import { startRound } from '../logic/startRound';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/colors';
import type { Outcome } from '../types';
import { haptic } from '../utils/haptics';

const OUTCOME_TITLE: Record<Outcome, string> = {
  civilians: 'Vitória dos civis!',
  impostor: 'O impostor venceu!',
  jester: 'O Bobo da Corte venceu!',
  sage: 'O Sábio escapou!',
  circle: 'A roda venceu!',
  noImpostor: 'Ninguém venceu!',
};

const LOSING: Outcome[] = ['impostor', 'noImpostor'];

export function ResultScreen() {
  const nav = useNavigation();
  const round = useAppStore((s) => s.round);
  const scores = useAppStore((s) => s.scores);
  const outcome = round?.end?.outcome;

  useEffect(() => {
    if (!outcome) return;
    playSound(LOSING.includes(outcome) ? 'defeat' : 'victory');
    haptic('success');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!round || !round.end || !outcome) {
    return (
      <Screen title="Resultado" showBack={false}>
        <AppText center>Nenhuma partida finalizada.</AppText>
        <Button title="Menu inicial" icon="home" onPress={() => nav.reset('Home')} />
      </Screen>
    );
  }

  const mode = getMode(round.modeId);
  const impostors = round.players.filter((p) => p.role === 'impostor');
  const specials = round.players.filter((p) => p.role !== 'impostor' && p.role !== 'civilian');
  const eliminated = round.eliminatedIds
    .map((id) => round.players.find((p) => p.player.id === id))
    .filter((p) => p !== undefined);

  const playAgain = () => {
    if (startRound()) nav.replace('Reveal');
  };

  const ranking = round.players
    .map((p) => ({ ...p.player, score: scores[p.player.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <Screen title="Resultado" subtitle={`${mode.name} · ${round.cycle} ${round.cycle === 1 ? 'rodada' : 'rodadas'}`} showBack={false}>
      <Animated.View entering={ZoomIn.springify().damping(12)}>
        <Card accent={LOSING.includes(outcome) ? colors.danger : colors.success} style={styles.center}>
          <Icon
            name={LOSING.includes(outcome) ? 'skull' : 'trophy'}
            size={56}
            color={LOSING.includes(outcome) ? colors.danger : colors.warning}
          />
          <AppText variant="title" center>
            {OUTCOME_TITLE[outcome]}
          </AppText>
          <AppText color={colors.textMuted} center>
            {round.end.reason}
          </AppText>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(250).springify()}>
        <Card accent={colors.danger} style={styles.center}>
          <AppText variant="label" color={colors.textMuted}>
            {mode.inverted ? 'O Sábio era' : impostors.length > 1 ? 'Os impostores eram' : impostors.length ? 'O impostor era' : 'Resultado'}
          </AppText>
          {(mode.inverted ? specials.filter((s) => s.role === 'sage') : impostors).map((p, i) => (
            <Animated.View key={p.player.id} entering={ZoomIn.delay(400 + i * 250).springify().damping(10)} style={styles.impostor}>
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

      {eliminated.length ? (
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <SectionTitle>Eliminados</SectionTitle>
          <View style={styles.roles}>
            {eliminated.map((p, i) => (
              <View key={p.player.id} style={[styles.roleChip, { borderColor: ROLE_COLOR[p.role] }]}>
                <AppText variant="caption" weight="bold" color={ROLE_COLOR[p.role]}>
                  {i + 1}º · {ROLE_NAME[p.role]}
                </AppText>
                <AppText variant="caption">{p.player.name}</AppText>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.outcomes}>
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
        <Button title="Nova partida" icon="refresh" size="lg" onPress={playAgain} />
        <Button title="Menu inicial" icon="home" variant="ghost" onPress={() => nav.reset('Home')} />
      </Animated.View>
      {!LOSING.includes(outcome) ? <Confetti colors={[colors.primary, colors.accent, colors.warning, colors.success, colors.danger]} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center' },
  impostor: { alignItems: 'center', gap: 6 },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  roleChip: { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  outcomes: { gap: spacing.sm },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  rankPos: { width: 28 },
});
