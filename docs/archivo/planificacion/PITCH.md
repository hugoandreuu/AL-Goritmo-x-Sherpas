> **Archivo.** Documento de trabajo antiguo: describe una idea o un plan que ya no es el de la app. Lo vigente está en el [README](../../../README.md) y en [docs/brainstorming/decisiones.md](../../brainstorming/decisiones.md).

# Pitch, media página y preguntas del jurado

> Versión alineada con BASES.md v7 (secciones 0, 6, 10, 12, 16, 17 y 19). Fuente de cifras: solo BASES.md y el JSON del caso Weah; no se añade ninguna cifra nueva. Roles: **P** = presentador (habla), **M** = persona con el móvil (toca, hace de Timothy/Melanie y recibe el mensaje).
> Duración objetivo: 2:00 (235 palabras habladas, tope de 260; ritmo de unas 140 por minuto; la pregunta al jurado añade unos segundos de silencio, que ya caben en el margen). Ensayar con cronómetro; recortar por las frases marcadas "(recortable)" si se pasa.

---

## 1. Guion de 2 minutos (en vivo)

| Tiempo | Pantalla del móvil | Quién | Texto exacto |
|---|---|---|---|
| 0:00 a 0:13 | Pregunta en pantalla completa con chips por década y botones −/+ (sin deslizador): "¿Cuándo terminarán los Weah de pagar la tarjeta, a este ritmo?". M entrega el móvil a un miembro del jurado; su marca aparece junto a las de Timothy y Melanie (respuestas de ejemplo precargadas) | P, jurado, M | "Una persona del jurado, por favor: ¿cuándo terminan los Weah de pagar su tarjeta, a este ritmo? Su marca aparece junto a la de Timothy y Melanie... y la real: septiembre de 2039. Aquí no hay respuestas incorrectas, solo sorpresas del plan." |
| 0:13 a 0:20 | Revelación: tres marcas y la real, "septiembre de 2039" como única cifra (única animación). Aparece la frase diferenciadora | P | "El plan te cuenta. Esto te pregunta, mide lo que entendiste y vuelve hasta que actúas." |
| 0:20 a 0:28 | Revelación de pareja (P07): las marcas de Timothy y Melanie por separado y, debajo, sus perfiles de riesgo declarados "Timothy: Growth · Melanie: Moderate" (`household[i].risk_profile`) | P | "En casa, cada uno contesta a escondidas y luego se comparan. Hasta en el riesgo no coinciden: él se declara Growth, ella Moderate." |
| 0:28 a 0:42 | Misma tarjeta; M toca el interruptor Novato / Experto y el texto cambia | P, M toca | "Mismo texto, dos personas. Novato: pagáis 270 dólares al mes solo de intereses. Experto: 18 por ciento APR, amortización completa en septiembre de 2039. Cada uno elige cómo entenderlo." |
| 0:42 a 0:54 | El móvil del equipo suena: llega un mensaje real (Telegram; respaldo automático por ntfy) con el año del jurado, septiembre de 2039, "270 $ al mes de intereses" y el enlace "día 3". Es una plantilla en código, no IA (BASES §17). M lo muestra a cámara | P, M | "Y suena el móvil del equipo: un mensaje real, con el año del jurado y el enlace al día tres. Es una plantilla; la IA solo escribe la página a la que lleva." |
| 0:54 a 1:20 | Escalera con botones Subir/Bajar de 44 px (una sola demostración). Orden del plan (en pantalla, no se dicen: 62, 73, 78). M pulsa "Bajar" en la tarjeta hasta ponerla la última: la nota baja a 60 (`combined_moves[3]`). Tarjeta del seguro: "unos 2 años de gastos hoy / unos 12 recomendados" | P, M pulsa | "La escalera: tarjeta primero, 62. Sin la tarjeta, aunque hagáis los dos seguros, 60. Hoy su seguro cubre unos 2 años de gastos; lo recomendado, unos 12. Primer paso, con día y hora: pagar 6.800 dólares." |
| 1:20 a 1:30 | Se queda en el primer paso con día y hora (P13), titular con la frase propia de la familia. **No se abre el día 7** | P | "Una semana después pedimos el saldo, no el "ya lo hice": con 11.200 o menos, la nota pasa a 62." |
| 1:30 a 1:50 | Hoja del asesor a pantalla completa: "creían X y era Y" por persona y "no coinciden en W" | P | "Su asesor recibe una hoja: qué creían, qué era, y en qué no coinciden entre ellos." |
| 1:50 a 2:00 | Vuelve el contador del principio, con la marca del jurado visible | P | "Un plan informa. Esta app pregunta, comprueba y vuelve hasta que actúan. Entre entender y hacer, estamos nosotros. Gracias." |

