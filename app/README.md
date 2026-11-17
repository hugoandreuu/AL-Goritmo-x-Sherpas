# Vuestro plan de futuro: la web

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

Si el plan es de dos adultos, la portada pregunta **¿Quién va a ver el plan?**: *Los dos juntos* lleva al modo pareja (abajo) y *Solo el quiz* al recorrido de siempre, que pueden hacer juntos o uno de los dos. Si es de una persona, hay un solo botón, *Empezar*.

1. **Portada.** «Bienvenidos a vuestro plan de futuro», los nombres de la familia y, abajo, el selector de las familias del reto.
2. **Frase puente** y **quiz**: quién va a contestar (si son dos) y qué es lo que más les ronda la cabeza con el dinero (con sus palabras, el micrófono o una frase del estudio). El nivel ("Somos nuevos" o "Sabemos de finanzas", que añade el detalle técnico y el origen de cada cifra) se cambia en Ajustes.
3. **Adivinar y ver.** Las preguntas que el estudio trae para ese caso, ordenadas según lo que dijeron que les preocupa. Tras contestar: "decíais / el plan dice", un titular distinto si acertaron, si el dato es mayor o si es menor, una imagen, la frase para sentirlo y una reacción de un toque. Las dudas que surgen se apuntan en el cuaderno del asesor (arriba). Al final, qué cambiaría en casa con todo resuelto.
4. **Preparando vuestro plan** y **vuestro camino**: la línea de hoy a la jubilación con los hitos del plan; la nota sube con cada paso hasta la que deja el plan completo.
5. **Vuestro informe.** La barra con las paradas del plan arriba; los puntos del informe de lo más urgente a lo que está bien (las cinco áreas con nota, donde se vota cada paso con "¿Os convence?", y el roadmap); y el cierre con pasos aceptados, dudas, la reunión (botón fijo abajo) y la hoja que recibe el asesor. Si vienen del cierre de pareja, el informe no repite la nota ni el contador de pasos. El reparto de preguntas y pasos por tema está en `TEMAS` (`app.js`); qué sección del informe va en cada tema, en [docs/estudios/cobertura.md](../docs/estudios/cobertura.md).
6. **Resumen** (botón de arriba en el informe): la nota y los cinco temas en una ruleta 3D de tarjetas que se gira con el dedo, el ratón, las flechas o el teclado; cada tarjeta se abre a pantalla completa con su detalle.

## Modo pareja: «Vuestro dinero, visto por los dos»

Funciona como el perfil de riesgo de pareja de los asesores: cada uno contesta en privado en el mismo móvil y luego se compara entre sí y con el estudio. No hay ganadores ni "impostores": el objetivo es que la pareja se conozca mejor con el dinero, sin señalar a ninguno. Son 15 pantallas. Mientras contesta uno, el fondo es una malla de puntos de su color (azul o teja; morados si contestan juntos) y la pantalla de pasar el móvil es entera de ese color. La respuesta, lo que veis juntos, es la malla morada. Lo que contestan se contrasta con los **resultados del estudio** (cifras, nota y proyecciones); el **plan** son los pasos a seguir y los objetivos de cada área.

0. **Entrada**: «Vuestro dinero, visto por los dos», unos 4 minutos, en dos pasos: cada uno contesta en privado y luego lo destapan juntos y lo comparan con su estudio.
1. **Turno privado de cada uno**: primero la pregunta abierta del quiz, «¿qué es lo que más te ronda la cabeza con el dinero?», con sus palabras o una frase del estudio (se puede saltar). No se enseña al otro ni a los dos juntos: va solo a la hoja del asesor, con el nombre de cada uno; al guardar, la carta se da la vuelta con candado. Después, el dato de dinero y, en la misma tarjeta de riesgo, qué haría ante la peor caída real de sus inversiones (`investment-analysis`) y qué haría el otro. El dato de dinero es la pregunta con cifra del área que peor va (`areas`; a igualdad, el orden de `frenos`), para no elegir un tema que va bien.
2. **Vuestro dinero**: las dos marcas, la del estudio y, a primera vista, lo que propone el plan (su paso, o lo que recomienda si no es paso).
3. **Vuestro riesgo**: qué haría cada uno, si el otro lo sabía, si encaja con el perfil que indicó en el estudio y qué se revisa con el asesor.
4. **Vuestros hijos** (juntos): hasta qué edad del hijo mayor cubre el seguro de vida (pregunta `vida` pasada a edad con `aBarra`), con el paso del plan y lo que recomienda.
5. **Vuestra nota** (juntos): la adivinan y la revelación enseña el anillo con su marca y las cinco áreas, con la que más baja.
6. **Lo que propone vuestro plan**: todos los pasos con la nota que deja cada uno (`combos`), lo que suma, quién lo hace (y por qué, si no cambia la nota) y cuántos puntos llegan con el asesor; los objetivos de la línea del plan con año e importe; la reunión como única acción principal, con el botón fijo abajo, la fecha confirmada por los dos y la cita al calendario (`.ics` con alarma, su frase y enlace de vuelta). Si hay un primer paso que pueden hacer solos (`primer`), va como "antes de ir", con fecha y una segunda cita a la semana cuyo enlace (`?semana=1`) abre la comprobación del saldo. Lo que recibe el asesor va plegado. La hoja de la reunión dice lo que se verá con el asesor (sus pasos y, si toca, el perfil de riesgo).
7. **Reunión pedida**: al confirmarla sale la fecha, con quién se verá cada paso y, a la vista, lo que el asesor ya sabe de ellos: su frase, lo que creía cada uno del dato de dinero, el seguro de vida, la nota y qué haría cada uno ante una caída. En esa misma hoja pueden escribir, opcional y con tema (coche, casa, imprevistos…), lo que quieren que el asesor les conteste ese día; entra en lo que sabe el asesor y en las preguntas de la cita. Las mismas líneas van en la cita del calendario, y su enlace (`?reunion=1`) vuelve a esta hoja para añadir otra pregunta antes de ir. Si su frase habla de un tema que no es paso del plan (p. ej. la tarjeta en Johnson), entra en la lista de la reunión como "vuestro motivo".

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
