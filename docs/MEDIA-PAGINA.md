# Vuestro plan de futuro

Equipo **AL-Goritmo** (Hugo Andreu, Álex Cabanes y Daniel Torres Bursik) · reto «Bring the plan to life» de Sherpas · hackathon UPV, noviembre de 2026.

Cuando una familia recibe su plan de Sherpas, tiene delante todas las cifras que importan, pero solo puede leerlas. Timothy y Melanie Weah, por ejemplo, pagan 300 $ al mes de tarjeta y 270 $ se les van en intereses, y su seguro de vida cubriría unos dos años de gastos de casa si a uno de los dos le pasara algo. El plan lo dice, pero nadie les ha preguntado qué creían ellos, y lo más probable es que cada uno crea una cosa distinta.

Por eso hemos construido una web para móvil que la familia recibe antes de su primera reunión con el asesor. En lugar de enseñarles el plan, se lo pregunta. Primero estiman una cifra de su propia situación y luego ven el dato real, acompañado de una imagen, de una frase que lo hace sentir y del paso del plan que lo arregla. Partimos de una idea sencilla: un dato que has intentado adivinar se entiende y se recuerda mucho mejor que uno que solo has leído.

Si el plan es de una pareja, la app tiene un modo pensado para los dos. Cada uno contesta en privado en el mismo móvil: qué cree sobre su dinero, qué haría si sus inversiones cayeran como en su peor momento real y qué cree que haría el otro. Después lo destapan juntos y lo comparan entre ellos y con su plan, sin ganadores ni perdedores. Lo hicimos así porque casi la mitad de las parejas no coinciden en a qué edad quieren jubilarse (Fidelity, 2021). Descubrir en qué piensan distinto engancha y hace que la experiencia sea personal para cada uno.

Al final, la familia ve lo que propone su plan paso a paso y cuánto mejora su nota de salud financiera con cada uno (los Weah pasarían de 60 a 78 sobre 100). La app termina pidiendo la reunión. El asesor no se sustituye: recibe lo que creía cada uno, lo que les preocupa y lo que quieren preguntar, y la familia llega a la cita entendiendo su plan. Quien no sabe de finanzas lo entiende con palabras sencillas, y quien sí sabe puede activar el modo experto para ver el detalle técnico y de dónde sale cada cifra.

La app sirve para cualquier plan de Sherpas, no solo para uno. Un script lee los datos de cada familia a través del MCP de Sherpas, y el LLM de Sherpas decide qué preguntar, en qué orden y con qué palabras. Las cifras las saca siempre el código, nunca la IA, y cualquier frase que lleve un número que no esté en el plan se descarta. Ya funciona con las cuatro familias del reto.

Por el camino descartamos varias ideas. Un chat no aportaba, porque Sherpas ya tiene uno y una familia que no entiende su plan no sabe qué preguntar. Los puntos y las medallas trivializaban decisiones serias. Los simuladores con escenarios propios nos obligaban a inventar cifras, y un servidor con bot e IA en directo era demasiado para enseñarlo en dos minutos sin riesgo. Lo que la app no hace nunca es inventar una cifra, mover dinero, pedir datos bancarios ni presionar con cuentas atrás.

Demo: https://hugoandreuu.github.io/AL-Goritmo-x-Sherpas/
