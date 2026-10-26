import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { PressableScale } from '../components/PressableScale';
import { Screen } from '../components/Screen';
import { GAME_MODES } from '../data/gameModes';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/colors';

export function ModesScreen() {
  const nav = useNavigation();
  const modeId = useAppStore((s) => s.settings.modeId);
  const playerCount = useAppStore((s) => s.players.length);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [expanded, setExpanded] = useState<string | null>(modeId);

  return (
    <Screen title="Modos de jogo" subtitle={`${GAME_MODES.length} modos disponíveis`}>
      {GAME_MODES.map((mode, i) => {
        const selected = mode.id === modeId;
        const open = expanded === mode.id;
        return (
          <Animated.View key={mode.id} entering={FadeInDown.delay(Math.min(i, 10) * 40).springify()} layout={LinearTransition.springify()}>
            <PressableScale onPress={() => setExpanded(open ? null : mode.id)} scaleTo={0.98}>
              <View style={[styles.card, selected && { borderColor: mode.color, backgroundColor: `${mode.color}14` }]}>
                <View style={styles.header}>
                  <View style={[styles.icon, { backgroundColor: `${mode.color}26` }]}>
                    <Icon name={mode.icon} size={26} color={mode.color} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="heading" weight="bold">
                      {mode.name}
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {mode.tagline}
                    </AppText>
                  </View>
                  {selected ? <Icon name="check-circle" size={26} color={mode.color} /> : null}
                </View>
                {open ? (
                  <View style={styles.body}>
                    <AppText variant="body" color={colors.textMuted}>
                      {mode.description}
                    </AppText>
                    {mode.rules.map((rule, idx) => (
                      <View key={idx} style={styles.rule}>
                        <AppText variant="caption" weight="bold" color={mode.color}>
                          {idx + 1}
                        </AppText>
                        <AppText variant="caption" color={colors.text} style={styles.flex}>
                          {rule}
                        </AppText>
                      </View>
                    ))}
                    <View style={styles.footer}>
                      <AppText variant="caption" color={playerCount >= mode.minPlayers ? colors.textDim : colors.warning}>
                        Mínimo de {mode.minPlayers} jogadores
                      </AppText>
                      <Button
                        title={selected ? 'Selecionado' : 'Jogar este modo'}
                        size="sm"
                        variant={selected ? 'ghost' : 'primary'}
                        icon={selected ? 'check' : 'play'}
                        onPress={() => {
                          updateSettings({ modeId: mode.id, timerSeconds: mode.suggestedTimer ?? 0 });
                          nav.goBack();
                        }}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </PressableScale>
          </Animated.View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: -4,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { marginTop: spacing.md, gap: spacing.sm },
  rule: { flexDirection: 'row', gap: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
});
