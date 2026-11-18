"""Monta el vídeo a partir de guion.py y de las grabaciones de .grabaciones/.

No hace falta tocar este archivo para cambiar textos u orden: eso está en guion.py.
Uso: python3 video/motor.py [salida.mp4] [--muestras]
  --muestras  no monta el vídeo: guarda un fotograma de cada parte en .muestras/ para revisar rápido.
"""
import bisect, functools, json, math, os, subprocess, sys, urllib.request, re
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import guion as G

W, H, FPS = 1920, 1080, 30
GRAB = os.path.join(AQUI, '.grabaciones')
FUENTES = os.path.join(AQUI, '.fuentes')

# ---------------------------------------------------------------- fuentes (Google Fonts, se bajan una vez)
def bajar_fuentes():
    os.makedirs(FUENTES, exist_ok=True)
    for fam, pesos in (('Poppins', (400, 500, 600, 700, 800)), ('Inter', (500, 600))):
        falta = [p for p in pesos if not os.path.exists(os.path.join(FUENTES, f'{fam}-{p}.ttf'))]
        if not falta: continue
        try: css = urllib.request.urlopen(f'https://fonts.googleapis.com/css2?family={fam}:wght@{";".join(map(str, pesos))}').read().decode()
        except Exception as e: sys.exit(f'No se han podido bajar las fuentes ({e}). Copia los .ttf de {fam} a {FUENTES} como {fam}-<peso>.ttf.')
        for peso, url in re.findall(r'font-weight: (\d+);\s*src: url\((\S+?\.ttf)\)', css):
            urllib.request.urlretrieve(url, os.path.join(FUENTES, f'{fam}-{peso}.ttf'))
bajar_fuentes()

@functools.lru_cache(None)
def fuente(fam, peso, tam):
    return ImageFont.truetype(os.path.join(FUENTES, f'{fam}-{peso}.ttf'), tam)

BLANCO = (255, 255, 255); SUAVE = (196, 190, 235); SEGUNDO = (214, 208, 246); LILA = (150, 140, 255); NARANJA = (255, 122, 61)
G1, G2 = (99, 125, 255), (176, 120, 255)

def suave(k):
    k = max(0.0, min(1.0, k)); return 1 - (1 - k) ** 3
def suave2(k):
    k = max(0.0, min(1.0, k)); return k * k * (3 - 2 * k)
def rampa(t, a, b):
    return suave((t - a) / (b - a)) if b > a else float(t >= a)

# ---------------------------------------------------------------- grabaciones
class Grabacion:
    def __init__(self, escena):
        d = json.load(open(os.path.join(GRAB, escena, 'frames.json')))
        self.dir = os.path.join(GRAB, escena)
        self.fr = d['frames']; self.ts = [f[0] for f in self.fr]
        self.marcas = {m: t for t, m in d['marks']}
    def en(self, marca, seg):
        t = self.marcas[marca] + seg
        i = max(0, bisect.bisect_right(self.ts, t) - 1)
        return os.path.join(self.dir, self.fr[i][1])

@functools.lru_cache(None)
def grabacion(escena): return Grabacion(escena)

# ---------------------------------------------------------------- fondo
def hacer_fondo():
    bw, bh = W + 160, H + 100
    bg = Image.new('RGB', (bw, bh), (11, 9, 30))
    glow = Image.new('RGB', (bw, bh), (0, 0, 0)); d = ImageDraw.Draw(glow)
    d.ellipse((1100, -200, 2100, 800), fill=(62, 44, 150))
    d.ellipse((-300, 500, 800, 1400), fill=(30, 42, 130))
    d.ellipse((700, 300, 1400, 900), fill=(35, 25, 90))
    return ImageChops.add(bg, glow.filter(ImageFilter.GaussianBlur(220)))
FONDO = hacer_fondo()
def fondo(t):
    ox = int(80 + 70 * math.sin(t * 0.13)); oy = int(50 + 40 * math.cos(t * 0.11))
    return FONDO.crop((ox, oy, ox + W, oy + H)).convert('RGBA')

# ---------------------------------------------------------------- móvil
SW, SH, BZ = 414, 896, 14
PW, PH = SW + 2 * BZ, SH + 2 * BZ
def hacer_movil():
    ph = Image.new('RGBA', (PW, PH), (0, 0, 0, 0)); d = ImageDraw.Draw(ph)
    d.rounded_rectangle((0, 0, PW - 1, PH - 1), 62, fill=(22, 20, 34, 255), outline=(90, 86, 120, 255), width=2)
    d.rounded_rectangle((BZ, BZ, BZ + SW - 1, BZ + SH - 1), 48, fill=(0, 0, 0, 0))
    m = Image.new('L', (SW, SH), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, SW - 1, SH - 1), 48, fill=255)
    return ph, m
MARCO, MASCARA = hacer_movil()

@functools.lru_cache(maxsize=96)
def pantalla(ruta):
    return Image.open(ruta).convert('RGB').resize((SW, SH), Image.BICUBIC)

