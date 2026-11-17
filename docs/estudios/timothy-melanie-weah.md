# Estudio: Timothy y Melanie Weah

- Caso: `timothy-melanie-weah`
- Datos: archivos de `cases/` (los mismos JSON que sirve el MCP)
- Frases: escritas por el LLM de Sherpas (`gpt-5-mini`, el 2026-11-14), con control de cifras
- Generado: 2026-11-17

## Lo que lee el LLM de esta familia

Les importa proteger a los niños y decidir qué hacer con el efectivo sobrante. Ver cuánto del pago de la tarjeta son intereses les moverá más que otros datos.

Por qué este orden: Primero el coste invisible que sangra la liquidez, luego la protección de la familia, la nota global y acabamos con la buena noticia del colchón.

## Nota

Hoy 60 de 100. Con los pasos del plan, 78.

| Área | Nota |
|---|---|
| Ahorro | 86 |
| Deudas | 58 |
| Inversiones | 56 |
| Colchón | 100 |
| Seguros | 37 |

## Preguntas, en orden

### 1. Pagáis 300 $ al mes a la tarjeta. ¿Cuánto de eso se va en intereses?

- Dato del plan: **270 $** de cada 300 $, en intereses (mala noticia)
- Origen: `profile.liabilities · key_metrics.debtManagement.creditCardDebt`. Cuenta nuestra: 270 $ de 300 $, redondeado a décimas
- Si acierta: «Lo teníais claro. Mirad a dónde se va.»
- Si el dato es mayor de lo que dijo: «Son {dif} más al mes de lo que pensabais.»
- Si es menor: «Menos de lo que temíais. Aun así, mirad a dónde se va.»
- Para que lo sienta: De cada **300 $** que pagáis, **270 $** son intereses. Eso significa que vuestro pago apenas reduce la deuda y mantiene la carga mensual alta.
- Salida: La salida está en vuestro plan: pagar 6.800 $ de la tarjeta.
- Escrito por el LLM: q, siente

### 2. Si a uno de los dos le pasara algo, ¿cuántos años de gastos de casa tendrían cubiertos Liam (6) y Josh (3)?

- Dato del plan: **unos 2 años** de gastos de casa (mala noticia)
- Origen: `key_metrics.protection.lifeInsurance · ratios.investableAssetLevel.annualExpenses`. Cuenta nuestra: seguro de vida de hoy ÷ gastos de casa al año
- Si acierta: «Habéis estado cerca. Mirad hasta dónde llega.»
- Si el dato es mayor de lo que dijo: «Algo más, pero lejos de lo que hace falta.»
- Si es menor: «Mucho menos de lo que pensabais.»
- Para que lo sienta: Hoy tenéis **250.000 $** en seguro de vida, que equivale a **unos 2 años** de gastos de casa para Liam y Josh; con esa cobertura Liam estaría protegido hasta alrededor de los 8 años.
- Salida: Tiene arreglo y se ve con vuestro asesor: él trae los presupuestos.
- Escrito por el LLM: q, siente

### 3. Del 0 al 100, ¿qué nota de salud financiera creéis que os pone vuestro estudio?

- Dato del plan: **60** de 100, hoy (mala noticia)
- Origen: `score.published_score · score.pillars`
- Si acierta: «Lo teníais claro.»
- Si el dato es mayor de lo que dijo: «Mejor de lo que pensabais.»
- Si es menor: «Más baja de lo que pensabais.»
- Para que lo sienta: La nota general del plan es **60** de 100. Refleja puntos fuertes como el colchón y debilidades claras en seguros.
- Salida: Con los pasos de vuestro plan llega a 78.
- Escrito por el LLM: q, siente

### 4. Si mañana os quedarais sin ingresos, ¿cuántos meses de gastos básicos cubre vuestro efectivo?

- Dato del plan: **16 meses** de gastos básicos (buena noticia)
- Origen: `key_metrics.facts.cash`
- Si acierta: «Eso es. Aquí vais bien.»
- Si el dato es mayor de lo que dijo: «Más de lo que pensabais.»
- Si es menor: «Algo menos de lo que pensabais, pero por encima del mínimo recomendado.»
- Para que lo sienta: Vuestro efectivo cubre **16 meses** de gastos básicos. Eso os da margen para decidir sin prisa y usar parte del sobrante en otras prioridades.
- Salida: Con parte de ese efectivo es con lo que vuestro plan propone pagar la tarjeta.
- Escrito por el LLM: q, siente

Preguntas posibles que no se usan en este caso: Año en que se acaba la tarjeta (septiembre de 2039 pagando 300 $ al mes); Jubilación (Sí, llega y al final del estudio quedan 2,37 M$).

