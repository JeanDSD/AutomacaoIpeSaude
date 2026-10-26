import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft, ZoomIn } from 'react-native-reanimated';

import { playSound } from '../audio/sounds';
import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { FlipCard } from '../components/FlipCard';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { getMode } from '../data/gameModes';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing } from '../theme/colors';
import { haptic } from '../utils/haptics';

type Phase = 'pass' | 'card';

export function RevealScreen() {
  const nav = useNavigation();
  const round = useAppStore((s) => s.round);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('pass');
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState(false);

  const confirmExit = () => {
    Alert.alert('Sair da rodada?', 'A palavra já foi marcada como usada.', [
      { text: 'Continuar jogando', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => nav.reset('Home') },
    ]);
    return true;
  };

  useEffect(() => {
    nav.setBackInterceptor(confirmExit);
    return () => nav.setBackInterceptor(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!round) {
    return (
      <Screen title="Rodada">
        <AppText center>Nenhuma rodada em andamento.</AppText>
        <Button title="Voltar ao início" onPress={() => nav.reset('Home')} />
      </Screen>
    );
  }

  const mode = getMode(round.modeId);
  const current = round.players[index];
  const isLast = index === round.players.length - 1;

  const flip = () => {
    const next = !flipped;
    setFlipped(next);
    if (next) {
      setSeen(true);
      // Som e vibração idênticos para todos os papéis: quem está ao lado não pode
      // descobrir o impostor pelo áudio.
      haptic('medium');
      playSound('reveal');
    } else {
      playSound('click');
    }
  };

  const passOn = () => {
    setFlipped(false);
    setSeen(false);
    if (isLast) {
      playSound('whoosh');
      nav.replace('Discussion');
      return;
    }
    playSound('whoosh');
    haptic('light');
    // Espera o cartão virar antes de trocar de jogador.
    setTimeout(() => {
      setIndex((i) => i + 1);
      setPhase('pass');
    }, flipped ? 280 : 0);
  };

  return (
    <Screen
      title={mode.name}
      subtitle={`Jogador ${index + 1} de ${round.players.length}`}
      scroll={false}
      onBack={confirmExit}
      contentStyle={styles.content}
    >
      <View style={styles.progress}>
        {round.players.map((rp, i) => (
          <View
            key={rp.player.id}
            style={[styles.dot, { backgroundColor: i < index ? colors.primary : i === index ? colors.accent : colors.surfaceAlt }]}
          />
        ))}
      </View>

      {phase === 'pass' ? (
        <Animated.View key={`pass-${index}`} entering={SlideInRight.springify().damping(18)} exiting={SlideOutLeft.duration(220)} style={styles.passBox}>
          <Icon name="cellphone-arrow-down" size={42} color={colors.textMuted} />
          <AppText variant="body" color={colors.textMuted} center>
            Passe o celular para
          </AppText>
          <Animated.View entering={ZoomIn.delay(120).springify().damping(12)}>
            <Avatar name={current.player.name} color={current.player.color} size={110} />
          </Animated.View>
          <AppText variant="display" center numberOfLines={2} adjustsFontSizeToFit>
            {current.player.name}
          </AppText>
          <AppText variant="caption" color={colors.textDim} center>
            Só toque no botão quando estiver com o celular na mão.
          </AppText>
          <Button
            title={`Sou ${current.player.name.split(' ')[0]}, mostrar`}
            icon="eye"
            size="lg"
            style={styles.fullWidth}
            onPress={() => {
              setPhase('card');
              haptic('medium');
            }}
          />
        </Animated.View>
      ) : (
        <Animated.View key={`card-${index}`} entering={FadeIn.duration(300)} exiting={FadeOut.duration(150)} style={styles.cardBox}>
          <FlipCard card={current.card} flipped={flipped} onPress={flip} />
          {seen ? (
            <Animated.View entering={FadeIn} style={styles.fullWidth}>
              <Button
                title={isLast ? 'Todos viram! Começar' : 'Esconder e passar'}
                icon={isLast ? 'account-voice' : 'arrow-right-circle'}
                variant={isLast ? 'success' : 'primary'}
                size="lg"
                sound={null}
                onPress={passOn}
              />
            </Animated.View>
          ) : (
            <View style={styles.placeholder} />
          )}
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center' },
  progress: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 6 },
  dot: { width: 22, height: 6, borderRadius: 3 },
  passBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  cardBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  fullWidth: { alignSelf: 'stretch' },
  placeholder: { height: 62 },
});
