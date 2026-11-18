# Guion del vídeo de presentación.
#
# Para cambiar textos, tiempos, el orden de los bloques o dónde está el móvil, edita esta lista y vuelve a montar:
#     python3 video/construir.py --sin-grabar      (no vuelve a grabar la web; tarda unos 5 minutos)
#
# Cada bloque es un dict con «tipo»:
#   'texto'    Solo texto centrado sobre el fondo. Claves: dur, lineas.
#   'titulo'   Nombre del producto. Claves: dur.
#   'movil'    El móvil con una grabación de la web. Claves: etiqueta, partes.
#   'familias' Las portadas de las 4 familias en fila. Claves: dur, titulo, sub.
#   'asesor'   La ficha que recibe el asesor (datos en FICHA_ASESOR). Claves: dur, etiqueta, lineas.
#   'cierre'   Cierre con el enlace. Claves: dur.
#
# Cada parte de un bloque 'movil':
#   clip    = ('escena', 'marca', desde, hasta, velocidad)
#             escena y marca vienen de escenas.js; desde/hasta son segundos desde la marca; velocidad 1 = tiempo real.
#   pos     = dónde va el móvil: 'izq', 'der', 'centro' o (x, y, giro_en_grados, escala) en una pantalla de 1920x1080.
#   paso    = segundos que tarda el móvil en llegar a su sitio (por defecto 0.7).
#   pase    = True para el gesto de «pasar el móvil»: hace un arco y gira por el camino.
#   texto   = líneas que acompañan a esta parte; se ponen al lado libre de la pantalla.
#             Sin «texto», sigue el de la parte anterior. Con pos 'centro', «texto» va a la izquierda y «texto2» a la derecha.
#   zoom    = escala extra que gana el móvil durante la parte (p. ej. 1.08), para acercar un detalle.
#
# Formato de las líneas: '# Título'  ·  '## Título en degradado'  ·  '!! Título en naranja'  ·  sin prefijo: subtítulo.

