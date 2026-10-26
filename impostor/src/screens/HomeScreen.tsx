import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AppText } from '../components/AppText';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { PressableScale } from '../components/PressableScale';
import { Screen } from '../components/Screen';
import { getMode } from '../data/gameModes';
import { useThemes } from '../hooks/useThemes';
import { useNavigation, type RouteName } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/colors';
import type { IconName } from '../types';

interface Tile {
  route: RouteName;
  label: string;
  icon: IconName;
  color: string;
  info?: string;
}

export function HomeScreen() {
  const nav = useNavigation();
  const players = useAppStore((s) => s.players);
  const modeId = useAppStore((s) => s.settings.modeId);
  const history = useAppStore((s) => s.history);
  const themes = useThemes();
  const usedCount = Object.values(history).reduce((sum, list) => sum + list.length, 0);

  const tiles: Tile[] = [
    { route: 'Players', label: 'Jogadores', icon: 'account-group', color: colors.accent, info: `${players.length}` },
    { route: 'Modes', label: 'Modos', icon: 'gamepad-variant', color: colors.primary, info: getMode(modeId).name },
    { route: 'Themes', label: 'Temas', icon: 'shape', color: colors.warning, info: `${themes.length}` },
    { route: 'ImportTheme', label: 'Importar', icon: 'file-import', color: colors.success },
    { route: 'History', label: 'Histórico', icon: 'history', color: colors.danger, info: `${usedCount}` },
    { route: 'Settings', label: 'Ajustes', icon: 'cog', color: colors.textMuted },
  ];

  return (
    <Screen showBack={false} contentStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.hero}>
        <Logo size={170} />
        <AppText variant="display" center style={styles.brand}>
          IMPOSTOR
        </AppText>
        <AppText variant="body" color={colors.textMuted} center>
          Todos sabem a palavra. Menos um.
        </AppText>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(150).springify()}>
        <Button
          title="NOVA PARTIDA"
          icon="play"
          size="lg"
          onPress={() => nav.navigate(players.length >= 3 ? 'Setup' : 'Players')}
        />
        {players.length < 3 ? (
          <AppText variant="caption" color={colors.textDim} center style={styles.hint}>
            Adicione pelo menos 3 jogadores para começar
          </AppText>
        ) : null}
      </Animated.View>

      <View style={styles.grid}>
        {tiles.map((tile, i) => (
          <Animated.View key={tile.route} entering={FadeInUp.delay(220 + i * 60).springify()} style={styles.tileWrap}>
            <PressableScale onPress={() => nav.navigate(tile.route)}>
              <LinearGradient colors={['#1D1D30', '#141422']} style={styles.tile}>
                <View style={[styles.tileIcon, { backgroundColor: `${tile.color}22` }]}>
                  <Icon name={tile.icon} size={24} color={tile.color} />
                </View>
                <AppText variant="body" weight="semibold">
                  {tile.label}
                </AppText>
                {tile.info ? (
                  <AppText variant="caption" color={colors.textDim} numberOfLines={1}>
                    {tile.info}
                  </AppText>
                ) : null}
              </LinearGradient>
            </PressableScale>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xl },
  hero: { alignItems: 'center', gap: 6 },
  brand: { marginTop: 4, letterSpacing: 8 },
  hint: { marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  tileWrap: { width: '33.333%', padding: 6 },
  tile: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 6,
    minHeight: 112,
  },
  tileIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
