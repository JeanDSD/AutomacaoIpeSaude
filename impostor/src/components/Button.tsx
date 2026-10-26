import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { SoundName } from '../audio/sounds';
import { colors, gradients, radius } from '../theme/colors';
import type { IconName } from '../types';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'danger' | 'success' | 'special' | 'accent' | 'ghost' | 'outline';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  size?: 'md' | 'lg' | 'sm';
  style?: StyleProp<ViewStyle>;
  sound?: SoundName | null;
}

const gradientByVariant = {
  primary: gradients.primary,
  danger: gradients.danger,
  success: gradients.success,
  special: gradients.special,
  accent: gradients.accent,
} as const;

export function Button({ title, onPress, variant = 'primary', icon, iconRight, disabled, size = 'md', style, sound }: Props) {
  const height = size === 'lg' ? 62 : size === 'sm' ? 42 : 52;
  const textColor = variant === 'accent' ? '#04212B' : colors.text;
  const content = (
    <View style={[styles.row, { height }]}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 18 : 22} color={textColor} /> : null}
      <AppText variant={size === 'lg' ? 'heading' : 'body'} weight="bold" color={textColor} numberOfLines={1}>
        {title}
      </AppText>
      {iconRight ? <Icon name={iconRight} size={size === 'sm' ? 18 : 22} color={textColor} /> : null}
    </View>
  );

  return (
    <PressableScale onPress={onPress} disabled={disabled} style={style} sound={sound}>
      {variant === 'ghost' || variant === 'outline' ? (
        <View style={[styles.base, variant === 'outline' ? styles.outline : styles.ghost]}>{content}</View>
      ) : (
        <LinearGradient
          colors={gradientByVariant[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, styles.shadow]}
        >
          {content}
        </LinearGradient>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20 },
  ghost: { backgroundColor: colors.surface },
  outline: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: 'transparent' },
  shadow: { elevation: 6 },
});
