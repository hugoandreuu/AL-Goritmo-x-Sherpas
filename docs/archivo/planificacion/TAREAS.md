> **Archivo.** Documento de trabajo antiguo: describe una idea o un plan que ya no es el de la app. Lo vigente está en el [README](../../../README.md) y en [docs/brainstorming/decisiones.md](../../brainstorming/decisiones.md).

# TAREAS.md: construcción con sesiones de Claude Code (v2)

> Sustituye a la v1 (`TAREAS-v1-humanos.md`, pensada para 4 personas con rol). Fuentes: BASES.md §0 y §16-§21, PANTALLAS.md, PLAN-TECNICO.md, content-es.js, README-APP.md y los casos de `/home/user/AL-Goritmo-x-Sherpas/cases/`.
> Contexto: no hay programadores humanos a tiempo completo. Todo el código lo construyen sesiones de Claude Code en paralelo sobre el mismo repo de GitHub, cada una en su rama. Los humanos solo hacen lo que un Claude no puede (sección 4).
> Objetivo del sábado 14: construir lo máximo posible de la estructura para iterar después. Lo secundario queda para luego (sección 3). Entrega: miércoles 18 a las 23:59 (PLAN-TECNICO recomienda entregar antes de las 18:00). Demo: jueves 19 a las 12:45.
> No se inventan cifras. Las horas y los tiempos de esta página son estimaciones, no mediciones.

---

## 1. Cómo trabajar con Claudes

1. **Una sesión por bloque, con rama propia.** Nombre de rama: `ola1/flujo`, `ola1/pareja-seguro`, `ola1/escalera-hoja`, `ola1/back`. Una sesión no toca los ficheros de otro bloque; si necesita un cambio ajeno, lo pide en un comentario del PR o lo anota en `docs/CONTRATO.md`.
2. **El contrato se fija primero (Ola 0).** `docs/CONTRATO.md` fija: la forma de `loadCase()` y de los hechos (`facts`), el estado del store (PANTALLAS §0.3), los nombres de componentes y sus props, las rutas de la API y las claves de `content-es.js`. Ninguna sesión de la Ola 1 cambia el contrato; si hace falta, lo propone en un PR aparte y se fusiona antes que lo demás.
3. **Cada sesión arranca leyendo**, en este orden: BASES §0 (lo no negociable), `docs/CONTRATO.md`, las secciones de PANTALLAS.md de sus pantallas y `content-es.js` en las claves de esas pantallas. Nada más hasta que lo necesite.
4. **Criterio de hecho comprobable.** Cada bloque termina con `npm test` en verde, con un script (`node scripts/...`) que imprime las cifras esperadas, o con una captura de Playwright a 390 px de ancho guardada en `docs/capturas/`. "Parece que funciona" no es hecho.
5. **No inventar cifras.** Toda cifra sale de `facts` (JSON del caso). Los textos salen de `content-es.js` por clave, sin escribir números a mano; si falta una clave o una ruta del JSON, el dato es `null` y la UI lo oculta o dice "sin dato del plan". La IA nunca calcula.
6. **Tono y cumplimiento en todo texto**: "Vuestro plan propone…", pie fijo en todas las pantallas, "Hablarlo con una persona" siempre visible (PANTALLAS §0.1, BASES §19).
7. **Fusionar pronto.** PR pequeño a `main` en cuanto el criterio de hecho se cumple, aunque la pantalla esté fea; antes de abrirlo, `git pull --rebase origin main` y `npm test`. Mejor tres fusiones al día que una al final.
8. **Cada sesión deja huella.** Al terminar, actualiza la tabla "Estado" de `docs/CONTRATO.md` (qué pantallas funcionan, qué queda con texto fijo, qué no se ha podido comprobar) y no declara nada hecho sin haber ejecutado la comprobación.

Nota sobre la fecha: el primer paso por defecto es "el próximo lunes a las 19:00" (BASES §16). Se calcula en código desde la fecha actual; no se escribe fija.

---

## 2. Oleadas del sábado 14

Dependencias: Ola 0 antes de todo. Ola 1 (4 sesiones en paralelo) necesita la Ola 0 fusionada. Ola 2 necesita las 4 ramas de la Ola 1 fusionadas. Dentro de cada ola, todo en paralelo.

