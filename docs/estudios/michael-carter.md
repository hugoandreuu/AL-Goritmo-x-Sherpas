# Estudio: Michael Carter

- Caso: `michael-carter`
- Datos: MCP de Sherpas (get_case)
- Frases: escritas por el LLM de Sherpas (`gpt-5-mini`, el 2026-11-14), con control de cifras
- Generado: 2026-11-14

## Avisos

- nota.siente: descartado por jerga o rayas

## Lo que lee el LLM de esta familia

Le importa poder comprar la casa sin quedarse sin colchón y, al mismo tiempo, no recortar su jubilación. Lo que más le moverá es ver cuántos meses de gastos cubre su efectivo. También reaccionará fuerte al dato sobre hasta cuándo duran sus ahorros.

Por qué este orden: Primero la liquidez y la casa, luego la jubilación; cerramos con la nota y una buena noticia de la tarjeta

## Nota

Hoy 26 de 100. Con los pasos del plan, 62.

| Área | Nota |
|---|---|
| Ahorro | 0 |
| Deudas | 78 |
| Inversiones | 42 |
| Colchón | 22 |
| Seguros | 18 |

## Preguntas, en orden

### 1. Si mañana te quedaras sin ingresos, ¿cuántos meses de gastos crees que cubre tu efectivo?

- Dato del plan: **3,2 meses** de gastos básicos (mala noticia)
- Origen: `key_metrics.facts.cash`
- Si acierta: «Lo tenías claro. Mira lo que recomienda el plan.»
- Si el dato es mayor de lo que dijo: «Algo más de lo que pensabas, pero no llega a lo recomendado.»
- Si es menor: «Menos de lo que pensabas.»
- Para que lo sienta: Michael, tu efectivo cubre **3,2 meses** de gastos básicos. La reserva recomendada es entre 5 y 6 meses; si apartas los objetivos a corto plazo, los meses cubiertos pasan a **0**.
- Salida: Tu plan propone acercar ese colchón a lo recomendado. El cómo se ve con tu asesor.
- Escrito por el LLM: q, siente

### 2. ¿Te llega para jubilarte a los 58 y vivir de ello?

- Dato del plan: **hasta los 85** te duran los ahorros (mala noticia)
- Origen: `key_metrics.facts.retirement`
- Si acierta: «Lo veías venir. Mira hasta dónde llega.»
- Si el dato es mayor de lo que dijo: «El plan dice que no llega.»
- Si es menor: «El plan dice otra cosa.»
- Para que lo sienta: Michael, según el plan tus ahorros se acaban a los **85 años** cuando tu objetivo es jubilarte a los 58. Los ingresos garantizados cubren el 34% del gasto previsto.
- Salida: Tu plan trae un paso para esto, y solo con él la nota pasa de 26 a 62.
- Escrito por el LLM: q, siente

### 3. Del 0 al 100, ¿qué nota de salud financiera crees que te pone tu plan?

- Dato del plan: **26** de 100, hoy (mala noticia)
- Origen: `score.published_score · score.pillars`
- Si acierta: «Lo tenías claro.»
- Si el dato es mayor de lo que dijo: «Mejor de lo que pensabas.»
- Si es menor: «Más baja de lo que pensabas.»
- Para que lo sienta: Lo que más tira hacia abajo: **Ahorro** (0 de 100). Lo que mejor tienes: **Deudas** (78 de 100).
- Salida: Con los pasos de tu plan llega a 62.
- Escrito por el LLM: q

### 4. Pagas 200 $ al mes a la tarjeta. ¿Cuánto de eso se va en intereses?

- Dato del plan: **58 $** de cada 200 $, en intereses (buena noticia)
- Origen: `profile.liabilities · key_metrics.debtManagement.creditCardDebt`. Cuenta nuestra: 58 $ de 200 $, redondeado a décimas
- Si acierta: «Eso es. Aquí la deuda sí baja.»
- Si el dato es mayor de lo que dijo: «Algo más de lo que pensabas, pero la deuda baja.»
- Si es menor: «Menos de lo que temías.»
- Para que lo sienta: De tus 200 $ al mes, **58 $** se van en intereses. Esa porción frena la reducción del saldo y el alivio mensual.
- Salida: Tu plan dice que sigas pagándola: va por buen camino.
- Escrito por el LLM: q, siente

## Pasos del plan

