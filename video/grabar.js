// Graba las escenas de la web en el móvil (390x844, pantalla x2) como fotogramas JPG con su hora.
// Uso: node video/grabar.js            -> graba todas las escenas de escenas.js
//      node video/grabar.js pareja ... -> solo esas
// Arranca la web en local (scripts/serve.mjs) y la cierra al terminar.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SALIDA = path.join(__dirname, '.grabaciones');
const PUERTO = process.env.PORT || '8123';
const ESCENAS = require('./escenas.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Toque visible en cada pulsación y ocultar la duración de la reunión (Sherpas aún no la ha confirmado).
const INYECTAR = `
addEventListener('pointerdown', e => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:'+(e.clientX-22)+'px;top:'+(e.clientY-22)+'px;width:44px;height:44px;border-radius:50%;background:rgba(40,30,90,.28);border:2px solid rgba(255,255,255,.9);z-index:2147483647;pointer-events:none;transition:transform .45s ease-out,opacity .45s ease-out;transform:scale(.6);opacity:1';
  document.documentElement.appendChild(d);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.transform='scale(1.5)';d.style.opacity='0';}));
  setTimeout(()=>d.remove(),600);
}, true);
new MutationObserver(() => {
  document.querySelectorAll('body *').forEach(el => {
    if (el.children.length === 0 && /·\\s*30\\s*min/i.test(el.textContent)) el.textContent = el.textContent.replace(/\\s*·\\s*30\\s*min/i, '');
  });
}).observe(document, { subtree: true, childList: true, characterData: true });
`;

async function esperarWeb(url) {
  for (let i = 0; i < 50; i++) { try { const r = await fetch(url); if (r.ok) return; } catch {} await sleep(200); }
  throw new Error('La web no arranca en ' + url);
}

async function grabar(browser, nombre) {
  const OUT = path.join(SALIDA, nombre);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(INYECTAR);
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  const frames = [], marks = [];
  let n = 0;
  cdp.on('Page.screencastFrame', async f => {
    const name = `f${String(n++).padStart(5, '0')}.jpg`;
    fs.writeFileSync(path.join(OUT, name), Buffer.from(f.data, 'base64'));
    frames.push([f.metadata.timestamp, name]);
    try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }); } catch {}
  });
  const mark = m => { marks.push([Date.now() / 1000, m]); console.log(`  ${nombre}: ${m}`); };
  const vis = sel => p.locator(sel).filter({ visible: true });
  async function tap(sel, opts = {}) {
    const l = typeof sel === 'string' ? vis(sel).nth(opts.nth ?? 0) : sel;
    await l.waitFor({ state: 'visible', timeout: 15000 });
    await sleep(opts.pre ?? 350);
    await l.scrollIntoViewIfNeeded().catch(() => {});
    const bb = await l.boundingBox();
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 8 });
    await p.mouse.down(); await sleep(90); await p.mouse.up();
    await sleep(opts.post ?? 600);
  }
  const tapText = (re, opts) => tap(p.locator('button, a, summary').filter({ hasText: re, visible: true }).last(), opts);
  async function slide(frac, ms = 900) {
    const l = vis('input[type=range]').first();
    await l.waitFor({ state: 'visible', timeout: 15000 });
    await sleep(1300); // la tarjeta entra animada: esperar a que esté quieta
    const bb = await l.boundingBox();
    const y = bb.y + bb.height / 2, x0 = bb.x + bb.width / 2, x1 = bb.x + 12 + (bb.width - 24) * frac;
    await p.mouse.move(x0, y); await p.mouse.down();
    for (let i = 1; i <= 30; i++) { const k = i / 30, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; await p.mouse.move(x0 + (x1 - x0) * e, y); await sleep(ms / 30); }
    await p.mouse.up(); await sleep(500);
  }
  async function scroll(px, ms = 1500) {
    const steps = Math.max(1, Math.round(ms / 30));
    await p.mouse.move(195, 420);
    for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, px / steps); await sleep(ms / steps); }
  }
  async function start(url) {
    await p.goto(`http://localhost:${PUERTO}/app/${url}`);
    await p.evaluate(() => document.fonts.ready);
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
  }
  await ESCENAS[nombre]({ p, start, tap, tapText, slide, scroll, sleep, mark, vis });
  await sleep(300);
  await cdp.send('Page.stopScreencast');
  fs.writeFileSync(path.join(OUT, 'frames.json'), JSON.stringify({ frames, marks }));
  await ctx.close();
}

(async () => {
  const pedidas = process.argv.slice(2);
  const nombres = pedidas.length ? pedidas : Object.keys(ESCENAS);
  const web = spawn(process.execPath, [path.join(RAIZ, 'scripts', 'serve.mjs')], { env: { ...process.env, PORT: PUERTO }, stdio: 'ignore' });
  try {
    await esperarWeb(`http://localhost:${PUERTO}/app/`);
    const browser = await chromium.launch();
    for (const n of nombres) { console.log('Grabando', n); await grabar(browser, n); }
    await browser.close();
  } finally { web.kill(); }
})().catch(e => { console.error(e); process.exit(1); });
