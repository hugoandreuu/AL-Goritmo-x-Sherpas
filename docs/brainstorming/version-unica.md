# Versión única: la app como antesala del asesor

Sábado 14 de noviembre de 2026. Junta tres cosas: el plan de Daniel recortado ([veredicto-plan-pareja.md](veredicto-plan-pareja.md)), la respuesta del mentor de Sherpas y los mecanismos del hilo de psicología ([sesgos-por-pantalla.md](sesgos-por-pantalla.md)).

La app sigue sin nombre decidido. Los textos de ejemplo son propuestas de redacción, no textos cerrados.

## 1. Qué es ahora

Una web para móvil que la pareja recibe antes de la reunión con su asesor. Todavía no son clientes. En unos cinco minutos descubren por sí mismos qué vale su plan, dan un primer paso pequeño y se quedan con tres preguntas que solo se resuelven hablando con el asesor. El final de la app es pedir esa reunión. El asesor recibe una ficha con lo que creían, lo que les sorprendió y lo que quieren preguntar.

Decidido por Hugo: el asesor no se sustituye, la app lo complementa. Caso Weah, pareja en un solo móvil, sin servidores externos, y tiene que caber en el pitch de dos minutos.

## 2. Por qué acaban pidiendo la reunión

Es una cadena de cinco eslabones, cada uno con un mecanismo conocido:

1. Reciben algo de valor gratis: un dato de su plan que no sabían (reciprocidad).
2. Montan su plan marcando pasos y viendo subir la nota (se valora más lo que ha montado uno mismo).
3. Dicen un sí pequeño: un paso con día y hora (tras un sí pequeño cuesta menos el grande).
4. Comprueban a la semana que funcionó: la nota sube (refuerzo temprano).
5. Les quedan preguntas abiertas que la app no contesta (lo que queda sin cerrar no se olvida).

Pedir la reunión es entonces el paso coherente, no una venta.

## 3. Las ocho pantallas

| # | Pantalla | Qué ven (ejemplo de texto) | Mecanismo | Dato y origen |
|---|---|---|---|---|
| 1 | Quién sois | "¿Lo hacéis juntos?" y "¿Qué os importa más?" con tres opciones. La primera: "Que Liam y Josh estén protegidos" | Hablar de lo suyo desde el principio | El perfil del caso dice que su motivación es la protección (`persona.md`) |
| 2 | Adivinar, por turnos | "A este ritmo, ¿cuándo acabáis de pagar vuestra tarjeta?" Cada uno marca en secreto y se pasa el móvil | Curiosidad: quien apuesta quiere ver el resultado, y lo recuerda | — |
| 3 | Revelación | Las dos marcas y la real: "Septiembre de 2039. Liam tendrá 19 años." Debajo: "Son 270 $ al mes solo en intereses. Vuestro plan propone empezar a cortarlo con vuestro efectivo." Interruptor novato y experto | Sorpresa, dato concreto, coste de esperar dicho una sola vez y salida inmediata | `ccPayoffDate`; 270 $ del plan; la edad de Liam es cuenta nuestra (6 años hoy) y va rotulada |
| 4 | Seguro de vida | "Lo siguiente es incómodo, pero tiene arreglo. ¿Lo vemos?" Luego: "Si faltara uno de vosotros, hoy Liam y Josh tendrían cubierto esto, y el plan recomienda esto otro" | Pedir permiso baja la resistencia. Se cuenta desde los niños | Timothy 140.000 $ frente a 750.000 $ mínimos; Melanie 110.000 $ frente a 600.000 $ |
| 5 | Vuestros pasos | "Ya estáis en 60 de 78." Tres pasos que se marcan y desmarcan. Con los dos seguros sigue en 60. Con la tarjeta sube a 62, luego 73 y 78 | No parten de cero. El orden se descubre solo: la tarjeta es la puerta | `top_moves`, `combined_moves` (las ocho combinaciones están en los datos) |
| 6 | Primer paso | "Vuestro plan propone empezar por pagar 6.800 $ de la tarjeta. ¿Qué día y a qué hora?" Propuesto: el próximo lunes a las 19:00. Tres líneas de cómo se hace. Recordatorio al calendario | Día y hora concretos; el lunes como nuevo comienzo; opción ya propuesta | `top_moves[0]` |
| 7 | Una semana después | "¿Cuál es el saldo de la tarjeta ahora?" Con 11.200 $ o menos: "Habéis pasado de 60 a 62 vosotros solos. Los dos pasos que quedan son seguros, y esos se miran con vuestro asesor." Si no: "¿Qué os frena?" | Lo pendiente se recuerda; premio pronto; y es el momento de ofrecer la reunión | `target_amount` 11.200 $ |
| 8 | Vuestra agenda y la reunión | "Esto es lo que la app no decide por vosotros": la diferencia de riesgo entre los dos y hasta dos dudas guardadas. "Vuestro asesor ya las tiene. ¿Os viene bien este hueco?" | Preguntas abiertas que solo cierra una persona; la reunión como paso coherente | Timothy Growth, Melanie Moderate (`risk_profile`); metas del plan: vacaciones 2027, coche 2028, casa 2030 |

