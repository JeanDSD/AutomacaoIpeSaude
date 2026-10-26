import { useMemo } from 'react';

import { BUILT_IN_THEMES } from '../data/themes';
import { useAppStore } from '../store/useAppStore';
import type { Theme } from '../types';

/** Temas embutidos + temas importados pelo usuário. */
export function useThemes(): Theme[] {
  const customThemes = useAppStore((s) => s.customThemes);
  return useMemo(() => [...BUILT_IN_THEMES, ...customThemes], [customThemes]);
}

export function getAllThemes(): Theme[] {
  return [...BUILT_IN_THEMES, ...useAppStore.getState().customThemes];
}

/** Temas escolhidos para a partida (lista vazia = todos). */
export function resolveSelectedThemes(all: Theme[], selectedIds: string[]): Theme[] {
  if (selectedIds.length === 0) return all;
  const chosen = all.filter((t) => selectedIds.includes(t.id));
  return chosen.length ? chosen : all;
}
