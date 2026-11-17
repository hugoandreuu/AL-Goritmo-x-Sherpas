> **Archivo.** Documento de trabajo antiguo: describe una idea o un plan que ya no es el de la app. Lo vigente está en el [README](../../../README.md) y en [docs/brainstorming/decisiones.md](../../brainstorming/decisiones.md).

# Bases de la app: "Vuestro plan, en vuestras palabras" (nombre provisional)

> Documento vivo. **Versión 7.2 (ronda 13).** Ficheros complementarios: [PANTALLAS.md](PANTALLAS.md), [PLAN-TECNICO.md](PLAN-TECNICO.md), [PITCH.md](PITCH.md), [glosario.md](glosario.md), [preguntas-otras-familias.md](preguntas-otras-familias.md), [TAREAS.md](TAREAS.md), [MEDIA_PAGINA.md](MEDIA_PAGINA.md), [README-APP.md](README-APP.md), [PRUEBA-USUARIOS.md](PRUEBA-USUARIOS.md).

## 0. Lo que se construye sí o sí (léase primero)

Un segundo jurado simulado vio la v3 un 40 % demasiado grande para 5 días. Esto es lo único **no negociable**; todo lo demás del documento es "si sobra" o "diseñado":

| Núcleo (sí o sí) | Si sobra tiempo | Solo diseñado (se cuenta, no se construye) |
|---|---|---|
| Gancho con contador | Ciclo "hoy vs mañana" | Inglés (solo español, sin interruptor) |
| **Pregunta al jurado en directo** (ver §10) | Otros 3 casos cargando | Días 14, 21 y 30 y eventos del caso |
| Ciclo de la tarjeta completo (2 ramas, §17) | Novato/experto en el ciclo 2 | Audio del resumen |
| Ciclo del seguro (1 rama: "falla estando seguro") con aviso, pregunta cerrada y una cifra (tiempos 1, 2 y 3, §6.2) | Pregunta de riesgo en pareja | Dos móviles con código de sala |
| Revelación de pareja (pásale el móvil) con los perfiles de riesgo declarados | 3 términos más de glosa | IA del día 14 |
| Interruptor novato/experto en la tarjeta | .ics | Protocolo completo de noticias duras |
| Escalera con primer paso (6.800 $) | | |
| **Un mensaje real** que llega durante el pitch con el enlace al día 3 | | |
| Día 7 con saldo → nota 62 | | |
| Hoja del asesor | | |
| Glosa de 2 términos: umbrella y under insured (los del núcleo) | | |
| Cumplimiento (§19): pie fijo, "Vuestro plan propone…", etiqueta de IA en P15 y "Hablarlo con una persona" siempre visible | | |

Cada ronda de revisión actualiza este fichero; los cambios están en "Registro de cambios" al final.

## 1. Qué es, en una frase

Una web para móvil que usa lo que cada miembro de la familia **cree** sobre su dinero para guiarle por su plan de Sherpas: adivina lo que no sabe, se sorprende, ordena sus pasos en una escalera, se compromete con el primero con día y hora, y la app vuelve con sus propias palabras hasta que lo hace (en el MVP: un mensaje real con enlace al "día N"; el envío programado queda diseñado). Si hay asesor, este recibe lo que la familia creía y no entendió.

**El quiz no es el producto.** El producto es lo que la app sabe de cada persona después: qué creía, dónde falló estando seguro, qué le preocupa y a qué se comprometió.

**Frase del pitch:** "El plan de Sherpas te cuenta. Esto te pregunta, mide lo que entendiste y vuelve hasta que actúas."

## 2. Para quién y en qué situación

- **Usuario final:** la familia (MVP: Timothy y Melanie Weah; los otros 3 casos cargan con el mismo código).
- **Cliente de Sherpas:** el asesor. Recibe la "hoja de la familia".
- **Dos situaciones (las dos deben funcionar):**
  - **Con asesor:** la familia llega entendiendo el plan; la reunión se dedica a decidir.
  - **Sin asesor:** el plan se cierra en la app, con botón "hablarlo con una persona" en cualquier pantalla.

## 3. Qué ya existe en Sherpas (no reconstruir) y qué hueco ocupamos

**Ya existe en el plan compartido** (visto en el plan Weah; tours y chat no se pudieron ver desde aquí):
nota de salud financiera con frase; resumen por áreas (jubilación, inversión, deuda, ahorro, protección) con rango recomendado y etiqueta ("Under insured", "Very over-reserved"); proyección de patrimonio; lista de metas; PDF del plan.

**Hueco que ocupamos:**
- Priorización: el plan no dice qué hacer primero ni enseña cómo se afectan los pasos entre sí.
- Pareja: dos perfiles de riesgo distintos sin forma de reconciliarlos.
- Seguimiento: nada para los días 3 y 30.
- Interacción: el plan es lectura; no recoge lo que la familia cree.
- Jerga de EE. UU. sin traducir (529, umbrella, investable assets, over-reserved…).
- Metas en conflicto con distinto horizonte (coche 2028, casa 2030, universidad, jubilación).

**Pendiente:** que alguien del equipo abra el plan en su navegador y confirme cómo son el tour y el chat.

**Competencia directa (ronda 6).** Revisamos RightCapital, eMoney, MoneyGuide, Range, Facet, Origin, Altruist, Asset-Map, Holistiplan y Wealthbox, según fuentes del propio proveedor. Ninguna publica cifras de engagement.
- **Lo que nadie hace:** pedir que se adivine antes de ver; entregar al asesor qué creía cada miembro y qué era; comprobar con un dato a los 7 días (RightCapital asigna tareas, pero no verifica el resultado).
- **Parecidos peligrosos:**
  - RightCapital tiene tareas para cliente y cónyuge, y un cuestionario de riesgo. En el pitch nunca decir "seguimiento de tareas"; decir "el día 7 pide el saldo y lo compara con 11.200 $".
  - Origin enseña el hogar en pareja. Aclarar que no mostramos cuentas: mostramos lo que cada uno creía, a escondidas, antes de verlo juntos.
- **Datos para el pitch o la media página (antiguos; citar con año):**
  - Un aviso con día y hora subió la vacunación 4,2 puntos sobre un 33,1 % de base (Milkman et al., NBER w17183, 2011).
  - Un metaanálisis de 94 estudios: decidir cuándo y dónde actuar mejora el logro de metas (d = 0,65; Gollwitzer y Sheeran, 2006).
  - Un contrato de compromiso con verificación dio de 3,4 a 5,7 puntos más de abstinencia a los 12 meses (J-PAL, CARES).

## 4. Rúbrica y cobertura

