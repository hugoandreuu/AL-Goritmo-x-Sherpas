> **Archivo.** Documento de trabajo antiguo: describe una idea o un plan que ya no es el de la app. Lo vigente está en el [README](../../../README.md) y en [docs/brainstorming/decisiones.md](../../brainstorming/decisiones.md).

# TAREAS.md: backlog del MVP (13-18 nov)

> Fuentes: BASES.md §0 (v7), PANTALLAS.md (v7), PLAN-TECNICO.md y los casos de `/home/user/AL-Goritmo-x-Sherpas/cases/`. Hoy es viernes 13 nov, el día de la idea. Días de trabajo: sábado 14, domingo 15, lunes 16, martes 17 y miércoles 18. Entrega el miércoles 18 a las 23:59 (PLAN-TECNICO fija entregar antes de las 18:00); demo el jueves 19 a las 12:45. Roles: A back/datos/IA · B gancho y ciclos · C pareja/escalera/hoja · D contenidos/QA/pitch.

Leyenda: **★** = camino crítico. Las horas son estimaciones del equipo de planificación, no mediciones. Las cifras de los criterios salen de BASES, PANTALLAS o del JSON de Weah (`financial-health.json`: comprobadas con `jq` la nota 60, `top_moves` 62/60/60, `combined_moves` 78/73/62/60, 2079 = 16.115.848 y 3.359.400, `ccPayoffDate` 2039-09-01, saldo 18.000 al 0,18, intereses 270 al mes).

## 1. Resumen de carga

Capacidad: 5 días (sáb 14 a mié 18) × 8 h = 40 h por rol. De sábado a martes se construye (4 días × 8 h = 32 h); el miércoles 18 es margen (pulido, ensayo y entrega) y solo lleva tareas de cierre. Hoy, viernes 13, es el día de la idea y no se programan tareas.

| Rol | Sáb 14 | Dom 15 | Lun 16 | Mar 17 | Total sáb-mar | Mié 18 | Total | Margen (de 40 h) | Estado |
|---|---|---|---|---|---|---|---|---|---|
| A | 8 | 7 | 7,5 | 7 | **29,5** | 2 | 31,5 | 8,5 | cabe |
| B | 7 | 8 | 8 | 7,5 | **30,5** | 1,5 | 32 | 8 | cabe |
| C | 8 | 8 | 8 | 7 | **31** | 1 | 32 | 8 | cabe |
| D | 8 | 8 | 8 | 8 | **32** | 3 | 35 | 5 | cabe: 0 h de margen sáb-mar; con el miércoles suma 35 h y quedan 5 h |

Aviso: **D llena sus 32 h de sáb-mar y llega a 35 h con el miércoles** (QA, pitch, contenidos, prueba y entrega). Si D se retrasa, A, B y C tienen entre 1 y 2,5 h libres de sáb a mar y, el miércoles, A 6 h, B 6,5 h y C 7 h libres. Ningún día supera 8 h por rol. Con solo 3 personas, las 130,5 h totales superan las 120 h de 3 × 40 h: aplicar los recortes de la sección 4 antes de repartirlas.

Total: 43 tareas (más 3 opcionales fuera de cuenta, sección 5), 130,5 h.

## 2. Tareas

### Sáb 14

