# Vídeo de presentación

**El vídeo listo para ver está en [`video/presentacion.mp4`](presentacion.mp4)** (1:59, 1920×1080, con voz en off en español). Si lo rehaces, sale sin voz en `video/salida/presentacion.mp4`; ponle la voz con `python3 video/voz_encima.py` y copia `video/salida/presentacion_voz.mp4` aquí para subir la versión nueva.

Vídeo de 2:01 para presentar la web a los asesores de Sherpas. Todo lo que sale en el móvil son grabaciones reales de la web, hechas por un navegador automático. El montaje (textos, posición del móvil, ficha del asesor y música) se genera con código, así que se puede rehacer cuando cambie algo.

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

## Animaciones (versión con barra y pantalla partida)

- **Golpe de realidad:** en el gancho, una barra de 0 a 300 $ con las marcas de lo que creía cada uno y, tras una pausa, la cifra real contando y con un temblor (`barra=` en la parte de `guion.py`).
- **Modo pareja en pantalla partida:** bloque `duo`: dos móviles separados por una línea; al destaparlo se juntan en uno.
- **Dudas que vuelan:** `vuela=` lleva «Me preocupa» del móvil al cuaderno del asesor; en la ficha final cada fila llega volando.
- **Cifras que cuentan:** escribe `{n:60}` o `{n:26-62}` dentro de un texto.
- **Sonido:** `golpe=` en una parte pone un golpe grave (la música se aparta medio segundo antes); las marcas hacen clic y los cambios de móvil, *whoosh*. `motor.py` los apunta en `.trabajo/tiempos.json` y `musica.py` los mezcla.

## Versión final (2:01): la de Alex con los colores de la pareja y las cifras que salen del móvil

- **Intro:** arranca en seco con el móvil de los Weah («¿Cuánto se va en intereses?»), sigue la barra del golpe de realidad con el 270 $ y su temblor, y después una línea con el problema antes del título.
- **Colores de la pareja:** en la pantalla partida, la mitad de Timothy se tiñe de azul y la de Melanie de coral; al juntarse, morado (`tinte=` en las partes de un bloque `movil`, y `tinte_entrada`).
- **La cifra sale del móvil:** `cifra=dict(txt, t, y, antes, sub, color)` saca el dato real de la pantalla y lo deja grande al lado; `{n:19-8}` dentro de `txt` lo hace contar (8 años, 60/100).
- **Ficha del asesor:** las respuestas salen del móvil de la familia (`FICHA_ASESOR['movil']`) y la rellenan una a una.
- **Cierre con QR:** el móvil gira sobre sí mismo y su pantalla pasa a ser el QR de la demo; ya no hay enlace en texto. El QR es `demo-qr.png`; si cambia la URL de `CIERRE['qr']`, se rehace con `pip install qrcode` y `python3 -c "import qrcode; qrcode.make('URL', border=2).save('video/demo-qr.png')"`.

## Voz en off (español)

Voz de Guido en ElevenLabs (eleven-multilingual-v2, ajustes por defecto) acelerada un 8 % con `atempo=1.08`. Las frases están en `video/voz/*.mp3` y su texto y su momento, por bloque del guion, en `VOZ` dentro de `voz_encima.py`. Ese script pone la voz encima del vídeo ya montado sin volver a renderizar la imagen: iguala el volumen de cada frase, baja la música mientras habla y normaliza a −14 LUFS. Si cambia la duración de un bloque en `guion.py`, la voz le sigue sola; si cambia lo que sale en pantalla, revisa que cada frase siga diciendo lo que se ve.

## Si una escena falla al grabar

Suele ser porque ha cambiado el texto de un botón. `tapText(/Texto del botón/)` busca el botón por su texto. Cámbialo en `escenas.js` y vuelve a grabar solo esa escena: `node video/grabar.js pareja`.
