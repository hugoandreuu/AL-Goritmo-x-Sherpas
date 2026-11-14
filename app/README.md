# Vuestro plan en 5 minutos (MVP, caso Weah)

Web estática que cuenta el plan de Timothy y Melanie Weah según cómo quiere entenderlo cada persona. Sin frameworks, sin servidor propio, sin cuentas ni servicios externos. Todas las cifras salen de `cases/timothy-melanie-weah/*.json`; ninguna IA calcula nada.

## Arrancar

Desde la raíz del repo: `npm start` y abrir http://localhost:8000. Para la versión de un solo archivo: `npm run build` y abrir `dist/plan-weah.html`. Más detalle en el [README principal](../README.md).

Atajos: `?reset` empieza de cero; `?demo=plan&f=image&d=why&t=calm` abre la presentación directamente (`f` = numbers|image|story, `d` = quick|why, `t` = calm|full).

## Flujo

1. **Portada:** "Bienvenidos a vuestro plan a futuro" y el botón "Ver vuestro plan en 5 minutos".
2. **Adivinar (5 preguntas):** coste anual de la tarjeta, año en que se acaba, lo que da el efectivo, qué cubre el seguro de vida y si llegan a la jubilación. Cada respuesta se compara con la cifra del plan.
3. **Embudo de personalización**, intercalado en el flujo (3 ajustes, nunca se muestran etiquetas tipo "sois X"):
   - **Formato:** tras la primera cifra se enseña la misma en números, imagen e historia, y eligen la que les queda más clara.
   - **Evitar o afrontar:** se pide permiso antes del seguro de vida ("Saltar por ahora" cuenta) y después eligen "Lo justo para decidir", "Verlo todo con detalle" o "Hablarlo con una persona".
   - **Conclusión o porqué:** viene preseleccionado según si abrieron "¿Por qué?" o se tomaron tiempo, y lo confirman.
   Todo se puede cambiar en "Cómo lo veis" y en cada tarjeta con "Ver de otra forma".
4. **Presentación del plan:** lo que creíais frente al plan, lo que hacéis bien, lo que frena la nota, los 3 pasos con "¿Os convence?" (Sí / Tengo dudas / No), lo que viene después y el cierre. Panel de datos con gráficos al lado en escritorio, o desplegable en el móvil.
5. **Cierre:** "Queremos empezar con este plan" reserva una reunión y genera la hoja para el asesor.

## Dudas y reunión

- Cada duda se apunta: "Tengo dudas", "No" (con el motivo), el botón "¿Y si…?" y las preguntas libres.
- Las respuestas salen solo del plan. Si el plan lo cubre, preguntamos "¿Os queda claro?" y la duda queda resuelta o abierta. Si no lo cubre (precio del seguro, coche y casa fuera del efectivo sobrante, invalidez…), va directa a la hoja del asesor.
- La reunión que se propone depende de lo decidido:

| Situación | Reunión | Plazo |
|---|---|---|
| Los 3 pasos aceptados y 0 dudas abiertas | 20 min para arrancar | próximos 2 días laborables |
| Ningún "No" y 1 o 2 dudas abiertas (o pasos sin contestar) | 30 min con las dudas preparadas | próximos 5 días laborables |
| Algún "No" o 3 o más dudas abiertas | 45 min sin compromiso | próximos 10 días laborables |

- Prototipo: la reserva no se envía. Se ve la hoja del asesor, se puede añadir al calendario (.ics), copiar o imprimir.

## Archivos

- `app/facts.js`: lee el JSON y devuelve las cifras, con la ruta de origen.
- `app/content.js`: textos y respuestas a dudas típicas.
- `app/charts.js`: gráficos SVG hechos a mano.
- `app/app.js`: flujo, estado (localStorage) y presentación.
- `../scripts/build.mjs`: genera `dist/plan-weah.html` y la web de Pages.

Dependencias: ninguna. Las fuentes Inter y Poppins se cargan de Google Fonts; sin conexión se usa la fuente del sistema.
