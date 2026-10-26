#!/usr/bin/env python3
"""Gera os efeitos sonoros sintéticos do app (WAV 16-bit mono 44.1kHz).

Uso: python3 scripts/gen-sounds.py  (grava em assets/sounds/)
Substitua os arquivos por sons próprios se quiser; os nomes devem ser mantidos.
"""
import math
import os
import random
import struct
import wave

RATE = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')


def env(i, n, attack=0.01, release=0.2):
    t = i / RATE
    dur = n / RATE
    a = min(1.0, t / attack) if attack > 0 else 1.0
    r = min(1.0, (dur - t) / release) if release > 0 else 1.0
    return max(0.0, min(a, r))


def tone(freq, dur, vol=0.5, shape='sine', attack=0.005, release=0.1, slide=0.0):
    n = int(RATE * dur)
    out = []
    phase = 0.0
    for i in range(n):
        f = freq + slide * (i / n)
        phase += 2 * math.pi * f / RATE
        if shape == 'sine':
            s = math.sin(phase)
        elif shape == 'square':
            s = 1.0 if math.sin(phase) >= 0 else -1.0
            s *= 0.4
        elif shape == 'tri':
            s = 2 / math.pi * math.asin(math.sin(phase))
        else:
            s = math.sin(phase)
        out.append(s * vol * env(i, n, attack, release))
    return out


def mix(*tracks):
    n = max(len(t) for t in tracks)
    return [sum(t[i] for t in tracks if i < len(t)) for i in range(n)]


def seq(*parts):
    out = []
    for p in parts:
        out.extend(p)
    return out


def silence(dur):
    return [0.0] * int(RATE * dur)


def offset(track, dur):
    return silence(dur) + track


def noise(dur, vol=0.2, release=0.05):
    n = int(RATE * dur)
    return [(random.random() * 2 - 1) * vol * env(i, n, 0.001, release) for i in range(n)]


def save(name, samples):
    os.makedirs(OUT, exist_ok=True)
    peak = max(1e-9, max(abs(s) for s in samples))
    gain = 0.9 / peak if peak > 0.9 else 1.0
    with wave.open(os.path.join(OUT, name), 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s * gain)) * 32767)) for s in samples))


random.seed(7)

# Clique curto e "macio"
save('click.wav', mix(tone(1200, 0.045, 0.35, 'sine', 0.001, 0.04, -500), noise(0.012, 0.08, 0.01)))

# Revelação: arpejo ascendente brilhante
save('reveal.wav', mix(
    tone(523.25, 0.5, 0.3, 'tri', 0.005, 0.4),
    offset(tone(659.25, 0.45, 0.3, 'tri', 0.005, 0.35), 0.07),
    offset(tone(783.99, 0.4, 0.3, 'tri', 0.005, 0.3), 0.14),
    offset(tone(1046.5, 0.45, 0.25, 'sine', 0.005, 0.35), 0.21),
))

# Suspense do impostor: grave dissonante com trêmolo
n = int(RATE * 1.6)
sus = []
for i in range(n):
    t = i / RATE
    trem = 0.6 + 0.4 * math.sin(2 * math.pi * 6 * t)
    s = (math.sin(2 * math.pi * 110 * t) + 0.7 * math.sin(2 * math.pi * 116.5 * t)
         + 0.4 * math.sin(2 * math.pi * 155.6 * t) + 0.25 * math.sin(2 * math.pi * 55 * t))
    sus.append(s * 0.25 * trem * env(i, n, 0.08, 0.6))
save('suspense.wav', sus)

# Vitória: fanfarra maior
save('victory.wav', seq(
    tone(523.25, 0.14, 0.35, 'square', 0.005, 0.05),
    tone(659.25, 0.14, 0.35, 'square', 0.005, 0.05),
    tone(783.99, 0.14, 0.35, 'square', 0.005, 0.05),
    mix(tone(1046.5, 0.7, 0.35, 'square', 0.005, 0.5), tone(783.99, 0.7, 0.2, 'tri', 0.005, 0.5),
        tone(659.25, 0.7, 0.2, 'tri', 0.005, 0.5)),
))

# Derrota: "trombone triste" descendente
save('defeat.wav', seq(
    tone(392.0, 0.32, 0.35, 'tri', 0.01, 0.08, -8),
    tone(369.99, 0.32, 0.35, 'tri', 0.01, 0.08, -8),
    tone(349.23, 0.32, 0.35, 'tri', 0.01, 0.08, -8),
    tone(329.63, 0.9, 0.35, 'tri', 0.01, 0.6, -25),
))

# Passar o celular: "whoosh"
n = int(RATE * 0.35)
wh = []
lp = 0.0
for i in range(n):
    x = i / n
    a = 0.02 + 0.25 * math.sin(math.pi * x)  # filtro abre e fecha
    lp += a * ((random.random() * 2 - 1) - lp)
    wh.append(lp * 0.9 * math.sin(math.pi * x))
save('whoosh.wav', wh)

# Tique do cronômetro
save('tick.wav', tone(1800, 0.03, 0.25, 'sine', 0.001, 0.025))

# Alarme de fim de tempo
save('timeup.wav', seq(*[seq(tone(880, 0.12, 0.35, 'square', 0.002, 0.03), silence(0.06)) for _ in range(4)]))

# Erro / remoção
save('pop.wav', tone(500, 0.08, 0.35, 'sine', 0.001, 0.07, 400))
print('Sons gerados em', os.path.abspath(OUT))