| Criterio | Peso | Qué lo cubre |
|---|---|---|
| Engancha | 20 | Contador visual del dinero perdido; primera pregunta táctil; revelación de pareja |
| Comprensión | 20 | Interruptor novato/experto visible; pregunta de comprobación opcional (P09); "creíais X, ahora sabéis Y"; traductor de jerga; "de dónde sale" cada cifra |
| Actuar y volver | 20 | Escalera ordenable; primer peldaño con día, hora y "cómo se hace"; día 7 con dato verificable; seguimiento por eventos reales del caso |
| Personal | 15 | Respuestas por separado; perfiles de riesgo declarados de cada uno (revelación de pareja); frase propia al principio |
| Creatividad | 15 | Modo pareja, hoja del asesor visible en la demo, punto de IA en el día 3 (condicionado, §18) |
| Plan del viernes | 10 | Sección "descartado y por qué" y "lo que no sabemos" (sección 12) |

**Recordatorio:** el vídeo no puntúa. Puntúan el pitch en vivo (2 min), el MVP y la media página.

### Cobertura de los 11 dolores del README

| # | Dolor | Dónde se cubre |
|---|---|---|
| 1 | No ven cómo una elección cambia su vida | Palanca en cada tarjeta; escalera con nota |
| 2 | Cifras grandes sin significado | Ciclo corto "16,1 M$ en 2079, ¿cuánto es hoy?" |
| 3 | Una nota buena esconde un problema | Tarjeta específica para Samantha (82 y sin activos líquidos a los 73) cuando se carga su caso |
| 4 | La preocupación que nadie preguntó | Frase propia al principio + "¿qué os preocupa más?" |
| 5 | No leen un plan largo | Sesión de 5 min en tarjetas |
| 6 | Mala noticia → miran a otro lado | Tono "el plan sorprende, no tú"; palanca junto al dato |
| 7 | Muerte y vejez se evitan | Seguro de vida contado desde los hijos (ver 6.2) |
| 8 | Una pareja, dos personas | Modo pareja + perfiles de riesgo declarados en la revelación (la pregunta de riesgo, si sobra) |
| 9 | Dudas a solas, olvido | Día 3 con preguntas sugeridas; día 14 repaso (solo diseñado) |
| 10 | El plan no llega cuando actúan | Seguimiento por eventos del caso (sección 6.5) |
| 11 | Sin primer paso, sin comprobar | Primer peldaño con "cómo se hace" y día 7 con saldo |

## 5. Alcance del MVP (13-18 nov)

**Dentro:**
1. Caso Weah completo (los otros 3 casos cargan sin romperse solo si sobra tiempo, §0).
2. Sesión 1 de 5 minutos (6.1).
3. Modo pareja en un móvil ("pásale el móvil"); dos móviles con código de sala solo diseñado (§0).
4. Escalera ordenable con nota y efectivo restante.
5. Hoja de una página (familia y asesor), visible en la demo.
6. Enlace con estado (`?sid=`) que abre "el día N": en el MVP, día 3 y día 7, más un selector de días para la demo (`?day=7`). Días 14, 21 y 30 solo diseñados (§0).
7. Textos de reacción escritos a mano (2 ramas en la tarjeta, 1 en el seguro). IA en un solo punto, condicionado: la página del día 3, pregenerada y con validación de números, solo cuando todo el núcleo funcione; hasta entonces, el texto fijo de P15 (§18). La frase del día 14 queda solo diseñada (§0).

**Fuera (diseñado, no construido):** envío programado de emails/WhatsApp (el mensaje real del pitch sale automático por el bot de Telegram, con respaldo ntfy.sh, §16), cuentas, conexión con Sherpas, audio del resumen.

## 6. Flujos

### 6.1 Sesión 1 (objetivo ~5 minutos; tiempos por pantalla en PANTALLAS.md)

| Capa | Tiempo | Qué pasa |
|---|---|---|
| Gancho | 15 s | **Sin texto largo.** Dos barras sin cifras ("Dinero parado", "Deuda de tarjeta"; las cifras, detrás de "Por qué") y un contador que se detiene en 3.240 $ al contestar (solo el contador, §17). Primera pregunta táctil: "¿cuánto os cuesta al año la tarjeta?", con control de importe vacío y botones −/+ |
| Quién sois | 15 s | "¿Lo hacéis juntos?" → pareja o individual. Frase propia: "En una línea, ¿qué os importa más?" (3 propuestas + libre). "Soy nuevo en esto / Sé de finanzas" (interruptor, se puede cambiar en cualquier momento). |
| Pareja: fecha y revelación | 55 s | Solo en pareja. Cada uno por separado adivina cuándo acaba la tarjeta (30 s, P04-P05); revelación juntos con los perfiles declarados (Timothy Growth, Melanie Moderate; 25 s, P07). Sin punto intermedio. La pregunta de riesgo en pareja queda en "Si sobra" (§0). |
| A fondo | 1:30 | **Dos ciclos completos** (tarjeta, 45 s, P08-P09; seguro de vida, 45 s, P11) y, si sobra, uno corto ("hoy frente a mañana"). Cada ciclo: adivinar → revelar → palanca (3 toques). Seguridad y profundidades detrás de "¿Por qué?". El test de comprobación de P09 es opcional y queda fuera de los 5 minutos. |
| Escalera (con el "Mapa") | 50 s | El plan entero en una pantalla (P12): nota 60 hoy, qué la frena (tarjeta y seguro de vida), escalera 62 → 73 → 78. Ordenan los peldaños con Subir/Bajar; ven nota y efectivo. El Mapa no es un paso propio (§17). |
| Primer paso | 40 s | Día y hora (por defecto, el próximo lunes a las 19:00) y tarjeta "cómo se hace" (P13). El .ics es "Si sobra" (§0). |
| Cierre | 35 s | "Creíais X, ahora sabéis Y" como cabecera de la hoja (P17). Sin selector de formato ni audio en el MVP. |

Total en pareja: ~5:00; en individual (sin P04, P05 y P07): ~4:05. La fuente de los tiempos es PANTALLAS.md.

### 6.2 Ciclo de adivinar

1. **Pregunta** sobre algo que no está en el formulario (sección 7), con chips por década y botones −/+ (años) o con el control de importe vacío y −/+ (cifras); sin deslizadores (§17).
2. **Revelación**: su marca frente a la real y la de la pareja. Animación solo aquí.
3. **Reacción** según fallo y seguridad (si la dieron):
   - Acierta (cerca, con cualquier confianza, o con duda) → rápido; detalle según novato/experto. "Acierta con duda" se une a "acierta" (§17).
   - Falla estando seguro → explicación a fondo del supuesto que falló. Tono: "es una sorpresa del plan"; nunca "incorrecto". No afirmar "casi nadie lo adivina" salvo con el recuento real de la prueba del martes 17.
   - En el MVP: 2 ramas en la tarjeta y 1 en el seguro (§17).
