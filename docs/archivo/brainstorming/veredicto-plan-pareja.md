> **Archivo.** Documento de trabajo antiguo: describe una idea o un plan que ya no es el de la app. Lo vigente está en el [README](../../../README.md) y en [docs/brainstorming/decisiones.md](../../brainstorming/decisiones.md).

# Veredicto sobre el plan de Daniel (modo pareja, caso Weah)

Sábado 14 de noviembre de 2026. Revisado: BASES.md v7.2, PLAN-TECNICO, PITCH, PANTALLAS (índice), TAREAS v2, MEDIA_PAGINA, PREGUNTAS-MENTORES y el chat exportado. Comparado con nuestra [idea.md](idea.md) y con los datos de `cases/`.

Las notas que aparecen aquí son estimaciones mías haciendo de jurado, igual que las de los "jurados simulados" del plan de Daniel. Sirven para comparar versiones entre sí, no para predecir la nota real.

## 1. Resumen

El plan de Daniel y nuestra idea son la misma idea de base (adivinar, revelar, solución, un paso con fecha, hoja para el asesor). El suyo la lleva más lejos en tres cosas que mejoran la nota de verdad y que recomiendo adoptar: el caso Weah, la pareja y la comprobación del día 7. Su problema es el tamaño: 17 pantallas, servidor, sesiones, bot de Telegram, IA en directo, interruptor novato/experto, glosario y escalera reordenable, para entregar el miércoles. Sus propios jurados simulados lo dicen dos veces ("sobra un 40 %", "el techo ya no está en las funciones: hay demasiadas").

Propuesta: quedarse con su idea y construir una versión de 8 pantallas sin servidor. Está en el apartado 5.

## 2. Lo que está bien y hay que quedarse

| Qué | Por qué está bien | Comprobado |
|---|---|---|
| Caso principal Weah en vez de Michael | Los datos de los Weah dan mucho más juego. Su plan trae la nota de todas las combinaciones de pasos (60, 62, 73, 78), así que se puede enseñar "qué pasa si hacéis esto antes que aquello" sin inventar nada. En Michael esa lista está vacía y su mejor movimiento es el confuso de 26 a 62. Además la presentación de Sherpas sigue a Timothy y Melanie toda la charla | Sí, en el JSON |
| Primer paso: pagar 6.800 $ de la tarjeta con el efectivo | Se hace en minutos, sin asesor y con dinero que el plan dice que tienen. Arregla dos fugas nuestras: el paso de Michael dependía de un asesor, y no cubríamos a la familia que nunca tendrá reunión | Sí: "Pay $6,800 on the 18% card from cash", nota 60 a 62 |
| Preguntar consecuencias, no datos del formulario | "¿Cuándo acabáis de pagar la tarjeta a este ritmo?" (septiembre de 2039) no lo sabe nadie de memoria. Nuestra pregunta "¿cuánto ahorras de cada 100 $?" la puede contestar quien rellenó el formulario | Sí: `ccPayoffDate` 2039-09 |
| Pareja: cada uno contesta a escondidas y luego se compara | Es lo que más pide Sherpas ("dos personas, dos formas de entenderlo") y lo que menos equipos harán bien. En un solo móvil es barato | Perfiles Growth y Moderate, sí |
| Día 7 pide el saldo, no un "ya lo hice" | Es la única parte del diseño que comprueba que la familia actuó. Responde a "actúan, y vuelven hasta que lo hacen" | Saldo objetivo 11.200 $, sí |
| Botones y chips en vez de deslizador | En el móvil el deslizador es impreciso y su punto medio da pistas. Empezar vacío evita anclar | — |
| Malas noticias con aviso y permiso, y contadas desde los hijos | Coincide con lo que ya teníamos y está mejor resuelto | — |
| La IA no calcula, texto fijo de respaldo, leer los JSON y no el MCP | El token del MCP caduca a las 72 horas. Correcto | — |
| "Vuestro plan propone…" y botón para hablar con una persona | Evita que parezca consejo nuevo. Barato | — |
| Probar con gente de verdad el martes y citar el recuento real | Es el único dato propio que tendremos y cuesta una tarde | — |
| Hoja del asesor en tres bloques: preguntas, miedos y decisiones | Usa las palabras de Sherpas y se lee en diez segundos | — |

