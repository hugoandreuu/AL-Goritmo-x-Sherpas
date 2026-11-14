# Vuestro plan en 5 minutos (MVP, caso Weah)

Web estática que cuenta el plan de Timothy y Melanie Weah según cómo quiere entenderlo cada persona. Sin frameworks, sin servidor propio, sin cuentas ni servicios externos. Todas las cifras salen de `cases/timothy-melanie-weah/*.json`; ninguna IA calcula nada.

## Arrancar

Desde la raíz del repo: `npm start` y abrir http://localhost:8000. Para la versión de un solo archivo: `npm run build` y abrir `dist/plan-weah.html`. Más detalle en el [README principal](../README.md).

Atajos: `?reset` empieza de cero; `?demo=plan&f=image&d=why&t=calm&l=pro` abre la presentación directamente (`f` = numbers|image|story, `d` = quick|why, `t` = calm|full, `l` = new|pro).

## Flujo

1. **Portada:** "Bienvenidos a vuestro plan a futuro". Dice qué va a pasar (primero preguntamos, después enseñamos, al final deciden) y que el asesor verá las respuestas.
2. **Quién sois:** quién mira el plan, qué les importa más y **cómo se manejan con las finanzas** ("Somos nuevos en esto" o "Sabemos de finanzas").
3. **Adivinar (5 preguntas):** coste anual de la tarjeta, año en que se acaba, lo que da el efectivo, qué cubre el seguro de vida y si llegan a la jubilación. Cada respuesta se compara con la cifra del plan. La seguridad ("Seguro / Lo dudo / Ni idea") es opcional.
4. **Embudo de personalización**, intercalado (nunca se muestran etiquetas tipo "sois X"): formato (números, imagen, historia), evitar o afrontar, conclusión o porqué. Todo se cambia en "Cómo lo veis".
5. **Beneficio:** "Si esto estuviera resuelto, ¿qué cambiaría en casa?". La frase vuelve en el cierre y en la hoja del asesor.
6. **El plan:**
   - Cabecera con el anillo de la nota. Sube solo cuando aceptan pasos (60, 62, 73, 78; todas las combinaciones salen del plan).
   - **Hoja de ruta:** los 3 pasos en un camino, con "¿Os convence?" (Sí / Tengo dudas / No), y al final a dónde lleva el plan (coche, casa, universidad, jubilación).
   - Al aceptar el paso de la tarjeta se abre un **calendario** para ponerle día y hora, con "cómo se hace" y recordatorio (.ics).
   - **Siguiente paso:** la reunión con el asesor, con el mismo calendario. Barra fija abajo con "Pedir reunión".
   - **Una semana después (vista previa):** se pide el saldo de la tarjeta. Con 11.200 $ o menos, la nota pasa a 62; si no, "¿Qué os frena?" y se apunta para el asesor.
   - **Más sobre vuestro plan:** lo que creían, lo que hacen bien, lo que frena y lo que viene después, plegado en el móvil.
7. **Hoja para el asesor:** qué les importa, qué cambiaría en casa, su nivel, pasos aceptados, primer paso con fecha, dudas abiertas y resueltas.

## Dos niveles

| | Somos nuevos en esto | Sabemos de finanzas |
|---|---|---|
| Cada cifra | Texto llano | Además, un bloque técnico (TAE, déficit de cobertura, topes de la nota, combinaciones) |
| Origen | "Cifra de vuestro plan" o "Cuenta nuestra con cifras de vuestro plan" | Además, la ruta del dato en el JSON |
| Palabras | "Seguro extra de responsabilidad civil", "de cada 100 $ invertidos" | "Umbrella", "renta variable", UPRO y concentración |

Las cuentas que hace la app (18 % × 18.000 $, rendimiento del efectivo, años de gastos que cubre el seguro) van rotuladas como cuenta nuestra.

## Dudas y reunión

- Cada duda se apunta: "Tengo dudas", "No" (con el motivo), el botón "¿Y si…?" y las preguntas libres.
- Las respuestas salen solo del plan. Si el plan no lo cubre (precio del seguro, coche y casa fuera del efectivo sobrante, invalidez…), va directa a la hoja del asesor.
- La reunión que se propone depende de lo decidido:

| Situación | Reunión | Plazo |
|---|---|---|
| Los 3 pasos aceptados y 0 dudas abiertas | 20 min para arrancar | próximos 2 días laborables |
| Ningún "No" y 1 o 2 dudas abiertas (o pasos sin contestar) | 30 min con las dudas preparadas | próximos 5 días laborables |
| Algún "No" o 3 o más dudas abiertas | 45 min sin compromiso | próximos 10 días laborables |

- Prototipo: la reserva no se envía y nada mueve dinero.

## Archivos

- `app/facts.js`: lee el JSON y devuelve las cifras, con la ruta de origen.
- `app/content.js`: textos y respuestas a dudas típicas.
- `app/charts.js`: gráficos SVG hechos a mano.
- `app/app.js`: flujo, estado (localStorage) y presentación.
- `../scripts/build.mjs`: genera `dist/plan-weah.html` y la web de Pages.

Dependencias: ninguna. Las fuentes Inter y Poppins se cargan de Google Fonts; sin conexión se usa la fuente del sistema.
