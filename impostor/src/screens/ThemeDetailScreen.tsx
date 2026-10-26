import { useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { Screen } from '../components/Screen';
import { useThemes } from '../hooks/useThemes';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/colors';
import { normalize } from '../utils/text';

const PAGE = 300;

export function ThemeDetailScreen() {
  const nav = useNavigation();
  const themes = useThemes();
  const history = useAppStore((s) => s.history);
  const clearThemeHistory = useAppStore((s) => s.clearThemeHistory);
  const deleteCustomTheme = useAppStore((s) => s.deleteCustomTheme);
  const theme = themes.find((t) => t.id === nav.route.params?.id);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const used = useMemo(() => new Set(theme ? history[theme.id] ?? [] : []), [history, theme]);
  const filtered = useMemo(() => {
    if (!theme) return [];
    const q = normalize(query);
    return q ? theme.words.filter((w) => normalize(w).includes(q)) : theme.words;
  }, [theme, query]);

  if (!theme) {
    return (
      <Screen title="Tema">
        <AppText center>Tema não encontrado.</AppText>
      </Screen>
    );
  }

  const confirmDelete = () =>
    Alert.alert('Excluir tema?', `"${theme.name}" e seu histórico serão apagados.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteCustomTheme(theme.id);
          nav.goBack();
        },
      },
    ]);

  return (
    <Screen
      title={theme.name}
      subtitle={`${theme.words.length} palavras · ${used.size} usadas`}
      right={theme.custom ? <IconButton icon="delete" color={colors.danger} onPress={confirmDelete} /> : undefined}
    >
      <View style={styles.search}>
        <Icon name="magnify" size={20} color={colors.textDim} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar palavra"
          placeholderTextColor={colors.textDim}
          style={styles.input}
          selectionColor={colors.primary}
        />
      </View>

      {used.size ? (
        <Button
          title={`Liberar ${used.size} palavra(s) usada(s)`}
          icon="restore"
          variant="ghost"
          size="sm"
          onPress={() => clearThemeHistory(theme.id)}
        />
      ) : null}

      <View style={styles.words}>
        {filtered.slice(0, limit).map((word) => {
          const isUsed = used.has(word);
          return (
            <View key={word} style={[styles.word, isUsed && styles.wordUsed]}>
              <AppText variant="caption" color={isUsed ? colors.textDim : colors.text} style={isUsed ? styles.strike : undefined}>
                {word}
              </AppText>
            </View>
          );
        })}
      </View>
      {filtered.length > limit ? (
        <Button title={`Mostrar mais (${filtered.length - limit})`} variant="outline" size="sm" onPress={() => setLimit((l) => l + PAGE)} />
      ) : null}
      <AppText variant="caption" color={colors.textDim} center>
        Palavras riscadas já foram sorteadas e não voltam até serem liberadas no Histórico.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, height: 46, color: colors.text, fontFamily: 'Poppins_400Regular', fontSize: 15 },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  word: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface },
  wordUsed: { backgroundColor: colors.bgElevated },
  strike: { textDecorationLine: 'line-through' },
});
