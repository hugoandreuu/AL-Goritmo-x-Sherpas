# PANTALLAS.md: especificación pantalla por pantalla del núcleo (caso Weah)

> **Versión v7** (alineada con BASES.md v7, §16 a §19). Para desarrollador y redactor. Cubre SOLO el "núcleo" de BASES.md §0. Fuera de aquí: ciclo "hoy vs mañana", otros 3 casos, inglés, pregunta de riesgo en pareja como ciclo propio, .ics, días 14/21/30, audio, dos móviles. Todas las cifras salen de BASES.md o del JSON del caso Weah. Los textos entre comillas son microcopy final (ES). Rutas JSON relativas a `cases/timothy-melanie-weah/financial-health.json` salvo que se indique (BASES §7). Las cifras de maqueta rotuladas "ejemplo" no son datos del plan.

## Tiempos por pantalla (objetivo ~5 min)

Objetivo de diseño, a medir con cronómetro en los ensayos del pitch (no son mediciones).

| Pantalla | Qué hacen | Objetivo | Acumulado |
|---|---|---|---|
| P01 | Ven el contador y marcan el coste anual | 15 s | 0:15 |
| P03 | Pareja o individual, frase propia, nivel | 15 s | 0:30 |
| P04 + P05 | Cada uno contesta la fecha de la tarjeta (un componente, dos turnos) y se pasan el móvil | 30 s | 1:00 |
| P07 | Revelación de pareja y perfiles | 25 s | 1:25 |
| P08 | Revelación y reacción de la tarjeta (2 ramas) | 25 s | 1:50 |
| P09 | Palanca (62); test opcional fuera del tiempo | 20 s | 2:10 |
| P11 (con la hoja P10) | Aviso, pregunta, una cifra, palanca | 45 s | 2:55 |
| P12 | Escalera con botones y tarjeta de lectura | 50 s | 3:45 |
| P13 | Primer paso, día y hora | 40 s | 4:25 |
| P17 (con la cabecera P14) | "Creíais X, ahora sabéis Y" y hoja del asesor | 35 s | 5:00 |
| **Total (pareja)** | | **5:00** | |

- **Individual:** sin P04, P05 y P07 (-55 s): ~4:05.
- **P02 (jurado)** solo en demo (`?demo=1`): +20 s, no cuenta en el total.
- **Fuera del total:** test de P09 (opcional), P15 y P16 (llegan por enlace días después).

## 0. Reglas globales

### 0.1 Tono (obligatorio en todo texto)
- Nunca "incorrecto", "error", "mal", "fallaste". Tampoco "casi nadie lo adivina" ni variantes ("la mayoría se equivoca"): solo se dirá con el recuento real de la prueba del martes 17 (BASES §17). Se dice: "El plan sorprende, no vosotros", "Mucha gente se queda cerca de X: la cifra real es Y".
- **Una cifra protagonista por pantalla** (grande, 48 px o más). Otras cifras, solo como apoyo en texto pequeño y solo si la pantalla lo exige (marcadas "cifra de apoyo"). Lo demás va detrás de "Por qué". Excepción: P17 es un documento, no una pantalla de lectura rápida.
- **Una frase propia como titular** de P09, P11 y P13: la frase del hogar (`phrase.household`) entre comillas, 20 px, sobre el contenido. La cifra protagonista sigue siendo la de la pantalla.
- Sin urgencia artificial, sin contadores de pérdida en las pantallas de seguro, sin "no te preocupes".
- Segunda persona del plural ("vosotros") para el hogar; singular ("tú") cuando responde una sola persona (modo individual y turnos de pareja).
- **Formato monetario (BASES §16, corrige §14):** ES "3.240 $". Siempre dólares. Todo importe sale de `content/es.js`. Solo español, sin interruptor de idioma (BASES §14).
- **Años:** nunca deslizador. Chips por década (2020s, 2030s... 2070s) más botones −/+ de 44 px para ajustar el año. Saldos: campo numérico (P16); P01 es la excepción de importe (ver P01).
- Términos de EE. UU. en inglés con subrayado punteado y glosa al tocar (glosario.md): en pantallas del núcleo solo aparecen "umbrella" (glosa 6) y "under insured" (glosa 9); la glosa del núcleo se puede recortar a esos 2 términos (BASES §17). Si sobra tiempo, los 5 términos (529, umbrella, over-reserved, under insured, investable assets) usan la columna "Novato ES" del glosario; el modo experto usa "Experto ES".
- **Cumplimiento (BASES §19):** (1) pie fijo en todas las pantallas, con este texto literal: "Esto os ayuda a entender el plan de vuestro asesor. No es consejo nuevo ni lo cambia. Antes de mover dinero, hablad con vuestro asesor." (2) Las propuestas se redactan "Vuestro plan propone…", sin imperativos ("Pagad", "Transferid"). (3) P15 lleva la etiqueta "Escrito con IA a partir de vuestro plan. Las cifras son las del plan". (4) El botón "Hablarlo con una persona" está siempre visible.
- **Ejemplos:** toda cifra de maqueta que no sea del plan (1.800 $, 2036, 2038, 2034, 2031) se rotula "ejemplo" en la maqueta y en la pantalla de demo.

### 0.2 Layout base (móvil 390 px de ancho)
```
+--------------------------------------+  390 px
| Novato|Experto          [?] Hablarlo |  barra superior 56 px (sin interruptor de
+--------------------------------------+  idioma: solo español; el inglés es "solo diseñado")
|                                      |
|            contenido                 |  gutter 20 px; scroll vertical solo si hace falta
|                                      |
+--------------------------------------+
| [ botón principal, 100 % ancho, 52px]|  zona del pulgar, sticky abajo
|        enlace secundario             |
| pie fijo de cumplimiento (§0.1)      |
+--------------------------------------+
```
- Botón "Hablarlo con una persona" (BASES §2 y §19), siempre visible en la barra superior de todas las pantallas; abre un modal fijo con el texto: "Si queréis hablarlo con una persona de Sherpas, os ayudamos a pedir cita." Botones: "Pedir cita" y "Seguir aquí". **En la demo, "Pedir cita" abre la hoja del asesor (P17) con el aviso "Esto es lo que recibiría vuestro asesor"; no envía nada** (BASES §16).
- Todos los controles táctiles miden al menos 44 px.
- Interruptor Novato/Experto: arriba, visible en todo el ciclo; cambia el mismo texto en vivo (sin recarga, sin transición de página, solo cross-fade 150 ms). Valor por defecto: Novato. Se fija en P03 y se puede cambiar en cualquier momento.
- Animación permitida solo en las pantallas de revelación (P02-R, P07, P08). Resto: sin animación salvo transición de pantalla (slide 200 ms).

### 0.3 Estado compartido (clave `state`, localStorage + memoria del backend; el enlace "día N" lleva `?sid=`)
```json
{
  "sid": "string",
  "lang": "es",
  "level": "novato|experto",
  "mode": "pareja|individual",
  "members": [{"id":"A","name":"Timothy"},{"id":"B","name":"Melanie"}],
  "phrase": {"A":"", "B":"", "household":""},
  "guesses": {
    "jurado_fecha": {"value":2031,"conf":"seguro|dudo|noSe"},
    "card_cost":    {"A":{"value":0,"conf":""}},
    "card_date":    {"A":{"value":0,"conf":""}, "B":{"value":0,"conf":""}},
    "life_cover":   {"A":{"value":"","conf":""}, "B":{"value":"","conf":""}}
  },
  "branch": {"card":"acierta|falla","life":"falla"},
  "ladder": {"order":["card","life","umbrella"],"scoreShown":62,"firstStep":{"when":"2026-11-16T19:00","done":false}},
  "day3": {"source":"ia|fijo","questions":["","",""],"asked":[]},
  "day7": {"balance":null,"barrier":{"A":null,"B":null}},
  "advisorSheet": {"hiddenName":{"A":false,"B":false},"approved":false},
  "createdAt":"ISO"
}
```
(Los valores `2031` y `2026-11-16` son solo ejemplo de forma; no son datos del caso. `card_cost` solo existe para A: en pareja no se repite el coste anual, BASES §16.)