| id | rol | día | pantalla / endpoint | depende de | h | criterio de "hecho" |
|---|---|---|---|---|---|---|
| T01 ★ | A | Sáb 14 | /api/health | — | 3,5 | **Repo, `package.json` con versiones fijadas, `.env.example` (TEAM_KEY, LLM_PROXY_URL, PORT, PUBLIC_URL, TG_TOKEN, TG_CHAT, NTFY_TOPIC), `server/index.mjs` + `env.mjs`, y despliegue vacío en Render (confirmar condiciones del plan gratis).** Hecho cuando: En un clon limpio, `npm i && cp .env.example .env && npm start` arranca; `GET /api/health` responde 200 en local y en la URL pública desde un móvil con datos móviles. Se anota cuánto tarda en despertar Render. |
| T02 ★ | A | Sáb 14 | GET /api/case/:id/facts, GET /api/cases | T01 | 3 | **`server/facts.mjs`: `loadCase()` solo con campos numéricos; cada getter devuelve `null` si falta la ruta; proyección buscada por `year`.** Hecho cuando: Para `timothy-melanie-weah` devuelve: `card.annualInterest` 3240 (18 % × 18.000), `card.monthlyInterest` 270, `card.payoffDate` 2039-09, `cash.balance` 150000, `cash.aboveNeeds` 60222.5, `projection` (year 2079) `netWorth` 16115848 y `todays` 3359400, `score.current` 60 (`score.published_score`), `firstStep` 6800 / queda 11200, `protection.life` hoy 250000 y mínimo 1350000, gasto anual 112774. |
| T03 | A | Sáb 14 | scripts/check-cases.mjs | T02 | 1,5 | **`scripts/check-cases.mjs`: carga los 4 casos y lista los `null`; localizar la ruta del perfil de riesgo por persona (`case.household[i].risk_profile`).** Hecho cuando: `node scripts/check-cases.mjs` carga 4 casos e imprime los `null` por caso. Weah: 0 `null` en los campos del núcleo y riesgo Timothy Growth / Melanie Moderate. Sale con código distinto de 0 si falta un campo del núcleo de Weah; los `null` de los otros 3 casos no rompen (solo se listan). |
| T04 ★ | B | Sáb 14 | P01-P17 (rutas), store | T01 | 3 | **Vite + React 18 (si alguien del equipo lo ha usado, BASES §15; si no, HTML + JS), router por hash, `store.js` (Zustand + localStorage, forma de PLAN-TECNICO §4), layout base 390 px, `lib/api.js`, `lib/fmt.js`.** Hecho cuando: Se navega a `#/p01` … `#/p17` (pantallas vacías); recargar conserva `state`; `fmt(3240)` devuelve "3.240 $"; sin scroll horizontal a 390 px; el pie fijo de cumplimiento y el botón "Hablarlo con una persona" aparecen en el layout base (BASES §19). |
| T05 ★ | B | Sáb 14 | P01 | T04, T02 | 4 | **P01 Gancho: barras "Dinero parado" / "Deuda de tarjeta", contador "?.??? $" 10 s, control de importe vacío (0-18.000 $, paso 100, −/+ de 44 px) y chips Seguro / Lo dudo / Ni idea.** Hecho cuando: Botón "Ver cuánto es" deshabilitado hasta marcar importe y chip; al pulsarlo el contador se detiene en 3.240 $ (de `facts`); la marca queda en `guesses.card_cost.A`; sin `cases/` muestra "No hemos podido cargar vuestro plan." sin cifras inventadas. |
| T06 | C | Sáb 14 | componentes | T04 | 4 | **Componentes `YearPicker` (chips de década + −/+ 44 px), `Reveal` (animación 1,2 s) y `PassPhone` (pantalla opaca).** Hecho cuando: `YearPicker` devuelve un año entero entre 2026 y 2079; botones ≥ 44 px; `Reveal` anima punto propio, luego Timothy, Melanie y la real en este orden. |
| T07 | C | Sáb 14 | P04, P05 | T06 | 4 | **P04+P05: componente `TurnoPareja(miembro)` montado dos veces (Timothy 1 de 2, Melanie 2 de 2) con pantalla opaca entre turnos; persiste en cada paso.** Hecho cuando: Tras el turno de Timothy su respuesta no se ve en ninguna pantalla; `guesses.card_date.A` y `.B` guardados con `{value, conf}`; recargar en P05 vuelve a P05 (`flow.step = "pairB"`). |
| T08 | D | Sáb 14 | P08, P09, P11 (textos) | — | 4 | **Textos en `content/es.js`: P08 (2 ramas: acierta / falla estando seguro; × novato / experto), "Por qué", P09, P11 (1 rama). Tono de PANTALLAS §0.1.** Hecho cuando: Cada texto de rama ≤ 25 palabras y con una sola cifra grande; las cifras son exactas: 3.240, 270, 300, 150, 62, "unos 2 años", "unos 12"; ningún término de jerga sin glosa; sin "casi nadie lo adivina". |
| T09 | D | Sáb 14 | P12, P13, P15, P16, glosa (textos) | — | 4 | **Textos de P12 (mensajes de reorden), P13 ("Cómo se hace", 3 pasos), P15 (respaldo fijo y 3 preguntas con respuesta de 2 frases), P16 (4 barreras) y glosa de 2 términos (under insured, umbrella).** Hecho cuando: Tabla de notas copiada literal de PANTALLAS P12: 62/73/78, 62/62/78, 60/73/78, 60/60/78, 60/62/78; el texto de P15 pasa por la lista de números permitidos de PANTALLAS P15; la glosa de umbrella cita 1.000.000 $. |

