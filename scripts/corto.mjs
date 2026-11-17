// Mete los resúmenes cortos en español (app/estudios/llm/<caso>.corto.json) en los estudios ya generados,
// sin volver a llamar al MCP ni al LLM. Cada resumen se comprueba contra el texto original del informe:
// si trae una cifra que no está en el original, se descarta y se avisa.
// Uso: npm run corto        (después: npm run build)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cortoValido } from './puntos.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = path.join(ROOT, 'app', 'estudios');
const indice = JSON.parse(fs.readFileSync(path.join(OUT, 'index.json'), 'utf8'));
let fallos = 0;
for (const { slug } of indice) {
  const fE = path.join(OUT, slug + '.json'), fC = path.join(OUT, 'llm', slug + '.corto.json');
  const E = JSON.parse(fs.readFileSync(fE, 'utf8'));
  const corto = fs.existsSync(fC) ? JSON.parse(fs.readFileSync(fC, 'utf8')) : {};
  let ok = 0;
  for (const n of E.narrativa || []) {
    const mal = corto[n.clave] ? cortoValido(n.en, corto[n.clave]) : 'falta';
    if (mal) { delete n.corto; fallos++; console.log(`  ${slug} · ${n.clave}: ${mal}`); } else { n.corto = corto[n.clave]; ok++; }
  }
  fs.writeFileSync(fE, JSON.stringify(E, null, 1) + '\n');
  console.log(`${slug}: ${ok} de ${(E.narrativa || []).length} textos del informe con resumen en español.`);
}
process.exitCode = fallos ? 1 : 0;