**Qué cumple (comprobación v7; la pareja vuelve al pitch en 0:20 con un dato real del plan (perfiles declarados)):** (1) abre con la pregunta al jurado y su marca junto a las de Timothy y Melanie y la real, septiembre de 2039; (2) la frase diferenciadora cae antes del segundo 20; (3) el mensaje real con el enlace "día 3" llega a mitad (0:42 a 0:54) y es una plantilla en código, no IA; (4) interruptor novato/experto en la tarjeta; (5) escalera con una sola demostración, dicha con dos cifras: tarjeta primero 62 y "sin la tarjeta, aunque hagáis los dos seguros, 60" (`combined_moves[3]`); el seguro como años de gastos (hoy unos 2, recomendado unos 12); (6) día 7 en una frase sobre el primer paso, sin abrir pantalla: saldo de 11.200 $ o menos, nota 62; (7) hoja del asesor en pantalla; (8) cierre repetible; (9) ninguna frase tipo "casi nadie lo adivina".

### Texto corrido (para memorizar)

Una persona del jurado, por favor: ¿cuándo terminan los Weah de pagar su tarjeta, a este ritmo? Su marca aparece junto a la de Timothy y Melanie... y la real: septiembre de 2039. Aquí no hay respuestas incorrectas, solo sorpresas del plan. El plan te cuenta. Esto te pregunta, mide lo que entendiste y vuelve hasta que actúas. En casa, cada uno contesta a escondidas y luego se comparan. Hasta en el riesgo no coinciden: él se declara Growth, ella Moderate. Mismo texto, dos personas. Novato: pagáis 270 dólares al mes solo de intereses. Experto: 18 por ciento APR, amortización completa en septiembre de 2039. Cada uno elige cómo entenderlo. Y suena el móvil del equipo: un mensaje real, con el año del jurado y el enlace al día tres. Es una plantilla; la IA solo escribe la página a la que lleva. La escalera: tarjeta primero, 62. Sin la tarjeta, aunque hagáis los dos seguros, 60. Hoy su seguro cubre unos 2 años de gastos; lo recomendado, unos 12. Primer paso, con día y hora: pagar 6.800 dólares. Una semana después pedimos el saldo, no el "ya lo hice": con 11.200 o menos, la nota pasa a 62. Su asesor recibe una hoja: qué creían, qué era, y en qué no coinciden entre ellos. Un plan informa. Esta app pregunta, comprueba y vuelve hasta que actúan. Entre entender y hacer, estamos nosotros. Gracias.

### Si algo falla (líneas de contingencia)

- **El jurado se niega o no hay voluntario (a los 5 s):** P sonríe y sigue sin presión: "Sin problema, os enseño la marca de una persona del equipo." M teclea su fecha en el móvil como "marca de ensayo" (etiquetada así en pantalla, nunca presentada como jurado real). La revelación y el resto del guion no cambian. Alternativa: P pregunta a la sala y M teclea la fecha más repetida.
- **El jurado acierta o se acerca mucho:** P: "Muy cerca: ya sabéis más que lo que suele decir un plan." La reacción de la app es la de "acierta y seguro": detalle de experto. Continuar.
- **El mensaje no llega a los 0:50:** P: "La red nos hace una jugada; abrimos el mismo enlace desde aquí." M abre "día 3" desde el selector de días de la demo (es el mismo enlace). Antes de salir, dejar el mensaje ya enviado una vez como captura en el móvil, por si hace falta enseñarla.
- **El móvil no se pasa o la pantalla se congela:** pasar a la versión de 90 segundos (sección 2) desde la captura que toque. Primera frase: "La demo se ha caído; os enseño las capturas del mismo recorrido." Sin disculpas largas.
- **Si va justo de tiempo:** quitar primero "Es una plantilla; la IA solo escribe la página a la que lleva" (recortable), luego "Cada uno elige cómo entenderlo" y "Aquí no hay respuestas incorrectas, solo sorpresas del plan".