### 0.4 Datos y fórmulas de referencia (todas desde el JSON; **la IA nunca calcula**)
| Símbolo | Valor | Origen (BASES) |
|---|---|---|
| `CARD_BAL` | 18.000 $ | `profile.liabilities[0].balance` |
| `CARD_APR` | 18 % | `profile.liabilities[0].interest_rate` |
| `CARD_COST_YEAR` | 3.240 $ = 18 % × 18.000 | derivado (§7) |
| `CARD_PAY_MONTH` | 300 $/mes; intereses 270 $/mes | `key_metrics.debtManagement.creditCardDebt.ccPaymentEqualToInterestRate` (270) |
| `CARD_PAYOFF` | septiembre de 2039 | `...creditCardDebt.ccPayoffDate` |
| `CASH` | 150.000 $ | `profile.accounts[0].balance` |
| `CASH_RATE` | 0,1 % (`currentCashBalance[1][4]` = 0.001 en `investment-analysis.json`) | §7 |
| `CASH_YIELD_YEAR` | ~150 $ = 0,1 % × 150.000 | derivado |
| `LIFE_NOW` | 250.000 $ = 140.000 + 110.000 | `...lifeInsuranceAmountClient` + `coClient` |
| `LIFE_MIN` | 1.350.000 $ = 750.000 + 600.000 | `...clientMinRecommendedCoverage` + `coClient` |
| `EXP_YEAR` | 112.774 $ | `key_metrics.ratios.investableAssetLevel.annualExpenses` |
| `LIFE_YEARS_NOW` | 2,2 → se muestra "unos 2 años" | `LIFE_NOW / EXP_YEAR` |
| `LIFE_YEARS_MIN` | 12,0 → "unos 12 años" | `LIFE_MIN / EXP_YEAR` |
| Notas | 60 hoy; ver tabla de la escalera (P12) | `score.top_moves[0..2].score_after`; `score.combined_moves[0..3].score_after` |
| Esfuerzo | tarjeta **medio**, seguro de vida **bajo**, umbrella **bajo** | `score.top_moves[0..2].effort` (BASES §16) |
| Umbrella | recomendado 1.000.000 $, no tienen | `...umbrellaMinRecommendedCoverage`; `...hasUmbrellaPolicy` |
| Primer paso | pagar 6.800 $ de la tarjeta; queda 11.200 $ | `top_moves[0].target_amount` = 11.200 (saldo que queda) |
| Proyección 2079 | 16,1 M$ en 2079 = 3,36 M$ de hoy | `projections.yearly[]` buscando `year` = 2079: `net_worth`, `net_worth_todays_dollars` |
| Hijos | Liam (6), Josh (3) | BASES §6.2 |
| Perfiles | Timothy Growth, Melanie Moderate | `case.household[i].risk_profile` |

**Umbrales y ramas de reacción (los clasifica el código, no la IA; BASES §16).**
- `error_rel = |guess − real| / real` para cifras. Cifras: `error_rel ≤ 20 %` = "cerca"; `> 50 %` = "lejos".
- Fechas (real = 2039): error ≤ 2 años = "cerca"; > 6 años = "lejos". Entre 3 y 6 años, intermedio.
- La rama la decide **error + seguridad**, no el acierto. Solo hay 2 ramas:
  - **Falla estando seguro:** `conf = seguro` y error fuera de "cerca".
  - **Acierta:** el resto (cerca con cualquier confianza, y respuestas con duda). "Acierta con duda" se une a "acierta" (BASES §17).

---

## Índice de pantallas (ids estables P01-P17; algunas se fusionan)

| Id | Pantalla |
|---|---|
| P01 | Gancho + contador + primera pregunta (coste anual tarjeta) |
| P02 | Pregunta al jurado (solo demo): P02-Q, P02-R |
| P03 | Quién sois (pareja/individual, frase propia, novato/experto) |
| P04 | Modo pareja, turno de cada uno: **un solo componente** (absorbe P06) |
| P05 | Modo pareja, pantalla opaca "pásale el móvil" |
| P06 | (fusionada en P04: mismo componente con el segundo miembro) |
| P07 | Modo pareja, revelación + perfiles de riesgo |
| P08 | Ciclo tarjeta: revelación y reacción (2 ramas: P08-a, P08-b) |
| P09 | Ciclo tarjeta: palanca (test opcional) |
| P10 | (fusionada en P11: hoja inferior de aviso y permiso) |
| P11 | Ciclo seguro: hoja P10, pregunta, una cifra, palanca |
| P12 | Escalera (incluye el "Mapa" de BASES §6.1 y la tarjeta de lectura 2079) |
| P13 | Primer paso con "cómo se hace" |
| P14 | (fusionada en P17: cabecera "creíais X, ahora sabéis Y") |
| P15 | Día 3 |
| P16 | Día 7 |
| P17 | Cierre + hoja del asesor |

(Pantallas reales a construir: 12 componentes. Orden de flujo en demo: P01 → P02 → P03 → P04-P05-P04 → P07 → P08-P09 → P11 (con P10) → P12 → P13 → P17; P15/P16 por enlace. El "momento wow" de BASES §10 abre con P01 y P02.)

---

## P01. Gancho + contador + primera pregunta

**Propósito.** En 10 s, sin texto largo: que vean el dinero que se pierde y se comprometan con una marca táctil (coste anual de la tarjeta). Esa marca se guarda como adivinanza del ciclo tarjeta (P08). **Una sola cifra: el contador.**

**Layout.**
```
+--------------------------------------+
|Novato|Experto            [Hablarlo]|
|                                      |
|  Dinero parado        [|.]  (barra)  |
|  Deuda de tarjeta     [||||||||]     |
|                                      |
|   Un año, en 10 segundos             |
|        ?.??? $   <- contador oculto  |
|                                      |
|  ¿Cuánto os cuesta la tarjeta        |
|  al año?                             |
|  0 ------------------- 18.000 $      |
|  (sin marcador hasta tocar)          |
|  ¿Qué tan seguros estáis?            |
|  [Seguro] [Lo dudo] [Ni idea]        |
+--------------------------------------+
| [        Ver cuánto es         ]     |
+--------------------------------------+
```

**Microcopy.**
- Etiquetas de barras (sin cifras): "Dinero parado" y "Deuda de tarjeta". Las cifras (150.000 $ al 0,1 %; 18.000 $ al 18 %) van detrás de "Por qué".
- Titular: "Un año, en 10 segundos"
- Subtítulo del contador: "Lo que cuesta la tarjeta"
- Pregunta: "¿Cuánto os cuesta la tarjeta al año?"
- Ayuda bajo el control: "Un cálculo a ojo vale. Aquí no hay nota."
- Confianza: "¿Qué tan seguros estáis?" Chips: "Seguro", "Lo dudo", "Ni idea"
- Botón: "Ver cuánto es" (deshabilitado hasta marcar un importe y elegir confianza).
- Estado vacío (sin marcar): botón gris, texto bajo el control: "Toca la barra para contestar."
- Error de carga de datos (`cases/` no disponible): "No hemos podido cargar vuestro plan. Probad de nuevo." Botón "Reintentar". (La app no muestra cifras inventadas.)

**Datos.**
- Barras: `CARD_BAL`, `CARD_APR`, `CASH`, `CASH_RATE` (§0.4). Altura proporcional a importe, no al tipo.
- Contador: **no muestra la cifra antes de contestar** (anclaría la respuesta). Al entrar gira con dígitos borrosos "?.??? $" durante 10 s; al pulsar "Ver cuánto es" se detiene en `CARD_COST_YEAR` (3.240 $) y esa es la revelación de P08. Se llama "un año en 10 segundos" porque a velocidad real el contador apenas se movería. El contador del efectivo (150 $) ya no se muestra: pasa a "Por qué".
- **Control de importe: empieza vacío** (sin marcador ni valor inicial: nada de 9.000 $ de anclaje, BASES §17). Rango 0 a 18.000 $, paso 100 $; el marcador aparece al primer toque sobre la barra, con el valor en vivo y botones −/+ de 44 px (paso 100 $) para afinar con el pulgar.

