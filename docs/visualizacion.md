# Cómo dibujamos las gráficas del plan

Reglas que siguen todas las gráficas de la app (`graf`, `barrasHtml` y `svgLinea` en `app/app.js`) y de dónde salen.

## Qué gráfica para qué dato

| Dato | Forma | Por qué |
|---|---|---|
| Reparto de un total (a dónde va el sueldo, dónde está el patrimonio) | Barras horizontales sobre un eje común | Comparar longitudes desde una misma base es lo que el ojo hace con más precisión (Cleveland y McGill, 1984). Las barras horizontales dejan sitio a nombres largos en el móvil. Por eso no usamos tartas. |
| Lo que hay frente a un mínimo (seguros) | Barras con una marca vertical del mínimo | La distancia hasta la marca se ve sin hacer cuentas. |
| Un valor frente a un rango (colchón) | Una barra con la franja recomendada sombreada | Se ve de un vistazo si está dentro, por debajo o por encima. |
| Evolución en el tiempo (patrimonio, deuda) | Línea con eje de años y eje de dólares | El tiempo va en horizontal. Un único eje Y y nunca dos escalas en el mismo gráfico. |

## Reglas fijas

- **Ejes siempre visibles.** El eje de valor empieza en cero, con 4 o 5 marcas redondas (1, 2, 2,5 y 5 por potencias de 10) en formato corto: `250 K$`, `1,5 M$`.
- **Rejilla fina y discreta.** Son líneas de 1 px en gris claro, nunca discontinuas, y la línea del cero va un tono más oscura.
- **Textos uniformes.**
  - Nombres de 13 px en negrita.
  - Cifras de 13 px con números tabulares.
  - Ejes de 11,5 px en gris.
  - El título del gráfico es una frase normal, no va en mayúsculas.
  - Las líneas se dibujan al ancho real de la página para que el texto no se agrande ni encoja.
- **Nada se sale ni se corta.**
  - El nombre y la cifra van en una línea encima de su barra, nunca dentro.
  - Si un nombre no cabe, se acorta con puntos suspensivos y el nombre entero aparece al pasar el ratón.
  - El rótulo de un hito (jubilación, fin de la deuda) se encaja dentro del ancho del gráfico.
- **Un color por gráfico, salvo que el color signifique algo.** Si significa algo, lleva leyenda: naranja para "pago de deudas" o "por debajo del mínimo", verde para "ahorro" o "cubierto". Los textos nunca van en el color de la serie.
- **Cifras con moderación.**
  - Cada barra lleva su cifra porque son pocas.
  - En las líneas solo se rotula el hito y, debajo, el primer y el último año.
  - El resto de valores se ve al pasar el ratón o el dedo por la línea.
- **Accesibilidad.** Cada línea lleva un `aria-label` con el resumen, y el color nunca es el único indicador.

## Fuentes

- Cleveland, W. y McGill, R. (1984), *Graphical Perception*: estudio sobre qué comparaciones visuales leemos con más precisión.
- Tufte, E. (1983), *The Visual Display of Quantitative Information*: quitar la tinta que no es dato.
- Few, S. (2012), *Show Me the Numbers*: barras desde cero, rejilla discreta y no usar doble eje.
- Guía interna de visualización (skill `dataviz`): grosores de marca, rótulos selectivos, leyenda cuando hay color con significado y tooltip en las líneas.