```
Ola 0 (1 sesión)  ->  Ola 1 (4 sesiones en paralelo)  ->  Ola 2 (integración y despliegue)
```

### Ola 0: andamiaje del repo (una sesión)

- **Rama:** `ola0/andamiaje`. **Dependencias:** ninguna. **Tiempo estimado:** 1-2 h (estimación).
- **Ficheros que toca:** todo el esqueleto. `package.json` (versiones fijadas), `vite.config.js`, `.env.example`, `.gitignore` (incluye `.env`), `server/index.mjs`, `server/env.mjs`, `server/facts.mjs`, `server/facts.test.mjs`, `cases/` (copia de `/home/user/AL-Goritmo-x-Sherpas/cases/`), `src/main.jsx`, `src/App.jsx` (router por hash `#/p01` a `#/p17`), `src/store.js`, `src/content/es.js` (copia de content-es.js), `src/lib/{api,fmt,share}.js`, `src/screens/*` y `src/components/*` como componentes base vacíos, `docs/CONTRATO.md`, `README.md` (el de README-APP.md).
- **Prompt para pegar:**
  ```
  Eres la sesión de andamiaje de la app "Vuestro plan, en vuestras palabras". Lee BASES.md §0, PLAN-TECNICO.md (§1-§5), PANTALLAS.md §0.3 y README-APP.md.
  Crea el repo con Vite + React 18 (JS), un servidor Node 20 (server/index.mjs) que sirve /api y dist/, y .env.example con TEAM_KEY, LLM_PROXY_URL, PORT, PUBLIC_URL, TG_TOKEN, TG_CHAT, NTFY_TOPIC.
  Copia content-es.js a src/content/es.js sin cambiar claves. Copia los 4 casos de /home/user/AL-Goritmo-x-Sherpas/cases/ a cases/.
  Escribe server/facts.mjs (loadCase solo con campos numéricos; cada getter devuelve null si falta la ruta; la proyección se busca por year) y sus tests contra el JSON de timothy-melanie-weah. Busca la ruta del perfil de riesgo por persona.
  Monta el router por hash (P01-P17 como pantallas vacías con su título), el store Zustand con la forma de PANTALLAS §0.3 persistido en localStorage, lib/fmt.js ("3.240 $") y los componentes vacíos con sus props: GuessChart, YearPicker, Reveal, PassPhone, JargonTerm, ExpertToggle, Footer, HelpButton.
  Escribe docs/CONTRATO.md con: forma de loadCase/facts, estado del store, componentes y props, rutas API, claves de content-es.js por pantalla, y una tabla "Estado".
  Hecho cuando: npm i && cp .env.example .env && npm start arranca, GET /api/health responde, npm test pasa y #/p01 a #/p17 navegan. Abre PR a main.
  ```
- **Criterio de hecho:**
  - `npm test` verde con las cifras de Weah (comprobadas con `jq` sobre `financial-health.json`): nota 60; `score.top_moves` 62/60/60; `score.combined_moves` 78/73/62/60; saldo de la tarjeta 18.000 al 0,18; 270 $ al mes de intereses; `ccPayoffDate` 2039-09-01; proyección de 2079 = 16.115.848 y 3.359.400 de hoy.
  - `node scripts/check-cases.mjs` carga los 4 casos e imprime los `null` por caso (Weah: 0 `null` en los campos del núcleo).
  - Captura de Playwright a 390 px de `#/p01` vacía, sin errores de consola.
  - `docs/CONTRATO.md` fusionado en `main` antes de lanzar la Ola 1.

### Ola 1: cuatro sesiones en paralelo

Todas parten de `main` tras la Ola 0, leen `docs/CONTRATO.md` y solo tocan sus ficheros. Tiempo estimado por bloque: 2-4 h (estimación).

#### 1A. Flujo P01-P03 + P08-P09 (rama `ola1/flujo`)

