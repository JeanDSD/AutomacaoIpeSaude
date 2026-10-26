import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme/colors';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
}

export function Card({ children, style, accent }: Props) {
  return <View style={[styles.card, accent ? { borderColor: `${accent}66` } : null, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
