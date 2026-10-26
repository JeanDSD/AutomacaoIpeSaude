// Verificação rápida da lógica de jogo: npx tsx scripts/check-logic.ts
import assert from 'node:assert/strict';

import { GAME_MODES } from '../src/data/gameModes';
import { BUILT_IN_THEMES } from '../src/data/themes';
import { alivePlayers, checkGameEnd, isCorrectGuess, resolveWordRisk, speakingOrder, tallyVotes } from '../src/logic/game';
import { buildRound } from '../src/logic/roundBuilder';
import { pickWord } from '../src/logic/wordPicker';
import type { Player, Round, WordHistory } from '../src/types';
import { parseWordList } from '../src/utils/text';

const players: Player[] = Array.from({ length: 7 }, (_, i) => ({ id: `p${i}`, name: `Jogador ${i + 1}`, color: '#fff' }));

// Temas
const ids = new Set<string>();
let total = 0;
for (const t of BUILT_IN_THEMES) {
  assert.ok(!ids.has(t.id), `id duplicado: ${t.id}`);
  ids.add(t.id);
  assert.ok(t.words.length >= 80, `${t.name} tem poucas palavras (${t.words.length})`);
  assert.ok(t.words.every((w) => w.length > 0 && !w.includes('\n')), `${t.name} tem palavra inválida`);
  total += t.words.length;
}
console.log(`${BUILT_IN_THEMES.length} temas, ${total} palavras`);
console.log(BUILT_IN_THEMES.map((t) => `${t.name}: ${t.words.length}`).join(' | '));

// Sorteio sem repetição até esgotar
const small = [{ ...BUILT_IN_THEMES[0], words: BUILT_IN_THEMES[0].words.slice(0, 30) }];
const history: WordHistory = {};
const seen = new Set<string>();
for (let i = 0; i < 30; i++) {
  const p = pickWord(small, history);
  assert.ok(p, 'deveria haver palavra');
  assert.ok(!seen.has(p!.word), `repetiu ${p!.word}`);
  seen.add(p!.word);
  history[p!.theme.id] = [...(history[p!.theme.id] ?? []), p!.word];
}
assert.equal(pickWord(small, history), null, 'deveria esgotar');
console.log('Sorteio sem repetição: OK');

// Todos os modos
for (const mode of GAME_MODES) {
  for (let n = mode.minPlayers; n <= 7; n++) {
    for (let k = 0; k < 40; k++) {
      const ps = players.slice(0, n);
      const picked = mode.wordSource === 'theme' ? pickWord(BUILT_IN_THEMES, {}) : null;
      const r = buildRound({ mode, players: ps, impostorCount: 2, picked });
      assert.equal(r.players.length, n);
      const imp = r.players.filter((p) => p.role === 'impostor').length;
      const civ = r.players.filter((p) => p.role === 'civilian').length;
      if (!mode.inverted && !mode.randomImpostorCount) assert.ok(imp >= 1, `${mode.id}: sem impostor`);
      if (mode.minImpostors) assert.ok(imp >= Math.min(mode.minImpostors, n), `${mode.id}: impostores < mínimo`);
      assert.ok(civ >= 1 || mode.inverted, `${mode.id} n=${n}: nenhum civil`);
      for (const s of mode.specialRoles ?? []) assert.ok(r.players.some((p) => p.role === s), `${mode.id}: falta ${s}`);
      if (mode.inverted) assert.equal(r.players.filter((p) => p.role === 'sage').length, 1);
      if (mode.wordSource === 'players') assert.ok(ps.some((p) => p.name === r.word));
      // Impostor nunca vê a palavra real
      for (const p of r.players.filter((x) => x.role === 'impostor')) {
        assert.notEqual(p.card.word, r.word, `${mode.id}: impostor viu a palavra`);
        if (p.card.options) assert.ok(p.card.options.includes(r.word));
      }
      if (mode.impostorHint === 'similarWord') assert.ok(r.decoyWord && r.decoyWord !== r.word);
      if (r.players.find((p) => p.role === 'master')) assert.equal(r.players[0].role, 'master');
      assert.notEqual(r.players.find((p) => p.player.id === r.starterId)?.role, 'master');
    }
  }
}
console.log(`${GAME_MODES.length} modos: OK`);

// Parser de importação
assert.deepEqual(parseWordList('Pizza, Sushi;  Lasanha\n- Coxinha\n2. Pastel\npizza\n\n'), ['Pizza', 'Sushi', 'Lasanha', 'Coxinha', 'Pastel']);
console.log('Parser de importação: OK');

// Votação: só elimina o único mais votado com mais votos que os pulos
assert.deepEqual(tallyVotes(['a', 'a', 'b', null]).eliminatedId, 'a');
assert.equal(tallyVotes(['a', 'a', 'b', 'b']).reason, 'tie');
assert.equal(tallyVotes(['a', 'a', null, null]).reason, 'tie');
assert.equal(tallyVotes(['a', null, null]).reason, 'skipped');
assert.equal(tallyVotes([null, null]).reason, 'skipped');
assert.equal(tallyVotes([]).eliminatedId, null);
assert.equal(tallyVotes(['a', 'a', 'b', 'b', null, null, null]).reason, 'skipped');
console.log('Votação: OK');

