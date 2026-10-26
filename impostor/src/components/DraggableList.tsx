import { useEffect, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptic } from '../utils/haptics';

type Positions = Record<string, number>;

interface Props<T> {
  data: T[];
  keyOf: (item: T) => string;
  itemHeight: number;
  /** Renderiza o item. `handle` deve envolver a "alça" de arrasto. */
  renderItem: (item: T, index: number, handle: (child: ReactNode) => ReactNode) => ReactNode;
  onReorder: (from: number, to: number) => void;
  onDragStateChange?: (dragging: boolean) => void;
}

const SPRING = { damping: 20, stiffness: 220, mass: 0.7 };

function toPositions(keys: string[]): Positions {
  'worklet';
  const out: Positions = {};
  keys.forEach((k, i) => {
    out[k] = i;
  });
  return out;
}

/**
 * Lista reordenável por arrastar e soltar.
 * - Segure e arraste a alça (≡) para mover imediatamente;
 * - ou faça um toque longo em qualquer parte do cartão.
 */
export function DraggableList<T>({ data, keyOf, itemHeight, renderItem, onReorder, onDragStateChange }: Props<T>) {
  const keys = useMemo(() => data.map(keyOf), [data, keyOf]);
  const positions = useSharedValue<Positions>(toPositions(keys));
  const activeKey = useSharedValue<string | null>(null);

  // Sempre que a ordem "oficial" muda (store), sincroniza as posições.
  useEffect(() => {
    positions.value = toPositions(keys);
  }, [keys, positions]);

  return (
    <View style={{ height: keys.length * itemHeight }}>
      {data.map((item, index) => {
        const key = keys[index];
        return (
          <DraggableItem
            key={key}
            id={key}
            index={index}
            count={keys.length}
            itemHeight={itemHeight}
            positions={positions}
            activeKey={activeKey}
            onReorder={onReorder}
            onDragStateChange={onDragStateChange}
            render={(handle) => renderItem(item, index, handle)}
          />
        );
      })}
    </View>
  );
}

interface ItemProps {
  id: string;
  index: number;
  count: number;
  itemHeight: number;
  positions: SharedValue<Positions>;
  activeKey: SharedValue<string | null>;
  onReorder: (from: number, to: number) => void;
  onDragStateChange?: (dragging: boolean) => void;
  render: (handle: (child: ReactNode) => ReactNode) => ReactNode;
}

function DraggableItem({ id, index, count, itemHeight, positions, activeKey, onReorder, onDragStateChange, render }: ItemProps) {
  const top = useSharedValue(index * itemHeight);
  const startTop = useSharedValue(0);
  const startIndex = useSharedValue(0);
  const lift = useSharedValue(0);

  // Itens que não estão sendo arrastados deslizam para a nova posição.
  useAnimatedReaction(
    () => positions.value[id],
    (pos, prev) => {
      if (pos === undefined || pos === prev) return;
      if (activeKey.value !== id) top.value = withSpring(pos * itemHeight, SPRING);
    },
  );

  const startDrag = () => {
    onDragStateChange?.(true);
    haptic('medium');
  };
  const endDrag = (from: number, to: number) => {
    onDragStateChange?.(false);
    haptic('light');
    if (from !== to) onReorder(from, to);
  };
  const swapHaptic = () => haptic('selection');

  const makePan = (longPress: boolean) => {
    const pan = Gesture.Pan()
      .onStart(() => {
        activeKey.value = id;
        startTop.value = top.value;
        startIndex.value = positions.value[id];
        lift.value = withTiming(1, { duration: 150 });
        scheduleOnRN(startDrag);
      })
      .onUpdate((e) => {
        const maxTop = (count - 1) * itemHeight;
        const next = Math.min(Math.max(startTop.value + e.translationY, 0), maxTop);
        top.value = next;
        const newIndex = Math.min(Math.max(Math.round(next / itemHeight), 0), count - 1);
        const current = positions.value[id];
        if (newIndex !== current) {
          // Move o item ativo e desloca os vizinhos.
          const updated: Positions = { ...positions.value };
          for (const key of Object.keys(updated)) {
            const p = updated[key];
            if (key === id) continue;
            if (current < newIndex && p > current && p <= newIndex) updated[key] = p - 1;
            if (current > newIndex && p < current && p >= newIndex) updated[key] = p + 1;
          }
          updated[id] = newIndex;
          positions.value = updated;
          scheduleOnRN(swapHaptic);
        }
      })
      .onFinalize(() => {
        if (activeKey.value !== id) return;
        const finalIndex = positions.value[id];
        top.value = withSpring(finalIndex * itemHeight, SPRING);
        lift.value = withTiming(0, { duration: 200 });
        activeKey.value = null;
        scheduleOnRN(endDrag, startIndex.value, finalIndex);
      });
    return longPress ? pan.activateAfterLongPress(260) : pan.minDistance(0);
  };

  const handleGesture = useMemo(() => makePan(false), [count, itemHeight]); // eslint-disable-line react-hooks/exhaustive-deps
  const rowGesture = useMemo(() => makePan(true), [count, itemHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => ({
    top: top.value,
    zIndex: activeKey.value === id ? 100 : 1,
    elevation: lift.value * 12,
    transform: [{ scale: 1 + lift.value * 0.04 }],
    opacity: 1 - lift.value * 0.05,
  }));

  const handle = (child: ReactNode) => (
    <GestureDetector gesture={handleGesture}>
      <View hitSlop={8}>{child}</View>
    </GestureDetector>
  );

  return (
    <Animated.View style={[styles.item, { height: itemHeight }, style]} entering={FadeIn.duration(250)}>
      <GestureDetector gesture={rowGesture}>
        <View style={styles.fill}>{render(handle)}</View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: { position: 'absolute', left: 0, right: 0 },
  fill: { flex: 1 },
});
