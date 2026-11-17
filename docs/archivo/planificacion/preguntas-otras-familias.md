> **Archivo.** Documento de trabajo antiguo: describe una idea o un plan que ya no es el de la app. Lo vigente está en el [README](../../../README.md) y en [docs/brainstorming/decisiones.md](../../brainstorming/decisiones.md).

# Banco de preguntas: Michael, Johnson y Samantha

> Complemento de BASES.md §7 (Weah). Ronda 2. Rutas en `financial-health.json` de cada caso. "Derivado" = calculado por la app a partir de campos guardados (nunca por la IA).

## Michael Carter (nota 26, "critical")

| Pregunta | Respuesta | Ruta | Tipo |
|---|---|---|---|
| ¿A qué edad te quedas sin dinero líquido? | 85 | `key_metrics.retirementAndOtherGoals.assetDepletion.ageWhenTheyRunOutOfLiquidAssets` | Guardado |
| ¿Cuánto pagas al año en intereses de todas tus deudas? | 2.030 $ (tarjeta Amex 700 $, al 20 %) | `key_metrics.debtManagement.listOfDebts[1..3]` (saldo × tasa; la columna "Interest paid" es mensual) | Derivado |
| ¿Qué sube más tu nota? | Bajar lo que retiras en la jubilación a 10.300 $/año: 26 → 62 (esfuerzo alto) | `score.top_moves[1]` | Guardado |
| Lo más fácil que sube tu nota | Seguro de responsabilidad civil de 1 M$: 26 → 31 (esfuerzo bajo) | `score.top_moves[0]` | Guardado |
| Tu patrimonio en 2050: ¿cuánto es en dinero de hoy? | 2.884.734 $ → 1.401.908 $ | `projections.yearly[year==2050]` | Guardado |
| ¿Cuánto seguro de vida recomienda el plan? | 900.000-1.800.000 $; tienes 180.000 $ (faltan 720.000 $) | `key_metrics.protection.lifeInsurance.lifeInsuranceCoverageGapsAndExcess.clientShortfall` | Guardado |
| Entrada de la casa de 2027 | 113.300 $ frente a 30.000 $ disponibles | `key_metrics.facts.cash.accessibleCash`, `totalCashNeeded` | Guardado |

**Escalera:** 26 → 31 (fácil) · 26 → 31 (más crecimiento, difícil) · 26 → 62 (retirar menos, difícil). Sin movimientos combinados.

## Daniel y Emily Johnson (nota 52, "vulnerable")

| Pregunta | Respuesta | Ruta | Tipo |
|---|---|---|---|
| ¿Os dura el dinero hasta el final? | Sí; 260.272 $ al final | `key_metrics.retirementAndOtherGoals.assetDepletion` | Guardado |
| ¿Cuándo termináis la tarjeta a este ritmo? | Enero de 2034 | `key_metrics.debtManagement.creditCardDebt.ccPayoffDate` | Guardado |
| ¿Cuánto os cuesta la tarjeta al año? | 4.482 $ (24,9 %); de cada 450 $ al mes, 373,50 $ son intereses | `profile.liabilities[0]`; `ccPaymentEqualToInterestRate` | Derivado |
| ¿Qué sube más vuestra nota? | Seguro de vida: 52 → 57 (fácil). Máximo combinado: 60 | `score.top_moves[0]`, `score.combined_moves` | Guardado |
| ¿Cuánto seguro de vida os falta? | Daniel 1.350.000 $, Emily 1.000.000 $ | `...lifeInsuranceCoverageGapsAndExcess.clientShortfall`, `coClientShortfall` | Guardado |
| ¿Cuántos meses aguantaríais sin ingresos? | 1,4 meses | `key_metrics.facts.cash.monthsCovered` | Guardado |

**Escalera:** 52 → 55 (ahorro, medio) · 56 (responsabilidad civil, fácil) · 57 (vida, fácil) · 59-60 combinados.

## Samantha Lewis (nota 82, "strong")

| Pregunta | Respuesta | Ruta | Tipo |
|---|---|---|---|
| Con un 82, ¿hasta qué edad te dura el dinero líquido? | 73 | `key_metrics.retirementAndOtherGoals.assetDepletion.ageWhenTheyRunOutOfLiquidAssets` | Guardado |
| ¿Cuánto tienes en cuentas de jubilación? | 0 $ | `persona.md` / cuentas en `profile.accounts` | Guardado |
| ¿Qué parte de tu gasto de jubilación cubre la Social Security? | 25 % | `key_metrics.facts.retirement.incomeShareOfNeed` | Guardado |
| ¿Qué sube más tu nota? | Asegurar la casa: 82 → 84 (medio) | `score.top_moves[0]` | Guardado |
| Tu patrimonio en 2050 en dinero de hoy | 3.169.301 $ → 1.540.200 $ | `projections.yearly[year==2050]` | Guardado |
| ¿Cuándo es el próximo pago de universidad? | Ethan, agosto de 2027 (12.500 $); Ava desde agosto de 2028 | `persona.md`; `goals.chartGoals` | Guardado |

**Escalera:** 82 → 83 (diversificar, difícil) · 82 → 83 (menos crecimiento, difícil) · 82 → 84 (seguro de casa, medio). Ojo: la nota casi no se mueve; el problema real (sin dinero a los 73) no lo arregla ningún movimiento de la nota. **Para Samantha, la escalera no sirve tal cual**: hay que mostrar el problema de jubilación como peldaño "hablarlo con el asesor".

## Datos contradictorios (para la hoja del asesor, "a revisar")

- **Michael:** el primer movimiento (+5) va antes que el de mayor efecto (+36); tasa de retirada "sostenible" 6 % en un sitio y 4 % en otro; efectivo 27.000 $ o 30.000 $; edad de agotamiento 85 en un campo y 86 en la proyección.
- **Johnson:** tres cifras distintas de ahorro extra para jubilación (15.032 $, 41.032 $, 34.165 $); el objetivo de seguro de vida de `top_moves` es del hogar, no por persona.
- **Samantha:** la casa figura sin asegurar pero hay una prima de seguro de hogar de 4.500 $/año en sus gastos; brecha de jubilación 0 con 1,45 M$ sin cubrir.
- **Todos:** la columna de intereses de las deudas es mensual; los pesos de los pilares de la nota no son iguales entre casos.
