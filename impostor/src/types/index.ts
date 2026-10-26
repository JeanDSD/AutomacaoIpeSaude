import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface Player {
  id: string;
  name: string;
  color: string;
}

export interface Theme {
  id: string;
  name: string;
  icon: IconName;
  color: string;
  words: string[];
  custom?: boolean;
}

/** Palavras já sorteadas, separadas pelo id do tema. */
export type WordHistory = Record<string, string[]>;

export type Scores = Record<string, number>;

export interface Settings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  impostorCount: number;
  modeId: string;
  /** Lista vazia = todos os temas. */
  selectedThemeIds: string[];
  /** 0 = sem cronômetro. */
  timerSeconds: number;
}

// ---------------------------------------------------------------------------
// Modos de jogo
// ---------------------------------------------------------------------------

/** O que o impostor recebe além de "você é o impostor". */
export type ImpostorHint =
  | 'none'
  | 'theme'
  | 'firstLetter'
  | 'wordLength'
  | 'similarWord'
  | 'multipleChoice';

export type SpecialRole = 'seer' | 'accomplice' | 'jester' | 'master' | 'sage';

export type DiscussionExtra = 'questions' | 'mime' | 'draw' | 'story' | 'sounds' | 'lightning' | null;

export interface GameMode {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: IconName;
  color: string;
  /** De onde vem a palavra secreta. */
  wordSource: 'theme' | 'players';
  impostorHint: ImpostorHint;
  /** Impostores enxergam os parceiros quando há mais de um. */
  impostorsKnowEachOther: boolean;
  /** Os civis não veem o nome do tema. */
  hideThemeFromCivilians?: boolean;
  /** Mínimo de impostores exigido pelo modo. */
  minImpostors?: number;
  /** Sorteia uma quantidade aleatória de impostores (0..máx). */
  randomImpostorCount?: boolean;
  /** Papéis especiais distribuídos entre os civis. */
  specialRoles?: SpecialRole[];
  /** Apenas um jogador conhece a palavra (modo invertido). */
  inverted?: boolean;
  /** Cronômetro sugerido pelo modo (segundos). */
  suggestedTimer?: number;
  /** Se o tempo acabar, o impostor vence. */
  timerIsDeadline?: boolean;
  extra?: DiscussionExtra;
  rules: string[];
  minPlayers: number;
}

// ---------------------------------------------------------------------------
// Rodada
// ---------------------------------------------------------------------------

export type RoleKind = 'civilian' | 'impostor' | SpecialRole;

export type CardTone = 'safe' | 'danger' | 'special';

export interface RevealCard {
  /** Ex.: "CIVIL", "IMPOSTOR", "VIDENTE". */
  title: string;
  /** Palavra em destaque (quando houver). */
  word?: string;
  /** Linha de apoio abaixo da palavra. */
  subtitle?: string;
  /** Linhas extras (dicas, parceiros, objetivos). */
  details: string[];
  /** Opções no modo múltipla escolha. */
  options?: string[];
  tone: CardTone;
  icon: IconName;
}

export interface RoundPlayer {
  player: Player;
  role: RoleKind;
  /** Verdadeiro para quem joga do lado dos impostores. */
  isImpostor: boolean;
  card: RevealCard;
}

export interface Round {
  id: string;
  modeId: string;
  themeId: string | null;
  themeName: string;
  word: string;
  /** Palavra do infiltrado (modo Palavra Parecida). */
  decoyWord?: string;
  players: RoundPlayer[];
  starterId: string;
  clockwise: boolean;
  createdAt: number;
}
