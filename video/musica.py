"""Música de fondo sintetizada (sin derechos de terceros). Se ajusta sola a la duración y a los bloques del guion.
Uso: python3 video/musica.py   (lee .trabajo/tiempos.json, que escribe motor.py; deja .trabajo/musica.wav)
"""
import numpy as np, wave, sys, os, json
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import guion as G
TL = json.load(open(os.path.join(AQUI, '.trabajo', 'tiempos.json')))
SR = 44100
DUR = TL['total'] + 0.1
N = int(SR * DUR)
BPM = 100; BEAT = 60 / BPM; BAR = BEAT * 4
B = TL['bloques']
T_TITLE, T_LIFT, T_BREAK, T_END = (B[G.MUSICA[k]] for k in ('golpe', 'subida', 'pausa', 'final'))
T_ARP = B.get('reto', T_TITLE) + 6
rng = np.random.default_rng(7)
L = np.zeros(N); Rr = np.zeros(N)

def midi(m): return 440 * 2 ** ((m - 69) / 12)
def add(buf, start, sig, gain=1.0):
    i = int(start * SR)
    if i >= N: return
    j = min(N, i + len(sig)); buf[i:j] += sig[: j - i] * gain
def lp(x, a):  # one-pole lowpass
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y

CHORDS = [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 55, 59]]  # Cmaj7 Am7 Fmaj7 G
def chord_at(t): return CHORDS[int(t // BAR) % 4]

# pad (whole track)
def pad_note(f, dur):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(t)
    for det in (-0.12, 0.0, 0.11):
        ff = f * 2 ** (det / 12)
        for h in range(1, 7): s += np.sin(2 * np.pi * ff * h * t + h) / h ** 1.6
    env = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.8)
    return s * env
nbars = int(DUR / BAR) + 1
for b in range(nbars):
    t0 = b * BAR
    for m in chord_at(t0 + 0.01):
        sig = pad_note(midi(m + 12), BAR + 0.8) * 0.035
        add(L, t0, sig, 1.0 if m % 2 else 0.8); add(Rr, t0, sig, 0.8 if m % 2 else 1.0)

kick_env = np.zeros(N)
def kick(t0, g=1.0):
    t = np.arange(int(0.35 * SR)) / SR
    f = 45 + 80 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 9) * g * 0.55
    add(L, t0, s); add(Rr, t0, s)
    e = np.exp(-t * 7); i = int(t0 * SR); j = min(N, i + len(e)); kick_env[i:j] = np.maximum(kick_env[i:j], e[: j - i])
def hat(t0, g=1.0, pan=0.6):
    n = int(0.06 * SR); x = rng.standard_normal(n)
    x = x - lp(x, 0.35); x *= np.exp(-np.arange(n) / SR * 70) * 0.06 * g
    add(L, t0, x, 1 - pan * 0.5); add(Rr, t0, x, 0.5 + pan * 0.5)
def clap(t0, g=1.0):
    n = int(0.18 * SR); x = rng.standard_normal(n); x = lp(x, 0.25) - lp(x, 0.04)
    x *= np.exp(-np.arange(n) / SR * 22) * 0.12 * g
    add(L, t0, x); add(Rr, t0, x)
def bass(t0, m, dur, g=1.0):
    t = np.arange(int(dur * SR)) / SR; f = midi(m)
    s = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.minimum(1, t / 0.01) * np.exp(-t * 3.5) * 0.22 * g
    add(L, t0, s); add(Rr, t0, s)
def pluck(t0, m, g=1.0, pan=0.0):
    t = np.arange(int(0.5 * SR)) / SR; f = midi(m)
    s = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 9) * np.minimum(1, t / 0.004) * 0.06 * g
    for k, (dl, dg) in enumerate([(0, 1), (BEAT * 0.75, 0.35), (BEAT * 1.5, 0.15)]):
        add(L, t0 + dl, s, dg * (1 - pan if k % 2 == 0 else 1 + pan) * 0.8)
        add(Rr, t0 + dl, s, dg * (1 + pan if k % 2 == 0 else 1 - pan) * 0.8)

# hook: soft ticking pulse + pluck motif
t = 0.0
while t < T_TITLE - 0.1:
    hat(t, 0.5, -0.3); t += BEAT / 2
for k, m in enumerate([72, 76, 79, 76, 72, 76, 79, 83]):
    pluck(1.2 + k * BEAT * 0.9, m, 0.9, 0.3 if k % 2 else -0.3)