4. **Palanca**: la cifra se mueve al momento.
5. **Comprobación (opcional, fuera de los 5 min; §17)**: "Con lo que acabáis de ver, ¿qué pasa si…?" (una pregunta, opción múltiple).
6. **Novato / experto** cambia el mismo texto en vivo. Ejemplo tarjeta: novato "pagáis 270 $ al mes solo de intereses"; experto "18 % APR, 300 $/mes, amortización completa en septiembre de 2039".
7. **Noticias duras (seguro de vida, nota crítica, dinero que se acaba)** en 4 tiempos, inspirado en el protocolo médico SPIKES y en Trust & Will ("la muerte es el producto, la vida es la marca"):
   1. **Aviso y permiso:** "Lo siguiente no es fácil, pero tiene arreglo. ¿Lo vemos ahora o en un rato?" Siempre visible "saltar por ahora".
   2. **Adivinar qué protege, nunca el riesgo personal.** Weah: "¿Qué tienen Liam (6) y Josh (3) asegurado si a uno de vosotros le pasara algo?" con opciones cerradas. Nunca preguntar fechas ni probabilidades de muerte.
   3. **Una sola cifra, traducida a algo concreto.** Weah: "Hoy vuestro seguro cubriría unos **2 años** de vuestros gastos. El mínimo recomendado, unos **12**." Derivado por la app: cobertura total (140.000 + 110.000 = 250.000 $) ÷ gasto anual del hogar con deudas (112.774 $, `key_metrics.ratios.investableAssetLevel.annualExpenses`) = 2,2; mínimo recomendado (750.000 + 600.000 = 1.350.000 $) ÷ 112.774 = 12,0. Johnson: 2,8 frente a 17,5. Michael: 1,6 frente a 8,1. Nunca lo calcula la IA.
   4. **Palanca en la misma tarjeta**: "Pedir presupuestos tarda minutos y no compromete." Y "¿Lo veis juntos o lo guardáis para luego?".
   - **Michael (26):** permiso antes de enseñar la nota; "26: zona de acción, hay 3 cambios ordenados"; una palanca por tarjeta.
   - **Samantha (82):** "82, plan sólido. Un punto débil: el dinero líquido se acaba a los 73." El 82 como colchón, el problema como excepción acotada.
   - **MVP:** los tiempos 1 (aviso), 2 (pregunta cerrada "qué tienen asegurado", P11-Q) y 3 (una cifra) con la palanca; el resto del protocolo, diseñado.
   - **Evitar:** imágenes de muerte, contadores de pérdida y urgencia artificial en estas tarjetas, "no te preocupes", y revelar un problema sin acción posible (lo menos eficaz según el metaanálisis de Tannenbaum 2015 sobre mensajes de miedo).
8. **Traductor de jerga**: cada término de EE. UU. subrayado; un toque muestra una línea en lenguaje llano.

### 6.3 Modo pareja

- Un móvil: cada uno contesta en secreto, se pasa el móvil, se revelan juntos. Primero coincidencias, luego la diferencia, luego la fecha real y los perfiles declarados. Sin punto intermedio (§17).
- La pregunta al jurado abre la demo (§10); la revelación de pareja es lo siguiente más distintivo.
- "¿Qué crees que ha contestado Melanie?" como pregunta extra (solo si sobra).
- Si uno no participa: resumen de 30 segundos por enlace.

### 6.4 Escalera

- Peldaños por plazo: esta semana / este mes / este trimestre / este año / hablarlo.
- **Los saltos son acumulados**, tal como vienen en `score.combined_moves`: tarjeta → 62; tarjeta + seguro de vida → 73; tarjeta + seguro + responsabilidad civil → 78. No son saltos individuales.
- Cada peldaño con su salto de nota (`score.top_moves`, `score.combined_moves`) **y su esfuerzo** (`top_moves[].effort`: fácil / medio / difícil). Así se ve el dilema "victoria rápida o cambio grande" (Michael: responsabilidad civil 26 → 31 fácil, frente a retirar menos 26 → 62 difícil).
- Si la nota casi no se mueve (Samantha: 82 → 84) pero hay un problema grave (sin dinero a los 73), ese problema entra como peldaño "hablarlo con el asesor", aunque no tenga salto de nota.
- Reordenable con botones Subir/Bajar de 44 px como control principal; el arrastre es opcional (§17). La app no prohíbe, enseña la consecuencia (seguro antes que tarjeta → 60 sin cambio).
- Métrica: "nota 62 de 78 posibles".
- Solo el primer peldaño lleva compromiso duro (día, hora; .ics si sobra) y "cómo se hace".

**Primer peldaño de los Weah (según el plan):** pagar **6.800 $** de la tarjeta con efectivo (queda en 11.200 $), lo que quita el tope de la nota (60 → 62). Pagarla entera es una opción que la familia puede elegir; la app lo muestra como alternativa, sin inventar su efecto en la nota.

**"Cómo se hace" (escrito a mano):** 1) entrar en el banco donde está el efectivo; 2) transferir 6.800 $ a la tarjeta Chase; 3) volver y marcar "hecho" con el nuevo saldo.

### 6.5 Seguimiento (días y eventos reales)

| Momento | Qué llega |
|---|---|
| Día 1 | Resumen: la página de cierre (sin selector de formato ni audio en el MVP) |
| Día 3 | Dudas a partir de sus fallos, 3 preguntas sugeridas (texto fijo; IA visible solo si el núcleo ya funciona, §18) |
| Día 7 (lunes) | "¿Cuál es el saldo de la tarjeta ahora?" (campo numérico, §17). Si ≤ 11.200 $ → nota 62 y se abre el seguro de vida. Si no → "¿qué os frena?" (dudas / no sé cómo / no es prioridad / no lo vemos igual), respuesta distinta a cada uno |
| Día 14 (solo diseñado) | Su frase de vuelta (reescrita por la IA, validada) + volver a adivinar una cifra |
| Día 21 (solo diseñado) | Hoja actualizada para el asesor; a la familia, sus 3 preguntas para la reunión |
| Día 30 (solo diseñado) | Reunión o cierre: nota antes/después, siguiente peldaño |
| Eventos del caso | Antes del pago de vacaciones (enero 2027, 6.000 $); antes de comprar coche (julio 2028, 45.000 $); antes de la casa (enero 2030). Para Samantha: cada agosto (universidad). |

