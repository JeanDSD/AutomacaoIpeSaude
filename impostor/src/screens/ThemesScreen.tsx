import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { PressableScale } from '../components/PressableScale';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { BUILT_IN_THEMES } from '../data/themes';
import { availableWords } from '../logic/wordPicker';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/colors';
import type { Theme } from '../types';

export function ThemesScreen() {
  const nav = useNavigation();
  const customThemes = useAppStore((s) => s.customThemes);
  const history = useAppStore((s) => s.history);
  const totalWords = [...BUILT_IN_THEMES, ...customThemes].reduce((sum, t) => sum + t.words.length, 0);

  const row = (theme: Theme, i: number) => {
    const left = availableWords(theme, history).length;
    const pct = theme.words.length ? left / theme.words.length : 0;
    return (
      <Animated.View key={theme.id} entering={FadeInDown.delay(Math.min(i, 12) * 30).springify()}>
        <PressableScale onPress={() => nav.navigate('ThemeDetail', { id: theme.id })} scaleTo={0.97}>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: `${theme.color}22` }]}>
              <Icon name={theme.icon} size={24} color={theme.color} />
            </View>
            <View style={styles.flex}>
              <AppText weight="semibold">{theme.name}</AppText>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: theme.color }]} />
              </View>
              <AppText variant="caption" color={colors.textDim}>
                {left} de {theme.words.length} palavras inéditas
              </AppText>
            </View>
            <Icon name="chevron-right" size={22} color={colors.textDim} />
          </View>
        </PressableScale>
      </Animated.View>
    );
  };

  return (
    <Screen
      title="Temas"
      subtitle={`${BUILT_IN_THEMES.length + customThemes.length} temas · ${totalWords} palavras`}
      footer={<Button title="Importar novo tema" icon="file-import" variant="success" onPress={() => nav.navigate('ImportTheme')} />}
    >
      {customThemes.length ? (
        <View style={styles.section}>
          <SectionTitle>Seus temas</SectionTitle>
          {customThemes.map(row)}
        </View>
      ) : null}
      <View style={styles.section}>
        <SectionTitle>Temas do app</SectionTitle>
        {BUILT_IN_THEMES.map(row)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  section: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
});
