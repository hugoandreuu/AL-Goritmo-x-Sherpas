# Vuestro plan en 5 minutos (MVP, caso Weah)

Web estática que cuenta el plan de Timothy y Melanie Weah según cómo quiere entenderlo cada persona. Sin frameworks, sin servidor propio, sin cuentas ni servicios externos. Todas las cifras salen de `cases/timothy-melanie-weah/*.json`; ninguna IA calcula nada.

## Arrancar

Desde la raíz del repo: `npm start` y abrir http://localhost:8000. Para la versión de un solo archivo: `npm run build` y abrir `dist/plan-weah.html`. Más detalle en el [README principal](../README.md).

Atajos: `?reset` empieza de cero; `?demo=story` abre el recorrido guiado y `?demo=plan&f=image&d=why&t=calm&l=pro` el plan completo (`f` = numbers|image|story, `d` = quick|why, `t` = calm|full, `l` = new|pro).

## Flujo

1. **Portada:** dice qué va a pasar (primero preguntamos, después enseñamos, al final deciden) y que el asesor verá las respuestas.
2. **Quién sois:** quién mira el plan, qué les importa más y cómo se manejan con las finanzas ("Somos nuevos en esto" o "Sabemos de finanzas").
3. **Adivinar (5 preguntas) y sentir el dato.** Cada respuesta abre un camino según lo cerca que estuvo. La revelación enseña, por este orden: lo que decían frente a lo que dice el plan, un titular que depende de la distancia ("Son 2.040 $ más al año de lo que pensabais"), **una imagen que traduce el dato a su vida**, una frase, la salida que propone el plan y una reacción de un toque ("No lo sabíamos", "Nos preocupa", "Queremos arreglarlo"). El detalle con tablas queda plegado.

   | Pregunta | Imagen |
   |---|---|
   | Coste anual de la tarjeta | 10 monedas: 9 de cada 10 $ del pago son intereses |
   | Cuándo se acaba | Liam y Josh hoy y en 2039 (19 y 16 años) |
   | Qué da el efectivo | Un dólar que entra frente a más de 21 que se lleva la tarjeta |
   | Seguro de vida | 12 años contados con la edad de Liam, 2 cubiertos |
   | Jubilación | Medidor al 93 %, en verde: se acaba con una buena noticia |

4. **Formato:** tras la primera cifra eligen verla en imagen, historia o números. Ese interruptor sigue visible en el recorrido.
5. **Beneficio:** "Si esto estuviera resuelto, ¿qué cambiaría en casa?".
6. **El plan, en un recorrido guiado de 7 pantallas** (una idea por pantalla, barra de avance arriba, un botón abajo):
   1. Vuestra foto de hoy: la nota y cinco fichas, tres en verde y dos frenos.
   2. Freno 1, la tarjeta.
   3. Freno 2, proteger a Liam y Josh.
   4. La salida: tres interruptores. Al marcar pasos el anillo sube (60, 62, 73, 78). Sin la tarjeta no se mueve.
   5. La imagen completa: de hoy a la jubilación en una línea, con los pasos y las metas.
   6. El primer paso: saldo antes y después, y el calendario para ponerle día y hora.
   7. Lo que queda, con el asesor: tres preguntas que la app no decide y el calendario de la reunión. "Ahora no. Avisadme dentro de una semana" siempre visible.
7. **El plan completo** (botón "Ver el plan completo"): hoja de ruta con "¿Os convence?", dudas, "una semana después" y lo demás plegado.
8. **Hoja para el asesor:** qué les importa, qué cambiaría en casa, cómo reaccionaron a cada dato, su nivel, pasos aceptados, primer paso con fecha, dudas abiertas y resueltas.

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
