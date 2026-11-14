# Estudio: Daniel y Emily Johnson

- Caso: `daniel-emily-johnson`
- Datos: MCP de Sherpas (get_case)
- Frases: escritas por el LLM de Sherpas (`gpt-5-mini`, el 2026-11-14), con control de cifras
- Generado: 2026-11-14

## Avisos

- tarjeta_interes.siente: descartado por jerga o rayas

## Lo que lee el LLM de esta familia

A Daniel y Emily les mueve ante todo proteger a los niños y tener colchón líquido. Les preocupa cuánto cubren los seguros y cuánto aguanta su efectivo antes de tocarlo.

Por qué este orden: Empezamos por la protección, luego la liquidez, el coste de la deuda y cerramos con la noticia sobre la jubilación.

## Nota

Hoy 52 de 100. Con los pasos del plan, 60.

| Área | Nota |
|---|---|
| Ahorro | 54 |
| Deudas | 76 |
| Inversiones | 51 |
| Colchón | 85 |
| Seguros | 0 |

## Preguntas, en orden

### 1. Si a uno de los dos le pasara algo, ¿cuántos años de gastos de casa tendrían cubiertos Oliver (11) y Sophia (9)?

- Dato del plan: **unos 3 años** de gastos de casa (mala noticia)
- Origen: `key_metrics.protection.lifeInsurance · ratios.investableAssetLevel.annualExpenses`. Cuenta nuestra: seguro de vida de hoy ÷ gastos de casa al año
- Si acierta: «Habéis estado cerca. Mirad hasta dónde llega.»
- Si el dato es mayor de lo que dijo: «Algo más, pero lejos de lo que hace falta.»
- Si es menor: «Mucho menos de lo que pensabais.»
- Para que lo sienta: Hoy tenéis cubiertos unos **3 años** de gastos de casa. Con eso, Oliver, con 11 años, estaría protegido hasta los 14; a Sophia le quedaría parte de su infancia cubierta.
- Salida: Tiene arreglo y se ve con vuestro asesor: él trae los presupuestos.
- Escrito por el LLM: q, siente

### 2. Si mañana os quedarais sin ingresos, ¿cuántos meses de gastos básicos cubre vuestro efectivo?

- Dato del plan: **1,4 meses** de gastos básicos (mala noticia)
- Origen: `key_metrics.facts.cash`
- Si acierta: «Lo teníais claro. Mirad lo que recomienda el plan.»
- Si el dato es mayor de lo que dijo: «Algo más de lo que pensabais, pero no llega a lo recomendado.»
- Si es menor: «Menos de lo que pensabais.»
- Para que lo sienta: El efectivo accesible solo cubre **1,4 meses** de gastos básicos. Con esa cifra, una parada de ingresos os dejaría expuestos y complicaría la vacación prevista.
- Salida: Vuestro plan propone acercar ese colchón a lo recomendado. El cómo se ve con vuestro asesor.
- Escrito por el LLM: q, siente

### 3. Pagáis 450 $ al mes a la tarjeta. ¿Cuánto de eso se va en intereses?

- Dato del plan: **374 $** de cada 450 $, en intereses (mala noticia)
- Origen: `profile.liabilities · key_metrics.debtManagement.creditCardDebt`. Cuenta nuestra: 374 $ de 450 $, redondeado a décimas
- Si acierta: «Lo teníais claro. Mirad a dónde se va.»
- Si el dato es mayor de lo que dijo: «Son {dif} más al mes de lo que pensabais.»
- Si es menor: «Menos de lo que temíais. Aun así, mirad a dónde se va.»
- Para que lo sienta: De cada **450 $** que pagáis, **374 $** son intereses. La deuda casi no baja. Así dura hasta **enero de 2034**.
- Salida: Vuestro plan la señala como vuestra deuda más cara. Cómo subir el pago se ve con vuestro asesor.
- Escrito por el LLM: q

### 4. ¿Os llega para jubilaros a los 62 y 60 y vivir de ello?

- Dato del plan: **Sí, llega** y al final del plan quedan 260.272 $ (buena noticia)
- Origen: `key_metrics.facts.retirement`
- Si acierta: «Eso es. Llegáis.»
- Si el dato es mayor de lo que dijo: «Mejor de lo que pensabais.»
- Si es menor: «Llegáis, aunque con menos margen del que creíais.»
- Para que lo sienta: Sí: la proyección llega y al final quedan **260.272 $**. Eso os da un pequeño colchón para imprevistos y algo de tranquilidad en la jubilación.
- Salida: Aquí no hay que correr. Lo que frena vuestro plan está en otra parte.
- Escrito por el LLM: q, siente

Preguntas posibles que no se usan en este caso: Nota de salud financiera (52 de 100, hoy); Año en que se acaba la tarjeta (enero de 2034 pagando 450 $ al mes).

