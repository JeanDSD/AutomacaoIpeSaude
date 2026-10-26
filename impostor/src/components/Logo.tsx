import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

interface Props {
  size?: number;
  /** Flutua e "pisca" os olhos. */
  animated?: boolean;
}

/** Arte vetorial do impostor encapuzado. */
export function Logo({ size = 180, animated = true }: Props) {
  const float = useSharedValue(0);
  const glow = useSharedValue(1);

  useEffect(() => {
    if (!animated) return;
    float.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
    glow.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 120 }), withTiming(1, { duration: 160 }), withTiming(1, { duration: 3200 })),
      -1,
    );
  }, [animated, float, glow]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -8 * float.value }, { rotate: `${(float.value - 0.5) * 4}deg` }],
  }));
  const eyesStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <Animated.View style={[{ width: size, height: size }, floatStyle]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.55} />
            <Stop offset="70%" stopColor="#6366F1" stopOpacity={0.12} />
            <Stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="hood" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#2A2150" />
            <Stop offset="100%" stopColor="#120E26" />
          </LinearGradient>
          <LinearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#A78BFA" />
            <Stop offset="100%" stopColor="#22D3EE" />
          </LinearGradient>
        </Defs>
        <Circle cx={100} cy={100} r={100} fill="url(#halo)" />
        <G>
          <Path
            d="M100 24 C 54 24 36 66 36 106 L 36 166 Q 100 192 164 166 L 164 106 C 164 66 146 24 100 24 Z"
            fill="url(#hood)"
            stroke="url(#rim)"
            strokeWidth={4}
          />
          <Path d="M100 24 C 92 40 90 56 92 70" stroke="#3B2F70" strokeWidth={3} fill="none" strokeLinecap="round" />
          <Ellipse cx={100} cy={110} rx={44} ry={48} fill="#05040B" />
          <Path d="M64 150 Q 100 170 136 150" stroke="#2A2150" strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      </Svg>
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, eyesStyle]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Path d="M68 106 Q 80 94 94 104 Q 82 112 68 106 Z" fill="#F43F5E" />
          <Path d="M132 106 Q 120 94 106 104 Q 118 112 132 106 Z" fill="#F43F5E" />
          <Circle cx={82} cy={104} r={2.6} fill="#FFE4E6" />
          <Circle cx={118} cy={104} r={2.6} fill="#FFE4E6" />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