| Paso | Quién | Nota tras el paso (solo) |
|---|---|---|
| Seguro extra de responsabilidad civil | Con el asesor | 31 |
| Sacar menos de tus ahorros al jubilarte | Con el asesor | 62 |
| Subir la parte de tus inversiones que busca crecer | Con el asesor | 31 |

El plan no trae la nota de varios pasos juntos; la app no la inventa.

## De hoy a la jubilación

- Hoy: Nota 26
- Paso 1: Seguro extra de responsabilidad civil
- Paso 2: Sacar menos de tus ahorros al jubilarte
- Paso 3: Subir la parte de tus inversiones que busca crecer
- 2027: La casa (550.000 $)
- 2028: Se acaba la tarjeta
- 2047: Jubilación
- 2075: Aquí se acaban los ahorros (A los 85 años, según tu plan)

## Para el asesor

- ¿Podemos comprar la casa y mantener el colchón?
- ¿Qué tendría que cambiar para que me lleguen los ahorros?

## Respuesta completa del LLM

```json
{
  "lectura": "Le importa poder comprar la casa sin quedarse sin colchón y, al mismo tiempo, no recortar su jubilación. Lo que más le moverá es ver cuántos meses de gastos cubre su efectivo. También reaccionará fuerte al dato sobre hasta cuándo duran sus ahorros.",
  "orden": [
    "colchon",
    "jubilacion",
    "nota",
    "tarjeta_interes"
  ],
  "porque_orden": "Primero la liquidez y la casa, luego la jubilación; cerramos con la nota y una buena noticia de la tarjeta",
  "frases": [
    "Tener el dinero para la casa",
    "No quedarme corto para jubilarme",
    "Saber si voy por buen camino",
    "Pagar menos en la tarjeta"
  ],
  "ganancias": [
    "Dormiría más tranquilo por las mañanas",
    "Podría planear mi retiro con calma",
    "Vería sentido a lo que ahorro",
    "Tendría más margen mensual"
  ],
  "abiertas": [
    "¿Podemos comprar la casa y mantener el colchón?",
    "¿Qué tendría que cambiar para que me lleguen los ahorros?",
    "¿Cuánto costaría subir el seguro o añadir un umbrella?"
  ],
  "preguntas": {
    "colchon": {
      "q": "Si mañana te quedaras sin ingresos, ¿cuántos meses de gastos crees que cubre tu efectivo?",
      "cerca": "Tenías una idea parecida",
      "mas": "Son {dif} meses más que dijiste ({tu})",
      "menos": "Menos de lo que pensabas: {dif} meses menos ({tu})",
      "siente": "Michael, tu efectivo cubre **3,2 meses** de gastos básicos. La reserva recomendada es entre 5 y 6 meses; si apartas los objetivos a corto plazo, los meses cubiertos pasan a **0**.",
      "salida": "Ver con el asesor cómo encajar la casa y el colchón"
    },
    "jubilacion": {
      "q": "¿Te llega para jubilarte a los 58 y vivir de ello?",
      "cerca": "Tu intuición estaba cerca",
      "mas": "Es {dif} mejor de lo que pensabas ({tu})",
      "menos": "Es peor de lo que pensabas: {dif} ({tu})",
      "siente": "Michael, según el plan tus ahorros se acaban a los **85 años** cuando tu objetivo es jubilarte a los 58. Los ingresos garantizados cubren el 34% del gasto previsto.",
      "salida": "Sacar menos de tus ahorros al jubilarte"
    },
    "nota": {
      "q": "Del 0 al 100, ¿qué nota de salud financiera crees que te pone tu plan?",
      "cerca": "No estabas lejos",
      "mas": "Son {dif} puntos más de lo que dijiste ({tu})",
      "menos": "Son {dif} puntos menos de lo que dijiste ({tu})",
      "siente": "Tu nota hoy es **26 de 100**, Michael. Eso resume que la secuencia del dinero —casa, colchón, ahorro— necesita ordenarse.",
      "salida": "Subir la parte de tus inversiones que busca crecer"
    },
    "tarjeta_interes": {
      "q": "Pagas 200 $ al mes a la tarjeta. ¿Cuánto de eso se va en intereses?",
      "cerca": "Lo tenías claro",
      "mas": "Se van {dif} $ más en intereses de lo que dijiste ({tu})",
      "menos": "Menos intereses de lo que pensabas: {dif} $ ({tu})",
      "siente": "De tus 200 $ al mes, **58 $** se van en intereses. Esa porción frena la reducción del saldo y el alivio mensual.",
      "salida": "Hablar con el asesor para priorizar pagos y ver opciones"
    }
  }
}
```