### Dom 15

| id | rol | día | pantalla / endpoint | depende de | h | criterio de "hecho" |
|---|---|---|---|---|---|---|
| T10 | A | Dom 15 | POST /api/session, GET /api/session/:sid | T02, T01 | 3 | **`sessions.mjs` (Map + volcado a `data/sessions.json`) y rutas de sesión.** Hecho cuando: `POST /api/session` devuelve `{sid, url}`; tras reiniciar el servidor, `GET /api/session/:sid` devuelve el mismo estado guardado. |
| T11 | A | Dom 15 | server/llm.mjs | T01 | 4 | **`llm.mjs`: cliente del proxy (`gpt-5-mini`, sin `max_tokens` o ≥ 1000), cola `pLimit(3)`, máx. 50 peticiones/min, caché por entrada, `numbersOk` y `fixedText`.** Hecho cuando: Cuatro pruebas fuerzan el respaldo (`source: "fixed"`): número fuera del conjunto permitido {3.240, 150, 270, 300, 18.000, 18, 0,1, 150.000, 6.800, 11.200, 60, 62, 73, 78, 2, 12, 2039, 250.000, 1.350.000, 112.774}, JSON roto, faltan campos de los 4, más de 2 frases por campo. Un 429 o timeout también da respaldo, sin excepción. |
| T12 | B | Dom 15 | P03 | T04 | 2 | **P03 Quién sois: pareja / individual, frase propia, novato / experto (por defecto novato).** Hecho cuando: Se guardan `mode`, `phrase.household` y `level`; en individual se saltan P04, P05 y P07 (flujo ~4:05 frente a ~5:00 en pareja, objetivo de diseño). |
| T13 ★ | B | Dom 15 | P08, P09 | T05, T08 | 6 | **P08 revelación y reacción de la tarjeta (2 ramas, `ExpertToggle`, "Por qué") + P09 palanca (test opcional).** Hecho cuando: Marca 1.500 $ + "Seguro" (error 53,7 %) -> rama "falla"; marca 3.000 $ + "Seguro" (error 7,4 %) -> rama "acierta". Ambas muestran 3.240 $. Novato: "270 $ al mes solo de intereses"; experto: "18 % APR, 300 $/mes, septiembre de 2039". P09: nota 60 a 62, quedan 11.200 $. |
| T14 | C | Dom 15 | P07 | T07, T02 | 2,5 | **P07 revelación de pareja en orden fijo (coincidencias, diferencia, fecha real) y perfiles de riesgo.** Hecho cuando: La cifra final es "septiembre de 2039" (`ccPayoffDate` 2039-09); a continuación "Timothy: Growth · Melanie: Moderate"; `pairDiffYears` = diferencia absoluta entre A y B guardado (ej. 2031 y 2034 -> 3). |
| T15 ★ | C | Dom 15 | P12 | T02, T09, T04 | 5,5 | **P12 Escalera: Subir / Bajar de 44 px como control principal, tabla fija de las 6 órdenes, mensajes de reorden, `aria-live` y tarjeta de lectura 2079.** Hecho cuando: Tarjeta, vida, umbrella -> 62 / 73 / 78. Vida, umbrella, tarjeta -> 60 / 60 / 78 con el mensaje "Sin la tarjeta, aunque hagáis los dos seguros, 60". Tarjeta de lectura: "16,1 M$ en 2079 = 3,36 M$ de hoy" (`net_worth` 16115848, `todays` 3359400, buscado por `year`). Esfuerzos: tarjeta medio, vida bajo, umbrella bajo. |
| T16 | D | Dom 15 | P01-P09 (QA) | T13, T12 | 3 | **QA ronda 1 en un móvil real de P01 a P09 con lista de comprobación (botones ≥ 44 px, una cifra por pantalla, tono, "ejemplo" rotulado).** Hecho cuando: Lista de incidencias abierta y priorizada; 0 incidencias bloqueantes abiertas al terminar el día; cada cifra mostrada coincide con el JSON (3.240 $, 270 $, 62). |
| T17 | D | Dom 15 | docs/MEDIA_PAGINA.md | — | 2,5 | **Borrador de la media página: diferenciador, dónde entra la IA y por qué no calcula, "Descartado y por qué" (BASES §12).** Hecho cuando: `docs/MEDIA_PAGINA.md` con las 3 secciones escritas; deja un hueco marcado para el dato de la prueba del martes 17 (sin cifra inventada). |
| T18 | D | Dom 15 | P17 (contenido de la hoja) | — | 2,5 | **Contenido de la hoja del asesor: cabecera + 7 bloques (~350 palabras), "Datos a revisar" con reglas fijas de BASES §11, ejemplos rotulados.** Hecho cuando: Los "Datos a revisar" citan: anualidad de 300.000 $/año a nombre de Melanie, coche 45.000 $ (julio 2028) y las dos cifras de seguro objetivo 485.000 $ y 491.800 $; la etiqueta "EJEMPLO con respuestas inventadas para la demo" aparece; ≤ ~350 palabras. |

