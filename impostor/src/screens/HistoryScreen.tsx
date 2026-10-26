import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import { AppText } from '../components/AppText';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { PressableScale } from '../components/PressableScale';
import { Screen } from '../components/Screen';
import { useThemes } from '../hooks/useThemes';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/colors';

export function HistoryScreen() {
  const themes = useThemes();
  const history = useAppStore((s) => s.history);
  const unmarkWord = useAppStore((s) => s.unmarkWord);
  const clearThemeHistory = useAppStore((s) => s.clearThemeHistory);
  const clearAllHistory = useAppStore((s) => s.clearAllHistory);
  const [open, setOpen] = useState<string | null>(null);

  const entries = themes
    .map((theme) => ({ theme, words: history[theme.id] ?? [] }))
    .filter((e) => e.words.length > 0);
  const total = entries.reduce((sum, e) => sum + e.words.length, 0);

  const confirmClearAll = () =>
    Alert.alert('Limpar todo o histórico?', 'Todas as palavras voltam para a rotação.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: clearAllHistory },
    ]);

  return (
    <Screen
      title="Histórico de palavras"
      subtitle={`${total} palavra(s) já sorteada(s)`}
      right={total ? <IconButton icon="delete-sweep" color={colors.danger} onPress={confirmClearAll} /> : undefined}
    >
      {entries.length === 0 ? (
        <EmptyState
          icon="history"
          title="Nada por aqui ainda"
          message="As palavras sorteadas aparecem aqui, separadas por tema. Elas não se repetem até você excluí-las desta lista."
        />
      ) : (
        <AppText variant="caption" color={colors.textMuted}>
          Toque no ✕ de uma palavra para devolvê-la à rotação de sorteio.
        </AppText>
      )}

      {entries.map(({ theme, words }, i) => {
        const expanded = open === theme.id;
        return (
          <Animated.View key={theme.id} entering={FadeInDown.delay(i * 40).springify()} layout={LinearTransition.springify()} style={styles.card}>
            <PressableScale onPress={() => setOpen(expanded ? null : theme.id)} scaleTo={0.98}>
              <View style={styles.header}>
                <View style={[styles.icon, { backgroundColor: `${theme.color}22` }]}>
                  <Icon name={theme.icon} size={22} color={theme.color} />
                </View>
                <View style={styles.flex}>
                  <AppText weight="semibold">{theme.name}</AppText>
                  <AppText variant="caption" color={colors.textDim}>
                    {words.length} usada(s) de {theme.words.length}
                  </AppText>
                </View>
                <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.textMuted} />
              </View>
            </PressableScale>
            {expanded ? (
              <View style={styles.body}>
                <View style={styles.words}>
                  {[...words].reverse().map((word) => (
                    <Animated.View key={word} exiting={FadeOut.duration(150)} layout={LinearTransition} style={styles.word}>
                      <AppText variant="caption">{word}</AppText>
                      <PressableScale onPress={() => unmarkWord(theme.id, word)} sound="pop" hitSlop={8} scaleTo={0.8}>
                        <Icon name="close-circle" size={18} color={colors.danger} />
                      </PressableScale>
                    </Animated.View>
                  ))}
                </View>
                <PressableScale onPress={() => clearThemeHistory(theme.id)}>
                  <AppText variant="caption" weight="semibold" color={colors.danger} center>
                    Liberar todas deste tema
                  </AppText>
                </PressableScale>
              </View>
            ) : null}
          </Animated.View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  word: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
});