Producción: WhatsApp Cloud API con enlace directo con estado (email, Resend, de respaldo, §16); calendario por .ics si sobra. Demo: selector de días (`?day=7`) + enlace "abrir día 3" (`?sid=`).

### 6.6 Hoja de una página

- Familia y asesor: la misma hoja de cabecera + 7 bloques (P17 en PANTALLAS.md): lo que más os preocupa, creían frente a realidad, lo que no entendieron, en qué no coinciden, orden y primer compromiso, datos a revisar, preguntas para la reunión.
- Asesor, además: "creían X y era Y" por persona y preguntas hechas. La calibración queda fuera del MVP.
- **Estructura (máximo ~350 palabras, ordenada por salto de nota de `top_moves` y, a igualdad, por error × seguridad, §16):** cabecera (quién respondió) · lo que más les preocupa, en sus palabras · creían frente a realidad (top 3) · lo que no entendieron (máx. 3) · en qué no coinciden (máx. 3) · orden elegido y primer compromiso · datos a revisar (máx. 3) · 2-3 preguntas sugeridas para abrir la reunión. Cada línea con su fuente (respuesta de la familia o campo del plan). Sin etiquetas de personalidad.
- **Privacidad:** cada miembro ve antes qué se enviará al asesor y puede pedir que una respuesta suya no lleve su nombre.
- Por qué importa: las herramientas de preparación de reuniones (Jump, Zocks) resumen CRM, cartera y reuniones pasadas; no encontramos ninguna que diga qué creía cada miembro y qué no entendió. Comparar el riesgo de cada cónyuge sí es práctica conocida (FinaMetrica, ThinkAdvisor): lo nuevo es la combinación.
- **"A revisar con vuestro asesor"**: datos del plan que no cuadran entre sí, detectados por reglas fijas (no por la IA). Ejemplo Samantha: la casa figura sin asegurar pero hay una prima de seguro de hogar de 4.500 $/año en sus gastos. Lista por caso en [preguntas-otras-familias.md](preguntas-otras-familias.md). Ayuda a la familia y al asesor, y demuestra que la app lee el plan de verdad.

## 7. Banco de preguntas y rutas del JSON (verificadas)

Rutas en `cases/timothy-melanie-weah/financial-health.json` salvo que se indique.

| Tipo | Pregunta | Respuesta | Ruta |
|---|---|---|---|
| Coste escondido | ¿Cuánto os cuesta la tarjeta al año? | 3.240 $ (derivado: 18 % × 18.000) | `profile.liabilities[0].interest_rate`, `.balance`; mensual: `key_metrics.debtManagement.creditCardDebt.ccPaymentEqualToInterestRate` (270) |
| Coste escondido | ¿Y cuánto os da el efectivo? | ~150 $ (0,1 % × 150.000) | `investment-analysis.json` → `key_metrics.cashNeeds.currentCashBalance[1][4]` (0.001); saldo `profile.accounts[0].balance` |
| Fecha | ¿Cuándo termináis la tarjeta a este ritmo? | Septiembre 2039 | `key_metrics.debtManagement.creditCardDebt.ccPayoffDate` |
| Qué pesa más | ¿Qué sube más vuestra nota? | Tarjeta 62; seguro solo 60; ambos 73; +umbrella 78 | `score.top_moves[0..2].score_after`; `score.combined_moves[1].score_after` (73), `[0]` (78) |
| Repartir | Os sobran ~60.000 $: repartidlos | 60.222,50 $ | `key_metrics.facts.cash.cashAboveTotalNeeded.value` |
| Protección | ¿Cuánto seguro recomienda el plan para Timothy? | 750.000-1.500.000 $ (tiene 140.000 $) | `key_metrics.protection.lifeInsurance.lifeInsuranceCoverageRecommendations.clientMin/MaxRecommendedCoverage`; actual `...lifeInsuranceCoverageBasics.lifeInsuranceAmountClient`; Melanie `coClient*` (600.000-1.200.000; tiene 110.000) |
| Umbrella | — | Recomendado 1.000.000 $, no tienen | `key_metrics.protection.umbrellaInsurance.coverageRecommendationsAndAnalysis.umbrellaMinRecommendedCoverage`; `...umbrellaCoverage.hasUmbrellaPolicy` |
| Universidad | — | Brecha 113.508,60 $; extra 4.609,22 $/año | `key_metrics.protection.emergencyFund.retirementAndEducationGaps.educationGap`; `key_metrics.facts.education.extraYearlySaving.value` |
| Hoy vs mañana | 16,1 M$ en 2079: ¿cuánto es hoy? | 3,36 M$ | `projections.yearly[53].net_worth`, `.net_worth_todays_dollars` |
| Vacaciones | — | 6.000 $ en enero 2027 | `key_metrics.facts.cash.nearTermGoals[0]` |
| Pareja | ¿Qué crees que ha contestado Melanie? | Su respuesta | — |

Estructuras: `score.top_moves[]` = `{title, action, effort, target_amount, score_before, score_after, lifts_a_cap}`; `score.combined_moves[]` = `{moves[], score_after, note}`; `projections.yearly[]` (54 años, 2026-2079) = `{year, age_client, age_co_client, net_worth, net_worth_todays_dollars, total_debts, investable_assets, net_worth_needed}`.

Otras familias: banco completo con rutas, escaleras y primer paso de cada una en [preguntas-otras-familias.md](preguntas-otras-familias.md). Primer paso según el plan: Michael, seguro de responsabilidad civil (26 → 31, fácil); Johnson, seguro de vida (52 → 57, fácil); Samantha, seguro de casa (82 → 84, medio).

**Perfil de riesgo de cada persona (verificado):** `case.household[i].risk_profile` (Weah: Timothy Growth, Melanie Moderate). **No citar "77 % en acciones"**: ese dato sale de `persona.md` sobre inversiones; `investment-analysis.json` da 45 % sobre el total (`analysis.summary.assetAllocation.currentEF.equity`) con objetivo 40 %. Para la pregunta de pareja basta con los perfiles declarados.

**Gasto anual del hogar:** `key_metrics.ratios.investableAssetLevel.annualExpenses` (Weah 112.774 $, incluye pagos de deudas).

## 8. Arquitectura

Detalle completo (stack, carpetas, estado, API, cola de la IA, reparto por días, lista de la demo) en [PLAN-TECNICO.md](PLAN-TECNICO.md). Resumen:

```
[Móvil: web] ⇄ [Backend Node pequeño] ⇄ cases/*.json (fuente de los números)
                                  ⇄ Proxy IA de Sherpas (texto)
```