- **Pantallas:** P01 (gancho + contador), P02 (pregunta al jurado, solo `?demo=1`), P03 (quién sois: pareja o individual, frase propia, novato o experto), P08 (revelación de la tarjeta, ramas P08-a y P08-b), P09 (palanca, test opcional).
- **Ficheros:** `src/screens/Hook.jsx`, `Who.jsx`, `Cycle.jsx` (parte tarjeta), `src/components/GuessChart.jsx`, `ExpertToggle.jsx`, `JargonTerm.jsx` (2 términos: under insured y umbrella). Claves `p01`, `p02`, `p03`, `p08`, `p09` de `es.js`.
- **Dependencias:** Ola 0. Usa `facts.card` y `facts.score`; no depende de las otras ramas de la Ola 1.
- **Prompt:**
  ```
  Eres la sesión del flujo inicial. Lee BASES §0 y §16-§17, docs/CONTRATO.md y las secciones P01, P02, P03, P08 y P09 de PANTALLAS.md, y las claves p01, p02, p03, p08, p09 de src/content/es.js.
  Construye esas pantallas en src/screens y los componentes GuessChart (barra tocable en SVG con botones -/+ de 44 px, sin valor inicial) y ExpertToggle, con la forma del contrato.
  El contador de P01 sale de facts.card (interés anual) y no se escribe a mano. P08 decide la rama por error y seguridad con los umbrales de BASES §16 (error <= 20 % cerca, > 50 % lejos; fechas +-2 y > 6 años). P09 muestra la palanca con el 62 de score.top_moves[0].
  P02 solo aparece con ?demo=1. Todo texto viene de es.js por clave; ninguna cifra escrita a mano. Pie fijo y "Hablarlo con una persona" en cada pantalla.
  Hecho cuando: npm test pasa (incluye un test de la función de rama con casos de borde), y hay capturas de Playwright a 390 px de P01, P03, P08-a y P08-b en docs/capturas/. Abre PR a main.
  ```
- **Criterio de hecho:** test de la rama (acierta/falla) en verde; las 4 capturas a 390 px sin scroll horizontal; el contador de P01 muestra 3.240 $ (18 % x 18.000) leído de `facts`; recargar conserva el estado.

#### 1B. Pareja P04-P07 + seguro P11 (rama `ola1/pareja-seguro`)

- **Pantallas:** P04 (turno de cada uno, un componente), P05 (pantalla opaca "pásale el móvil"), P07 (revelación y perfiles de riesgo declarados), P11 (hoja de aviso y permiso P10, pregunta cerrada, una cifra, palanca).
- **Ficheros:** `src/screens/Couple.jsx`, `Cycle.jsx` (parte seguro, en un fichero aparte `CycleInsurance.jsx` para no chocar con 1A), `src/components/YearPicker.jsx`, `PassPhone.jsx`, `Reveal.jsx`. Claves `p04`, `p05`, `p07`, `p11`.
- **Dependencias:** Ola 0. Usa `facts.household[i].risk_profile` (Timothy Growth, Melanie Moderate) y `facts.protection`.
- **Prompt:**
  ```
  Eres la sesión de pareja y seguro. Lee BASES §0, §16-§18, docs/CONTRATO.md, las secciones P04, P05, P07 y P11 de PANTALLAS.md y las claves p04, p05, p07, p11 de src/content/es.js.
  Construye YearPicker (chips por década y botones -/+ de 44 px), PassPhone (fases A -> pantalla opaca -> B -> revelación; las respuestas se guardan pero no se pintan hasta revelar; persistir en cada paso) y Reveal.
  P07 muestra tras la revelación los perfiles de riesgo declarados leídos de facts.household[i].risk_profile. P11 es el ciclo del seguro con una sola rama (falla estando seguro): hoja inferior de aviso y permiso, pregunta cerrada y una cifra de facts.protection.
  En pareja solo se adivina la fecha de fin de la tarjeta (BASES §16). Textos solo por clave de es.js; ninguna cifra escrita a mano.
  Hecho cuando: npm test pasa (incluye un test de que PassPhone no expone la respuesta de A durante el turno de B) y hay capturas de Playwright a 390 px de P04, P05, P07 y P11 en docs/capturas/. Abre PR a main.
  ```
- **Criterio de hecho:** test de privacidad del turno en verde; si falta un dato en `facts`, el ciclo del seguro se oculta sin romper el flujo (test con `null`); capturas a 390 px de las 4 pantallas; la revelación muestra "Timothy: Growth · Melanie: Moderate" desde el JSON.

#### 1C. Escalera P12-P13 + hoja P17 (rama `ola1/escalera-hoja`)