### Lun 16

| id | rol | día | pantalla / endpoint | depende de | h | criterio de "hecho" |
|---|---|---|---|---|---|---|
| T19 ★ | A | Lun 16 | bot de Telegram, ntfy | T01 | 2,5 | **Crear el bot de Telegram, `/start` desde el móvil del pitch, envío desde el servidor y respaldo `ntfy.sh` si Telegram no responde en 5 s.** Hecho cuando: Un mensaje de prueba llega al móvil con la pantalla bloqueada; con el token de Telegram inválido, `ntfy.sh` lo entrega y el log indica el canal usado. |
| T20 | A | Lun 16 | POST /api/ai/day3 | T11, T13 | 2 | **Endpoint del día 3: entrada con cifras ya calculadas + respuesta y seguridad + rama + frase propia.** Hecho cuando: Devuelve `{titular, porque, detalle, preguntas_sugeridas[3], source}`; con `source: "ai"` pasa la validación de números; con `source: "fixed"` el titular es "Mucha gente se queda con dudas justo en esto." |
| T21 ★ | A | Lun 16 | /d/N?sid=, #st=, ?day=N | T10, T04 | 3 | **Enlace con estado (`#st=` con lz-string + `?sid=` corto), ruta `/d/N` y selector de días para la demo.** Hecho cuando: Abrir `/d/3?sid=…` en un navegador sin datos locales carga el día 3 con sus respuestas; con el servidor reiniciado funciona con `#st=`; `?day=7` abre el día 7 en un segundo móvil. |
| T22 ★ | B | Lun 16 | P11 (con hoja P10) | T13, T09 | 4,5 | **P11 ciclo del seguro: hoja de aviso y permiso, pregunta cerrada, una cifra en años, palanca; componente `JargonTerm` para las 2 glosas.** Hecho cuando: Cualquier respuesta lleva a "Hoy vuestro seguro cubriría unos 2 años de vuestros gastos" (250.000 / 112.774 = 2,2) y "unos 12" recomendado (1.350.000 / 112.774 = 12,0); se dice "recomendado", no "obligatorio"; sin cifra exacta de objetivo; la glosa abre en un toque. |
| T23 | B | Lun 16 | P15, P16 | T21, T20 | 3,5 | **P15 Día 3 (etiqueta "Texto generado por IA a partir de vuestro plan" / "Texto del equipo", 3 preguntas con respuesta fija) y P16 Día 7 (campo numérico, éxito y 4 barreras).** Hecho cuando: P16 con saldo 11.200 $ muestra "Nota 62"; con 12.000 $ muestra "¿Qué os frena?" con 4 opciones; con el campo vacío "Escribid un saldo para seguir."; P15 sin respuesta de la IA muestra el texto de respaldo sin aviso de error. |
| T24 ★ | C | Lun 16 | P02-Q, P02-R | T06 | 2,5 | **P02 pregunta al jurado (solo `?demo=1`): chips de década + −/+, confianza, línea de tiempo con marcas de ejemplo.** Hecho cuando: Con `?demo=1` abre P02 antes que P03. Respuesta 2038 -> "Muy cerca."; 2031 -> "Más lejos de lo que parece. La cifra real: septiembre de 2039."; la real se muestra como "Septiembre de 2039"; Timothy 2031 y Melanie 2034 rotulados "(ejemplo)". |
| T25 ★ | C | Lun 16 | P13, P17 (cabecera) | T15, T13, T14 | 5,5 | **P13 primer paso (día y hora, "Cómo se hace", compromiso) + cabecera de P17 "Creíais X, ahora sabéis Y".** Hecho cuando: P13: por defecto el próximo lunes a las 19:00 (editable); muestra 6.800 $ y "Quedan 11.200 $"; sin fecha u hora, "Elegid un día y una hora."; confirmar guarda `commitment` con importe 6800. P17: "Creíais [marca de P01] al año, ahora sabéis 3.240 $." |
| T26 | D | Lun 16 | pitch (PITCH.md) | T22, T15 | 2 | **Ensayo 1 del pitch con cronómetro.** Hecho cuando: Tiempos reales anotados por pantalla frente al objetivo de PANTALLAS (pareja ~5:00, individual ~4:05; son objetivos, no mediciones); lista de cambios para el ensayo 2. |
| T27 | D | Lun 16 | prueba con ajenas | — | 1,5 | **Preparar la prueba del martes 17: contactar a 5-6 sesiones ajenas al equipo (2 parejas + 2-3 individuales), guion de prueba y hoja de registro (marca, rama, tiempo, dónde se atascan).** Hecho cuando: 5-6 sesiones confirmadas para el martes 17; hoja de registro con columnas para marca de la fecha de la tarjeta, rama y tiempo total; guion de 5 líneas que no revela el 2039. |
| T28 | D | Lun 16 | README.md | T01 | 2 | **README: qué es, pasos de arranque, cómo funciona el respaldo sin `TEAM_KEY`, dónde está la IA y qué no calcula.** Hecho cuando: Una persona ajena al código sigue solo el README en un clon limpio y llega a `/api/health` 200; el arranque coincide con `npm i && cp .env.example .env && npm start`. |
| T29 | D | Lun 16 | P11-P13 (QA) | T22, T25 | 2,5 | **QA ronda 2 en móvil real de P11 a P13 y revisión de incidencias de la ronda 1.** Hecho cuando: Incidencias de la ronda 1 cerradas o con dueño; en P12 las 6 órdenes dan las notas de la tabla; en P13 se acepta fecha por defecto y la confirmación dice "Guardado. Volveremos el día 3 con vuestras dudas." |

