import type { GameMode, Player, RevealCard, RoleKind, Round, RoundPlayer, SpecialRole, Theme } from '../types';
import { pickRandom, randomInt, shuffle, uid } from '../utils/random';
import { decoys } from './wordPicker';

export interface RoundInput {
  mode: GameMode;
  players: Player[];
  impostorCount: number;
  /** Palavra e tema já sorteados (modos com palavra de tema). */
  picked: { theme: Theme; word: string } | null;
}

export class RoundError extends Error {}

/** Quantidade máxima de impostores para manter o jogo equilibrado. */
export function maxImpostors(playerCount: number): number {
  return Math.max(1, Math.floor((playerCount - 1) / 2));
}

/** Impostores efetivos para o modo, já respeitando os limites. */
export function resolveImpostorCount(mode: GameMode, playerCount: number, requested: number): number {
  const reservedSpecial = (mode.specialRoles ?? []).length;
  const max = Math.max(1, Math.min(maxImpostors(playerCount), playerCount - 1 - reservedSpecial));
  if (mode.inverted) return 0;
  if (mode.randomImpostorCount) return randomInt(Math.floor(playerCount / 2) + 1); // 0..metade
  const min = mode.minImpostors ?? 1;
  return Math.min(Math.max(requested, min), Math.max(min, max));
}

const ROLE_LABEL: Record<SpecialRole, string> = {
  seer: 'VIDENTE',
  accomplice: 'CÚMPLICE',
  jester: 'BOBO DA CORTE',
  master: 'MESTRE DO JOGO',
  sage: 'SÁBIO',
};

