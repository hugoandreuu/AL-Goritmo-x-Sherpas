# Vuestro plan de futuro: qué hemos construido y por qué

Equipo **AL-Goritmo** · reto «Bring the plan to life» de Sherpas · hackathon UPV, noviembre de 2026.

**El problema.** El plan de Sherpas trae todas las cifras, pero solo se lee. Timothy y Melanie Weah pagan 300 $ al mes de tarjeta y 270 $ son intereses, y su seguro de vida cubre unos 2 años de gastos de casa. El plan lo dice, pero nadie les ha preguntado qué creían, y cada uno de los dos cree una cosa distinta.

**Qué hemos construido.** Una web para móvil que la familia recibe antes de su primera reunión con el asesor de Sherpas.

- **Estimar y ver el dato real.** La familia contesta cifras de su propio plan y ve el dato real con una imagen, una frase que lo hace sentir y el paso del plan que lo arregla.
- **Modo pareja.** Cada uno contesta en privado en el mismo móvil: el dato de dinero, qué haría ante la peor caída real de sus inversiones y qué cree que haría el otro. Después lo destapan juntos y lo comparan entre ellos y con el plan, sin ganadores.
- **Lo que propone el plan.** Ven los pasos con la nota que deja cada uno (los Weah pasan de 60 a 78) y acaban pidiendo la reunión. El asesor recibe lo que creía cada uno, lo que les preocupa y lo que quieren preguntar.
- **Novatos y expertos.** Con «Sabemos de finanzas» se ve el detalle técnico y de dónde sale cada cifra.
- **Vale para cualquier plan.** `npm run estudio` lee cada caso por el MCP de Sherpas. El LLM de Sherpas elige qué preguntar y en qué orden, y escribe las frases. El código saca las cifras y descarta cualquier frase con un número que no esté en el plan. Funciona con las 4 familias del reto.

**Por qué así.** Un dato que has intentado adivinar se entiende mejor que uno que solo lees. Casi la mitad de las parejas no coinciden en a qué edad jubilarse (Fidelity, 2021), así que descubrirse el uno al otro engancha y es personal para cada uno. La app no sustituye al asesor: lleva a la reunión a una familia que entiende su plan y sabe qué quiere preguntar.

**Qué descartamos.** Un chat (Sherpas ya tiene uno y la familia no sabe qué preguntar), la metáfora de la montaña (es la obvia para Sherpas), puntos y medallas (trivializan decisiones serias), simuladores con escenarios propios (obligan a inventar cifras) y un servidor con bot e IA en directo (demasiado para una demo de dos minutos).

**Lo que nunca hace.** Inventar una cifra, mover dinero, pedir datos bancarios ni presionar con cuentas atrás.

Demo: https://hugoandreuu.github.io/AL-Goritmo-x-Sherpas/ · Decisiones con fecha: [decisiones.md](brainstorming/decisiones.md)
