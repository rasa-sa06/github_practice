/* Header menu.
   The button is markup-hidden until this script runs, so a browser without
   JavaScript never shows a control that cannot open anything — the footer
   navigation is the way around the site in that case. */
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;

  var button = header.querySelector('.menu-btn');
  var menu = header.querySelector('.site-menu');
  if (!button || !menu) return;

  button.hidden = false;

  function setOpen(open) {
    header.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  }

  button.addEventListener('click', function () {
    setOpen(!header.classList.contains('is-open'));
  });

  document.addEventListener('click', function (event) {
    if (!header.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !header.classList.contains('is-open')) return;
    setOpen(false);
    button.focus();
  });
})();
