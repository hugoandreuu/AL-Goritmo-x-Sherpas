# Cobertura: qué datos del estudio previo enseña la app

El resumen tras el quiz y el plan completo son ahora **la nota general, los 5 temas y el roadmap**. Cada tarjeta enseña un resumen breve; al tocarla se abre a fondo con todas sus cifras y un gráfico. Todas las cifras salen del plan de cada familia (`financial-health` e `investment-analysis`, lo mismo que sirve el MCP de Sherpas y lo mismo que pinta el informe en PDF). Ninguna se escribe a mano: las lee `scripts/estudio.mjs` (función `leerTemas`) y cada fila guarda su origen, que se ve en modo "Sabemos de finanzas".

## De dónde salen los datos

| Familia | financial-health | investment-analysis | persona | Informe PDF (estudio previo) |
|---|---|---|---|---|
| Timothy y Melanie Weah | sí | sí | sí | sí |
| Daniel y Emily Johnson | sí | sí | sí | sí |
| Michael Carter | sí | sí | sí | sí |
| Samantha Lewis | sí | sí | sí | **no hay `report.pdf` en `cases/`** |

Los estudios de este cambio se han generado con los archivos de `cases/`, que son los mismos JSON que sirve el MCP. Para regenerarlos directamente del MCP hace falta `MCP_TOKEN` en `.env` (`npm run estudio`); el script avisa si la nota del MCP no coincide con la del archivo.

## Sección del informe → tarjeta de la app

| Informe | Tarjeta | Qué cifras enseña |
|---|---|---|
| Summary | Nota general | Nota, banda, las 5 áreas con sus puntos, nota con cada paso y con las combinaciones del plan |
| Savings & Expenses | Ahorro | Sueldos, ingresos, gastos, ahorro y su %, aportación de la empresa, a dónde va cada dólar (impuestos, deudas, vivienda, ahorro, gastos), lo que sobra al año, percentil de ingresos |
| Debt management | Deudas | Cada deuda con saldo, interés, pago e intereses al mes; deuda total y pago mensual; deuda/ingresos, con vivienda y vivienda/ingresos; fin de la tarjeta; fecha sin deudas |
| Assets & Investments + Investment Analysis | Inversiones | Perfiles de riesgo, patrimonio total y neto, reparto por tipo de activo, % en bolsa de lo invertido, reparto actual y propuesto, rentabilidad esperada y volatilidad actual y propuesta, sector con más peso, rentabilidad 1 y 3 años, peor caída y recuperación, comportamiento en crisis pasadas |
| Insurance & Protection · Emergency fund | Colchón | Efectivo accesible, gastos básicos, meses cubiertos, reserva recomendada, gastos ya previstos, efectivo total que pide el plan, sobrante o faltante, lo que rinde el efectivo y lo que podría rendir |
| Insurance & Protection · Life, Umbrella | Seguros | Vida de cada adulto frente al rango recomendado y lo que falta, responsabilidad civil, todas las pólizas, quién depende de esos ingresos |
| Retirement & Goals | Roadmap | Jubilación (año y edades), metas (casa, coche, vacaciones, universidad), gasto e ingresos en la jubilación, retirada media, ahorro extra que pide, universidad por hijo (inicio, ahorrado, falta), patrimonio hoy y al jubilarse, gráfico del patrimonio hasta el final del plan e hitos |

## Lo que todavía no sale en la app

Son datos del informe que quedan fuera a propósito o pendientes. Si alguno tiene que estar, se añade igual que los demás.

- **Impuestos y cuentas**: margen de aportación a Roth IRA y 401(k), ahorro fiscal estimado y el coste fiscal de fondos concretos (por ejemplo, mover JNK). Es materia del asesor.
- **Posiciones concretas**: fondos uno a uno, el ETF apalancado UPRO de Timothy Weah, reparto geográfico.
- **Años con flujo de caja negativo** y metas después de la jubilación (por ejemplo, 673.481 $ en el caso Weah): están en el texto del informe, no en un campo del plan; habría que calcularlos desde `projections`.
- **Textos del informe** ("We should look into…"): están en inglés; la app enseña las cifras, no esas frases.