- Backend: patrón de `examples/voice/server.mjs` (lee `cases/`, `TEAM_KEY` en `.env`, nunca en el navegador).
- Datos: JSON de `cases/`, no el MCP (token de 72 h).
- IA: `gpt-5-mini` por el proxy (sin `max_tokens` o ≥ 1000). Audio: solo diseñado (§0).
- **La IA nunca calcula.** Todas las cifras salen del JSON; el prompt las recibe ya calculadas. Validar que cada número del texto generado está en la entrada; si no, texto fijo.
- Estado: localStorage + memoria del backend; el enlace "día N" lleva el identificador de sesión (`?sid=`).

## 9. Uso de la IA (prompts)

- Entrada: cifras + persona + respuesta y seguridad + rama + frase propia.
- Salida JSON: `{titular, porque, detalle, preguntas_sugeridas[3]}`.
- Sistema: "Usa solo estas cifras; nunca inventes números. Tono: el plan sorprende, no la persona. Máximo 2 frases por campo."
- Validación de números antes de mostrar; si falla, texto fijo (y en la demo se puede enseñar que existe el respaldo).

## 10. Guion de la demo (2 minutos, en vivo)

Guion palabra a palabra, versión de emergencia de 90 s, media página y preguntas del jurado: [PITCH.md](PITCH.md).

**Momento "wow" (nuevo en v4):** abrir pidiendo a un miembro del jurado que adivine en el móvil cuándo terminarían los Weah la tarjeta a este ritmo. Su marca aparece junto a la de Timothy y Melanie (respuestas precargadas) y la real: septiembre de 2039. El jurado pasa de mirar a ser el dato. **Segundo momento:** a mitad del pitch suena en el móvil del equipo un mensaje real con el enlace "día 3" escrito a partir de los fallos del jurado.

Dato de apoyo para el pitch (antiguo, citarlo con su fecha): en el estudio de parejas de Fidelity de 2015, el 43 % no acertó el salario de su pareja y el 47 % no coincidía en cuánto necesitan para jubilarse.

**Orden y tiempos:** la fuente es [PITCH.md](PITCH.md) (v4: diferenciador antes de 0:20, mensaje real hacia 0:42-0:54, escalera 60/62/73, día 7 → 62). No mantener un segundo guion aquí.

## 11. Riesgos conocidos y datos dudosos

| Riesgo | Arreglo |
|---|---|
| El efectivo "sobrante" no cuenta el coche de 2028 ni la casa de 2030 | No venderlo como libre; "lo que no sabemos" en la hoja |
| El plan pide pagar 6.800 $ (no toda la tarjeta); `target_amount` 11.200 es el saldo que queda | Usar 6.800 $ como primer paso |
| Seguro objetivo: 485.000 $ (`top_moves[1].target_amount`) vs 491.800 $ (`combined_moves[1].note`) | No dar cifra exacta de objetivo; hablar del rango recomendado |
| Weah: anualidad de 300.000 $/año a nombre de Melanie (2053-2079) en `profile.incomes[0]` que no aparece en `persona.md` ni en la renta usada | "A revisar con vuestro asesor" |
| Meses de fondo de emergencia como texto ("+12", "3") en `key_metrics.ratios.emergencyFund.emergencyFundMonths` | Calcular: efectivo ÷ `monthlyExpenses` |
| Textos del JSON con errores ("$270 a year" es mensual; "0.09 %" vs 0,1 %) | Usar campos numéricos, no los textos narrativos |
| Samantha: brecha de jubilación 0 vs sin activos líquidos a los 73 | Citar solo `facts` y `assetDepletion` |
| Vergüenza / mirar a otro lado | Tono "sorpresa del plan, no error tuyo"; palanca junto a la mala noticia |
| Parece el tour de Sherpas | Frase diferenciadora a los 15 s; hoja del asesor en pantalla |
| Avisos web no llegan en iPhone | Pitch: bot de Telegram (respaldo ntfy.sh). Producto: WhatsApp (Cloud API) con enlace y email de respaldo; .ics si sobra |
| "Hecho" autodeclarado | Día 7 pide el saldo |

## 12. Descartado y por qué (para la media página)

| Descartado | Por qué |
|---|---|
| Chat generativo como pieza central | Sherpas ya tiene chat; con chat libre la gente no sabe qué preguntar |
| Tour narrado o Wrapped de animaciones | Engancha pero no lleva a actuar; se parece a lo que existe |
| Puntos, rachas diarias, confeti | Con dinero parece infantil; un plan no se revisa a diario |
| Notificaciones push web | No llegan en iPhone sin instalar; email/WhatsApp con enlace |
| Cuentas de usuario | Fricción; el enlace con estado basta |
| Asesor por voz | Interesante pero cerca del chat; caro de hacer bien en una semana |

**Lo que no sabemos:** si el efectivo "sobrante" lo es de verdad (coche 2028, casa 2030); si "hecho" es real (autodeclarado); si la mejora de comprensión dura (lo medimos con la re-adivinanza del día 14).

## 13. Plan de trabajo (5 días: sáb 14 a mié 18)

Calendario real (README del reto): hoy es viernes 13 nov, el día de la idea. Días de trabajo: sábado 14, domingo 15, lunes 16, martes 17 y miércoles 18. Entrega el miércoles 18 a las 23:59 (PLAN-TECNICO fija entregar antes de las 18:00). Demo el jueves 19 a las 12:45. El alcance está dimensionado para 4 días de construcción (§18); el quinto es margen.

| Día | Qué |
|---|---|
| Sáb 14 | Backend + carga de JSON; gancho con contador (P01); componentes base; textos de reacción; sección 12 en la media página |
| Dom 15 | Sesiones y capa de IA con respaldo; P03; ciclo de la tarjeta (2 ramas) con interruptor novato/experto; revelación de pareja; escalera ordenable; hoja del asesor (contenido) |
| Lun 16 | Ciclo del seguro (1 rama); primer paso; enlace "día N" con estado; día 3 y día 7 con saldo; bot de Telegram con respaldo ntfy; pregunta al jurado; README; preparar la prueba |
| Mar 17 | Hoja del asesor en pantalla; pulido en móviles reales; **probar el flujo con 5-6 sesiones ajenas y anotar el recuento real** ("5 de 6 fallaron 2039"); ensayo 2; media página con el dato |
| Mié 18 | **Margen:** pulido, ensayo del pitch, despliegue final, captura del tour y del chat reales de Sherpas, vídeo (no puntúa) y entrega antes de las 18:00 |
| Jue 19, 12:45 | Demo |

## 14. Idioma