- **Pantallas:** P12 (escalera con botones Subir/Bajar de 44 px, tarjeta de lectura 2079, nota de cada orden), P13 (primer paso con "cómo se hace", día y hora), P17 (cierre "creíais X, ahora sabéis Y" y hoja del asesor en 3 bloques: preguntas, miedos y decisiones).
- **Ficheros:** `src/screens/Ladder.jsx`, `Close.jsx`, `Sheet.jsx`, `src/components/` propios (`LadderStep`, `ReadingCard`). Claves `p12`, `p13`, `p17`.
- **Dependencias:** Ola 0. Usa `facts.score.combined_moves` y `facts.projection`. No necesita las otras ramas: arranca con un estado simulado del store para las respuestas.
- **Prompt:**
  ```
  Eres la sesión de escalera y hoja. Lee BASES §0, §16-§17 y §20-§21, docs/CONTRATO.md, las secciones P12, P13 y P17 de PANTALLAS.md y las claves p12, p13, p17 de src/content/es.js.
  Construye la escalera con botones Subir/Bajar de 44 px como control principal (arrastre opcional, aria-live) y la nota de cada orden leída de score.combined_moves (78, 73, 62 y 60 sin tarjeta); si falta una combinación, "sin dato del plan", nunca calcular.
  Tarjeta de lectura: la proyección de 2079 buscada por year (no por índice) con su valor de hoy. P13: primer paso con día y hora (por defecto el próximo lunes a las 19:00, editable). P17: cabecera y hoja del asesor ordenada por salto de nota de top_moves; "Pedir cita" abre la hoja con el aviso "Esto es lo que recibiría vuestro asesor" y no envía nada.
  Cumplimiento: "Vuestro plan propone empezar por…" y pie fijo. Sin cifras escritas a mano.
  Hecho cuando: npm test pasa (test de las 4 notas y de la búsqueda por year) y hay capturas de Playwright a 390 px de P12, P13, P17 y la hoja en docs/capturas/. Abre PR a main.
  ```
- **Criterio de hecho:** test con 78/73/62/60 y 2079 = 16.115.848 (3.359.400 de hoy) en verde; reordenar con los botones actualiza la nota; hoja con 3 bloques; capturas a 390 px.

#### 1D. Back (rama `ola1/back`)

- **Alcance:** `POST /api/session` y `GET /api/session/:sid`, enlace con estado (`#st=<lz-string>` y `?sid=` corto), `POST /api/notify` con texto fijo (Telegram, respaldo ntfy a los 5 s), P15 y P16 con texto fijo.
- **Pantallas y ficheros:** P15 (día 3) y P16 (día 7). `server/sessions.mjs`, `server/notify.mjs`, `server/index.mjs` (solo añadir rutas), `src/screens/DayN.jsx`, `src/lib/share.js`, `src/lib/api.js`. Claves `p15`, `p16`.
- **Dependencias:** Ola 0. El envío real necesita el bot y las claves de la sección 4; mientras no existan, `notify` devuelve un resultado simulado y el test lo cubre.
- **Prompt:**
  ```
  Eres la sesión de back y días N. Lee BASES §0, §16-§19, PLAN-TECNICO §4-§6, docs/CONTRATO.md, las secciones P15 y P16 de PANTALLAS.md y las claves p15 y p16 de src/content/es.js.
  Implementa server/sessions.mjs (Map con volcado a data/sessions.json), POST /api/session -> {sid,url}, GET /api/session/:sid, y el enlace con estado #st=<lz-string> que funciona aunque el servidor reinicie.
  Implementa POST /api/notify: plantilla fija en código (año del jurado, ccPayoffDate y "270 $ al mes de intereses", todo desde facts) y enlace al día 3 con ?sid=; envía por Telegram (TG_TOKEN, TG_CHAT) y, si no responde en 5 s, por ntfy.sh (NTFY_TOPIC). Sin variables, devuelve {sent:false, reason} sin romper.
  Construye P15 y P16 con texto fijo (sin IA) y la etiqueta "Texto del equipo". P16 pide el saldo con inputmode="decimal" y lo compara con la cifra del plan; no calcula notas nuevas. ?day=7 entra directo al día 7. No toques las pantallas de otros bloques.
  Hecho cuando: npm test pasa (sesión creada y recuperada tras reiniciar, notify con Telegram simulado que falla y cae en ntfy, arranque sin .env) y hay capturas de Playwright a 390 px de P15 y P16 en docs/capturas/. Abre PR a main.
  ```
