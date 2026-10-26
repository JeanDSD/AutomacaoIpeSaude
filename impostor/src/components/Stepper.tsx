import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

interface Props {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function Stepper({ value, min, max, onChange, disabled }: Props) {
  return (
    <View style={styles.row}>
      <IconButton icon="minus" onPress={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min} />
      <Animated.View key={value} entering={ZoomIn.springify().damping(14)} style={styles.value}>
        <AppText variant="title" weight="black" center>
          {disabled ? '?' : value}
        </AppText>
      </Animated.View>
      <IconButton icon="plus" onPress={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  value: { minWidth: 48, alignItems: 'center', borderRadius: 12, backgroundColor: colors.surfaceAlt, paddingVertical: 4 },
});
