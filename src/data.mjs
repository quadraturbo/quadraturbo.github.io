export const profile = {
  role: 'pentester junior / estudiante ASIR',
  tagline:
    'Estudio ASIR y me preparo para trabajar en seguridad ofensiva. Reproduzco vulnerabilidades conocidas en laboratorio propio, escribo herramientas pequeñas y documento lo que aprendo.',
  location: 'ES',
  availability: 'disponible',
  graphDesc:
    'Técnico en SMR y estudiante de ASIR. Seguridad ofensiva, redes y desarrollo de herramientas.',
  bio: 'Soy técnico en <strong>SMR</strong> y estudiante de <strong>ASIR</strong>, centrado en <strong>seguridad ofensiva</strong> y <strong>redes</strong>. Me interesa entender cómo funcionan los sistemas para encontrar formas de securizarlos, o de romperlos en un entorno controlado. Trabajo en configuración de infraestructuras, auditoría de seguridad y desarrollo de herramientas propias.',
  knowsAbout: [
    'Penetration testing',
    'Seguridad de redes',
    'Active Directory',
    'Análisis forense digital',
    'Desarrollo de herramientas de seguridad',
  ],
};

export const languages = {
  python: { label: 'Python', color: '#3572a5', desc: 'Lenguaje principal para herramientas y automatización.' },
  rust: { label: 'Rust', color: '#b7410e', desc: 'Para herramientas de sistema de bajo nivel.' },
};

export const projects = [
  {
    id: 'iprot',
    name: 'IPROT',
    area: 'desarrollo',
    lang: 'python',
    license: 'GPL-3.0',
    repo: 'https://github.com/quadraturbo/IPROT',
    problem: 'Rotar la IP de salida por Tor obliga a gestionar a mano cadenas de proxy.',
    solution: 'Script que rota la IP automáticamente a través de la red Tor.',
    desc: 'Rotación automática de IP a través de la red Tor, sin gestión manual de cadenas de proxy. Un ejercicio práctico de anonimato de red y automatización.',
    demo: null,
  },
  {
    id: 'wifi-optimizer',
    name: 'wifi-optimizer',
    area: 'redes',
    lang: 'rust',
    license: null,
    repo: null,
    problem: 'Diagnosticar y optimizar una red inalámbrica en Windows desde la terminal.',
    solution: 'CLI en Rust sobre la Windows Native Wi-Fi API.',
    desc: 'CLI en Rust para diagnóstico y optimización de red inalámbrica sobre la Windows Native Wi-Fi API, aplicando principios de ingeniería RF.',
    demo: null,
  },
  {
    id: 'cryptenv-cli',
    name: 'cryptenv-cli',
    area: 'desarrollo',
    lang: 'python',
    license: 'MIT',
    pypi: true,
    repo: 'https://github.com/quadraturbo/cryptenv-cli',
    problem: 'Los ficheros .env guardan secretos en texto plano en disco.',
    solution: 'Cifrado AES-256-GCM con la clave en el keyring del sistema operativo.',
    desc: 'Herramienta Python para cifrar ficheros .env con AES-256-GCM e integración con el keyring del sistema operativo.',
    demo: null,
  },
  {
    id: 'integrity-checker',
    name: 'integrity-checker',
    area: 'forense',
    lang: 'python',
    license: 'GPL-3.0',
    repo: 'https://github.com/quadraturbo/integrity-checker',
    problem: 'Comprobar a mano la integridad de muchos archivos es lento y propenso a errores.',
    solution: 'Verificación masiva por hash, detección de manipulaciones e informe.',
    desc: 'Suite forense para verificación masiva de integridad de archivos: detección de manipulaciones y generación de informes.',
    demo: null,
  },
];

