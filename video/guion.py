# Guion del vídeo de presentación.
#
# Para cambiar textos, tiempos, el orden de los bloques o dónde está el móvil, edita esta lista y vuelve a montar:
#     python3 video/construir.py --sin-grabar      (no vuelve a grabar la web; tarda unos 5 minutos)
#
# Cada bloque es un dict con «tipo»:
#   'texto'    Solo texto centrado sobre el fondo. Claves: dur, lineas, paso (segundos entre líneas, 0.9 por defecto).
#   'titulo'   Nombre del producto. Claves: dur.
#   'movil'    El móvil con una grabación de la web. Claves: etiqueta, partes.
#   'familias' Las portadas de las 4 familias en fila. Claves: dur, titulo, sub.
#   'asesor'   La ficha que recibe el asesor (datos en FICHA_ASESOR). Claves: dur, etiqueta, lineas.
#   'cierre'   Cierre con el enlace (textos en CIERRE). Claves: dur.
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
    # Gancho: el móvil desde el primer segundo, con la pregunta que se hace la familia Weah.
    dict(tipo='movil', id='gancho', etiqueta='FAMILIA WEAH', partes=[
        dict(clip=('pareja', 't_q2', 0.2, 3.4, 1.0), pos='der', texto=[
            '# Pagan 300 $ al mes', '# a la tarjeta.', '## ¿Cuánto se va en intereses?']),
    ]),
    dict(tipo='movil', id='gancho2', etiqueta='FAMILIA WEAH · LO QUE CREÍAN', escalonado=True, partes=[
        dict(clip=('pareja', 'rev_dinero', 0.8, 6.6, 0.9), pos='der', zoom=1.05, texto=[
            '# Timothy creía 100 $.', '# Melanie, 190 $.'],
            # la cifra real sale de la pantalla del móvil
            cifra=dict(txt='270 $', t=1.5, y=640, antes='Su plan dice:', sub='De cada 300 $, casi todo son intereses.')),
    ]),
    dict(tipo='titulo', id='titulo', dur=3.2),
    dict(tipo='movil', id='reto', etiqueta='EL RETO', partes=[
        dict(clip=('pareja', 'landing', 0.4, 3.2, 1.0), pos='izq', texto=[
            '# Muchas familias no saben', '# si van bien con su dinero.', 'Su plan está lleno de cifras: se lee una vez y se olvida.']),
        dict(clip=('pareja', 'intro', 0.0, 2.8, 0.85), pos='izq', texto=[
            '# Un quiz de 5 minutos', '# con su propio plan,', '## que se adapta a cada uno.']),
    ]),
    dict(tipo='movil', id='quiz', etiqueta='01 · EL QUIZ', partes=[
        dict(clip=('michael', 'q0', 0.2, 3.6, 1.0), pos='der', texto=[
            '# Primero, lo que les', '## quita el sueño.', 'Con sus palabras, o con la voz.']),
        dict(clip=('michael', 'q1', 0.3, 5.5, 1.1), pos='der', zoom=1.06, texto=[
            '# Luego estiman cifras', '## de su propio plan.', 'Michael estima que su efectivo cubre 6 meses…']),
        dict(clip=('michael', 'rev1', 0.0, 6.0, 0.95), pos='izq', texto=[
            '# Y ven el dato real,', '## de forma que se entiende.', 'La huella que deja en su economía, en una imagen.', 'Ninguna cifra se inventa: todas salen de su plan.']),
        dict(clip=('michael', 'rev1', 6.0, 10.6, 0.95), pos='izq', texto=[
            '# Reaccionan, y sus dudas', '## van al cuaderno del asesor.', '«Me preocupa» también es información:', 'llegan a la reunión sabiendo de qué hablar.']),
    ]),
    dict(tipo='movil', id='pareja', etiqueta='02 · MODO PAREJA', partes=[
        dict(clip=('pareja', 'intro', 0.0, 2.5, 0.85), pos='izq', tinte='morado', texto=[
            '# Cada uno contesta', '## en privado.', 'Sin que la opinión de uno influya en la del otro.']),
        dict(clip=('pareja', 't_q1', 1.8, 6.4, 1.3), pos='izq', tinte='azul', texto=[
            '# Timothy contesta…', '## y lo guarda en secreto.', 'Lo que le preocupa solo lo verá el asesor.']),
        # pase de mano: la pantalla coral de «Turno de Melanie» se abre hasta llenar el encuadre
        dict(clip=('pareja', 'handoff', 0.0, 2.1, 1.0), pos='der', paso=1.3, pase=True, tinte='coral', texto=[
            '# Se pasan el móvil…']),
        dict(clip=('pareja', 'm_q2', 0.0, 3.6, 1.0), pos='der', tinte='coral', texto=[
            '# …y ahora contesta Melanie.', 'Las respuestas de Timothy quedan ocultas:', 'las dos visiones pesan lo mismo.']),
        dict(clip=('pareja', 'rev_riesgo', 0.0, 5.0, 0.95), pos='centro', paso=0.9, tinte='morado', texto=[
            '# Lo destapan', '## juntos.'], texto2=[
            'Cada uno ve el dato real', 'y saca sus conclusiones.', 'Después, las ponen en común.']),
        dict(clip=('pareja', 'rev_hijos', 0.0, 4.6, 1.0), pos='der', tinte='morado', zoom=1.04, texto=[
            '# Creían que el seguro cubría', '# hasta los 19 años de Liam.'],
            cifra=dict(txt='8 años', t=0.6, y=540, antes='Su plan dice:', sub='Es hasta donde llega hoy.')),
        dict(clip=('pareja', 'rev_nota', 0.0, 4.0, 1.0), pos='izq', tinte='morado', texto=[
            '# Y su nota de salud', '## financiera.'],
            cifra=dict(txt='60/100', t=0.6, y=540, color='lila', sub='Lo que más la baja: los seguros.')),
    ]),
    dict(tipo='movil', id='camino', etiqueta='03 · SU CAMINO', partes=[
        dict(clip=('michael', 'camino', 0.4, 9.8, 1.3), pos='der', texto=[
            '# De hoy a la jubilación,', '## paso a paso.', 'Cada paso del plan sube su nota:', 'de 26 hoy a 62 con el plan completo.']),
        dict(clip=('michael', 'informe', 0.0, 2.6, 1.0), pos=(1360, 540, -2, 0.94), texto=[
            '# Y todo se pliega', '## en su informe.']),
    ]),
    dict(tipo='movil', id='informe', etiqueta='04 · EL INFORME', partes=[
        dict(clip=('informe', 'top', 2.6, 9.4, 1.15), pos='izq', texto=[
            '# 11 puntos, de lo', '## más urgente', '# a lo que está bien.', 'De un informe denso a tarjetas', 'visuales que se entienden.']),
        dict(clip=('informe', 'tap', 0.0, 8.5, 1.15), pos='izq', zoom=1.07, texto=[
            '# Cada tarjeta se toca', '## y se abre entera.', 'Sus cifras, gráficas y los pasos del plan,', 'que votan con «¿Os convence?».']),
    ]),
    dict(tipo='movil', id='ruleta', etiqueta='05 · EL RESUMEN', partes=[
        dict(clip=('story', 'open', -8.4, 0.6, 1.35), pos='der', texto=[
            '# Su plan en una', '## ruleta de tarjetas.', 'La nota y las cinco áreas, de un vistazo.', 'Se gira con el dedo, y cada tarjeta se abre.']),
    ]),
    dict(tipo='familias', id='familias', dur=3.6, titulo='Funciona con cualquier plan de Sherpas.',
         sub='Probado con las 4 familias del reto: parejas, personas solas, con hijos.'),
    dict(tipo='movil', id='reunion', etiqueta='06 · LA REUNIÓN', partes=[
        dict(clip=('pareja', 'propone', 0.2, 3.4, 1.0), pos='izq', texto=[
            '# Al final, lo que', '## propone su plan…', 'De 60 a 78 puntos, paso a paso.']),
        dict(clip=('pareja', 'reunion', 0.0, 4.8, 1.3), pos='der', texto=[
            '# …y piden la reunión', '## con su asesor.', 'Eligen el día y lo confirman los dos.']),
        dict(clip=('pareja', 'pedida', 0.0, 1.4, 1.0), pos='der'),  # se corta antes de la lista «lo que vuestro asesor ya sabe»
    ]),
    # Las respuestas salen del móvil de la familia y rellenan la ficha del asesor.
    dict(tipo='asesor', id='asesor', dur=9.0, etiqueta='Y AL OTRO LADO…', lineas=[
        '# Esto es lo que', '## recibe el asesor.',
        'La familia no ve esta ficha. El asesor llega sabiendo', 'lo que creían, lo que les preocupa y qué quieren preguntar.']),
    dict(tipo='cierre', id='cierre', dur=6.0),
]