**Interacciones.**
- Animación del contador arranca al montar; se puede tocar para repetirla (no se repite sola).
- Marcar el importe actualiza el valor en vivo (no se revela nada todavía).
- Elegir chip activa el botón.
- Contador sigue visible y oculto hasta contestar; al revelar, se detiene en la cifra real.

**Estado.** `guesses.card_cost.A = {value, conf}` (quien tiene el móvil; en pareja **no** se repite la pregunta de coste, BASES §16). `level` por defecto "novato".

**Siguiente.** "Ver cuánto es" → P02 (si hay jurado en sala, demo) o P03 (uso normal). `?demo=1` abre P02 antes que P03 (el selector de días de la demo es otro parámetro, `?day=N`; README-APP).

---

## P02. Pregunta al jurado (solo demo)

Es el "momento wow" (BASES §10): un miembro del jurado adivina en el móvil cuándo terminarían los Weah la tarjeta a este ritmo.

### P02-Q. Pregunta

**Layout.**
```
+--------------------------------------+
|  Una pregunta, para ti               |
|                                      |
|  A este ritmo, ¿cuándo terminan      |
|  Timothy y Melanie de pagar          |
|  la tarjeta?                         |
|                                      |
|  [2020s][2030s][2040s]               |
|  [2050s][2060s][2070s]               |
|        [ − ]  2038  [ + ]            |
|        (ejemplo de valor)            |
|  [Seguro] [Lo dudo] [Ni idea]        |
+--------------------------------------+
| [        Enviar mi respuesta     ]   |
+--------------------------------------+
```
**Microcopy.**
- Encabezado: "Una pregunta, para ti"
- Pregunta: "A este ritmo, ¿cuándo terminan Timothy y Melanie de pagar la tarjeta?"
- Apoyo: "Pagan 300 $ al mes. Tú eliges el año." (cifra de apoyo que la pregunta exige: 300 $/mes, `CARD_PAY_MONTH`)
- Botón: "Enviar mi respuesta"
- Vacío: botón deshabilitado, "Elige una década y ajusta el año."

**Datos.** Rango 2026-2079 (`projections.yearly`, 54 años). Respuesta real `CARD_PAYOFF` = septiembre de 2039 (se redondea a año 2039 para comparar). Marcas precargadas de Timothy y Melanie: **respuestas de ejemplo escritas por el equipo**, rotuladas "respuestas de ejemplo" en pantalla (no son datos del plan; BASES §16). Valores de ejemplo usados en la maqueta: Timothy 2031, Melanie 2034.

**Interacción.** Sin deslizador: el chip de década fija el primer año de esa década y −/+ (44 px) mueven de uno en uno; chips de confianza. Al enviar, transición a P02-R.

**Estado.** `guesses.jurado_fecha = {value, conf}`.

### P02-R. Revelación

**Layout (animación permitida aquí).** Una sola cifra: la real. Las marcas son puntos sin cifra grande.
```
+--------------------------------------+
|  Tu marca        (punto azul)        |
|  Timothy  (ejemplo)  (punto)         |
|  Melanie  (ejemplo)  (punto)         |
|  --------------o-------------------- |
|         Septiembre de 2039  <- cifra  |
|  [titular según distancia]           |
+--------------------------------------+
| [   Ahora vosotros        ]          |
+--------------------------------------+
```
**Microcopy.**
- Cifra: "Septiembre de 2039". Las marcas llevan su año en texto pequeño con "(ejemplo)" en Timothy y Melanie ("2031 (ejemplo)", "2034 (ejemplo)").
- Titular según distancia en años a 2039 (umbrales de BASES §16, sin juicio): ≤ 2 años: "Muy cerca." De 3 a 6: "Cerca, pero la fecha real es otra." Más de 6: "Más lejos de lo que parece. La cifra real: septiembre de 2039."
- Los 270 $ de intereses al mes van detrás de "Por qué" (no en la pantalla).
- Botón: "Ahora, los Weah" → P03.
- Texto para el presentador (no visible): no decir porcentaje de acierto de la sala ni "casi nadie lo adivina"; solo con el recuento real de la prueba del martes 17.

**Interacción.** La línea del tiempo anima en 1,2 s: primero tu marca, luego Timothy, Melanie y al final la real (pulso). Sonido: ninguno.

**Estado.** Marca del jurado queda en `guesses.jurado_fecha`: alimenta la plantilla del mensaje real (ver P15).

**Siguiente.** P03.

---

## P03. Quién sois

**Propósito.** Fijar modo (pareja/individual), frase propia y nivel novato/experto en menos de 15 s.

**Layout.**
```
+--------------------------------------+
|  ¿Lo hacéis juntos?                  |
|  [  Sí, los dos   ] [  Solo yo  ]    |
|                                      |
|  En una línea, ¿qué os importa más?  |
|  ( ) Que Liam y Josh lo tengan       |
|      todo resuelto                   |
|  ( ) Dormir tranquilos               |
|  ( ) Dejar de deber                  |
|  ( ) Escribir la mía: [__________]   |
|                                      |
|  ¿Cómo os va esto del dinero?        |
|  [ Soy nuevo en esto ] [ Sé de finanzas ]|
+--------------------------------------+
| [        Empezar          ]          |
+--------------------------------------+
```
**Microcopy.**
- "¿Lo hacéis juntos?" Opciones: "Sí, los dos" / "Solo yo". Ayuda: "Si sois dos, cada uno contesta en secreto y luego lo vemos juntos."
- "En una línea, ¿qué os importa más?" Propuestas (3 + libre): "Que Liam y Josh lo tengan todo resuelto", "Dormir tranquilos", "Dejar de deber". Libre: placeholder "Escríbelo con tus palabras".
- Nivel: "Soy nuevo en esto" / "Sé de finanzas". Ayuda: "Lo podéis cambiar cuando queráis, arriba."
- Botón: "Empezar".
- Vacío: botón deshabilitado hasta elegir modo, frase y nivel; mensaje: "Falta elegir una opción."
- Frase libre vacía con "Escribir la mía" elegido: "Escribe una línea o elige una de las propuestas."

**Datos.** Nombres Timothy y Melanie del caso (`case.household[]`). Hijos Liam (6) y Josh (3).

**Interacciones.** Elegir "Solo yo" salta P04, P05 y P07 (va a P08). La frase se guarda como frase del hogar y se usa de titular en P09, P11 y P13. En pareja cada uno puede añadir una propia en su turno (P04, campo opcional "Tu frase"); si no, vale la del hogar.

**Estado.** `mode`, `phrase.household`, `level`.

**Siguiente.** Pareja → P04. Individual → P08.

---

## P04. Modo pareja: turno de cada uno (un componente, antes P04 y P06)

**Propósito.** Un único componente `TurnoPareja(miembro)` que se monta dos veces: Timothy (1 de 2) y, tras P05, Melanie (2 de 2). Cada uno contesta en secreto la fecha de fin de la tarjeta. Se oculta toda respuesta en pantalla al terminar. (En pareja solo se adivina la fecha: el coste anual no se repite, BASES §16.)

**Layout.**
```
+--------------------------------------+
| Turno de [Timothy]  (1 de 2)         |
|                                      |
| A este ritmo, ¿cuándo termináis      |
| de pagar la tarjeta?                 |
| [2020s][2030s][2040s]                |
| [2050s][2060s][2070s]                |
|        [ − ]  2034  [ + ]            |
|        (ejemplo de valor)            |
| [Seguro] [Lo dudo] [Ni idea]         |
+--------------------------------------+
| [  Guardar y tapar la pantalla  ]    |
+--------------------------------------+
```
**Microcopy.**
- Encabezado: "Turno de Timothy (1 de 2)" / "Turno de Melanie (2 de 2)"
- Aviso: "Melanie, no mires. Timothy, contesta tú solo." / "Timothy, no mires. Melanie, contesta tú sola."
- Pregunta: "A este ritmo, ¿cuándo termináis de pagar la tarjeta?"
- Botón (turno 1): "Guardar y tapar la pantalla". Botón (turno 2): "Guardar y ver la revelación".
- Vacío: "Elige una década y ajusta el año."
- Opcional (si sobra): "¿Qué crees que ha contestado Timothy?" (BASES §6.3, extra no núcleo; no construir si no hay tiempo).

