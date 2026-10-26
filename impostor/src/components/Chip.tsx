import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../theme/colors';
import type { IconName } from '../types';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface Props {
  label: string;
  selected?: boolean;
  color?: string;
  icon?: IconName;
  onPress?: () => void;
  count?: number;
}

export function Chip({ label, selected, color = colors.primary, icon, onPress, count }: Props) {
  const body = (
    <View
      style={[
        styles.chip,
        selected ? { backgroundColor: `${color}2E`, borderColor: color } : { borderColor: colors.border },
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={selected ? color : colors.textMuted} /> : null}
      <AppText variant="caption" weight="semibold" color={selected ? colors.text : colors.textMuted}>
        {label}
      </AppText>
      {count !== undefined ? (
        <AppText variant="caption" color={colors.textDim}>
          {count}
        </AppText>
      ) : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <PressableScale onPress={onPress} scaleTo={0.92}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    backgroundColor: colors.bgElevated,
  },
});
