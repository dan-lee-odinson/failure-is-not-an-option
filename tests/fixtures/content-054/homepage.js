/* Progressive enhancement: image links and demo navigation work without JavaScript. */
(() => {
  const dialog = document.querySelector('#gallery-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const shots = [
    {src:'./site-assets/screenshot-program.webp', title:'Before the call — Gemini program', alt:'The Gemini program prologue in the playable game.'},
    {src:'./site-assets/screenshot-crisis.webp', title:'The loop comes alive — crew report', alt:'Jim Lovell’s CAPCOM portrait and relay of the crew report in Mission Control.'},
    {src:'./site-assets/screenshot-return.webp', title:'The weight of the call — return planning', alt:'Controllers’ reports, evidence and the two return orders in the Gemini VIII scenario.'}
  ];
  let current = 0;
  let opener;
  const render = () => {
    const shot = shots[current];
    const img = document.querySelector('#gallery-image');
    img.src = shot.src; img.alt = shot.alt;
    document.querySelector('#gallery-title').textContent = shot.title;
    document.querySelector('#gallery-count').textContent = `${current+1} / ${shots.length}`;
  };
  document.querySelectorAll('[data-gallery]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); opener = link; current = Number(link.dataset.gallery);
    render(); dialog.showModal();
  }));
  const move = delta => { current = (current + delta + shots.length) % shots.length; render(); };
  document.querySelector('#previous-shot').addEventListener('click', () => move(-1));
  document.querySelector('#next-shot').addEventListener('click', () => move(1));
  document.querySelector('.close-gallery').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const b=dialog.getBoundingClientRect(); if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => opener?.focus());
})();
