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
    for fam, pesos in (('Poppins', (400, 600, 700, 800)), ('Inter', (500, 600))):
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

BLANCO = (255, 255, 255); SUAVE = (196, 190, 235); SEGUNDO = (178, 172, 224); LILA = (150, 140, 255); NARANJA = (255, 122, 61)
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

def pintar_movil(cv, ruta, x, y, giro=0.0, escala=1.0, alfa=1.0):
    if alfa <= 0.01: return
    ph = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
    ph.paste(pantalla(ruta), (BZ, BZ), MASCARA); ph.alpha_composite(MARCO)
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
_LOGO = Image.open(os.path.join(AQUI, 'sherpas-logo.png')).convert('RGBA')
LOGO = _LOGO.resize((round(_LOGO.width * 36 / _LOGO.height), 36), Image.LANCZOS)
def poner_logo(cv, T):
    a = 0.9 * rampa(T, 0.2, 0.9)
    if a <= 0.01: return
    im = LOGO if a >= 0.9 else LOGO
    im = im.copy(); im.putalpha(im.getchannel('A').point(lambda v: int(v * a)))
    cv.alpha_composite(im, (W - 72 - im.width, 52))

POS = {'izq': (560, 540, -3.0, 0.94), 'der': (1360, 540, 3.0, 0.94), 'centro': (960, 560, 0.0, 0.84)}
def pos(p): return POS[p] if isinstance(p, str) else tuple(float(v) for v in p)

# ---------------------------------------------------------------- texto
def estilo(linea, grande=False):
    h = 64 if grande else 56
    if linea.startswith('## '): return linea[3:], ('Poppins', 700, h), 'grad'
    if linea.startswith('!! '): return linea[3:], ('Poppins', 700, h), NARANJA
    if linea.startswith('# '): return linea[2:], ('Poppins', 700, h), BLANCO
    return linea, ('Poppins', 400, 31 if grande else 29), SEGUNDO  # texto secundario: misma familia que los títulos, más fino y apagado

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

def poner(cv, filas, x, y, t, t0, t1, centrado=False, medio=False, sube=26):
    a = rampa(t, t0, t0 + 0.55) * (1 - rampa(t, t1 - 0.4, t1))
    if a <= 0.01: return
    im = imagen_texto(tuple(filas), centrado)
    dy = int((1 - rampa(t, t0, t0 + 0.7)) * sube)
    if a < 1: im = im.copy(); im.putalpha(im.getchannel('A').point(lambda v: int(v * a)))
    px = x - im.width // 2 if centrado else x
    py = (y - im.height // 2 if medio else y) + dy
    cv.alpha_composite(im, (int(px), int(py)))

def filas(lineas, grande=False): return [estilo(l, grande) for l in lineas]
def etiqueta(txt): return [(txt, ('Poppins', 600, 22), LILA)]

# ---------------------------------------------------------------- bloques
class Bloque:
    def __init__(self, cfg): self.cfg = cfg; self.dur = cfg.get('dur', 0)
    def pintar(self, cv, t, estado): pass

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

class Cierre(Bloque):
    def pintar(self, cv, t, e):
        C, T = G.CIERRE, G.TITULO; fin = self.dur + 1
        poner(cv, [(T['nombre'][0], ('Poppins', 800, 100), BLANCO), (T['nombre'][1], ('Poppins', 800, 100), 'grad')], W // 2, 230, t, 0.2, fin, centrado=True)
        poner(cv, [(C['sub'], ('Poppins', 400, 33), SEGUNDO)], W // 2, 520, t, 0.9, fin, centrado=True)
        if C.get('frase'):
            poner(cv, [(l, ('Poppins', 700, 46), BLANCO if i == 0 else 'grad') for i, l in enumerate(C['frase'])], W // 2, 600, t, 1.6, fin, centrado=True)
        poner(cv, [(C['enlace'], ('Poppins', 600, 30), BLANCO)], W // 2, 800, t, 2.6, fin, centrado=True)
        poner(cv, [(C['firma'], ('Poppins', 400, 24), LILA)], W // 2, 870, t, 2.9, fin, centrado=True)

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
        d = self.dur
        poner(cv, etiqueta(self.cfg['etiqueta']), 150, 330, t, 0.1, d)
        poner(cv, filas(self.cfg['lineas'][:2]), 150, 385, t, 0.3, d)
        poner(cv, filas(self.cfg['lineas'][2:]), 150, 560, t, 1.0, d)
        k = rampa(t, 0.3, 1.1); a = min(k, 1 - rampa(t, d - 0.4, d))
        x0, y0 = 800, (H - self.ch) // 2 + int((1 - k) * 80)
        card = Image.new('RGBA', (self.cw, self.ch), (0, 0, 0, 0))
        ImageDraw.Draw(card).rounded_rectangle((0, 0, self.cw - 1, self.ch - 1), 30, fill=(255, 255, 255, 255))
        card.alpha_composite(self.cab, (0, 0)); y = 130
        for i, r in enumerate(self.filas):
            ai = rampa(t, 1.4 + i * 0.75, 2.0 + i * 0.75)
            if ai > 0.01:
                rr = r.copy(); rr.putalpha(rr.getchannel('A').point(lambda v: int(v * ai))); card.alpha_composite(rr, (0, y + int((1 - ai) * 18)))
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
                self.textos.append(dict(t0=p['t0'] + espera, t1=p['t1'], texto=p.get('texto', []), texto2=p.get('texto2'), destino=p['destino']))
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
    def pintar(self, cv, t, e):
        p, (x, y, g, s) = self.estado_movil(min(t, self.dur - 1e-3))
        esc, marca, a, b, vel = p['clip']
        ruta = grabacion(esc).en(marca, a + max(0, t - p['t0']) * vel)
        pintar_movil(cv, ruta, x, y, g, s)
        for i, tb in enumerate(self.textos):
            t0 = tb['t0'] + (0.15 if i else 0.25); t1 = tb['t1'] if i < len(self.textos) - 1 else self.dur
            dx = tb['destino'][0]
            if tb['texto2'] is not None or abs(dx - 960) < 120:     # móvil en el centro: texto a los dos lados
                izq_x, izq_w = 110, 0
                poner(cv, etiqueta(self.cfg['etiqueta']), izq_x, 380, t, t0 - 0.1, t1)
                poner(cv, filas(tb['texto']), izq_x, 430, t, t0, t1)
                if tb['texto2']: poner(cv, filas(tb['texto2']), 1250, 470, t, t0 + 0.4, t1)
                continue
            col = 150 if dx > 960 else 1020
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
            b = {'texto': Texto, 'titulo': Titulo, 'familias': Familias, 'asesor': Asesor, 'cierre': Cierre}[tipo](cfg); prev = None
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
    json.dump(dict(total=total, bloques=marcas), open(os.path.join(AQUI, '.trabajo', 'tiempos.json'), 'w'), indent=1)
    print(f'Duración: {total:.1f} s'); print('  ' + '  '.join(f'{k}@{v}' for k, v in marcas.items()))
    if '--muestras' in sys.argv:
        d = os.path.join(AQUI, '.muestras'); os.makedirs(d, exist_ok=True)
        n = 0
        for a, e, b in tl:
            ts = [p['t0'] + p['dur'] * 0.6 for p in b.partes] if isinstance(b, Movil) else [b.dur * 0.6]
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
