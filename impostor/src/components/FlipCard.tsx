import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, gradients, radius, spacing } from '../theme/colors';
import type { RevealCard } from '../types';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface Props {
  card: RevealCard;
  flipped: boolean;
  onPress: () => void;
}

const toneGradient = {
  safe: ['#1E2A4A', '#0F172A'] as const,
  danger: ['#4C0519', '#1F0710'] as const,
  special: ['#422006', '#1C1003'] as const,
};
const toneColor = { safe: colors.accent, danger: colors.danger, special: colors.special };

/** Cartão que gira em 3D para revelar o papel do jogador. */
export function FlipCard({ card, flipped, onPress }: Props) {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);
  const wordScale = useSharedValue(0.6);

  useEffect(() => {
    rotation.value = withSpring(flipped ? 180 : 0, { damping: 16, stiffness: 110, mass: 0.9 });
    if (flipped) {
      wordScale.value = 0.6;
      wordScale.value = withSequence(withTiming(0.6, { duration: 220 }), withSpring(1, { damping: 9, stiffness: 160 }));
    }
  }, [flipped, rotation, wordScale]);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [pulse]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value}deg` }],
    opacity: rotation.value < 90 ? 1 : 0,
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotation.value + 180}deg` }],
    opacity: rotation.value >= 90 ? 1 : 0,
  }));
  const hintStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.7, 1]),
  }));
  const wordStyle = useAnimatedStyle(() => ({ transform: [{ scale: wordScale.value }] }));

  const accent = toneColor[card.tone];

  return (
    <PressableScale onPress={onPress} sound={null} scaleTo={0.98} style={styles.wrap}>
      {/* Verso (oculto) */}
      <Animated.View style={[styles.face, frontStyle]}>
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
          <View style={styles.pattern}>
            {Array.from({ length: 24 }).map((_, i) => (
              <Icon key={i} name="help" size={28} color="rgba(255,255,255,0.07)" />
            ))}
          </View>
          <Animated.View style={[styles.center, hintStyle]}>
            <View style={styles.backBadge}>
              <Icon name="fingerprint" size={64} color={colors.text} />
            </View>
            <AppText variant="heading" weight="bold" center>
              Toque para revelar
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.75)" center>
              Garanta que ninguém está espiando!
            </AppText>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Frente (papel) */}
      <Animated.View style={[styles.face, backStyle]}>
        <LinearGradient colors={toneGradient[card.tone]} style={[styles.fill, { borderColor: accent }, styles.border]}>
          <View style={styles.content}>
            <View style={[styles.roleIcon, { backgroundColor: `${accent}26` }]}>
              <Icon name={card.icon} size={40} color={accent} />
            </View>
            <AppText variant="label" color={accent} center>
              {card.title}
            </AppText>
            {card.word ? (
              <Animated.View style={wordStyle}>
                <AppText variant="display" center adjustsFontSizeToFit numberOfLines={2} style={styles.word}>
                  {card.word}
                </AppText>
              </Animated.View>
            ) : card.tone === 'danger' ? (
              <Animated.View style={wordStyle}>
                <AppText variant="display" center color={colors.danger} style={styles.word}>
                  🤫
                </AppText>
              </Animated.View>
            ) : null}
            {card.subtitle ? (
              <AppText variant="body" color={colors.textMuted} center>
                {card.subtitle}
              </AppText>
            ) : null}
            {card.options ? (
              <View style={styles.options}>
                {card.options.map((o) => (
                  <View key={o} style={styles.option}>
                    <AppText variant="caption" weight="semibold" center>
                      {o}
                    </AppText>
                  </View>
                ))}
              </View>
            ) : null}
            {card.details.map((d) => (
              <AppText key={d} variant="caption" color={colors.text} center style={styles.detail}>
                {d}
              </AppText>
            ))}
          </View>
          <AppText variant="caption" color={colors.textDim} center>
            Toque para esconder
          </AppText>
        </LinearGradient>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', aspectRatio: 0.72, maxHeight: 500, alignSelf: 'center' },
  face: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backfaceVisibility: 'hidden' },
  fill: { flex: 1, borderRadius: radius.xl, overflow: 'hidden', padding: spacing.xl, justifyContent: 'center' },
  border: { borderWidth: 2 },
  pattern: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    padding: 10,
  },
  center: { alignItems: 'center', gap: 10 },
  backBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  roleIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  word: { fontSize: 38, lineHeight: 46 },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 },
  option: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  detail: { opacity: 0.9 },
});
