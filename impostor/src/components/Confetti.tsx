import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

interface Piece {
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  drift: number;
  spin: number;
}

function ConfettiPiece({ piece }: { piece: Piece }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(piece.delay, withTiming(1, { duration: piece.duration, easing: Easing.out(Easing.quad) }));
  }, [piece, t]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - t.value * 0.6,
    transform: [
      { translateX: piece.x + piece.drift * t.value },
      { translateY: -40 + (H + 80) * t.value },
      { rotate: `${piece.spin * t.value}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[styles.piece, { width: piece.size, height: piece.size * 0.45, backgroundColor: piece.color }, style]}
    />
  );
}

/** Chuva de confete para celebrar a vitória. */
export function Confetti({ colors, count = 60 }: { colors: string[]; count?: number }) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }).map(() => ({
        x: Math.random() * W,
        delay: Math.random() * 500,
        duration: 1800 + Math.random() * 1600,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 10,
        drift: (Math.random() - 0.5) * 160,
        spin: (Math.random() - 0.5) * 1080,
      })),
    [colors, count],
  );
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, left: 0, borderRadius: 2 },
});
