import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '../theme/colors';
import type { IconName } from '../types';
import { AppText } from './AppText';
import { Icon } from './Icon';

export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message?: string }) {
  return (
    <Animated.View entering={FadeInDown.springify()} style={styles.box}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={40} color={colors.textMuted} />
      </View>
      <AppText variant="heading" center>
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" color={colors.textMuted} center>
          {message}
        </AppText>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 20 },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
});
