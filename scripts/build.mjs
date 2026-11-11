#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as data from '../src/data.mjs';

const require = createRequire(import.meta.url);
const { marked } = require('./lib/marked.min.cjs');
const hljs = require('./lib/highlight.min.cjs');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const write = (p, content) => {
  mkdirSync(dirname(join(ROOT, p)), { recursive: true });
  writeFileSync(join(ROOT, p), content);
  written.push(p);
};
const written = [];
const warnings = [];

const cfg = JSON.parse(read('site.config.json'));
const SITE = cfg.siteUrl.replace(/\/+$/, '');
const HANDLE = cfg.handle;
const EMAIL = String(cfg.contactEmail || '').trim();
const FPR = String(cfg.pgpFingerprint || '').replace(/\s+/g, '').toUpperCase();
const HAS_PGP = FPR.length > 0;
const PGP_PATH = cfg.pgpKeyPath || '/pgp.asc';

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(EMAIL)) fail(`contactEmail no es una dirección válida: "${EMAIL}"`);
if (/TODO|\.invalid$/i.test(EMAIL)) warnings.push(`contactEmail sigue siendo el marcador "${EMAIL}" (site.config.json).`);
if (HAS_PGP) {
  if (!/^([0-9A-F]{40}|[0-9A-F]{64})$/.test(FPR)) fail('pgpFingerprint debe tener 40 (v4) o 64 (v6) caracteres hexadecimales.');
  if (!PGP_PATH.startsWith('/')) fail('pgpKeyPath debe ser una ruta absoluta del sitio, p. ej. "/pgp.asc".');
  if (!existsSync(join(ROOT, PGP_PATH))) fail(`pgpFingerprint está definido pero no existe ${PGP_PATH} en el repo: exporta la clave pública ahí o vacía el fingerprint.`);
}
function fail(msg) {
  console.error('✗ build: ' + msg);
  process.exit(1);
}

const BUILD_DATE = new Date();
const TODAY = BUILD_DATE.toISOString().slice(0, 10);

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonForHtml = (o, indent) => JSON.stringify(o, null, indent).replace(/</g, '\\u003c');
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const readTime = (md) => Math.max(1, Math.round(md.trim().split(/\s+/).length / 200));
const catLabel = (c) => data.categoryLabels[c] || (c.charAt(0).toUpperCase() + c.slice(1)).replace(/-/g, ' ');
const fprPretty = FPR.replace(/(.{4})/g, '$1 ').trim();
const EXT = 'target="_blank" rel="noopener noreferrer"';

const renderer = new marked.Renderer();
renderer.code = (code, info) => {
  const lang = (info || '').trim().split(/\s+/)[0];
  const html = lang && hljs.getLanguage(lang) ? hljs.highlight(code, { language: lang }).value : esc(code);
  return `<pre><code class="hljs${lang ? ' language-' + esc(lang) : ''}">${html}</code></pre>\n`;
};
const baseLink = renderer.link.bind(renderer);
renderer.link = (href, title, text) => {
  const html = baseLink(href, title, text);
  return /^https?:\/\//i.test(href || '') && !href.startsWith(SITE) ? html.replace(/^<a /, `<a ${EXT} `) : html;
};
marked.setOptions({ gfm: true, breaks: true, renderer });

function loadPosts() {
  const dir = join(ROOT, 'src/posts');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = readFileSync(join(dir, f), 'utf8');
      const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!m) fail(`src/posts/${f}: falta la cabecera entre líneas "---".`);
      const meta = {};
      for (const line of m[1].split('\n')) {
        if (!line.trim()) continue;
        const i = line.indexOf(':');
        const key = line.slice(0, i).trim();
        const val = line.slice(i + 1).trim();
        try {
          meta[key] = /^["[]/.test(val) ? JSON.parse(val) : val;
        } catch {
          fail(`src/posts/${f}: valor no válido en "${key}" (las cadenas con comillas y las listas van en JSON).`);
        }
      }
      for (const k of ['title', 'date', 'category', 'excerpt']) if (!meta[k]) fail(`src/posts/${f}: falta "${k}".`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) fail(`src/posts/${f}: date debe ser AAAA-MM-DD.`);
      const slug = f.replace(/\.md$/, '');
      if (!/^[a-z0-9-]+$/.test(slug)) fail(`src/posts/${f}: el nombre del fichero (slug) solo admite a-z, 0-9 y guiones.`);
      const content = m[2].trim();
      return { slug, ...meta, tags: meta.tags || [], content, html: marked.parse(content), minutes: readTime(content), url: `/blog/${slug}/` };
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
}
const posts = loadPosts();