### Mar 17

| id | rol | día | pantalla / endpoint | depende de | h | criterio de "hecho" |
|---|---|---|---|---|---|---|
| T30 ★ | A+D | Mar 17 | scripts/prefetch.mjs, prefetch.json | T20, T09 | A 2 + D 0,5 | **`prefetch.mjs` pregenera y valida las salidas del camino de la demo; D revisa cada número y comita `prefetch.json`.** Hecho cuando: `prefetch.json` está en git con `source` en cada entrada; todos los números de las salidas están en el conjunto permitido; con el proxy bloqueado la demo sigue funcionando. |
| T31 ★ | A | Mar 17 | POST /api/notify | T19, T21 | 1,5 | **`POST /api/notify` (Telegram → ntfy; variables `TG_TOKEN`, `TG_CHAT`, `NTFY_TOPIC`) con la plantilla del mensaje en código (sin IA) con el año del jurado, `ccPayoffDate` y 270 $, enlace `/d/3?sid=` y botón "reenviar".** Hecho cuando: El texto sale: "Marcaste [AAAA]; el plan dice septiembre de 2039. De tus pagos, 270 $ al mes van solo a intereses. Tu día 3: [enlace]." con [AAAA] = `guesses.jurado_fecha.value`; el enlace abre el día 3 sin login por HTTPS. |
| T32 ★ | A | Mar 17 | toda la app | T20, T30 | 1,5 | **VERIFICACIÓN: probar sin `TEAM_KEY`.** Hecho cuando: Con `.env` sin `TEAM_KEY`, recorrer P01 a P17 y P15: 0 errores en consola, 0 respuestas 5xx; P15 muestra "Texto del equipo" y el titular fijo "Mucha gente se queda con dudas justo en esto."; las cifras son las mismas (3.240 $, 62). |
| T33 | A+D | Mar 17 | scripts/check-cases.mjs, QA de cifras | T03, T08, T09 | A 0,5 + D 1 | **VERIFICACIÓN: `check-cases` sobre los 4 casos y repaso de cada cifra de PANTALLAS §0.4 contra el JSON.** Hecho cuando: `node scripts/check-cases.mjs` carga los 4 casos y Weah da 0 `null` en el núcleo; cada símbolo de PANTALLAS §0.4 aparece como OK o con la discrepancia anotada; los `null` de los otros 3 casos quedan listados en el README. |
| T34 ★ | A+D | Mar 17 | bot de Telegram, ntfy | T31 | A 1,5 + D 0,5 | **VERIFICACIÓN: ensayo del mensaje de Telegram (BASES §16).** Hecho cuando: `/start` al bot desde el móvil del pitch; 5 envíos desde la wifi del recinto con la pantalla bloqueada, cada uno llega en menos de 5 s; el enlace abre el día 3 sin login por HTTPS; con Telegram caído, `ntfy.sh` entra a los 5 s; "No molestar" y ahorro de batería desactivados. |
| T35 ★ | C | Mar 17 | P17 (hoja del asesor) | T25, T22, T18, T21 | 7 | **Hoja de una página (familia y asesor): 7 bloques ordenados por salto de nota y error × seguridad, casilla "sin mi nombre", "Aprobar y enviar", pantalla completa, CSS de impresión, y capturas de respaldo (día 3, día 7, hoja).** Hecho cuando: La hoja tiene cabecera + 7 bloques y ≤ ~350 palabras; cada línea muestra su fuente; "Aprobar y enviar al asesor" marca `approved = true` y bloquea la edición; la casilla afecta a `advisorSheet.hiddenName`; imprimir cabe en una página; capturas guardadas. |
| T36 ★ | B | Mar 17 | P01-P17 en iPhone y Android | T22, T23, T25 | 6 | **Pulido en móviles reales (iPhone y Android) y arreglos de la prueba con ajenas (reservar 2 h para ello, tras la prueba).** Hecho cuando: P01-P17 sin scroll horizontal a 390 px; botones ≥ 44 px; el toque sobre la barra de P01 funciona en ambos sistemas; las incidencias priorizadas de la prueba con ajenas, cerradas. |
| T37 ★ | D+B | Mar 17 | flujo P01 a P13 | T21, T25, T19, T36 | D 2,5 + B 1,5 | **VERIFICACIÓN: prueba con 5-6 sesiones ajenas al equipo (2 parejas + 2-3 individuales) el martes 17 sobre la URL desplegada (D conduce, B observa).** Hecho cuando: Las 5-6 sesiones completan P01 a P13 en su móvil; se ve 3.240 $ y "septiembre de 2039" en cada una; hoja de registro con una fila por sesión (marca, rama, tiempo medido); se anota el recuento real "X de N fallaron 2039" con el N real (no extrapolar) y la lista de fallos priorizada. |
| T38 | D | Mar 17 | pitch (PITCH.md) | T26, T34 | 1,5 | **Ensayo 2 del pitch con cronómetro, con el mensaje real de Telegram incluido.** Hecho cuando: Guion ensayado con cronómetro; el mensaje llega durante el ensayo y el enlace abre el día 3; se decide si hace falta la versión de emergencia de 90 s. |
| T39 | D | Mar 17 | docs/MEDIA_PAGINA.md, README.md | T37, T17, T28 | 2 | **Media página y README finales con el dato de la prueba.** Hecho cuando: La media página incluye el recuento real de la prueba (N real: las 5-6 sesiones de T37) o no cita ninguna cifra de acierto; el README coincide con el arranque real; ≤ media página. |

