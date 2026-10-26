import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, font } from '../theme/colors';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'black';
type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';

interface Props extends TextProps {
  variant?: Variant;
  weight?: Weight;
  color?: string;
  center?: boolean;
}

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontSize: 40, lineHeight: 48, letterSpacing: 1 },
  title: { fontSize: 26, lineHeight: 34 },
  heading: { fontSize: 18, lineHeight: 26 },
  body: { fontSize: 15, lineHeight: 22 },
  caption: { fontSize: 12, lineHeight: 17 },
  label: { fontSize: 11, lineHeight: 15, letterSpacing: 1.6, textTransform: 'uppercase' },
};

const defaultWeight: Record<Variant, Weight> = {
  display: 'black',
  title: 'bold',
  heading: 'semibold',
  body: 'regular',
  caption: 'regular',
  label: 'semibold',
};

export function AppText({ variant = 'body', weight, color, center, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        variantStyle[variant],
        { fontFamily: font[weight ?? defaultWeight[variant]] },
        color ? { color } : null,
        center ? styles.center : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { color: colors.text, includeFontPadding: false },
  center: { textAlign: 'center' },
});
