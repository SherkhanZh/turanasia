/* Turan Asia — каталог туров (используется на tours.html и foreign.html).
   Подключать после api.js. Запуск: TACatalog.init({ section: 'kazakhstan' }) */
window.TACatalog = (function () {
  'use strict';

  var L = {
    ru: { any: 'Любая', all: 'Все', oneDay: 'Однодневные', multiDay: 'Многодневные',
          withDates: 'С датами', onRequest: 'Под запрос', search: 'Поиск тура по названию',
          sortNew: 'Сначала популярные', priceAsc: 'Сначала дешевле', priceDesc: 'Сначала дороже',
          durAsc: 'Сначала короткие', durDesc: 'Сначала длинные', find: 'Найти',
          days: 'дн.', from: 'от', more: 'Подробнее', empty: 'По вашему запросу туров не найдено.',
          onReq: 'Даты — под запрос', err: 'Не удалось загрузить туры.' },
    kz: { any: 'Кез келген', all: 'Барлығы', oneDay: 'Бір күндік', multiDay: 'Көп күндік',
          withDates: 'Күндері бар', onRequest: 'Сұраныс бойынша', search: 'Тур атауы бойынша іздеу',
          sortNew: 'Алдымен танымал', priceAsc: 'Алдымен арзаны', priceDesc: 'Алдымен қымбаты',
          durAsc: 'Алдымен қысқасы', durDesc: 'Алдымен ұзағы', find: 'Табу',
          days: 'күн', from: 'бастап', more: 'Толығырақ', empty: 'Сұрауыңыз бойынша тур табылмады.',
          onReq: 'Күндері — сұраныс бойынша', err: 'Турларды жүктеу мүмкін болмады.' },
    en: { any: 'Any', all: 'All', oneDay: 'Day trips', multiDay: 'Multi-day',
          withDates: 'With dates', onRequest: 'On request', search: 'Search tours by name',
          sortNew: 'Most popular', priceAsc: 'Price: low to high', priceDesc: 'Price: high to low',
          durAsc: 'Shortest first', durDesc: 'Longest first', find: 'Search',
          days: 'days', from: 'from', more: 'Details', empty: 'No tours match your search.',
          onReq: 'Dates on request', err: 'Could not load tours.' }
  };

  function init(opts) {
    var t = L[TA.lang()] || L.ru;
    var grid = document.getElementById('grid');
    var bar = document.getElementById('cfilters');
    var isKZ = opts.section === 'kazakhstan';
    var ALL = [];

    bar.innerHTML =
      '<div class="fsearch"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>' +
        '<input id="c-q" placeholder="' + t.search + '"></div>' +
      (isKZ ? '<div class="seg" data-cseg="trip">' +
        '<button class="on" data-v="">' + t.all + '</button>' +
        '<button data-v="one_day">' + t.oneDay + '</button>' +
        '<button data-v="multi_day">' + t.multiDay + '</button></div>' : '') +
      '<div class="seg" data-cseg="dates">' +
        '<button class="on" data-v="">' + t.all + '</button>' +
        '<button data-v="fixed">' + t.withDates + '</button>' +
        '<button data-v="on_request">' + t.onRequest + '</button></div>' +
      '<select id="c-sort">' +
        '<option value="">' + t.sortNew + '</option>' +
        '<option value="price">' + t.priceAsc + '</option>' +
        '<option value="price_desc">' + t.priceDesc + '</option>' +
        '<option value="dur">' + t.durAsc + '</option>' +
        '<option value="dur_desc">' + t.durDesc + '</option>' +
      '</select>';

    var state = { q: '', trip: '', dates: '', sort: '', cat: 'all' };

    /* Категории раздела: кнопки под фильтрами и рассказ о выбранной категории.
       Вставляем из скрипта, чтобы вёрстка страниц осталась нетронутой. */
    var cbox = document.createElement('div');
    cbox.className = 'gseg'; cbox.hidden = true;
    var cnote = document.createElement('div');
    cnote.className = 'catnote'; cnote.hidden = true;
    grid.parentNode.insertBefore(cbox, grid);
    grid.parentNode.insertBefore(cnote, grid);

    var CATS = {};
    function showCat() {
      var c = CATS[state.cat];
      var desc = c && c.description;
      if (!c || (!desc && !c.image)) { cnote.hidden = true; cnote.innerHTML = ''; return; }
      cnote.innerHTML =
        (c.image ? '<div class="catnote-ph"><img src="' + TA.esc(c.image) + '" alt="' + TA.esc(c.name) + '"></div>' : '') +
        '<div class="catnote-b"><h3>' + TA.esc(c.name) + '</h3>' +
        (desc ? '<p>' + TA.text(desc) + '</p>' : '') + '</div>';
      cnote.hidden = false;
    }

    TA.get('/categories?section=' + opts.section).then(function (r) {
      var cats = TA.list(r);
      if (!cats.length) return;   // категорий нет — кнопки не нужны
      cats.forEach(function (c) { CATS[String(c.id)] = c; });
      cbox.innerHTML = '<button class="on" data-c="all">' + TA.esc(t.all) + '</button>' +
        cats.map(function (c) {
          return '<button data-c="' + c.id + '">' + TA.esc(c.name) + '</button>';
        }).join('');
      cbox.hidden = false;
      cbox.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        cbox.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        state.cat = b.dataset.c;
        showCat(); render();
      });
    }).catch(function () {});

    function card(x) {
      var url = 'tour.html?slug=' + encodeURIComponent(x.slug);
      var img = x.photo || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=700&q=80';
      var pill = (x.duration_days ? x.duration_days + ' ' + t.days : '') +
                 (x.date_mode === 'on_request' ? ' · ' + t.onRequest : '');
      return '<article class="tc">' +
        '<a href="' + url + '"><div class="ph"><img src="' + TA.esc(img) + '" alt="' + TA.esc(x.title) + '">' +
        (pill ? '<span class="pill">' + TA.esc(pill) + '</span>' : '') + '</div></a>' +
        '<div class="b"><h4><a href="' + url + '">' + TA.esc(x.title) + '</a></h4>' +
        '<div class="d">' + TA.esc(x.short_description || '') + '</div>' +
        '<div class="foot"><div class="p">' +
          (x.price ? '<small>' + t.from + '</small><b>' + TA.money(x.price, x.currency) + '</b>' : '') +
        '</div><a class="btn btn-pri" href="' + url + '">' + t.more + '</a></div></div></article>';
    }

    function render() {
      var rows = ALL.filter(function (x) {
        if (state.cat !== 'all' && String(x.category_id) !== String(state.cat)) return false;
        if (state.trip && x.trip_type !== state.trip) return false;
        if (state.dates && (x.date_mode || 'fixed') !== state.dates) return false;
        if (state.q && String(x.title + ' ' + (x.short_description || '')).toLowerCase().indexOf(state.q.toLowerCase()) < 0) return false;
        return true;
      });
      var s = state.sort;
      rows.sort(function (a, b) {
        if (s === 'price') return (a.price || 0) - (b.price || 0);
        if (s === 'price_desc') return (b.price || 0) - (a.price || 0);
        if (s === 'dur') return (a.duration_days || 0) - (b.duration_days || 0);
        if (s === 'dur_desc') return (b.duration_days || 0) - (a.duration_days || 0);
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      });
      grid.innerHTML = rows.length ? rows.map(card).join('') : '<div class="empty">' + t.empty + '</div>';
    }

    bar.querySelectorAll('[data-cseg]').forEach(function (g) {
      g.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          g.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          state[g.dataset.cseg] = b.dataset.v; render();
        });
      });
    });
    document.getElementById('c-sort').addEventListener('change', function () { state.sort = this.value; render(); });
    var qi = document.getElementById('c-q'), tm;
    qi.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { state.q = qi.value.trim(); render(); }, 250); });

    grid.innerHTML = '<div class="empty">…</div>';
    TA.get('/tours?section=' + opts.section + '&per_page=60')
      .then(function (r) { ALL = TA.list(r); render(); })
      .catch(function () { TA.fail(grid, t.err); });
  }

  return { init: init };
})();