### Notas de ensayo

- La pregunta al jurado es el momento "wow": el jurado pasa de mirar a ser el dato. No explicar antes qué va a pasar.
- Ensayar la preparación: el móvil de M ya tiene precargadas las respuestas de Timothy y Melanie, y el servicio de mensajes probado en el mismo teléfono y red del día.
- El 62 llega al pagar los 6.800 $ del primer peldaño (saldo que queda: 11.200 $). Los saltos son acumulados, como `score.combined_moves`. El "60" de la escalera es `combined_moves[3]` (vida + umbrella sin tarjeta).
- El mensaje del pitch es una plantilla en código (año del jurado, `ccPayoffDate`, 270 $ al mes de intereses y enlace): sin latencia de IA. La IA solo escribe la página del día 3, pregenerada antes del pitch.
- No decir "casi nadie lo adivina" ni dar un porcentaje de acierto de la sala: solo se dirá con el recuento real de la prueba del martes 17.
- El 2 y el 12 salen de la cobertura total de 250.000 $ y del mínimo recomendado de 1.350.000 $ dividido entre el gasto anual de 112.774 $ (2,2 y 12,0). Lo calcula la app, nunca la IA.
- Si alguien pregunta por la jerga: tocar "under insured" y enseñar la línea en llano. No entra en los 2 minutos.

---

## 2. Versión de emergencia de 90 segundos (si la demo falla)

Preparar seis capturas en el móvil y en la diapositiva de reserva, en este orden: (1) pregunta al jurado con la revelación (usar una marca de ensayo etiquetada), (2) gancho con contador, (3) interruptor novato/experto, (4) mensaje real (plantilla) con enlace al día 3, (5) escalera con 62, 73, 78 y "sin la tarjeta, 60", el seguro en años de gastos y el primer paso, (6) hoja del asesor. El día 7 se dice sobre la captura 5, sin captura propia. Presentador solo; sin móvil en mano.

| Tiempo | Captura | Qué decir |
|---|---|---|
| 0:00 a 0:17 | 1 y 2 | "A un jurado le preguntamos cuándo terminan los Weah de pagar la tarjeta; su marca va junto a la de Timothy y Melanie, y la real es septiembre de 2039. Tienen 150.000 dólares al 0,1 por ciento y 18.000 de tarjeta al 18: pierden 3.240 al año." |
| 0:17 a 0:30 | 1 | "El plan te cuenta. Esto te pregunta, mide lo que entendiste y vuelve hasta que actúas. Si fallas, la app lo trata como una sorpresa del plan, no como un error tuyo." |
| 0:30 a 0:42 | 3 | "Novato: 270 dólares al mes solo de intereses. Experto: 18 por ciento APR, amortización completa en septiembre de 2039." |
| 0:42 a 0:52 | 4 | "Y la app vuelve: un mensaje real, una plantilla con el año del jurado y el enlace al día tres." |
| 0:52 a 1:10 | 5 | "La escalera: tarjeta, 62; con el seguro de vida, 73; con el umbrella, 78. Sin la tarjeta, aunque hagáis los dos seguros, 60. Hoy el seguro cubre unos 2 años de gastos; lo recomendado, unos 12. Primer paso con día y hora: 6.800 dólares a la tarjeta." |
| 1:10 a 1:20 | 5 | "A la semana pedimos el saldo: once mil doscientos o menos, y la nota pasa a 62." |
| 1:20 a 1:30 | 6 | "El asesor recibe qué creían, qué era y en qué no coinciden. Un plan informa; esta app pregunta, comprueba y vuelve." |

---

## 3. Media página para la entrega (`/entrega`)

