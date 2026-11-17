# Plan técnico del MVP (13-18 nov)

> Complemento de [BASES.md](BASES.md). Ronda 2, actualizado en la ronda 9. Entrega: miércoles 18 nov 23:59 (repo público + enlace o pasos de arranque + vídeo + media página). Demo: jueves 19 nov 12:45.

Condicionantes del README: créditos del proxy hasta el 21 nov (60 peticiones/min y 4 a la vez por equipo); el token MCP caduca a las 72 h → **la app no usa MCP**, lee `cases/*.json`.

## 1. Stack

- **Front:** Vite + React 18 (JS) **si alguien del equipo ya lo ha usado** (pregunta abierta, BASES §15); estado compartido entre pantallas → React compensa los 20-30 min de montaje. Si nadie lo ha usado, HTML + JS sin framework.
- **Back:** Node 20+ (Express o `node:http`). Un solo servicio sirve la API y `dist/`.
- **Hosting:** Render Web Service gratis (se duerme a los ~15 min; despertarlo antes de la demo). Alternativas: Railway; túnel (cloudflared/ngrok) desde un portátil como respaldo. Confirmar condiciones de los planes gratis el sábado 14.
- **Arranque:** `npm i && cp .env.example .env && npm start` (requisito de entrega).

Librerías (versiones fijadas): `zustand` (estado + persistencia), `@dnd-kit/core` y `@dnd-kit/sortable` (arrastre opcional de la escalera), `lz-string` (estado en el enlace), `openai` (cliente del proxy), `p-limit` (cola), opcional `framer-motion` y `recharts`.

## 2. Estructura

```
/
├─ README.md  .env.example (TEAM_KEY, LLM_PROXY_URL, PORT, PUBLIC_URL, TG_TOKEN, TG_CHAT, NTFY_TOPIC)  package.json  vite.config.js
├─ cases/                    # del template, no tocar
├─ server/
│  index.mjs  env.mjs (cargador .env de examples/voice/server.mjs)
│  facts.mjs (capa de datos)  sessions.mjs (Map + volcado a data/sessions.json)
│  llm.mjs (cliente proxy + cola + validador)  ics.mjs (si sobra)  prefetch.json
├─ src/
│  main.jsx App.jsx (router por hash)  store.js (Zustand + localStorage)
│  content/es.js (textos: tarjeta 2 ramas, seguro 1 rama, jerga, "cómo se hace"; en.js diseñado, no construido)
│  screens/ Hook Who Cycle Couple Ladder Close DayN Sheet   (Ladder incluye el Mapa, BASES §17)
│  components/ GuessChart Slider Reveal JargonTerm ExpertToggle PassPhone
│  lib/ api.js share.js fmt.js
├─ scripts/ prefetch.mjs  check-cases.mjs
└─ docs/MEDIA_PAGINA.md
```

## 3. Capa de datos (`server/facts.mjs`)

Lee solo campos numéricos, nunca textos narrativos. Devuelve hechos ya calculados; es lo único que ven el front y la IA.

```
loadCase(id) → {caseId, household[], score{current,band,moves,combined},
  card{rate,balance,annualInterest,monthlyInterest,payoffDate},
  cash{balance,rate,annualYield,aboveNeeds}, protection{life[],umbrella},
  education{gap,extraYearly}, projection{year,netWorth,todays}, goals{nearTerm},
  risk{client,coClient,realEquityPct}, firstStep{amount,remaining}}
```

Rutas: ver BASES.md §7. Notas:
- Proyección: buscar por `year` o último elemento, no `[53]` fijo.
- Ruta del perfil de riesgo por persona y del % real de acciones: **por localizar el día 1**.
- Cada getter devuelve `null` si falta la ruta; la UI oculta el ciclo que lo necesita. `scripts/check-cases.mjs` carga los 4 casos y lista los `null`.

## 4. Estado

Zustand con persistencia en localStorage; el servidor guarda una copia.

