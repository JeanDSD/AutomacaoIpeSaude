import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNavigation } from '../navigation/Navigator';
import { colors, gradients, spacing } from '../theme/colors';
import { AppText } from './AppText';
import { IconButton } from './IconButton';

interface Props {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** Conteúdo rolável (padrão) ou fixo. */
  scroll?: boolean;
  /** Ação no canto direito do cabeçalho. */
  right?: ReactNode;
  /** Rodapé fixo (ex.: botão principal). */
  footer?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ title, subtitle, children, scroll = true, right, footer, showBack = true, onBack, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation();
  const hasHeader = Boolean(title) || showBack;

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />
      <View style={[styles.glow, { top: -120 }]} pointerEvents="none" />
      {hasHeader ? (
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          {showBack && nav.canGoBack ? (
            <IconButton icon="arrow-left" onPress={onBack ?? nav.goBack} accessibilityLabel="Voltar" />
          ) : (
            <View style={styles.headerSpacer} />
          )}
          <View style={styles.headerTitle}>
            {title ? (
              <AppText variant="heading" weight="bold" center numberOfLines={1}>
                {title}
              </AppText>
            ) : null}
            {subtitle ? (
              <AppText variant="caption" color={colors.textMuted} center numberOfLines={1}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {right ?? <View style={styles.headerSpacer} />}
        </View>
      ) : (
        <View style={{ height: insets.top }} />
      )}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>{footer}</View> : null}
      {!footer ? <View style={{ height: insets.bottom }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: colors.primary,
    opacity: 0.08,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  headerTitle: { flex: 1 },
  headerSpacer: { width: 44, height: 44 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.lg },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
});
