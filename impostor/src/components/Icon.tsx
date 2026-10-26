import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import type { IconName } from '../types';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color = colors.text }: Props) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}
