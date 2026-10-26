import { getMode } from '../data/gameModes';
import type { GameEnd, Outcome, RoleKind, Round, RoundPlayer } from '../types';
import { normalize } from '../utils/text';

// Regras do fluxo cíclico: discussão → votação → eliminação → (fim ou nova rodada).
// Tudo aqui é puro para poder ser testado em scripts/check-logic.ts.

/** Quem participa das falas e votações (o Mestre só conduz). */
export function participants(round: Round): RoundPlayer[] {
  return round.players.filter((p) => p.role !== 'master');
}

export function alivePlayers(round: Round): RoundPlayer[] {
  const out = new Set(round.eliminatedIds);
  return participants(round).filter((p) => !out.has(p.player.id));
}

/** Jogadores vivos na ordem de fala: começa em quem abre a rodada e segue o sentido sorteado. */
export function speakingOrder(round: Round): RoundPlayer[] {
  const circle = participants(round);
  const n = circle.length;
  const start = Math.max(0, circle.findIndex((p) => p.player.id === round.starterId));
  const step = round.clockwise ? 1 : -1;
  const out = new Set(round.eliminatedIds);
  const order: RoundPlayer[] = [];
  for (let i = 0; i < n; i++) {
    const p = circle[(((start + step * i) % n) + n) % n];
    if (!out.has(p.player.id)) order.push(p);
  }
  return order;
}

export interface VoteTally {
  /** Votos recebidos por jogador (só quem recebeu algum). */
  counts: Record<string, number>;
  skips: number;
  eliminatedId: string | null;
  reason: 'eliminated' | 'tie' | 'skipped';
}

/**
 * Apura a votação. Cada voto é o id de um jogador ou null ("Pular Voto").
 * Só elimina quem for o único mais votado E tiver estritamente mais votos que os pulos.
 */
export function tallyVotes(votes: readonly (string | null)[]): VoteTally {
  const counts: Record<string, number> = {};
  let skips = 0;
  for (const v of votes) {
    if (v === null) skips++;
    else counts[v] = (counts[v] ?? 0) + 1;
  }
  const top = Math.max(0, ...Object.values(counts));
  const leaders = Object.keys(counts).filter((id) => counts[id] === top);
  if (top === 0 || top < skips) return { counts, skips, eliminatedId: null, reason: 'skipped' };
  if (leaders.length > 1 || top === skips) return { counts, skips, eliminatedId: null, reason: 'tie' };
  return { counts, skips, eliminatedId: leaders[0], reason: 'eliminated' };
}

/** O chute aceita diferenças de acento, caixa, espaço e pontuação. */
export function isCorrectGuess(word: string, guess: string): boolean {
  const clean = (t: string) => normalize(t).replace(/[^\p{L}\p{N}]/gu, '');
  return clean(guess).length > 0 && clean(guess) === clean(word);
}

/** "Arriscar Palavra" só existe quando há impostor tentando descobrir a palavra. */
export function canRiskWord(round: Round): boolean {
  return !getMode(round.modeId).inverted;
}

/**
 * Verifica se a partida acabou. Deve ser chamada com a rodada JÁ atualizada
 * (o eliminado, se houver, já está em eliminatedIds).
 */
export function checkGameEnd(round: Round, ctx: { eliminatedId: string | null; byVote: boolean }): GameEnd | null {
  const mode = getMode(round.modeId);
  const alive = alivePlayers(round);
  const eliminated = ctx.eliminatedId ? round.players.find((p) => p.player.id === ctx.eliminatedId) : undefined;
  const name = eliminated?.player.name ?? '';

  if (eliminated?.role === 'jester' && ctx.byVote) {
    return { outcome: 'jester', reason: `${name} era o Bobo da Corte e conseguiu ser votado!` };
  }

  if (mode.inverted) {
    if (eliminated?.role === 'sage') return { outcome: 'circle', reason: `A roda descobriu o Sábio: ${name}!` };
    if (alive.length <= 2) return { outcome: 'sage', reason: 'Sobraram só dois jogadores e o Sábio não foi descoberto.' };
    return null;
  }

  const totalImpostors = participants(round).filter((p) => p.role === 'impostor').length;
  if (totalImpostors === 0) {
    // Caos Total sem impostores: a primeira votação decide.
    if (!ctx.byVote) return null;
    return eliminated
      ? { outcome: 'noImpostor', reason: `Não havia impostor nenhum… e ${name} foi eliminado à toa!` }
      : { outcome: 'civilians', reason: 'Ninguém foi eliminado — e realmente não havia impostor!' };
  }

  const impostorsAlive = alive.filter((p) => p.role === 'impostor').length;
  if (impostorsAlive === 0) {
    return {
      outcome: 'civilians',
      reason: totalImpostors > 1 ? 'Todos os impostores foram eliminados!' : `${name} era o impostor e foi eliminado!`,
    };
  }

  const team = alive.filter((p) => p.isImpostor).length;
  if (team >= alive.length - team) {
    return { outcome: 'impostor', reason: 'Os impostores igualaram o número de civis vivos.' };
  }
  return null;
}

/** Resultado de "Arriscar Palavra" para quem está com a vez. */
export function resolveWordRisk(
  round: Round,
  playerId: string,
  guess: string,
): { correct: true; end: GameEnd } | { correct: false } {
  const rp = round.players.find((p) => p.player.id === playerId);
  if (rp?.role === 'impostor' && isCorrectGuess(round.word, guess)) {
    return { correct: true, end: { outcome: 'impostor', reason: `${rp.player.name} arriscou e acertou a palavra secreta!` } };
  }
  return { correct: false };
}

/** Quem pontua em cada desfecho. */
export const OUTCOME_POINTS: Record<Outcome, { roles: RoleKind[]; points: number }> = {
  civilians: { roles: ['civilian', 'seer', 'jester'], points: 1 },
  impostor: { roles: ['impostor', 'accomplice'], points: 2 },
  jester: { roles: ['jester'], points: 3 },
  sage: { roles: ['sage'], points: 3 },
  circle: { roles: ['civilian'], points: 1 },
  noImpostor: { roles: [], points: 0 },
};