**Vuestro plan, en vuestras palabras** (nombre provisional)

**Qué hemos construido y por qué.** Una web para móvil que guía a una familia por su plan de Sherpas usando lo que cada miembro cree sobre su dinero. En lugar de contar el plan, pregunta: la persona adivina una cifra que no está en el formulario (por ejemplo, cuándo termina de pagar la tarjeta), la app revela su marca frente a la real y la de su pareja, y reacciona según lo cerca que estuviera y lo seguro que estaba. En la demo, el primer adivinador es un miembro del jurado. Cada tarjeta tiene una palanca que mueve la cifra al momento y una pregunta de comprobación. Un interruptor novato/experto cambia el mismo texto en vivo, y cada término de EE. UU. tiene una glosa en llano. Los pasos se ordenan en una escalera, con botones Subir/Bajar además del arrastre, con su efecto acumulado en la nota (tarjeta: 62; tarjeta y seguro de vida: 73; con el umbrella: 78; y sin la tarjeta, aunque se hagan los dos seguros, 60) y solo el primer peldaño lleva compromiso, con día, hora y "cómo se hace". El seguro de vida se explica con una sola cifra concreta: hoy cubre unos 2 años de gastos, el mínimo recomendado son unos 12. La app vuelve: durante el pitch llega un mensaje real con el enlace al día 3 (una plantilla en código con el año de quien adivinó, no IA); el día 7 pide el saldo de la tarjeta (11.200 $ o menos pasa la nota a 62). Si hay asesor, recibe una hoja de una página con lo que la familia creía y no entendió, y con los datos del plan que no cuadran entre sí.

**Qué está construido y qué solo diseñado.**
- *Construido (núcleo):* gancho con contador; pregunta al jurado en directo; ciclo completo de la tarjeta (2 ramas); ciclo del seguro con aviso y una cifra; revelación de pareja; interruptor novato/experto en la tarjeta; escalera con primer paso de 6.800 $; un mensaje real con enlace al día 3; día 7 con saldo y nota 62; hoja del asesor; glosa de 2 términos en pantalla (under insured, umbrella; hasta 5 si sobra tiempo).
- *Diseñado, no construido:* envío programado de los días 14, 21 y 30 y de los eventos del caso; inglés; audio del resumen; dos móviles con código de sala; IA del día 14; protocolo completo de noticias duras. Se cuenta, no se promete.

El motivo: el plan de Sherpas ya informa bien, pero es un documento largo que pocas familias leen entero, las parejas no ven igual el riesgo, y el plan no vuelve cuando la persona actúa. El producto no es el quiz, sino lo que la app sabe de cada persona después: qué creía, dónde falló estando seguro, qué le preocupa y a qué se comprometió. La IA solo redacta la página del día 3 (titular, motivo, detalle, tres preguntas sugeridas), pregenerada; el mensaje del pitch es una plantilla y la IA nunca calcula. Todas las cifras salen del JSON del caso y se validan antes de mostrarse; si falla, se muestra texto fijo.

**Lo que hemos descartado y por qué.**
- Chat generativo como pieza central: Sherpas ya tiene chat y, con chat libre, la gente no sabe qué preguntar.
- Tour narrado o "Wrapped" de animaciones: engancha, pero no lleva a actuar y se parece a lo que existe.
- Puntos, rachas diarias y confeti: con dinero parece infantil, y un plan no se revisa a diario.
- Notificaciones push web: no llegan en iPhone sin instalar; usamos un mensaje con enlace (Telegram en la demo; WhatsApp o email en producción) y calendario .ics.
- Cuentas de usuario: añaden fricción; basta un enlace con estado.
- Asesor por voz: interesante, pero cerca del chat y caro de hacer bien en una semana.

**Lo que no sabemos.**
- Si el efectivo "sobrante" lo es de verdad: no cuenta el coche de 2028 ni la casa de 2030, así que no lo presentamos como libre.
- Si "hecho" es real: es autodeclarado; el día 7 pide el saldo, pero sigue sin verificarse con el banco.
- Si la mejora de comprensión dura: la mediríamos con la re-adivinanza del día 14, que está diseñada pero no construida ni probada con familias reales.
- Algunos datos del JSON no cuadran entre sí (por ejemplo, el seguro objetivo aparece como 485.000 $ y como 491.800 $); por eso hablamos de rango recomendado y no de cifra exacta.

