# Estudio: Samantha Lewis

- Caso: `samantha-lewis`
- Datos: archivos de `cases/` (los mismos JSON que sirve el MCP)
- Frases: escritas por el LLM de Sherpas (`gpt-5-mini`, el 2026-11-14), con control de cifras
- Generado: 2026-11-16

## Lo que lee el LLM de esta familia

Samantha prioriza proteger a Ethan y Ava y asegurarse de tener tranquilidad a largo plazo. Lo que más le moverá es saber hasta cuándo le duran los ahorros. También le interesará la concentración de sus inversiones y confirmar que su colchón es suficiente.

Por qué este orden: Primero toca lo más crítico (la jubilación), luego la inversión concreta que le preocupa, después una buena noticia sobre su colchón y al final el resultado global.

## Nota

Hoy 82 de 100. Con los pasos del plan, 84.

| Área | Nota |
|---|---|
| Ahorro | 75 |
| Deudas | 100 |
| Inversiones | 66 |
| Colchón | 100 |
| Seguros | 71 |

## Preguntas, en orden

### 1. ¿Te llega para jubilarte a los 65 y vivir de ello?

- Dato del plan: **hasta los 73** te duran los ahorros (mala noticia)
- Origen: `key_metrics.facts.retirement`
- Si acierta: «Lo veías venir. Mira hasta dónde llega.»
- Si el dato es mayor de lo que dijo: «El estudio dice que no llega.»
- Si es menor: «El estudio dice otra cosa.»
- Para que lo sienta: Con este plan, tus ahorros acaban a **73 años**. Eso deja parte de tus gastos de jubilación sin cubrir más adelante.
- Salida: Es de lo primero que se ve con tu asesor: cuánto ahorrar y cuándo jubilarte.
- Escrito por el LLM: q, siente

### 2. De todo lo que tienes invertido, ¿qué parte está en un solo fondo?

- Dato del plan: **39 %** en un solo fondo (VTI) (mala noticia)
- Origen: `score.top_moves`
- Si acierta: «Lo tenías claro.»
- Si el dato es mayor de lo que dijo: «Más de lo que pensabas.»
- Si es menor: «Menos de lo que pensabas. Aun así, el estudio lo ve alto.»
- Para que lo sienta: Hoy tienes **39 %** de lo invertido en un solo fondo, VTI. El plan propone dejarlo en **25 %**, para no depender tanto de una sola posición y dar más equilibrio a tu cartera.
- Salida: Qué vender y cuándo se ve con tu asesor.
- Escrito por el LLM: q, siente

### 3. Si mañana te quedaras sin ingresos, ¿cuántos meses de gastos básicos cubre tu efectivo?

- Dato del plan: **7,9 meses** de gastos básicos (buena noticia)
- Origen: `key_metrics.facts.cash`
- Si acierta: «Eso es. Aquí vas bien.»
- Si el dato es mayor de lo que dijo: «Más de lo que pensabas.»
- Si es menor: «Algo menos de lo que pensabas, pero dentro de lo recomendado.»
- Para que lo sienta: Tu efectivo cubre **7,9 meses** de gastos básicos, por encima de la reserva recomendada. Eso te da margen para afrontar los pagos de Ethan y los imprevistos sin agobios inmediatos.
- Salida: Este punto ya está. No hay que tocarlo.
- Escrito por el LLM: q, siente

### 4. Del 0 al 100, ¿qué nota de salud financiera crees que te pone tu estudio?

- Dato del plan: **82** de 100, hoy (buena noticia)
- Origen: `score.published_score · score.pillars`
- Si acierta: «Lo tenías claro.»
- Si el dato es mayor de lo que dijo: «Mejor de lo que pensabas.»
- Si es menor: «Más baja de lo que pensabas.»
- Para que lo sienta: Tu plan tiene una salud de **82 de 100** hoy. Con los pasos del plan la nota puede subir y dar más certidumbre sobre cómo afrontar retiro y estudios de los niños.
- Salida: Con los pasos de tu plan llega a 84.
- Escrito por el LLM: q, siente

## Pasos del plan

| Paso | Quién | Nota tras el paso (solo) |
|---|---|---|
| Asegurar tu casa | Con el asesor | 84 |
| Repartir mejor tus inversiones | Con el asesor | 83 |
| Bajar un poco el riesgo de tus inversiones | Con el asesor | 83 |

