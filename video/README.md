# Vídeo de presentación

Vídeo de 2:00 para presentar la web a los asesores de Sherpas. Todo lo que sale en el móvil son grabaciones reales de la web, hechas por un navegador automático. El montaje (textos, posición del móvil, ficha del asesor y música) se genera con código, así que se puede rehacer cuando cambie algo.

## Qué se toca para cambiar algo

| Quiero cambiar… | Archivo | Hace falta volver a grabar |
|---|---|---|
| Un texto, el orden de los bloques, cuánto dura una parte, dónde va el móvil | `guion.py` | No |
| Los datos de la ficha del asesor, el título o el cierre | `guion.py` (`FICHA_ASESOR`, `TITULO`, `CIERRE`) | No |
| Qué se pulsa en la web, qué respuestas se dan, o la web ha cambiado | `escenas.js` | Sí |
| La música | `musica.py` | No |
| El logo de Sherpas de la esquina | `sherpas-logo.png` (es `assets/brand/sherpas-logo.svg` en blanco) | No |

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

El vídeo queda en `video/salida/presentacion.mp4`.

**Si ya tienes Chrome instalado** y no quieres bajar el Chromium de Playwright, graba con ese:
`CHROME_PATH="/ruta/a/chrome" python3 video/construir.py` (en Windows, por ejemplo `C:\Program Files\Google\Chrome\Application\chrome.exe`).

**Fuentes:** la primera vez se bajan Poppins e Inter de Google Fonts a `video/.fuentes/`. Si tu red no deja, copia ahí los `.ttf` con el nombre `Poppins-400.ttf`, `Poppins-700.ttf`, `Inter-500.ttf`, etc. Las grabaciones (`.grabaciones/`, unos 800 MB de fotogramas) no se suben al repo.

La grabación arranca la web en local con `scripts/serve.mjs`, así que graba la versión que tengas en tu copia del repo.

## Cómo funciona

1. `grabar.js` abre la web en un móvil de 390×844 y recorre cada escena de `escenas.js`: la pareja Weah, el quiz de Michael, el informe, la ruleta y las portadas de las 4 familias. Guarda cada fotograma con su hora, y `mark('…')` deja marcas con nombre (por ejemplo, `rev_dinero` cuando se destapa el dato de dinero). Cada toque se ve como un círculo. La duración «30 min» de la ventana de la reunión se oculta, porque Sherpas no la ha confirmado.
2. `motor.py` lee `guion.py`. Cada parte de un bloque es un clip, `('escena', 'marca', desde, hasta, velocidad)`, más la posición del móvil (`izq`, `der`, `centro` o coordenadas) y su texto. El texto se coloca solo en el lado libre. El móvil se desliza de una posición a la siguiente. Con `pase=True` hace el gesto de pasar el móvil a la otra persona.
3. `musica.py` sintetiza la música al ritmo de los bloques: un golpe en el título, más ritmo desde el modo pareja y una bajada en la ficha del asesor.
4. `construir.py` lo junta todo con `ffmpeg`.

## Cambios de la versión 2:15 (v3)

- Empieza con el problema (las familias no saben si lo hacen bien ni qué problemas tienen) y el quiz se cuenta como «estimar y ver el dato real», nunca como juego ni «adivinar».
- El modo pareja cuenta sus ventajas: contestan por separado sin influirse y luego ponen en común sus conclusiones.
- El texto secundario va en Poppins fina y más apagada (`estilo()` en `motor.py`), en segundo plano frente a los titulares.
- Logo de Sherpas arriba a la derecha todo el vídeo y una frase de conclusión en el cierre (`CIERRE['frase']`).
- Grabación sin tirones: `grabar.js` mete un píxel que cambia en cada fotograma para que Chrome no deje de mandarlos, y en la ruleta el giro hasta la tarjeta que se abre se ve entero.

## Cambios de la versión 2:00 (v4)

- Recortado a 2:00 y abre directamente con el móvil de la familia Weah (gancho: 300 $ al mes, ¿cuánto son intereses?).
- **Línea de vida** abajo: los capítulos de `CAPITULOS` en `guion.py` se encienden como paradas a medida que avanza el vídeo.
- **El dato sale del móvil**: con `cifra=dict(txt, t, y, antes, sub, color)` en una parte, la cifra real sale de la pantalla y se queda grande junto al texto (270 $, 8 años, 60/100).
- **Colores de la pareja**: `tinte='azul'` (Timothy), `'coral'` (Melanie) o `'morado'` (juntos) tiñe el fondo; con `pase=True` y tinte, el color de Melanie se abre desde el móvil al pasarlo.
- **Ficha del asesor**: las respuestas salen como fichas del móvil de la familia (`FICHA_ASESOR['movil']`) y rellenan la ficha una a una.
- Subtítulos más legibles (Poppins 500, 32 px, más claros).

## Si una escena falla al grabar

Suele ser porque ha cambiado el texto de un botón. `tapText(/Texto del botón/)` busca el botón por su texto. Cámbialo en `escenas.js` y vuelve a grabar solo esa escena: `node video/grabar.js pareja`.
