/* Turan Asia — главная страница.
   Карусель в шапке, плитки «Куда отправимся» и подборка популярных туров
   берутся из админки. Если раздел не заполнен, на месте остаётся то, что
   зашито в вёрстке, — страница не должна пустеть из-за пустой настройки.
   Подключать после api.js и site.js. */
(function () {
  'use strict';

  var T = {
    ru: { days: 'дн.', from: 'от', more: 'Подробнее', onReq: 'Под запрос', group: 'Группа' },
    kz: { days: 'күн', from: 'бастап', more: 'Толығырақ', onReq: 'Сұраныс бойынша', group: 'Топ' },
    en: { days: 'days', from: 'from', more: 'Details', onReq: 'On request', group: 'Group' }
  };
  var t = T[(window.TA && TA.lang()) || 'ru'] || T.ru;

  /* ---------- карусель в шапке ---------- */
  function slider() {
    var sl = document.getElementById('heroSlider');
    if (!sl) return;
    var slides = sl.querySelector('.slides');
    var dots = sl.querySelector('.sl-dots');
    var n = slides.children.length, i = 0, timer;
    if (!n) return;

    dots.innerHTML = '';
    for (var k = 0; k < n; k++) {
      var s = document.createElement('span');
      if (!k) s.className = 'on';
      dots.appendChild(s);
    }

    function go(x) {
      i = (x + n) % n;
      slides.style.transform = 'translateX(-' + i * 100 + '%)';
      [].forEach.call(dots.children, function (d, j) { d.classList.toggle('on', j === i); });
    }
    function reset() { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 4500); }

    sl.querySelector('.next').onclick = function () { go(i + 1); reset(); };
    sl.querySelector('.prev').onclick = function () { go(i - 1); reset(); };
    dots.onclick = function (e) {
      var j = [].indexOf.call(dots.children, e.target);
      if (j >= 0) { go(j); reset(); }
    };
    go(0); reset();
  }

  /* ---------- карточка тура ---------- */
  function card(x) {
    var url = 'tour.html?slug=' + encodeURIComponent(x.slug);
    var img = x.photo || '';
    var pill = [
      x.duration_days ? x.duration_days + ' ' + t.days : '',
      x.date_mode === 'on_request' ? t.onReq : t.group
    ].filter(Boolean).join(' · ');

    return '<article class="tc">' +
      '<a href="' + url + '"><div class="ph">' +
        (img ? '<img src="' + TA.esc(img) + '" alt="' + TA.esc(x.title) + '">' : '<img alt="">') +
        (pill ? '<span class="pill">' + TA.esc(pill) + '</span>' : '') +
      '</div></a>' +
      '<div class="b"><h4><a href="' + url + '">' + TA.esc(x.title) + '</a></h4>' +
      '<div class="d">' + TA.esc(x.short_description || '') + '</div>' +
      '<div class="foot"><div class="p">' +
        (x.price ? '<small>' + t.from + '</small><b>' + TA.money(x.price, x.currency) + '</b>' : '') +
      '</div><a class="btn btn-pri" href="' + url + '">' + t.more + '</a></div></div></article>';
  }

  /* ---------- данные из админки ---------- */
  function fill(data) {
    // Шапка: карусель целиком заменяется загруженными снимками.
    var slides = document.querySelector('#heroSlider .slides');
    if (slides && data.slider && data.slider.length) {
      slides.innerHTML = data.slider.map(function (u) {
        return '<img src="' + TA.esc(u) + '" alt="">';
      }).join('');
    }

    // «Куда отправимся»: меняем только картинку, ссылки и подписи остаются.
    (data.destinations || []).forEach(function (d) {
      if (!d || !d.key || !d.image) return;
      var img = document.querySelector('#bento [data-dest="' + d.key + '"] img');
      if (img) img.src = d.image;
    });

    // Популярные туры: если подборка пуста, оставляем демо-карточки вёрстки.
    var grid = document.getElementById('popular');
    var pop = data.popular || [];
    if (grid && pop.length) grid.innerHTML = pop.map(card).join('');
  }

  function start() {
    if (!window.TA) { slider(); return; }
    TA.get('/home')
      .then(function (r) { fill(r || {}); })
      .catch(function () { /* сервер недоступен — остаётся вёрстка */ })
      .then(slider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