**Datos.** Igual que P02-Q. Control de año: chips por década + −/+ de 44 px (sin deslizador).

**Interacción.** Al guardar, la respuesta se guarda y la pantalla pasa con slide (turno 1 → P05; turno 2 → P07).

**Estado.** `guesses.card_date.A` (turno 1) y `.B` (turno 2) = `{value, conf}`. La respuesta de A no se muestra más.

**Siguiente.** Turno 1 → P05. Turno 2 → P07.

---

## P05. Pantalla opaca: "pásale el móvil"

**Layout.**
```
+--------------------------------------+
|                                      |
|            (pantalla opaca,          |
|             color liso, sin datos)   |
|                                      |
|        Pásale el móvil a Melanie     |
|                                      |
+--------------------------------------+
| [   Soy Melanie, seguir   ]          |
+--------------------------------------+
```
**Microcopy.**
- Titular: "Pásale el móvil a Melanie"
- Cuerpo: "Todavía no hay nada que ver."
- Botón: "Soy Melanie, seguir"
- Sin enlace de salida ni menú: la barra superior se oculta para no mostrar nada, salvo el botón "Hablarlo con una persona" y el pie fijo (BASES §19).

**Datos.** Ninguno (ni el nombre del jugador anterior ni su respuesta).

**Interacción.** Botón activo tras 1 s para evitar toques accidentales. Si se recarga la página en esta pantalla, el estado vuelve a P05 (no a P04) para no exponer la respuesta de A.

**Estado.** `flow.step = "pairB"`.

**Siguiente.** P04 (turno de Melanie).

---

## P06. Fusionada en P04

El turno de Melanie es el mismo componente `TurnoPareja` con `miembro = B` (ver P04). Se conserva el id solo para no romper referencias de BASES y de PITCH.

---

## P07. Modo pareja: revelación + perfiles

**Propósito.** Mostrar juntos lo que cada uno cree, en orden fijo: coincidencias, diferencia, fecha real (BASES §6.3). **Sin punto intermedio** (BASES §17). Una sola cifra visible cada vez: al avanzar, la cifra del paso anterior se sustituye por la nueva. Al final, los perfiles de riesgo declarados.

**Layout.**
```
+--------------------------------------+
| Lo que cada uno pensó                |
| Timothy ----o------------------      |
| Melanie ------------o------------    |
|                                      |
|  [paso 1] En qué coincidís           |
|  [paso 2] Vuestra diferencia: N años |
|  [paso 3] Septiembre de 2039         |
|  [paso 4] Timothy: Growth ·          |
|           Melanie: Moderate          |
+--------------------------------------+
| [        Seguir          ]           |
+--------------------------------------+
```
**Microcopy.** (los pasos aparecen con toque, uno por vez)
1. "En esto coincidís: los dos creéis que [la tarjeta se acaba antes de 2079 / ...]." Regla: coincidencia = ambos con la misma confianza, o ambos del mismo lado de 2039 (antes/después). Si no hay coincidencia: "Los dos habéis contestado sin ver la respuesta del otro. Eso ya es un buen comienzo."
2. "Pensáis distinto en esto: Timothy dice [AAAA] y Melanie dice [AAAA]." Cifra protagonista: "N años" de distancia.
3. "La cifra del plan: septiembre de 2039." (sustituye a N como cifra protagonista; sin 270 $ en pantalla, va en "Por qué")
4. "Timothy: Growth · Melanie: Moderate." con la línea: "Es el perfil que cada uno declaró en su plan. No es una etiqueta: es un punto de partida para hablarlo." (`case.household[i].risk_profile`; sin números)
- Cierre: "Pensar distinto es normal. Lo útil es verlo."
- Botón: "Seguir" → P08. Activo tras el paso 4.
- Caso borde: si ambos coinciden exactamente: paso 2 se sustituye por "Habéis contestado lo mismo: [AAAA]."

**Datos.** `guesses.card_date.A/B` frente a `CARD_PAYOFF` (2039); perfiles de `case.household[i].risk_profile`.

**Interacción.** Cada toque revela un paso (animación permitida solo aquí).

**Estado.** Se guarda `pairDiffYears = |A − B|` (derivado), necesario para P17 ("en qué no coincidís").

**Siguiente.** P08.

---

## P08. Ciclo tarjeta: revelación y reacción

**Propósito.** Mostrar su marca (de P01) frente a la real (3.240 $) y reaccionar según rama. **Cifra protagonista: 3.240 $; texto de rama de ≤ 25 palabras; el resto detrás de "Por qué".**

**Layout común.**
```
+--------------------------------------+
| Vuestra marca: 1.800 $ (ejemplo) (o) |
| Lo que cuesta de verdad              |
|        3.240 $ al año                |
| ---------------------------------    |
| [titular + texto de la rama, ≤25 pal.]|
|  [?] Por qué                         |
+--------------------------------------+
| [        Ver qué hacer     ]         |
+--------------------------------------+
```
- Revelación animada (única): la marca del usuario y la real sobre la misma barra. En pareja se muestra la única marca de P01 (coste anual no se repite por miembro, BASES §16).
- "Por qué" abre un panel con: "De dónde sale: 18 % × 18.000 $ = 3.240 $", "De los 300 $ que pagáis cada mes, 270 $ son solo intereses; la deuda termina en septiembre de 2039", y "Mientras tanto, 150.000 $ en efectivo al 0,1 % dan unos 150 $ al año: dinero parado y deuda cara a la vez." En modo experto, además la ruta `profile.liabilities[0]`.
- Interruptor Novato/Experto actúa sobre el texto de la rama.

### P08-a. Acierta (cerca con cualquier confianza, o con duda)
- Titular: si está cerca y con seguridad: "Lo habéis clavado." Con duda: "Esta cifra sorprende a mucha gente."
- Novato: "Pagáis 270 $ al mes solo de intereses." (cifra de apoyo)
- Experto: "18 % APR, 300 $/mes, amortización completa en septiembre de 2039." (cifras de apoyo)
- Cierre: "Vamos al grano: lo que pesa es lo que hacéis ahora."
- Siguiente: P09.

### P08-b. Falla estando seguro (explicación del supuesto)
- Titular: "Aquí el plan sorprende, no vosotros."
- Novato: "Con un 18 % al año, casi todo lo que pagáis cada mes son intereses y la deuda apenas baja. Mientras, el efectivo apenas rinde."
- Experto: "Suele fallar mirar el saldo y no el tipo: al 18 % APR, 300 $/mes apenas bajan el principal. Mientras, el efectivo apenas rinde."
- Línea del supuesto con las cifras (150.000 $ al 0,1 %, unos 150 $ al año): en "Por qué", que en esta rama se ofrece con el enlace resaltado.
- Tono: nunca "incorrecto"; prohibido "casi nadie lo adivina".
- Siguiente: P09.

**Datos.** `CARD_COST_YEAR` (3.240), `CARD_PAY_MONTH` (300), intereses mensuales (270), `CARD_PAYOFF`, `CASH_YIELD_YEAR` (150), `CASH_RATE`.

**Estado.** `branch.card` ("acierta" o "falla"); `guesses.card_cost.*` leída, no modificada.

**Siguiente.** P09.

---

## P09. Ciclo tarjeta: palanca (test opcional)

**Propósito.** Mostrar que la cifra se mueve al momento (palanca). El test de comprobación es opcional y queda fuera de los 5 minutos. **Titular: la frase propia del hogar. Cifra protagonista: la nota 62.**