## 3. Lo que está mal o sobra

1. **El tamaño.** 43 tareas y 17 pantallas en cuatro días, con cuatro sesiones en paralelo tocando el mismo repo. Lo más probable no es que salga peor, es que el miércoles haya muchas piezas a medias y ninguna demo limpia. Trece rondas de jurado simulado han ido añadiendo piezas para tapar cada crítica, y cada pieza nueva es un sitio más donde puede fallar.

2. **El mensaje de Telegram en mitad del pitch.** Cuesta servidor, bot, respaldo con ntfy, tres claves y depender de la red de la sala. Y lo que demuestra es poco: un bot que escribe al móvil del propio equipo no es cómo le llegaría a una familia. Un jurado atento lo ve como un truco. Sustituto: el recordatorio en el calendario del móvil y abrir "una semana después" desde un selector de día.

3. **El pitch tiene demasiado.** Nueve cambios de pantalla en dos minutos, un jurado manejando un móvil que no conoce en 13 segundos y un mensaje que tiene que llegar justo en el segundo 42. Son dos puntos que pueden fallar en directo. El propio plan propone "pitch de una sola idea" y tiene razón.

4. **El jurado con el móvil en la mano.** Coger el móvil, leer, entender los botones y contestar no son 13 segundos, son 25 o 30. Mejor que el jurado diga el año en voz alta y lo marque quien lleva el móvil.

5. **Las marcas de Timothy y Melanie son inventadas.** Van rotuladas como "respuestas de ejemplo", pero en el momento más importante del pitch la marca real del jurado se compara con dos marcas que hemos escrito nosotros. Alternativa mejor: el jurado hace de Timothy y una persona del equipo (o un segundo jurado) hace de Melanie. Así el modo pareja se enseña con dos respuestas reales.

6. **La escalera reordenable.** Arrastrar, botones de subir y bajar y accesibilidad para enseñar una sola cosa: "sin la tarjeta, aunque hagáis los dos seguros, la nota sigue en 60". Se consigue igual con tres pasos que se marcan y desmarcan. Las ocho combinaciones están en los datos: ninguno 60, tarjeta 62, seguro de vida solo 60, umbrella solo 60, tarjeta y vida 73, tarjeta y umbrella 62, vida y umbrella 60, los tres 78.

7. **Servidor y sesiones.** Quitando Telegram y dejando la IA pregenerada, no hace falta servidor. El estado puede ir en el propio enlace (ya lo tienen previsto con `#st=`). Sin servidor no hay nada que se duerma ni que se caiga en la demo, y se despliega gratis en cualquier sitio.

8. **El día 3 escrito por IA.** Es la única pieza de IA en directo y la que más puede fallar. El día 7 es el que comprueba. Para el MVP basta con el día 7, y decir que los días 3 y 30 están diseñados.

9. **Cifras que son cálculo nuestro.** El contador de "3.240 $ al año" (18 % de 18.000 $) y "el seguro cubre unos 2 años de gastos frente a 12 recomendados" no están en el plan, los calcula la app. Son cuentas sencillas con cifras del plan, pero hay que rotularlas como cálculo propio o preguntarlo a los mentores. El contador de dinero perdido, además, choca con lo que el mismo documento dice de evitar contadores de pérdida.

10. **La tarjeta está a nombre de Timothy.** En los datos, el dueño de la tarjeta es solo él. Revelar delante de su pareja cuánto se equivocó con "su" deuda puede acabar en reproche. Los textos tienen que hablar siempre de "vuestra tarjeta" y de la sorpresa del plan.

11. **El seguro de vida solo no sube la nota.** En los datos, añadir el seguro de vida deja la nota en 60, y el umbrella también. Solo suben después de la tarjeta. Está bien usado en la escalera, pero el ciclo del seguro no puede prometer "esto mejora vuestra nota" por sí solo.

