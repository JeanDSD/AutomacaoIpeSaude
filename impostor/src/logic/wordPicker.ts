import type { Theme, WordHistory } from '../types';
import { pickRandom, randomInt, sample } from '../utils/random';

export interface PickedWord {
  theme: Theme;
  word: string;
}

/** Palavras do tema que ainda não foram sorteadas. */
export function availableWords(theme: Theme, history: WordHistory): string[] {
  const used = new Set(history[theme.id] ?? []);
  return theme.words.filter((w) => !used.has(w));
}

/**
 * Sorteia uma palavra inédita entre os temas informados.
 * O tema é escolhido com peso proporcional às palavras restantes, para que
 * temas grandes não sejam esgotados rápido demais nem temas pequenos dominem.
 * Retorna `null` quando todas as palavras já foram usadas.
 */
export function pickWord(themes: Theme[], history: WordHistory): PickedWord | null {
  const pools = themes
    .map((theme) => ({ theme, words: availableWords(theme, history) }))
    .filter((p) => p.words.length > 0);
  if (pools.length === 0) return null;

  const total = pools.reduce((sum, p) => sum + p.words.length, 0);
  let ticket = randomInt(total);
  for (const pool of pools) {
    if (ticket < pool.words.length) return { theme: pool.theme, word: pool.words[ticket] };
    ticket -= pool.words.length;
  }
  const last = pools[pools.length - 1];
  return { theme: last.theme, word: pickRandom(last.words) };
}

/** Outras palavras do mesmo tema (usadas como iscas). Não marca no histórico. */
export function decoys(theme: Theme, word: string, count: number): string[] {
  return sample(theme.words.filter((w) => w !== word), count);
}