- **Criterio de hecho:** tests de sesión, enlace y respaldo en verde; el arranque sin `.env` no da errores; capturas de P15 y P16 a 390 px; el enlace abre el día 3 sin login.

### Ola 2: integración, captura de punta a punta y despliegue

- **Rama:** `ola2/integracion`. **Dependencias:** las 4 ramas de la Ola 1 fusionadas. **Sesiones:** una de integración y, en paralelo, una de despliegue (necesita la cuenta de la sección 4).
- **Ficheros que toca:** `src/App.jsx` (navegación entre pantallas), `src/screens/*` solo para arreglar conexiones, `tests/e2e/flujo.spec.mjs`, `render.yaml` o equivalente, `README.md`.
- **Prompt (integración):**
  ```
  Eres la sesión de integración. Lee BASES §0, docs/CONTRATO.md (tabla Estado) y la tabla de tiempos de PANTALLAS.md.
  Conecta el flujo completo en pareja (P01 -> P02 si ?demo=1 -> P03 -> P04-P05-P04 -> P07 -> P08-P09 -> P11 -> P12 -> P13 -> P17) y el individual (sin P04, P05 y P07). P15 y P16 por enlace. Arregla solo costuras entre pantallas; no rediseñes.
  Escribe un test de Playwright a 390 px que recorra todo el flujo con el caso Weah y guarde una captura por pantalla en docs/capturas/e2e/. Comprueba que ninguna cifra mostrada falta en facts.
  Hecho cuando: npm test y el test e2e pasan, no hay errores de consola y recargar en cualquier pantalla conserva el estado. Abre PR a main.
  ```
- **Prompt (despliegue):**
  ```
  Eres la sesión de despliegue. Lee PLAN-TECNICO §1 y README-APP.md. Prepara el despliegue de un solo servicio (API + dist/) en Render o equivalente: build, comando de arranque, variables de entorno vacías documentadas, GET /api/health y URL fija para PUBLIC_URL. No pongas claves en el repo. Documenta en README.md los pasos que debe hacer un humano. Hecho cuando: un clon limpio arranca con npm i && cp .env.example .env && npm start y la configuración de despliegue está en main.
  ```
- **Criterio de hecho:** el flujo completo pasa en Playwright con 11 capturas (una por pantalla del flujo de pareja, a 390 px) y `main` despliega sin pasos manuales ocultos. Lo que se vea feo o falte se apunta en la sección 3, no se arregla en la Ola 2.

---

## 3. Lo secundario (después del sábado), por orden de prioridad

Se hace cuando la Ola 2 esté fusionada. Una sesión de Claude por punto, con la misma regla de rama y criterio de hecho. Orden:

1. **Textos y cumplimiento al 100 %:** repasar que cada pantalla use "Vuestro plan propone…", el pie fijo y la etiqueta de IA o "Texto del equipo" (BASES §19). Comprobación: script que busca imperativos y cifras escritas a mano en `src/`.
2. **IA del día 3 con validación** (`server/llm.mjs`, `scripts/prefetch.mjs`, `POST /api/ai/day3`): cola de 3 concurrentes, `numbersOk` (todo número del texto debe estar en la entrada o en la respuesta del usuario), respaldo a texto fijo. Solo si el núcleo funciona (BASES §18). Comprobación: test con una respuesta con número inventado que cae a texto fijo.
3. **Pulido visual en 390 px:** espaciado, tipografía, foco visible, objetivos de 44 px, `aria-live` en la escalera. Comprobación: capturas antes y después.
4. **Glosa** (resto de términos más allá de under insured y umbrella). Es lo primero que se corta si hay retraso (BASES §21).
5. **Versión B del pitch** (pitch de una sola idea, BASES §21) y la media página con el dato propio. Decisión del equipo.
6. **Arrastre opcional en la escalera** (dnd-kit con TouchSensor, retraso de 150 ms); los botones ya funcionan.
7. **Ciclo "hoy vs mañana", otros 3 casos cargando** y novato/experto en el ciclo 2 (BASES §0, columna "si sobra").
8. **.ics** (generado a mano; probar en iPhone y Android) y, con menos prioridad, la pregunta de riesgo en pareja.
9. **Prueba de arranque sin `TEAM_KEY`**, prueba de carga ligera y `README` final.