**Layout.**
```
+--------------------------------------+
|  «Que Liam y Josh lo tengan          |
|   todo resuelto»   (frase propia)    |
|                                      |
|  Si pagáis 6.800 $ de la tarjeta     |
|  con el efectivo...                  |
|     Nota  60  ->  62                 |
|                                      |
|  Comprobar lo que habéis visto       |
|  (opcional)                          |
+--------------------------------------+
| [        Seguir          ]           |
+--------------------------------------+
```
**Microcopy.**
- Titular: la frase propia (`phrase.household`) entre comillas. Si no hay, "Vuestro plan".
- Palanca: "Mover 6.800 $ cambia vuestra nota."
- Cuerpo: "Si pagáis 6.800 $ de la tarjeta con el efectivo, la nota pasa de 60 a 62 y quedan 11.200 $ por pagar." (cifras de apoyo: 6.800 $, 11.200 $)
- Enlace: "Comprobar lo que habéis visto (opcional)" abre la pregunta: "Con lo que acabáis de ver, ¿qué pasa si pagáis 6.800 $ de la tarjeta?"
  - (a) "Se quita lo que frenaba la nota" (correcta)
  - (b) "Nada cambia"
  - (c) "La deuda sube"
- Feedback acierta: "Eso es. Quitar ese tope sube la nota a 62."
- Feedback otra opción: "No es exactamente eso. Pagar 6.800 $ quita el tope de la nota: pasa de 60 a 62."
- Botón: "Seguir" (activo siempre; el test no bloquea).
- Experto: añade debajo "`score.top_moves[0]`: lifts_a_cap = true".

**Datos.** `score.top_moves[0].score_after` = 62, `score_before` = 60, `target_amount` = 11.200; 6.800 $ del plan (BASES §6.4).

**Estado.** `checks.card = {answer, ok}` (solo si se responde).

**Siguiente.** P11 (que abre con la hoja de P10).

---

## P10. Fusionada en P11 (hoja inferior)

El aviso y permiso del tiempo 1 (BASES §6.2.7) es una hoja inferior que se abre sobre P11-Q al entrar. Ver P11.

---

## P11. Ciclo seguro: aviso, pregunta, una cifra, palanca

**Propósito.** Adivinar qué protege (no el riesgo personal), recibir una sola cifra en años y ver la palanca. MVP: una sola rama ("falla estando seguro"); cualquier respuesta usa este mismo texto. **Titular: la frase propia del hogar.**

### P11-S. Hoja inferior de aviso y permiso (antes P10)

Se abre al entrar, sobre P11-Q, sin imágenes de muerte, sin contadores, sin urgencia.
```
+--------------------------------------+
|  (P11-Q atenuada detrás)             |
|======================================|
|  Lo siguiente no es fácil,           |
|  pero tiene arreglo.                 |
|  Hablamos de proteger a Liam y a     |
|  Josh. ¿Lo vemos ahora o en un rato? |
|  [    Lo vemos ahora     ]           |
|     Saltar por ahora                 |
+--------------------------------------+
```
- Titular de la hoja: "Lo siguiente no es fácil, pero tiene arreglo."
- Cuerpo: "Hablamos de proteger a Liam y a Josh. ¿Lo vemos ahora o en un rato?"
- Botón principal: "Lo vemos ahora" (cierra la hoja y deja P11-Q)
- Enlace siempre visible: "Saltar por ahora". Confirmación breve: "Sin problema. Lo dejamos guardado en la escalera." (→ P12 con el peldaño seguro marcado "pendiente").
- Estado: `life.permission = "ahora|luego"`.

### P11-Q. Pregunta (cerrada)

**Layout.**
```
+--------------------------------------+
| «Que Liam y Josh lo tengan           |
|  todo resuelto»  (frase propia)      |
| ¿Qué tienen Liam (6) y Josh (3)      |
| asegurado si a uno de vosotros le    |
| pasara algo?                         |
|  ( ) Casi nada                       |
|  ( ) Unos meses de gastos            |
|  ( ) Un par de años de gastos        |
|  ( ) Más de diez años de gastos      |
|  [Seguro] [Lo dudo] [Ni idea]        |
+--------------------------------------+
| [        Ver la respuesta     ]      |
+--------------------------------------+
```
**Microcopy.**
- Titular: frase propia entre comillas.
- Pregunta: "¿Qué tienen Liam (6) y Josh (3) asegurado si a uno de vosotros le pasara algo?"
- Opciones: "Casi nada" / "Unos meses de gastos" / "Un par de años de gastos" / "Más de diez años de gastos". (Opciones en palabras; no usan cifras fuera de BASES.)
- Prohibido preguntar fechas o probabilidades de muerte.
- Botón: "Ver la respuesta".
- Vacío: botón gris; "Elige una opción."

### P11-R. Una cifra y palanca (tiempo 3 y 4)

**Layout.**
```
+--------------------------------------+
| «Que Liam y Josh lo tengan           |
|  todo resuelto»                      |
| Hoy vuestro seguro cubriría          |
|        unos 2 años                   |
|   de vuestros gastos.                |
| El mínimo recomendado: unos 12.      |
|                                      |
| Pedir presupuestos tarda minutos     |
| y no compromete.                     |
|  [ Guardar para luego ]              |
+--------------------------------------+
| [   Lo vemos juntos ahora   ]        |
+--------------------------------------+
```
**Microcopy.**
- Cifra protagonista: "unos 2 años" (`LIFE_YEARS_NOW`).
- Titular de la cifra: "Hoy vuestro seguro cubriría unos 2 años de vuestros gastos."
- Apoyo: "El mínimo recomendado, unos 12."
- "De dónde sale" (panel "¿Por qué?"): "Novato: lo que tenéis asegurado entre los dos (250.000 $) dividido entre lo que gasta vuestro hogar al año (112.774 $)." Experto: "`(140.000 + 110.000) / 112.774 = 2,2`; mínimo `(750.000 + 600.000) / 112.774 = 12,0`."
- Palanca: "Pedir presupuestos tarda minutos y no compromete."
- Pregunta de pareja: "¿Lo veis juntos o lo guardáis para luego?"
- Botones: "Lo vemos juntos ahora" / "Guardar para luego".
- Etiqueta "Under insured" subrayada con glosa: "Tu cobertura es menor de la que necesita tu situación."
- Variante de texto según respuesta (solo primera línea): si la opción elegida fue "Un par de años de gastos": "Habéis estado cerca. Hoy cubriría unos 2 años." Cualquier otra: "Hoy cubriría unos 2 años." Nunca "incorrecto".
- Tratamiento de la cifra "12": se dice "recomendado", no "obligatorio".
- Prohibido: contador de pérdida, imágenes, "no te preocupes".

**Datos.** `LIFE_YEARS_NOW` = (140.000 + 110.000) / 112.774 = 2,2 → "unos 2"; `LIFE_YEARS_MIN` = 1.350.000 / 112.774 = 12,0 → "unos 12". La app calcula, nunca la IA. Seguro objetivo exacto: no dar cifra (BASES §11, 485.000 vs 491.800); hablar del rango.

**Estado.** `guesses.life_cover.A/B`; `branch.life = "falla"`; `life.decision = "juntos|luego"`.

**Siguiente.** P12.

---

## P12. Escalera (incluye el "Mapa" de BASES §6.1)

**Propósito.** Que ordenen los pasos y vean nota y esfuerzo. Los saltos son acumulados (BASES §6.4). **Cifra protagonista: nota "62 de 78 posibles"** (cambia según el orden). Hace de "Mapa": el plan entero en una pantalla (nota 60 hoy, qué la frena, escalera).