### Mié 18

| id | rol | día | pantalla / endpoint | depende de | h | criterio de "hecho" |
|---|---|---|---|---|---|---|
| T40 ★ | A | Mié 18 | despliegue final, /api/health | T37, T36, T32 | 2 | **Despliegue final en Render, despertar el servicio, `prefetch.json` en git y prueba de carga corta.** Hecho cuando: `/api/health` 200 en la URL pública; ráfaga de más de 50 peticiones/min a `/api/ai/day3` sin 429 hacia el proxy (la cola limita a 50/min y 3 en paralelo; el exceso sale con `source: "fixed"`); `npm start` en un portátil como respaldo. |
| T41 | B+C | Mié 18 | 2 móviles, ?day=7 | T40 | B 1,5 + C 1 | **Pruebas en 2 móviles sobre el despliegue final (B y C) y capturas actualizadas.** Hecho cuando: Móvil 1: flujo completo de Weah; móvil 2: `?day=7` abre el día 7 con saldo 11.200 $ -> "Nota 62"; capturas del día 3, día 7 y hoja reemplazadas por las del despliegue final. |
| T42 | D | Mié 18 | vídeo, checklist de demo | T40 | 2 | **Vídeo rápido (no puntúa) y lista de la demo (PLAN-TECNICO §9).** Hecho cuando: Vídeo descargado en el móvil; lista cumplida: túnel probado, sesión Weah precargada, segundo móvil con `?day=7`, datos móviles, no molestar, bloqueo automático desactivado. |
| T43 ★ | D | Mié 18 | /entrega | T40, T42, T39, T41 | 1 | **Entregar: repo público + enlace o pasos de arranque + vídeo + media página.** Hecho cuando: Entrega enviada antes de las 18:00 (margen de seis horas frente al límite de 23:59); el enlace abre desde un móvil externo. |

