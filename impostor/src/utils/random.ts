/** Inteiro aleatório em [0, max). */
export function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(items.length)];
}

/** Embaralhamento Fisher–Yates (não altera o array original). */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Sorteia `count` itens distintos. */
export function sample<T>(items: readonly T[], count: number): T[] {
  return shuffle(items).slice(0, Math.max(0, count));
}

export function uid(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
