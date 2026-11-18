// Escenas que se graban de la web. Cada una es un recorrido con pulsaciones reales.
// mark('nombre') deja una marca de tiempo: guion.py corta los clips a partir de esas marcas.
// Si cambia la web (textos de botones, orden de pantallas), aquí es donde hay que tocar.
module.exports = {
  async pareja({ start, tap, tapText, slide, scroll, sleep, mark, vis, p }) {
    await start('?reset');
    mark('landing'); await sleep(3500);
    await tapText(/Los dos juntos/);
    await vis('text=Empieza Timothy').waitFor({ timeout: 15000 });
    mark('intro'); await sleep(2200);
    await tapText(/Empieza Timothy/);
    mark('t_q1'); await sleep(2600);
    await tapText(/colchón nos deje/); await sleep(600);
    await tapText(/Guardar en secreto/);
    await sleep(2200);
    mark('t_q2');
    await slide(0.33); await sleep(400);
    await tapText(/Guardar respuesta/);
    mark('t_q3'); await sleep(2200);
    await tap('button.pj-tile', { nth: 2 }); await tap('button.pj-tile', { nth: 5 });
    await tapText(/Guardar respuesta/);
    mark('handoff'); await sleep(2500);
    await tapText(/Soy Melanie/);
    mark('m_start'); await sleep(2000);
    await tapText(/Liam y Josh/, { post: 500 }); await tapText(/Guardar en secreto/); mark('m_q2'); await sleep(2000);
    await slide(0.63, 800); await tapText(/Guardar respuesta/); mark('m_q3'); await sleep(2000);
    await tap('button.pj-tile', { nth: 1, post: 400 }); await tap('button.pj-tile', { nth: 6, post: 500 });
    await tapText(/Guardar respuesta/);
    mark('rev_dinero'); await sleep(6500);
    await tapText(/Seguir: vuestro riesgo/);
    mark('rev_riesgo'); await sleep(5500);
    await tapText(/Seguir: vuestros hijos/);
    mark('hijos'); await sleep(1500);
    await slide(0.65); await tapText(/Ver lo que dice/);
    mark('rev_hijos'); await sleep(5000);
    await tapText(/Una última pregunta/);
    mark('nota'); await sleep(1500);
    await slide(0.6); await tapText(/Ver vuestra nota/);
    mark('rev_nota'); await sleep(5000);
    await tapText(/Ver qué propone/);
    mark('propone'); await sleep(3500);
    await scroll(420, 2200); await sleep(1200);
    await tapText(/Pedir reunión con el asesor/);
    mark('reunion'); await sleep(1800);
    await tap('button.day >> text=/^20$/'); await sleep(300);
    await tapText(/^13:00$/); await sleep(300);
    await tap('button.pj-thumb.a', { post: 300 }); await tap('button.pj-thumb.b', { post: 400 });
    await tapText(/Pedir esta reunión/);
    mark('pedida'); await sleep(3000);
    await p.locator('text=Lo que vuestro asesor ya sabe').first().scrollIntoViewIfNeeded().catch(()=>{});
    await p.evaluate(() => { const h = [...document.querySelectorAll('h2,h3,h4,p,div,b,strong')].find(e => e.children.length===0 && /Lo que vuestro asesor ya sabe/.test(e.textContent)); h && h.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    mark('sabe'); await sleep(4500);
    mark('end');
  },
  async michael({ start, tap, tapText, slide, scroll, sleep, mark, vis, p }) {
    await start('?caso=michael-carter&reset');
    mark('landing'); await sleep(2000);
    await tapText(/^Empezar/);
    mark('bridge'); await sleep(4200);
    mark('q0'); await tapText(/dinero para la casa/); await sleep(500);
    await tap('button.btn.block >> text=Seguir');
    mark('q1'); await sleep(1800);
    await slide(0.25); await tapText(/Ver el dato/);
    mark('rev1'); await sleep(5000);
    await scroll(520, 1800); await sleep(800);
    await tapText(/Me preocupa/); await sleep(800);
    await tap('button.btn.block >> text=Seguir');
    for (let i = 0; i < 3; i++) {
      mark('qx' + i); await sleep(1600); await slide(0.6, 400); await tapText(/Ver el dato/); await sleep(1200);
      await tapText(/No lo sabía/, { post: 300 }); await tap('button.btn.block >> text=Seguir', { post: 300 });
    }
    await sleep(1800); await tap('button.sg', { nth: 0 });
    await tapText(/Ver tu plan/);
    mark('camino'); await sleep(10500);
    await tapText(/Ver tu informe/);
    mark('informe'); await sleep(4000);
    await scroll(900, 3500); await sleep(1500);
    await scroll(600, 2500); await sleep(1500);
    mark('end');
  },
  async informe({ start, tap, tapText, slide, scroll, sleep, mark, vis, p }) {
    await start('?caso=timothy-melanie-weah&demo=plan');
    mark('top'); await sleep(2500);
    await scroll(700, 2600); mark('cards'); await sleep(1500);
    await scroll(750, 2800); await sleep(1500);
    await scroll(-1450, 1800); await sleep(800);
    mark('tap'); await tap('button.nodo', { nth: 2 });
    mark('tema'); await sleep(2500);
    await scroll(650, 2400); await sleep(1500);
    await scroll(700, 2400); await sleep(1800);
    mark('end');
  },
  async story({ start, tap, tapText, slide, scroll, sleep, mark, vis, p }) {
    await start('?caso=timothy-melanie-weah&demo=story');
    mark('top'); await sleep(2500);
    for (let i = 0; i < 4; i++) {
      await p.mouse.move(320, 450); await p.mouse.down();
      for (let k = 1; k <= 20; k++) { await p.mouse.move(320 - k * 11, 450); await sleep(16); }
      await p.mouse.up(); await sleep(1500);
    }
    for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowLeft'); await sleep(250); }
    await sleep(1200);
    mark('open'); await p.mouse.move(195, 560, { steps: 8 }); await p.mouse.down(); await sleep(90); await p.evaluate(() => document.querySelector('.rul-card.front .rul-abrir').click()); await p.mouse.up();
    await sleep(2500);
    await scroll(600, 2200); await sleep(1500);
    await scroll(600, 2200); await sleep(1500);
    mark('end');
  },
  async familias({ start, sleep, mark, p }) {
    const casos = ['timothy-melanie-weah', 'daniel-emily-johnson', 'michael-carter', 'samantha-lewis'];
    await start(`?caso=${casos[0]}&reset`); mark(casos[0]); await sleep(3500);
    for (const c of casos.slice(1)) { await p.goto(p.url().replace(/\?.*/, `?caso=${c}&reset`)); mark(c); await sleep(3500); }
    mark('end');
  },
};