// Chute da palavra
assert.ok(isCorrectGuess('Guarda-chuva', '  guarda chuva '));
assert.ok(isCorrectGuess('Pão de Queijo', 'pao de queijo'));
assert.ok(!isCorrectGuess('Pizza', ''));
assert.ok(!isCorrectGuess('Pizza', 'Pizzaria'));

// Fluxo cíclico no Clássico com 5 jogadores e 1 impostor
const classic = GAME_MODES.find((m) => m.id === 'classic')!;
const base = buildRound({ mode: classic, players: players.slice(0, 5), impostorCount: 1, picked: pickWord(BUILT_IN_THEMES, {}) });
const imp = base.players.find((p) => p.role === 'impostor')!;
const civs = base.players.filter((p) => p.role === 'civilian');
const out = (r: Round, id: string): Round => ({ ...r, eliminatedIds: [...r.eliminatedIds, id] });
assert.equal(speakingOrder(base).length, 5);
assert.equal(speakingOrder(base)[0].player.id, base.starterId);
assert.equal(checkGameEnd(base, { eliminatedId: null, byVote: true }), null, 'pular não encerra');
assert.equal(checkGameEnd(out(base, imp.player.id), { eliminatedId: imp.player.id, byVote: true })?.outcome, 'civilians');
let r = out(base, civs[0].player.id);
assert.equal(checkGameEnd(r, { eliminatedId: civs[0].player.id, byVote: true }), null, '1x3 continua');
assert.ok(!speakingOrder(r).some((p) => p.player.id === civs[0].player.id), 'eliminado não fala');
r = out(r, civs[1].player.id);
assert.equal(checkGameEnd(r, { eliminatedId: civs[1].player.id, byVote: true }), null, '1x2 continua');
r = out(r, civs[2].player.id);
assert.equal(checkGameEnd(r, { eliminatedId: civs[2].player.id, byVote: true })?.outcome, 'impostor', '1x1 impostor vence');
assert.equal(alivePlayers(r).length, 2);

// Arriscar Palavra: só o impostor que acerta vence
assert.equal(resolveWordRisk(base, imp.player.id, base.word).correct, true);
assert.equal(resolveWordRisk(base, imp.player.id, base.word + 'x').correct, false);
assert.equal(resolveWordRisk(base, civs[0].player.id, base.word).correct, false);
assert.equal(checkGameEnd(out(base, imp.player.id), { eliminatedId: imp.player.id, byVote: false })?.outcome, 'civilians');

// Bobo votado vence; Sábio descoberto perde; Caos sem impostor
const jesterRound = buildRound({ mode: GAME_MODES.find((m) => m.id === 'jester')!, players, impostorCount: 1, picked: pickWord(BUILT_IN_THEMES, {}) });
const jester = jesterRound.players.find((p) => p.role === 'jester')!;
assert.equal(checkGameEnd(out(jesterRound, jester.player.id), { eliminatedId: jester.player.id, byVote: true })?.outcome, 'jester');
const sageRound = buildRound({ mode: GAME_MODES.find((m) => m.id === 'sage')!, players: players.slice(0, 4), impostorCount: 1, picked: pickWord(BUILT_IN_THEMES, {}) });
const sage = sageRound.players.find((p) => p.role === 'sage')!;
const other = sageRound.players.find((p) => p.role !== 'sage')!;
assert.equal(checkGameEnd(out(sageRound, sage.player.id), { eliminatedId: sage.player.id, byVote: true })?.outcome, 'circle');
const sage3 = out(sageRound, other.player.id);
assert.equal(checkGameEnd(sage3, { eliminatedId: other.player.id, byVote: true }), null);
const other2 = sage3.players.find((p) => p.role !== 'sage' && !sage3.eliminatedIds.includes(p.player.id))!;
assert.equal(checkGameEnd(out(sage3, other2.player.id), { eliminatedId: other2.player.id, byVote: true })?.outcome, 'sage');
const noImp: Round = { ...base, players: base.players.map((p) => ({ ...p, role: 'civilian', isImpostor: false })) };
assert.equal(checkGameEnd(noImp, { eliminatedId: null, byVote: true })?.outcome, 'civilians');
assert.equal(checkGameEnd(out(noImp, civs[0].player.id), { eliminatedId: civs[0].player.id, byVote: true })?.outcome, 'noImpostor');
const masterRound = buildRound({ mode: GAME_MODES.find((m) => m.id === 'master')!, players: players.slice(0, 5), impostorCount: 1, picked: pickWord(BUILT_IN_THEMES, {}) });
assert.ok(!speakingOrder(masterRound).some((p) => p.role === 'master'), 'Mestre não fala nem vota');
console.log('Fluxo de rodadas: OK');
