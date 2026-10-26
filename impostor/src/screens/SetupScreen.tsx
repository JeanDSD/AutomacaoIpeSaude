import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Icon } from '../components/Icon';
import { PressableScale } from '../components/PressableScale';
import { Screen } from '../components/Screen';
import { SectionTitle } from '../components/SectionTitle';
import { Stepper } from '../components/Stepper';
import { getMode } from '../data/gameModes';
import { resolveSelectedThemes, useThemes } from '../hooks/useThemes';
import { maxImpostors } from '../logic/roundBuilder';
import { startRound } from '../logic/startRound';
import { availableWords } from '../logic/wordPicker';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing } from '../theme/colors';

const TIMER_OPTIONS = [0, 45, 60, 90, 120, 180, 300];

function formatTimer(s: number): string {
  if (s === 0) return 'Sem tempo';
  if (s < 60) return `${s}s`;
  return s % 60 === 0 ? `${s / 60} min` : `${Math.floor(s / 60)}m${s % 60}s`;
}

export function SetupScreen() {
  const nav = useNavigation();
  const players = useAppStore((s) => s.players);
  const settings = useAppStore((s) => s.settings);
  const history = useAppStore((s) => s.history);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const themes = useThemes();
  const mode = getMode(settings.modeId);
  const selectedThemes = resolveSelectedThemes(themes, settings.selectedThemeIds);
  const remaining = selectedThemes.reduce((sum, t) => sum + availableWords(t, history).length, 0);

  const specialCount = (mode.specialRoles ?? []).length;
  const maxImp = Math.max(1, Math.min(maxImpostors(players.length), players.length - 1 - specialCount));
  const minImp = Math.min(mode.minImpostors ?? 1, maxImp);
  const impostors = Math.min(Math.max(settings.impostorCount, minImp), maxImp);
  const impostorLocked = Boolean(mode.randomImpostorCount || mode.inverted);
  const enoughPlayers = players.length >= mode.minPlayers;

  const start = () => {
    if (impostors !== settings.impostorCount) updateSettings({ impostorCount: impostors });
    if (startRound()) nav.navigate('Reveal');
  };

  return (
    <Screen
      title="Nova partida"
      footer={
        <Button
          title={enoughPlayers ? 'COMEÇAR' : `Precisa de ${mode.minPlayers} jogadores`}
          icon="cards-playing"
          size="lg"
          disabled={!enoughPlayers}
          onPress={start}
        />
      }
    >
      <Animated.View entering={FadeInDown.springify()}>
        <SectionTitle right={<Button title="Editar" variant="ghost" size="sm" icon="pencil" onPress={() => nav.navigate('Players')} />}>
          {`Jogadores · ${players.length}`}
        </SectionTitle>
        <View style={styles.avatars}>
          {players.map((p) => (
            <View key={p.id} style={styles.avatarItem}>
              <Avatar name={p.name} color={p.color} size={42} />
              <AppText variant="caption" color={colors.textMuted} numberOfLines={1} style={styles.avatarName}>
                {p.name}
              </AppText>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).springify()}>
        <SectionTitle>Modo de jogo</SectionTitle>
        <PressableScale onPress={() => nav.navigate('Modes')} style={styles.mt}>
          <Card accent={mode.color} style={styles.modeCard}>
            <View style={[styles.modeIcon, { backgroundColor: `${mode.color}26` }]}>
              <Icon name={mode.icon} size={30} color={mode.color} />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading" weight="bold">
                {mode.name}
              </AppText>
              <AppText variant="caption" color={colors.textMuted} numberOfLines={2}>
                {mode.tagline}
              </AppText>
            </View>
            <Icon name="chevron-right" size={26} color={colors.textMuted} />
          </Card>
        </PressableScale>
      </Animated.View>

      {mode.wordSource === 'theme' ? (
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <SectionTitle right={<Button title="Escolher" variant="ghost" size="sm" icon="shape" onPress={() => nav.navigate('ThemeSelect')} />}>
            Temas
          </SectionTitle>
          <View style={styles.chips}>
            {settings.selectedThemeIds.length === 0 ? (
              <Chip label={`Todos os temas (${themes.length})`} selected icon="all-inclusive" />
            ) : (
              selectedThemes.map((t) => <Chip key={t.id} label={t.name} selected color={t.color} icon={t.icon} />)
            )}
          </View>
          <AppText variant="caption" color={remaining < 10 ? colors.warning : colors.textDim} style={styles.mt}>
            {remaining} palavras inéditas disponíveis
          </AppText>
        </Animated.View>
      ) : (
        <Card>
          <AppText variant="body" color={colors.textMuted}>
            Neste modo a palavra secreta é o nome de um dos jogadores. Os temas não são usados.
          </AppText>
        </Card>
      )}

      <Animated.View entering={FadeInDown.delay(180).springify()}>
        <Card style={styles.rowCard}>
          <View style={styles.flex}>
            <AppText variant="heading" weight="bold">
              Impostores
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {impostorLocked
                ? mode.inverted
                  ? 'Este modo não usa impostores'
                  : 'Quantidade secreta e aleatória'
                : `Máximo ${maxImp} para ${players.length} jogadores`}
            </AppText>
          </View>
          <Stepper
            value={impostors}
            min={minImp}
            max={maxImp}
            disabled={impostorLocked}
            onChange={(v) => updateSettings({ impostorCount: v })}
          />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).springify()}>
        <SectionTitle>Cronômetro da discussão</SectionTitle>
        <View style={[styles.chips, styles.mt]}>
          {TIMER_OPTIONS.map((t) => (
            <Chip
              key={t}
              label={formatTimer(t)}
              selected={settings.timerSeconds === t}
              icon={t === 0 ? 'timer-off-outline' : 'timer-outline'}
              color={colors.accent}
              onPress={() => updateSettings({ timerSeconds: t })}
            />
          ))}
        </View>
        {mode.suggestedTimer && settings.timerSeconds === 0 ? (
          <AppText variant="caption" color={colors.textDim} style={styles.mt}>
            Este modo usa {formatTimer(mode.suggestedTimer)} por padrão.
          </AppText>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  mt: { marginTop: spacing.sm },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.sm },
  avatarItem: { alignItems: 'center', width: 58, gap: 4 },
  avatarName: { maxWidth: 58 },
  modeCard: { flexDirection: 'row', alignItems: 'center' },
  modeIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  rowCard: { flexDirection: 'row', alignItems: 'center' },
});
