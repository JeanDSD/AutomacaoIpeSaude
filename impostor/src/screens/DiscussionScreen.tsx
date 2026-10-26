import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { playSound } from '../audio/sounds';
import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { TimerRing } from '../components/TimerRing';
import { getMode } from '../data/gameModes';
import { QUESTIONS } from '../data/questions';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing } from '../theme/colors';
import type { DiscussionExtra, IconName } from '../types';
import { haptic } from '../utils/haptics';
import { pickRandom } from '../utils/random';

const EXTRA_TIPS: Record<Exclude<DiscussionExtra, null | 'questions'>, { icon: IconName; text: string }> = {
  mime: { icon: 'human-handsup', text: 'Silêncio total! Apenas gestos e expressões.' },
  draw: { icon: 'draw', text: 'Uma folha, um traço por vez. Nada de escrever letras!' },
  story: { icon: 'book-open-page-variant', text: 'Comece com "Era uma vez…" e cada um adiciona uma frase.' },
  sounds: { icon: 'volume-high', text: 'Só sons e onomatopeias. Palavras são proibidas!' },
  lightning: { icon: 'lightning-bolt', text: 'Uma palavra por pessoa, sem pensar. Rápido!' },
};

export function DiscussionScreen() {
  const nav = useNavigation();
  const round = useAppStore((s) => s.round);
  const timerSetting = useAppStore((s) => s.settings.timerSeconds);
  const mode = getMode(round?.modeId ?? 'classic');
  const total = timerSetting || mode.suggestedTimer || 0;

  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(total > 0);
  const [question, setQuestion] = useState<{ text: string; player: string } | null>(null);
  const [showRules, setShowRules] = useState(false);
  const timedOut = useRef(false);

  useEffect(() => {
    nav.setBackInterceptor(() => {
      Alert.alert('Sair da rodada?', 'Você vai voltar ao menu inicial.', [
        { text: 'Ficar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => nav.reset('Home') },
      ]);
      return true;
    });
    return () => nav.setBackInterceptor(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [running, remaining]);

  useEffect(() => {
    if (total === 0) return;
    if (remaining <= 10 && remaining > 0 && running) playSound('tick');
    if (remaining === 0 && !timedOut.current) {
      timedOut.current = true;
      setRunning(false);
      playSound('timeup');
      haptic('warning');
      if (mode.timerIsDeadline) {
        Alert.alert('Tempo esgotado!', 'A roda não votou a tempo: o impostor vence!', [
          { text: 'Ver resultado', onPress: () => nav.replace('Result', { outcome: 'impostor' }) },
        ]);
      }
    }
  }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!round) return null;

  const starter = round.players.find((p) => p.player.id === round.starterId)?.player;
  const players = round.players.filter((p) => p.role !== 'master');
  const extra = mode.extra && mode.extra !== 'questions' ? EXTRA_TIPS[mode.extra] : null;

  const drawQuestion = () => {
    playSound('reveal');
    haptic('selection');
    setQuestion({ text: pickRandom(QUESTIONS), player: pickRandom(players).player.name });
  };

  return (
    <Screen
      title="Discussão"
      subtitle={mode.name}
      showBack={false}
      footer={<Button title="Votação feita · Revelar" icon="incognito-off" variant="danger" size="lg" onPress={() => nav.replace('Result')} />}
    >
      {starter ? (
        <Animated.View entering={ZoomIn.springify().damping(14)}>
          <Card style={styles.starter}>
            <Avatar name={starter.name} color={starter.color} size={56} />
            <View style={styles.flex}>
              <AppText variant="label" color={colors.textMuted}>
                Quem começa
              </AppText>
              <AppText variant="title">{starter.name}</AppText>
              <View style={styles.dirRow}>
                <Icon name={round.clockwise ? 'rotate-right' : 'rotate-left'} size={16} color={colors.accent} />
                <AppText variant="caption" color={colors.accent}>
                  Sentido {round.clockwise ? 'horário' : 'anti-horário'}
                </AppText>
              </View>
            </View>
          </Card>
        </Animated.View>
      ) : null}

      {total > 0 ? (
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.timerBox}>
          <TimerRing total={total} remaining={remaining} />
          <View style={styles.timerActions}>
            <IconButton
              icon={running ? 'pause' : 'play'}
              background={colors.primary}
              size={52}
              onPress={() => setRunning((r) => !r)}
              disabled={remaining === 0}
            />
            <IconButton
              icon="restart"
              size={52}
              onPress={() => {
                timedOut.current = false;
                setRemaining(total);
                setRunning(true);
              }}
            />
          </View>
          {mode.timerIsDeadline ? (
            <AppText variant="caption" color={colors.warning} center>
              Se o tempo acabar, o impostor vence!
            </AppText>
          ) : null}
        </Animated.View>
      ) : null}

      {extra ? (
        <Card accent={mode.color} style={styles.extra}>
          <Icon name={extra.icon} size={28} color={mode.color} />
          <AppText variant="body" style={styles.flex}>
            {extra.text}
          </AppText>
        </Card>
      ) : null}

      {mode.extra === 'questions' ? (
        <Card accent={mode.color}>
          <SectionTitle>Pergunta da vez</SectionTitle>
          {question ? (
            <Animated.View key={question.text + question.player} entering={FadeIn.duration(300)} style={styles.question}>
              <AppText variant="heading" color={mode.color}>
                {question.player}, responda:
              </AppText>
              <AppText variant="title">{question.text}</AppText>
            </Animated.View>
          ) : (
            <AppText color={colors.textMuted}>Toque abaixo para sortear a primeira pergunta.</AppText>
          )}
          <Button title="Nova pergunta" icon="dice-5" variant="accent" onPress={drawQuestion} sound={null} />
        </Card>
      ) : null}

      <Card>
        <View style={styles.rulesHeader}>
          <AppText variant="heading" weight="bold" style={styles.flex}>
            Como jogar: {mode.name}
          </AppText>
          <IconButton icon={showRules ? 'chevron-up' : 'chevron-down'} size={36} onPress={() => setShowRules((s) => !s)} />
        </View>
        {showRules
          ? mode.rules.map((rule, i) => (
              <View key={i} style={styles.rule}>
                <AppText variant="caption" weight="bold" color={mode.color}>
                  {i + 1}
                </AppText>
                <AppText variant="caption" style={styles.flex}>
                  {rule}
                </AppText>
              </View>
            ))
          : null}
      </Card>

      <View>
        <SectionTitle>Ordem da roda</SectionTitle>
        <View style={styles.order}>
          {round.players.map((rp, i) => (
            <View key={rp.player.id} style={styles.orderItem}>
              <Avatar name={rp.player.name} color={rp.player.color} size={34} />
              <AppText variant="caption" color={colors.textMuted} numberOfLines={1} style={styles.orderName}>
                {i + 1}. {rp.player.name}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  starter: { flexDirection: 'row', alignItems: 'center' },
  dirRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerBox: { alignItems: 'center', gap: spacing.md },
  timerActions: { flexDirection: 'row', gap: spacing.md },
  extra: { flexDirection: 'row', alignItems: 'center' },
  question: { gap: 4 },
  rulesHeader: { flexDirection: 'row', alignItems: 'center' },
  rule: { flexDirection: 'row', gap: 10 },
  order: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.sm },
  orderItem: { alignItems: 'center', width: 70, gap: 4 },
  orderName: { maxWidth: 70 },
});
