import { Alert, StyleSheet, Switch, View } from 'react-native';

import { playSound } from '../audio/sounds';
import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { GAME_MODES } from '../data/gameModes';
import { BUILT_IN_THEMES } from '../data/themes';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing } from '../theme/colors';
import type { IconName } from '../types';

function ToggleRow({ icon, label, value, onChange }: { icon: IconName; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={22} color={colors.primary} />
      <AppText style={styles.flex}>{label}</AppText>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.surfaceAlt }}
        thumbColor={colors.text}
      />
    </View>
  );
}

export function SettingsScreen() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetScores = useAppStore((s) => s.resetScores);
  const clearAllHistory = useAppStore((s) => s.clearAllHistory);
  const totalWords = BUILT_IN_THEMES.reduce((sum, t) => sum + t.words.length, 0);

  return (
    <Screen title="Ajustes">
      <Card>
        <SectionTitle>Experiência</SectionTitle>
        <ToggleRow
          icon="volume-high"
          label="Efeitos sonoros"
          value={settings.soundEnabled}
          onChange={(v) => {
            updateSettings({ soundEnabled: v });
            if (v) playSound('click');
          }}
        />
        <ToggleRow icon="vibrate" label="Vibração" value={settings.hapticsEnabled} onChange={(v) => updateSettings({ hapticsEnabled: v })} />
      </Card>

      <Card>
        <SectionTitle>Testar sons</SectionTitle>
        <View style={styles.sounds}>
          <Button title="Revelar" size="sm" variant="ghost" icon="eye" sound={null} onPress={() => playSound('reveal')} />
          <Button title="Suspense" size="sm" variant="ghost" icon="incognito" sound={null} onPress={() => playSound('suspense')} />
          <Button title="Vitória" size="sm" variant="ghost" icon="trophy" sound={null} onPress={() => playSound('victory')} />
          <Button title="Derrota" size="sm" variant="ghost" icon="skull" sound={null} onPress={() => playSound('defeat')} />
        </View>
      </Card>

      <Card>
        <SectionTitle>Dados</SectionTitle>
        <Button
          title="Zerar placar"
          icon="restart"
          variant="outline"
          onPress={() =>
            Alert.alert('Zerar placar?', 'Os pontos de todos os jogadores voltam a zero.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Zerar', style: 'destructive', onPress: resetScores },
            ])
          }
        />
        <Button
          title="Limpar histórico de palavras"
          icon="history"
          variant="outline"
          onPress={() =>
            Alert.alert('Limpar histórico?', 'Todas as palavras voltam a ser sorteáveis.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Limpar', style: 'destructive', onPress: clearAllHistory },
            ])
          }
        />
      </Card>

      <AppText variant="caption" color={colors.textDim} center>
        Impostor v1.0 · {GAME_MODES.length} modos · {BUILT_IN_THEMES.length} temas · {totalWords} palavras embutidas
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sounds: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
