/* Turan Asia — галерея с полноэкранным просмотром.
   Подключать после api.js.

   Использование:
     view.innerHTML = TAG.html(photos, title) + ...;
     TAG.bind(view, photos);

   Отдельные картинки можно открывать без сетки:
     TAG.bind(container, arrayOfUrls);   // клик по любому <img> внутри
*/
window.TAG = (function () {
  'use strict';

  var box = null, imgEl = null, counter = null;
  var list = [], idx = 0;

  /* ---------- разметка сетки ---------- */

  function html(photos, alt) {
    photos = photos || [];
    var main = photos[0] || '';
    if (!main) return '';

    var thumbs = photos.slice(1, 5);
    var hidden = photos.length - 5;           // сколько не поместилось

    return '<div class="gallery" data-gal>' +
      '<div class="gmain" data-i="0"><img src="' + TA.esc(main) + '" alt="' + TA.esc(alt || '') + '"></div>' +
      thumbs.map(function (u, n) {
        var last = (n === thumbs.length - 1) && hidden > 0;
        return '<div class="gthumb" data-i="' + (n + 1) + '">' +
          '<img src="' + TA.esc(u) + '" alt="">' +
          (last ? '<span class="gmore">+' + hidden + '</span>' : '') +
          '</div>';
      }).join('') +
      '</div>';
  }

  /* ---------- полноэкранный просмотр ---------- */

  function ensureBox() {
    if (box) return;
    box = document.createElement('div');
    box.className = 'lbx';
    box.hidden = true;
    box.innerHTML =
      '<button class="lbx-btn lbx-close" type="button" aria-label="' + TA.t('lb_close') + '">&times;</button>' +
      '<button class="lbx-btn lbx-prev" type="button" aria-label="' + TA.t('lb_prev') + '">&#8249;</button>' +
      '<img alt="">' +
      '<button class="lbx-btn lbx-next" type="button" aria-label="' + TA.t('lb_next') + '">&#8250;</button>' +
      '<div class="lbx-count"></div>';
    document.body.appendChild(box);

    imgEl = box.querySelector('img');
    counter = box.querySelector('.lbx-count');

    box.querySelector('.lbx-close').addEventListener('click', close);
    box.querySelector('.lbx-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    box.querySelector('.lbx-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    // клик по фону закрывает, по самой картинке — нет
    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });

    // свайп на телефоне
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      x0 = null;
    }, { passive: true });
  }

  function show() {
    imgEl.src = list[idx];
    counter.textContent = (idx + 1) + ' / ' + list.length;
    var many = list.length > 1;
    box.querySelector('.lbx-prev').style.display = many ? '' : 'none';
    box.querySelector('.lbx-next').style.display = many ? '' : 'none';
    counter.style.display = many ? '' : 'none';
  }

  function step(d) {
    idx = (idx + d + list.length) % list.length;
    show();
  }

  function open(photos, i) {
    if (!photos || !photos.length) return;
    ensureBox();
    list = photos;
    idx = Math.max(0, Math.min(i || 0, photos.length - 1));
    show();
    box.hidden = false;
    document.body.style.overflow = 'hidden';   // фон не скроллится
  }

  function close() {
    box.hidden = true;
    document.body.style.overflow = '';
    imgEl.src = '';
  }

  /* ---------- привязка кликов ---------- */

  /** Делегированный обработчик: клик по любой картинке внутри root открывает просмотр. */
  function bind(root, photos) {
    if (!root) return;
    root.addEventListener('click', function (e) {
      var cell = e.target.closest('[data-i]');
      if (cell && root.contains(cell)) {
        e.preventDefault();
        open(photos, parseInt(cell.getAttribute('data-i'), 10) || 0);
        return;
      }
      // галерея без сетки (например, страница Байконура)
      var img = e.target.closest('img');
      if (img && root.contains(img)) {
        var all = Array.prototype.map.call(root.querySelectorAll('img'), function (n) { return n.src; });
        e.preventDefault();
        open(photos && photos.length ? photos : all, all.indexOf(img.src));
      }
    });
  }

  return { html: html, bind: bind, open: open };
})();
