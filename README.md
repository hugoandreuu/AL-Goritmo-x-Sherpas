# Vuestro plan en 5 minutos

Prototipo del equipo **AL-Goritmo** para el reto de Sherpas (hackathon UPV, noviembre de 2026).

Es una web para móvil que cuenta el plan financiero de la familia Weah según cómo quiere entenderlo cada persona. Primero adivinan cinco cifras de su dinero. Mientras tanto, un embudo de tres ajustes decide cómo presentar el plan: números, imagen o historia; conclusión o porqué; y lo justo o todo el detalle. Después ven su plan, contestan "¿Os convence?" a cada paso y dejan sus dudas. Al final reservan una reunión con el asesor, más o menos larga según las dudas que queden abiertas.

Todas las cifras salen de `cases/timothy-melanie-weah/*.json`. La IA no calcula nada.

**Demo publicada:** https://hugoar61108-ai.github.io/AL-Goritmo-x-Sherpas/ (se actualiza sola con cada cambio en `main`).

## Arrancar

Requisito: [Node.js](https://nodejs.org) 20 o superior. No hace falta `npm install` ni `.env`.

```bash
git clone https://github.com/hugoar61108-ai/AL-Goritmo-x-Sherpas.git
cd AL-Goritmo-x-Sherpas
npm start
```

Abre http://localhost:8000. Si el puerto está ocupado, usa `PORT=9000 npm start`.

Para tener una versión de un solo archivo que se abre con doble clic (útil para la demo sin conexión), ejecuta `npm run build` y abre `dist/plan-weah.html`.

Atajos de URL: `?reset` empieza de cero; `?demo=plan&f=image&d=why&t=calm` va directo a la presentación (`f` = numbers, image o story; `d` = quick o why; `t` = calm o full).

## Estructura

```
app/            el prototipo (HTML, CSS y JS sin frameworks). Detalle en app/README.md
cases/          datos y PDF de las 4 familias del reto (no se tocan)
scripts/        serve.mjs (servidor local) y build.mjs (versión de un archivo y web para Pages)
docs/           RETO.md (enunciado del reto), planificacion/ y brainstorming/
examples/voice/ ejemplo de voz que venía con la plantilla
.github/        despliegue automático en GitHub Pages
```

Los documentos de `docs/planificacion/` describen el plan inicial (con backend, IA y Telegram). El MVP actual es más simple: una web estática que lee el JSON.

## Trabajar en equipo

1. Crea una rama para tu cambio: `git switch -c nombre/lo-que-haces`.
2. Arranca con `npm start` y cambia lo que haga falta en `app/`.
3. Sube la rama y abre un pull request a `main`. Cuando se fusiona, la demo publicada se actualiza en un par de minutos.

No subas `.env` ni claves. Este prototipo no las necesita, y `.gitignore` ya las excluye.

## Despliegue

`.github/workflows/pages.yml` ejecuta `npm run build` en cada push a `main` y publica `dist/site/` en GitHub Pages. Es gratis para repos públicos y no necesita cuentas nuevas.

Paso único, lo hace el dueño del repo: **Settings > Pages > Build and deployment > Source: GitHub Actions**. Si Pages no está disponible, la alternativa es `npm start` en un portátil o el archivo `dist/plan-weah.html`.

## El reto

El enunciado original, las reglas de entrega y el acceso a los modelos están en [docs/RETO.md](docs/RETO.md).