def pintar_movil(cv, ruta, x, y, giro=0.0, escala=1.0, alfa=1.0, ancho=1.0):
    """ruta: fotograma de una grabación (o una imagen ya hecha). ancho < 1 estrecha el móvil, para el giro sobre sí mismo."""
    if alfa <= 0.01: return
    ph = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
    ph.paste(ruta if isinstance(ruta, Image.Image) else pantalla(ruta), (BZ, BZ), MASCARA); ph.alpha_composite(MARCO)
    if ancho < 0.999: ph = ph.resize((max(2, round(PW * ancho)), PH), Image.BICUBIC)
    if abs(escala - 1) > 0.002: ph = ph.resize((round(PW * escala), round(PH * escala)), Image.BICUBIC)
    if abs(giro) > 0.05: ph = ph.rotate(giro, resample=Image.BICUBIC, expand=True)
    sombra = Image.new('RGBA', (ph.width + 160, ph.height + 160), (0, 0, 0, 0))
    sombra.paste((0, 0, 0, 160), (80, 110), ph.getchannel('A'))
    sombra = sombra.resize((sombra.width // 4, sombra.height // 4)).filter(ImageFilter.GaussianBlur(9)).resize(sombra.size)
    if alfa < 1:
        for im in (ph, sombra): im.putalpha(im.getchannel('A').point(lambda v: int(v * alfa)))
    cv.alpha_composite(sombra, (int(x - sombra.width / 2), int(y - ph.height / 2 - 80)))
    cv.alpha_composite(ph, (int(x - ph.width / 2), int(y - ph.height / 2)))

# ---------------------------------------------------------------- logo de Sherpas (arriba a la derecha, todo el vídeo)
# sherpas-logo.png es assets/brand/sherpas-logo.svg pasado a PNG blanco con fondo transparente.
_LOGO = Image.open(os.path.join(AQUI, 'sherpas-logo.png')).convert('RGBA')
LOGO = _LOGO.resize((round(_LOGO.width * 36 / _LOGO.height), 36), Image.LANCZOS)
def poner_logo(cv, T):
    a = 0.9 * rampa(T, 0.2, 0.9)
    if a <= 0.01: return
    im = LOGO.copy(); im.putalpha(im.getchannel('A').point(lambda v: int(v * a)))
    cv.alpha_composite(im, (W - 72 - im.width, 52))

POS = {'izq': (560, 540, -3.0, 0.94), 'der': (1360, 540, 3.0, 0.94), 'centro': (960, 560, 0.0, 0.84)}
def pos(p): return POS[p] if isinstance(p, str) else tuple(float(v) for v in p)

# ---------------------------------------------------------------- texto
def estilo(linea, grande=False):
    h = 64 if grande else 56
    if linea.startswith('## '): return linea[3:], ('Poppins', 700, h), 'grad'
    if linea.startswith('!! '): return linea[3:], ('Poppins', 700, h), NARANJA
    if linea.startswith('# '): return linea[2:], ('Poppins', 700, h), BLANCO
    return linea, ('Poppins', 500, 34 if grande else 32), SEGUNDO  # texto secundario: misma familia, más fino; legible en un móvil

@functools.lru_cache(maxsize=512)
def imagen_texto(filas, centrado=False):
    """filas: tupla de (texto, (fam, peso, tam), color)."""
    medidas = [(t, fuente(*f), f, c, fuente(*f).getbbox(t)[2] if t else 0) for t, f, c in filas]
    ancho = max(m[4] for m in medidas) + 20
    alto = sum(int(m[2][2] * 1.18) for m in medidas) + 30 + 18 * len(medidas)
    im = Image.new('RGBA', (ancho, alto), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    y, previa = 0, None
    for t, f, fk, c, tw in medidas:
        if previa and previa[1] >= 700 and fk[1] < 600 and previa[2] >= 50: y += 18
        previa = fk
        x = (ancho - tw) // 2 if centrado else 0
        if c == 'grad':
            m = Image.new('L', im.size, 0); ImageDraw.Draw(m).text((x, y), t, font=f, fill=255)
            g = Image.linear_gradient('L').rotate(90).resize((max(1, tw), im.height))
            capa = Image.new('RGBA', im.size, (0, 0, 0, 0))
            col = Image.merge('RGB', [g.point(lambda v, i=i: int(G2[i] + (G1[i] - G2[i]) * v / 255)) for i in range(3)])
            relleno = Image.new('RGB', im.size, G2); relleno.paste(col, (x, 0))
            capa = relleno.convert('RGBA'); capa.putalpha(m); im.alpha_composite(capa)
        else:
            d.text((x, y), t, font=f, fill=c)
        y += int(fk[2] * 1.18)
    return im

def rebote(k):  # sale un poco por encima y vuelve (solo para 2-3 momentos clave)
    k = max(0.0, min(1.0, k)); c = 1.9
    return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2

def poner(cv, filas, x, y, t, t0, t1, centrado=False, medio=False, sube=26):
    a = rampa(t, t0, t0 + 0.38) * (1 - rampa(t, t1 - 0.55, t1))
    if a <= 0.01: return
    im = imagen_texto(tuple(filas), centrado)
    dy = int((1 - rampa(t, t0, t0 + 0.7)) * sube)
    if a < 1: im = im.copy(); im.putalpha(im.getchannel('A').point(lambda v: int(v * a)))
    px = x - im.width // 2 if centrado else x
    py = (y - im.height // 2 if medio else y) + dy
    cv.alpha_composite(im, (int(px), int(py)))

def filas(lineas, grande=False): return [estilo(l, grande) for l in lineas]
def etiqueta(txt): return [(txt, ('Poppins', 600, 22), LILA)]

# ---------------------------------------------------------------- tinte del fondo (colores de la pareja en la web)
TINTES = {'azul': (70, 100, 255), 'coral': (214, 110, 70), 'morado': (140, 90, 255)}
def _mascara_tinte():
    m = Image.new('L', (W // 4, H // 4), 0)
    ImageDraw.Draw(m).ellipse((-W // 8, -H // 6, W // 4 + W // 8, H // 4 + H // 6), fill=255)
    return m.filter(ImageFilter.GaussianBlur(70)).resize((W, H), Image.BILINEAR)
MASCARA_TINTE = _mascara_tinte()
@functools.lru_cache(maxsize=64)
def capa_tinte(color, fuerza):
    c = Image.new('RGBA', (W, H), color + (255,))
    c.putalpha(MASCARA_TINTE.point(lambda v: int(v * fuerza / 100)))
    return c
def pintar_tinte(cv, color, fuerza):
    f = int(round(fuerza * 20)) * 5  # en pasos de 5 % para poder cachear
    if f > 0: cv.alpha_composite(capa_tinte(tuple(int(v) for v in color), f))
@functools.lru_cache(maxsize=64)
def capa_mitad(color, fuerza, lado):
    """Tinte solo en una mitad de la pantalla (pantalla partida del modo pareja)."""
    m = Image.new('L', (W // 4, H // 4), 0)
    x0 = 0 if lado == 'izq' else W // 8
    ImageDraw.Draw(m).rectangle((x0 - (40 if lado == 'izq' else 0), -40, x0 + W // 8 + (0 if lado == 'izq' else 40), H // 4 + 40), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(14)).resize((W, H), Image.BILINEAR)
    c = Image.new('RGBA', (W, H), color + (255,)); c.putalpha(m.point(lambda v: int(v * fuerza / 100)))
    return c
def pintar_mitad(cv, color, fuerza, lado):
    f = int(round(fuerza * 20)) * 5
    if f > 0: cv.alpha_composite(capa_mitad(tuple(int(v) for v in color), f, lado))
def mezcla(c1, c2, k): return tuple(c1[i] + (c2[i] - c1[i]) * k for i in range(3))

def barrido(cv, color, x, y, k):
    """La pantalla de «Turno de…» se abre desde el móvil hasta llenar el encuadre (k de 0 a 1) y luego se desvanece."""
    if k <= 0 or k >= 1: return
    r = 2300 * suave(min(1, k / 0.45)); a = 1 - suave2((k - 0.45) / 0.55) if k > 0.45 else 1
    m = Image.new('L', (W // 4, H // 4), 0)
    ImageDraw.Draw(m).ellipse(((x - r) / 4, (y - r) / 4, (x + r) / 4, (y + r) / 4), fill=int(235 * a))
    capa = Image.new('RGBA', (W, H), color + (255,)); capa.putalpha(m.resize((W, H), Image.BILINEAR))
    cv.alpha_composite(capa)

# ---------------------------------------------------------------- la cifra sale de la pantalla del móvil
@functools.lru_cache(maxsize=32)
def imagen_cifra(txt, color):
    f = fuente('Poppins', 800, 168)
    bb = f.getbbox(txt); w, h = bb[2] + 60, bb[3] + 60
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((30, 20), txt, font=f, fill=color + (255,))
    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0)); ImageDraw.Draw(glow).text((30, 20), txt, font=f, fill=color + (150,))
    glow = glow.filter(ImageFilter.GaussianBlur(26))
    glow.alpha_composite(im)
    return glow
def pintar_cifra(cv, c, t, t1, desde, hacia):
    k = suave((t - c['t']) / 0.85)
    if t < c['t']: return
    a = min(1.0, k * 1.6) * (1 - rampa(t, t1 - 0.4, t1))
    if a <= 0.01: return
    col = {'naranja': NARANJA, 'blanco': BLANCO, 'lila': (176, 150, 255)}[c.get('color', 'naranja')]
    im = imagen_cifra(contar([c['txt']], t, c['t'] - 0.15, 0.85)[0], col)   # {n:19-8} cuenta mientras vuela
    esc = 0.22 + 0.78 * k
    im = im.resize((max(1, int(im.width * esc)), max(1, int(im.height * esc))), Image.BICUBIC)
    x = desde[0] + (hacia[0] - desde[0]) * k; y = desde[1] + (hacia[1] - desde[1]) * k - 120 * math.sin(math.pi * k) * 0.5
    if a < 1: im.putalpha(im.getchannel('A').point(lambda v: int(v * a)))
    cv.alpha_composite(im, (int(x - 30 * esc), int(y)))
    if c.get('sub'): poner(cv, filas([c['sub']]), int(hacia[0]), int(hacia[1] + 228), t, c['t'] + 0.7, t1)
    if c.get('antes'): poner(cv, filas([c['antes']]), int(hacia[0]), int(hacia[1] - 30), t, c['t'] + 0.2, t1)

# ---------------------------------------------------------------- cifras que cuentan: «{n:60}» o «{n:26-62}» en un texto
def contar(lineas, t, t0, dur=0.9):
    k = suave((t - t0 - 0.15) / dur)
    def f(m):
        a, b = (int(m.group(1)), int(m.group(2))) if m.group(2) else (0, int(m.group(1)))
        return str(round(a + (b - a) * k))
    return [re.sub(r'\{n:(\d+)(?:-(\d+))?\}', f, l) for l in lineas]

# ---------------------------------------------------------------- piezas dibujadas
def capa(): return Image.new('RGBA', (W, H), (0, 0, 0, 0))
def con_alfa(im, a):
    if a >= 0.999: return im
    im = im.copy(); im.putalpha(im.getchannel('A').point(lambda v: int(v * a))); return im
def pastilla(txt, f, fondo, color, pad=(22, 10)):
    tw = f.getbbox(txt)[2]; th = f.size
    im = Image.new('RGBA', (tw + 2 * pad[0], int(th * 1.25) + 2 * pad[1]), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, im.width - 1, im.height - 1), im.height // 2, fill=fondo)
    d.text((pad[0], pad[1]), txt, font=f, fill=color); return im
def avatar(letra, color, r=26):
    im = Image.new('RGBA', (2 * r + 6, 2 * r + 6), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.ellipse((3, 3, 2 * r + 3, 2 * r + 3), fill=color, outline=BLANCO, width=3)
    d.text((r + 3, r + 3), letra, font=fuente('Poppins', 700, int(r * 1.05)), fill=BLANCO, anchor='mm'); return im
def candado(cv, x, y, a=1.0):
    im = pastilla('En privado', fuente('Poppins', 600, 22), (255, 255, 255, 235), (60, 50, 140))
    d = ImageDraw.Draw(im)
    cv.alpha_composite(con_alfa(im, a), (int(x - im.width / 2), int(y - im.height / 2)))

def pintar_barra(cv, t, B, x0, y0, ancho=800):
    """Barra 0..max con las marcas de lo que creía cada uno y, tras una pausa, la real (con cuenta y temblor)."""
    ts = B['t_real']; dx = 0
    if ts <= t < ts + 0.45: dx = 9 * math.sin((t - ts) * 70) * (1 - (t - ts) / 0.45)
    X = lambda v: x0 + dx + ancho * v / B['max']
    L = capa(); d = ImageDraw.Draw(L)
    a = rampa(t, 0.2, 0.6)
    d.rounded_rectangle((X(0), y0 - 7, X(B['max']), y0 + 7), 7, fill=(255, 255, 255, int(46 * a)))
    f = fuente('Poppins', 400, 24)
    for v in range(0, B['max'] + 1, 100):
        d.text((X(v), y0 + 30), f'{v} $', font=f, fill=SEGUNDO + (int(255 * a),), anchor='mt')
        d.line((X(v), y0 + 10, X(v), y0 + 20), fill=(255, 255, 255, int(90 * a)), width=2)
    # relleno naranja que crece con la cuenta
    kr = suave((t - ts) / 0.55) if t >= ts else 0
    if kr > 0:
        d.rounded_rectangle((X(0), y0 - 7, X(B['real'] * kr), y0 + 7), 7, fill=NARANJA + (235,))
    cv.alpha_composite(L)
    for letra, nombre, v, col, tm in B['marcas']:
        k = rampa(t, tm, tm + 0.45)
        if k <= 0: continue
        y = y0 - 260 * (1 - k)
        av = avatar(letra, col); cv.alpha_composite(con_alfa(av, k), (int(X(v) - av.width / 2), int(y - av.height / 2)))
        lab = imagen_texto(((f'{nombre} creía', ('Poppins', 400, 22), SEGUNDO), (f'{v} $', ('Poppins', 700, 30), BLANCO)), True)
        cv.alpha_composite(con_alfa(lab, k), (int(X(v) - lab.width / 2), int(y - 34 - lab.height)))
    if t >= ts:
        k = rebote((t - ts) / 0.5)
        n = round(B['real'] * suave((t - ts) / 0.55))
        L = capa(); d = ImageDraw.Draw(L)
        top = y0 - 70 * min(1, k)
        d.rounded_rectangle((X(B['real']) - 4, top, X(B['real']) + 4, y0 + 18), 4, fill=NARANJA + (255,))
        cv.alpha_composite(L)
        im = imagen_texto(((f'{n} $', ('Poppins', 700, 58), NARANJA),), True)
        sc = 0.6 + 0.4 * k
        im = im.resize((max(1, int(im.width * sc)), max(1, int(im.height * sc))), Image.BICUBIC)
        cv.alpha_composite(con_alfa(im, min(1, (t - ts) / 0.15)), (int(X(B['real']) - im.width / 2), int(top - im.height + 4)))

def chip_volando(cv, txt, p0, p1, k, pequeño=0.55):
    """Una duda que sale de un sitio y vuela en arco a otro, encogiendo."""
    if k <= 0 or k >= 1: return
    e = suave2(k); x = p0[0] + (p1[0] - p0[0]) * e; y = p0[1] + (p1[1] - p0[1]) * e - 160 * math.sin(math.pi * e)
    im = pastilla(txt, fuente('Poppins', 600, 26), (255, 255, 255, 245), (90, 70, 210))
    sc = 1 - (1 - pequeño) * e
    im = im.resize((int(im.width * sc), int(im.height * sc)), Image.BICUBIC)
    sh = Image.new('RGBA', (im.width + 40, im.height + 40), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((20, 26, 20 + im.width, 26 + im.height), im.height // 2, fill=(0, 0, 0, 90))
    cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)), (int(x - im.width / 2 - 20), int(y - im.height / 2 - 20)))
    cv.alpha_composite(con_alfa(im, min(1, (1 - k) / 0.12)), (int(x - im.width / 2), int(y - im.height / 2)))

def cuaderno(cv, x, y, n, t_pop, t, a):
    """Insignia «Cuaderno del asesor · n» que da un saltito cuando le llega una duda."""
    if a <= 0.01: return
    im = pastilla(f'Cuaderno del asesor  ·  {n}', fuente('Poppins', 600, 24), (124, 92, 255, 235), BLANCO, pad=(54, 12))
    d = ImageDraw.Draw(im); h = im.height
    d.rounded_rectangle((20, h // 2 - 11, 38, h // 2 + 11), 3, outline=BLANCO, width=3); d.line((25, h // 2 - 4, 33, h // 2 - 4), fill=BLANCO, width=2); d.line((25, h // 2 + 2, 33, h // 2 + 2), fill=BLANCO, width=2)
    sc = 1 + (0.16 * math.sin(math.pi * min(1, (t - t_pop) / 0.35)) if t >= t_pop else 0)
    if abs(sc - 1) > 0.002: im = im.resize((int(im.width * sc), int(im.height * sc)), Image.BICUBIC)
    cv.alpha_composite(con_alfa(im, a), (int(x), int(y - im.height / 2)))

# ---------------------------------------------------------------- bloques
class Bloque:
    def __init__(self, cfg): self.cfg = cfg; self.dur = cfg.get('dur', 0)
    def pintar(self, cv, t, estado): pass
    def efectos(self): return []   # [(segundo dentro del bloque, 'golpe' | 'tick' | 'whoosh')]

class Texto(Bloque):
    def pintar(self, cv, t, e):
        ls = self.cfg['lineas']; y0 = 490 - (len(ls) - 1) * 50; paso = self.cfg.get('paso', 0.9)
        for i, l in enumerate(ls):
            poner(cv, filas([l], True), W // 2, y0 + i * 100, t, 0.2 + i * paso, self.dur, centrado=True)

class Titulo(Bloque):
    def pintar(self, cv, t, e):
        T = G.TITULO
        poner(cv, etiqueta(T['antes']), W // 2, 380, t, 0.1, self.dur, centrado=True)
        poner(cv, [(T['nombre'][0], ('Poppins', 800, 110), BLANCO), (T['nombre'][1], ('Poppins', 800, 110), 'grad')], W // 2, 430, t, 0.3, self.dur, centrado=True)
        poner(cv, [(T['sub'], ('Poppins', 400, 33), SEGUNDO)], W // 2, 720, t, 1.0, self.dur, centrado=True)

@functools.lru_cache(maxsize=1)
def pantalla_qr():
    """Pantalla del móvil con el QR de la demo (demo-qr.png, hecho con la librería qrcode a partir de CIERRE['qr'])."""
    C = G.CIERRE; s = 2; w, h = SW * s, SH * s
    im = Image.new('RGB', (w, h), (246, 244, 255)); d = ImageDraw.Draw(im)
    d.text((w // 2, 150), 'Vuestro plan', font=fuente('Poppins', 700, 64), fill=(28, 20, 70), anchor='mm')
    d.text((w // 2, 230), 'de futuro', font=fuente('Poppins', 700, 64), fill=(124, 92, 255), anchor='mm')
    q = Image.open(os.path.join(AQUI, 'demo-qr.png')).convert('RGB'); qs = int(w * 0.84)
    q = q.resize((qs, qs), Image.NEAREST); qy = (h - qs) // 2 + 20
    d.rounded_rectangle(((w - qs) // 2 - 18, qy - 18, (w + qs) // 2 + 18, qy + qs + 18), 36, fill=(255, 255, 255), outline=(220, 214, 250), width=3)
    im.paste(q, ((w - qs) // 2, qy))
    d.text((w // 2, qy + qs + 100), C.get('qr_texto', ''), font=fuente('Poppins', 700, 46), fill=(28, 20, 70), anchor='mm')
    d.text((w // 2, qy + qs + 165), 'Demo con las 4 familias del reto', font=fuente('Poppins', 500, 32), fill=(110, 100, 150), anchor='mm')
    return im.resize((SW, SH), Image.LANCZOS)

class Cierre(Bloque):
    """Textos a la izquierda; el móvil de la familia entra, gira sobre sí mismo y su pantalla pasa a ser el QR de la demo."""
    T_GIRO = 1.5
    def efectos(self): return [(self.T_GIRO + 0.1, 'whoosh'), (self.T_GIRO + 0.6, 'golpe')]
    def pintar(self, cv, t, e):
        C, T = G.CIERRE, G.TITULO; fin = self.dur + 1; cx = 680
        poner(cv, [(T['nombre'][0], ('Poppins', 800, 92), BLANCO), (T['nombre'][1], ('Poppins', 800, 92), 'grad')], cx, 210, t, 0.2, fin, centrado=True)
        poner(cv, [(C['sub'], ('Poppins', 400, 32), SEGUNDO)], cx, 480, t, 0.9, fin, centrado=True)
        if C.get('frase'):
            k = rebote((t - 2.0) / 0.6)
            if t > 2.0:
                im = imagen_texto(tuple((l, ('Poppins', 700, 42), BLANCO if i == 0 else 'grad') for i, l in enumerate(C['frase'])), True)
                sc = 0.86 + 0.14 * k; im = im.resize((int(im.width * sc), int(im.height * sc)), Image.BICUBIC)
                cv.alpha_composite(con_alfa(im, min(1, (t - 2.0) / 0.3)), (cx - im.width // 2, 570 + int(48 * (1 - sc))))
        poner(cv, [(C['firma'], ('Poppins', 400, 24), LILA)], cx, 860, t, 2.9, fin, centrado=True)
        # el móvil entra desde abajo con la reunión pedida y gira hasta enseñar el QR
        ke = suave2(t / 0.8); x, y, s = 1400, 545 + (1 - ke) * 800, 0.98
        kg = (t - self.T_GIRO) / 0.7
        if kg <= 0: pant, an, g = grabacion('pareja').en('pedida', 1.0), 1.0, 3 * ke
        elif kg < 0.5: pant, an, g = grabacion('pareja').en('pedida', 1.0), math.cos(math.pi * kg), 3 * (1 - kg * 2)
        else: pant, an, g = pantalla_qr(), -math.cos(math.pi * min(1, kg)), 0.0
        pintar_movil(cv, pant, x, y - 30 * math.sin(math.pi * max(0, min(1, kg))), g, s, ancho=max(0.02, an))

class Familias(Bloque):
    def pintar(self, cv, t, e):
        esc, marcas, seg = G.FAMILIAS
        poner(cv, [(self.cfg['titulo'], ('Poppins', 700, 52), BLANCO)], W // 2, 85, t, 0.1, self.dur, centrado=True)
        poner(cv, [(self.cfg['sub'], ('Poppins', 400, 28), SEGUNDO)], W // 2, 170, t, 0.5, self.dur, centrado=True)
        fuera = 1 - rampa(t, self.dur - 0.4, self.dur)
        for i, m in enumerate(marcas):
            k = rampa(t, 0.2 + i * 0.15, 1.0 + i * 0.15)
            pintar_movil(cv, grabacion(esc).en(m, seg), 330 + i * 420, 655 + (1 - k) * 500, (-4, 2, -2, 4)[i] * k, 0.68, min(k, fuera) if k < 1 else fuera)

class Asesor(Bloque):
    def __init__(self, cfg):
        super().__init__(cfg); F = G.FICHA_ASESOR; cw = 1000; self.cw = cw
        cab = Image.new('RGBA', (cw, 130), (0, 0, 0, 0)); d = ImageDraw.Draw(cab)
        d.ellipse((40, 36, 100, 96), fill=(79, 107, 255)); d.text((70, 66), 'T', font=fuente('Poppins', 700, 28), fill=BLANCO, anchor='mm')
        d.ellipse((82, 36, 142, 96), fill=(201, 112, 62), outline=BLANCO, width=3); d.text((112, 66), 'M', font=fuente('Poppins', 700, 28), fill=BLANCO, anchor='mm')
        d.text((168, 30), F['familia'], font=fuente('Poppins', 700, 34), fill=(20, 18, 40))
        d.text((168, 78), F['reunion'], font=fuente('Inter', 500, 22), fill=(90, 86, 120))
        self.cab, self.filas = cab, []
        for lab, vals in F['filas']:
            h = 46 + 36 * len(vals) + 14
            r = Image.new('RGBA', (cw, h), (0, 0, 0, 0)); rd = ImageDraw.Draw(r)
            rd.rounded_rectangle((32, 0, cw - 33, h - 10), 18, fill=(244, 242, 252))
            rd.text((58, 14), lab.upper(), font=fuente('Inter', 600, 19), fill=(110, 96, 220))
            for j, v in enumerate(vals): rd.text((58, 44 + 36 * j), v, font=fuente('Inter', 500, 25), fill=(25, 22, 45))
            self.filas.append(r)
        self.ch = 130 + sum(r.height for r in self.filas) + 22
    def pintar(self, cv, t, e):
        """Las respuestas salen del móvil de la familia como fichas y van rellenando la ficha del asesor."""
        d = self.dur; F = G.FICHA_ASESOR
        fuera = 1 - rampa(t, d - 0.4, d)
        poner(cv, etiqueta(self.cfg['etiqueta']), 150, 92, t, 0.1, d)
        poner(cv, filas(self.cfg['lineas'][:2]), 150, 132, t, 0.3, d)
        poner(cv, filas(self.cfg['lineas'][2:]), 150, 905, t, 1.0, d)
        # móvil de la familia, a la izquierda
        km = rampa(t, 0.0, 0.8)
        px, py, ps = 330, 600 + (1 - km) * 700, 0.6
        esc, marca, seg = F['movil']
        pintar_movil(cv, grabacion(esc).en(marca, seg), px, py, -3 * km, ps, fuera)
        # ficha
        k = rampa(t, 0.5, 1.2); a = min(k, fuera)
        x0, y0 = 820, (H - self.ch) // 2 + int((1 - k) * 80)
        card = Image.new('RGBA', (self.cw, self.ch), (0, 0, 0, 0))
        ImageDraw.Draw(card).rounded_rectangle((0, 0, self.cw - 1, self.ch - 1), 30, fill=(255, 255, 255, 255))
        card.alpha_composite(self.cab, (0, 0)); y = 130
        llegadas = []
        for i, r in enumerate(self.filas):
            sale, llega = 1.3 + i * 0.85, 1.3 + i * 0.85 + 0.7
            ai = rampa(t, llega - 0.05, llega + 0.35)
            if ai > 0.01:
                rr = r.copy(); rr.putalpha(rr.getchannel('A').point(lambda v: int(v * ai))); card.alpha_composite(rr, (0, y))
            llegadas.append((sale, llega, y, F['filas'][i][0]))
            y += r.height
        sh = Image.new('RGBA', (self.cw + 160, self.ch + 160), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((80, 110, 80 + self.cw, 110 + self.ch), 30, fill=(0, 0, 0, int(150 * a)))
        cv.alpha_composite(sh.filter(ImageFilter.GaussianBlur(36)), (x0 - 80, y0 - 80))
        if a < 1: card.putalpha(card.getchannel('A').point(lambda v: int(v * a)))
        cv.alpha_composite(card, (x0, y0))
        bt = 'Ficha del asesor'; f = fuente('Inter', 600, 22); tw = f.getbbox(bt)[2]
        bd = Image.new('RGBA', (tw + 40, 44), (0, 0, 0, 0)); bdd = ImageDraw.Draw(bd)
        bdd.rounded_rectangle((0, 0, tw + 39, 43), 22, fill=(124, 92, 255, int(255 * a))); bdd.text((20, 9), bt, font=f, fill=(255, 255, 255, int(255 * a)))
        cv.alpha_composite(bd, (x0 + self.cw - tw - 70, y0 - 22))
        # fichas en vuelo
        for sale, llega, ry, lab in llegadas:
            if not (sale <= t <= llega + 0.15): continue
            kk = suave2((t - sale) / (llega - sale))
            chip = imagen_chip(lab)
            sx, sy = px + 20, py - 120
            ex, ey = x0 + 40, y0 + ry + 4
            cx = sx + (ex - sx) * kk; cy = sy + (ey - sy) * kk - 140 * math.sin(math.pi * kk)
            c2 = chip if t <= llega else chip.copy()
            if t > llega: c2.putalpha(c2.getchannel('A').point(lambda v: int(v * (1 - (t - llega) / 0.15))))
            cv.alpha_composite(c2, (int(cx), int(cy)))

@functools.lru_cache(maxsize=16)
def imagen_chip(txt):
    f = fuente('Poppins', 600, 20); tw = f.getbbox(txt)[2]
    im = Image.new('RGBA', (tw + 44, 46), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, tw + 43, 45), 23, fill=(124, 92, 255, 255), outline=(255, 255, 255, 200), width=2)
    d.text((22, 10), txt, font=f, fill=(255, 255, 255, 255))
    return im

Asesor.efectos = lambda self: [(1.3 + i * 0.85 + 0.7, 'tick') for i in range(len(self.filas))]

class Duo(Bloque):
    """Modo pareja en pantalla partida: cada uno en su móvil, separados por una línea; al final se juntan en uno."""
    def __init__(self, cfg):
        super().__init__(cfg); self.fases = []; t = 0.0
        for f in cfg['fases']:
            a, b, vel = f['clip'][2:]; d = (b - a) / vel
            self.fases.append(dict(f, t0=t, t1=t + d)); t += d
        self.t_junta = t; self.dur = t + cfg.get('junta', 1.1)
        self.fin = POS['centro']
    def efectos(self): return [(self.t_junta + 0.1, 'whoosh'), (0.1, 'whoosh')]
    def pintar(self, cv, t, e):
        PL, PR = (560, 620, -2.0, 0.74), (1360, 620, 2.0, 0.74)
        f = next((x for x in self.fases if t < x['t1']), self.fases[-1])
        lado = f['lado']; esc, marca, a, b, vel = f['clip']
        vivo = grabacion(esc).en(marca, a + max(0, min(t, f['t1']) - f['t0']) * vel)
        quieto = grabacion(f['quieto'][0]).en(f['quieto'][1], f['quieto'][2])
        izq, der = (vivo, quieto) if lado == 'izq' else (quieto, vivo)
        kin = suave2(t / 0.7)                                   # entran desde abajo
        kj = suave2((t - self.t_junta) / (self.dur - self.t_junta))  # se juntan
        if kj > 0:  # el de la derecha pasa a mostrar la revelación conjunta
            der = grabacion(self.cfg['juntos'][0]).en(self.cfg['juntos'][1], 0.0) if kj > 0.45 else der
        # colores de la pareja: Timothy en azul a la izquierda, Melanie en coral a la derecha; al juntarse, morado
        ti = rampa(t, 0.0, 0.8) * (1 - kj)
        w = rampa(t, self.fases[-1]['t0'] - 0.3, self.fases[-1]['t0'] + 0.5)   # el color «activo» pasa de un lado a otro
        f_izq = 0.5 - 0.32 * w; f_der = 0.18 + 0.32 * w
        pintar_mitad(cv, TINTES['azul'], f_izq * ti, 'izq'); pintar_mitad(cv, TINTES['coral'], f_der * ti, 'der')
        if kj > 0: pintar_tinte(cv, TINTES['morado'], 0.55 * kj)
        def mover(P, kin, kj):
            x, y, g, s = P; cx, cy, cg, cs = self.fin
            y += (1 - kin) * 800
            return x + (cx - x) * kj, y + (cy - y) * kj, g + (cg - g) * kj, s + (cs - s) * kj
        lin = (1 - kj) * rampa(t, 0.3, 0.9)
        if lin > 0.01:
            L = capa(); d = ImageDraw.Draw(L)
            for yy in range(270, 1010, 26): d.line((960, yy, 960, yy + 13), fill=(255, 255, 255, int(110 * lin)), width=3)
            cv.alpha_composite(L)
        xl = mover(PL, kin, kj); xr = mover(PR, kin, kj)
        act_izq = 1.0 if lado == 'izq' else 0.5; act_der = 1.0 if lado == 'der' else 0.5
        pintar_movil(cv, izq, *xl, alfa=act_izq * (1 - kj))
        pintar_movil(cv, der, *xr, alfa=act_der + (1 - act_der) * kj)
        if kj < 0.3:
            candado(cv, xl[0] if lado == 'der' else xr[0], 620, (1 - kj / 0.3) * rampa(t, 0.4, 0.8))
        # textos arriba, en el centro
        for i, fz in enumerate(self.fases):
            t1 = fz['t1'] if i < len(self.fases) - 1 else self.t_junta + 0.4
            poner(cv, etiqueta(self.cfg['etiqueta']), W // 2, 92, t, fz['t0'] + 0.1, t1, centrado=True)
            poner(cv, filas(fz['texto'][:1]), W // 2, 128, t, fz['t0'] + 0.2, t1, centrado=True)
            poner(cv, filas(fz['texto'][1:]), W // 2, 200, t, fz['t0'] + 0.5, t1, centrado=True)

class Movil(Bloque):
    """Móvil con grabaciones. Su posición inicial es la final del bloque móvil anterior, si lo hay."""
    def __init__(self, cfg, previo, siguiente_es_movil):
        super().__init__(cfg)
        self.partes = []
        t = 0.0
        for p in cfg['partes']:
            esc, marca, a, b, vel = p['clip']
            d = (b - a) / vel
            self.partes.append(dict(p, t0=t, t1=t + d, dur=d, destino=pos(p['pos'])))
            t += d
        self.dur = t
        self.ef = []
        for p in self.partes:
            if p.get('barra'):
                B = p['barra']; self.ef += [(p['t0'] + m[4] + 0.42, 'tick') for m in B['marcas']] + [(p['t0'] + B['t_real'], 'golpe')]
            if p.get('vuela'): self.ef += [(p['t0'] + p['vuela']['t'] + 0.7, 'tick')]
            if p.get('golpe') is not None: self.ef += [(p['t0'] + p['golpe'], 'golpe')]
            if p.get('pase'): self.ef += [(p['t0'] + 0.1, 'whoosh')]
        self.previo = previo          # posición (x, y, giro, escala) de donde viene, o None si entra
        self.sale = not siguiente_es_movil
        # bloques de texto: una parte sin «texto» alarga el bloque anterior
        self.textos = []
        antes = previo
        for p in self.partes:
            if 'texto' in p or not self.textos:
                # si el móvil cruza la pantalla, el texto espera a que deje libre su lado
                cruza = antes is not None and abs(antes[0] - p['destino'][0]) > 200
                espera = p.get('paso', 0.7) * 0.8 if cruza else 0.0
                self.textos.append(dict(t0=p['t0'] + espera, t1=p['t1'], texto=p.get('texto', []), texto2=p.get('texto2'), destino=p['destino'], barra=p.get('barra')))
            else:
                self.textos[-1]['t1'] = p['t1']
            antes = p['destino']
    def estado_movil(self, t):
        ini = self.previo
        for i, p in enumerate(self.partes):
            if t < p['t1'] or i == len(self.partes) - 1:
                break
            ini = p['destino']
        dest = p['destino']
        if ini is None:  # entra desde abajo
            ini = (dest[0], dest[1] + 800, dest[2] - 8, dest[3])
        k = suave2((t - p['t0']) / p.get('paso', 0.7)) if p['t0'] <= t else 0
        x = ini[0] + (dest[0] - ini[0]) * k; y = ini[1] + (dest[1] - ini[1]) * k
        g = ini[2] + (dest[2] - ini[2]) * k; s = ini[3] + (dest[3] - ini[3]) * k
        if p.get('pase'):
            arco = math.sin(math.pi * k)
            y -= 90 * arco; g += 14 * arco * (1 if dest[0] > ini[0] else -1); s *= 1 + 0.06 * arco
        if p.get('zoom'):
            s *= 1 + (p['zoom'] - 1) * suave2((t - p['t0'] - 0.4) / max(0.5, p['dur'] - 0.8))
        if self.sale:
            ks = suave2((t - (self.dur - 0.55)) / 0.55)
            y += 900 * ks * ks
        return p, (x, y, g, s)
    def tinte(self, t):
        """Color y fuerza del tinte del fondo: cada parte puede llevar tinte='azul'|'coral'|'morado'."""
        prev_c, prev_f = (TINTES[self.cfg['tinte_entrada']], 1.0) if self.cfg.get('tinte_entrada') else (TINTES['morado'], 0.0)
        for i, p in enumerate(self.partes):
            c = TINTES.get(p.get('tinte'), prev_c); f = 1.0 if p.get('tinte') else 0.0
            if t < p['t1'] or i == len(self.partes) - 1:
                k = suave2((t - p['t0']) / 0.8)
                if self.sale: f *= 1 - rampa(t, self.dur - 0.6, self.dur)
                return mezcla(prev_c, c, k), prev_f + (f - prev_f) * k
            prev_c, prev_f = c, f
    def pintar(self, cv, t, e):
        tc, tf = self.tinte(t)
        pintar_tinte(cv, tc, 0.55 * tf)
        p, (x, y, g, s) = self.estado_movil(min(t, self.dur - 1e-3))
        if p.get('pase') and p.get('tinte'):
            barrido(cv, TINTES[p['tinte']], x, y, (t - p['t0']) / (p.get('paso', 0.7) + 0.6))
        esc, marca, a, b, vel = p['clip']
        ruta = grabacion(esc).en(marca, a + max(0, t - p['t0']) * vel)
        pintar_movil(cv, ruta, x, y, g, s)
        if p.get('cifra'):
            c = p['cifra']; col = 150 if p['destino'][0] > 960 else 1020
            pintar_cifra(cv, c, t - p['t0'], p['dur'], (x - 120 * s, y - 200 * s), (col, c.get('y', 560)))
        # una duda que sale del móvil y vuela al cuaderno del asesor
        for q in self.partes:
            v = q.get('vuela')
            if not v or not (q['t0'] <= t < q['t1'] + (0 if q is self.partes[-1] else 0)): continue
            tl = t - q['t0']; col = 150 if q['destino'][0] > 960 else 1020
            cuaderno(cv, col, v['y'], 1 if tl >= v['t'] + 0.7 else 0, v['t'] + 0.7, tl, rampa(tl, 0.5, 0.9) * (1 - rampa(t, q['t1'] - 0.5, q['t1'])))
            chip_volando(cv, v['txt'], (q['destino'][0] + v.get('dx', 0), q['destino'][1] + v.get('dy', 220)), (col + 170, v['y']), (tl - v['t']) / 0.7)
        for i, tb in enumerate(self.textos):
            t0 = tb['t0'] + (0.15 if i else 0.25); t1 = tb['t1'] if i < len(self.textos) - 1 else self.dur
            dx = tb['destino'][0]
            tb = dict(tb, texto=contar(tb['texto'], t, t0), texto2=contar(tb['texto2'], t, t0 + 0.4) if tb['texto2'] else None)
            if tb['texto2'] is not None or abs(dx - 960) < 120:     # móvil en el centro: texto a los dos lados
                izq_x, izq_w = 110, 0
                poner(cv, etiqueta(self.cfg['etiqueta']), izq_x, 380, t, t0 - 0.1, t1)
                poner(cv, filas(tb['texto']), izq_x, 430, t, t0, t1)
                if tb['texto2']: poner(cv, filas(tb['texto2']), 1250, 470, t, t0 + 0.4, t1)
                continue
            col = 150 if dx > 960 else 1020
            if tb.get('barra'):   # titular, barra con lo que creían y lo real, y la explicación debajo
                B = tb['barra']; tl = t - tb['t0']; a = 1 - rampa(t, t1 - 0.55, t1)
                poner(cv, etiqueta(self.cfg['etiqueta']), col, 300, t, t0, t1)
                poner(cv, filas([B['titulo'][0]], True), col, 345, t, t0 + 0.2, t1)
                poner(cv, filas([B['titulo'][1]], True), col, 418, t, tb['t0'] + B['t_real'] + 0.35, t1)
                if a > 0.01:
                    L = capa(); pintar_barra(L, tl, B, col + 30, 730, 760); cv.alpha_composite(con_alfa(L, a))
                yy = 840
                for j, l in enumerate(tb['texto']):
                    poner(cv, filas([l]), col, yy, t, tb['t0'] + B['t_real'] + 1.0 + j * 0.45, t1); yy += 46
                continue
            if self.cfg.get('escalonado'):
                poner(cv, etiqueta(self.cfg['etiqueta']), col, 330, t, t0, t1)
                yy, ti = 390, t0 + 0.4
                previa = None
                for j, l in enumerate(tb['texto']):
                    f = filas([l], True)
                    if previa and previa.startswith(('#', '!!')) and not l.startswith(('#', '!!')): yy += 34  # aire bajo el titular
                    previa = l
                    poner(cv, f, col, yy, t, ti, t1)
                    ti += 0.9 if l.startswith(('#', '!!')) else 0.45  # el subtítulo entra seguido
                    yy += 80 if l.startswith('#') else 60
                    if j == 2: yy += 10
                continue
            poner(cv, etiqueta(self.cfg['etiqueta']), col, 300, t, t0 - 0.1, t1)
            poner(cv, filas(tb['texto']), col, 360, t, t0, t1)

Movil.efectos = lambda self: self.ef

# ---------------------------------------------------------------- línea de tiempo
def bloques():
    out, prev = [], None
    segs = G.SEGMENTOS
    for i, cfg in enumerate(segs):
        tipo = cfg['tipo']
        if tipo == 'movil':
            sig = i + 1 < len(segs) and segs[i + 1]['tipo'] == 'movil'
            b = Movil(cfg, prev, sig); prev = b.partes[-1]['destino'] if sig else None
        else:
            b = {'texto': Texto, 'titulo': Titulo, 'familias': Familias, 'asesor': Asesor, 'cierre': Cierre, 'duo': Duo}[tipo](cfg); prev = getattr(b, 'fin', None)
        out.append(b)
    return out

def tiempos(bs):
    acc, res = 0.0, []
    for b in bs: res.append((acc, acc + b.dur, b)); acc += b.dur
    return res

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    salida = args[0] if args else os.path.join(AQUI, '.trabajo', 'video_sin_audio.mp4')
    os.makedirs(os.path.dirname(salida), exist_ok=True)
    tl = tiempos(bloques()); total = tl[-1][1]
    marcas = {b.cfg.get('id'): round(a, 2) for a, _, b in tl}
    efectos = sorted((round(a + te, 3), k) for a, _, b in tl for te, k in b.efectos())
    os.makedirs(os.path.join(AQUI, '.trabajo'), exist_ok=True)
    json.dump(dict(total=total, bloques=marcas, efectos=efectos), open(os.path.join(AQUI, '.trabajo', 'tiempos.json'), 'w'), indent=1)
    print(f'Duración: {total:.1f} s'); print('  ' + '  '.join(f'{k}@{v}' for k, v in marcas.items()))
    if '--muestras' in sys.argv:
        d = os.path.join(AQUI, '.muestras'); os.makedirs(d, exist_ok=True)
        n = 0
        for a, e, b in tl:
            ts = [p['t0'] + p['dur'] * f for p in b.partes for f in ((0.35, 0.8) if '--muestras2' in sys.argv else (0.6,))] if isinstance(b, Movil) else [b.dur * 0.6]
            for t in ts:
                cv = fondo(a + t); b.pintar(cv, t, None); poner_logo(cv, a + t); cv.convert('RGB').save(os.path.join(d, f'{n:02d}_{b.cfg.get("id")}.jpg'), quality=85); n += 1
        print('Muestras en', d); return
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', salida], stdin=subprocess.PIPE)
    n = int(total * FPS); j = 0
    for i in range(n):
        T = i / FPS
        while j < len(tl) - 1 and T >= tl[j][1]: j += 1
        a, e, b = tl[j]
        cv = fondo(T); b.pintar(cv, T - a, None); poner_logo(cv, T)
        ff.stdin.write(cv.convert('RGB').tobytes())
        if i % 300 == 0: print(f'  fotograma {i}/{n}', flush=True)
    ff.stdin.close(); ff.wait()
    print('Vídeo sin audio:', salida)

if __name__ == '__main__':
    main()
