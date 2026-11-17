# Decisiones

Qué hemos elegido, qué hemos descartado y por qué, del 12 al 17 de noviembre de 2026. Es el resumen de todo el trabajo previo; los documentos de entonces están en [docs/archivo/](../archivo/).

## La idea en una frase

Una web para móvil que la familia recibe **antes de la reunión con su asesor de Sherpas**, cuando todavía no es cliente. Primero adivina cifras de su propio plan y ve el dato real; después ve su camino hasta la jubilación y lo que propone el plan, y acaba pidiendo la reunión. Si el plan es de una pareja, cada uno contesta en privado en el mismo móvil y luego lo destapan juntos.

## Decidido

| Fecha | Decisión | Por qué |
|---|---|---|
| 12 nov | Mobile first, en español | Las familias leen el plan a ratos, en el móvil |
| 12 nov | Las cifras las saca el código del plan; la IA nunca calcula | El reto pide no inventar cifras |
| 13 nov | Bucle central: adivinar el dato, ver la cifra del plan y una frase que lo haga sentir, justo después de cada pregunta | Se entiende mejor el dato que se ha intentado adivinar que el que se lee. Gana a un formulario con resumen al final |
| 14 nov | La app **complementa al asesor**, no lo sustituye. Termina en pedir la reunión, y el asesor recibe lo que creían, lo que les preocupa y lo que quieren preguntar | Sherpas confirmó que el plan se comparte con personas que aún no son clientes y que el asesor resuelve las dudas. La app tiene que llevar a la reunión a una familia que entiende su plan y quiere seguir |
| 14 nov | Recorrido ordenado como un cuestionario de venta consultiva (SPIN: problema, implicación, beneficio). Detalle en [embudo.md](embudo.md) y [sesgos-por-pantalla.md](sesgos-por-pantalla.md) | Es la forma probada de que alguien vea un problema por sí mismo sin sentirse presionado |
| 14 nov | Web estática, sin servidores, bots ni IA en directo; lo contestado se guarda en el navegador | Tiene que funcionar en la demo sin depender de nada y caber en un pitch de dos minutos |
| 14 nov | Vale para **cualquier plan**, no solo uno. `npm run estudio` lee cada caso por el MCP de Sherpas y el LLM de Sherpas elige las preguntas y escribe las frases; un control tira toda frase con una cifra que no esté en el plan | Así se ve que la app escala a todas las familias y que el texto lo piensa el LLM a partir de sus datos |
| 14 nov | Urgencia solo con cifras del plan (por ejemplo, los intereses que se pagan al mes) | Nada de cuentas atrás ni escasez falsa: el jurado y un asesor regulado lo detectan al momento |
| 15 nov | **Modo pareja** con dos entradas en la portada (los dos juntos o uno solo). Cada uno contesta en privado y se compara entre sí y con el plan, en tono serio | Casi la mitad de las parejas no coinciden en a qué edad jubilarse (Fidelity, 2021). Que se descubran el uno al otro engancha y es personal para cada uno |
| 15 nov | Se descarta el tono de juego ("el impostor") en el modo pareja | Sherpas vende confianza; el juego restaba seriedad |
| 16 nov | La acción principal del cierre es **pedir la reunión**; el primer paso que pueden hacer solos (por ejemplo, pagar la tarjeta) queda como "antes de ir", con su recordatorio | Es lo que Sherpas necesita que pase. El primer paso sirve para llegar con algo hecho |
| 16 nov | Fuera las tablas de cifras tras cada dato y los botones de "ver más" que no aportaban | No entraban por los ojos y alargaban el recorrido |
| 16 nov | Colores sacados de la web de Sherpas | Que parezca algo que Sherpas podría enviar mañana |
| 17 nov | La barra de pasos del plan solo aparece desde el cierre, nunca durante las preguntas | En el quiz destripaba la nota antes de que la adivinaran |

## Descartado

| Qué | Por qué |
|---|---|
| Chat o asistente de voz libre | Sherpas ya tiene chat, la familia no sabe qué preguntar y un chat puntúa bajo en creatividad |
| La montaña o la expedición como metáfora principal | Es la metáfora obvia para una empresa llamada Sherpas |
| La llamada del "yo del futuro" | A parte del equipo le resultaba rara, puede molestar a alguien mayor o viudo y no nos fiamos de cifras dichas por una voz de IA |
| Simuladores con escenarios propios (casa sí o no) | El plan trae un solo escenario: habría que inventar cifras |
| Abrir con la nota más baja ("26, crítico") | Hace que la gente aparte la mirada |
| Puntos, medallas y ganadores | Trivializan decisiones serias |
| Servidor, bot de Telegram e IA en directo del plan inicial | Demasiado para entregar y para enseñar en dos minutos. El plan está en [archivo/planificacion](../archivo/planificacion/) |
| Un rediseño completo de la interfaz (15 nov, rama `ux-rediseno`) | El equipo prefirió seguir con el diseño propio de Dani |
| Un único panel final tipo app de crédito | Poco visual; se prefirió pulir las pantallas que ya había |

## Lo que no hacemos nunca

- Inventar una cifra. Si el plan no la trae, no sale.
- Mover dinero ni pedir datos bancarios.
- Presionar con escasez falsa, cuentas atrás o pruebas sociales inventadas.