## Pasos del plan

| Paso | Quién | Nota tras el paso (solo) |
|---|---|---|
| Subir el seguro de vida | Con el asesor | 57 |
| Seguro extra de responsabilidad civil | Con el asesor | 56 |
| Ahorrar 15.032 $ más al año | La familia | 55 |

Combinaciones que trae el plan: Subir el seguro de vida + Seguro extra de responsabilidad civil = 60; Subir el seguro de vida + Ahorrar 15.032 $ más al año = 60; Subir el seguro de vida + Ahorrar 15.032 $ más al año + Seguro extra de responsabilidad civil = 60; Ahorrar 15.032 $ más al año + Seguro extra de responsabilidad civil = 59.

## De hoy a la jubilación

- Hoy: Nota 52
- Paso 1: Subir el seguro de vida
- Paso 2: Seguro extra de responsabilidad civil
- Paso 3: Ahorrar 15.032 $ más al año
- 2033: Universidad de Oliver
- 2034: Sin cambios, la tarjeta dura hasta aquí (Oliver, 19 · Sophia, 17)
- 2035: Universidad de Sophia
- 2044: Jubilación (Los ahorros llegan hasta el final)

## Para el asesor

- ¿Y si uno de los dos cambia de trabajo, qué pasa con los seguros?
- ¿Y si priorizamos seguro de vida frente a ahorrar más?

## Respuesta completa del LLM

```json
{
  "lectura": "A Daniel y Emily les mueve ante todo proteger a los niños y tener colchón líquido. Les preocupa cuánto cubren los seguros y cuánto aguanta su efectivo antes de tocarlo.",
  "orden": [
    "vida",
    "colchon",
    "tarjeta_interes",
    "jubilacion"
  ],
  "porque_orden": "Empezamos por la protección, luego la liquidez, el coste de la deuda y cerramos con la noticia sobre la jubilación.",
  "frases": [
    "Nos importa proteger a Oliver y a Sophia",
    "Queremos tener efectivo para imprevistos",
    "Nos molesta pagar tanto en intereses",
    "Que lleguemos tranquilos a la jubilación"
  ],
  "ganancias": [
    "Dormiríamos más tranquilos por la noche",
    "Tendríamos margen para un imprevisto",
    "Pagaríamos menos en intereses",
    "Podríamos disfrutar la jubilación"
  ],
  "abiertas": [
    "¿Y si uno de los dos cambia de trabajo, qué pasa con los seguros?",
    "¿Y si priorizamos seguro de vida frente a ahorrar más?"
  ],
  "preguntas": {
    "vida": {
      "q": "Si a uno de los dos le pasara algo, ¿cuántos años de gastos de casa tendrían cubiertos Oliver (11) y Sophia (9)?",
      "cerca": "Lo habíais calculado bien",
      "mas": "Son {dif} años más de lo que dijisteis",
      "menos": "Menos años de los que pensabais",
      "siente": "Hoy tenéis cubiertos unos **3 años** de gastos de casa. Con eso, Oliver, con 11 años, estaría protegido hasta los 14; a Sophia le quedaría parte de su infancia cubierta.",
      "salida": "Subir el seguro de vida"
    },
    "colchon": {
      "q": "Si mañana os quedarais sin ingresos, ¿cuántos meses de gastos básicos cubre vuestro efectivo?",
      "cerca": "Lo sospechabais",
      "mas": "Son {dif} meses más que dijisteis",
      "menos": "Menos meses de lo que pensabais",
      "siente": "El efectivo accesible solo cubre **1,4 meses** de gastos básicos. Con esa cifra, una parada de ingresos os dejaría expuestos y complicaría la vacación prevista.",
      "salida": "Seguro extra de responsabilidad civil"
    },
    "tarjeta_interes": {
      "q": "Pagáis 450 $ al mes a la tarjeta. ¿Cuánto de eso se va en intereses?",
      "cerca": "Lo notabais en los pagos",
      "mas": "Son {dif} $ más al mes de lo que dijisteis",
      "menos": "Menos de lo que imaginabais",
      "siente": "De los 450 $ que pagáis cada mes, **374 $** van a intereses. Así la deuda apenas baja y el coste del crédito pesa mucho en vuestra liquidez.",
      "salida": "Seguro extra de responsabilidad civil"
    },
    "jubilacion": {
      "q": "¿Os llega para jubilaros a los 62 y 60 y vivir de ello?",
      "cerca": "Lo teníais claro",
      "mas": "Mejor de lo que pensabais: {dif}",
      "menos": "Peor de lo que pensabais: {dif}",
      "siente": "Sí: la proyección llega y al final quedan **260.272 $**. Eso os da un pequeño colchón para imprevistos y algo de tranquilidad en la jubilación.",
      "salida": "Subir el seguro de vida"
    }
  }
}
```
