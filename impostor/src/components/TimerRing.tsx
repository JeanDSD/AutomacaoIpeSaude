import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '../theme/colors';
import { AppText } from './AppText';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  total: number;
  remaining: number;
  size?: number;
}

function format(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/** Anel de progresso do cronômetro. */
export function TimerRing({ total, remaining, size = 200 }: Props) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useSharedValue(remaining / total);

  useEffect(() => {
    progress.value = withTiming(Math.max(0, remaining / total), { duration: 950, easing: Easing.linear });
  }, [remaining, total, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const urgent = remaining <= 10;
  const color = remaining === 0 ? colors.danger : urgent ? colors.warning : colors.accent;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceAlt} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <AppText variant="display" color={color}>
          {format(remaining)}
        </AppText>
        <AppText variant="caption" color={colors.textDim}>
          {remaining === 0 ? 'TEMPO ESGOTADO' : 'restantes'}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
