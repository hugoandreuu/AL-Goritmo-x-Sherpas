# Vuestro plan en 5 minutos

Prototipo del equipo **AL-Goritmo** para el reto de Sherpas (hackathon UPV, noviembre de 2026).

Es una web para móvil que cuenta a una familia su plan financiero de Sherpas antes de la reunión con el asesor. Primero adivina unas pocas cifras de su propio plan. Según lo cerca que se quede, ve el dato real con una imagen y una frase pensada para que lo sienta. Después recorre su plan en pocas pantallas, marca los pasos que le convencen, deja sus preguntas para el asesor y pide la reunión.

Funciona con cualquier plan de Sherpas, no con uno fijo. Para cada caso se genera un **estudio** (`npm run estudio`):

1. Los datos se piden al **MCP de Sherpas** (`list_cases`, `get_case`). Sin token, se leen los mismos JSON de `cases/`.
2. El código saca las cifras del plan. La IA no calcula nada.
3. El **LLM de Sherpas** (`gpt-5-mini` por el proxy) lee la persona y el resumen del plan, elige qué preguntar y en qué orden, y escribe la frase que hace sentir cada dato.
4. Un control descarta cualquier frase con una cifra que no esté en el plan.

La app solo pinta ese estudio (`app/estudios/<caso>.json`). Lo que ha pensado el LLM de cada familia se puede leer en `docs/estudios/`.

**Demo publicada:** https://hugoar61108-ai.github.io/AL-Goritmo-x-Sherpas/ (se actualiza sola con cada cambio en `main`).

## Arrancar

Requisito: [Node.js](https://nodejs.org) 20 o superior. No hace falta `npm install`. Para ver la app tampoco hace falta `.env`: los estudios ya están generados en el repo.

```bash
git clone https://github.com/hugoar61108-ai/AL-Goritmo-x-Sherpas.git
cd AL-Goritmo-x-Sherpas
npm start
```

Abre http://localhost:8000. Si el puerto está ocupado, usa `PORT=9000 npm start`.

Para tener una versión de un solo archivo que se abre con doble clic (útil para la demo sin conexión), ejecuta `npm run build` y abre `dist/plan.html`.

Atajos de URL: `?caso=michael-carter` abre ese caso (también se cambia desde la portada o desde Ajustes); `?reset` empieza de cero; `?demo=story` y `?demo=plan` van directos al recorrido o al plan.

## Generar los estudios con Sherpas

```bash
cp .env.example .env      # y pega dentro MCP_TOKEN y TEAM_KEY de tu página de acceso
npm run estudio           # todos los casos que devuelva el MCP
npm run estudio -- michael-carter   # solo uno
npm run build
```

El token del MCP dura 72 horas. Sin token, el script lee `cases/`; sin clave del LLM, reutiliza lo que el LLM dejó escrito en `app/estudios/llm/` (o usa frases de plantilla si no hay nada). Cada estudio dice de dónde salieron sus datos y sus frases, y la app lo enseña al pie. Si tu equipo sale a internet por un proxy, lanza `NODE_USE_ENV_PROXY=1 npm run estudio` (Node 22.21 o superior).

## Estructura

```
app/            el prototipo (HTML, CSS y JS sin frameworks). Detalle en app/README.md
cases/          datos y PDF de las 4 familias del reto (no se tocan)
scripts/        estudio.mjs (genera los estudios con Sherpas), serve.mjs (servidor local) y build.mjs (un archivo y web para Pages)
docs/           RETO.md (enunciado), estudios/ (lo que lee el LLM de cada familia), planificacion/ y brainstorming/
examples/voice/ ejemplo de voz que venía con la plantilla
.github/        despliegue automático en GitHub Pages
```

Los documentos de `docs/planificacion/` describen el plan inicial (con backend, IA y Telegram). El MVP actual es más simple: una web estática que pinta los estudios; el MCP y el LLM se usan al generarlos, no cuando la familia abre la web.

## Trabajar en equipo

1. Crea una rama para tu cambio: `git switch -c nombre/lo-que-haces`.
2. Arranca con `npm start` y cambia lo que haga falta en `app/`.
3. Sube la rama y abre un pull request a `main`. Cuando se fusiona, la demo publicada se actualiza en un par de minutos.

No subas `.env` ni claves. Solo hacen falta para regenerar los estudios, y `.gitignore` ya las excluye.

## Despliegue

`.github/workflows/pages.yml` ejecuta `npm run build` en cada push a `main` y publica `dist/site/` en GitHub Pages. Es gratis para repos públicos y no necesita cuentas nuevas.

Paso único, lo hace el dueño del repo: **Settings > Pages > Build and deployment > Source: GitHub Actions**. Si Pages no está disponible, la alternativa es `npm start` en un portátil o el archivo `dist/plan.html`.

## El reto

El enunciado original, las reglas de entrega y el acceso a los modelos están en [docs/RETO.md](docs/RETO.md).