**Layout.**
```
+--------------------------------------+
|     Nota   62  de 78 posibles        |
|  ----------------------------------  |
|  Este orden:                         |
|  1. Pagar 6.800 $ de la tarjeta      |
|     esta semana · esfuerzo: medio    |
|     [ Subir ] [ Bajar ]   (44 px)    |
|  2. Seguro de vida                   |
|     este mes · esfuerzo: bajo        |
|     [ Subir ] [ Bajar ]              |
|  3. Seguro umbrella                  |
|     este trimestre · esfuerzo: bajo  |
|     [ Subir ] [ Bajar ]              |
|  (arrastrar con [=] también vale)    |
|                                      |
|  Lectura: 16,1 M$ en 2079 =          |
|  3,36 M$ de hoy                      |
+--------------------------------------+
| [   Empezar por el primero  ]        |
+--------------------------------------+
```
**Microcopy.**
- Titular: "Vuestro orden"
- Métrica: "Nota 62 de 78 posibles" (cifra protagonista).
- Subtítulo: "Usad Subir y Bajar para cambiar el orden. También podéis arrastrar."
- Peldaño 1: "Pagar 6.800 $ de la tarjeta con el efectivo". Plazo: "Esta semana". Esfuerzo: "medio". Etiqueta bajo: "Queda en 11.200 $".
- Peldaño 2: "Seguro de vida". Plazo: "Este mes". Esfuerzo: "bajo".
- Peldaño 3: "Seguro umbrella" (glosa 6: "Seguro extra de responsabilidad civil por encima del de casa y coche, para demandas grandes."; recomendado 1.000.000 $). Plazo: "Este trimestre". Esfuerzo: "bajo".
- Esfuerzo desde `score.top_moves[i].effort`: tarjeta medio, seguro de vida bajo, umbrella bajo (BASES §16).
- Botones Subir/Bajar: **44 px**, control principal; el arrastre con el asa "=" es opcional (WCAG 2.5.7). La primera fila no tiene "Subir" activo y la última no tiene "Bajar" activo. Al mover, `aria-live="polite"` anuncia: "Seguro de vida, ahora en posición 1. Nota 60 de 78 posibles."
- Mensaje al reordenar (la app no prohíbe, enseña): si el seguro va antes que la tarjeta: "Con el seguro primero, la nota se queda en 60. Sin la tarjeta, el seguro solo no la mueve." Con los dos seguros y sin la tarjeta: "Sin la tarjeta, aunque hagáis los dos seguros, 60." Botones del mensaje: "Entendido" / "Volver al orden anterior".
- **Tarjeta de lectura (sin ciclo, BASES §17):** "16,1 M$ en 2079 = 3,36 M$ de hoy". Texto de apoyo: "Las cifras grandes del futuro valen menos hoy." Fuente: `projections.yearly[]` con `year` = 2079 (`net_worth` 16.115.848 y `net_worth_todays_dollars` 3.359.400); se busca por `year`, no por posición. Se muestra debajo de la lista, en texto pequeño, sin pregunta.
- Peldaño "hablarlo" no se añade para Weah (solo si la nota no refleja un problema grave; N/A aquí).
- Estado vacío: no existe (siempre hay 3 peldaños).
- Error de carga de `score`: "No hemos podido cargar las notas. Mostramos el orden sin ellas." (se oculta la métrica; el reorden sigue funcionando). Si falta una combinación: "sin dato del plan"; nunca se calcula.

**Datos (nota mostrada tras el paso 1 / 2 / 3, según el orden).** Las 4 combinaciones están en `score.combined_moves` (BASES §16); los pasos sueltos en `top_moves[i].score_after`. Nada se calcula.

| Orden | 1.º / 2.º / 3.er paso | Fuente |
|---|---|---|
| tarjeta, vida, umbrella | 62 / 73 / 78 | `top_moves[0]` (62); `combined_moves[1]` (73); `combined_moves[0]` (78) |
| tarjeta, umbrella, vida | 62 / 62 / 78 | `top_moves[0]`; `combined_moves[2]` (tarjeta + umbrella = 62); `combined_moves[0]` |
| vida, tarjeta, umbrella | 60 / 73 / 78 | `top_moves[1]` (60); `combined_moves[1]`; `combined_moves[0]` |
| vida, umbrella, tarjeta | 60 / 60 / 78 | `top_moves[1]`; `combined_moves[3]` (vida + umbrella sin tarjeta = 60); `combined_moves[0]` |
| umbrella, tarjeta, vida | 60 / 62 / 78 | `top_moves[2]` (60); `combined_moves[2]`; `combined_moves[0]` |
| umbrella, vida, tarjeta | 60 / 60 / 78 | `top_moves[2]`; `combined_moves[3]`; `combined_moves[0]` |

Las 4 combinaciones: tarjeta + vida + umbrella 78; tarjeta + vida 73; tarjeta + umbrella 62; vida + umbrella sin tarjeta 60.

**Interacción.** Subir/Bajar (principal) o arrastre con el asa "="; al soltar recalcula con la tabla fija (no con la IA) y actualiza el `aria-live`. Toque sobre un peldaño abre su resumen de una línea. Un peldaño completo no se puede borrar.

**Estado.** `ladder.order`, `ladder.scoreShown`.

**Siguiente.** "Empezar por el primero" → P13.

---

## P13. Primer paso con "cómo se hace"

**Propósito.** Compromiso duro solo del primer peldaño: día, hora y pasos concretos. **Titular: la frase propia del hogar. Cifra protagonista: 6.800 $.**

**Layout.**
```
+--------------------------------------+
|  «Que Liam y Josh lo tengan          |
|   todo resuelto»   (frase propia)    |
|  Vuestro primer paso                 |
|        6.800 $                       |
|  de la tarjeta, con el efectivo      |
|                                      |
|  ¿Cuándo lo hacéis?                  |
|  [ día: lun 16 nov ] [ hora: 19:00 ] |
|  (ejemplo; por defecto: el próximo   |
|   lunes a las 19:00)                 |
|                                      |
|  Vuestro plan propone:               |
|  1) Entrar en el banco donde está    |
|     el efectivo.                     |
|  2) Transferir 6.800 $ a la tarjeta  |
|     Chase.                           |
|  3) Volver y marcar "hecho" con el   |
|     nuevo saldo.                     |
+--------------------------------------+
| [    Es nuestro compromiso   ]       |
+--------------------------------------+
```
**Microcopy.**
- Titular: la frase propia entre comillas; debajo, "Vuestro primer paso".
- Cifra: "6.800 $"
- Subtítulo: "Pagarlos de la tarjeta con el efectivo. Quedan 11.200 $." (cifra de apoyo)
- Selector: "¿Cuándo lo hacéis?" (día y hora). **Valor por defecto: el próximo lunes a las 19:00** (efecto "nuevo comienzo", BASES §16); editable. "lun 16 nov" es el ejemplo de la maqueta, no un dato.
- Botón secundario (si sobra): "Añadir a mi calendario (.ics)" (.ics en "si sobra tiempo").
- "Cómo se hace" (texto fijo, escrito a mano, BASES §6.4), con la entradilla "Vuestro plan propone:" (BASES §19):
  1. "Entrar en el banco donde está el efectivo."
  2. "Transferir 6.800 $ a la tarjeta Chase."
  3. "Volver y marcar 'hecho' con el nuevo saldo."
- Alternativa (sin efecto en la nota): "Si queréis pagarla entera, también se puede. La app no calcula su efecto en la nota." (BASES §6.4: no inventar efecto.)
- Botón principal: "Es nuestro compromiso"
- Texto tras confirmar: "Guardado. Volveremos el día 3 con vuestras dudas."
- Error: si falta fecha u hora: "Elegid un día y una hora."

**Datos.** 6.800 $ (`top_moves[0]`), 11.200 $ (`target_amount`), banco "Chase" (BASES §6.4).

**Interacción.** Confirmar guarda el compromiso. No hay confeti ni puntos (BASES §12). En el pitch, el día 7 se cuenta en una frase sobre esta pantalla, sin abrir P16 (BASES §17).

**Estado.** `ladder.firstStep = {when, done:false}`.

**Siguiente.** P17.

---

## P14. Fusionada en P17 (cabecera)

El cierre "creíais X, ahora sabéis Y" es la cabecera de P17 (ver abajo). Se conserva el id solo para referencias.

---

## P15. Día 3

**Propósito.** Volver con dudas generadas a partir de sus fallos (IA visible en esta página, pregenerada), tres preguntas sugeridas. Mensaje real durante el pitch con enlace "día 3" (BASES §0).

