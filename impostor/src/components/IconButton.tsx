import { StyleSheet, View } from 'react-native';

import type { SoundName } from '../audio/sounds';
import { colors, radius } from '../theme/colors';
import type { IconName } from '../types';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface Props {
  icon: IconName;
  onPress: () => void;
  color?: string;
  background?: string;
  size?: number;
  disabled?: boolean;
  sound?: SoundName | null;
  accessibilityLabel?: string;
}

export function IconButton({ icon, onPress, color = colors.text, background = colors.surface, size = 44, disabled, sound, accessibilityLabel }: Props) {
  return (
    <PressableScale onPress={onPress} disabled={disabled} sound={sound} scaleTo={0.88} accessibilityLabel={accessibilityLabel} hitSlop={6}>
      <View style={[styles.base, { width: size, height: size, backgroundColor: background }]}>
        <Icon name={icon} size={size * 0.5} color={color} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
