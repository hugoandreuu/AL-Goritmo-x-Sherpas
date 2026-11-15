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

## Modo pareja: «Vuestro dinero, visto por los dos»

Si el plan es de dos adultos, la portada pregunta **¿Quién va a ver el plan?**: *Los dos juntos* (modo pareja) o *Uno de los dos* (el cuestionario de siempre). En la entrada del modo pareja se elige el nivel (nuevos o saben de finanzas), que cambia cómo se cuenta, no las cifras.

Funciona como el perfil de riesgo de pareja de los asesores: cada uno contesta en privado en el mismo móvil y se compara en cuanto termina cada parte. No hay ganadores ni "impostores": el objetivo es que la pareja se conozca mejor con el dinero. Son 13 pantallas y la primera comparación llega en la quinta.

1. **Vuestro dinero** (en privado). Los dos estiman la misma cifra del plan (intereses de la tarjeta, o la primera pregunta numérica). Se ven las dos marcas y la del plan.
2. **Vuestros hijos** (juntos). Hasta qué edad del hijo mayor cubriría el seguro de vida los gastos de casa, con la imagen de los años cubiertos. Sale de la pregunta `vida` del estudio pasada a edad con `aBarra`.
3. **Vuestro riesgo** (en privado). Con la peor caída real de sus inversiones en 3 años (`investment-analysis`), cada uno dice en la misma tarjeta qué haría y qué haría el otro. La comparación enseña también el perfil que indicó cada uno en el plan: "encaja", "más prudente" o "más arriesgado que su perfil".
4. **Lo que habéis descubierto.** Cada tema con lo que propone el plan: su paso (`pasos`, por ejemplo pagar la tarjeta o subir el seguro de vida) o, si no lo tiene, lo que dice la línea del plan. Debajo, el primer paso con fecha: el del plan si la familia lo puede hacer sola (`primer`, con el aviso de "una semana después") o, si no, la reunión con el asesor. Lo que no coincide se apunta solo como pregunta para la reunión y pasa a la hoja del asesor.

Datos del estudio: `pareja.perfiles` (perfil de riesgo de cada uno) y `pareja.caida` (peor caída en 3 años y días hasta recuperarse).

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