**Decisión (v7):** en el MVP solo español y sin interruptor de idioma; el inglés queda solo diseñado (§0) y se nombra en la media página. **Español en la demo** (el jurado y el pitch son en español y "comprensión" se juzga entendiendo); las familias y los asesores de Sherpas son de EE. UU., de ahí que el inglés esté diseñado.
- Los productos y términos de EE. UU. no se traducen: 401(k), Roth IRA, 529, umbrella, APR (no "TAE") aparecen en inglés con una glosa debajo ([glosario.md](glosario.md)).
- Importes siempre en dólares con formato español: "3.240 $" (ver §16).
- Textos en `content/es.js`, escritos a mano (`content/en.js` queda diseñado, no construido); la IA no traduce cifras.
- En el pitch, una frase: "Familias de EE. UU., en dólares, con jerga que ni muchos americanos entienden." Y un gesto: tocar "under insured" y ver la glosa.

## 15. Preguntas abiertas

- Stack (pregunta abierta para el equipo): ¿alguien ha usado React + Vite? Si sí, se usa (PLAN-TECNICO.md §1); si no, HTML + JS sin framework.
- La idea del viernes ya se envió; el README permite cambiar de opinión después. Si el enfoque cambió mucho, mandar una actualización corta por Discord sube "Plan del viernes".
- ¿Se confirma con mentores que basta con un caso?
- ¿Cómo son de verdad el tour y el chat de Sherpas?

## 16. Decisiones de la ronda 4 (cierran huecos de PANTALLAS.md)

Pantalla por pantalla, con microcopy y rutas: [PANTALLAS.md](PANTALLAS.md) (P01-P17). Estas decisiones sustituyen sus "[FALTA DATO]":

| Hueco | Decisión |
|---|---|
| Umbral de acierto | Cifras: error ≤ 20 % = "cerca", > 50 % = "lejos". Fechas: ±2 años = "cerca", > 6 años = "lejos". La rama la decide error + seguridad, no el acierto |
| Esfuerzo de los peldaños Weah | Del JSON `score.top_moves[i].effort`: tarjeta **medio**, seguro de vida **bajo**, umbrella **bajo**. No inventar otro |
| Marcas precargadas de Timothy y Melanie | Respuestas de ejemplo escritas por el equipo, rotuladas "respuestas de ejemplo" en pantalla (no son datos del plan) |
| Nota de cada orden de la escalera | Las 4 combinaciones están en `score.combined_moves`: tarjeta+vida+umbrella 78; tarjeta+vida 73; tarjeta+umbrella 62; **vida+umbrella sin tarjeta 60**. Si falta una, "sin dato del plan"; nunca calcular |
| Fecha por defecto del primer paso | Próximo lunes a las 19:00 (efecto "nuevo comienzo"; con hoy viernes 13 nov, lunes 16 nov); editable |
| Canal del mensaje real del pitch | **Telegram Bot** (gratis, sin dominio, push nativo en iPhone y Android); **respaldo ntfy.sh**; último recurso, vídeo de 10 s. Producción: WhatsApp Cloud API con plantillas y opt-in; email (Resend con dominio) de respaldo. El servidor lo envía con `POST /api/notify` (Telegram → ntfy), con las variables `TG_TOKEN`, `TG_CHAT` y `NTFY_TOPIC` (PLAN-TECNICO §5) |
| Orden de la hoja del asesor | Por salto de nota de `top_moves` y, a igualdad, por error × seguridad de la familia |
| Pareja y coste anual (P01) | No: en pareja solo se adivina la fecha de fin de la tarjeta, para no alargar |
| Formato monetario | ES: "3.240 $". Siempre dólares; el formato EN ("$3,240") queda diseñado. Corrige §14 |
| Botón "Pedir cita" en la demo | Abre la hoja del asesor con el aviso "Esto es lo que recibiría vuestro asesor"; no envía nada |

**Verificación de cifras (ronda 4):** todas las cifras de §0, §6.2, §6.4, §7 y §11 de Weah, Johnson y Michael comprobadas contra el JSON; ninguna incorrecta. Matices: `top_moves[0].action` es una frase más larga que empieza por "Pay $6,800"; el fondo de emergencia calculado da 16,05 meses (150.800 ÷ 9.397,5), no "+12".

**Mensaje real, ensayo:** /start al bot desde el móvil del pitch; 5 envíos desde la wifi del recinto con pantalla bloqueada (< 5 s); el enlace abre el día 3 sin login por HTTPS público; si Telegram falla en 5 s, la app llama a ntfy; botón "reenviar"; No molestar y ahorro de batería desactivados.

## 17. Decisiones de la ronda 5 (tercer jurado, UX móvil, cifras)

Tercer jurado: **75/100** a la v5 (más duro que nuestra estimación). Revisión UX (estimación, sin medición): la sesión se estimó en 7-8 min, no 6, y la escalera solo se puede reordenar arrastrando (incumple WCAG 2.5.7).

| Problema | Decisión |
|---|---|
| "Casi nadie lo adivina" sin dato | Retirado del pitch y de los textos. Solo se dirá con el recuento real de la prueba del martes 17 |
| Pitch sobrecargado (8 cambios de pantalla en 120 s) | El día 7 pasa a una frase sobre P13, sin abrir pantalla. La escalera, una sola demostración: "sin la tarjeta, aunque hagáis los dos seguros, 60" (`combined_moves[3]`) |
| Mensaje real "escrito por la IA" añade latencia | El mensaje del pitch es una plantilla en código con el año del jurado, `ccPayoffDate` y 270 $. La IA solo escribe la página del día 3 (pregenerada) |
| Personal flojo (cada uno contesta solo la fecha) | P07 muestra tras la revelación "Timothy: Growth · Melanie: Moderate" (`household[i].risk_profile`). La frase propia es el titular de P09, P11 y P13 |
| Una sola cifra por pantalla | P01 solo el contador; P02-R solo "septiembre de 2039"; P08 una cifra grande y ≤ 25 palabras; el resto en "Por qué" |
| Deslizadores imposibles con el pulgar | Años: chips por década + botones −/+. Saldo (P16): campo numérico `inputmode="decimal"`. P01 empieza vacío (sin 9.000 $ de anclaje) |
| Escalera solo con arrastre | Botones Subir/Bajar de 44 px como control principal; arrastre opcional; `aria-live` |
| Sesión de 7-8 min | Fuera: test de P09 (opcional), punto intermedio de P07, audio de P14. P04 y P06 son un componente; P10 es hoja inferior de P11; P14 es la cabecera de P17. Objetivo: ~5 min. El "Mapa" de §6.1 se fusiona con P12 |
| Ramas de P08 | 2 ramas (acierta / falla estando seguro); "acierta con duda" se une a "acierta" |
| Maquetas con cifras sin rotular (1.800 $, 2036, 2038, 2034) | Rotular "ejemplo" en PANTALLAS o quitar |
| Glosa en el núcleo | Recortable a 2 términos (under insured, umbrella), los únicos en pantallas del núcleo |
| Cifra grande sin significado (dolor 2) | Tarjeta de lectura sin ciclo en P12: "16,1 M$ en 2079 = 3,36 M$ de hoy" (proyección, buscar por `year`) |

