import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { PressableScale } from '../components/PressableScale';
import { Screen } from '../components/Screen';
import { useThemes } from '../hooks/useThemes';
import { availableWords } from '../logic/wordPicker';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/colors';

export function ThemeSelectScreen() {
  const nav = useNavigation();
  const themes = useThemes();
  const history = useAppStore((s) => s.history);
  const selected = useAppStore((s) => s.settings.selectedThemeIds);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const all = selected.length === 0;

  const toggle = (id: string) => {
    const next = selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id];
    updateSettings({ selectedThemeIds: next.length === themes.length ? [] : next });
  };

  return (
    <Screen
      title="Escolher temas"
      subtitle={all ? 'Todos os temas' : `${selected.length} selecionado(s)`}
      footer={<Button title="Pronto" icon="check" onPress={nav.goBack} />}
    >
      <PressableScale onPress={() => updateSettings({ selectedThemeIds: [] })}>
        <View style={[styles.allRow, all && styles.allRowOn]}>
          <Icon name="all-inclusive" size={24} color={all ? colors.primary : colors.textMuted} />
          <AppText weight="semibold" style={styles.flex}>
            Misturar todos os temas
          </AppText>
          <Icon name={all ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'} size={24} color={all ? colors.primary : colors.textDim} />
        </View>
      </PressableScale>

      <View style={styles.grid}>
        {themes.map((theme, i) => {
          const on = !all && selected.includes(theme.id);
          const left = availableWords(theme, history).length;
          return (
            <Animated.View key={theme.id} entering={FadeInDown.delay(Math.min(i, 12) * 30).springify()} style={styles.cell}>
              <PressableScale onPress={() => toggle(theme.id)} scaleTo={0.94}>
                <View style={[styles.tile, on && { borderColor: theme.color, backgroundColor: `${theme.color}1F` }]}>
                  <View style={styles.tileTop}>
                    <Icon name={theme.icon} size={26} color={theme.color} />
                    {on ? <Icon name="check-circle" size={20} color={theme.color} /> : null}
                  </View>
                  <AppText weight="semibold" numberOfLines={1}>
                    {theme.name}
                  </AppText>
                  <AppText variant="caption" color={left === 0 ? colors.danger : colors.textDim}>
                    {left}/{theme.words.length} restantes{theme.custom ? ' · seu' : ''}
                  </AppText>
                </View>
              </PressableScale>
            </Animated.View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  allRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  allRowOn: { borderColor: colors.primary, backgroundColor: `${colors.primary}1A` },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  cell: { width: '50%', padding: 5 },
  tile: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 4,
  },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
});
