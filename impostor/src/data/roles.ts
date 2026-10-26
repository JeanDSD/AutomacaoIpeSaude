import { colors } from '../theme/colors';
import type { RoleKind } from '../types';

export const ROLE_NAME: Record<RoleKind, string> = {
  civilian: 'Civil',
  impostor: 'Impostor',
  seer: 'Vidente',
  accomplice: 'Cúmplice',
  jester: 'Bobo da Corte',
  master: 'Mestre',
  sage: 'Sábio',
};

export const ROLE_COLOR: Record<RoleKind, string> = {
  civilian: colors.accent,
  impostor: colors.danger,
  seer: '#C084FC',
  accomplice: '#F97316',
  jester: '#D946EF',
  master: colors.special,
  sage: '#0EA5E9',
};