Verificación de cifras de PITCH.md y PANTALLAS.md: ninguna cifra del plan incorrecta. Un falso positivo aclarado (la casa sin asegurar es la de Samantha, no la de Weah: en Weah `isInsured` = true).

## 18. Decisiones de la ronda 7 (cuarto jurado: 76/100)

| Problema | Decisión |
|---|---|
| La pareja había desaparecido del pitch | Vuelve en 0:20 con un dato real del plan: "él se declara Growth, ella Moderate" (`household[i].risk_profile`). El contador de 3.240 $ vuelve al cierre del pitch (1:50); el 150 $ del efectivo ya no se muestra (§17) |
| Lo personal es sintético (marcas de ejemplo) | El bloque "No coinciden" de la hoja se genera con reglas fijas desde `risk_profile` y las alertas T1/T2 de `persona.md`, sin citar el "77 %". En la demo, la marca del jurado es la única respuesta real y se dice así |
| No hay ningún dato propio | Probar el flujo con 5-6 sesiones (2 parejas + 2-3 individuales; no 2) el martes 17 y citar solo ese recuento, en el pitch (0:13) y en la media página |
| Escalera sobrecargada en el pitch | Se dicen dos cifras: 62 (tarjeta primero) y 60 (sin tarjeta). 73 y 78 se ven en pantalla, pero no se dicen |
| Alcance para 4 días de construcción (sáb 14 a mar 17), con el miércoles 18 de margen | La IA queda congelada en el texto fijo de P15 hasta que todo el núcleo funcione |
| Documentos contradictorios | Arreglados en §0, §5, §6.1 y §14: 2 ramas, glosa de 2 términos, sin audio, día 14 solo diseñado, ~5 min, solo español en el MVP |

## 19. Cumplimiento (ronda 9)

Un producto que explica un plan financiero a una familia tiene que dejar claro lo que es y lo que no. Reglas de producto, escritas en PANTALLAS.md §0.1:

| Regla | Decisión |
|---|---|
| Pie fijo en todas las pantallas | "Esto os ayuda a entender el plan de vuestro asesor. No es consejo nuevo ni lo cambia. Antes de mover dinero, hablad con vuestro asesor." |
| Redacción de las propuestas | "Vuestro plan propone…" en lugar de imperativos ("Pagad", "Transferid", "Entrad…") |
| IA a la vista | Etiqueta "Escrito con IA a partir de vuestro plan. Las cifras son las del plan" en P15 (si el texto es el de respaldo, "Texto del equipo") |
| Salida a una persona | Botón "Hablarlo con una persona" siempre visible (también sin asesor, §2) |
| Preguntas del jurado | PITCH.md §4 responde "¿Es consejo de inversión?" y "¿Se guardan las comunicaciones (SEC/FINRA)?". Respuesta de la segunda: en producción el registro iría al archivo del asesor; a verificar con compliance. La frase "no soy abogado" no va en ningún texto |

Esto no sustituye una revisión de compliance real; es lo que el MVP deja dicho en pantalla y en el pitch.

## 20. Decisiones de la ronda 11 (quinto jurado: 78/100)

| Problema | Decisión |
|---|---|
| Pie de cumplimiento frío, como letra pequeña | Nuevo texto (mismas 3 protecciones): "Esto os ayuda a entender el plan de vuestro asesor. No es consejo nuevo ni lo cambia. Antes de mover dinero, hablad con vuestro asesor." Una línea de 11 px con "ver más"; no roba espacio a la cifra protagonista |
| Etiqueta de IA y propuestas | "Escrito con IA a partir de vuestro plan. Las cifras son las del plan." Propuestas: "Vuestro plan propone empezar por…" + el paso. Modal del botón: "¿Preferís verlo con alguien? Os ayudamos a pedir cita." |
| "¿Y la tarjeta sola?" en el Q&A | La tarjeta sola da 62 (`score.top_moves[0].score_after`); tarjeta + umbrella también 62 (`combined_moves[2]`): el umbrella solo no mueve la nota. Respuesta preparada |
| Cadena guion → Telegram → enlace → día 3 (lo que hunde la demo) | Hotspot 4G propio como red; despliegue con URL fija (sin túnel que cambie); ensayo en el recinto el jueves 19 por la mañana; botón oculto "reenviar" para el presentador; sonido y vista previa de notificación activados; captura del mensaje en la diapositiva de reserva |
| El mensaje no se ve en la sala | El móvil se proyecta (cable o duplicar pantalla) o se enseña la captura en grande; no basta con "a cámara" |
| Media página densa | Abrir con una frase humana (la familia, su problema, qué cambia); las cifras van después |
| "270 $" sin unidad en el pitch | Siempre "270 $ al mes de intereses" |
| Textos de la app | Listos para pegar en [content-es.js](content-es.js) (73 marcadores con su ruta JSON; ninguna cifra escrita). Usa "quien os asesora" en vez de "vuestro asesor": variante aceptada del pie |
| Preguntas a mentores | [PREGUNTAS-MENTORES.md](PREGUNTAS-MENTORES.md): 6 preguntas que no revelan la idea, con qué hacemos según la respuesta |

## 21. Ronda 13: de 78 a 90

Veredicto: con estos cambios, unos 80-83. Pasar de 85 depende del dato propio y de que la cadena en vivo no falle. El techo ya no está en las funciones: hay demasiadas para 3-4 personas.

**Adoptado:**

| Cambio | Detalle | Coste |
|---|---|---|
| Dato propio más grande | Además de 2 sesiones guiadas, un enlace solo con la pregunta de la fecha de fin de la tarjeta, enviado lunes y martes al club y a conocidos, para llegar a N ≥ 20. Se cita solo el recuento real, con su N, rotulado "no es estadística" | 4 h |
| Hoja del asesor como agenda | Los 7 bloques se agrupan en 3, con las palabras del README: **preguntas, miedos y decisiones**. Las fuentes y "a revisar" van al pie | 3 h |
| Núcleo congelado el lunes 16 por la noche | Martes y miércoles: solo ensayos, la cadena Telegram → ntfy, móviles reales y la prueba con personas. Si el domingo hay retraso, lo primero que se corta es la glosa | 0 h |