```jsonc
{ "v":1, "sid":"k3f9a2", "caseId":"timothy-melanie-weah", "mode":"couple", "lang":"es",
  "level":"novice",   // global: se fija una vez en P03 (PANTALLAS §0.2)
  "people":{ "Timothy":{ "phrase":"...",
     "answers":{ "card_cost":{"guess":1500,"truth":3240,"confidence":"sure","err":0.54,"branch":"wrong_sure","check":{"picked":2,"ok":true}} },
     "risk":{"drop20":"hold"}, "guessOther":{"risk_Melanie":"sell","right":false} }, "Melanie":{} },
  "ladder":{"order":["card","life","umbrella","college","talk"]},
  "commitment":{"step":"card","when":"2026-11-16T19:00","amount":6800,"done":false,"balanceReported":null},
  "followups":{"day3":{"questions":[],"source":"ai|fixed"},"day7":{"balance":null,"blocker":null}},
  "demoDay":0 }
```

Enlace con estado: `#st=<lz-string(json)>` (funciona aunque el servidor reinicie) y, si el servidor tiene la sesión, `?sid=<sid>` corto.

## 5. API

- `GET /api/cases` · `GET /api/case/:id/facts`
- `POST /api/session` → `{sid,url}` · `GET /api/session/:sid`
- `POST /api/ai/day3` → `{titular,porque,detalle,preguntas_sugeridas[3],source}` (la IA del día 14 es solo diseñada)
- `POST /api/notify` → envía la plantilla del mensaje real (año del jurado, `ccPayoffDate`, 270 $ y enlace `/d/3?sid=`) por Telegram; si no responde en 5 s, por ntfy.sh. Variables en `.env`: `TG_TOKEN`, `TG_CHAT` y `NTFY_TOPIC`
- `GET /api/ics?when=&title=&sid=` (si sobra)
- `GET /api/health`

## 6. IA con validación (`server/llm.mjs`)

```js
const limit = pLimit(3);               // 3 de 4 concurrentes
// máx. 50 peticiones/min (margen sobre 60); caché por entrada
const r = await llm.chat.completions.create({
  model: "gpt-5-mini",                 // SIN max_tokens (o >= 1000), temperatura por defecto
  response_format: { type: "json_object" },
  messages: [{ role: "system", content: SYSTEM }, { role: "user", content: JSON.stringify(input) }] });
// numbersOk: todo número del texto debe estar en input.cifras o en la respuesta del usuario
// si falla, 429, timeout o JSON roto → fixedText(kind, input) con source:"fixed"
```

- `scripts/prefetch.mjs` pregenera las salidas validadas para el camino de la demo → la demo no depende del proxy.
- Prompt: "cifras siempre con dígitos", máximo 2 frases por campo.
- Insignia "IA" en pantalla que muestra `source` (sirve para enseñar el respaldo); en P15 lleva la etiqueta "Texto generado por IA a partir de vuestro plan" (BASES §19).
- La IA del día 3 solo se activa cuando todo el núcleo funcione (BASES §18); hasta entonces, P15 usa el texto fijo.

## 7. Piezas de riesgo y la forma más simple

| Pieza | Implementación | Plan B |
|---|---|---|
| Adivinar un año o un importe | Años: chips por década y botones −/+ de 44 px. P01: barra tocable (`<svg>` propio, `touch-action: none`) con −/+ y sin valor inicial | Campo numérico `inputmode="decimal"` (sin deslizadores, BASES §17) |
| Pásale el móvil | Fases A → pantalla opaca → B → revelación; respuestas guardadas pero no pintadas hasta revelar; persistir en cada paso | — |
| .ics (si sobra) | Generado a mano: CRLF, UID, hora local flotante, VALARM -30 min; probar en iPhone y Android | Enlace a Google Calendar |
| Enlace con estado | Router por hash + lz-string; `?sid=` corto; `?demo=1` abre P02 y `?day=7` activa el selector de días | Capturas |
| Escalera | Botones Subir/Bajar de 44 px como control principal; arrastre opcional con dnd-kit y TouchSensor (delay 150 ms) | Solo los botones |
| Hoja de una página | Vista con CSS de impresión | Captura/PDF preparado |

