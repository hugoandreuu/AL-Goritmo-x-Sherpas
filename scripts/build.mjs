// Genera la web en un solo archivo, con los JSON del caso dentro.
//   dist/plan-weah.html   → se abre con doble clic, sin servidor
//   dist/site/index.html  → lo que publica GitHub Pages
// Uso: npm run build
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const app = join(root, 'app');
const caseDir = join(root, 'cases', 'timothy-melanie-weah');

const read = p => readFile(p, 'utf8');
const data = {
  fh: JSON.parse(await read(join(caseDir, 'financial-health.json'))),
  ia: JSON.parse(await read(join(caseDir, 'investment-analysis.json'))),
};
const payload = JSON.stringify(data).replaceAll('</', '<\\/');

let html = await read(join(app, 'index.html'));
const css = await read(join(app, 'styles.css'));
html = html.replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${css}\n</style>`);

const scripts = [...html.matchAll(/<script src="([\w.-]+)"><\/script>/g)];
for (const [tag, src] of scripts) {
  const js = (await read(join(app, src))).replaceAll('</script', '<\\/script');
  const pre = src === 'facts.js' ? `<script>window.__CASE_DATA__=${payload};</script>\n` : '';
  html = html.replace(tag, () => `${pre}<script>\n${js}\n</script>`);
}

await mkdir(join(root, 'dist', 'site'), { recursive: true });
await writeFile(join(root, 'dist', 'plan-weah.html'), html);
await writeFile(join(root, 'dist', 'site', 'index.html'), html);
console.log(`dist/plan-weah.html y dist/site/index.html (${Math.round(html.length / 1024)} KB)`);