Las dudas que se ofrecen ya escritas para guardar con un toque salen de sus metas: "¿Qué pasa con la jubilación si compramos el coche en 2028?", "¿Cabe la casa de 2030 con todo lo demás?". La app no las responde porque el plan trae un único escenario. Decirlo así es honesto y es el motivo para la reunión.

## 4. La ficha del asesor

Se lee en diez segundos. Tres bloques con las palabras de Sherpas: preguntas, miedos y decisiones.

- **Lo que dijeron ellos, primero:** qué eligió cada uno en "qué os importa más" y qué año marcó cada uno. Si el asesor abre repitiendo eso, la pareja se siente escuchada.
- **Qué les sorprendió más:** dónde estuvo más lejos cada uno.
- **Dónde no coinciden:** el perfil de riesgo y las respuestas. Recomendación: hablar con los dos, porque deciden juntos (`persona.md`).
- **Qué han hecho ya:** el paso elegido, la fecha y si lo cumplieron. El asesor felicita antes de proponer.
- **Qué les frena:** lo que contestaron si no pagaron.
- **Sus preguntas para la reunión:** hasta tres.
- **Qué no hacer:** abrir con la nota de 60 o con la muerte.

Los rasgos del perfil se escriben en palabras normales, sin códigos ni etiquetas de personalidad.

## 5. Lo que he corregido de cada propuesta

| Propuesta | Problema | Cómo queda |
|---|---|---|
| "Tenéis 150.000 $ en efectivo: podéis cortarlo hoy" (psicología) | Suena a pagar la tarjeta entera, y el plan propone 6.800 $. Además parte de ese efectivo puede estar reservado para el coche y la casa | "Vuestro plan propone empezar con 6.800 $ de vuestro efectivo" |
| Protección de los niños como opción ancla (psicología) | Si viene marcada de antemano, la respuesta ya no dice qué les importa de verdad y la ficha pierde valor | Va la primera, pero sin marcar |
| Contador de "3.240 $ perdidos al año" (Daniel) | Es cálculo nuestro y es un contador de pérdida, que asusta más que mueve | Una sola frase con la cifra del plan: 270 $ al mes |
| Mensaje de Telegram, servidor, IA en directo (Daniel) | Hugo no quiere servidores externos y no cabe en el pitch | Fuera. Recordatorio en el calendario del móvil |
| Respuestas de ejemplo de Timothy y Melanie (Daniel) | Son inventadas | En el pitch, el jurado hace de uno y alguien del equipo de la otra |
| Una sola pregunta abierta, la del riesgo (psicología) | Es buena, pero el mentor puso de ejemplo las dudas de metas | Las dos: riesgo más dos dudas de metas, máximo tres |
| La app resuelve sin asesor (versión anterior mía) | El asesor no cobra si la familia no llega a él | El final es la reunión; el paso de la tarjeta es la prueba de valor |

## 6. Líneas rojas

Nada de cuentas atrás, "solo quedan dos huecos", porcentajes de otras familias sin dato real, culpar a uno de los dos ni asustar sin salida. El jurado es Sherpas, que trabaja con asesores regulados, y la presión se nota y resta. Frase para el pitch si preguntan: "Usamos psicología para que hagan lo que su propio plan recomienda, no para venderles".

## 7. El pitch con el nuevo enfoque

| Tiempo | Pantalla | Idea |
|---|---|---|
| 0:00 a 0:25 | 2 | Un jurado dice un año y hace de Timothy; alguien del equipo hace de Melanie |
| 0:25 a 0:45 | 3 | "Septiembre de 2039. Liam tendrá 19 años. El plan ya lo decía; nadie se lo había preguntado" |
| 0:45 a 1:05 | 5 | Los dos seguros y sigue en 60; la tarjeta y sube. "El orden importa" |
| 1:05 a 1:30 | 6 y 7 | Un paso con fecha. A la semana, el saldo. "De 60 a 62 ellos solos; el resto, con su asesor" |
| 1:30 a 2:00 | 8 y ficha | "Estas familias aún no son clientes. Llegan a la reunión con un paso dado y tres preguntas, y el asesor sabe qué creía cada uno" |

