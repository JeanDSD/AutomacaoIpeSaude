import { useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { playSound } from '../audio/sounds';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/colors';
import { haptic } from '../utils/haptics';
import { normalize, parseWordList } from '../utils/text';

const EXAMPLE = 'Pizza, Lasanha, Sushi\nHambúrguer\nCoxinha';

export function ImportThemeScreen() {
  const nav = useNavigation();
  const customThemes = useAppStore((s) => s.customThemes);
  const saveCustomTheme = useAppStore((s) => s.saveCustomTheme);
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  const words = useMemo(() => parseWordList(text), [text]);
  const existing = customThemes.find((t) => name.trim() && normalize(t.name) === normalize(name));
  const canSave = name.trim().length > 0 && words.length >= 2;

  const save = () => {
    if (!canSave) return;
    const { theme, added } = saveCustomTheme(name, words);
    playSound('reveal');
    haptic('success');
    Alert.alert(
      existing ? 'Tema atualizado!' : 'Tema criado!',
      existing
        ? `${added} nova(s) palavra(s) adicionada(s) em "${theme.name}" (total: ${theme.words.length}).`
        : `"${theme.name}" foi salvo com ${theme.words.length} palavras.`,
      [{ text: 'OK', onPress: () => nav.goBack() }],
    );
  };

  return (
    <Screen
      title="Importar tema"
      footer={
        <Button
          title={existing ? `Adicionar a "${existing.name}"` : 'Salvar tema'}
          icon="content-save"
          variant="success"
          disabled={!canSave}
          onPress={save}
        />
      }
    >
      <View style={styles.field}>
        <SectionTitle>Nome do novo tema</SectionTitle>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ex.: Personagens da minha família"
          placeholderTextColor={colors.textDim}
          style={styles.input}
          maxLength={40}
          selectionColor={colors.primary}
        />
        {existing ? (
          <AppText variant="caption" color={colors.warning}>
            Já existe um tema com esse nome: as palavras novas serão somadas a ele.
          </AppText>
        ) : null}
      </View>

      <View style={styles.field}>
        <SectionTitle right={<AppText variant="caption" color={colors.accent}>{`${words.length} palavras`}</AppText>}>
          Cole a lista de palavras
        </SectionTitle>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={EXAMPLE}
          placeholderTextColor={colors.textDim}
          style={[styles.input, styles.textarea]}
          multiline
          textAlignVertical="top"
          selectionColor={colors.primary}
        />
        <AppText variant="caption" color={colors.textDim}>
          Separe por vírgula, ponto e vírgula ou uma palavra por linha. Duplicadas são removidas automaticamente.
        </AppText>
      </View>

      {words.length ? (
        <Animated.View entering={FadeIn}>
          <Card>
            <SectionTitle>Pré-visualização</SectionTitle>
            <View style={styles.preview}>
              {words.slice(0, 60).map((w) => (
                <View key={w} style={styles.word}>
                  <AppText variant="caption">{w}</AppText>
                </View>
              ))}
              {words.length > 60 ? (
                <AppText variant="caption" color={colors.textDim}>
                  +{words.length - 60}
                </AppText>
              ) : null}
            </View>
          </Card>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
  },
  textarea: { minHeight: 200, paddingTop: spacing.md },
  preview: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  word: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt },
});
