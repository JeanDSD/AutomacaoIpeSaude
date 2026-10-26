// Design tokens do app (Dark Mode).
export const colors = {
  bg: '#0B0B14',
  bgElevated: '#13131F',
  surface: '#1A1A2A',
  surfaceAlt: '#232338',
  border: '#2E2E48',
  text: '#F4F4FB',
  textMuted: '#A3A3C2',
  textDim: '#6C6C8A',
  primary: '#8B5CF6',
  primaryDark: '#6D28D9',
  accent: '#22D3EE',
  danger: '#F43F5E',
  dangerDark: '#9F1239',
  success: '#10B981',
  warning: '#F59E0B',
  special: '#EAB308',
} as const;

export const gradients = {
  primary: ['#8B5CF6', '#6366F1'] as const,
  danger: ['#F43F5E', '#BE123C'] as const,
  success: ['#10B981', '#059669'] as const,
  special: ['#F59E0B', '#D97706'] as const,
  accent: ['#22D3EE', '#0EA5E9'] as const,
  surface: ['#1F1F33', '#15151F'] as const,
  background: ['#120F24', '#0B0B14', '#07070D'] as const,
};

// Paleta usada para identificar cada jogador.
export const playerColors = [
  '#F43F5E', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#14B8A6',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#EC4899',
];

export const radius = { sm: 10, md: 16, lg: 22, xl: 30, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const font = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  black: 'Poppins_800ExtraBold',
} as const;
