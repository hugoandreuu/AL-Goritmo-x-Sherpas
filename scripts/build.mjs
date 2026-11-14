// Genera la web en un solo archivo, con los estudios de todos los casos dentro.
//   dist/plan.html        → se abre con doble clic, sin servidor
//   dist/site/index.html  → lo que publica GitHub Pages
// Uso: npm run build   (antes, si han cambiado los datos o las frases: npm run estudio)
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const app = join(root, 'app');
const read = p => readFile(p, 'utf8');

const index = JSON.parse(await read(join(app, 'estudios', 'index.json')));
const casos = {};
for (const c of index) casos[c.slug] = JSON.parse(await read(join(app, 'estudios', c.slug + '.json')));
const payload = JSON.stringify({ index, casos }).replaceAll('</', '<\\/');

let html = await read(join(app, 'index.html'));
const css = await read(join(app, 'styles.css'));
html = html.replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${css}\n</style>`);

const scripts = [...html.matchAll(/<script src="([\w.-]+)"><\/script>/g)];
for (const [tag, src] of scripts) {
  const js = (await read(join(app, src))).replaceAll('</script', '<\\/script');
  const pre = src === 'app.js' ? `<script>window.__ESTUDIOS__=${payload};</script>\n` : '';
  html = html.replace(tag, () => `${pre}<script>\n${js}\n</script>`);
}

await mkdir(join(root, 'dist', 'site'), { recursive: true });
await writeFile(join(root, 'dist', 'plan.html'), html);
await writeFile(join(root, 'dist', 'site', 'index.html'), html);
console.log(`dist/plan.html y dist/site/index.html (${Math.round(html.length / 1024)} KB, ${index.length} casos)`);
