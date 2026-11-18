# Vuestro plan de futuro

Equipo **AL-Goritmo** · reto «Bring the plan to life» de Sherpas · hackathon UPV, noviembre de 2026.

- **Para parejas:** cada uno contesta en privado en el mismo móvil qué cree de su propio plan y qué haría ante una caída de sus inversiones. Luego lo destapan juntos y lo comparan entre sí y con el plan de Sherpas (*Vuestro dinero, visto por los dos*).
- **Para todos:** la familia adivina cifras de su plan y ve el dato real con una imagen y una frase que lo hace sentir. Después ve su camino hasta la jubilación y lo que propone el plan, paso a paso.
- **Termina en la reunión con el asesor**, que recibe lo que creían, lo que les preocupa y lo que quieren preguntar. Ninguna cifra se inventa: todas salen del plan de cada familia.

**Demo:** https://hugoandreuu.github.io/AL-Goritmo-x-Sherpas/ (mejor en el móvil; se actualiza con cada cambio en `main`).

**Vídeo (2 min):** [verlo en Google Drive](https://drive.google.com/file/d/1JtANRoczL8k64QQrzJE9cUYiBZc87e_U/view?usp=sharing) (también en el repo: [video/presentacion.mp4](video/presentacion.mp4)) · **Qué hemos hecho y por qué, en media página:** [docs/MEDIA-PAGINA.md](docs/MEDIA-PAGINA.md)

**Equipo:** Hugo Andreu, Álex Cabanes y Daniel Torres Bursik.

## Qué mirar en dos minutos

1. Abre la demo. Sale la familia Weah (Timothy y Melanie).
2. Elige **Los dos juntos**. Contesta como Timothy, pasa el móvil y contesta como Melanie.
3. Mira cómo se destapa lo que creía cada uno: la tarjeta, el riesgo, hasta qué edad de su hijo cubre el seguro y la nota de salud financiera.
4. Al final, **Lo que propone vuestro plan**: los pasos con la nota que deja cada uno y el botón de pedir la reunión. Al confirmarla se ve lo que ya sabe el asesor.
5. Si te sobra tiempo, vuelve a la portada, cambia de familia (abajo, «Prototipo del reto») y prueba **Solo el quiz** o el caso de Michael Carter, que vive solo.

## Arrancar

Requisito: [Node.js](https://nodejs.org) 20 o superior. No hace falta `npm install` ni `.env`: los estudios ya están generados en el repo.

```bash
git clone https://github.com/hugoandreuu/AL-Goritmo-x-Sherpas.git
cd AL-Goritmo-x-Sherpas
npm start
```

Abre http://localhost:8000. Si el puerto está ocupado, `PORT=9000 npm start`.

Sin conexión: `npm run build` y abre `dist/plan.html` con doble clic.

Atajos de URL: `?caso=michael-carter` (o `samantha-lewis`, `daniel-emily-johnson`, `timothy-melanie-weah`) abre esa familia; `?reset` empieza de cero; `?demo=plan` va directo al informe y `?demo=story` al resumen.

## Cómo funciona

La app vale para cualquier plan de Sherpas, no para uno fijo. Para cada familia se genera un **estudio** con `npm run estudio`:

1. Los datos se piden al **MCP de Sherpas** (`list_cases`, `get_case`). Sin token se leen los mismos JSON de `cases/`.
2. El código saca las cifras del plan. La IA no calcula nada.
3. El **LLM de Sherpas** (`gpt-5-mini` por el proxy del reto) lee la persona y el resumen del plan, elige qué preguntar y en qué orden y escribe la frase que hace sentir cada dato.
4. Un control descarta cualquier frase con una cifra que no esté en el plan.

La web solo pinta ese estudio (`app/estudios/<caso>.json`): no llama a ningún servidor ni a ninguna IA cuando la familia la abre, y lo que contesta se queda en su navegador. Lo que ha pensado el LLM de cada familia se lee en [docs/estudios/](docs/estudios/).

Por qué es así y qué descartamos: [docs/brainstorming/decisiones.md](docs/brainstorming/decisiones.md).

## Estructura

```
app/            la web (HTML, CSS y JS sin frameworks). Detalle de cada pantalla en app/README.md
cases/          datos y PDF de las 4 familias del reto (no se tocan)
scripts/        estudio.mjs (genera los estudios), corto.mjs (resúmenes en español),
                build.mjs (archivo único y web de Pages), serve.mjs (servidor local)
docs/           RETO.md (enunciado), MEDIA-PAGINA.md (qué hemos hecho y por qué), estudios/ (lo que lee el LLM de cada familia),
                brainstorming/ (decisiones y por qué), visualizacion.md (reglas de las gráficas),
                archivo/ (planes e ideas antiguas, solo como historia)
examples/voice/ ejemplo de voz que venía con la plantilla (no se usa)
.github/        despliegue automático en GitHub Pages
```

## Generar los estudios con Sherpas

```bash
cp .env.example .env      # y pega MCP_TOKEN y TEAM_KEY de tu página de acceso
npm run estudio           # todos los casos que devuelva el MCP
npm run estudio -- michael-carter   # solo uno
npm run build
```

El token del MCP dura 72 horas. Sin token, el script lee `cases/`; sin clave del LLM, reutiliza lo que el LLM dejó escrito en `app/estudios/llm/` (o usa frases de plantilla). Cada estudio dice de dónde salieron sus datos y sus frases. Si sales a internet por un proxy: `NODE_USE_ENV_PROXY=1 npm run estudio` (Node 22.21 o superior).

Los textos largos del informe vienen en inglés. La app los enseña resumidos en español, punto a punto, desde `app/estudios/llm/<caso>.corto.json`; cada punto se descarta si trae una cifra que no está en el original. Si solo cambias esos archivos: `npm run corto` y `npm run build`.

## Trabajar en equipo y desplegar

Una rama por cambio (`git switch -c nombre/lo-que-haces`), `npm start` para probar y pull request a `main`. `.github/workflows/pages.yml` ejecuta `npm run build` en cada push a `main` y publica `dist/site/` en GitHub Pages en un par de minutos.

No subas `.env` ni claves: solo hacen falta para regenerar los estudios y `.gitignore` ya las excluye.

## El reto

Enunciado, reglas de entrega y criterios: [docs/RETO.md](docs/RETO.md).
