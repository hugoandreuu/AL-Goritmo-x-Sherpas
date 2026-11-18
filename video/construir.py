"""Construye el vídeo de presentación de principio a fin.

    python3 video/construir.py               graba la web, monta el vídeo y le pone música
    python3 video/construir.py --sin-grabar  reutiliza las grabaciones (para cambiar solo textos u orden del guion)
    python3 video/construir.py --muestras    solo saca un fotograma por parte en video/.muestras/ para revisar

Resultado: video/salida/presentacion.mp4
"""
import os, subprocess, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
def run(*cmd): print('>', ' '.join(cmd)); subprocess.run(cmd, check=True)

os.makedirs(os.path.join(AQUI, '.trabajo'), exist_ok=True)
os.makedirs(os.path.join(AQUI, 'salida'), exist_ok=True)
if '--sin-grabar' not in sys.argv and '--muestras' not in sys.argv:
    run('node', os.path.join(AQUI, 'grabar.js'))
if '--muestras' in sys.argv:
    run(sys.executable, os.path.join(AQUI, 'motor.py'), '--muestras'); sys.exit()
sin_audio = os.path.join(AQUI, '.trabajo', 'video_sin_audio.mp4')
run(sys.executable, os.path.join(AQUI, 'motor.py'), sin_audio)
run(sys.executable, os.path.join(AQUI, 'musica.py'))
run(sys.executable, os.path.join(AQUI, 'mezcla.py'))
salida = os.path.join(AQUI, 'salida', 'presentacion.mp4')
run('ffmpeg', '-y', '-loglevel', 'error', '-i', sin_audio, '-i', os.path.join(AQUI, '.trabajo', 'mezcla.wav'),
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', salida)
print('Listo:', salida)