function namesList(players: Player[]): string {
  const names = players.map((p) => p.name);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

export function buildRound({ mode, players, impostorCount, picked }: RoundInput): Round {
  if (players.length < mode.minPlayers) {
    throw new RoundError(`O modo ${mode.name} precisa de pelo menos ${mode.minPlayers} jogadores.`);
  }

  // --- Palavra secreta --------------------------------------------------------
  let word: string;
  let themeName: string;
  let theme: Theme | null = null;
  if (mode.wordSource === 'players') {
    word = pickRandom(players).name;
    themeName = 'Quem da Roda';
  } else {
    if (!picked) throw new RoundError('Nenhuma palavra disponível.');
    theme = picked.theme;
    word = picked.word;
    themeName = picked.theme.name;
  }

  // --- Papéis -----------------------------------------------------------------
  const roles = new Map<string, RoleKind>();
  let pool = shuffle(players);

  // O Mestre é sempre o primeiro jogador da roda.
  const specials = mode.specialRoles ?? [];
  if (specials.includes('master')) {
    roles.set(players[0].id, 'master');
    pool = pool.filter((p) => p.id !== players[0].id);
  }

  if (mode.inverted) {
    const sage = pool.shift();
    if (sage) roles.set(sage.id, 'sage');
  } else {
    // Sempre sobra pelo menos um civil além dos papéis especiais.
    const otherSpecials = specials.filter((s) => s !== 'master').length;
    const count = Math.min(
      resolveImpostorCount(mode, players.length, impostorCount),
      Math.max(0, pool.length - 1 - otherSpecials),
    );
    for (const p of pool.splice(0, count)) roles.set(p.id, 'impostor');
  }

  for (const special of specials) {
    if (special === 'master') continue;
    const p = pool.shift();
    if (p) roles.set(p.id, special);
  }
  for (const p of pool) roles.set(p.id, 'civilian');

  const impostors = players.filter((p) => roles.get(p.id) === 'impostor');
  const decoyWord = mode.impostorHint === 'similarWord' && theme ? decoys(theme, word, 1)[0] : undefined;
  const choiceOptions =
    mode.impostorHint === 'multipleChoice' && theme ? shuffle([word, ...decoys(theme, word, 4)]) : undefined;

  const showTheme = !mode.hideThemeFromCivilians && mode.wordSource === 'theme';

  // --- Cartas -----------------------------------------------------------------
  const cardFor = (player: Player, role: RoleKind): RevealCard => {
    const civilSubtitle = showTheme ? `Tema: ${themeName}` : undefined;

    switch (role) {
      case 'impostor': {
        if (mode.impostorHint === 'similarWord' && decoyWord) {
          // O infiltrado acha que é civil.
          return { title: 'SUA PALAVRA', word: decoyWord, subtitle: civilSubtitle, details: [], tone: 'safe', icon: 'card-text' };
        }
        const details: string[] = [];
        let subtitle = 'Descubra a palavra sem ser descoberto!';
        switch (mode.impostorHint) {
          case 'theme':
            subtitle = `Dica: o tema é "${themeName}"`;
            break;
          case 'firstLetter':
            subtitle = `Dica: começa com a letra "${word.charAt(0).toUpperCase()}"`;
            break;
          case 'wordLength': {
            const letters = word.replace(/[^\p{L}]/gu, '').length;
            subtitle = `Dica: ${letters} letras · Tema "${themeName}"`;
            break;
          }
          case 'multipleChoice':
            subtitle = 'A palavra secreta é uma destas:';
            break;
        }
        const partners = impostors.filter((p) => p.id !== player.id);
        if (partners.length > 0) {
          details.push(
            mode.impostorsKnowEachOther
              ? `Seus parceiros: ${namesList(partners)}`
              : 'Existe outro impostor… mas você não sabe quem é.',
          );
        }
        if (specials.includes('jester')) details.push('Cuidado: há um Bobo da Corte querendo ser votado.');
        return {
          title: 'IMPOSTOR',
          subtitle,
          details,
          options: mode.impostorHint === 'multipleChoice' ? choiceOptions : undefined,
          tone: 'danger',
          icon: 'incognito',
        };
      }
      case 'seer':
        return {
          title: ROLE_LABEL.seer,
          word,
          subtitle: civilSubtitle,
          details: [
            impostors.length ? `O impostor é: ${namesList(impostors)}` : 'Não há impostores nesta rodada!',
            'Ajude a roda sem se revelar — os impostores vão caçar você.',
          ],
          tone: 'special',
          icon: 'crystal-ball',
        };
      case 'accomplice':
        return {
          title: ROLE_LABEL.accomplice,
          word,
          subtitle: civilSubtitle,
          details: [
            impostors.length ? `Você ajuda: ${namesList(impostors)}` : 'Não há impostores… improvise!',
            'Você vence se o impostor vencer. Dê dicas que ajudem ele a adivinhar.',
          ],
          tone: 'danger',
          icon: 'handshake',
        };
      case 'jester':
        return {
          title: ROLE_LABEL.jester,
          word,
          subtitle: civilSubtitle,
          details: ['Seu objetivo: ser votado como impostor!', 'Pareça suspeito, mas não demais.'],
          tone: 'special',
          icon: 'emoticon-tongue',
        };
      case 'master':
        return {
          title: ROLE_LABEL.master,
          word,
          subtitle: `Tema: ${themeName}`,
          details: [
            impostors.length ? `Impostor(es): ${namesList(impostors)}` : 'Sem impostores nesta rodada.',
            'Você não joga: conduza a rodada e anuncie o resultado.',
          ],
          tone: 'special',
          icon: 'crown',
        };
      case 'sage':
        return {
          title: ROLE_LABEL.sage,
          word,
          subtitle: `Tema: ${themeName}`,
          details: ['Só você conhece a palavra.', 'Dê dicas sutis e não deixe descobrirem que é você!'],
          tone: 'special',
          icon: 'owl',
        };
      default:
        if (mode.inverted) {
          return {
            title: 'VOCÊ NÃO SABE',
            subtitle: `Tema: ${themeName}`,
            details: ['Só uma pessoa conhece a palavra.', 'Finja que sabe e tente descobrir quem é o Sábio.'],
            tone: 'safe',
            icon: 'help-circle',
          };
        }
        return {
          title: mode.impostorHint === 'similarWord' ? 'SUA PALAVRA' : 'CIVIL',
          word,
          subtitle: civilSubtitle,
          details: [],
          tone: 'safe',
          icon: 'card-text',
        };
    }
  };

  const roundPlayers: RoundPlayer[] = players.map((player) => {
    const role = roles.get(player.id) ?? 'civilian';
    return {
      player,
      role,
      isImpostor: role === 'impostor' || role === 'accomplice',
      card: cardFor(player, role),
    };
  });

  const starters = roundPlayers.filter((rp) => rp.role !== 'master');
  return {
    id: uid('r_'),
    modeId: mode.id,
    themeId: theme?.id ?? null,
    themeName,
    word,
    decoyWord,
    players: roundPlayers,
    starterId: pickRandom(starters).player.id,
    clockwise: Math.random() < 0.5,
    createdAt: Date.now(),
  };
}
