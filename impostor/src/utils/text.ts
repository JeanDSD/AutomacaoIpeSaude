/** Normaliza para comparação: minúsculas, sem acentos e espaços extras. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Remove duplicadas (ignorando acentos/caixa) mantendo a primeira ocorrência. */
export function uniqueWords(words: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of words) {
    const word = raw.replace(/\s+/g, ' ').trim();
    const key = normalize(word);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(word);
  }
  return out;
}

/**
 * Converte o texto colado pelo usuário em lista de palavras.
 * Aceita vírgulas, ponto e vírgula, quebras de linha e marcadores ("- ", "• ", "1. ").
 */
export function parseWordList(input: string): string[] {
  const parts = input
    .split(/[,;\n\r\t]+/)
    .map((p) => p.replace(/^\s*(?:[-•*·]|\d+[.)])\s*/, '').replace(/^["'“”]+|["'“”]+$/g, ''));
  return uniqueWords(parts).filter((w) => w.length <= 60);
}

/** Template tag para listas de palavras separadas por vírgula. */
export function w(strings: TemplateStringsArray): string[] {
  return uniqueWords(strings.raw.join('').split(','));
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
