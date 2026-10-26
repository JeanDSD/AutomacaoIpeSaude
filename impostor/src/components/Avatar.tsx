import { StyleSheet, View } from 'react-native';

import { AppText } from './AppText';

interface Props {
  name: string;
  color: string;
  size?: number;
}

export function Avatar({ name, color, size = 40 }: Props) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}33`, borderColor: color },
      ]}
    >
      <AppText weight="bold" style={{ fontSize: size * 0.38, lineHeight: size * 0.5 }} color={color}>
        {initials || '?'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
