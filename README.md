# ALTIVA by Alejandra Prieto

Prototipo del sitio web de ALTIVA, atelier de alta costura en Córdoba. Trabajo práctico de DCV III, Universidad Siglo 21.

Es una sola página HTML que se publica tal cual en Vercel: no necesita instalar nada ni compilar en el servidor.

## Qué tiene

- **Inicio:** portada con el patrón ALTIVA en movimiento; "Soy Alejandra Prieto"; los tres packagings en 3D (bolso de pana, book negro y tubos de kraft). Al hacer scroll se abre el bolso, sale la funda doblada, se despliega, se abre y sale el vestido. Sigue el proceso "Estoy en cada etapa", con el vestido girando a la derecha. Al final todo vuelve a guardarse.
- **Colección y ficha:** vestidos con colores, talle, tela, largo y escote, foto puesta, "Mi selección" y consulta por WhatsApp con el mensaje armado.
- **Preguntas:** alfiletero 3D; cada alfiler es una pregunta.
- **Tu cuenta:** clientas de ejemplo con el estado del vestido, turnos, selección y medidas.
- **Escribime:** reservar entrevista (calendario) o mandar un mensaje por WhatsApp, más los datos del atelier.

## Estructura

```
index.html          la página lista para publicar (se genera, no se edita a mano)
src/index.src.html  código fuente: HTML, CSS y JavaScript (incluye la escena 3D)
src/escena3d.js     copia de la escena 3D (three.js) para leerla aparte
src/fotos.json      imágenes que se incrustan en la página
src/three.min.js    three.js r149
src/lenis.min.js    scroll suave
src/build.py        arma index.html a partir de lo anterior
assets/             fotos de archivo, generadas, marca y packaging
```

## Editar y publicar

1. Editá `src/index.src.html`.
2. Generá la página: `python3 src/build.py`.
3. Hacé commit y push: Vercel publica solo.

## Tipografías

Títulos: Kudryashev Display Contrast Sans. Textos: Century Gothic Pro; los subtítulos, en mayúsculas. Si las fuentes no están instaladas o cargadas, la página usa Tenor Sans y Questrial.