**Cómo ejecutarlo.** Node 20 o superior. En la carpeta del repositorio: `npm i && cp .env.example .env && npm start`; rellenar en `.env` la clave del equipo (`TEAM_KEY`) y la dirección del proxy de IA (`LLM_PROXY_URL`). Un solo servicio sirve la API y la web. Los números salen de los ficheros de `cases/`, no del MCP. Idioma: español por defecto; el interruptor de inglés queda fuera de la demo (solo diseñado); importes siempre en dólares. *(Antes de enviar, comprobar que los pasos coinciden con el README real del repositorio.)*

---

## 4. Preguntas probables del jurado

**1. "¿No es esto un quiz?"**
Un quiz puntúa a la persona; aquí la respuesta es el dato. Adivinar mide lo que cree y lo seguro que está, y eso decide qué explica la app, qué le dice al asesor y a qué se compromete, con una palanca que mueve la cifra y un seguimiento que vuelve.

**2. "¿Y si la familia no tiene asesor?"**
La hoja de una página sirve igual a la familia: "lo que entendemos", "lo que no", "en qué no coincidimos", "nuestro primer paso y fecha". El asesor es un destinatario extra, no una condición; sin él, la familia lleva a casa sus tres preguntas para cuando lo consiga.

**3. "¿Cómo sabéis que funciona?"**
No lo sabemos todavía, y lo decimos en la hoja. Lo medimos con dos señales que ya están en el diseño: el saldo real del día 7 (no un "hecho" autodeclarado) y la re-adivinanza del día 14 para ver si la comprensión se mantiene; la segunda está solo diseñada y ninguna se ha probado con familias reales.

**4. "¿Por qué no un chat?"**
Sherpas ya tiene chat, y con una caja en blanco la gente no sabe qué preguntar ni vuelve sola. Aquí la app pregunta primero, ordena un camino con un primer paso y vuelve en días concretos, algo que un chat no hace si nadie lo abre. Hoy el regreso es un mensaje real con enlace; el envío programado está diseñado.

**5. "¿Qué hace la IA?"**
Redacta, no calcula, y solo la página del día 3 (el mensaje del pitch es una plantilla en código): recibe cifras ya calculadas, la respuesta y la seguridad de la persona, y devuelve un titular, un motivo, un detalle y tres preguntas sugeridas. Cada número del texto se valida contra la entrada; si alguno no está, se muestra texto fijo, y eso se puede enseñar en la demo.

**6. "¿Qué pasa con los datos contradictorios?"**
Los detectamos con reglas fijas, no con la IA, y no los escondemos: van a "a revisar con vuestro asesor" en la hoja. Ejemplo del caso: el seguro objetivo figura como 485.000 $ y como 491.800 $, así que hablamos de rango recomendado y no de cifra exacta; en el caso de Samantha, la casa figura sin asegurar pero hay una prima de seguro de hogar en los gastos. Es la prueba de que la app lee el plan de verdad.

**7. "¿Por qué no usáis el MCP?"**
Porque necesitamos números estables y verificables, y el acceso por MCP depende de un token de 72 horas que puede caducar a mitad de la demo. Usamos el JSON de `cases/`, que es la misma fuente, y validamos cada cifra contra él antes de mostrarla. Conectar el MCP en producción es un cambio de origen de datos, no de producto.

**8. "¿Es consejo de inversión?"**
No. La app explica el plan que ya preparó el asesor: no da asesoramiento nuevo ni cambia el plan, y lo dice en un pie fijo en cada pantalla ("Esto os ayuda a entender el plan de vuestro asesor. No es consejo nuevo ni lo cambia. Antes de mover dinero, hablad con vuestro asesor."). Las propuestas se redactan como "Vuestro plan propone…", el texto de la IA lleva su etiqueta y siempre hay un botón "Hablarlo con una persona". Las cifras salen del plan, no de la IA.

