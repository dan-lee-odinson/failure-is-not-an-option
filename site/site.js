/* The home page's screenshot viewer: progressive enhancement over the plain image links (homepage v001, doc 39).
   Titles, alternatives and the counter template come from registry.site through the page's gallery-data JSON;
   without JavaScript the links open the full-size images. */
(() => {
  const dialog = document.querySelector('#gallery-dialog');
  const dataEl = document.querySelector('#gallery-data');
  if (!dialog || typeof dialog.showModal !== 'function' || !dataEl) return;
  let data;
  try { data = JSON.parse(dataEl.textContent || '{}'); } catch { return; }
  const shots = Array.isArray(data.shots) ? data.shots : [];
  const counter = typeof data.counter === 'string' ? data.counter : '{current} / {total}';
  if (!shots.length) return;
  let current = 0;
  let opener;
  const render = () => {
    const shot = shots[current];
    const img = document.querySelector('#gallery-image');
    img.src = shot.src; img.alt = shot.alt;
    document.querySelector('#gallery-title').textContent = shot.title;
    document.querySelector('#gallery-count').textContent = counter.replace('{current}', String(current + 1)).replace('{total}', String(shots.length));
  };
  document.querySelectorAll('[data-gallery]').forEach((link) => link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); opener = link; current = Number(link.dataset.gallery) || 0;
    render(); dialog.showModal();
  }));
  const move = (delta) => { current = (current + delta + shots.length) % shots.length; render(); };
  document.querySelector('#previous-shot').addEventListener('click', () => move(-1));
  document.querySelector('#next-shot').addEventListener('click', () => move(1));
  document.querySelector('.close-gallery').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) { const b = dialog.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => opener?.focus());
})();
