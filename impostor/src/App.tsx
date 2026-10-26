import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { Poppins_700Bold } from '@expo-google-fonts/poppins/700Bold';
import { Poppins_800ExtraBold } from '@expo-google-fonts/poppins/800ExtraBold';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initSounds } from './audio/sounds';
import { Navigator, type RouteName } from './navigation/Navigator';
import { DiscussionScreen } from './screens/DiscussionScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ImportThemeScreen } from './screens/ImportThemeScreen';
import { ModesScreen } from './screens/ModesScreen';
import { PlayersScreen } from './screens/PlayersScreen';
import { ResultScreen } from './screens/ResultScreen';
import { RevealScreen } from './screens/RevealScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SetupScreen } from './screens/SetupScreen';
import { ThemeDetailScreen } from './screens/ThemeDetailScreen';
import { ThemeSelectScreen } from './screens/ThemeSelectScreen';
import { ThemesScreen } from './screens/ThemesScreen';
import { useAppStore } from './store/useAppStore';
import { colors } from './theme/colors';

const screens: Record<RouteName, () => React.ReactNode> = {
  Home: HomeScreen,
  Players: PlayersScreen,
  Setup: SetupScreen,
  Modes: ModesScreen,
  ThemeSelect: ThemeSelectScreen,
  Themes: ThemesScreen,
  ThemeDetail: ThemeDetailScreen,
  ImportTheme: ImportThemeScreen,
  History: HistoryScreen,
  Settings: SettingsScreen,
  Reveal: RevealScreen,
  Discussion: DiscussionScreen,
  Result: ResultScreen,
};

/** Aguarda o AsyncStorage carregar os dados salvos. */
function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAppStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });
  const hydrated = useHydrated();

  useEffect(() => {
    initSounds().catch(() => undefined);
  }, []);

  const ready = (fontsLoaded || fontError) && hydrated;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {ready ? (
          <Navigator initial="Home" screens={screens} />
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
