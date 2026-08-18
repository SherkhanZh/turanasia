/* Turan Asia — галерея с полноэкранным просмотром фото и видео.
   Подключать после api.js.

   Использование:
     var media = TAG.media(photos, videos);       // фото и видео в одной ленте
     view.innerHTML = TAG.html(media, title) + ...;
     TAG.bind(view, media);

   В bind можно передать и обычный массив ссылок на картинки — тогда всё
   считается фотографиями (так работает галерея на странице Байконура).
*/
window.TAG = (function () {
  'use strict';

  var box = null, stage = null, counter = null;
  var list = [], idx = 0;

  /* ---------- разбор ссылок на видео ---------- */

  var YT = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/i;
  var VIMEO = /vimeo\.com\/(?:video\/)?(\d+)/i;
  var RUTUBE = /rutube\.ru\/(?:video|play\/embed)\/([\w-]+)/i;
  var FILE = /\.(mp4|webm|ogv|ogg|mov)(\?|#|$)/i;

  /** Ссылка на видео → как его показать и что взять для превью. */
  function video(url) {
    url = String(url || '').trim();
    var m = url.match(YT);
    if (m) {
      return {
        type: 'video', kind: 'embed', url: url,
        embed: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0',
        thumb: 'https://img.youtube.com/vi/' + m[1] + '/hqdefault.jpg'
      };
    }
    m = url.match(VIMEO);
    if (m) {
      return {
        type: 'video', kind: 'embed', url: url,
        embed: 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1',
        thumb: null
      };
    }
    m = url.match(RUTUBE);
    if (m) {
      return {
        type: 'video', kind: 'embed', url: url,
        embed: 'https://rutube.ru/play/embed/' + m[1] + '/?autoStart=true',
        thumb: null
      };
    }
    if (FILE.test(url)) {
      return { type: 'video', kind: 'file', url: url, embed: null, thumb: null };
    }
    // Неизвестный сервис — покажем ссылкой, встроить не получится
    return { type: 'video', kind: 'link', url: url, embed: null, thumb: null };
  }

  /** Фото и видео в единый список для галереи. */
  function media(photos, videos) {
    var out = [];
    (photos || []).forEach(function (u) {
      if (u) out.push({ type: 'image', url: String(u) });
    });
    (videos || []).forEach(function (u) {
      if (u) out.push(video(u));
    });
    return out;
  }

  /** Строки в списке считаем фотографиями. */
  function normalize(items) {
    return (items || []).map(function (it) {
      return typeof it === 'string' ? { type: 'image', url: it } : it;
    });
  }

  /* ---------- разметка сетки ---------- */

  var PLAY = '<span class="play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>';

  /** Картинка для плитки: у видео без превью — тёмная заливка вместо фото. */
  function tile(item) {
    if (item.type === 'image') {
      return '<img src="' + TA.esc(item.url) + '" alt="">';
    }
    return item.thumb
      ? '<img src="' + TA.esc(item.thumb) + '" alt="">' + PLAY
      : '<span class="vid-bg"></span>' + PLAY;
  }

  function html(items, alt) {
    items = normalize(items);
    if (!items.length) return '';

    var thumbs = items.slice(1, 5);
    var hidden = items.length - 5;

    var main = items[0].type === 'image'
      ? '<img src="' + TA.esc(items[0].url) + '" alt="' + TA.esc(alt || '') + '">'
      : tile(items[0]);

    return '<div class="gallery" data-gal>' +
      '<div class="gmain" data-i="0">' + main + '</div>' +
      thumbs.map(function (it, n) {
        var last = (n === thumbs.length - 1) && hidden > 0;
        return '<div class="gthumb" data-i="' + (n + 1) + '">' +
          tile(it) +
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
      '<div class="lbx-stage"></div>' +
      '<button class="lbx-btn lbx-next" type="button" aria-label="' + TA.t('lb_next') + '">&#8250;</button>' +
      '<div class="lbx-count"></div>';
    document.body.appendChild(box);

    stage = box.querySelector('.lbx-stage');
    counter = box.querySelector('.lbx-count');

    box.querySelector('.lbx-close').addEventListener('click', close);
    box.querySelector('.lbx-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    box.querySelector('.lbx-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    // клик по фону закрывает, по самому содержимому — нет
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target === stage) close();
    });

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
    var it = list[idx];

    if (it.type === 'image') {
      stage.innerHTML = '<img src="' + TA.esc(it.url) + '" alt="">';
    } else if (it.kind === 'embed') {
      stage.innerHTML = '<div class="lbx-video"><iframe src="' + TA.esc(it.embed) +
        '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen frameborder="0"></iframe></div>';
    } else if (it.kind === 'file') {
      stage.innerHTML = '<video src="' + TA.esc(it.url) + '" controls autoplay playsinline></video>';
    } else {
      stage.innerHTML = '<p class="lbx-link"><a href="' + TA.esc(it.url) + '" target="_blank" rel="noopener">' +
        TA.esc(it.url) + '</a></p>';
    }

    counter.textContent = (idx + 1) + ' / ' + list.length;
    var many = list.length > 1;
    box.querySelector('.lbx-prev').style.display = many ? '' : 'none';
    box.querySelector('.lbx-next').style.display = many ? '' : 'none';
    counter.style.display = many ? '' : 'none';
  }

  function step(d) {
    idx = (idx + d + list.length) % list.length;
    show();   // содержимое пересоздаётся, поэтому предыдущее видео останавливается
  }

  function open(items, i) {
    items = normalize(items);
    if (!items.length) return;
    ensureBox();
    list = items;
    idx = Math.max(0, Math.min(i || 0, items.length - 1));
    show();
    box.hidden = false;
    document.body.style.overflow = 'hidden';   // фон не скроллится
  }

  function close() {
    box.hidden = true;
    document.body.style.overflow = '';
    stage.innerHTML = '';                      // останавливаем воспроизведение
  }

  /* ---------- привязка кликов ---------- */

  function bind(root, items) {
    if (!root) return;
    var norm = normalize(items);
    root.addEventListener('click', function (e) {
      var cell = e.target.closest('[data-i]');
      if (cell && root.contains(cell)) {
        e.preventDefault();
        open(norm, parseInt(cell.getAttribute('data-i'), 10) || 0);
        return;
      }
      // галерея без сетки (например, страница Байконура)
      var img = e.target.closest('img');
      if (img && root.contains(img)) {
        var all = Array.prototype.map.call(root.querySelectorAll('img'), function (n) { return n.src; });
        e.preventDefault();
        open(norm.length ? norm : all, all.indexOf(img.src));
      }
    });
  }

  return { html: html, bind: bind, open: open, media: media, video: video };
})();