La nota para órdenes de la escalera que no están en el JSON: mostrar el valor de `top_moves` ("60 sin cambio"); nunca calcular una nota nueva.

## 8. Reparto (3-4 personas)

Calendario real (README del reto): hoy es viernes 13 nov, el día de la idea (se envía la idea por /entrega). Días de trabajo: sábado 14, domingo 15, lunes 16, martes 17 y miércoles 18. Entrega el miércoles 18 a las 23:59 (se entrega antes de las 18:00). Demo el jueves 19 a las 12:45. La prueba con 5-6 sesiones es el martes 17. El alcance está dimensionado para 4 días de construcción (BASES §18); el miércoles es margen: pulido, ensayo y entrega.

Roles: A = back, datos e IA · B = gancho y ciclos · C = pareja, escalera y hoja · D = contenidos, QA, pitch y media página. Detalle por tarea, horas y criterios: [TAREAS.md](TAREAS.md).

| Día | A | B | C | D |
|---|---|---|---|---|
| Sáb 14 | Repo, facts.mjs, check-cases, ruta del riesgo, despliegue vacío, /facts | Vite, router, store, gancho (P01) | Componentes (YearPicker, Reveal, PassPhone), turno de pareja | Textos de reacción (tarjeta 2 ramas, seguro 1 rama), P12, P13, P15, P16; glosa de 2 términos |
| Dom 15 | /session, llm.mjs | P03, ciclo de la tarjeta (P08-P09), novato/experto | Revelación de pareja (P07), escalera (P12) | QA 1, borrador de la media página, contenido de la hoja |
| Lun 16 | Bot de Telegram + ntfy, /ai/day3, enlace con estado (`?sid=`, `?day=`) | Ciclo del seguro (P11), día 3 y día 7 | Pregunta al jurado (P02), primer paso (P13) | Ensayo 1, preparar la prueba, README, QA 2 |
| Mar 17 | prefetch, `POST /api/notify`, prueba sin `TEAM_KEY`, ensayo del mensaje | Pulido en móviles reales, arreglos de la prueba | Hoja del asesor (P17) | Prueba con 5-6 sesiones, ensayo 2, media página con el dato |
| Mié 18 (margen) | Despliegue final, /health, prueba de carga | Pruebas en 2 móviles | Pruebas en 2 móviles, capturas | Pulido, ensayo 3, vídeo, lista de demo, entregar antes de las 18:00 |

Capacidad por rol: 5 días × 8 h = 40 h. Carga planificada (TAREAS §1): A 31,5 h, B 32 h, C 32 h, D 35 h; margen A 8,5 h, B 8 h, C 8 h, D 5 h, concentrado en el miércoles y en los huecos de cada día.

Ya fuera del MVP (BASES §0): dos móviles con sala, IA del día 14, calibración en la hoja. Si falta tiempo, recortar en este orden: casos 2-4 → arrastre en la escalera (quedan Subir/Bajar) → IA del día 3 (queda el texto fijo, BASES §18). Novato/experto, glosa de 2 términos y hoja del asesor son núcleo y no se recortan.

## 9. Lista para la demo

- Día antes: `/api/health` OK; saldo del proxy; `prefetch.json` en git; probar sin `TEAM_KEY` (deben salir textos fijos, sin errores).
- Respaldos: `npm start` en un portátil; túnel probado; vídeo descargado en el móvil; capturas del día 3, día 7 y hoja.
- Móvil: sesión Weah precargada; segundo móvil con `?day=7`; datos móviles; no molestar; bloqueo automático desactivado; bot de Telegram probado (y .ics solo si se hizo).
- Pitch: guion ensayado 3 veces con cronómetro; si falta tiempo, aplicar las frases "(recortable)" de PITCH.md §1.
