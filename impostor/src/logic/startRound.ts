import { Alert } from 'react-native';

import { getMode } from '../data/gameModes';
import { getAllThemes, resolveSelectedThemes } from '../hooks/useThemes';
import { useAppStore } from '../store/useAppStore';
import { buildRound, RoundError } from './roundBuilder';
import { pickWord } from './wordPicker';

/**
 * Sorteia a palavra, monta a rodada e registra a palavra no histórico.
 * Retorna true se a rodada foi criada.
 */
export function startRound(): boolean {
  const state = useAppStore.getState();
  const mode = getMode(state.settings.modeId);
  const themes = resolveSelectedThemes(getAllThemes(), state.settings.selectedThemeIds);

  if (state.players.length < mode.minPlayers) {
    Alert.alert('Jogadores insuficientes', `O modo "${mode.name}" precisa de pelo menos ${mode.minPlayers} jogadores.`);
    return false;
  }

  let picked = null;
  if (mode.wordSource === 'theme') {
    picked = pickWord(themes, state.history);
    if (!picked) {
      Alert.alert(
        'Palavras esgotadas',
        'Todas as palavras dos temas selecionados já foram sorteadas. Libere palavras no Histórico ou escolha outros temas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Liberar tudo destes temas',
            style: 'destructive',
            onPress: () => themes.forEach((t) => useAppStore.getState().clearThemeHistory(t.id)),
          },
        ],
      );
      return false;
    }
  }

  try {
    const round = buildRound({ mode, players: state.players, impostorCount: state.settings.impostorCount, picked });
    if (picked) state.markWordUsed(picked.theme.id, picked.word);
    state.setRound(round);
    return true;
  } catch (e) {
    Alert.alert('Não foi possível iniciar', e instanceof RoundError ? e.message : String(e));
    return false;
  }
}
