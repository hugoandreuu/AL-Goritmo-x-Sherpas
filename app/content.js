/*
 * content.js — textos en español y respuestas a dudas.
 * Todas las cifras llegan desde Facts (el JSON del plan). Aquí no se escribe ningún número del plan a mano.
 * Las respuestas a dudas solo dicen lo que dice el plan. Si el plan no lo cubre (covered: 'no' o 'partial'),
 * la duda se apunta para la reunión con el asesor.
 */
(function () {
  const M = v => window.Fmt.money(v);
  const P = (v, d) => window.Fmt.pct(v, d);
  const D = v => window.Fmt.month(v);

  const PHRASES = ['Que Liam y Josh lo tengan todo resuelto', 'Dormir tranquilos', 'Dejar de deber', 'Jubilarnos cuando queremos'];

  const PILLARS = {
    'Savings and cash flow': 'Ahorro y flujo de caja',
    'Debt': 'Deudas',
    'Investments': 'Inversiones',
    'Liquidity and emergency fund': 'Liquidez y colchón',
    'Insurance and protection': 'Seguros y protección',
  };

  const EFFORT = { low: 'bajo', medium: 'medio', high: 'alto' };

  // Dudas típicas por tema. covered: 'yes' (el plan lo responde), 'partial' o 'no' (va a la reunión).
  function doubts(f) {
    const k1 = f.kids[0] || { name: 'vuestro hijo', age: '' };
    const k2 = f.kids[1] || { name: '', age: '' };
    return {
      card: {
        label: 'La tarjeta',
        items: [
          { id: 'card-300', q: `¿Por qué ${M(f.card.payMonth)} al mes casi no bajan la deuda?`, covered: 'yes',
            a: `Al ${P(f.card.apr)}, la deuda genera unos ${M(f.card.interestMonth)} de intereses al mes. De los ${M(f.card.payMonth)} que pagáis, solo lo que sobra baja la deuda. Por eso, a este ritmo, el plan la ve terminar en ${D(f.card.payoff)}.` },
          { id: 'card-cash', q: '¿No es mejor dejar el efectivo por si acaso?', covered: 'yes',
            a: `Tenéis ${M(f.cash.accessible)} accesibles, unos ${f.cash.months} meses de gastos esenciales. El plan recomienda una reserva de 8 a 9 meses (${M(f.cash.reserveMin)} a ${M(f.cash.reserveMax)}). Después de pagar ${M(f.firstStep.amount)} de la tarjeta seguiríais por encima de esa reserva.` },
          { id: 'card-car', q: `¿Y si luego necesitamos ese dinero para el coche de ${f.goals.car ? f.goals.car.date.slice(0, 4) : ''}?`, covered: 'partial',
            a: `Después de la reserva y de las vacaciones de ${M(f.goals.vacation)}, el plan ve ${M(f.cash.aboveAll)} de efectivo de sobra. Pero esa cuenta no incluye el coche (${M(f.goals.car && f.goals.car.amount)}, ${D(f.goals.car && f.goals.car.date)}) ni la casa (${D(f.goals.home && f.goals.home.date)}). Esa parte la tiene que cuadrar vuestro asesor.` },
          { id: 'card-full', q: '¿Por qué no pagarla entera?', covered: 'partial',
            a: `El plan solo calcula el efecto de pagar ${M(f.firstStep.amount)}: la nota pasa de ${f.score.now} a ${f.score.moves[0] && f.score.moves[0].after} y quedan ${M(f.firstStep.remaining)}. Pagarla entera también se puede, pero el plan no dice cómo cambia la nota.` },
        ],
      },
      life: {
        label: 'El seguro de vida',
        items: [
          { id: 'life-why', q: `¿Por qué tanto? ¿${M(f.life.minA)} y ${M(f.life.minB)}?`, covered: 'yes',
            a: `Es el mínimo para que ${k1.name} (${k1.age}) y ${k2.name} (${k2.age}) mantengan su vida si falta uno de los dos sueldos. Hoy el seguro cubriría unos ${Math.round(f.life.yearsNow)} años de gastos del hogar; con el mínimo, unos ${Math.round(f.life.yearsMin)}.` },
          { id: 'life-73', q: `¿Por qué con la tarjeta la nota llega a ${window.Fmt.scoreFor(f, ['card', 'life'])} y sin ella no?`, covered: 'yes',
            a: `Vuestra nota tiene dos topes: la tarjeta la frena en ${f.score.caps[0] && f.score.caps[0].score_capped_at} y el seguro en ${f.score.caps[1] && f.score.caps[1].score_capped_at}. Si solo subís el seguro, la tarjeta sigue frenando. Con los dos pasos, la nota llega a ${window.Fmt.scoreFor(f, ['card', 'life'])}.` },
          { id: 'life-price', q: '¿Cuánto nos costaría?', covered: 'no',
            a: 'El plan no incluye presupuestos de seguros. Lo apuntamos para que vuestro asesor traiga precios a la reunión.' },
          { id: 'life-amount', q: '¿Cuánto seguro hay que añadir exactamente?', covered: 'partial',
            a: `El plan da dos cifras distintas para el seguro objetivo (${M(f.life.targetA)} y ${M(f.life.targetB)}). Lo aclara vuestro asesor.` },
        ],
      },
      umbrella: {
        label: 'El seguro umbrella',
        items: [
          { id: 'umb-what', q: '¿Qué es un seguro umbrella?', covered: 'yes',
            a: `Un seguro extra de responsabilidad civil, por encima del de casa y coche, para demandas grandes. El plan recomienda ${M(f.umbrella.rec)} y hoy no tenéis.` },
          { id: 'umb-need', q: '¿De verdad nos hace falta?', covered: 'yes',
            a: `Una demanda podría alcanzar vuestro patrimonio neto (${M(f.umbrella.netWorthExposed)}). Los seguros de casa y coche no cubren esto.` },
          { id: 'umb-price', q: '¿Cuánto cuesta?', covered: 'no',
            a: 'El plan no tiene presupuesto de esta póliza. Lo apuntamos para la reunión.' },
        ],
      },
      education: {
        label: 'La universidad',
        items: [
          { id: 'edu-how', q: `¿Cuánto hay que ahorrar para ${k1.name} y ${k2.name}?`, covered: 'yes',
            a: `Hoy no hay nada en cuentas 529 y faltan ${M(f.education.gap)}. El plan propone unos ${M(f.education.extraYear)} más el primer año, y algo más cada año. ${f.education.starts.map(s => `${s.name} empieza en ${D(s.date)}`).join('; ')}.` },
          { id: 'edu-compete', q: '¿Compite con los otros pasos?', covered: 'partial',
            a: 'Sí. El plan dice que la universidad, los seguros y la tarjeta tiran del mismo dinero, y que el orden lo elegís vosotros. Además, vuestros gastos declarados parecen bajos, así que conviene confirmarlos con el asesor.' },
        ],
      },
      portfolio: {
        label: 'Vuestras inversiones',
        items: [
          { id: 'pf-risk', q: '¿Estamos arriesgando demasiado?', covered: 'yes',
            a: `El ${P(f.portfolio.equityNow)} de lo invertido está en acciones; el objetivo ${f.portfolio.targetProfile} es ${P(f.portfolio.equityTarget)}. ${f.a.name} declaró ${f.a.risk} y ${f.b.name} ${f.b.risk}. El plan propone que lo habléis juntos.` },
          { id: 'pf-crash', q: '¿Qué pasa si bajan los mercados?', covered: 'yes',
            a: (f.scenarios || []).length ? `Con todo vuestro dinero (incluido el efectivo), el plan mira crisis pasadas. ${f.scenarios.map(s => `${s.name}: hoy ${P(s.now, 1)}, con la mezcla propuesta ${P(s.target, 1)}`).join('. ')}. Son crisis pasadas, no una predicción.` : 'El plan no trae escenarios de mercado.' },
          { id: 'pf-upro', q: '¿Qué es eso de UPRO?', covered: 'yes',
            a: `Un fondo apalancado: amplifica los movimientos diarios del mercado. ${f.a.name} tiene ${M(f.portfolio.upro)} en su cuenta Roth. El plan dice que no es urgente, pero conviene vigilarlo.` },
        ],
      },
      goals: {
        label: 'Coche y casa',
        items: [
          { id: 'goal-home', q: `¿Y si compramos la casa en ${f.goals.home ? f.goals.home.date.slice(0, 4) : ''}?`, covered: 'partial',
            a: `La casa de ${M(f.goals.home && f.goals.home.amount)} (${D(f.goals.home && f.goals.home.date)}) está en el plan. Pero el efectivo "de sobra" que calcula el plan no la tiene en cuenta. Lo cuadra el asesor.` },
          { id: 'goal-car', q: `¿Y el coche de ${f.goals.car ? f.goals.car.date.slice(0, 4) : ''}?`, covered: 'partial',
            a: `El coche de ${M(f.goals.car && f.goals.car.amount)} (${D(f.goals.car && f.goals.car.date)}) está en el plan, pero no entra en el cálculo del efectivo de sobra. Lo cuadra el asesor.` },
        ],
      },
      life_events: {
        label: 'Imprevistos',
        items: [
          { id: 'ev-job', q: '¿Y si uno de los dos pierde el trabajo?', covered: 'yes',
            a: `Vuestro efectivo accesible (${M(f.cash.accessible)}) cubre unos ${f.cash.months} meses de gastos esenciales. El plan recomienda 8 a 9. Es uno de vuestros puntos fuertes.` },
          { id: 'ev-sick', q: '¿Y si uno no puede trabajar por enfermedad?', covered: 'partial',
            a: f.disability.count ? 'Los dos tenéis seguro de invalidez, pero el plan no registra cuánto cubre. Lo apuntamos para que el asesor lo revise.' : 'El plan no registra seguro de invalidez. Lo apuntamos para la reunión.' },
          { id: 'ev-retire', q: '¿Llegamos bien a la jubilación?', covered: 'yes',
            a: `Sí, según el plan. Los ingresos cubren el ${P(f.retirement.coverPct)} de lo que necesitaréis cada año y al final del plan quedan ${M(f.retirement.leftAtEnd)} (en dólares de hoy).` },
        ],
      },
    };
  }

  const NO_REASONS = ['No lo vemos claro todavía', 'No es el momento', 'No estamos de acuerdo entre nosotros', 'Preferimos otro orden'];

  window.Content = { PHRASES, PILLARS, EFFORT, doubts, NO_REASONS };
})();