export const areas = [
  {
    id: 'ofensiva',
    label: 'Ofensiva',
    title: 'Seguridad ofensiva',
    desc: 'Pentesting web, reconocimiento y enumeración, explotación en laboratorio y Active Directory.',
    focus: [
      'Pentesting web y de aplicaciones',
      'Reconocimiento y enumeración',
      'Explotación en entornos de laboratorio',
      'Active Directory: ataques y defensa',
    ],
    tools: [
      { id: 'burp', name: 'Burp Suite', cat: 'web · proxy', graph: true, desc: 'Proxy y pruebas de aplicaciones web.' },
      { id: 'nmap', name: 'Nmap / Masscan', short: 'nmap', cat: 'reconocimiento · red', graph: true, desc: 'Reconocimiento y escaneo de red.' },
      { id: 'bloodhound', name: 'BloodHound', cat: 'AD · grafos', graph: true, desc: 'Análisis de rutas de ataque en Active Directory.' },
      { name: 'Metasploit', cat: 'explotación · post' },
      { name: 'NetExec', cat: 'lateral · SMB' },
      { name: 'ffuf', cat: 'fuzzing · web' },
      { name: 'SQLMap', cat: 'inyección · BD' },
      { name: 'Proxmark3', cat: 'RFID · NFC' },
    ],
    base: ['pentesting web', 'OSINT'],
  },
  {
    id: 'redes',
    label: 'Redes',
    title: 'Redes e infraestructura',
    desc: 'Auditoría y segmentación, administración Linux/Windows, análisis de tráfico y protocolos.',
    focus: [
      'Auditoría y segmentación de redes',
      'Administración de sistemas Linux / Windows',
      'Análisis de tráfico y protocolos',
      'Laboratorios virtualizados',
    ],
    tools: [{ name: 'Wireshark', cat: 'captura · análisis' }],
    base: ['Linux / Bash', 'redes / Cisco', 'Windows Server', 'PowerShell', 'Hyper-V', 'Docker'],
  },
  {
    id: 'desarrollo',
    label: 'Desarrollo',
    title: 'Desarrollo de herramientas',
    desc: 'Desarrollo de herramientas propias de seguridad y automatización de tareas.',
    focus: ['Desarrollo de herramientas de seguridad', 'Automatización con Python'],
    tools: [{ name: 'Ghidra', cat: 'reversing · análisis' }],
    base: ['Python', 'Rust'],
  },
  {
    id: 'forense',
    label: 'Forense',
    title: 'Forense digital',
    desc: 'Verificación de integridad y análisis forense digital.',
    focus: ['Verificación de integridad', 'Análisis forense digital'],
    tools: [
      { name: 'Volatility', cat: 'forense · memoria' },
      { name: 'Autopsy', cat: 'forense · disco' },
    ],
    base: ['forense digital'],
  },
];

export const education = [
  { id: 'smr', short: 'SMR', name: 'Sistemas Microinformáticos y Redes', period: '2024 — 2026', state: 'done', status: 'titulado', graph: true, verb: 'titulado en', desc: 'Técnico en Sistemas Microinformáticos y Redes. Titulado.' },
  { id: 'asir', short: 'ASIR', name: 'Administración de Sistemas Informáticos en Red', period: '2026 — actualidad', state: 'wip', status: 'cursando', graph: true, verb: 'cursa', desc: 'Administración de Sistemas Informáticos en Red. Cursando.' },
  { id: 'ceti', short: 'CETI', name: 'Especialización en Ciberseguridad', period: 'próximamente', state: 'plan', status: 'planificado', graph: false },
];

export const certs = [
  { id: 'ceh-cisco', name: 'Cisco Ethical Hacking (NetAcad)', short: 'Ethical Hacking', area: 'ofensiva', done: true, desc: 'Cisco Networking Academy: Ethical Hacking.' },
  { id: 'cyberops', name: 'CyberOps Associate', short: 'CyberOps', area: 'redes', done: true, desc: 'Cisco CyberOps Associate.' },
  { id: 'ccna', name: 'CCNA', short: 'CCNA', area: 'redes', done: true, desc: 'Cisco Certified Network Associate.' },
  { id: 'go-basic', name: 'Go Basic (HackerRank)', short: 'Go Basic', area: 'desarrollo', done: true, desc: 'HackerRank: Go (Basic).' },
  { id: 'ejpt', name: 'eJPTv2', short: 'eJPTv2', area: 'ofensiva', done: false, note: 'en curso', desc: 'Junior Penetration Tester (INE). En curso.' },
];

export const reading = [
  { title: "The Web Application Hacker's Handbook", by: 'Stuttard & Pinto', tag: 'web' },
  { title: 'Hacking: The Art of Exploitation', by: 'Jon Erickson', tag: 'bajo nivel' },
  { title: 'The Hacker Playbook 3', by: 'Peter Kim', tag: 'red team' },
  { title: 'Penetration Testing', by: 'Georgia Weidman', tag: 'pentesting' },
  { title: 'Phrack Magazine', by: 'phrack.org', tag: 'zine' },
  { title: 'PortSwigger Web Security Academy', by: 'portswigger.net', tag: 'labs' },
  { title: 'HackTricks', by: 'book.hacktricks.xyz', tag: 'referencia' },
];