Nota sobre la dependencia de T36: la prueba con ajenas arranca por la tarde del martes 17 con el pulido de la mañana ya hecho; las 2 h de arreglos de T36 van después y no figuran como dependencia para evitar un ciclo.

## 3. Camino crítico (★)

Cadena que fija la fecha de entrega (cada eslabón bloquea al siguiente):

1. **Interfaz y ciclos:** T01 (repo + despliegue) -> T04 (shell) -> T05 (P01) -> T13 (P08 y P09) -> T22 (P11) -> T35 (hoja del asesor) -> T37 (prueba con ajenas) -> T36 (pulido y arreglos) -> T40 (despliegue final) -> T43 (entrega).
2. **Escalera y compromiso:** T02 (facts) -> T15 (P12) -> T25 (P13 y cabecera de P17) -> T35 (hoja). Sin la escalera con 6.800 $ y nota 62 no hay primer paso ni hoja.
3. **Mensaje real (segundo momento del pitch):** T01 (repo desplegado) -> T10 (sesión) -> T21 (enlace con estado) -> T31 (plantilla) -> T34 (ensayo de Telegram) -> T37 (prueba con ajenas). El bot (T19) debe estar listo el lunes 16. Es la cadena más frágil: depende de HTTPS público, del bot y del móvil.
4. **Pregunta al jurado:** T06 (componentes) -> T24 (P02). Es de BASES §0 (núcleo) pero no bloquea a las demás; si se atrasa, es el primer riesgo del "momento wow".

Holgura: el martes 17 concentra la hoja (T35, 7 h), el pulido (T36, 6 h) y la prueba con ajenas; un retraso de más de medio día el lunes 16 en T22, T25 o T21 no cabe en el martes sin recortar, aunque el miércoles de margen (de 5 a 8,5 h libres por rol) absorbe parte.

## 4. Recortes, en orden

Primero, PLAN-TECNICO §8 (orden literal); después, lo que BASES §0 ya deja fuera. Recortar siempre de arriba abajo y solo cuando una tarea del camino crítico se retrase.

| Orden | Qué se recorta | Fuente | Efecto en este backlog |
|---|---|---|---|
| 1 | Dos móviles con sala | PLAN §8; BASES §0 "solo diseñado" | Ya fuera de las tareas: no hay ninguna que recortar. Se cuenta en el pitch. Pásale el móvil en un solo móvil queda (T07, T14, T06). |
| 2 | IA del día 14 | PLAN §8; BASES §0 "solo diseñado" | Ya fuera: `/api/ai/day14` no está en las tareas. Se mantiene la IA del día 3 (T20, T30). |
| 3 | Calibración en la hoja | PLAN §8 | Ya fuera: la hoja (T35) ordena por salto de nota y error × seguridad, sin calibración extra. |
| 4 | Casos 2-4 | PLAN §8; BASES §0 "si sobra" | Opcional O1 (sección 5). `check-cases` (T03, T33) sigue cargando los 4 casos y listando los `null`. |
| 5 | Arrastre en la escalera | PLAN §7; BASES §17 | Opcional O3; Subir/Bajar (T15) basta. |
| 6 | IA del día 3: dejar el texto fijo | BASES §18 | T20 y T30 quedan en texto fijo (`source: "fixed"`); P15 funciona con el respaldo. |

