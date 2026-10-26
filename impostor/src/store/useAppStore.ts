import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { playerColors } from '../theme/colors';
import type { Player, Round, Scores, Settings, Theme, WordHistory } from '../types';
import { uid } from '../utils/random';
import { normalize, uniqueWords } from '../utils/text';

interface AppState {
  players: Player[];
  customThemes: Theme[];
  history: WordHistory;
  scores: Scores;
  settings: Settings;
  /** Rodada em andamento (não persistida). */
  round: Round | null;

  // Jogadores
  addPlayer: (name: string) => boolean;
  renamePlayer: (id: string, name: string) => void;
  removePlayer: (id: string) => void;
  reorderPlayers: (from: number, to: number) => void;
  shufflePlayers: () => void;
  clearPlayers: () => void;

  // Temas personalizados
  saveCustomTheme: (name: string, words: string[]) => { theme: Theme; added: number };
  deleteCustomTheme: (id: string) => void;

  // Histórico
  markWordUsed: (themeId: string, word: string) => void;
  unmarkWord: (themeId: string, word: string) => void;
  clearThemeHistory: (themeId: string) => void;
  clearAllHistory: () => void;

  // Placar
  addPoints: (playerIds: string[], points: number) => void;
  resetScores: () => void;

  updateSettings: (patch: Partial<Settings>) => void;
  setRound: (round: Round | null) => void;
}

export const defaultSettings: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  impostorCount: 1,
  modeId: 'classic',
  selectedThemeIds: [],
  timerSeconds: 0,
};

const customThemeIcons = ['star-four-points', 'cards', 'lightbulb-on', 'rocket-launch', 'crown', 'heart'] as const;
const customThemeColors = ['#EC4899', '#22D3EE', '#F59E0B', '#84CC16', '#A78BFA', '#FB7185'];

function nextPlayerColor(players: Player[]): string {
  const used = new Set(players.map((p) => p.color));
  return playerColors.find((c) => !used.has(c)) ?? playerColors[players.length % playerColors.length];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      players: [],
      customThemes: [],
      history: {},
      scores: {},
      settings: defaultSettings,
      round: null,

      addPlayer: (rawName) => {
        const name = rawName.replace(/\s+/g, ' ').trim();
        if (!name) return false;
        const { players } = get();
        if (players.some((p) => normalize(p.name) === normalize(name))) return false;
        set({ players: [...players, { id: uid('p_'), name, color: nextPlayerColor(players) }] });
        return true;
      },

      renamePlayer: (id, rawName) => {
        const name = rawName.replace(/\s+/g, ' ').trim();
        if (!name) return;
        set({ players: get().players.map((p) => (p.id === id ? { ...p, name } : p)) });
      },

      removePlayer: (id) => set({ players: get().players.filter((p) => p.id !== id) }),

      reorderPlayers: (from, to) => {
        const players = [...get().players];
        if (from === to || from < 0 || to < 0 || from >= players.length || to >= players.length) return;
        const [moved] = players.splice(from, 1);
        players.splice(to, 0, moved);
        set({ players });
      },

      shufflePlayers: () => {
        const players = [...get().players];
        for (let i = players.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [players[i], players[j]] = [players[j], players[i]];
        }
        set({ players });
      },

      clearPlayers: () => set({ players: [] }),

      saveCustomTheme: (rawName, words) => {
        const name = rawName.replace(/\s+/g, ' ').trim();
        const themes = get().customThemes;
        const existing = themes.find((t) => normalize(t.name) === normalize(name));
        if (existing) {
          const merged = uniqueWords([...existing.words, ...words]);
          const theme = { ...existing, words: merged };
          set({ customThemes: themes.map((t) => (t.id === existing.id ? theme : t)) });
          return { theme, added: merged.length - existing.words.length };
        }
        const index = themes.length;
        const theme: Theme = {
          id: uid('custom_'),
          name,
          icon: customThemeIcons[index % customThemeIcons.length],
          color: customThemeColors[index % customThemeColors.length],
          words: uniqueWords(words),
          custom: true,
        };
        set({ customThemes: [...themes, theme] });
        return { theme, added: theme.words.length };
      },

      deleteCustomTheme: (id) => {
        const { [id]: _removed, ...history } = get().history;
        const settings = get().settings;
        set({
          customThemes: get().customThemes.filter((t) => t.id !== id),
          history,
          settings: { ...settings, selectedThemeIds: settings.selectedThemeIds.filter((t) => t !== id) },
        });
      },

      markWordUsed: (themeId, word) => {
        const history = get().history;
        const used = history[themeId] ?? [];
        if (used.includes(word)) return;
        set({ history: { ...history, [themeId]: [...used, word] } });
      },

      unmarkWord: (themeId, word) => {
        const history = get().history;
        const used = (history[themeId] ?? []).filter((w) => w !== word);
        set({ history: { ...history, [themeId]: used } });
      },

      clearThemeHistory: (themeId) => {
        const { [themeId]: _removed, ...history } = get().history;
        set({ history });
      },

      clearAllHistory: () => set({ history: {} }),

      addPoints: (playerIds, points) => {
        const scores = { ...get().scores };
        for (const id of playerIds) scores[id] = (scores[id] ?? 0) + points;
        set({ scores });
      },

      resetScores: () => set({ scores: {} }),

      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

      setRound: (round) => set({ round }),
    }),
    {
      name: 'impostor-app-v1',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // A rodada atual é efêmera; todo o resto é salvo no aparelho.
      partialize: ({ players, customThemes, history, scores, settings }) => ({
        players,
        customThemes,
        history,
        scores,
        settings,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...saved,
          settings: { ...defaultSettings, ...(saved.settings ?? {}) },
        };
      },
    },
  ),
);
