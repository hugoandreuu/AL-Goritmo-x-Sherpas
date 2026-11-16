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

Si el plan es de dos adultos, la portada pregunta **¿Quién va a ver el plan?**: *Los dos juntos* (modo pareja) o *Uno de los dos* (el cuestionario de siempre).

Funciona como el perfil de riesgo de pareja de los asesores: cada uno contesta en privado en el mismo móvil y luego se compara entre sí y con el plan. No hay ganadores ni "impostores": el objetivo es que la pareja se conozca mejor con el dinero, sin señalar a ninguno. Son 13 pantallas. Cuando contesta uno, el fondo toma su color (azul o teja); cuando lo veis juntos, vuelve a neutro.

0. **Entrada**: cómo funciona y, opcional, "¿para qué hacéis esto?" (frases del estudio o sus palabras). La frase acompaña al recordatorio del calendario, a la vuelta y a la hoja del asesor.
1. **Turno privado de cada uno**: el dato de dinero y, en la misma tarjeta de riesgo, qué haría ante la peor caída real de sus inversiones (`investment-analysis`) y qué haría el otro. El dato de dinero es la pregunta con cifra del área que peor va (`areas`; a igualdad, el orden de `frenos`), para no elegir un tema que va bien.
2. **Vuestro dinero**: las dos marcas, la del plan y, a primera vista, lo que propone el plan (su paso, o lo que recomienda si no es paso).
3. **Vuestro riesgo**: qué haría cada uno, si el otro lo sabía, si encaja con el perfil que indicó en el plan y qué se revisa con el asesor.
4. **Vuestros hijos** (juntos): hasta qué edad del hijo mayor cubre el seguro de vida (pregunta `vida` pasada a edad con `aBarra`), con el paso del plan y lo que recomienda.
5. **Vuestra nota** (juntos): la adivinan y la revelación enseña el anillo con su marca y las cinco áreas, con la que más baja.
6. **Lo que propone vuestro plan**: todos los pasos con la nota que deja cada uno (`combos`), lo que suma, quién lo hace (y por qué, si no cambia la nota) y cuántos puntos llegan con el asesor; los objetivos de la línea del plan con año e importe; la reunión como única acción principal, con el botón fijo abajo, la fecha confirmada por los dos y la cita al calendario (`.ics` con alarma, su frase y enlace de vuelta). Si hay un primer paso que pueden hacer solos (`primer`), va como "antes de ir", con fecha y una segunda cita a la semana cuyo enlace (`?semana=1`) abre la comprobación del saldo. Lo que recibe el asesor va plegado.

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
