# Cobertura: qué enseña la app del informe de Sherpas

El resumen tras el quiz y el plan completo son **la nota general, los 5 temas y el roadmap**. Cada tarjeta enseña un resumen breve; al tocarla se abre la página del tema. Todo sale del plan de cada familia (`financial-health` e `investment-analysis`): lo mismo que sirve el MCP de Sherpas y lo mismo que pinta el informe en PDF. Las cifras las lee `scripts/estudio.mjs` (funciones `leerTemas` y `leerInforme`) y cada fila guarda su origen, que se ve en modo "Sabemos de finanzas".

## Cómo está organizada cada página de tema

Tres niveles, de lo que tiene que ver todo el mundo a lo que es para quien quiera ir a fondo:

1. **A la vista**: cifras clave, desglose con su gráfico, "Qué significa", los pasos del plan y la frase para el asesor. En "Qué significa" entran también los mensajes del informe que cambian lo que la familia debería hacer o preguntar (por ejemplo, "no aportáis nada a vuestro 401(k)" en Johnson o "seguiréis pagando deudas después de jubilaros").
2. **Desplegable "Lo que dice el informe"**: la sección del informe con su misma estructura: el texto del informe en castellano, tablas con las cifras que no caben a la vista y, al final, "Lo que revisaría tu asesor" (el "We should look into" del informe).
3. **Desplegable "Todas las cifras de este tema"**: cada cifra con su origen.

La **nota general** termina con "Lo que recomienda el informe" (las recomendaciones finales, a la vista) y dos desplegables con los resúmenes del informe: el de salud financiera y el del análisis de inversiones. En el plan completo hay un desplegable con esas mismas recomendaciones.

## De dónde salen los datos

| Familia | financial-health | investment-analysis | persona | Informe PDF | Texto del informe en castellano |
|---|---|---|---|---|---|
| Timothy y Melanie Weah | sí | sí | sí | sí | sí |
| Daniel y Emily Johnson | sí | sí | sí | sí | sí |
| Michael Carter | sí | sí | sí | sí | sí |
| Samantha Lewis | sí | sí | sí | **no hay `report.pdf` en `cases/`** | sí (sale del mismo JSON) |

El texto del informe es el campo `narrative` de los dos JSON, en inglés. Su traducción está en `scripts/informe-es/<caso>.json` (ver el README de esa carpeta). Al generar el estudio, el script comprueba que toda cifra de la traducción esté en el original y que no se pierda ninguna; si Sherpas cambia el texto, descarta la traducción y avisa.

## Sección del informe → página de la app

| Informe | Página | A la vista | En "Lo que dice el informe" |
|---|---|---|---|
| Summary (las dos partes) | Nota general | Nota, banda, las 5 áreas, nota con cada paso y combinaciones, **las recomendaciones del informe** | El resumen de salud financiera y el del análisis de inversiones |
| Savings & Expenses | Ahorro | Ingresos, ahorro (con lo que pone la empresa), lo que sobra o falta, a dónde va cada dólar (sin la aportación de la empresa, que va aparte), 401(k) sin aportaciones | Texto de la sección; cada partida (impuesto federal, estatal, FICA, alquiler o hipoteca, cada cuenta de ahorro, cada deuda); saldo y aportación de cada cuenta; margen en cuentas con ventaja fiscal (401(k), IRA Roth, HSA, 529) y los impuestos que ahorraría; lo que revisaría el asesor |
| Debt management | Deudas | Cada deuda, deuda total y pago, ratios, fin de la tarjeta, fecha sin deudas y aviso si se acaban después de la jubilación | Texto de la sección; deuda total sobre ingresos; umbrales de los bancos (36, 43 y 50 %); alquiler o hipoteca y otros gastos de vivienda; lo que es vuestro de la casa; lo que revisaría el asesor |
| Assets & Investments | Inversiones | Patrimonio, % en bolsa **frente al objetivo del plan** (el mismo cálculo que el informe: sin el efectivo de las cuentas), reparto actual y propuesto, fondos apalancados | Texto de la sección y lo que revisaría el asesor |
| Investment Analysis (todas sus secciones) | Inversiones | — | Foto de la cartera y cada cuenta con su rentabilidad; qué debería hacer y qué está haciendo; comparación con una cartera parecida (rentabilidad, volatilidad, peor caída, Sharpe, subidas y bajadas que recoge, caída en cada episodio de 2023 a 2026); cómo le ha ido; lo que funciona; lo que hay que cambiar; cuentas de jubilación; HSA; reparto por tipo de activo hoy y propuesto; lo que recomienda; crisis reales con la cartera actual **y la propuesta**; concentración (sueldo, EE. UU., sectores) e impuestos |
| Insurance & Protection · Emergency fund | Colchón | Efectivo, meses, reserva, gastos previstos, lo que falta o sobra, lo que rinde | Introducción de la protección y texto del colchón |
| Insurance & Protection · Life, Umbrella | Seguros | Vida de cada adulto y lo que falta, responsabilidad civil, pólizas, quién depende | Texto de vida y de umbrella; lo que quedaría expuesto ante una demanda; bienes que los datos marcan sin seguro |
| Retirement & Goals | Roadmap | Jubilación, cobertura de ingresos, cuándo se acaban los ahorros, patrimonio al jubilarse (y lo líquido), **hueco de las cuentas de jubilación**, patrimonio al final | Texto de la sección; hueco, patrimonio y liquidez al jubilarse y al final, otras metas tras la jubilación, cuidados de larga duración (no incluidos); lo que revisaría el asesor |

## Diferencias que conviene conocer entre el PDF y los datos

- El PDF de cada caso es una foto de una fecha; los JSON (y el MCP) pueden ser más nuevos. En Michael Carter, la sección "What's working" del PDF habla de un flujo de caja que mejora en 6.600 $ y de un patrimonio que sube desde 203.500 $; el texto actual del JSON ya no lo dice. La app enseña el JSON.
- El propio informe redondea distinto en algún sitio: el reparto por tipo de activo y las crisis reales pueden diferir en una décima o un punto del PDF (la app redondea el dato tal cual).
- Johnson: el texto del análisis habla de "1.616.000 $ de cobertura añadida"; en los datos, el paso pide añadir 1.166.000 $ para llegar a 1.616.000 $ en total. La traducción dice "la meta es de unos 1.616.000 $ de cobertura" y el paso del plan enseña lo que hay que añadir.
- Weah: el informe dice que la tarjeta genera 270 $ de intereses "al año"; con 18.000 $ al 18 % son al mes. La traducción lo aclara entre paréntesis.