**Layout.**
```
+--------------------------------------+
|  Día 3                               |
|  Desde lo que contestasteis:         |
|                                      |
|  [Titular generado: 1 frase]         |
|  [Porque: 1-2 frases]                |
|                                      |
|  ¿Alguna de estas os suena?          |
|  [Pregunta 1]                        |
|  [Pregunta 2]                        |
|  [Pregunta 3]                        |
|  [ Escribir otra ]                   |
+--------------------------------------+
| [      Ver mi escalera      ]        |
+--------------------------------------+
```
**Microcopy.**
- Encabezado: "Han pasado 3 días."
- Subtítulo con etiqueta: "Preguntas que suelen surgir después de esto" + etiqueta pequeña "Escrito con IA a partir de vuestro plan. Las cifras son las del plan" (visible; si la salida fue de respaldo: "Texto del equipo"; BASES §19).
- Botón: "Ver mi escalera"; secundario: "Escribir otra pregunta".
- Pregunta tocada → respuesta fija en un modal de 2 frases (no chat libre, BASES §12).
- Estado vacío: no existe (siempre hay 3).
- Error de IA o validación fallida: se muestra el **texto de respaldo fijo** (abajo) sin aviso de error.

**Entrada a la IA (BASES §9).** Cifras ya calculadas + persona + respuesta y seguridad + rama + frase propia. Salida JSON: `{titular, porque, detalle, preguntas_sugeridas[3]}`. Sistema: "Usa solo estas cifras; nunca inventes números. Tono: el plan sorprende, no la persona. Máximo 2 frases por campo." **La IA solo escribe esta página, y se pregenera antes del pitch** (BASES §17); no escribe el mensaje.

**Validación.** Cada número del texto generado debe estar en el conjunto de entrada permitido: {3.240, 150, 270, 300, 18.000, 18, 0,1, 150.000, 6.800, 11.200, 60, 62, 73, 78, 2, 12, 2039, 250.000, 1.350.000, 112.774}. Si aparece otro número, o el JSON no tiene los 4 campos, o hay más de 2 frases por campo → texto fijo.

**Texto fijo de respaldo (siempre disponible).**
- Titular: "Mucha gente se queda con dudas justo en esto."
- Porque: "La tarjeta cuesta 3.240 $ al año y el seguro hoy cubriría unos 2 años de gastos."
- Preguntas:
  1. "¿Por qué pagar 300 $ al mes casi no baja la deuda?" (cifras: 300 $, `CARD_PAY_MONTH`)
  2. "¿Qué pasa con el efectivo si pago 6.800 $ de la tarjeta?" (queda 11.200 $: BASES §6.4)
  3. "¿Cuánto tarda pedir presupuestos del seguro de vida?" (respuesta fija: "Minutos, y no compromete.")

**Mensaje real del pitch: plantilla en código, no IA** (BASES §17). Se compone con el año del jurado (`guesses.jurado_fecha.value`), `ccPayoffDate` y 270 $, más el enlace `/d/3?sid=`. Texto de la plantilla: "Marcaste [AAAA]; el plan dice septiembre de 2039. De tus pagos, 270 $ al mes van solo a intereses. Tu día 3: [enlace]." (`[AAAA]` es el año del jurado; sin latencia de IA.)
- **Canal: Telegram Bot** (gratis, sin dominio, push nativo en iPhone y Android); **respaldo ntfy.sh** si Telegram falla en 5 s; último recurso, vídeo de 10 s. Producción: WhatsApp Cloud API con plantillas y opt-in; email (Resend con dominio) de respaldo (BASES §16).

**Datos.** `state.guesses` + rama + `phrase`; cifras de §0.4.

**Interacción.** Enlace con `sid` abre este estado (`/d/3?sid=`) sin login, por HTTPS público; en demo, selector de días (`?day=N`) + botón "Abrir día 3".

**Estado.** `day3 = {source, questions, asked}`.

**Siguiente.** P12 (escalera) o P16 por enlace día 7.

---

## P16. Día 7 (lunes)

**Propósito.** Comprobar si "hecho" es real con un dato verificable: el saldo de la tarjeta. **Cifra protagonista: el saldo escrito.** En el pitch no se abre esta pantalla (BASES §17).

**Layout.**
```
+--------------------------------------+
|  Día 7                               |
|  ¿Cuál es el saldo de la tarjeta     |
|  ahora?                              |
|  [ $ ________ ]  (teclado numérico,  |
|                   inputmode=decimal) |
+--------------------------------------+
| [        Enviar saldo      ]         |
+--------------------------------------+
```
**Microcopy.**
- Titular: "¿Cuál es el saldo de la tarjeta ahora?"
- Ayuda: "Miradlo en la app del banco. Un número exacto, sin redondear."
- Botón: "Enviar saldo".
- Vacío: botón gris; "Escribid el saldo."
- Sin deslizador: **campo numérico** `inputmode="decimal"`, 44 px de alto como mínimo, sin valor inicial.

**Datos.** Saldo inicial `CARD_BAL` (18.000 $). Umbral: 11.200 $ (`top_moves[0].target_amount`).

**Ramas.**
- **Si saldo ≤ 11.200 $** → pantalla de éxito: Titular: "Nota 62." Cuerpo: "Habéis pagado la tarjeta lo que decía el plan. Vuestra nota pasa de 60 a 62." CTA: "Abrir el seguro de vida" → P11 (con la hoja de aviso). (Cifra protagonista: 62.)
- **Si saldo > 11.200 $** → "¿Qué os frena?" con 4 opciones y respuesta distinta a cada persona (en pareja, cada uno contesta por separado en su móvil o por turno):

| Opción | Texto de respuesta |
|---|---|
| "Tengo dudas" | "Es normal. Escribid vuestras dudas y las llevamos a la hoja del asesor. ¿Qué es lo que menos se entiende de la tarjeta?" [campo libre] |
| "No sé cómo hacerlo" | "Os lo explicamos otra vez." → abre P13 "Cómo se hace" (3 pasos). |
| "No es prioridad" | "Entendido. Pagar 6.800 $ quita el tope de la nota (60 a 62). Si preferís otro orden, lo cambiáis en la escalera." → P12. |
| "No lo vemos igual" | "Pasa en muchas parejas. Contestad cada uno por separado: ¿qué os parece pagar 6.800 $ de la tarjeta? Lo veremos juntos." → vuelve al modo pareja con la pregunta (P04, P05, P07 adaptados) y suma "no coincidimos" a P17. |

- Texto común tras contestar la barrera: "Gracias. Volvemos con esto en la siguiente visita."
- Error: saldo vacío: "Escribid un saldo para seguir."

**Estado.** `day7.balance`, `day7.barrier.A/B`.

**Siguiente.** Éxito → P11. Barrera → según la tabla.

---

## P17. Cierre + hoja del asesor (incluye la cabecera de P14)

**Propósito.** Cerrar en 10 s con "creíais X, ahora sabéis Y" (cabecera, antes P14) y mostrar la hoja de una página (~350 palabras) ordenada por tamaño de brecha, visible en la demo. Cada línea lleva su fuente (respuesta de la familia o campo del plan). Sin etiquetas de personalidad. Sin audio ni selector de formato: el resumen es la página (BASES §17).