## 8. Sin decidir

- Nombre.
- Si "pedir reunión" abre un calendario de mentira en la demo o solo enseña la ficha con el aviso "esto es lo que recibiría vuestro asesor".
- Si se enseñan las cuentas propias rotuladas (edad de Liam en 2039) o se pregunta antes a los mentores.
- Si el interruptor novato y experto entra en el núcleo o queda para si sobra tiempo.
- Segundo caso para enseñar que no está hecho solo para los Weah.

## 9. El embudo, apoyado en métodos de venta ya probados

Hugo pidió que el embudo no sea inventado, sino basado en métodos de venta conocidos. Estos son los cinco que encajan y qué cambia en la app por cada uno. Los datos sobre cada libro son de memoria y conviene comprobarlos antes de citarlos en el pitch.

| Método | De dónde sale | Qué dice | Cómo se aplica aquí |
|---|---|---|---|
| **SPIN Selling** (Neil Rackham) | Estudio de unas 35.000 visitas de venta | En ventas grandes no gana quien presenta mejor, gana quien pregunta en este orden: Situación, Problema, Implicación y Beneficio. Lo que más pesa es que el cliente diga con sus palabras qué gana | Es la columna de la app. Situación: nos la saltamos, ya está en el plan (Rackham avisa de que estas preguntas aburren). Problema: adivinar la fecha. Implicación: "Liam tendrá 19 años, 270 $ al mes". Beneficio: una pregunta nueva, "¿Qué cambiaría en casa si esto estuviera resuelto?", con tres opciones |
| **The Challenger Sale** (Dixon y Adamson) | Estudio de varios miles de vendedores | Los mejores no preguntan "¿qué necesitas?": enseñan al cliente algo que no sabía de su propia situación y le cambian la forma de verla | La revelación. La pareja creía que su problema era ahorrar más; el plan enseña que es el orden: sin la tarjeta, nada sube |
| **Embudo de cuestionario** (Ryan Levesque, método Ask) | Práctica muy extendida en venta por internet | Unas pocas preguntas, un resultado personalizado y una sola llamada a la acción. Quien contesta se clasifica solo | El formato entero: preguntas, "vuestro resultado" y pedir la reunión. La ficha del asesor es la clasificación |
| **Escalera de valor** (Russell Brunson) | Práctica de embudos de venta | Primero algo gratis y valioso, luego un compromiso pequeño, luego la oferta principal | Dato gratis, paso con fecha, pago de 6.800 $ hecho por ellos, reunión, cliente |
| **Ecuación de valor** (Alex Hormozi) | Libro de ofertas | Una oferta vale más cuanto mayor es el resultado y la certeza, y menor el tiempo y el esfuerzo | El texto del botón de reunión: qué se llevan ("el orden de vuestros tres pasos y respuesta a vuestras tres preguntas"), que no tienen que preparar nada ("vuestro asesor ya tiene vuestras respuestas") y cuánto dura |

Dos apoyos más, sin pantalla propia:

- **StoryBrand** (Donald Miller): el protagonista es la familia y el asesor es el guía. En ningún texto la app ni Sherpas son el héroe.
- **Contrato inicial** (método Sandler): la primera pantalla dice qué va a pasar y que al final podrán pedir reunión o no. Avisar de la salida baja la resistencia.

### Qué cambia en las pantallas

1. **Pantalla 1:** se añade una línea de contrato inicial: "Son cinco minutos. Al final decidís si queréis verlo con vuestro asesor."
2. **Pantalla 5 o 6:** se añade la pregunta de beneficio de SPIN, "¿Qué cambiaría en casa si esto estuviera resuelto?". La respuesta va a la ficha del asesor con sus palabras.
3. **Pantalla 8:** el botón de reunión se redacta con la ecuación de valor. La duración de la reunión hay que preguntarla a Sherpas, no se inventa.
4. **Ficha del asesor:** se ordena como ficha de cualificación: qué necesidad han reconocido, qué urgencia tienen (fecha elegida y si cumplieron), quién decide (si participaron los dos) y qué objeción han dado.

### Para el pitch

Una frase basta: "No hemos inventado el embudo. Las preguntas siguen el orden de SPIN Selling, y la revelación es lo que The Challenger Sale llama enseñar al cliente algo que no sabía de sí mismo."