**9. "¿Se guardan las comunicaciones (SEC/FINRA)?"**
En producción el registro iría al archivo del asesor; a verificar con compliance. En el MVP no hay envío real al asesor: el botón solo abre la hoja.


---

## Versión B: una sola idea (propuesta, BASES §21)

> Propuesta pendiente de decisión del equipo (BASES §21, "Pitch de una sola idea"). No sustituye al guion de la sección 1. Duración máxima 2:00; unas 150 palabras habladas (tope 200). Solo se narra: el jurado, el dato propio, el mensaje real, la hoja del asesor y el cierre. La escalera, el interruptor novato/experto y la pareja se ven en pantalla, pero no se narran. Cifras: solo septiembre de 2039, ya usada en BASES.

| Tiempo | Pantalla | Quién | Texto exacto |
|---|---|---|---|
| 0:00 a 0:35 | Pregunta en pantalla completa con chips por década y botones −/+; M entrega el móvil a una persona del jurado. Revelación: su marca junto a la real, "septiembre de 2039" | P, jurado, M | "Una persona del jurado, por favor: ¿cuándo terminan los Weah de pagar su tarjeta, a este ritmo? Escriba su año. Aquí está su marca, y aquí la real: septiembre de 2039." |
| 0:35 a 0:55 | Diapositiva o tarjeta con el recuento, rotulado "no es estadística" | P | "Antes de hoy se lo preguntamos a otras personas. [RECUENTO REAL: X de N …]. No es estadística; es lo que vimos." |
| 0:55 a 1:20 | Suena el móvil del equipo (Telegram; respaldo ntfy) y se proyecta: mensaje con el año del jurado y el enlace al día 3. Plantilla en código, no IA (BASES §17) | P, M | "Y suena el móvil del equipo: un mensaje real, con vuestro año y el enlace al día tres. Es una plantilla; no hay IA en el aviso." |
| 1:20 a 1:45 | Hoja del asesor a pantalla completa, 3 bloques: preguntas, miedos y decisiones. En pantalla, sin narrar: escalera, novato/experto y pareja, que se ven al pasar | P | "Vuestro asesor recibe una hoja con tres bloques: sus preguntas, sus miedos y sus decisiones." |
| 1:45 a 2:00 | Vuelve la marca del jurado junto a la real, con la frase de producto como titular | P | "Primero adivinas, luego entiendes, después actúas. Gracias." |

### Texto corrido (para memorizar)

Una persona del jurado, por favor: ¿cuándo terminan los Weah de pagar su tarjeta, a este ritmo? Escriba su año. Aquí está su marca, y aquí la real: septiembre de 2039. Antes de hoy se lo preguntamos a otras personas. [RECUENTO REAL: X de N …]. No es estadística; es lo que vimos. Y suena el móvil del equipo: un mensaje real, con vuestro año y el enlace al día tres. Es una plantilla; no hay IA en el aviso. Vuestro asesor recibe una hoja con tres bloques: sus preguntas, sus miedos y sus decisiones. Primero adivinas, luego entiendes, después actúas. Gracias.

### Variantes de la frase de producto (BASES §21)

1. "Primero adivinas, luego entiendes, después actúas." (6 palabras; recorrido de la app, la más fácil de repetir)
2. "Que la familia llegue sabiendo lo que no sabe." (9 palabras; apunta a la hoja del asesor)
3. "Un plan que pregunta antes de contar." (7 palabras; contrasta con el plan que solo informa)

Elegir una y cambiar solo la última frase del cierre; el resto no varía.

### Contingencias

- **Sin voluntario del jurado (a los 5 s):** M teclea su fecha como "marca de ensayo", rotulada así en pantalla; el resto sigue igual.
- **Sin recuento real a tiempo:** no decir el hueco; saltar la fila de 0:35 a 0:55 y ganar esos segundos en el mensaje. Nunca inventar X ni N.
- **El mensaje no llega a 1:05:** "La red nos hace una jugada": M abre "día 3" desde el selector de días, o enseña la captura previa; seguir con la hoja.