# riser + impact
rs = int(1.5 * SR); x = rng.standard_normal(rs); x = x - lp(x, 0.08); x *= np.linspace(0, 1, rs) ** 2 * 0.12
add(L, T_TITLE - 1.5, x); add(Rr, T_TITLE - 1.5, x)
tt = np.arange(int(2.5 * SR)) / SR
boom = np.sin(2 * np.pi * (38 + 40 * np.exp(-tt * 6)) * tt) * np.exp(-tt * 1.6) * 0.6
add(L, T_TITLE, boom); add(Rr, T_TITLE, boom)

# groove
t = T_TITLE
step = BEAT / 4
i = 0
while t < T_END:
    in_break = T_BREAK <= t < T_END
    beat_pos = i % 16
    ch = chord_at(t + 0.01)
    if beat_pos % 4 == 0 and not in_break: kick(t, 0.9 if t > T_LIFT else 0.7)
    if in_break and beat_pos == 0: kick(t, 0.5)
    if beat_pos in (4, 12) and t > T_LIFT and not in_break: clap(t, 0.8)
    if beat_pos % 4 == 2: hat(t, 1.0 if not in_break else 0.5, 0.5)
    if beat_pos % 2 == 1 and t > T_LIFT and not in_break: hat(t, 0.45, -0.5)
    if beat_pos % 2 == 0: bass(t, ch[0] - 12, BEAT / 2, 1.0 if beat_pos % 4 == 0 else 0.6)
    if t > T_ARP:
        arp = [ch[1] + 24, ch[2] + 24, ch[3] + 24, ch[2] + 24]
        if beat_pos % 2 == 0 or t > T_LIFT:
            pluck(t, arp[(i // (1 if t > T_LIFT else 2)) % 4], 0.8 if not in_break else 0.6, 0.4 if i % 2 else -0.4)
    t += step; i += 1
# ending chord swell
for m in [48, 55, 59, 64, 67]:
    sig = pad_note(midi(m + 12), 6.0) * 0.05
    add(L, T_END, sig); add(Rr, T_END, sig)
kick(T_END, 0.6)

# sidechain-ish duck
duck = 1 - 0.35 * kick_env
L *= duck; Rr *= duck
# gentle master fade
fade = np.ones(N); fi = int(0.5 * SR); fade[:fi] = np.linspace(0, 1, fi)
fo = int(4 * SR); fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
L *= fade; Rr *= fade
# pausa antes de cada golpe: la música se aparta medio segundo y vuelve
EF = TL.get('efectos', [])
g = np.ones(N)
for te, k in EF:
    if k != 'golpe': continue
    a, b, c = int((te - 0.5) * SR), int(te * SR), int((te + 0.35) * SR)
    a = max(0, a); c = min(N, c)
    if b <= a or b >= N: continue
    g[a:b] = np.minimum(g[a:b], np.linspace(1, 0.4, b - a)); g[b:c] = np.minimum(g[b:c], np.linspace(0.4, 1, c - b))
L *= g; Rr *= g
pk = max(np.abs(L).max(), np.abs(Rr).max())
L, Rr = L / pk * 0.85, Rr / pk * 0.85
# efectos de sonido
EL = np.zeros(N); ER = np.zeros(N)
def efecto(te, k):
    if k == 'golpe':
        t = np.arange(int(0.7 * SR)) / SR
        x = np.sin(2 * np.pi * (52 + 70 * np.exp(-t * 30)) * t) * np.exp(-t * 6) * 0.55
        n = rng.standard_normal(len(t)); n = lp(n, 0.2) * np.exp(-t * 40) * 0.15
        add(EL, te, x + n); add(ER, te, x + n)
    elif k == 'tick':
        t = np.arange(int(0.08 * SR)) / SR
        x = (np.sin(2 * np.pi * 1650 * t) + 0.4 * np.sin(2 * np.pi * 2480 * t)) * np.exp(-t * 70) * 0.11
        add(EL, te, x); add(ER, te, x)
    elif k == 'whoosh':
        n = int(0.5 * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
        x = lp(x, 0.16) - lp(x, 0.02); x *= np.sin(np.pi * t / t[-1]) ** 2 * 0.22
        add(EL, te - 0.15, x * np.linspace(1.2, 0.6, n)); add(ER, te - 0.15, x * np.linspace(0.6, 1.2, n))
for te, k in EF: efecto(te, k)
L += EL; Rr += ER
out = np.stack([L, Rr], 1)
out = np.tanh(out * 1.2) / np.tanh(1.2)
with wave.open(os.path.join(AQUI, '.trabajo', 'musica.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32000).astype(np.int16).tobytes())
print('ok')
