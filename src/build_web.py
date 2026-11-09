"""Versión para Vercel: index.html liviano + imágenes y librerías como archivos aparte (se cachean y cargan en paralelo)."""
import json, re, os, base64, shutil, sys
SRC = os.path.dirname(os.path.abspath(__file__)); OUT = sys.argv[1]
f = json.load(open(os.path.join(SRC, 'fotos.json')))
s = open(os.path.join(SRC, 'index.src.html')).read()
os.makedirs(os.path.join(OUT, 'img'), exist_ok=True); os.makedirs(os.path.join(OUT, 'js'), exist_ok=True)
EXT = {'image/webp':'webp','image/png':'png','image/jpeg':'jpg','image/svg+xml':'svg','image/gif':'gif'}
usados = set(re.findall(r'\{\{F:(\w+)\}\}', s)); rutas = {}
for k in usados:
    src = f[k]['src']; m = re.match(r'data:([^;]+);base64,(.*)', src, re.S)
    if m:
        ext = EXT.get(m.group(1), 'bin'); open(os.path.join(OUT, 'img', f'{k}.{ext}'), 'wb').write(base64.b64decode(m.group(2))); rutas[k] = f'img/{k}.{ext}'
    else:
        m2 = re.match(r'data:([^,;]+),(.*)', src, re.S)
        if m2:
            import urllib.parse; ext = EXT.get(m2.group(1), 'bin'); open(os.path.join(OUT, 'img', f'{k}.{ext}'), 'w').write(urllib.parse.unquote(m2.group(2))); rutas[k] = f'img/{k}.{ext}'
        else: rutas[k] = src
shutil.copy(os.path.join(SRC, 'three.min.js'), os.path.join(OUT, 'js', 'three.min.js'))
lenis = re.sub(r'//# sourceMappingURL=.*', '', open(os.path.join(SRC, 'lenis.min.js')).read()); open(os.path.join(OUT, 'js', 'lenis.min.js'), 'w').write(lenis)
s = s.replace('<script>/*LENIS*/</script>', '<script src="js/lenis.min.js"></script>').replace('<script>/*THREE*/</script>', '<script src="js/three.min.js"></script>')
s = re.sub(r'\{\{F:(\w+)\}\}', lambda m: rutas[m.group(1)], s)
s = re.sub(r'\{\{W:(\w+)\}\}', lambda m: str(f[m.group(1)]['w']), s)
s = re.sub(r'\{\{H:(\w+)\}\}', lambda m: str(f[m.group(1)]['h']), s)
head, body = s.split('<header class="cabecera"', 1)
html = ('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="description" content="ALTIVA by Alejandra Prieto: alta costura en Córdoba. Vestidos de 15, egresadas, novias e invitadas, diseñados y cosidos a mano en el atelier.">'
        '<meta name="theme-color" content="#FDF4E7"><link rel="icon" href="img/isologo.svg" type="image/svg+xml">'
        '<link rel="preload" as="image" href="img/tile_a.webp"><link rel="preload" as="script" href="js/three.min.js">'
        '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>'
        + head + '</head><body><header class="cabecera"' + body + '</body></html>')
open(os.path.join(OUT, 'index.html'), 'w').write(html)
print(len(html)//1024, 'KB html,', len(rutas), 'imágenes')