12. **Dos cifras de seguro que no coinciden.** El plan dice 485.000 $ en un sitio y 491.800 $ en otro. Ya lo tienen apuntado: no dar cifra exacta.

## 4. Qué cambia respecto a lo que decidimos el viernes

- El caso principal pasa de Michael a los Weah. Es un cambio de una decisión de Hugo y lo recomiendo.
- El modo pareja vuelve a entrar, en un solo móvil.
- La pregunta inicial vuelve en versión mínima: tres opciones, sin texto libre.
- La entrega del viernes hablaba de Michael y no mencionaba la pareja. Las bases permiten cambiar después. Conviene mandar dos líneas por Discord contando el cambio.

Lo que se mantiene de nuestra idea: una sola línea de solución con el resto plegado, "¿de dónde sale?" en cada cifra, guardar una duda para el asesor, y el recordatorio real en el calendario.

## 5. La versión que recomiendo construir

Ocho pantallas, caso Weah, un móvil, sin servidor.

| # | Pantalla | Qué pasa | De dónde sale |
|---|---|---|---|
| 1 | Quién sois | Juntos o uno solo. "¿Qué os importa más?" con tres opciones | — |
| 2 | Adivinar, por turnos | Cada uno marca en secreto cuándo cree que acaban de pagar la tarjeta. Pantalla de "pásale el móvil" entre los dos | — |
| 3 | Revelación | Las dos marcas y la real: septiembre de 2039. Una línea de solución. Interruptor novato y experto solo aquí | `ccPayoffDate`, 270 $ al mes |
| 4 | Seguro de vida | Aviso y permiso, una cifra, una línea de solución. Una sola versión del texto | Cobertura actual y recomendada |
| 5 | Los pasos | Tres pasos que se marcan y desmarcan. La nota cambia: 60, 62, 73, 78. Se ve que sin la tarjeta no sube | `top_moves`, `combined_moves` |
| 6 | Primer paso | Pagar 6.800 $ de la tarjeta. Día y hora, "cómo se hace" y recordatorio en el calendario | `top_moves[0]` |
| 7 | Una semana después | "¿Cuál es el saldo de la tarjeta ahora?" Con 11.200 $ o menos, la nota pasa a 62. Si no, "¿qué os frena?" | `target_amount` |
| 8 | Hoja del asesor | Preguntas, miedos y decisiones: qué creía cada uno, en qué no coinciden, qué paso eligieron y cuándo | Respuestas de la sesión |

El modo demo para el pitch reutiliza la pantalla 2: el jurado dice un año y hace de uno de los dos.

**Fuera del MVP, se cuenta como diseñado:** mensaje por Telegram o WhatsApp, días 3, 14, 21 y 30, IA en directo, glosario completo, texto libre, dos móviles, inglés, audio.

**Si sobra tiempo, en este orden:** segundo caso cargado con el mismo código (Michael, 20 segundos en el pitch para enseñar que no está hecho solo para los Weah); preguntas elegidas y redactadas por IA con un script previo y verificador de números; glosa de dos términos.

**Pitch de una idea:** el jurado adivina (y una persona del equipo hace de pareja), revelación con las dos marcas, "sin la tarjeta la nota no sube", primer paso con fecha y saldo a la semana, hoja del asesor. Cinco pantallas, sin red.

## 6. Comparación

| Versión | Nota si todo funciona | Riesgo de no llegar o de fallo en directo |
|---|---|---|
| Nuestra idea del viernes (Michael, sin pareja) | 76 a 80 | Bajo |
| Plan de Daniel completo | 83 a 86 | Alto |
| Versión reducida de este documento | 82 a 85 | Bajo |

La versión reducida pierde uno o dos puntos sobre el papel (el mensaje real, el día 3) y gana casi toda la seguridad. Lo que más puede subir la nota a partir de aquí no es añadir pantallas: es el dato propio de la prueba con gente real y que la demo salga limpia.

## 7. Dudas para los mentores

Las seis de PREGUNTAS-MENTORES.md están bien. Añadiría una: si podemos enseñar cuentas sencillas hechas con cifras del plan (interés anual de la tarjeta, años de gastos que cubre el seguro) rotuladas como cálculo propio.