Solo diseñado, no se construye (BASES §0): inglés, días 14, 21 y 30, audio, dos móviles con sala, IA del día 14.

Congelación: el núcleo se congela el lunes 16 por la noche (BASES §21). Martes y miércoles solo ensayos, la cadena Telegram a ntfy, móviles reales, la prueba con personas y arreglos de errores.

---

## 4. Solo humanos (lo que un Claude no puede hacer)

Los tiempos son estimaciones del equipo de planificación.

| Tarea | Día | Tiempo | Notas |
|---|---|---|---|
| Crear el bot de Telegram (con @BotFather) y hacer `/start` desde el móvil del pitch; pasar `TG_TOKEN` y `TG_CHAT` | Sáb 14 | 20-30 min | Desbloquea el bloque 1D con envío real |
| Instalar ntfy en el móvil y elegir el tema (`NTFY_TOPIC`) | Sáb 14 | 10 min | Respaldo si Telegram falla |
| Crear la cuenta en Render (o similar), conectar el repo de GitHub y confirmar condiciones del plan gratis | Sáb 14 | 30-45 min | La sesión de despliegue de la Ola 2 deja los pasos en README |
| Meter las claves en `.env` local y en las variables del servicio (`TEAM_KEY`, `LLM_PROXY_URL`, `PUBLIC_URL`, `TG_TOKEN`, `TG_CHAT`, `NTFY_TOPIC`) | Sáb 14 (tras la cuenta) | 15 min | Nunca subir `.env` a git; `TEAM_KEY` solo en el backend |
| Preguntas a mentores en Discord (PREGUNTAS-MENTORES.md: 6 preguntas que no revelan la idea) | Sáb 14 y dom 15 | 30 min | Las respuestas cambian qué se hace según el documento |
| Abrir el plan en el navegador y confirmar cómo son el tour y el chat (pendiente de BASES §3) | Dom 15 | 20 min | |
| Probar en móviles reales (iPhone y Android): flujo completo, recepción del mensaje con pantalla bloqueada, No molestar y ahorro de batería desactivados | Lun 16 por la noche y mar 17 | 1-2 h | Anotar fallos para sesiones de Claude |
| Prueba con personas: 2 sesiones guiadas (2 parejas) y 2-3 individuales; repartir el enlace de una sola pregunta (fecha de fin de la tarjeta) al club y a conocidos; contar solo el recuento real con su N, rotulado "no es estadística" | Lun 16 (enviar enlace) y mar 17 | 3-4 h | El recuento se cita en el pitch y la media página |
| Grabar el vídeo de la demo | Mié 18 | 1-2 h | Con la URL desplegada |
| Enviar `/entrega` (repo público, enlace o pasos de arranque, vídeo, media página) | Mié 18, antes de las 18:00 recomendado; límite 23:59 | 30 min | |
| Ensayar el pitch (3 ensayos con cronómetro, uno en el recinto) y darlo | Mar 17, mié 18 y jue 19 (demo 12:45) | 2-3 h en total + la demo | Hotspot 4G propio, móvil proyectado, captura de reserva (BASES §20) |

---

## 5. Calendario sáb-mié

| Día | Claudes (en paralelo) | Humanos |
|---|---|---|
| Sáb 14 | Ola 0 por la mañana; Ola 1 (1A, 1B, 1C, 1D) tras fusionar la Ola 0; Ola 2 por la tarde-noche | Bot de Telegram, ntfy, cuenta de Render, claves en `.env`, preguntas a mentores |
| Dom 15 | Secundario 1-3 (textos, IA del día 3 si el núcleo funciona, pulido); arreglos de la Ola 2 | Plan en el navegador (tour y chat), móviles reales (primera pasada), mentores |
| Lun 16 | Secundario 3-4 y arreglos; **núcleo congelado por la noche** | Enviar el enlace de una pregunta; primeras sesiones; móviles reales |
| Mar 17 | Solo arreglos de errores de la prueba y de los móviles | Prueba con personas, recuento, ensayo 2 |
| Mié 18 | Despliegue final, `/api/health`, README, media página con el dato | Vídeo, `/entrega` antes de las 18:00 (límite 23:59), ensayo 3 |
| Jue 19 | Ninguna | Ensayo en el recinto por la mañana; demo a las 12:45 |
