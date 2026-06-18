document.addEventListener('DOMContentLoaded', function () {
  // Convert anchors to JS-driven links so the browser won't show the href
  // in the status hover. This converts both internal and external links.
  function convertAnchor(a) {
    if (!a || !a.getAttribute) return;
    if (a.classList.contains('no-status-exempt') || a.hasAttribute('data-preserve-href')) return;
    var href = a.getAttribute('href');
    if (!href) return;
    // Skip fragments and non-http(s) schemes where browser behavior is expected
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

    var target = a.getAttribute('target');

    a.setAttribute('data-href', href);
    a.removeAttribute('href');
    a.setAttribute('role', 'link');
    a.setAttribute('tabindex', '0');

    function navigate() {
      var url = a.getAttribute('data-href');
      if (target === '_blank') {
        window.open(url, '_blank');
      } else {
        window.location.href = url;
      }
    }

    a.addEventListener('click', function (e) {
      e.preventDefault();
      navigate();
    });
    a.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        navigate();
      }
    });
    a.classList.add('no-status');
  }

  // Initial conversion
  document.querySelectorAll('a[href]').forEach(convertAnchor);

  // Watch for dynamically added links and convert them too
  if (window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes && m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.tagName === 'A') convertAnchor(node);
          var nested = node.querySelectorAll && node.querySelectorAll('a[href]');
          nested && nested.forEach && nested.forEach(convertAnchor);
        });
      });
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
  }
});
