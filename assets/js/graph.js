(function () {
  'use strict';
  if (typeof d3 === 'undefined') return;
  var dataEl = document.getElementById('graph-data');
  var svgEl = document.getElementById('graph');
  if (!dataEl || !svgEl) return;
  var data = JSON.parse(dataEl.textContent);

  var COLORS = { core: '#46f2a2', area: '#46f2a2', project: '#5aa9ff', tech: '#e8a23d', cert: '#aab4ba', edu: '#aab4ba', content: '#5aa9ff' };
  var TYPELABEL = { core: 'perfil', area: 'área', project: 'proyecto', tech: 'tecnología', cert: 'certificación', edu: 'formación', content: 'contenido' };
  var HOLLOW = { project: 1, content: 1 };
  var CHAR_W = 6.7;
  var LABEL_H = 16;

  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var svg = d3.select(svgEl);
  var root = svg.append('g');
  var gLink = root.append('g'), gLabel = root.append('g'), gNode = root.append('g');
  var zoom = d3.zoom().scaleExtent([0.4, 2.5]).on('zoom', function (e) { root.attr('transform', e.transform); });
  var sim = null, nodes = [], links = [], adj = {}, node, link, linkLabel, pinned = null, me = null, leaveTimer = null, compact = null;

  function size() { return [svgEl.clientWidth || 600, svgEl.clientHeight || 440]; }

  function build() {
    var W = size()[0];
    var isCompact = W < 560;
    if (isCompact === compact) { fit(false); return; }
    compact = isCompact;
    if (sim) sim.stop();

    var keep = function (n) { return !compact || n.type === 'core' || n.type === 'area' || n.type === 'project' || n.type === 'content'; };
    nodes = data.nodes.filter(keep).map(function (n) { return Object.assign({}, n); });
    var ids = {};
    nodes.forEach(function (n) {
      ids[n.id] = n;
      n.tw = n.label.length * CHAR_W;
      n.cr = Math.max(n.r + 10, n.tw / 2 + 6, n.r + LABEL_H);
    });
    links = data.links.filter(function (l) { return ids[l.source] && ids[l.target]; }).map(function (l) { return { source: l.source, target: l.target, verb: l.verb }; });
    adj = {};
    nodes.forEach(function (n) { adj[n.id] = {}; });
    links.forEach(function (l) { adj[l.source][l.target] = 1; adj[l.target][l.source] = 1; });
    me = ids.me;

    seed();
    var s0 = size(), ar = s0[0] / s0[1];
    sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(function (d) { return d.id; })
        .distance(function (l) { return l.source.cr + l.target.cr + (l.target.type === 'area' ? 34 : 14); }).strength(0.5))
      .force('charge', d3.forceManyBody().strength(compact ? -300 : -380))
      .force('collide', d3.forceCollide().radius(function (d) { return d.cr; }).strength(1).iterations(3))
      .force('x', d3.forceX(0).strength(0.06 / ar))
      .force('y', d3.forceY(0).strength(0.06 * ar))
      .stop();
    for (var i = 0; i < 180; i++) sim.tick();
    sim.on('tick', draw);

    gLink.selectAll('*').remove(); gLabel.selectAll('*').remove(); gNode.selectAll('*').remove();
    link = gLink.selectAll('line').data(links).join('line').attr('class', 'link');
    linkLabel = gLabel.selectAll('text').data(links).join('text').attr('class', 'link-label').text(function (d) { return d.verb; });
    node = gNode.selectAll('g').data(nodes).join('g').attr('class', 'node');
    node.append('circle').attr('r', function (d) { return Math.max(d.r + 12, 22); }).attr('fill', 'transparent');
    node.append('circle').attr('class', 'ring').attr('r', function (d) { return d.r + 6; }).attr('stroke', function (d) { return COLORS[d.type]; }).attr('stroke-width', 1.5);
    node.append('circle').attr('r', function (d) { return d.r; })
      .attr('fill', function (d) { return HOLLOW[d.type] ? '#0a0c0f' : COLORS[d.type]; })
      .attr('stroke', function (d) { return COLORS[d.type]; })
      .attr('stroke-width', function (d) { return HOLLOW[d.type] ? 2 : 0; });
    node.append('text').attr('y', function (d) { return d.r + 14; }).text(function (d) { return d.label; });

    node.on('click', function (e, d) { e.stopPropagation(); clearTimeout(leaveTimer); pinned = d; highlight(d, false); });
    if (!coarse) {
      node.on('mouseenter', function (e, d) { clearTimeout(leaveTimer); highlight(d, false); })
        .on('mouseleave', function () { clearTimeout(leaveTimer); leaveTimer = setTimeout(function () { highlight(pinned, pinned === me); }, 160); })
        .call(d3.drag()
          .on('start', function (e, d) { if (!e.active) sim.alphaTarget(0.25).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', function (e, d) { d.fx = e.x; d.fy = e.y; })
          .on('end', function (e, d) { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
    }

    pinned = me;
    draw();
    highlight(me, true);
    fit(false);
  }

  function seed() {
    var kids = {}, seen = { me: 1 };
    links.forEach(function (l) { (kids[l.source] = kids[l.source] || []).push(l.target); });
    var place = function (id, a0, a1, depth) {
      var list = (kids[id] || []).filter(function (k) { return !seen[k]; });
      list.forEach(function (k) { seen[k] = 1; });
      list.forEach(function (k, i) {
        var n = nodes.filter(function (x) { return x.id === k; })[0];
        var w = (a1 - a0) / list.length, a = a0 + w * (i + 0.5);
        n.x = Math.cos(a) * depth * 120; n.y = Math.sin(a) * depth * 120;
        place(k, a - w / 2, a + w / 2, depth + 1);
      });
    };
    me.x = 0; me.y = 0;
    place('me', -Math.PI / 2, Math.PI * 1.5, 1);
  }

  function draw() {
    link.attr('x1', function (d) { return d.source.x; }).attr('y1', function (d) { return d.source.y; })
      .attr('x2', function (d) { return d.target.x; }).attr('y2', function (d) { return d.target.y; });
    linkLabel.attr('x', function (d) { return d.source.x + (d.target.x - d.source.x) * 0.6; })
      .attr('y', function (d) { return d.source.y + (d.target.y - d.source.y) * 0.6 - 4; });
    node.attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });
  }

  function fit(animate) {
    var s = size(), W = s[0], H = s[1], pad = 18, top = 58;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    nodes.forEach(function (n) {
      var hw = Math.max(n.r, n.tw / 2) + 4;
      x0 = Math.min(x0, n.x - hw); x1 = Math.max(x1, n.x + hw);
      y0 = Math.min(y0, n.y - n.r - 4); y1 = Math.max(y1, n.y + n.r + LABEL_H + 4);
    });
    var k = Math.min((W - pad * 2) / (x1 - x0), (H - top - pad) / (y1 - y0), 1.2);
    var t = d3.zoomIdentity.translate(W / 2 - k * (x0 + x1) / 2, (H + top - pad) / 2 - k * (y0 + y1) / 2).scale(k);
    (animate ? svg.transition().duration(300) : svg).call(zoom.transform, t);
  }

  function highlight(d, soft) {
    svg.classed('soft', !!soft);
    node.classed('hot', function (n) { return n.id === d.id; }).classed('dim', function (n) { return n.id !== d.id && !adj[d.id][n.id]; });
    link.classed('hot', function (l) { return l.source.id === d.id || l.target.id === d.id; })
      .classed('dim', function (l) { return l.source.id !== d.id && l.target.id !== d.id; });
    linkLabel.classed('show', function (l) { return !soft && (l.source.id === d.id || l.target.id === d.id); });
    showPanel(d);
  }

  function showPanel(d) {
    document.getElementById('pcSw').className = 'sw sw-' + d.type;
    document.getElementById('pcType').textContent = TYPELABEL[d.type];
    document.getElementById('pcName').textContent = d.label;
    document.getElementById('pcDesc').textContent = d.desc || '';
    var rels = document.getElementById('pcRels');
    rels.textContent = '';
    links.forEach(function (l) {
      if (l.source.id !== d.id && l.target.id !== d.id) return;
      var out = l.source.id === d.id, other = out ? l.target : l.source;
      var li = document.createElement('li'), v = document.createElement('span'), t = document.createElement('span');
      v.className = 'v'; v.textContent = l.verb; t.className = 't'; t.textContent = other.label;
      li.append(out ? '→ ' : '← ', v, ' ', t);
      rels.appendChild(li);
    });
    var lk = document.getElementById('pcLink');
    if (d.href) {
      lk.hidden = false; lk.href = d.href; lk.textContent = d.cta + (d.ext ? ' ↗' : ' →');
      if (d.ext) { lk.target = '_blank'; lk.rel = 'noopener noreferrer'; } else { lk.removeAttribute('target'); lk.removeAttribute('rel'); }
    } else { lk.hidden = true; lk.removeAttribute('href'); }
  }

  if (coarse) svg.on('click', function () { pinned = me; highlight(me, true); });
  else svg.call(zoom).on('dblclick.zoom', null).on('click', function () { pinned = me; highlight(me, true); });
  d3.select('#zoomIn').on('click', function () { svg.transition().duration(200).call(zoom.scaleBy, 1.3); });
  d3.select('#zoomOut').on('click', function () { svg.transition().duration(200).call(zoom.scaleBy, 1 / 1.3); });
  d3.select('#zoomReset').on('click', function () { fit(true); });

  build();
  document.getElementById('graphWrap').classList.add('graph-ready');
  var rt = null;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 150); });
})();
