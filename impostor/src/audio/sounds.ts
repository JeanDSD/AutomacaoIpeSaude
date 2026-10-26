import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { useAppStore } from '../store/useAppStore';

// Efeitos sintéticos gerados por scripts/gen-sounds.py.
// Para trocar um som, substitua o arquivo em assets/sounds mantendo o nome.
const SOURCES = {
  click: require('../../assets/sounds/click.wav'),
  reveal: require('../../assets/sounds/reveal.wav'),
  suspense: require('../../assets/sounds/suspense.wav'),
  victory: require('../../assets/sounds/victory.wav'),
  defeat: require('../../assets/sounds/defeat.wav'),
  whoosh: require('../../assets/sounds/whoosh.wav'),
  tick: require('../../assets/sounds/tick.wav'),
  timeup: require('../../assets/sounds/timeup.wav'),
  pop: require('../../assets/sounds/pop.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

const VOLUME: Partial<Record<SoundName, number>> = { click: 0.5, tick: 0.4, whoosh: 0.7 };

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let ready = false;

export async function initSounds(): Promise<void> {
  if (ready) return;
  ready = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch {
    // Sem permissão para alterar o modo de áudio: segue com o padrão do sistema.
  }
  for (const name of Object.keys(SOURCES) as SoundName[]) {
    try {
      const player = createAudioPlayer(SOURCES[name]);
      player.volume = VOLUME[name] ?? 1;
      players[name] = player;
    } catch {
      // Um som que falha ao carregar não deve derrubar o app.
    }
  }
}

export function playSound(name: SoundName): void {
  if (!useAppStore.getState().settings.soundEnabled) return;
  const player = players[name];
  if (!player) return;
  try {
    player.seekTo(0).catch(() => undefined);
    player.play();
  } catch {
    // ignora falhas pontuais de reprodução
  }
}

export function stopSound(name: SoundName): void {
  const player = players[name];
  if (!player) return;
  try {
    player.pause();
  } catch {
    // ignora
  }
}
