/* Turan Asia — главная страница.
   Карусель в шапке, плитки «Куда отправимся» и подборка популярных туров
   берутся из админки. Если раздел не заполнен, на месте остаётся то, что
   зашито в вёрстке, — страница не должна пустеть из-за пустой настройки.
   Подключать после api.js и site.js. */
(function () {
  'use strict';

  var T = {
    ru: { days: 'дн.', from: 'от', more: 'Подробнее', onReq: 'Под запрос', group: 'Группа',
          d1: 'До 3 дней', d2: '4–7 дней', d3: '8–14 дней', d4: 'От 15 дней',
          upTo: 'До {n}', over: 'От {n}', kzTours: 'Туры по Казахстану', abroad: 'Зарубежные туры' },
    kz: { days: 'күн', from: 'бастап', more: 'Толығырақ', onReq: 'Сұраныс бойынша', group: 'Топ',
          d1: '3 күнге дейін', d2: '4–7 күн', d3: '8–14 күн', d4: '15 күннен',
          upTo: '{n} дейін', over: '{n} бастап', kzTours: 'Қазақстан бойынша турлар', abroad: 'Шетелдік турлар' },
    en: { days: 'days', from: 'from', more: 'Details', onReq: 'On request', group: 'Group',
          d1: 'Up to 3 days', d2: '4–7 days', d3: '8–14 days', d4: '15 days and more',
          upTo: 'Up to {n}', over: '{n} and above', kzTours: 'Kazakhstan tours', abroad: 'International tours' }
  };
  var t = T[(window.TA && TA.lang()) || 'ru'] || T.ru;

  /* ---------- карусель в шапке ---------- */
  function slider() {
    var sl = document.getElementById('heroSlider');
    if (!sl) return;
    var slides = sl.querySelector('.slides');
    var dots = sl.querySelector('.sl-dots');
    var prev = sl.querySelector('.prev');
    var next = sl.querySelector('.next');
    if (!slides || !dots) return;   // вёрстку поменяли — молча ничего не делаем
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

    if (next) next.onclick = function () { go(i + 1); reset(); };
    if (prev) prev.onclick = function () { go(i - 1); reset(); };
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

  /* ---------- «Найти свой тур» ---------- */
  /* Блок собирает условия и открывает каталог уже отфильтрованным.
     Зарубежное направление ведёт на свою страницу — разделы на сайте разные. */
  function search() {
    var form = document.getElementById('findbar');
    if (!form || !window.TA) return;

    var dest = document.getElementById('f-dest');
    var dur = document.getElementById('f-dur');
    var price = document.getElementById('f-price');

    // Длительность — понятные диапазоны, а не два поля с числами.
    [['1-3', t.d1], ['4-7', t.d2], ['8-14', t.d3], ['15-', t.d4]].forEach(function (o) {
      dur.insertAdjacentHTML('beforeend', '<option value="' + o[0] + '">' + TA.esc(o[1]) + '</option>');
    });

    // Ссылки цельными строками — их переписывает сборка в чистые адреса.
    var PAGES = { kz: 'tours.html', foreign: 'foreign.html' };
    var SCOPE = {};   // id направления → на какую страницу вести

    // Направления списком «страна → регион → город»: выбор страны находит
    // и туры по её регионам, это разворачивает сервер.
    function addDirs(list, depth, page) {
      (list || []).forEach(function (d) {
        var to = d.scope === 'outbound' ? PAGES.foreign : (page || PAGES.kz);
        SCOPE[d.id] = to;
        var name = (d.name && typeof d.name === 'object') ? (d.name[TA.lang()] || d.name.ru) : d.name;
        dest.insertAdjacentHTML('beforeend',
          '<option value="' + d.id + '">' + TA.esc(new Array(depth + 1).join('\u00a0\u00a0\u00a0') + name) + '</option>');
        addDirs(d.children, depth + 1, to);
      });
    }

    TA.get('/directions').then(function (r) { addDirs(TA.list(r), 0, null); }).catch(function () {});

    TA.get('/filters').then(function (r) {
      // Ступени цены считаем от реального разброса, чтобы не предлагать
      // «до 100 000», когда самый дешёвый тур стоит дороже.
      var lo = (r.price && r.price.min) || 0, hi = (r.price && r.price.max) || 0;
      if (hi > lo) {
        var step = Math.round((hi - lo) / 3 / 10000) * 10000 || Math.round((hi - lo) / 3);
        [lo + step, lo + step * 2].forEach(function (v) {
          price.insertAdjacentHTML('beforeend',
            '<option value="-' + v + '">' + TA.esc(t.upTo.replace('{n}', TA.money(v, 'KZT'))) + '</option>');
        });
        price.insertAdjacentHTML('beforeend',
          '<option value="' + (lo + step * 2) + '-">' + TA.esc(t.over.replace('{n}', TA.money(lo + step * 2, 'KZT'))) + '</option>');
      }
    }).catch(function () { /* справочник не отдался — останутся «любые» */ });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var q = [];
      if (dest.value) q.push('direction_id=' + encodeURIComponent(dest.value));
      if (dur.value) {
        var d = dur.value.split('-');
        if (d[0]) q.push('duration_min=' + d[0]);
        if (d[1]) q.push('duration_max=' + d[1]);
      }
      if (price.value) {
        var p = price.value.split('-');
        if (p[0]) q.push('price_min=' + p[0]);
        if (p[1]) q.push('price_max=' + p[1]);
      }
      var date = document.getElementById('f-date').value;
      if (date) q.push('date_from=' + encodeURIComponent(date));

      // Язык тащим за собой, иначе каталог откроется на русском.
      q.push('lang=' + TA.lang());

      var page = (dest.value && SCOPE[dest.value]) || PAGES.kz;
      location.href = page + '?' + q.join('&');
    });
  }

  function start() {
    if (!window.TA) { slider(); return; }
    search();
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
