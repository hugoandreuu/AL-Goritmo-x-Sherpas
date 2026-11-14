#!/usr/bin/env python3
"""Genera dist/plan-weah.html: la web en un solo archivo, con los JSON del caso dentro.
Sirve para abrirla con doble clic (sin servidor) o enviarla. Uso: python3 tools/build-single.py"""
import json, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
app = root / 'app'
case = root / 'cases' / 'timothy-melanie-weah'
html = (app / 'index.html').read_text(encoding='utf-8')

data = {
    'fh': json.loads((case / 'financial-health.json').read_text(encoding='utf-8')),
    'ia': json.loads((case / 'investment-analysis.json').read_text(encoding='utf-8')),
}
payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

css = (app / 'styles.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css + '\n</style>')

def inline(m):
    src = m.group(1)
    js = (app / src).read_text(encoding='utf-8').replace('</script', '<\\/script')
    pre = '<script>window.__CASE_DATA__=' + payload + ';</script>\n' if src == 'facts.js' else ''
    return pre + '<script>\n' + js + '\n</script>'

html = re.sub(r'<script src="([\w.-]+)"></script>', inline, html)
out = root / 'dist' / 'plan-weah.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'{out.relative_to(root)} ({out.stat().st_size // 1024} KB)')