SEGMENTOS = [
    dict(tipo='texto', id='gancho', dur=3.4, lineas=[
        '# Pagan 300 $ al mes a la tarjeta.',
        '## ¿Cuánto se va en intereses?',
    ]),
    dict(tipo='movil', id='gancho2', etiqueta='FAMILIA WEAH · MODO PAREJA', escalonado=True, partes=[
        dict(clip=('pareja', 'rev_dinero', 0.8, 6.6, 1.0), pos='der', texto=[
            '# Timothy creía 100 $.', '# Melanie, 190 $.', '!! Su plan dice: 270 $.', 'De cada 300 $, casi todo en intereses.']),
    ]),
    dict(tipo='titulo', id='titulo', dur=4.2),
    dict(tipo='movil', id='reto', etiqueta='EL RETO', partes=[
        dict(clip=('pareja', 'landing', 0.4, 3.6, 1.0), pos='izq', texto=[
            '# Un plan lleno de cifras', '# se lee una vez…', '## y se olvida.']),
        dict(clip=('pareja', 'intro', 0.0, 2.8, 1.0), pos='izq', texto=[
            '# 5 minutos de juego', '# antes de la reunión,', '## con su propio plan.']),
    ]),
    dict(tipo='movil', id='quiz', etiqueta='01 · EL QUIZ', partes=[
        dict(clip=('michael', 'q0', 0.0, 3.8, 1.0), pos='der', texto=[
            '# Primero, lo que les', '## quita el sueño.', 'Con sus palabras, o con la voz.']),
        dict(clip=('michael', 'q1', 0.3, 5.5, 1.0), pos='der', zoom=1.06, texto=[
            '# Luego adivinan cifras', '## de su propio plan.', 'Michael cree que su efectivo cubre 6 meses…']),
        dict(clip=('michael', 'rev1', 0.0, 6.0, 1.0), pos='izq', texto=[
            '# Y ven el dato real,', '## con una imagen.', 'Ninguna cifra se inventa: todas salen de su plan.']),
        dict(clip=('michael', 'rev1', 6.0, 11.4, 1.0), pos='izq', texto=[
            '# Reaccionan, y sus dudas', '## van al cuaderno del asesor.', '«Me preocupa» también es información.']),
    ]),
    dict(tipo='movil', id='pareja', etiqueta='02 · MODO PAREJA', partes=[
        dict(clip=('pareja', 'intro', 0.0, 1.8, 1.0), pos='izq', texto=[
            '# Cada uno contesta', '## en privado.', 'Un solo móvil. Sin ganadores ni culpables.']),
        dict(clip=('pareja', 't_q1', 1.8, 6.4, 1.15), pos='izq', texto=[
            '# Timothy contesta…', '## y lo guarda en secreto.', 'Lo que le preocupa solo lo verá el asesor.']),
        dict(clip=('pareja', 'handoff', 0.0, 2.4, 1.0), pos='der', paso=1.4, pase=True, texto=[
            '# Se pasan el móvil…']),
        dict(clip=('pareja', 'm_q2', 0.0, 3.6, 1.1), pos='der', texto=[
            '# …y ahora contesta Melanie.', 'Las respuestas de Timothy quedan ocultas.']),
        dict(clip=('pareja', 'rev_riesgo', 0.0, 5.0, 1.0), pos='centro', paso=0.9, texto=[
            '# Lo destapan', '## juntos.'], texto2=[
            '¿Sabe cada uno qué haría', 'el otro si la bolsa cae?', 'Aquí, los dos acertaron.']),
        dict(clip=('pareja', 'rev_hijos', 0.0, 4.6, 1.0), pos='der', texto=[
            '# Creían que el seguro', '# cubría hasta los 19 años', '!! de Liam. Son 8.']),
        dict(clip=('pareja', 'rev_nota', 0.0, 3.8, 1.0), pos='izq', texto=[
            '# Y su nota de salud', '## financiera: 60 de 100.', 'Lo que más la baja: los seguros.']),
    ]),
    dict(tipo='movil', id='camino', etiqueta='03 · SU CAMINO', partes=[
        dict(clip=('michael', 'camino', 0.0, 10.4, 1.05), pos='der', texto=[
            '# De hoy a la jubilación,', '## paso a paso.', 'Cada paso del plan sube su nota:', 'de 26 hoy a 62 con el plan completo.']),
        dict(clip=('michael', 'informe', 0.0, 2.6, 1.0), pos=(1360, 540, -2, 0.94), texto=[
            '# Y todo se pliega', '## en su informe.']),
    ]),
    dict(tipo='movil', id='informe', etiqueta='04 · EL INFORME', partes=[
        dict(clip=('informe', 'top', 2.6, 9.4, 1.15), pos='izq', texto=[
            '# 11 puntos, de lo', '## más urgente', '# a lo que está bien.', 'Urgente · Revisar pronto · Bien']),
        dict(clip=('informe', 'tap', 0.0, 8.5, 1.1), pos='izq', zoom=1.07, texto=[
            '# Cada tarjeta se toca', '## y se abre entera.', 'Sus cifras, gráficas y los pasos del plan,', 'que votan con «¿Os convence?».']),
    ]),
    dict(tipo='movil', id='ruleta', etiqueta='05 · EL RESUMEN', partes=[
        dict(clip=('story', 'top', 1.2, 9.4, 1.25), pos='der', texto=[
            '# Su plan en una', '## ruleta de tarjetas.', 'La nota y las cinco áreas, de un vistazo.', 'Se gira con el dedo.']),
        dict(clip=('story', 'open', 0.0, 9.0, 1.15), pos='centro', paso=0.9, texto=[
            '# Y cada tarjeta', '## lleva su detalle.'], texto2=[
            'Lo esencial, en gráfico', 'y lo que propone el plan,', 'sin tecnicismos.']),
    ]),
    dict(tipo='familias', id='familias', dur=5.2, titulo='Funciona con cualquier plan de Sherpas.',
         sub='Probado con las 4 familias del reto: parejas, personas solas, con hijos.'),
    dict(tipo='movil', id='reunion', etiqueta='06 · LA REUNIÓN', partes=[
        dict(clip=('pareja', 'propone', 0.2, 3.4, 1.0), pos='izq', texto=[
            '# Al final, lo que', '## propone su plan…', 'De 60 a 78 puntos, paso a paso.']),
        dict(clip=('pareja', 'reunion', 0.0, 4.8, 1.25), pos='der', texto=[
            '# …y piden la reunión', '## con su asesor.', 'Eligen el día y lo confirman los dos.']),
        dict(clip=('pareja', 'pedida', 0.0, 1.4, 1.0), pos='der'),  # se corta antes de la lista «lo que vuestro asesor ya sabe»
    ]),
    dict(tipo='asesor', id='asesor', dur=11.0, etiqueta='Y AL OTRO LADO…', lineas=[
        '# Esto es lo que', '## recibe el asesor.',
        'La familia no ve esta ficha.', 'Llega a la reunión con lo que creían,', 'lo que les preocupa y lo que quieren', 'preguntar. Sin preparar nada.']),
    dict(tipo='cierre', id='cierre', dur=6.0),
]

TITULO = dict(antes='AL-GORITMO  ×  SHERPAS', nombre=('Vuestro', 'plan de futuro'),
              sub='El plan de cada familia, contado para que se entienda.')
CIERRE = dict(sub='Del plan en PDF a una conversación con el asesor.',
              enlace='hugoar61108-ai.github.io/AL-Goritmo-x-Sherpas',
              firma='Equipo AL-Goritmo · Hackathon UPV × Sherpas')

# Datos de la ficha del asesor: son los que la web genera para Weah con las respuestas de la grabación.
FICHA_ASESOR = dict(
    familia='Familia Weah · Timothy y Melanie',
    reunion='Reunión pedida: viernes 20 nov · 13:00',
    filas=[
        ('Lo que les preocupa, con sus palabras', ['Timothy: «Que el colchón nos deje tranquilos»', 'Melanie: «Quiero que Liam y Josh estén cubiertos»']),
        ('Intereses de la tarjeta al mes', ['Timothy creía 100 $ · Melanie, 190 $ · Su plan: 270 $']),
        ('Seguro de vida', ['Creían que cubría hasta los 19 años de Liam · Su plan: hasta los 8']),
        ('Ante una caída del 9,2 %', ['Timothy: no tocaría nada · Melanie: vendería una parte']),
        ('Para ver en la reunión', ['Subir el seguro de vida · Responsabilidad civil · Revisar perfil de riesgo']),
    ],
)

# Escena y marcas de las portadas de las familias (bloque 'familias').
FAMILIAS = ('familias', ['timothy-melanie-weah', 'daniel-emily-johnson', 'michael-carter', 'samantha-lewis'], 2.8)

# Música: en qué bloques entra el golpe del título, sube el ritmo, baja para la ficha y cierra.
MUSICA = dict(golpe='titulo', subida='pareja', pausa='asesor', final='cierre')