El plan no trae la nota de varios pasos juntos; la app no la inventa.

## De hoy a la jubilación

- Hoy: Nota 82
- Paso 1: Asegurar tu casa
- Paso 2: Repartir mejor tus inversiones
- Paso 3: Bajar un poco el riesgo de tus inversiones
- 2028: Universidad de Ava
- 2030: La casa (500.000 $)
- 2044: Jubilación
- 2053: Aquí se acaban los ahorros (A los 73 años, según tu estudio)

## Para el asesor

- ¿Cómo priorizamos retiro o universidad?
- ¿Podemos reducir mi concentración sin perder rendimiento?
- ¿Qué tendría que ver contigo en la reunión?

## Respuesta completa del LLM

```json
{
  "lectura": "Samantha prioriza proteger a Ethan y Ava y asegurarse de tener tranquilidad a largo plazo. Lo que más le moverá es saber hasta cuándo le duran los ahorros. También le interesará la concentración de sus inversiones y confirmar que su colchón es suficiente.",
  "orden": [
    "jubilacion",
    "concentracion",
    "colchon",
    "nota"
  ],
  "porque_orden": "Primero toca lo más crítico (la jubilación), luego la inversión concreta que le preocupa, después una buena noticia sobre su colchón y al final el resultado global.",
  "frases": [
    "Que Ethan y Ava estén cubiertos",
    "Tener suficiente para jubilarme",
    "No quedarme sin efectivo",
    "Que no dependa de un solo fondo"
  ],
  "ganancias": [
    "Dormiría sin miedo al dinero futuro",
    "Podría planear viajes sin agobios",
    "Pagaría la universidad sin tensiones",
    "Revisaría inversiones con calma"
  ],
  "abiertas": [
    "¿Cómo priorizamos retiro o universidad?",
    "¿Podemos reducir mi concentración sin perder rendimiento?",
    "¿Qué tendría que ver contigo en la reunión"
  ],
  "preguntas": {
    "jubilacion": {
      "q": "¿Te llega para jubilarte a los 65 y vivir de ello?",
      "cerca": "Casi: no llega para toda la jubilación",
      "mas": "Mejor de lo que pensabas {tu}",
      "menos": "Peor de lo que pensabas {tu}",
      "siente": "Con este plan, tus ahorros acaban a **73 años**. Eso deja parte de tus gastos de jubilación sin cubrir más adelante.",
      "salida": "Repartir mejor tus inversiones"
    },
    "concentracion": {
      "q": "De todo lo que tienes invertido, ¿qué parte está en un solo fondo?",
      "cerca": "Eso concentra mucho en un solo fondo",
      "mas": "Hay más exposición de la que creías {tu}",
      "menos": "Menos de lo que pensabas {tu}",
      "siente": "Hoy tienes **39 %** de lo invertido en un solo fondo, VTI. El plan propone dejarlo en **25 %**, para no depender tanto de una sola posición y dar más equilibrio a tu cartera.",
      "salida": "Bajar un poco el riesgo de tus inversiones"
    },
    "colchon": {
      "q": "Si mañana te quedaras sin ingresos, ¿cuántos meses de gastos básicos cubre tu efectivo?",
      "cerca": "Tienes más colchón del esperado",
      "mas": "Tienes más margen del que pensabas {tu}",
      "menos": "Tienes menos margen del que pensabas {tu}",
      "siente": "Tu efectivo cubre **7,9 meses** de gastos básicos, por encima de la reserva recomendada. Eso te da margen para afrontar los pagos de Ethan y los imprevistos sin agobios inmediatos.",
      "salida": "Asegurar tu casa"
    },
    "nota": {
      "q": "Del 0 al 100, ¿qué nota de salud financiera crees que te pone tu plan?",
      "cerca": "Vas muy cerca de la nota real",
      "mas": "Tu percepción es mejor que la nota real {tu}",
      "menos": "Tu percepción es peor que la nota real {tu}",
      "siente": "Tu plan tiene una salud de **82 de 100** hoy. Con los pasos del plan la nota puede subir y dar más certidumbre sobre cómo afrontar retiro y estudios de los niños.",
      "salida": "Asegurar tu casa"
    }
  }
}
```
