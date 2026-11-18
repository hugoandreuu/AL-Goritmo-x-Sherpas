# Vídeo de presentación

Vídeo de unos 2 minutos y medio para presentar la web a los asesores de Sherpas. Todo lo que sale en el móvil son grabaciones reales de la web, hechas por un navegador automático. El montaje (textos, posición del móvil, ficha del asesor y música) se genera con código, así que se puede rehacer cuando cambie algo.

## Qué se toca para cambiar algo

| Quiero cambiar… | Archivo | Hace falta volver a grabar |
|---|---|---|
| Un texto, el orden de los bloques, cuánto dura una parte, dónde va el móvil | `guion.py` | No |
| Los datos de la ficha del asesor, el título o el cierre | `guion.py` (`FICHA_ASESOR`, `TITULO`, `CIERRE`) | No |
| Qué se pulsa en la web, qué respuestas se dan, o la web ha cambiado | `escenas.js` | Sí |
| La música | `musica.py` | No |

`motor.py` (el montaje) y `grabar.js` (la grabadora) no hace falta tocarlos.

## Construir

Requisitos: Node 20 o superior, Python 3 con `pillow` y `numpy`, y `ffmpeg`.

```bash
cd video && npm install && npx playwright install chromium && cd ..
pip install pillow numpy

python3 video/construir.py               # graba la web y monta (unos 10 minutos)
python3 video/construir.py --sin-grabar  # solo vuelve a montar, con las grabaciones que ya hay (unos 5 minutos)
python3 video/construir.py --muestras    # un fotograma de cada parte en video/.muestras/, para revisar en segundos
```

El vídeo queda en `video/salida/presentacion.mp4`. Las grabaciones (`.grabaciones/`, unos 800 MB de fotogramas) no se suben al repo.

La grabación arranca la web en local con `scripts/serve.mjs`, así que graba la versión que tengas en tu copia del repo.

## Cómo funciona

1. `grabar.js` abre la web en un móvil de 390×844 y recorre cada escena de `escenas.js`: la pareja Weah, el quiz de Michael, el informe, la ruleta y las portadas de las 4 familias. Guarda cada fotograma con su hora, y `mark('…')` deja marcas con nombre (por ejemplo, `rev_dinero` cuando se destapa el dato de dinero). Cada toque se ve como un círculo. La duración «30 min» de la ventana de la reunión se oculta, porque Sherpas no la ha confirmado.
2. `motor.py` lee `guion.py`. Cada parte de un bloque es un clip, `('escena', 'marca', desde, hasta, velocidad)`, más la posición del móvil (`izq`, `der`, `centro` o coordenadas) y su texto. El texto se coloca solo en el lado libre. El móvil se desliza de una posición a la siguiente. Con `pase=True` hace el gesto de pasar el móvil a la otra persona.
3. `musica.py` sintetiza la música al ritmo de los bloques: un golpe en el título, más ritmo desde el modo pareja y una bajada en la ficha del asesor.
4. `construir.py` lo junta todo con `ffmpeg`.

## Si una escena falla al grabar

Suele ser porque ha cambiado el texto de un botón. `tapText(/Texto del botón/)` busca el botón por su texto. Cámbialo en `escenas.js` y vuelve a grabar solo esa escena: `node video/grabar.js pareja`.