const css = readdirSync(join(ROOT, 'src/css'))
  .filter((f) => f.endsWith('.css'))
  .sort()
  .map((f) => read('src/css/' + f))
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();
write('assets/site.css', css + '\n');

function badge(label, value, color) {
  const cw = 6.7;
  const lw = Math.round(label.length * cw + 14);
  const vw = Math.round(value.length * cw + 14);
  const w = lw + vw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="22" viewBox="0 0 ${w} 22" role="img" aria-label="${esc(label)}: ${esc(value)}"><title>${esc(label)}: ${esc(value)}</title><rect width="${w}" height="22" rx="3" fill="#151a1e"/><path d="M${lw} 0h${vw - 3}a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3h-${vw - 3}z" fill="${color}"/><rect x=".5" y=".5" width="${w - 1}" height="21" rx="2.5" fill="none" stroke="#fff" stroke-opacity=".12"/><g font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="11" text-anchor="middle"><text x="${lw / 2}" y="15" fill="#c9cfd3" textLength="${lw - 14}" lengthAdjust="spacingAndGlyphs">${esc(label)}</text><text x="${lw + vw / 2}" y="15" fill="#fff" font-weight="600" textLength="${vw - 14}" lengthAdjust="spacingAndGlyphs">${esc(value)}</text></g></svg>\n`;
}
const badgeImg = (file, label, value, color) => {
  const svg = badge(label, value, color);
  write(`assets/badges/${file}.svg`, svg);
  const w = Number(svg.match(/width="(\d+)"/)[1]);
  return `<img class="badge" src="/assets/badges/${file}.svg" alt="${esc(label)}: ${esc(value)}" width="${w}" height="22" loading="lazy" decoding="async">`;
};
rmSync(join(ROOT, 'assets/badges'), { recursive: true, force: true });
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CSP = "default-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'";
const NAV = [
  ['/#proyectos', 'proyectos', 'proyectos'],
  ['/blog/', 'blog', 'blog'],
  ['/#formacion', 'formación', 'formacion'],
  ['/#now', 'ahora', 'now'],
  ['/#contacto', 'contacto', 'contacto'],
];

function layout({ title, description, path, ogType = 'website', active = '', bodyClass = '', jsonld = [], headExtra = '', scripts = [], main, robots }) {
  const url = SITE + path;
  const home = path === '/';
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="no-referrer">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#07080a">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(HANDLE)}">
${robots ? `<meta name="robots" content="${robots}">\n` : `<link rel="canonical" href="${url}">\n`}<link rel="alternate" type="application/rss+xml" title="${esc(HANDLE)} — blog" href="/feed.xml">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="${esc(HANDLE)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="es_ES">
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
${headExtra}<link rel="preload" href="/assets/fonts/plex-sans-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/plex-mono-600.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<script src="/assets/js/head.js"></script>
${jsonld.map((o) => `<script type="application/ld+json">\n${jsonForHtml(o, 2)}\n</script>`).join('\n')}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip-link" href="#contenido">Saltar al contenido</a>
${home ? BOOT : ''}<header class="nav-bar">
  <a href="/" class="nav-handle"${home ? ' aria-current="page"' : ''}><span class="dot" aria-hidden="true"></span>${esc(HANDLE)}</a>
  <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu"><span class="nav-toggle-icon" aria-hidden="true"></span>Menú</button>
  <nav id="nav-menu" class="nav-menu" aria-label="Principal">
    <ul>
${NAV.map(([href, label, key]) => `      <li><a href="${home ? href.replace(/^\/#/, '#') : href}"${key === active ? ' aria-current="page"' : ''}>${label}</a></li>`).join('\n')}
    </ul>
  </nav>
</header>

<main id="contenido" class="page">
${main}
</main>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-phrase">
      <p class="footer-phrase-text"><span class="fp-white">Hack the </span><span class="fp-green">Planet</span><span class="fp-sep"> ⛧ </span><span class="fp-dim">Help the </span><span class="fp-white">Helpless.</span></p>
      <span class="footer-phrase-sub">foss forever</span>
    </div>
    <div class="footer-bottom">
      <span class="footer-copy">© ${TODAY.slice(0, 4)} ${esc(HANDLE)}</span>
      <ul class="footer-links">
        <li><a href="${cfg.github}" ${EXT}>GitHub</a></li>
        <li><a href="mailto:${esc(EMAIL)}">Contacto</a></li>
${HAS_PGP ? `        <li><a href="${PGP_PATH}">PGP</a></li>\n` : ''}        <li><a href="/feed.xml">RSS</a></li>
      </ul>
    </div>
  </div>
</footer>
<button id="back-to-top" type="button" aria-label="Volver arriba" hidden>↑</button>
${['/assets/js/site.js', ...scripts].map((s) => `<script src="${s}" defer></script>`).join('\n')}
</body>
</html>
`;
}

