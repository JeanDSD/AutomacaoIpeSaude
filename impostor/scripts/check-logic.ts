// Verificação rápida da lógica de jogo: npx tsx scripts/check-logic.ts
import assert from 'node:assert/strict';

import { GAME_MODES } from '../src/data/gameModes';
import { BUILT_IN_THEMES } from '../src/data/themes';
import { buildRound } from '../src/logic/roundBuilder';
import { pickWord } from '../src/logic/wordPicker';
import type { Player, WordHistory } from '../src/types';
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
