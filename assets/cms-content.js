/* Public policy projection only. No Administration accounts or credentials are read. */
(function () {
  'use strict';
  const key = 'nirvivad-public-cms-v1';
  function sanitize(html) {
    const allowed = new Set(['p','h2','h3','strong','b','em','i','u','ul','ol','li','br','blockquote','a']);
    const template = document.createElement('template');
    template.innerHTML = String(html || '').slice(0,100000);
    function clean(parent) {
      for (const node of [...parent.childNodes]) {
        if (node.nodeType === 8) { node.remove(); continue; }
        if (node.nodeType !== 1) continue;
        const tag = node.tagName.toLowerCase();
        if (['script','style','iframe','object','embed','svg','math','template'].includes(tag)) { node.remove(); continue; }
        clean(node);
        if (!allowed.has(tag)) { node.replaceWith(...node.childNodes); continue; }
        const href = tag === 'a' ? node.getAttribute('href') : null;
        for (const attribute of [...node.attributes]) node.removeAttribute(attribute.name);
        if (href && /^https?:\/\/[^\s]+$/i.test(href.trim())) {
          node.setAttribute('href',href.trim());
          node.setAttribute('rel','noopener noreferrer');
        }
      }
    }
    clean(template.content);
    return template.innerHTML;
  }
  window.NirvivadCMS = Object.freeze({
    storageKey: key,
    read(page) {
      const slug = page === 'refund' ? 'payment' : page;
      if (!['terms','privacy','payment'].includes(slug)) return null;
      try {
        const record = JSON.parse(localStorage.getItem(key) || '{}')[slug];
        if (!record || typeof record.title !== 'string' || typeof record.content !== 'string') return null;
        return { title: record.title.slice(0,120), content: sanitize(record.content) };
      } catch (_) { return null; }
    }
  });
})();
