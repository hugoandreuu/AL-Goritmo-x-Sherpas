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
    dict(tipo='texto', id='gancho', dur=5.5, lineas=[
        '# Pagan 300 $ al mes a la tarjeta.',
        '## ¿Cuánto se va en intereses?',
    ]),
    dict(tipo='movil', id='gancho2', etiqueta='FAMILIA WEAH · MODO PAREJA', escalonado=True, partes=[
        dict(clip=('pareja', 'rev_dinero', 0.8, 6.8, 0.9), pos='der', zoom=1.05, texto=[
            '# Timothy creía 100 $.', '# Melanie, 190 $.', '!! Su plan dice: 270 $.',
            'De cada 300 $, casi todo se va en intereses.']),
    ]),
    dict(tipo='titulo', id='titulo', dur=2.4),
    dict(tipo='movil', id='reto', etiqueta='EL RETO', partes=[
        dict(clip=('pareja', 'landing', 0.4, 3.4, 1.0), pos='izq', texto=[
            '# Un plan lleno de cifras', '# se lee una vez…', '## y se olvida.']),
        dict(clip=('pareja', 'intro', 0.0, 2.2, 0.85), pos='izq', texto=[
            '# 4 minutos con su plan,', '## antes de la reunión.']),
    ]),
    dict(tipo='movil', id='pareja', etiqueta='MODO PAREJA', partes=[
        dict(clip=('pareja', 't_q1', 1.7, 3.4, 1.0), pos='izq', texto=[
            '# Cada uno contesta', '## en privado.', 'Sin que la opinión de uno influya en la del otro.']),
        dict(clip=('pareja', 't_q1', 3.4, 5.9, 1.2), pos='izq', texto=[
            '# Timothy contesta…', '## y lo guarda en secreto.']),
        dict(clip=('pareja', 'handoff', 1.5, 3.5, 0.75), pos='der', paso=1.0, pase=True, texto=[
            '# Se pasan el móvil…']),
        dict(clip=('pareja', 'm_start', 1.6, 3.6, 0.8), pos='der', texto=[
            '# …y ahora contesta Melanie.', 'Las respuestas de Timothy quedan ocultas.']),
        dict(clip=('pareja', 'rev_riesgo', 0.0, 3.6, 0.95), pos='centro', paso=0.9, zoom=1.06, texto=[
            '# Lo destapan', '## juntos.'], texto2=['# Aquí, los dos', '## acertaron.']),
        dict(clip=('pareja', 'rev_hijos', 0.4, 4.7, 0.95), pos='der', zoom=1.1, texto=[
            '# Creían que el seguro', '# cubría hasta los 19 años', '!! de Liam. Son 8.']),
        dict(clip=('pareja', 'rev_nota', 0.5, 3.3, 1.0), pos='izq', zoom=1.06, texto=[
            '# Y su nota de salud', '## financiera: 60 de 100.', 'Lo que más la baja: los seguros.']),
    ]),
    dict(tipo='movil', id='reunion', etiqueta='LA REUNIÓN', partes=[
        dict(clip=('pareja', 'propone', 0.2, 3.5, 0.8), pos='izq', zoom=1.12, texto=[
            '# Al final, lo que', '## propone su plan…', 'De 60 a 78 puntos, paso a paso.']),
        dict(clip=('pareja', 'reunion', 2.9, 4.7, 1.1), pos='der', texto=[
            '# …y piden la reunión', '## con su asesor.', 'Eligen el día y lo confirman los dos.']),
        dict(clip=('pareja', 'pedida', 0.0, 1.4, 1.0), pos='der'),
    ]),
    dict(tipo='asesor', id='asesor', dur=7.4, etiqueta='Y AL OTRO LADO…', lineas=[
        '# Esto es lo que', '## recibe el asesor.',
        'La familia no ve esta ficha.', 'Llega a la reunión con lo que creían,', 'lo que les preocupa y lo que quieren', 'preguntar. Sin preparar nada.']),
    dict(tipo='familias', id='familias', dur=4.2, titulo='Funciona con cualquier plan de Sherpas.',
         sub='Probado con las 4 familias del reto: parejas, personas solas, con hijos.'),
    dict(tipo='cierre', id='cierre', dur=6.2),
]

# Voz en off: (bloque, segundos desde que empieza el bloque, archivo en video/voz/, subtítulo).
VOZ = [
    ('gancho', 0.15, '01.mp3', 'Los Weah pagan 300 $ al mes de tarjeta. Les preguntamos cuánto se va en intereses.'),
    ('gancho2', 2.3, '02.mp3', 'Son 270 $. Ninguno de los dos lo sabía.'),
    ('reto', 0.3, '08.mp3', 'Un plan lleno de cifras se lee una vez… y se olvida.'),
    ('pareja', 0.2, '03.mp3', 'Cada uno contesta en secreto, en el mismo móvil. Luego lo descubren juntos.'),
    ('pareja', 13.0, '04.mp3', 'Creían que su seguro cubría a Liam hasta los 19. Le cubre hasta los 8.'),
    ('reunion', 0.15, '05.mp3', 'Su plan de Sherpas, paso a paso: de 60 a 78.'),
    ('reunion', 4.2, '06.mp3', 'Y piden la reunión.'),
    ('asesor', 1.2, '09.mp3', 'Y el asesor llega sabiendo qué creían y qué les preocupa.'),
    ('familias', 0.4, '10.mp3', 'Y funciona con cualquier plan de Sherpas.'),
    ('cierre', 0.6, '07.mp3', 'Vuestro plan de futuro. Del PDF a la conversación.'),
]

# Golpes de cámara (acercamiento rápido + destello suave) en los momentos clave: (bloque, segundos desde su inicio).
GOLPES = [('gancho2', 2.3), ('pareja', 13.0), ('reunion', 0.3)]

TITULO = dict(antes='AL-GORITMO  ×  SHERPAS', nombre=('Vuestro', 'plan de futuro'),
              sub='El plan de cada familia, contado para que se entienda.')
CIERRE = dict(sub=None,
              frase=('Os ayudamos a entender vuestro plan…', 'y a dar el primer paso para cumplirlo.'),
              enlace='hugoandreuu.github.io/AL-Goritmo-x-Sherpas',
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
