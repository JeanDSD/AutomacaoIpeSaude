import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideInRight, SlideOutLeft, SlideOutRight } from 'react-native-reanimated';

import { colors } from '../theme/colors';

export type RouteName =
  | 'Home'
  | 'Players'
  | 'Setup'
  | 'Modes'
  | 'ThemeSelect'
  | 'Themes'
  | 'ImportTheme'
  | 'ThemeDetail'
  | 'History'
  | 'Settings'
  | 'Reveal'
  | 'Discussion'
  | 'Vote'
  | 'Result';

export interface Route {
  key: string;
  name: RouteName;
  params?: Record<string, string>;
}

type Direction = 'forward' | 'back' | 'fade';

interface NavigationApi {
  route: Route;
  canGoBack: boolean;
  navigate: (name: RouteName, params?: Record<string, string>) => void;
  replace: (name: RouteName, params?: Record<string, string>) => void;
  reset: (name: RouteName, params?: Record<string, string>) => void;
  goBack: () => void;
  /** Intercepta o botão voltar do Android na tela atual. Retorne true para consumir. */
  setBackInterceptor: (fn: (() => boolean) | null) => void;
}

const NavigationContext = createContext<NavigationApi | null>(null);

export function useNavigation(): NavigationApi {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation precisa estar dentro do <Navigator>');
  return ctx;
}

let keySeq = 0;
const makeRoute = (name: RouteName, params?: Record<string, string>): Route => ({
  key: `${name}-${++keySeq}`,
  name,
  params,
});

interface Props {
  initial: RouteName;
  screens: Record<RouteName, () => ReactNode>;
}

/**
 * Navegador em pilha minimalista com transições do Reanimated.
 * Mantém apenas a tela do topo montada; o estado importante vive na store.
 */
export function Navigator({ initial, screens }: Props) {
  const [stack, setStack] = useState<Route[]>(() => [makeRoute(initial)]);
  const [direction, setDirection] = useState<Direction>('fade');
  const interceptor = useRef<(() => boolean) | null>(null);

  const navigate = useCallback((name: RouteName, params?: Record<string, string>) => {
    interceptor.current = null;
    setDirection('forward');
    setStack((s) => [...s, makeRoute(name, params)]);
  }, []);

  const replace = useCallback((name: RouteName, params?: Record<string, string>) => {
    interceptor.current = null;
    setDirection('forward');
    setStack((s) => [...s.slice(0, -1), makeRoute(name, params)]);
  }, []);

  const reset = useCallback((name: RouteName, params?: Record<string, string>) => {
    interceptor.current = null;
    setDirection('fade');
    setStack([makeRoute(name, params)]);
  }, []);

  const goBack = useCallback(() => {
    interceptor.current = null;
    setDirection('back');
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  const setBackInterceptor = useCallback((fn: (() => boolean) | null) => {
    interceptor.current = fn;
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (interceptor.current?.()) return true;
      if (stack.length > 1) {
        goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, goBack]);

  const route = stack[stack.length - 1];
  const api = useMemo<NavigationApi>(
    () => ({ route, canGoBack: stack.length > 1, navigate, replace, reset, goBack, setBackInterceptor }),
    [route, stack.length, navigate, replace, reset, goBack, setBackInterceptor],
  );

  const entering =
    direction === 'forward'
      ? SlideInRight.duration(320).springify().damping(22).mass(0.8)
      : direction === 'back'
        ? SlideInLeft.duration(320).springify().damping(22).mass(0.8)
        : FadeIn.duration(350);
  const exiting =
    direction === 'forward'
      ? SlideOutLeft.duration(260)
      : direction === 'back'
        ? SlideOutRight.duration(260)
        : FadeOut.duration(200);

  const Screen = screens[route.name];

  return (
    <NavigationContext.Provider value={api}>
      <View style={styles.root}>
        <Animated.View key={route.key} style={StyleSheet.absoluteFill} entering={entering} exiting={exiting}>
          <Screen />
        </Animated.View>
      </View>
    </NavigationContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
});
