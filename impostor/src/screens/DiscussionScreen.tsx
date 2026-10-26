import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, StyleSheet, TextInput, View } from 'react-native';
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
import { ROLE_NAME } from '../data/roles';
import { useCountdown } from '../hooks/useCountdown';
import { canRiskWord, checkGameEnd, resolveWordRisk, speakingOrder } from '../logic/game';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/colors';
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
  const speechSetting = useAppStore((s) => s.settings.speechSeconds);
  const eliminatePlayer = useAppStore((s) => s.eliminatePlayer);
  const finishGame = useAppStore((s) => s.finishGame);
  const mode = getMode(round?.modeId ?? 'classic');
  const total = timerSetting || mode.suggestedTimer || 0;

  // Cronômetro geral da discussão e cronômetro de fala de quem está com a vez.
  const discussion = useCountdown(total);
  const speech = useCountdown(speechSetting);

  const [pos, setPos] = useState(0);
  const [lap, setLap] = useState(1);
  const [question, setQuestion] = useState<{ text: string; player: string } | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [riskOpen, setRiskOpen] = useState(false);
  const [guess, setGuess] = useState('');

  useEffect(() => {
    nav.setBackInterceptor(() => {
      Alert.alert('Sair da partida?', 'Você vai voltar ao menu inicial.', [
        { text: 'Ficar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: () => nav.reset('Home') },
      ]);
      return true;
    });
    return () => nav.setBackInterceptor(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (total === 0) return;
    if (discussion.remaining <= 10 && discussion.remaining > 0 && discussion.running) playSound('tick');
    if (discussion.remaining === 0) {
      playSound('timeup');
      haptic('warning');
      if (mode.timerIsDeadline) {
        finishGame({ outcome: 'impostor', reason: 'O tempo acabou antes de a roda eliminar o impostor.' });
        Alert.alert('Tempo esgotado!', 'A roda não votou a tempo: o impostor vence!', [
          { text: 'Ver resultado', onPress: () => nav.replace('Result') },
        ]);
      }
    }
  }, [discussion.remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (speechSetting === 0) return;
    if (speech.remaining <= 5 && speech.remaining > 0 && speech.running) playSound('tick');
    if (speech.remaining === 0) {
      // Alerta de "passe a vez".
      playSound('timeup');
      haptic('warning');
    }
  }, [speech.remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!round) return null;

  const order = speakingOrder(round);
  const current = order[pos % order.length];
  const extra = mode.extra && mode.extra !== 'questions' ? EXTRA_TIPS[mode.extra] : null;
  const out = new Set(round.eliminatedIds);
  const riskAllowed = canRiskWord(round);

  const nextSpeaker = () => {
    playSound('whoosh');
    haptic('light');
    if (pos + 1 >= order.length) {
      setPos(0);
      setLap((l) => l + 1);
    } else {
      setPos(pos + 1);
    }
    speech.reset();
  };

  const drawQuestion = () => {
    playSound('reveal');
    haptic('selection');
    setQuestion({ text: pickRandom(QUESTIONS), player: pickRandom(order).player.name });
  };

  const openRisk = () => {
    speech.setRunning(false);
    setGuess('');
    setRiskOpen(true);
  };

  const submitRisk = () => {
    if (!guess.trim() || !current) return;
    setRiskOpen(false);
    const result = resolveWordRisk(round, current.player.id, guess);
    if (result.correct) {
      haptic('warning');
      finishGame(result.end);
      nav.replace('Result');
      return;
    }
    eliminatePlayer(current.player.id);
    const updated = useAppStore.getState().round;
    if (!updated) return;
    const end = checkGameEnd(updated, { eliminatedId: current.player.id, byVote: false });
    if (end) {
      finishGame(end);
      nav.replace('Result');
      return;
    }
    playSound('defeat');
    haptic('error');
    Alert.alert(
      'Eliminado!',
      current.role === 'impostor'
        ? `${current.player.name} errou a palavra e foi eliminado.\nEra um IMPOSTOR!`
        : `${current.player.name} arriscou sem ser impostor e foi eliminado.\nEra ${ROLE_NAME[current.role]}.`,
    );
    // Quem estava depois assume a vez na mesma posição.
    const remaining = speakingOrder(updated).length;
    if (pos >= remaining) {
      setPos(0);
      setLap((l) => l + 1);
    }
    speech.reset();
  };

  return (
    <Screen
      title={`Discussão · Rodada ${round.cycle}`}
      subtitle={`${mode.name} · ${order.length} jogadores na partida`}
      showBack={false}
      footer={<Button title="Ir para votação" icon="vote" variant="danger" size="lg" onPress={() => nav.replace('Vote')} />}
    >
      {current ? (
        <Animated.View key={`${current.player.id}-${lap}`} entering={ZoomIn.springify().damping(14)}>
          <Card accent={mode.color} style={styles.speaker}>
            <View style={styles.speakerHead}>
              <Avatar name={current.player.name} color={current.player.color} size={60} />
              <View style={styles.flex}>
                <AppText variant="label" color={colors.textMuted}>
                  Vez de falar · {pos + 1} de {order.length} · volta {lap}
                </AppText>
                <AppText variant="title" numberOfLines={1}>
                  {current.player.name}
                </AppText>
                <View style={styles.dirRow}>
                  <Icon name={round.clockwise ? 'rotate-right' : 'rotate-left'} size={16} color={colors.accent} />
                  <AppText variant="caption" color={colors.accent}>
                    Sentido {round.clockwise ? 'horário' : 'anti-horário'}
                  </AppText>
                </View>
              </View>
            </View>

            {speechSetting > 0 ? (
              <View style={styles.timerBox}>
                <TimerRing total={speechSetting} remaining={speech.remaining} size={160} />
                <View style={styles.timerActions}>
                  <IconButton
                    icon={speech.running ? 'pause' : 'play'}
                    background={colors.primary}
                    size={48}
                    onPress={speech.toggle}
                    disabled={speech.remaining === 0}
                  />
                  <IconButton icon="restart" size={48} onPress={() => speech.reset()} />
                </View>
                {speech.remaining === 0 ? (
                  <Animated.View entering={FadeIn} style={styles.timeUp}>
                    <Icon name="bell-ring" size={20} color={colors.warning} />
                    <AppText weight="bold" color={colors.warning}>
                      Tempo esgotado! Passe a vez.
                    </AppText>
                  </Animated.View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.speakerActions}>
              <Button title="Próximo jogador" icon="arrow-right-circle" sound={null} onPress={nextSpeaker} />
              {riskAllowed ? (
                <Button title="Arriscar Palavra" icon="target" variant="outline" onPress={openRisk} />
              ) : null}
            </View>
          </Card>
        </Animated.View>
      ) : null}

      {total > 0 ? (
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Card style={styles.timerBox}>
            <AppText variant="label" color={colors.textMuted}>
              Tempo da discussão
            </AppText>
            <TimerRing total={total} remaining={discussion.remaining} size={130} />
            <View style={styles.timerActions}>
              <IconButton
                icon={discussion.running ? 'pause' : 'play'}
                background={colors.primary}
                size={44}
                onPress={discussion.toggle}
                disabled={discussion.remaining === 0}
              />
              <IconButton icon="restart" size={44} onPress={() => discussion.reset()} disabled={mode.timerIsDeadline && discussion.remaining === 0} />
            </View>
            {mode.timerIsDeadline ? (
              <AppText variant="caption" color={colors.warning} center>
                Se o tempo acabar, o impostor vence!
              </AppText>
            ) : null}
          </Card>
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
          {round.players.map((rp, i) => {
            const eliminated = out.has(rp.player.id);
            const speaking = current?.player.id === rp.player.id;
            return (
              <View key={rp.player.id} style={[styles.orderItem, eliminated && styles.eliminated]}>
                <View style={speaking ? [styles.speakingRing, { borderColor: mode.color }] : null}>
                  <Avatar name={rp.player.name} color={eliminated ? colors.textDim : rp.player.color} size={34} />
                </View>
                <AppText variant="caption" color={colors.textMuted} numberOfLines={1} style={styles.orderName}>
                  {eliminated ? '💀 ' : `${i + 1}. `}
                  {rp.player.name}
                </AppText>
              </View>
            );
          })}
        </View>
      </View>

      <Modal visible={riskOpen} transparent animationType="fade" onRequestClose={() => setRiskOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
          <Card accent={colors.danger} style={styles.modal}>
            <View style={styles.dirRow}>
              <Icon name="target" size={26} color={colors.danger} />
              <AppText variant="heading" weight="bold">
                Arriscar a palavra
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textMuted}>
              {current ? `${current.player.name}, ` : ''}digite a palavra secreta. Se um impostor acertar, os impostores vencem na
              hora. Se errar — ou se não for impostor — está eliminado.
            </AppText>
            <TextInput
              value={guess}
              onChangeText={setGuess}
              autoFocus
              autoCorrect={false}
              placeholder="Qual é a palavra?"
              placeholderTextColor={colors.textDim}
              returnKeyType="done"
              onSubmitEditing={submitRisk}
              style={styles.input}
            />
            <Button title="Confirmar chute" icon="check" variant="danger" disabled={!guess.trim()} onPress={submitRisk} />
            <Button title="Desistir" variant="ghost" onPress={() => setRiskOpen(false)} />
          </Card>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  speaker: { gap: spacing.lg },
  speakerHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  speakerActions: { gap: spacing.sm },
  dirRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerBox: { alignItems: 'center', gap: spacing.md },
  timerActions: { flexDirection: 'row', gap: spacing.md },
  timeUp: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  extra: { flexDirection: 'row', alignItems: 'center' },
  question: { gap: 4 },
  rulesHeader: { flexDirection: 'row', alignItems: 'center' },
  rule: { flexDirection: 'row', gap: 10 },
  order: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.sm },
  orderItem: { alignItems: 'center', width: 70, gap: 4 },
  orderName: { maxWidth: 70 },
  eliminated: { opacity: 0.45 },
  speakingRing: { borderWidth: 2, borderRadius: radius.pill, padding: 2 },
  backdrop: { flex: 1, backgroundColor: '#000000B3', justifyContent: 'center', padding: spacing.xl },
  modal: { gap: spacing.md },
  input: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
  },
});
