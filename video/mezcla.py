"""Mezcla la música con la voz en off y los efectos de sonido.
Uso: python3 video/mezcla.py   (lee .trabajo/musica.wav y .trabajo/voz.json, que escriben musica.py y motor.py; deja .trabajo/mezcla.wav)

- La voz (video/voz/*.mp3) se iguala en volumen frase a frase.
- La música baja sola mientras habla la voz.
- Un barrido de aire en cada cambio de bloque y un golpe grave en cada «golpe» de cámara del guion.
- Al final se normaliza a -14 LUFS con ffmpeg.
"""
import json, os, subprocess, wave
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
TR = os.path.join(AQUI, '.trabajo')
SR = 48000
V = json.load(open(os.path.join(TR, 'voz.json')))

def leer(ruta):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', ruta, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(out, np.float32).reshape(-1, 2).copy()

musica = leer(os.path.join(TR, 'musica.wav'))
N = len(musica)
voz = np.zeros((N, 2), np.float32)
for t0, archivo in V['voz']:
    x = leer(os.path.join(AQUI, 'voz', archivo))
    m = x[:, 0]; rms = np.sqrt(np.mean(m[np.abs(m) > 0.01] ** 2)) + 1e-9
    x *= 0.13 / rms
    f = int(0.02 * SR); x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
    i = int(t0 * SR); x = x[: max(0, N - i)]; voz[i:i + len(x)] += x

# la música baja con la voz (unos -12 dB), con subida y bajada suaves
act = (np.abs(voz[:, 0]) > 0.01).astype(np.float32)
k = int(0.35 * SR); env = np.clip(np.convolve(act, np.ones(k) / k * 6, 'same'), 0, 1)
k2 = int(0.25 * SR); env = np.convolve(env, np.ones(k2) / k2, 'same')
# el golpe del título sobresalía unos 5 dB: se baja la música 3 dB en ese bloque
tit = np.ones(N, np.float32); i0, i1 = int((V['bloques'][2] - 0.1) * SR), int((V['bloques'][3] + 0.3) * SR); r = int(0.15 * SR)
tit[i0:i1] = 0.7; tit[i0 - r:i0] = np.linspace(1, 0.7, r); tit[i1:i1 + r] = np.linspace(0.7, 1, r)
musica = musica * tit[:, None]
mezcla = 0.7 * musica * (1 - 0.7 * env)[:, None] + voz  # música sin voz unos 3 dB más baja que antes

rng = np.random.default_rng(3)
def barrido(d=0.42):
    n = int(d * SR); x = rng.standard_normal(n); y = 0.0; o = np.zeros(n)
    corte = np.concatenate([np.linspace(300, 4500, n // 2), np.linspace(4500, 300, n - n // 2)])
    a = 1 - np.exp(-2 * np.pi * corte / SR)
    for j in range(n): y += a[j] * (x[j] - y); o[j] = y
    return (o * np.sin(np.linspace(0, np.pi, n)) ** 2 * 0.16).astype(np.float32)
def grave(d=0.6):
    t = np.arange(int(d * SR)) / SR; f = 38 + 60 * np.exp(-t * 18)
    return (np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 6) * 0.32).astype(np.float32)
B, G2 = barrido(), grave()
def poner(sig, t):
    i = int(t * SR)
    if 0 <= i < N: j = min(N, i + len(sig)); mezcla[i:j] += sig[: j - i, None]
for t in V['bloques'][1:]: poner(B, t - 0.2)
for t in V['golpes']: poner(G2, t)

mezcla = np.clip(mezcla, -1, 1)
crudo = os.path.join(TR, 'mezcla_cruda.wav')
with wave.open(crudo, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mezcla * 32767).astype(np.int16).tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', crudo, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), os.path.join(TR, 'mezcla.wav')], check=True)
print('Mezcla:', os.path.join(TR, 'mezcla.wav'))
