import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { playSound, type SoundName } from '../audio/sounds';
import { haptic } from '../utils/haptics';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  /** Som tocado ao pressionar (null para silêncio). */
  sound?: SoundName | null;
  scaleTo?: number;
}

/** Área tocável com efeito de "mola", som e vibração. */
export function PressableScale({ style, children, sound = 'click', scaleTo = 0.95, onPress, disabled, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 15, stiffness: 400 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
        rest.onPressOut?.(e);
      }}
      onPress={(e) => {
        if (sound) playSound(sound);
        haptic('light');
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, animated, disabled ? { opacity: 0.45 } : null]}>{children}</Animated.View>
    </Pressable>
  );
}
