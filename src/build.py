"""Arma index.html (en la raíz del repo) a partir de src/index.src.html, src/fotos.json y las librerías."""
import json, re, os
D = os.path.dirname(os.path.abspath(__file__))
leer = lambda n: open(os.path.join(D, n), encoding='utf-8').read()
f = json.loads(leer('fotos.json'))
s = leer('index.src.html')
s = s.replace('/*THREE*/', leer('three.min.js'))
s = s.replace('/*LENIS*/', re.sub(r'//# sourceMappingURL=.*', '', leer('lenis.min.js')))
s = re.sub(r'\{\{F:(\w+)\}\}', lambda m: f[m.group(1)]['src'], s)
s = re.sub(r'\{\{W:(\w+)\}\}', lambda m: str(f[m.group(1)]['w']), s)
s = re.sub(r'\{\{H:(\w+)\}\}', lambda m: str(f[m.group(1)]['h']), s)
head, body = s.split('<header class="cabecera"', 1)
html = ('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>'
        + head + '</head><body><header class="cabecera"' + body + '</body></html>')
open(os.path.join(D, '..', 'index.html'), 'w', encoding='utf-8').write(html)
print(len(html)//1024, 'KB')