export const refRepos = [
  { name: 'SecLists', desc: 'Colección de wordlists para fuzzing, credenciales y reconocimiento.', lang: 'txt' },
  { name: 'impacket', desc: 'Scripts Python para protocolos de red Windows: SMB, Kerberos, NTLM.', lang: 'python' },
  { name: 'PayloadsAllTheThings', desc: 'Payloads y bypasses para pruebas de seguridad y CTF.', lang: 'md' },
  { name: 'PEASS-ng', desc: 'Escalada de privilegios: LinPEAS / WinPEAS.', lang: 'bash / ps1' },
  { name: 'mimikatz', desc: 'Extracción de credenciales y manipulación de autenticación Windows.', lang: 'c' },
];

export const now = [
  {
    label: 'Estudiando',
    items: [
      { text: 'ASIR: módulos de infraestructura y redes', sub: 'en curso' },
      { text: 'eJPTv2', sub: 'certificación en curso' },
      { text: 'Active Directory: ataques y defensa', sub: 'Kerberoasting · Pass-the-Hash · BloodHound' },
      { text: 'Análisis de tráfico y protocolos', sub: 'Wireshark · disección manual de capturas' },
    ],
  },
  {
    label: 'Trabajando en',
    items: [
      { text: 'cryptenv-cli: próxima versión', sub: 'mejoras de integración con keyring' },
      { text: 'Automatización de auditorías con Python', sub: 'scripting · informes automatizados' },
      { text: 'Laboratorio Hyper-V + pfSense', sub: 'segmentación · pruebas de pivoting' },
    ],
  },
  {
    label: 'Después',
    items: [
      { text: 'ICCA: INE Certified Cloud Associate', sub: 'certificación en preparación' },
      { text: 'CETI: especialización en ciberseguridad', sub: 'planificado' },
    ],
  },
];

export const blogIntro =
  'Writeups, técnicas y apuntes. Reconstruyo vulnerabilidades desde el advisory en laboratorio propio, sin copiar y pegar PoC.';

export const categoryLabels = {
  'active-directory': 'Active Directory',
  web: 'Web',
  osint: 'OSINT',
  redes: 'Redes',
  forense: 'Forense',
  malware: 'Malware',
  crypto: 'Criptografía',
  hardware: 'Hardware',
  herramientas: 'Herramientas',
  ctf: 'CTF',
};

export function buildGraph(handle) {
  const nodes = [];
  const links = [];
  const add = (n) => nodes.push(n);
  const link = (source, target, verb) => links.push({ source, target, verb });

  add({ id: 'me', label: handle, type: 'core', r: 20, desc: profile.graphDesc });

  for (const a of areas) {
    add({ id: a.id, label: a.label, type: 'area', r: 13, desc: a.desc, href: '/#stack', cta: 'ver sección' });
    link('me', a.id, 'se centra en');
    for (const t of a.tools.filter((t) => t.graph)) {
      add({ id: t.id, label: t.short || t.name, type: 'tech', r: 8, desc: t.desc });
      link(a.id, t.id, 'usa');
    }
  }

  const usedLangs = new Set();
  for (const p of projects) {
    add({ id: p.id, label: p.name, type: 'project', r: 9, desc: p.desc, href: p.repo || '/#proyectos', cta: p.repo ? 'ver repo' : 'ver proyecto', ext: !!p.repo });
    link(p.area, p.id, 'produce');
    if (!usedLangs.has(p.lang)) {
      usedLangs.add(p.lang);
      add({ id: 'lang-' + p.lang, label: languages[p.lang].label, type: 'tech', r: 8, desc: languages[p.lang].desc });
    }
    link(p.id, 'lang-' + p.lang, 'escrito en');
  }

  for (const c of certs) {
    add({ id: c.id, label: c.short, type: 'cert', r: 8, desc: c.desc, href: '/#formacion', cta: 'ver sección' });
    link(c.area, c.id, c.done ? 'certificado por' : 'prepara');
  }
  for (const e of education.filter((e) => e.graph)) {
    add({ id: e.id, label: e.short, type: 'edu', r: 8, desc: e.desc, href: '/#formacion', cta: 'ver sección' });
    link('me', e.id, e.verb);
  }

  add({ id: 'blog', label: 'blog', type: 'content', r: 8, desc: 'Notas, técnicas y writeups de ciberseguridad.', href: '/blog/', cta: 'abrir' });
  link('me', 'blog', 'escribe');

  return { nodes, links };
}
