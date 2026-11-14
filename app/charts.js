/*
 * charts.js — gráficos SVG hechos a mano (sin librerías).
 * Cada marca lleva data-tip para el tooltip; los colores salen de las variables CSS.
 */
(function () {
  const F = () => window.Fmt;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // --- imágenes de las tarjetas (formato "Imagen") ---------------------------

  // De cada pago mensual, cuánto es interés.
  function interestBar(pay, interest) {
    const w = 320, h = 70, pct = interest / pay;
    return `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="De ${F().money(pay)} al mes, ${F().money(interest)} son intereses">
      <rect x="0" y="14" width="${w * pct - 2}" height="26" rx="4" fill="var(--s2)" data-tip="Intereses: ${F().money(interest)} al mes"/>
      <rect x="${w * pct}" y="14" width="${w * (1 - pct)}" height="26" rx="4" fill="var(--s1)" data-tip="Baja la deuda: ${F().money(pay - interest)} al mes"/>
      <text x="0" y="58">Intereses ${F().money(interest)}</text>
      <text x="${w}" y="58" text-anchor="end">Deuda ${F().money(pay - interest)}</text>
      <text x="0" y="9">Cada pago de ${F().money(pay)}</text>
    </svg>`;
  }

  // Línea de tiempo desde hoy hasta una fecha.
  function timeline(fromYear, toYear, label, marks = []) {
    const w = 320, h = 78, x0 = 8, x1 = w - 8;
    const span = Math.max(1, toYear - fromYear);
    const x = y => x0 + (x1 - x0) * (y - fromYear) / span;
    const m = marks.map(mk => `<circle cx="${x(mk.year)}" cy="34" r="6" fill="var(--s1)" stroke="var(--surface)" stroke-width="2" data-tip="${esc(mk.label)}: ${mk.year}"/>
      <text x="${x(mk.year)}" y="18" text-anchor="middle">${esc(mk.label)}</text>`).join('');
    return `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
      <line x1="${x0}" y1="34" x2="${x1}" y2="34" stroke="var(--line)" stroke-width="6" stroke-linecap="round"/>
      <line x1="${x0}" y1="34" x2="${x1}" y2="34" stroke="var(--s2)" stroke-width="6" stroke-linecap="round" opacity=".85"/>
      ${m}
      <circle cx="${x0}" cy="34" r="7" fill="var(--ink)" data-tip="Hoy"/>
      <circle cx="${x1}" cy="34" r="9" fill="var(--s2)" stroke="var(--surface)" stroke-width="2" data-tip="${esc(label)}"/>
      <text x="${x0}" y="64">Hoy · ${fromYear}</text>
      <text x="${x1}" y="64" text-anchor="end" style="font-weight:700;fill:var(--ink)">${esc(label)}</text>
    </svg>`;
  }

  // Dos barras horizontales comparadas (p. ej. lo que cuesta la tarjeta vs. lo que da el efectivo).
  function compareBars(items) {
    const w = 320, rowH = 44, max = Math.max(...items.map(i => i.value));
    const rows = items.map((it, i) => {
      const bw = Math.max(4, (w - 10) * it.value / max);
      return `<text x="0" y="${i * rowH + 12}">${esc(it.label)}</text>
        <rect x="0" y="${i * rowH + 18}" width="${bw}" height="16" rx="4" fill="${it.color}" data-tip="${esc(it.label)}: ${F().money(it.value)}"/>
        <text x="${Math.min(bw + 6, w - 60)}" y="${i * rowH + 31}" style="fill:var(--ink);font-weight:600">${F().money(it.value)}</text>`;
    }).join('');
    return `<svg class="viz" viewBox="0 0 ${w} ${items.length * rowH}" role="img" aria-label="${esc(items.map(i => i.label + ' ' + F().money(i.value)).join(', '))}">${rows}</svg>`;
  }

  // Años cubiertos: casillas de un año (hoy frente a lo recomendado).
  function yearBlocks(now, rec) {
    const n = Math.round(rec), have = Math.round(now), w = 320, gap = 4, bw = (w - gap * (n - 1)) / n;
    let s = '';
    for (let i = 0; i < n; i++) {
      s += `<rect x="${i * (bw + gap)}" y="8" width="${bw}" height="30" rx="4" fill="${i < have ? 'var(--s1)' : 'var(--surface-2)'}" stroke="${i < have ? 'none' : 'var(--line)'}" data-tip="Año ${i + 1}${i < have ? ': cubierto hoy' : ': sin cubrir'}"/>`;
    }
    return `<svg class="viz" viewBox="0 0 ${w} 62" role="img" aria-label="Hoy unos ${have} años cubiertos de unos ${n} recomendados">${s}
      <text x="0" y="56">Hoy: unos ${have} años</text><text x="${w}" y="56" text-anchor="end">Recomendado: unos ${n}</text></svg>`;
  }

  // Medidor simple de porcentaje.
  function gauge(pct, label) {
    const w = 320;
    return `<svg class="viz" viewBox="0 0 ${w} 56" role="img" aria-label="${esc(label)}">
      <rect x="0" y="10" width="${w}" height="20" rx="6" fill="var(--surface-2)"/>
      <rect x="0" y="10" width="${w * Math.min(1, pct)}" height="20" rx="6" fill="var(--s3)" data-tip="${esc(label)}"/>
      <line x1="${w}" y1="4" x2="${w}" y2="36" stroke="var(--ink-3)" stroke-dasharray="3 3"/>
      <text x="0" y="50">${esc(label)}</text><text x="${w}" y="50" text-anchor="end">100 %</text></svg>`;
  }

  // Escalera de nota 60 → 62 → 73 → 78.
  function scoreSteps(points) {
    const w = 320, h = 120, max = 100;
    const bw = (w - 12 * (points.length - 1)) / points.length;
    return `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="Nota: ${points.map(p => p.label + ' ' + p.value).join(', ')}">
      ${points.map((p, i) => {
        const bh = (h - 34) * p.value / max, x = i * (bw + 12);
        return `<rect x="${x}" y="${h - 18 - bh}" width="${bw}" height="${bh}" rx="4" fill="${i === 0 ? 'var(--ink-3)' : 'var(--s1)'}" opacity="${p.dim ? .35 : 1}" data-tip="${esc(p.label)}: nota ${p.value}"/>
        <text x="${x + bw / 2}" y="${h - 22 - bh}" text-anchor="middle" style="fill:var(--ink);font-weight:700;font-size:13px">${p.value}</text>
        <text x="${x + bw / 2}" y="${h - 4}" text-anchor="middle">${esc(p.label)}</text>`;
      }).join('')}
    </svg>`;
  }

  // --- panel de datos ---------------------------------------------------------

  // Patrimonio neto proyectado en dólares de hoy, con hitos.
  function projection(series, marks) {
    const w = 340, h = 190, pl = 40, pr = 8, pt = 14, pb = 24;
    const xs = series.map(d => d.year), ys = series.map(d => d.today);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const yMax = Math.ceil(Math.max(...ys) / 1e6) * 1e6;
    const X = v => pl + (w - pl - pr) * (v - x0) / (x1 - x0);
    const Y = v => pt + (h - pt - pb) * (1 - v / yMax);
    const path = series.map((d, i) => (i ? 'L' : 'M') + X(d.year).toFixed(1) + ' ' + Y(d.today).toFixed(1)).join(' ');
    const ticks = [];
    for (let v = 0; v <= yMax; v += 1e6) ticks.push(v);
    const grid = ticks.map(v => `<line class="grid" x1="${pl}" x2="${w - pr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end">${v ? (v / 1e6) + ' M$' : '0'}</text>`).join('');
    const xt = [x0, 2040, 2050, 2060, 2070, x1].filter((v, i, a) => a.indexOf(v) === i && v >= x0 && v <= x1)
      .map(v => `<text x="${X(v)}" y="${h - 6}" text-anchor="middle">${v}</text>`).join('');
    const mk = marks.map(m => {
      const d = series.find(s => s.year === m.year); if (!d) return '';
      return `<line x1="${X(m.year)}" x2="${X(m.year)}" y1="${pt}" y2="${h - pb}" stroke="var(--ink-3)" stroke-dasharray="2 3"/>
        <text x="${X(m.year) + 3}" y="${pt + 8}" style="font-size:10px">${esc(m.label)}</text>`;
    }).join('');
    const hits = series.map(d => `<rect x="${X(d.year) - 3}" y="${pt}" width="6" height="${h - pt - pb}" fill="transparent" data-tip="${d.year}: ${F().money(d.today)} de hoy"/>`).join('');
    return `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="Patrimonio neto proyectado en dólares de hoy, de ${x0} a ${x1}">
      ${grid}<line class="axis" x1="${pl}" x2="${w - pr}" y1="${Y(0)}" y2="${Y(0)}"/>${xt}${mk}
      <path d="${path}" fill="none" stroke="var(--s1)" stroke-width="2"/>${hits}</svg>`;
  }

  // Dinero por tipo de cuenta, apilado por persona (como la vista de carteras).
  function accountsStack(groups, people) {
    const w = 340, h = 180, pb = 34, pt = 18, gap = 14;
    const max = Math.max(...groups.map(g => people.reduce((s, p) => s + (g.by[p] || 0), 0)));
    const bw = (w - gap * (groups.length - 1)) / groups.length;
    const colors = ['var(--s1)', 'var(--s4)'];
    const bars = groups.map((g, i) => {
      let y = h - pb, out = '';
      people.forEach((p, k) => {
        const v = g.by[p] || 0; if (!v) return;
        const bh = (h - pb - pt) * v / max;
        y -= bh;
        out += `<rect x="${i * (bw + gap)}" y="${y + (k ? 0 : 0)}" width="${bw}" height="${Math.max(2, bh - 2)}" rx="3" fill="${colors[k]}" data-tip="${esc(g.label)} · ${esc(p)}: ${F().money(v)}"/>`;
      });
      const tot = people.reduce((s, p) => s + (g.by[p] || 0), 0);
      return out + `<text x="${i * (bw + gap) + bw / 2}" y="${y - 4}" text-anchor="middle" style="fill:var(--ink);font-weight:600">${F().short(tot)}</text>
        <text x="${i * (bw + gap) + bw / 2}" y="${h - 18}" text-anchor="middle">${esc(g.label)}</text>
        <text x="${i * (bw + gap) + bw / 2}" y="${h - 5}" text-anchor="middle" style="font-size:10px">${esc(g.sub)}</text>`;
    }).join('');
    return `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" aria-label="Dinero por tipo de cuenta y persona">${bars}</svg>`;
  }

  // Mezcla actual vs. propuesta (barras apiladas horizontales al 100 %).
  function allocation(rows) {
    const w = 340, rowH = 46, keys = [['equity', 'Acciones', 'var(--s1)'], ['fixedIncome', 'Renta fija', 'var(--s3)'], ['cash', 'Efectivo', 'var(--s2)']];
    const body = rows.map((r, i) => {
      let x = 0;
      const segs = keys.map(([k, name, c]) => {
        const v = r.mix[k] || 0, bw = (w) * v;
        const s = `<rect x="${x}" y="${i * rowH + 18}" width="${Math.max(0, bw - 2)}" height="18" rx="3" fill="${c}" data-tip="${esc(r.label)} · ${name}: ${F().pct(v)}"/>` +
          (bw > 40 ? `<text x="${x + 4}" y="${i * rowH + 31}" style="fill:#fff;font-weight:600">${F().pct(v)}</text>` : '');
        x += bw; return s;
      }).join('');
      return `<text x="0" y="${i * rowH + 12}" style="fill:var(--ink);font-weight:600">${esc(r.label)}</text>${segs}`;
    }).join('');
    return `<div class="legend">${keys.map(k => `<span><i style="background:${k[2]}"></i>${k[1]}</span>`).join('')}</div>
      <svg class="viz" viewBox="0 0 ${w} ${rows.length * rowH}" role="img" aria-label="Mezcla actual frente a propuesta">${body}</svg>`;
  }

  // Deudas: saldo con su tipo de interés.
  function debts(list) {
    const w = 340, rowH = 40, max = Math.max(...list.map(d => d.balance));
    return `<svg class="viz" viewBox="0 0 ${w} ${list.length * rowH}" role="img" aria-label="Deudas">${list.map((d, i) => {
      const bw = (w - 110) * d.balance / max;
      return `<text x="0" y="${i * rowH + 12}">${esc(d.label)} · ${F().pct(d.rate, 1)}</text>
      <rect x="0" y="${i * rowH + 17}" width="${bw}" height="14" rx="3" fill="${d.hot ? 'var(--s2)' : 'var(--s1)'}" data-tip="${esc(d.label)}: ${F().money(d.balance)} al ${F().pct(d.rate, 1)}"/>
      <text x="${bw + 6}" y="${i * rowH + 29}" style="fill:var(--ink);font-weight:600">${F().money(d.balance)}</text>`;
    }).join('')}</svg>`;
  }

  // Tooltip global para cualquier [data-tip].
  function initTips() {
    let tip;
    const show = (e) => {
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) { if (tip) tip.style.display = 'none'; return; }
      if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; document.body.appendChild(tip); }
      tip.textContent = t.getAttribute('data-tip');
      tip.style.display = 'block';
      const x = Math.min(e.clientX + 12, window.innerWidth - tip.offsetWidth - 8);
      tip.style.left = Math.max(8, x) + 'px';
      tip.style.top = (e.clientY - 36) + 'px';
    };
    document.addEventListener('pointermove', show);
    document.addEventListener('pointerdown', show);
    document.addEventListener('scroll', () => tip && (tip.style.display = 'none'), { passive: true });
  }

  window.Charts = { interestBar, timeline, compareBars, yearBlocks, gauge, scoreSteps, projection, accountsStack, allocation, debts, initTips };
})();
