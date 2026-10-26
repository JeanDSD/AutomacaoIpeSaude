import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { playSound } from '../audio/sounds';
import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { DraggableList } from '../components/DraggableList';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { IconButton } from '../components/IconButton';
import { Screen } from '../components/Screen';
import { useNavigation } from '../navigation/Navigator';
import { useAppStore } from '../store/useAppStore';
import { colors, radius, spacing } from '../theme/colors';
import type { Player } from '../types';
import { haptic } from '../utils/haptics';

const ITEM_HEIGHT = 70;

export function PlayersScreen() {
  const nav = useNavigation();
  const players = useAppStore((s) => s.players);
  const scores = useAppStore((s) => s.scores);
  const addPlayer = useAppStore((s) => s.addPlayer);
  const removePlayer = useAppStore((s) => s.removePlayer);
  const renamePlayer = useAppStore((s) => s.renamePlayer);
  const reorderPlayers = useAppStore((s) => s.reorderPlayers);
  const shufflePlayers = useAppStore((s) => s.shufflePlayers);
  const clearPlayers = useAppStore((s) => s.clearPlayers);
  const resetScores = useAppStore((s) => s.resetScores);

  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  const submit = () => {
    if (!name.trim()) return;
    if (addPlayer(name)) {
      playSound('pop');
      haptic('light');
      setName('');
    } else {
      haptic('error');
      Alert.alert('Nome repetido', 'Já existe um jogador com esse nome.');
    }
    inputRef.current?.focus();
  };

  const confirmClear = () =>
    Alert.alert('Remover todos?', 'A lista de jogadores será apagada.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: clearPlayers },
    ]);

  const hasScores = Object.values(scores).some((v) => v > 0);

  const renderItem = useCallback(
    (player: Player, index: number, handle: (child: React.ReactNode) => React.ReactNode) => {
      const editing = editingId === player.id;
      return (
        <View style={styles.row}>
          <AppText variant="caption" color={colors.textDim} style={styles.index}>
            {index + 1}
          </AppText>
          <Avatar name={player.name} color={player.color} size={38} />
          {editing ? (
            <TextInput
              value={editName}
              onChangeText={setEditName}
              autoFocus
              onSubmitEditing={() => {
                renamePlayer(player.id, editName);
                setEditingId(null);
              }}
              onBlur={() => {
                renamePlayer(player.id, editName);
                setEditingId(null);
              }}
              style={[styles.input, styles.editInput]}
              selectionColor={colors.primary}
              maxLength={24}
            />
          ) : (
            <View style={styles.nameCol}>
              <AppText weight="semibold" numberOfLines={1}>
                {player.name}
              </AppText>
              {scores[player.id] ? (
                <AppText variant="caption" color={colors.warning}>
                  {scores[player.id]} pts
                </AppText>
              ) : null}
            </View>
          )}
          <IconButton
            icon="pencil"
            size={36}
            background="transparent"
            color={colors.textMuted}
            onPress={() => {
              setEditingId(player.id);
              setEditName(player.name);
            }}
          />
          <IconButton
            icon="close"
            size={36}
            background="transparent"
            color={colors.danger}
            sound="pop"
            onPress={() => removePlayer(player.id)}
          />
          {handle(
            <View style={styles.handle}>
              <Icon name="drag-horizontal-variant" size={26} color={colors.textMuted} />
            </View>,
          )}
        </View>
      );
    },
    [editingId, editName, removePlayer, renamePlayer, scores],
  );

  return (
    <Screen
      title="Jogadores"
      subtitle={`${players.length} na roda`}
      scroll={false}
      right={<IconButton icon="shuffle-variant" onPress={shufflePlayers} accessibilityLabel="Embaralhar" disabled={players.length < 2} />}
      footer={
        <Button
          title={players.length >= 3 ? 'Continuar' : `Faltam ${3 - players.length} jogador(es)`}
          iconRight="arrow-right"
          disabled={players.length < 3}
          onPress={() => nav.replace('Setup')}
        />
      }
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.addRow}>
          <TextInput
            ref={inputRef}
            value={name}
            onChangeText={setName}
            placeholder="Nome do jogador"
            placeholderTextColor={colors.textDim}
            style={[styles.input, styles.flex]}
            onSubmitEditing={submit}
            returnKeyType="done"
            submitBehavior="submit"
            maxLength={24}
            selectionColor={colors.primary}
          />
          <IconButton icon="plus" onPress={submit} background={colors.primary} size={52} sound={null} />
        </View>

        {players.length > 1 ? (
          <Animated.View entering={FadeIn} style={styles.tip}>
            <Icon name="gesture-swipe-vertical" size={16} color={colors.textDim} />
            <AppText variant="caption" color={colors.textDim}>
              Arraste pela alça (≡) ou segure o cartão para reordenar a roda
            </AppText>
          </Animated.View>
        ) : null}

        <ScrollView
          style={styles.flex}
          scrollEnabled={!dragging}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {players.length === 0 ? (
            <EmptyState icon="account-plus" title="Nenhum jogador ainda" message="Adicione quantos jogadores quiser. A lista fica salva no aparelho." />
          ) : (
            <DraggableList
              data={players}
              keyOf={(p) => p.id}
              itemHeight={ITEM_HEIGHT}
              renderItem={renderItem}
              onReorder={reorderPlayers}
              onDragStateChange={setDragging}
            />
          )}
          {players.length > 0 ? (
            <Animated.View layout={LinearTransition} style={styles.bottomActions}>
              {hasScores ? <Button title="Zerar placar" icon="restart" variant="ghost" size="sm" onPress={resetScores} /> : null}
              <Button title="Remover todos" icon="delete-sweep" variant="ghost" size="sm" onPress={confirmClear} />
            </Animated.View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  addRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.md },
  input: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
  },
  editInput: { flex: 1, height: 42 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  listContent: { paddingBottom: spacing.xl },
  row: {
    flex: 1,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 10,
    paddingRight: 4,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  index: { width: 18, textAlign: 'center' },
  nameCol: { flex: 1 },
  handle: { width: 44, height: 54, alignItems: 'center', justifyContent: 'center' },
  bottomActions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
});