**Layout.**
```
+--------------------------------------+
|  Creíais [1.800 $ (ejemplo)] al año, |
|  ahora sabéis                        |
|        3.240 $   <- cifra grande     |
|  [Ver más]                           |
|  Lo siguiente: pagar 6.800 $,        |
|  nota 62.                            |
|--------------------------------------|
|  Hoja de la familia (ejemplo)        |
|  [cabecera]                          |
|  1 Preocupación                      |
|  2 Creían / era                      |
|  3 No entendieron                    |
|  4 No coinciden                      |
|  5 Orden y primer compromiso         |
|  6 Datos a revisar                   |
|  7 Preguntas para la reunión         |
|                                      |
|  [ ] Quitar mi nombre de una         |
|      respuesta                       |
+--------------------------------------+
| [   Aprobar y enviar al asesor ]     |
|      Solo para nosotros              |
+--------------------------------------+
```
**Microcopy de la cabecera (antes P14).**
- Titular: "Creíais [X], ahora sabéis [Y]".
- Línea 1 (cifra protagonista): "Creíais [vuestra marca de P01] al año, ahora sabéis 3.240 $." (la marca de la maqueta, 1.800 $, se rotula "ejemplo").
- Línea 2 (tras "Ver más"): "Pensabais que el seguro cubría [opción elegida]; hoy cubre unos 2 años."
- Línea 3 (tras "Ver más", si hay modo pareja): "En la fecha de la tarjeta, Timothy decía [AAAA] y Melanie [AAAA]; el plan dice septiembre de 2039."
- Línea de futuro: "Lo siguiente: pagar 6.800 $ de la tarjeta, nota 62."
- Aviso de envío: "Os enviaremos el día 3 por vuestro canal: Telegram en la demo; WhatsApp o email en producción." (BASES §16)
- Botones de salida: "Guardar y salir". El enlace "día 3" se genera aquí con `sid`.

**Microcopy fija de la hoja.**
- Titular: "Esto es lo que verá vuestro asesor"
- Aviso de privacidad (antes de enviar): "Cada uno ve antes qué se enviará. Podéis pedir que una respuesta vaya sin nombre."
- Etiqueta visible en demo: "EJEMPLO con respuestas inventadas para la demo" (las respuestas de abajo son de ejemplo; el plan y las cifras son reales). Desde "Pedir cita" (modal global) se muestra además: "Esto es lo que recibiría vuestro asesor"; no envía nada.
- Botones: "Aprobar y enviar al asesor" / "Solo para nosotros" / casilla "Que esta respuesta vaya sin mi nombre" (por respuesta).
- Estado vacío (sin respuestas aún): "Todavía no hay respuestas. Empezad por la primera pregunta." Botón: "Ir al inicio" → P01.
- Si no hay asesor: título "Vuestra hoja" y botón "Hablarlo con una persona" (BASES §2, sin asesor).

(Nota de recuento: BASES §6.6 lista cabecera + 7 bloques de contenido; aquí la cabecera cuenta como bloque 0.)

**Contenido de ejemplo (caso Weah, ~350 palabras; RESPUESTAS DE EJEMPLO, no son datos reales).**

> **Cabecera.** Hoja de la familia Weah · respondieron Timothy y Melanie (modo pareja) · sesión de ~5 minutos. *(Ejemplo)*
>
> **1. Lo que más os preocupa (sus palabras).** "Que Liam y Josh lo tengan todo resuelto." *(Respuesta de ejemplo; fuente: P03, frase del hogar.)*
>
> **2. Creían frente a realidad (top 3).**
> - Tarjeta, coste al año: creían 1.800 $ *(ejemplo)*, el plan dice 3.240 $. *(Marca de ejemplo; real: 18 % × 18.000 $.)*
> - Seguro de vida: Timothy creía "unos meses de gastos" *(ejemplo)*; hoy cubre unos 2 años (el mínimo recomendado, unos 12). *(Respuesta de ejemplo; real: 250.000 $ / 112.774 $.)*
> - Fin de la tarjeta: Melanie creía 2034 *(ejemplo)*; el plan dice septiembre de 2039. *(Marca de ejemplo.)*
>
> **3. Lo que no entendieron (máx. 3).**
> - Que 270 $ de los 300 $ mensuales son solo intereses. *(Rama "falla estando seguro".)*
> - Qué cubre un seguro "under insured" de 250.000 $ frente a 1.350.000 $ de mínimo recomendado entre los dos. *(Falla estando seguro.)*
> - Qué es un seguro umbrella (recomendado 1.000.000 $; no tienen). *(Glosa abierta, 1 toque.)*
>
> **4. En qué no coinciden (máx. 3).**
> - Fecha de fin de la tarjeta: Timothy dice 2031 *(ejemplo)*, Melanie 2034 *(ejemplo)* (3 años de distancia).
> - Perfil de riesgo declarado: Timothy Growth, Melanie Moderate. *(Plan: `case.household[i].risk_profile`.)*
>
> **5. Orden elegido y primer compromiso.** 1) Tarjeta (62), 2) seguro de vida (73), 3) umbrella (78). Primer paso: pagar 6.800 $ de la tarjeta con efectivo (quedan 11.200 $); por defecto, el próximo lunes a las 19:00 (editable). *(Orden de ejemplo, igual al del plan.)*
>
> **6. Datos a revisar (máx. 3).**
> - Anualidad de 300.000 $/año a nombre de Melanie (2053-2079) en `profile.incomes[0]`; no aparece en el resumen de la familia. *(BASES §11.)*
> - El efectivo "sobrante" no cuenta el coche de 2028 (45.000 $) ni la casa de 2030. *(BASES §11.)*
> - Seguro objetivo: el plan da dos cifras distintas (485.000 $ y 491.800 $). *(BASES §11.)*
>
> **7. Preguntas para abrir la reunión.** ¿Qué haría falta para pagar la tarjeta antes de enero de 2027, cuando hay un pago de vacaciones de 6.000 $? · ¿Qué opciones de seguro caben en vuestro presupuesto? · ¿Cómo repartimos el efectivo entre tarjeta, coche (45.000 $, julio de 2028) y casa (enero de 2030)?

(Recuento aproximado del ejemplo: ~340 palabras, dentro del máximo ~350.)

**Datos.**
- Todas las cifras del plan: §0.4. Datos a revisar: BASES §11 (reglas fijas, no IA). Vacaciones 6.000 $ (enero 2027) y coche 45.000 $ (julio 2028): BASES §6.5.
- **Orden de la hoja (BASES §16):** por salto de nota de `top_moves` y, a igualdad, por error × seguridad de la familia (error relativo de la respuesta multiplicado por su nivel de seguridad: Seguro, Lo dudo, Ni idea). Sin fórmula nueva: el código usa los campos ya guardados.
- Cada línea carga su fuente; en modo experto, la ruta JSON.

**Interacción.** Cada bloque tiene casilla "sin mi nombre" (afecta a `advisorSheet.hiddenName`). "Aprobar y enviar" bloquea la edición y marca `approved = true`. En la demo, el botón del asesor solo abre la hoja a pantalla completa (sin envío real).

**Estado.** `advisorSheet.{hiddenName,approved}`.

**Siguiente.** Salida.

---

## Decisiones aplicadas (antes huecos "por decidir")

Todas vienen de BASES.md §16 y §17; ninguna es cifra nueva.

| Antes | Decisión aplicada |
|---|---|
| Umbral de acierto (cifras y fechas) | Cifras ≤ 20 % cerca, > 50 % lejos; fechas ±2 años cerca, > 6 lejos; la rama la decide error + seguridad (§0.4) |
| Esfuerzo de los peldaños Weah | Tarjeta medio, vida bajo, umbrella bajo (`top_moves[i].effort`) |
| Marcas de Timothy y Melanie | Respuestas de ejemplo del equipo, rotuladas "ejemplo" (P02-R) |
| Nota de tarjeta + umbrella y de vida + umbrella | 62 y 60 (`combined_moves[2]` y `[3]`); tabla de P12 |
| Fecha por defecto del primer paso | Próximo lunes a las 19:00, editable (P13) |
| Canal del mensaje real | Telegram Bot; respaldo ntfy.sh; último recurso vídeo de 10 s (P15) |
| Orden de la hoja del asesor | Salto de nota de `top_moves`, luego error × seguridad (P17) |
| Coste anual en pareja | No se repite; en pareja solo la fecha (P01, P04, P08) |
| Formato monetario | ES "3.240 $"; siempre dólares; solo español |
| Cumplimiento | Pie fijo, "Vuestro plan propone…", etiqueta de IA en P15 y "Hablarlo con una persona" siempre visible (§0.1; BASES §19) |
| Botón "Pedir cita" | Abre la hoja del asesor con el aviso; no envía (§0.2) |
