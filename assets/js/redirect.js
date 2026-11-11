(function () {
  var m = location.hash.match(/^#post\/([a-z0-9-]+)\/?$/i);
  var old = /\/blog\.html$/.test(location.pathname);
  if (m) location.replace('/blog/' + m[1].toLowerCase() + '/');
  else if (old) location.replace('/blog/');
  addEventListener('hashchange', function () {
    var h = location.hash.match(/^#post\/([a-z0-9-]+)\/?$/i);
    if (h) location.replace('/blog/' + h[1].toLowerCase() + '/');
  });
})();
