(function () {
  var d = document.documentElement;
  d.classList.add('js');
  try {
    if (location.pathname !== '/' && location.pathname !== '/index.html') return;
    if (sessionStorage.getItem('qt-boot')) return;
    sessionStorage.setItem('qt-boot', '1');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    d.classList.add('boot');
    var done = function () {
      d.classList.remove('boot');
      clearTimeout(timer);
      removeEventListener('pointerdown', done, true);
      removeEventListener('keydown', done, true);
    };
    var timer = setTimeout(done, 360);
    addEventListener('pointerdown', done, true);
    addEventListener('keydown', done, true);
  } catch (e) {
    d.classList.remove('boot');
  }
})();