const BOOT = `<div id="boot" aria-hidden="true">
  <div class="boot-box">
    <div class="boot-line"><span class="tag">$</span><span>whoami</span></div>
    <div class="boot-line"><span class="tag ok">›</span><b>${esc(HANDLE)}</b></div>
    <div class="boot-bar"><div class="boot-bar-fill"></div></div>
  </div>
</div>
`;

const secHead = (num, title, id) =>
  `<div class="sec-head"><span class="sec-num" aria-hidden="true">${num}</span><h2 class="sec-title" id="${id}">${title}</h2></div>`;

const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: HANDLE,
  url: SITE + '/',
  sameAs: [cfg.github],
  jobTitle: data.profile.role,
  knowsAbout: data.profile.knowsAbout,
};

const doneCerts = data.certs.filter((c) => c.done).length;
const graph = data.buildGraph(HANDLE);
const todos = [];

function projectCard(p) {
  const lang = data.languages[p.lang];
  const badges = [badgeImg('lang-' + p.lang, 'lenguaje', lang.label, lang.color)];
  if (p.license) badges.push(badgeImg('license-' + slugify(p.license), 'licencia', p.license, '#3d4a52'));
  if (p.pypi) badges.push(badgeImg('pypi', 'PyPI', 'publicado', '#0f6ab4'));
  let demo;
  if (p.demo) {
    demo = /\.(mp4|webm)$/i.test(p.demo)
      ? `<video class="proj-media" src="${esc(p.demo)}" controls muted loop playsinline preload="none" aria-label="Demo de ${esc(p.name)}"></video>`
      : `<img class="proj-media" src="${esc(p.demo)}" alt="Demo de ${esc(p.name)}" loading="lazy" decoding="async">`;
  } else {
    todos.push(`Demo de ${p.name}: añade un GIF/WebP/MP4 a assets/demos/ y rellena "demo" en src/data.mjs.`);
    demo = `<div class="demo-ph"><span class="demo-ph-t">TODO: demo de ${esc(p.name)}</span><span class="demo-ph-s">GIF o grabación de terminal, autoalojado</span></div>`;
  }
  if (!p.license) todos.push(`Licencia de ${p.name}: indica el SPDX en src/data.mjs (el repo no es público, no se ha podido comprobar).`);
  if (!p.repo) todos.push(`Repositorio de ${p.name}: github.com/${HANDLE}/${p.name} devuelve 404; publica el repo y rellena "repo" en src/data.mjs.`);
  return `      <li class="proj" id="proyecto-${p.id}">
        <div class="proj-demo">${demo}</div>
        <div class="proj-body">
          <h3 class="proj-name">${esc(p.name)}</h3>
          <p class="badges">${badges.join('')}${p.license ? '' : '<span class="todo">TODO: licencia</span>'}</p>
          <p class="proj-ps"><span class="ps-k">Problema</span><span class="ps-v">${esc(p.problem)}</span><span class="ps-k ps-sol"><span aria-hidden="true">→ </span>Solución</span><span class="ps-v">${esc(p.solution)}</span></p>
          ${p.repo ? `<a class="link-arrow" href="${p.repo}" ${EXT}>${esc(p.repo.replace(/^https?:\/\//, ''))}</a>` : '<span class="todo">TODO: enlace al repositorio público</span>'}
        </div>
      </li>`;
}

const postItem = (p, level = 'h3') => `<li class="post-card" data-cat="${esc(p.category)}" data-date="${p.date}" data-search="${esc([p.title, p.excerpt, p.tags.join(' '), catLabel(p.category)].join(' ').toLowerCase())}">
        <a class="post-link" href="${p.url}">
          <${level} class="post-card-title">${esc(p.title)}</${level}>
          <p class="post-meta"><span class="cat-tag">${esc(catLabel(p.category))}</span><time datetime="${p.date}">${fmtDate(p.date)}</time><span aria-hidden="true">·</span><span>${p.minutes} min de lectura</span></p>
          <p class="post-excerpt">${esc(p.excerpt)}</p>
          <p class="post-tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</p>
        </a>
      </li>`;

const tabs = [
  ...data.areas.map((a) => ({
    id: a.id,
    label: a.title,
    html: `<div class="stack-cols">
          <div>
            <h4 class="mini-h">Enfoque</h4>
            <ul class="dash-list">${a.focus.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
            <h4 class="mini-h">Base</h4>
            <ul class="chips">${a.base.map((b) => `<li class="chip">${esc(b)}</li>`).join('')}</ul>
          </div>
          <div>
            <h4 class="mini-h">Herramientas</h4>
            <ul class="tool-grid">${a.tools.map((t) => `<li class="tool-item"><span class="tool-name">${esc(t.name)}</span><span class="tool-cat">${esc(t.cat)}</span></li>`).join('')}</ul>
          </div>
        </div>`,
  })),
  {
    id: 'lecturas',
    label: 'Lecturas y referencias',
    html: `<div class="stack-cols">
          <div>
            <h4 class="mini-h">Lecturas</h4>
            <ul class="rows">${data.reading.map((r) => `<li class="row"><span><span class="row-t">${esc(r.title)}</span><span class="row-s">${esc(r.by)}</span></span><span class="row-tag">${esc(r.tag)}</span></li>`).join('')}</ul>
          </div>
          <div>
            <h4 class="mini-h">Repos de referencia</h4>
            <ul class="rows">${data.refRepos.map((r) => `<li class="row"><span><span class="row-t">${esc(r.name)}</span><span class="row-s">${esc(r.desc)}</span></span><span class="row-tag">${esc(r.lang)}</span></li>`).join('')}</ul>
          </div>
        </div>`,
  },
];

const homeMain = `  <section class="hero" aria-labelledby="hero-title">
    <p class="eyebrow"><span class="dot" aria-hidden="true"></span>${esc(data.profile.role)}</p>
    <h1 class="hero-name" id="hero-title">${esc(HANDLE)}<span class="caret" aria-hidden="true"></span></h1>
    <p class="hero-lead">${esc(data.profile.tagline)}</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="mailto:${esc(EMAIL)}">Contacto</a>
${HAS_PGP ? `      <a class="btn" href="${PGP_PATH}">PGP</a>\n` : ''}      <a class="btn" href="${cfg.github}" ${EXT}>GitHub</a>
      <span class="hero-cv">CV bajo petición por email</span>
    </div>
    <dl class="hero-stats">
      <div><dt>certificaciones</dt><dd>${doneCerts}</dd></div>
      <div><dt>proyectos publicados</dt><dd>${data.projects.length}</dd></div>
      <div><dt>ubicación</dt><dd>${esc(data.profile.location)}</dd></div>
      <div><dt>estado</dt><dd class="avail">${esc(data.profile.availability)}</dd></div>
    </dl>

    <div class="graph-section" id="mapa">
      <div class="graph-head">
        <h2 class="graph-title">Mapa del perfil</h2>
        <span class="graph-sub">áreas, proyectos, herramientas y formación, como grafo</span>
      </div>
      <div class="graph-wrap" id="graphWrap">
        <svg id="graph" role="img" aria-label="Grafo interactivo del perfil de ${esc(HANDLE)}. El contenido equivalente está disponible en texto en las secciones siguientes."></svg>
        <p class="graph-fallback" id="graphFallback">El mapa interactivo necesita JavaScript. Todo su contenido está en las secciones de texto de esta página.</p>
        <p class="sr-only">Mapa interactivo del perfil. Todo su contenido (áreas, proyectos, herramientas, certificaciones y formación) está también en las secciones de texto siguientes.</p>
        <div class="gctl">
          <button type="button" id="zoomIn" aria-label="Acercar">+</button>
          <button type="button" id="zoomOut" aria-label="Alejar">−</button>
          <button type="button" id="zoomReset" aria-label="Encajar el grafo">⊚</button>
        </div>
        <aside class="panel" aria-label="Detalle del nodo seleccionado" aria-live="polite">
          <span class="pc-type"><span class="sw" id="pcSw"></span><span id="pcType">perfil</span></span>
          <p class="pc-name" id="pcName">${esc(HANDLE)}</p>
          <p class="pc-desc" id="pcDesc">${esc(data.profile.graphDesc)}</p>
          <ul class="pc-rels" id="pcRels"></ul>
          <a class="pc-link" id="pcLink" hidden></a>
          <ul class="legend" aria-hidden="true">
            <li><span class="sw sw-core"></span>perfil y áreas</li>
            <li><span class="sw sw-project"></span>proyectos y blog</li>
            <li><span class="sw sw-tech"></span>tecnología</li>
            <li><span class="sw sw-cert"></span>certificaciones y formación</li>
          </ul>
        </aside>
      </div>
      <p class="hint-bar" aria-hidden="true"><span class="hint-fine">pasa el cursor para resaltar · clic para fijar · arrastra para mover · rueda para zoom</span><span class="hint-coarse">toca un nodo para ver sus relaciones</span></p>
      <script type="application/json" id="graph-data">${jsonForHtml(graph)}</script>
    </div>
  </section>

  <section id="proyectos" class="sec" aria-labelledby="h-proyectos">
    ${secHead('01', 'Proyectos', 'h-proyectos')}
    <p class="sec-intro">Herramientas pequeñas, publicadas con su código. Cada una nace de un problema concreto.</p>
    <ul class="proj-grid reveal">
${data.projects.map(projectCard).join('\n')}
    </ul>
  </section>

  <section id="blog" class="sec" aria-labelledby="h-blog">
    ${secHead('02', 'Blog', 'h-blog')}
    <p class="sec-intro">${esc(data.blogIntro)}</p>
    <ul class="post-list reveal">
      ${posts.slice(0, 3).map((p) => postItem(p)).join('\n      ')}
    </ul>
    <p class="sec-more"><a class="link-arrow" href="/blog/">Todos los posts</a><a class="link-plain" href="/feed.xml">RSS</a></p>
  </section>

  <section id="formacion" class="sec" aria-labelledby="h-formacion">
    ${secHead('03', 'Formación y certificaciones', 'h-formacion')}
    <ul class="edu-list reveal">
${data.education.map((e) => `      <li class="edu-item"><div class="edu-title"><span class="edu-short">${esc(e.short)}</span><span class="edu-name">${esc(e.name)}</span></div><span class="edu-when">${esc(e.period)}</span><span class="status ${e.state}">${esc(e.status)}</span></li>`).join('\n')}
    </ul>
    <h3 class="sub-h">Certificaciones</h3>
    <ul class="cert-grid reveal">
${data.certs.map((c) => `      <li class="cert-chip${c.done ? '' : ' wip'}"><span class="cd" aria-hidden="true"></span>${esc(c.name)}${c.done ? '' : ` <span class="cert-note">${esc(c.note)}</span>`}</li>`).join('\n')}
    </ul>

    <h3 class="sub-h" id="stack">Stack y enfoque</h3>
    <div class="tabs reveal">
      <div class="tab-nav" role="tablist" aria-label="Stack y enfoque por área">
${tabs.map((t, i) => `        <button class="tab-btn${i ? '' : ' active'}" type="button" id="tab-btn-${t.id}" role="tab" aria-selected="${i ? 'false' : 'true'}" aria-controls="tab-${t.id}"${i ? ' tabindex="-1"' : ''}>${esc(t.label)}</button>`).join('\n')}
      </div>
${tabs.map((t, i) => `      <div class="tab-panel" id="tab-${t.id}" role="tabpanel" aria-labelledby="tab-btn-${t.id}" tabindex="0"${i ? ' hidden' : ''}>
        ${t.html}
      </div>`).join('\n')}
    </div>
  </section>

  <section id="now" class="sec" aria-labelledby="h-now">
    ${secHead('04', 'Ahora', 'h-now')}
    <div class="now-grid reveal">
${data.now.map((c) => `      <div class="now-card">
        <h3 class="now-label">${esc(c.label)}</h3>
        <ul>${c.items.map((i) => `<li><span class="now-text">${esc(i.text)}</span><span class="now-sub">${esc(i.sub)}</span></li>`).join('')}</ul>
      </div>`).join('\n')}
    </div>

    <div class="contact reveal" id="contacto">
      <div class="contact-l">
        <h2 class="contact-title">Contacto</h2>
        <p class="contact-bio">${data.profile.bio}</p>
      </div>
      <dl class="contact-list">
        <div><dt>email</dt><dd><a href="mailto:${esc(EMAIL)}">${esc(EMAIL)}</a></dd></div>
${HAS_PGP ? `        <div><dt>PGP</dt><dd><a href="${PGP_PATH}">clave pública</a><span class="fpr">${fprPretty}</span></dd></div>\n` : ''}        <div><dt>GitHub</dt><dd><a href="${cfg.github}" ${EXT}>${esc(cfg.github.replace(/^https?:\/\//, ''))}</a></dd></div>
        <div><dt>CV</dt><dd>CV bajo petición por email</dd></div>
      </dl>
    </div>
  </section>`;

write(
  'index.html',
  layout({
    title: `${HANDLE} — ${data.profile.role}`,
    description: `${HANDLE}: ${data.profile.role}. Seguridad ofensiva, redes y herramientas propias. Portfolio y notas técnicas.`,
    path: '/',
    jsonld: [personLd],
    main: homeMain,
  })
);

const cats = Object.entries(posts.reduce((acc, p) => ((acc[p.category] = (acc[p.category] || 0) + 1), acc), {})).sort((a, b) => b[1] - a[1]);

rmSync(join(ROOT, 'blog'), { recursive: true, force: true });

write(
  'blog/index.html',
  layout({
    title: `Blog — ${HANDLE}`,
    description: `Blog de ciberseguridad de ${HANDLE}: notas, técnicas y writeups de pentesting, redes y red team.`,
    path: '/blog/',
    active: 'blog',
    headExtra: '<script src="/assets/js/redirect.js"></script>\n',
    scripts: ['/assets/js/blog.js'],
    main: `  <section class="blog-hero" aria-labelledby="blog-title">
    <p class="eyebrow"><span class="dot" aria-hidden="true"></span>notas, técnicas y writeups</p>
    <h1 class="page-title" id="blog-title">Blog</h1>
    <p class="hero-lead">Apuntes de red team, redes y todo lo que me parezca interesante escribir.</p>
    <p class="blog-note">Contenido educativo y defensivo. Las pruebas se hacen en laboratorios propios o entornos autorizados, sobre vulnerabilidades ya publicadas y parcheadas.</p>

    <div class="blog-controls" id="blogControls"${posts.length ? "" : " hidden"}>
      <div class="control-row">
        <label class="search-wrap"><span class="sr-only">Buscar posts</span><input type="search" id="searchInput" class="search-input" placeholder="Buscar por título, etiqueta o resumen" autocomplete="off"></label>
        <label><span class="sr-only">Ordenar posts</span><select id="sortSelect" class="sort-select"><option value="newest">Más recientes</option><option value="oldest">Más antiguos</option></select></label>
      </div>
      <div class="cat-filters" role="group" aria-label="Filtrar por categoría">
        <button type="button" class="cat-pill" aria-pressed="true" data-cat="all">Todos <span class="n">${posts.length}</span></button>
${cats.map(([c, n]) => `        <button type="button" class="cat-pill" aria-pressed="false" data-cat="${esc(c)}">${esc(catLabel(c))} <span class="n">${n}</span></button>`).join('\n')}
      </div>
    </div>
  </section>

  <section class="blog-list" aria-label="Posts">
    <p class="post-count" id="postCount" aria-live="polite">${posts.length} ${posts.length === 1 ? 'post' : 'posts'}</p>
    <ul class="post-list" id="postList">
      ${posts.length ? posts.map((p) => postItem(p, 'h2')).join('\n      ') : ''}
    </ul>
    <p class="empty-state" id="emptyState"${posts.length ? ' hidden' : ''}>${posts.length ? 'No hay posts que coincidan con ese filtro.' : 'Todavía no hay posts publicados.'}</p>
  </section>`,
  })
);

for (const p of posts) {
  const url = SITE + p.url;
  write(
    `blog/${p.slug}/index.html`,
    layout({
      title: `${p.title} — ${HANDLE}`,
      description: p.excerpt,
      path: p.url,
      ogType: 'article',
      active: 'blog',
      headExtra: `<meta property="article:published_time" content="${p.date}">\n<meta property="article:author" content="${esc(HANDLE)}">\n${p.tags.map((t) => `<meta property="article:tag" content="${esc(t)}">\n`).join('')}`,
      jsonld: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: p.title,
          description: p.excerpt,
          datePublished: p.date,
          dateModified: p.updated || p.date,
          inLanguage: 'es',
          url,
          mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          image: SITE + '/og-image.png',
          keywords: p.tags.join(', '),
          articleSection: catLabel(p.category),
          author: { '@type': 'Person', name: HANDLE, url: SITE + '/' },
          publisher: { '@type': 'Person', name: HANDLE, url: SITE + '/' },
        },
      ],
      main: `  <article class="article">
    <a class="back-link" href="/blog/">volver al blog</a>
    <header class="article-header">
      <p class="article-cat">${esc(catLabel(p.category))}</p>
      <h1 class="article-title">${esc(p.title)}</h1>
      <p class="post-meta"><time datetime="${p.date}">${fmtDate(p.date)}</time><span aria-hidden="true">·</span><span>${p.minutes} min de lectura</span><span aria-hidden="true">·</span><span>${esc(HANDLE)}</span></p>
      <p class="post-tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</p>
    </header>
    <div class="article-body">
${p.html}
    </div>
    <footer class="article-footer">
      <a class="back-link" href="/blog/">volver al blog</a>
      <a class="link-plain" href="mailto:${esc(EMAIL)}">comentarios por email</a>
    </footer>
  </article>`,
    })
  );
}

write(
  'blog.html',
  `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, follow">
<title>Blog — ${esc(HANDLE)}</title>
<link rel="canonical" href="${SITE}/blog/">
<script src="/assets/js/redirect.js"></script>
<noscript><meta http-equiv="refresh" content="0; url=/blog/"></noscript>
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<main class="page"><p class="moved">El blog se ha movido a <a href="/blog/">/blog/</a>.</p></main>
</body>
</html>
`
);

write(
  '404.html',
  layout({
    title: `404 — ${HANDLE}`,
    description: 'Página no encontrada.',
    path: '/404.html',
    robots: 'noindex',
    main: `  <section class="blog-hero">
    <p class="eyebrow"><span class="dot" aria-hidden="true"></span>error 404</p>
    <h1 class="page-title">Aquí no hay nada</h1>
    <p class="hero-lead">La página que buscas no existe o se ha movido.</p>
    <p class="hero-cta"><a class="btn btn-primary" href="/">Ir al inicio</a><a class="btn" href="/blog/">Ir al blog</a></p>
  </section>`,
  })
);

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rfc822 = (iso) => new Date(iso + 'T00:00:00Z').toUTCString();
write(
  'feed.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(HANDLE)} — blog</title>
    <link>${SITE}/blog/</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Notas, técnicas y writeups de ciberseguridad.</description>
    <language>es</language>
${posts.length ? `    <lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>\n` : ''}${posts
    .map(
      (p) => `    <item>
      <title>${xml(p.title)}</title>
      <link>${SITE}${p.url}</link>
      <guid isPermaLink="true">${SITE}${p.url}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
      <category>${xml(catLabel(p.category))}</category>
      <description>${xml(p.excerpt)}</description>
    </item>`
    )
    .join('\n')}
  </channel>
</rss>
`
);

const latest = posts.length ? posts[0].date : TODAY;
const sm = (loc, lastmod) => `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
write(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[sm('/', TODAY), sm('/blog/', latest), ...posts.map((p) => sm(p.url, p.updated || p.date))].join('\n')}
</urlset>
`
);

write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

const expires = new Date(Date.UTC(BUILD_DATE.getUTCFullYear() + 1, BUILD_DATE.getUTCMonth(), BUILD_DATE.getUTCDate()));
write(
  '.well-known/security.txt',
  [
    `Contact: mailto:${EMAIL}`,
    `Expires: ${expires.toISOString().replace('.000Z', 'Z')}`,
    HAS_PGP ? `Encryption: ${SITE}${PGP_PATH}` : null,
    'Preferred-Languages: es, en',
    `Canonical: ${SITE}/.well-known/security.txt`,
    '',
  ]
    .filter((l) => l !== null)
    .join('\n')
);

console.log(`✓ ${written.length} ficheros generados · ${posts.length} post(s) · PGP: ${HAS_PGP ? 'sí (' + fprPretty + ')' : 'no (no se publica nada de PGP)'}`);
for (const w of warnings) console.log('⚠ ' + w);
if (todos.length) {
  console.log('TODO visibles en la web:');
  for (const t of todos) console.log('  - ' + t);
}