**Propuesto, decide el equipo:**
- **Pitch de una sola idea:** narrar solo el jurado, el dato propio, la hoja y el cierre. Novato/experto y la escalera se construyen y se ven, pero no se narran.
- **Samantha como segunda tarjeta:** 20 s de su problema (dinero líquido hasta los 73), a cambio de que el ciclo del seguro pase a tarjeta informativa. Riesgo: sus datos contradictorios (§11).
- **Frase de producto** (la actual tiene 13 palabras). Candidatas:
  - "Primero adivinas, luego entiendes, después actúas."
  - "Que la familia llegue sabiendo lo que no sabe."
  - "Un plan que pregunta antes de contar."

## Registro de cambios

- **v7.2 (ronda 13):** §21: dato propio con N ≥ 20 (enlace de una pregunta) además de 2 sesiones guiadas; hoja del asesor en 3 bloques (preguntas, miedos, decisiones); núcleo congelado el lunes 16 por la noche. Propuestos al equipo: pitch de una sola idea, Samantha como segunda tarjeta, nueva frase de producto. content-es.js y PREGUNTAS-MENTORES.md (ronda 12).
- **v7.1 (ronda 11):** quinto jurado (78/100). §20: textos de cumplimiento más cálidos con las mismas protecciones; blindaje de la cadena del mensaje real (hotspot, URL fija, ensayo en el recinto, botón oculto "reenviar"); respuesta a "¿y la tarjeta sola?" (62); "270 $ al mes" siempre con unidad. Verificación de cifras tras v7: ninguna incorrecta.
- **v7 (ronda 9):** contradicciones entre los 9 ficheros arregladas con BASES §16-§18 como autoridad. Calendario real (hoy vie 13 nov; trabajo sáb 14 a mié 18; entrega mié 18 23:59; demo jue 19 12:45; prueba con 5-6 sesiones el martes 17; miércoles de margen). 2 ramas en la tarjeta y 1 en el seguro; P11-Q se queda (el MVP construye los tiempos 1, 2 y 3 de las noticias duras); calibración fuera del MVP; solo español, sin interruptor; APR en lugar de TAE; formato "3.240 $"; enlace `?sid=`; `?demo=1` (P02) separado de `?day=7` (selector de días); `POST /api/notify` con Telegram → ntfy y 3 variables nuevas; sesión de ~5 min con los tiempos de PANTALLAS; sin audio, .ics, otros 3 casos, días 14/21/30 ni dos móviles en el MVP; IA del día 3 condicionada al núcleo. Nueva §19 de cumplimiento.
- **v6.3 (ronda 8):** ficheros nuevos: MEDIA_PAGINA.md (278 palabras, con hueco para el recuento real), README-APP.md (arranque, variables, modo demo) y PRUEBA-USUARIOS.md (guion de 10-12 min por persona, hoja de registro, regla para una frase citable con N real).
- **v6.2 (ronda 7):** cuarto jurado (76/100). §18: la pareja vuelve al pitch con los perfiles reales; el bloque "No coinciden" se genera con reglas desde T1/T2; prueba con 5-6 personas; en el pitch la escalera se dice con 2 cifras; IA congelada hasta tener el núcleo; 8 contradicciones entre documentos arregladas.
- **v6.1 (ronda 6):** §3 con la competencia directa (10 plataformas), los 3 huecos propios, 2 parecidos peligrosos con su arreglo y 3 datos citables.
- **v6 (ronda 5):** tercer jurado (75/100), revisión de carga y accesibilidad en móvil, verificación de cifras de PITCH y PANTALLAS. Nueva §17: fuera "casi nadie lo adivina"; pitch más ligero (día 7 en una frase, escalera con "sin tarjeta, 60"); mensaje del pitch por plantilla; perfiles de riesgo visibles en P07; una cifra por pantalla; sin deslizadores de año; escalera con botones; sesión objetivo ~5 min. Nota de las 4 combinaciones de la escalera en §16.
- **v5 (ronda 4):** PANTALLAS.md (17 pantallas con microcopy y rutas) y PITCH.md reescrito (wow con el jurado, mensaje real a ~0:45, Q&A de datos contradictorios y de por qué no MCP). Nueva §16 con 10 decisiones que cierran los huecos de pantallas: umbrales de acierto, esfuerzo desde el JSON, canal Telegram + ntfy, formato monetario. Verificación completa de cifras: ninguna errónea. §10 remite a PITCH.md como única fuente del guion.
- **v4 (ronda 3):** segundo jurado (72/100 para la v3; dijo que el alcance sobraba un 40 %). Nueva §0 con el núcleo no negociable; momento "wow" (el jurado adivina en directo) y mensaje real durante el pitch; sesión de 2 ciclos completos (~6 min); saltos de la escalera aclarados como acumulados; seguro de vida en años de gastos (Weah 2,2 frente a 12, derivado y verificado); ruta del perfil de riesgo verificada y "77 % acciones" retirado; estructura de la hoja del asesor (7 bloques, ~350 palabras, por brecha) y privacidad; nuevos datos dudosos (anualidad de Melanie); día 5 con prueba con 2 personas y captura del tour real; PITCH.md creado.
- **v3 (ronda 2):** noticias duras en 4 tiempos (aviso y permiso, adivinar qué protege, una cifra concreta, palanca en la misma tarjeta) con tratamiento específico para Michael y Samantha; escalera con esfuerzo y peldaño "hablarlo" cuando la nota no refleja el problema; "a revisar con vuestro asesor" a partir de datos contradictorios del propio plan; idioma (ES por defecto en la demo, EN disponible, términos de EE. UU. con glosa); ficheros nuevos: PLAN-TECNICO.md, glosario.md, preguntas-otras-familias.md.
- **v2 (ronda 1):** jurado simulado (estimación 63 → 84 con arreglos), inventario del producto de Sherpas, verificación de cifras. Cambios: gancho visual con contador; interruptor novato/experto; pregunta de comprobación; 3.er ciclo "hoy vs mañana"; pregunta de riesgo en pareja; frase propia al principio; seguro de vida contado desde los hijos; traductor de jerga; primer paso corregido a 6.800 $ (lo que dice el plan) con "cómo se hace"; día 7 con saldo verificable; seguimiento por eventos del caso; hoja del asesor visible en la demo; rutas JSON corregidas (rendimiento del efectivo está en `investment-analysis.json`); secciones nuevas: qué existe en Sherpas, cobertura de los 11 dolores, descartado y por qué, plan de 5 días, datos dudosos.
- **v1 (ronda 0):** base a partir de todo lo acordado en el hilo.
