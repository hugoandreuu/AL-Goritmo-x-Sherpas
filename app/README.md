# Vuestro plan en 5 minutos (MVP)

Web estática, sin frameworks ni dependencias. Pinta el **estudio** de un caso: `estudios/<caso>.json`. En `app.js` no hay ninguna cifra del plan escrita a mano.

## Arrancar

Desde la raíz del repo: `npm start` y abrir http://localhost:8000. Para la versión de un solo archivo: `npm run build` y abrir `dist/plan.html`. Más detalle en el [README principal](../README.md).

## De dónde sale cada cosa

| Qué | Quién lo pone | Dónde |
|---|---|---|
| Cifras, fechas, pasos, nota y combinaciones | El plan de Sherpas, leído por código (MCP o `cases/`) | `scripts/estudio.mjs`, función `leer` |
| Qué preguntas se hacen y en qué orden | El LLM de Sherpas, a partir de la persona y el resumen del plan | campo `preguntas` del estudio |
| La pregunta con sus palabras, la frase para sentir el dato, lo que "le importa" y las dudas para el asesor | El LLM de Sherpas | `q`, `siente`, `frases`, `ganancias`, `abiertas`, `lectura` |
| Titulares de cada camino (acertó, era más, era menos) y a qué paso del plan lleva cada dato | Código, con el plan delante: son lógica, y un titular con el sentido cambiado engaña | `titulares`, `salida` |
| Control | Código: toda cifra de una frase tiene que estar en los hechos de esa pregunta; si no, se queda la frase de plantilla | función `controlar` |
| Imágenes, calendario, línea de vida | La app | `app.js`, `styles.css` |

Las pocas cuentas propias (por ejemplo, años de gastos que cubre el seguro) las hace el código, nunca el LLM, y la pantalla las marca como "Cuenta nuestra con cifras de vuestro plan".

## Flujo

1. **Portada.** Nombre de la familia y selector de caso de ejemplo.
2. **Quién mira, qué importa y nivel.** "Somos nuevos" o "Sabemos de finanzas" (añade el bloque técnico y el origen de cada cifra).
3. **Adivinar y ver.** De 3 a 5 preguntas, las que el estudio trae para ese caso. Tras contestar: "decíais / el plan dice", un titular distinto si acertó, si el dato es mayor o si es menor, una imagen, la frase para sentirlo, la salida y una reacción de un toque.
4. **Recorrido.** La foto (nota y sus cinco áreas), los dos frenos, los pasos con interruptores y la nota que da el plan, la línea de hoy a la jubilación, el primer paso con calendario (solo si el primer paso del plan lo puede hacer la familia sola) y la reunión.
5. **Plan completo.** Hoja de ruta con "¿Os convence?", reunión, lo que creían frente al plan y la hoja para el asesor.

## Modo pareja: «El impostor del dinero»

Si el plan es de dos adultos, la portada abre dos apartados: **En pareja** (el juego) e **Individual** (el cuestionario de siempre, contestando uno de los dos).

El juego toma la mecánica del Impostor: un solo móvil, cada uno contesta en secreto, pantalla de "pásale el móvil" y revelación al final de cada ronda.

1. **Ronda del dinero.** Los dos adivinan la misma cifra del plan (los intereses de la tarjeta, o la primera pregunta numérica). Se ven las dos marcas y la del plan en una línea.
2. **Ronda del riesgo.** Con la peor caída real de sus inversiones en 3 años (`investment-analysis`), cada uno dice qué haría, qué cree que haría el otro y quién marcó el perfil más atrevido en el plan.
3. **Desenmascarar.** Se dan la vuelta las cartas: perfil que marcó cada uno en el plan frente a lo que haría en el juego. Si se separan 1,5 escalones o más, sale el sello de "Impostor".
4. **Mapa de pareja.** Aciertos sobre el otro (de 4), escala de riesgo con el plan y el juego, y salida al plan o a pedir reunión. Todo pasa a la hoja del asesor.

Todo sale del estudio: `pareja.perfiles` (perfil de riesgo de cada uno) y `pareja.caida` (peor caída en 3 años y días hasta recuperarse).

## Preguntar al asesor

Lo primero es escribir la pregunta y ponerle tema (coche, casa, imprevistos, tarjeta, seguros, hijos, jubilación u otra cosa; solo salen los temas que existen en ese plan). Al elegir tema aparecen, como mucho, dos cosas que el plan ya responde. Lo que el plan no responde queda apuntado para la reunión.

## La nota al marcar pasos

Solo se enseñan notas que trae el plan: la de cada paso y las combinaciones de `score.combined_moves`. Si el plan no da una combinación, la app enseña la mejor nota que sí da y lo dice. No se inventa ninguna.

## Archivos

- `index.html`, `styles.css`, `app.js`: la app.
- `estudios/index.json` y `estudios/<caso>.json`: lo que pinta la app.
- `estudios/llm/<caso>.json`: la respuesta del LLM tal cual, para poder regenerar sin clave.
- `../scripts/estudio.mjs`: genera los estudios. `../scripts/build.mjs`: genera `dist/plan.html` y la web de Pages.
- `../docs/estudios/<caso>.md`: el estudio en limpio, para leerlo.
