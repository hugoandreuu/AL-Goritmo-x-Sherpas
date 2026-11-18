"""Pone la voz en off encima del vídeo ya montado, sin volver a renderizar la imagen.
Uso: python3 video/voz_encima.py [entrada.mp4] [salida.mp4]
     (por defecto video/presentacion.mp4 -> video/salida/presentacion_voz.mp4)

- Los tiempos van por bloque del guion (motor.tiempos), así que si cambia la duración de un bloque, la voz le sigue.
- Cada frase (video/voz/*.mp3) se iguala en volumen; la música y los efectos bajan solos mientras habla la voz.
- Al final se normaliza a -14 LUFS y se copia la imagen tal cual.
"""
import os, subprocess, sys
import numpy as np

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import motor

SR = 48000
# (bloque, segundos desde que empieza el bloque, archivo en video/voz/, texto)
VOZ = [
    ('gancho', 0.2, '01.mp3', 'Los Weah pagan 300 dólares al mes de tarjeta. Les preguntamos cuánto se va en intereses.'),
    ('gancho2', 3.5, '02.mp3', 'Son 270 dólares. Ninguno de los dos lo sabía.'),
    ('reto', 0.2, '08.mp3', 'Un plan lleno de cifras se lee una vez… y se olvida.'),
    ('reto', 3.43, '11.mp3', 'Por eso lo convertimos en un quiz de cinco minutos con su propio plan.'),
    ('quiz', 1.5, '12.mp3', 'Primero cuentan qué les quita el sueño.'),
    ('quiz', 3.85, '13.mp3', 'Luego estiman una cifra de su propio plan…'),
    ('quiz', 7.8, '14.mp3', '…y ven el dato real. Ninguna cifra se inventa: todas salen de su plan.'),
    ('quiz', 14.8, '15.mp3', 'Lo que les preocupa va directo al cuaderno del asesor.'),
    ('duo', 0.5, '03.mp3', 'Cada uno contesta en secreto, en el mismo móvil. Luego lo descubren juntos.'),
    ('pareja', 4.5, '04.mp3', 'Creían que su seguro cubría a Liam hasta los 19. Le cubre hasta los 8.'),
    ('pareja', 10.1, '16.mp3', 'Y su nota de salud financiera: 60 sobre 100.'),
    ('camino', 0.3, '17.mp3', 'Después ven su camino hasta la jubilación: cada paso del plan sube su nota.'),
    ('informe', 0.3, '18.mp3', 'Su informe, de lo más urgente a lo que está bien, en tarjetas que se entienden.'),
    ('informe', 6.2, '19.mp3', 'Cada tarjeta se abre entera, con sus cifras y los pasos del plan.'),
    ('ruleta', 0.3, '20.mp3', 'Y todo el plan, de un vistazo, en una ruleta de tarjetas.'),
    ('familias', 0.35, '10.mp3', 'Y funciona con cualquier plan de Sherpas.'),
    ('reunion', 0.25, '05.mp3', 'Su plan de Sherpas, paso a paso: de 60 a 78.'),
    ('reunion', 4.2, '06.mp3', 'Y piden la reunión.'),
    ('asesor', 0.5, '09.mp3', 'Y el asesor llega sabiendo qué creían y qué les preocupa.'),
    ('cierre', 0.5, '07.mp3', 'Vuestro plan de futuro. Del PDF a la conversación.'),
]

def leer(ruta):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', ruta, '-vn', '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(out, np.float32).reshape(-1, 2).copy()

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    entrada = args[0] if args else os.path.join(AQUI, 'presentacion.mp4')
    salida = args[1] if len(args) > 1 else os.path.join(AQUI, 'salida', 'presentacion_voz.mp4')
    os.makedirs(os.path.dirname(salida), exist_ok=True)
    inicio = {b.cfg.get('id'): a for a, _, b in motor.tiempos(motor.bloques())}
    fondo = leer(entrada); N = len(fondo)
    voz = np.zeros((N, 2), np.float32); fin_prev = 0
    for bid, off, archivo, texto in VOZ:
        t0 = inicio[bid] + off
        x = leer(os.path.join(AQUI, 'voz', archivo))
        m = x[:, 0]; x *= 0.13 / (np.sqrt(np.mean(m[np.abs(m) > 0.01] ** 2)) + 1e-9)
        f = int(0.02 * SR); x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
        i = int(t0 * SR)
        if i < fin_prev: print(f'  ¡ojo! {archivo} pisa a la frase anterior ({(fin_prev - i) / SR:.2f} s)')
        x = x[: max(0, N - i)]; voz[i:i + len(x)] += x; fin_prev = i + len(x)
        print(f'  {t0:6.2f}-{(i + len(x)) / SR:6.2f}  {archivo}  {texto}')
    # la música baja con la voz (unos -10 dB), con subida y bajada suaves
    act = (np.abs(voz[:, 0]) > 0.01).astype(np.float32)
    k = int(0.35 * SR); env = np.clip(np.convolve(act, np.ones(k) / k * 6, 'same'), 0, 1)
    k2 = int(0.25 * SR); env = np.convolve(env, np.ones(k2) / k2, 'same')
    mezcla = np.clip(fondo * (1 - 0.68 * env)[:, None] * 0.8 + voz, -1, 1)
    crudo = os.path.join(AQUI, '.trabajo', 'voz_encima.f32'); os.makedirs(os.path.dirname(crudo), exist_ok=True)
    mezcla.astype(np.float32).tofile(crudo)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', entrada, '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', crudo,
                    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR),
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', salida], check=True)
    os.remove(crudo)
    print('Con voz:', salida)

if __name__ == '__main__':
    main()