## Pasos del plan

| Paso | Quién | Nota tras el paso (solo) |
|---|---|---|
| Pagar 6.800 $ de la tarjeta | La familia | 62 |
| Subir el seguro de vida | Con el asesor | 60 |
| Seguro extra de responsabilidad civil | Con el asesor | 60 |

Combinaciones que trae el plan: Pagar 6.800 $ de la tarjeta + Subir el seguro de vida + Seguro extra de responsabilidad civil = 78; Pagar 6.800 $ de la tarjeta + Subir el seguro de vida = 73; Pagar 6.800 $ de la tarjeta + Seguro extra de responsabilidad civil = 62; Subir el seguro de vida + Seguro extra de responsabilidad civil = 60.

## De hoy a la jubilación

- Hoy: Nota 60
- Paso 1: Pagar 6.800 $ de la tarjeta
- Paso 2: Subir el seguro de vida
- Paso 3: Seguro extra de responsabilidad civil
- 2028: El coche (45.000 $)
- 2030: La casa (600.000 $)
- 2038: Universidad de Liam
- 2039: Sin cambios, la tarjeta dura hasta aquí (Liam, 19 · Josh, 16)
- 2041: Universidad de Josh
- 2048: Jubilación (Los ahorros llegan hasta el final)

## Para el asesor

- Si pagamos parte de la tarjeta hoy, ¿cómo cambia el plan?
- ¿Cuánta vida necesitamos contratar exactamente para estar tranquilos?
- ¿En qué orden deberíamos usar el efectivo sobrante?

## Respuesta completa del LLM

```json
{
  "lectura": "Les importa proteger a los niños y decidir qué hacer con el efectivo sobrante. Ver cuánto del pago de la tarjeta son intereses les moverá más que otros datos.",
  "orden": [
    "tarjeta_interes",
    "vida",
    "nota",
    "colchon"
  ],
  "porque_orden": "Primero el coste invisible que sangra la liquidez, luego la protección de la familia, la nota global y acabamos con la buena noticia del colchón.",
  "frases": [
    "Me preocupa que el dinero vaya en intereses",
    "Quiero que Liam y Josh estén cubiertos",
    "Que tengamos margen para comprar casa y coche",
    "Que el colchón nos deje tranquilos"
  ],
  "ganancias": [
    "Dormiríamos sin mirar el teléfono",
    "Tendríamos tranquilidad para planear",
    "Ahorraríamos con más claridad cada mes",
    "Podríamos decidir sin prisa el siguiente paso"
  ],
  "abiertas": [
    "Si pagamos parte de la tarjeta hoy, ¿cómo cambia el plan?",
    "¿Cuánta vida necesitamos contratar exactamente para estar tranquilos?",
    "¿En qué orden deberíamos usar el efectivo sobrante?"
  ],
  "preguntas": {
    "tarjeta_interes": {
      "q": "Pagáis 300 $ al mes a la tarjeta. ¿Cuánto de eso se va en intereses?",
      "cerca": "Lo habíais notado: casi todo va en intereses",
      "siente": "De cada **300 $** que pagáis, **270 $** son intereses. Eso significa que vuestro pago apenas reduce la deuda y mantiene la carga mensual alta.",
      "salida": "Pagar 6.800 $ de la tarjeta"
    },
    "vida": {
      "q": "Si a uno de los dos le pasara algo, ¿cuántos años de gastos de casa tendrían cubiertos Liam (6) y Josh (3)?",
      "cerca": "Lo teníais claro: cubre sólo unos años de gastos",
      "siente": "Hoy tenéis **250.000 $** en seguro de vida, que equivale a **unos 2 años** de gastos de casa para Liam y Josh; con esa cobertura Liam estaría protegido hasta alrededor de los 8 años.",
      "salida": "Subir el seguro de vida"
    },
    "nota": {
      "q": "Del 0 al 100, ¿qué nota de salud financiera creéis que os pone vuestro plan?",
      "cerca": "Acertasteis: la nota del plan es 60",
      "siente": "La nota general del plan es **60** de 100. Refleja puntos fuertes como el colchón y debilidades claras en seguros.",
      "salida": "Reunión con el asesor"
    },
    "colchon": {
      "q": "Si mañana os quedarais sin ingresos, ¿cuántos meses de gastos básicos cubre vuestro efectivo?",
      "cerca": "Perfecto: tenéis un colchón amplio",
      "siente": "Vuestro efectivo cubre **16 meses** de gastos básicos. Eso os da margen para decidir sin prisa y usar parte del sobrante en otras prioridades.",
      "salida": "Reunión con el asesor"
    }
  }
}
```