El interruptor novato/experto, la glosa de 2 términos y la hoja del asesor son núcleo (BASES §0): no se recortan. Si P01 da problemas en móvil, el plan B es el campo numérico (PLAN §7), no un deslizador.

**No se recorta nunca (núcleo BASES §0):** gancho con contador, pregunta al jurado, interruptor novato/experto, ciclo de la tarjeta (2 ramas), ciclo del seguro (1 rama), revelación de pareja, escalera con 6.800 $, mensaje real con enlace al día 3, día 7 con saldo -> nota 62, hoja del asesor, glosa de los términos del núcleo, cumplimiento (BASES §19). Ya en "Si sobra" o "Solo diseñado" y fuera de este backlog: ciclo "hoy vs mañana", pregunta de riesgo en pareja, .ics (opcional O2), inglés, días 14, 21 y 30, audio, protocolo de noticias duras.

## 5. Opcionales (fuera de las 43 tareas y de los totales)

| id | rol | Cuándo | Qué | Estimación | Hecho cuando |
|---|---|---|---|---|---|
| O1 | C | Mar o Mié si sobra | Los otros 3 casos cargan sin romperse (Michael, Johnson, Samantha) | 3 h (estimación) | Cada caso abre P01 y P12 sin error; los ciclos sin dato se ocultan (getter `null`). |
| O2 | A | Lun o Mar si sobra | `.ics` generado a mano (CRLF, UID, hora flotante, VALARM -30 min) | 2 h (estimación) | Importa en iPhone y Android con el día y hora elegidos en P13; si no, enlace a Google Calendar. |
| O3 | C | Mar si sobra | Arrastre en la escalera (dnd-kit con `TouchSensor` retardo 150 ms) | 2 h (estimación) | Arrastrar cambia el orden igual que Subir/Bajar; los botones siguen funcionando. |

## 6. Verificaciones (índice)

| Verificación | Tarea | Cuándo | Cifra esperada |
|---|---|---|---|
| `check-cases` en los 4 casos | T03 (crea), T33 (verifica) | Sáb y Mar | 4 casos cargados; Weah 0 `null` en el núcleo |
| Prueba sin `TEAM_KEY` | T32 | Mar (y rápida en T40) | `source: "fixed"`; 3.240 $ y 62 intactos; 0 errores |
| Ensayo del mensaje de Telegram | T34 | Mar | 5 envíos < 5 s; enlace al día 3 sin login; respaldo `ntfy.sh` a los 5 s |
| Prueba con 5-6 sesiones ajenas | T37 | Mar | "X de N fallaron 2039" (N real, sin extrapolar) |
| Cifras de pantallas contra el JSON | T16, T33, T29 | Dom y Mar | 3.240; 270; 62/73/78/60; 2079 = 16.115.848 y 3.359.400 |

## 7. Supuestos y diferencias entre documentos

- **Ramas de la tarjeta:** BASES §0 y §17 fijan 2 ramas en la tarjeta y 1 en el seguro. Se construye eso (PLAN §3 y BASES §6.2 ya corregidos).
- **Casos 2-4:** BASES §0 los pasa a "si sobra" (BASES §5 y PLAN §8 ya coinciden). Opcional O1; solo `check-cases` los carga.
- **IA del día 14, .ics, dos móviles, calibración:** fuera del backlog base (BASES §0; PLAN §8 ya los quita del reparto).
- **Viernes 13:** es el día de la idea. PLAN §8 y este backlog programan el trabajo de sábado 14 a miércoles 18; las tareas del repo, `facts`, componentes y textos van el sábado 14. Si ya están hechas, marcarlas y liberar sus horas.
- **Entrega y demo:** el límite es el miércoles 18 a las 23:59; PLAN §8 pide entregar antes de las 18:00 y las tareas del miércoles lo respetan. La demo es el jueves 19 a las 12:45.
- **PITCH.md** no estaba en el encargo y no se ha leído: T26 y T38 lo usan como guion.
