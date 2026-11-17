> **Archivo.** Documento de trabajo antiguo: describe una idea o un plan que ya no es el de la app. Lo vigente está en el [README](../../../README.md) y en [docs/brainstorming/decisiones.md](../../brainstorming/decisiones.md).

# Vuestro plan, en vuestras palabras (nombre provisional)

## Qué es

- Una web para móvil que guía a una familia por su plan de Sherpas a partir de lo que cada miembro cree sobre su dinero: adivinar, revelar, palanca.
- Ordena los pasos en una escalera con primer paso (día, hora y "cómo se hace") y vuelve con un enlace al "día N" hasta que se actúa.
- Si hay asesor, recibe una hoja de una página con lo que la familia creía y no entendió.

## Arranque

Requisito: Node 20 o superior.

```bash
npm i && cp .env.example .env && npm start
```

Rellena `.env` antes de arrancar (o déjalo vacío para ver los textos fijos). Un solo servicio sirve la API y la web.

## Variables (`.env`)

| Variable | Para qué sirve |
|---|---|
| `TEAM_KEY` | Clave de IA del equipo. Solo en el backend, nunca en el navegador |
| `LLM_PROXY_URL` | Dirección del proxy de IA de Sherpas |
| `PORT` | Puerto del servidor |
| `PUBLIC_URL` | Dirección pública con la que se construyen los enlaces del "día N" |
| `TG_TOKEN` | Token del bot de Telegram que envía el mensaje real |
| `TG_CHAT` | Chat de Telegram al que se envía el mensaje |
| `NTFY_TOPIC` | Tema de ntfy.sh, respaldo si Telegram falla |

Nunca subas `.env` a git.

## Sin `TEAM_KEY`

La app funciona igual: la IA solo redacta la página del día 3, y sin clave (o si falla el proxy, hay timeout o el texto generado trae un número que no está en la entrada) se muestran textos fijos. El resto es código y texto escrito a mano.

## Modo demo

Son dos parámetros distintos. `?demo=1` abre la pregunta al jurado (P02) antes de "Quién sois". `?day=7` activa el selector de días y entra directamente en el día 7; cambia el número para el día 3 (en el MVP solo existen el 3 y el 7; 14, 21 y 30 están solo diseñados). El enlace con estado de cada sesión usa `?sid=`.

## Estructura

```
/
├─ README.md  .env.example  package.json  vite.config.js
├─ cases/                    # del template, no tocar
├─ server/
│  index.mjs  env.mjs
│  facts.mjs (capa de datos)  sessions.mjs
│  llm.mjs (cliente proxy + cola + validador)  ics.mjs (si sobra)  prefetch.json
├─ src/
│  main.jsx App.jsx  store.js
│  content/es.js
│  screens/ Hook Who Cycle Couple Ladder Close DayN Sheet
│  components/ GuessChart Slider Reveal JargonTerm ExpertToggle PassPhone
│  lib/ api.js share.js fmt.js
├─ scripts/ prefetch.mjs  check-cases.mjs
└─ docs/MEDIA_PAGINA.md
```

Detalle completo en PLAN-TECNICO.md §2.

## De dónde salen las cifras

Todas las cifras salen de `cases/*.json` (no del MCP, cuyo token caduca a las 72 h), leídas por `server/facts.mjs`, que usa solo campos numéricos. **La IA nunca calcula**: recibe las cifras ya calculadas y cada número del texto generado se valida contra la entrada; si falla, texto fijo. `scripts/check-cases.mjs` carga los 4 casos y lista los datos que faltan.
