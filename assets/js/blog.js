(function () {
  'use strict';
  var list = document.getElementById('postList');
  var controls = document.getElementById('blogControls');
  if (!list || !controls) return;
  var cards = Array.prototype.slice.call(list.children);
  var count = document.getElementById('postCount');
  var empty = document.getElementById('emptyState');
  var pills = Array.prototype.slice.call(controls.querySelectorAll('.cat-pill'));
  var state = { cat: 'all', sort: 'newest', q: '' };

  function render() {
    var q = state.q.trim().toLowerCase(), shown = 0;
    cards
      .slice()
      .sort(function (a, b) {
        var d = a.dataset.date < b.dataset.date ? 1 : a.dataset.date > b.dataset.date ? -1 : 0;
        return state.sort === 'newest' ? d : -d;
      })
      .forEach(function (c) {
        var ok = (state.cat === 'all' || c.dataset.cat === state.cat) && (!q || c.dataset.search.indexOf(q) !== -1);
        c.hidden = !ok;
        if (ok) shown++;
        list.appendChild(c);
      });
    count.textContent = shown + (shown === 1 ? ' post' : ' posts');
    if (cards.length) empty.hidden = shown > 0;
  }

  pills.forEach(function (p) {
    p.addEventListener('click', function () {
      state.cat = p.dataset.cat;
      pills.forEach(function (o) { o.setAttribute('aria-pressed', o === p ? 'true' : 'false'); });
      render();
    });
  });
  document.getElementById('searchInput').addEventListener('input', function (e) { state.q = e.target.value; render(); });
  document.getElementById('sortSelect').addEventListener('change', function (e) { state.sort = e.target.value; render(); });
})();