TITULO = dict(antes='AL-GORITMO  ×  SHERPAS', nombre=('Vuestro', 'plan de futuro'),
              sub='El plan de cada familia, contado para que se entienda.')
CIERRE = dict(sub='Del plan en PDF a una conversación con el asesor.',
              frase=('Os ayudamos a entender vuestro plan…', 'y a dar el primer paso para cumplirlo.'),
              enlace='hugoandreuu.github.io/AL-Goritmo-x-Sherpas',
              firma='Equipo AL-Goritmo · Hackathon UPV × Sherpas')

# Datos de la ficha del asesor: son los que la web genera para Weah con las respuestas de la grabación.
FICHA_ASESOR = dict(
    familia='Familia Weah · Timothy y Melanie',
    reunion='Reunión pedida: viernes 20 nov · 13:00',
    movil=('pareja', 'pedida', 1.0),   # pantalla del móvil de la familia de la que salen las fichas
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

# Capítulos que se encienden como paradas en la línea de vida de abajo: (id del bloque, nombre).
CAPITULOS = [('quiz', 'Quiz'), ('pareja', 'Pareja'), ('camino', 'Camino'), ('informe', 'Informe'), ('ruleta', 'Resumen'), ('reunion', 'Reunión')]

# Música: en qué bloques entra el golpe del título, sube el ritmo, baja para la ficha y cierra.
MUSICA = dict(golpe='titulo', subida='pareja', pausa='asesor', final='cierre')
