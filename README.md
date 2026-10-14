# quadraturbo.github.io

Portfolio personal y blog de ciberseguridad de **quadraturbo**. Sitio estático, sin build, servido con GitHub Pages.

🔗 https://quadraturbo.github.io

## Stack

- HTML, CSS y JavaScript **vanilla** — sin frameworks ni bundler.
- Estilos compartidos en `style.css`; lo específico de cada página vive en su propio `<style>`.
- Blog renderizado en cliente con [marked](https://github.com/markedjs/marked) y [highlight.js](https://github.com/highlightjs/highlight.js), **self-hosted** en `vendor/` (sin dependencias de CDN de terceros).
- Tipografía: IBM Plex Mono (Google Fonts).

## Estructura

```
.
├── index.html        # Portfolio: hero, stack, formación, proyectos, enfoque, recursos, now, bio
├── blog.html         # Listado y lectura de posts (navegación por hash, sin recarga)
├── posts-data.js     # Contenido de los posts (markdown embebido en JS)
├── style.css         # Estilos compartidos entre páginas
├── vendor/           # Librerías self-hosted
│   ├── marked.min.js
│   ├── highlight.min.js
│   └── atom-one-dark.min.css
├── robots.txt
├── sitemap.xml
└── favicon.*
```

## Desarrollo local

El blog carga `posts-data.js` y las libs por ruta relativa, así que sírvelo por HTTP (no abras el `file://` directamente):

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Añadir un post

Edita `posts-data.js` y añade un objeto al array `BLOG_POSTS`:

```js
{
  slug: "mi-post",            // identificador en la URL (#post/mi-post)
  title: "Título del post",
  date: "2026-10-14",         // ISO, se usa para ordenar y mostrar
  category: "web",            // ver CATEGORY_LABELS en blog.html
  excerpt: "Resumen corto.",
  tags: ["web", "ejemplo"],
  content: `Cuerpo en **markdown**…`
}
```

## Actualizar las librerías del blog

```bash
npm pack marked@<version>
npm pack @highlightjs/cdn-assets@<version>
# copia marked.min.js, highlight.min.js y styles/atom-one-dark.min.css a vendor/
```

## Licencia

TODO: definir licencia. Sin un fichero `LICENSE`, el código queda bajo "todos los derechos reservados" por defecto. Para un portfolio público lo habitual es MIT (código) — añádela si quieres que otros puedan reutilizarlo.
