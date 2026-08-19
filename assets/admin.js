/* =========================================================
   Turan Asia — Админ-панель (клиент к Laravel API)
   Бэкенд: backend/ (Laravel). Запустите `php artisan serve`
   и при необходимости измените адрес API ниже.
   ========================================================= */
(function () {
  'use strict';

  var DEFAULT_API = (location.protocol === 'http:' || location.protocol === 'https:')
    ? location.origin + '/api/v1'          // прод/дев: API того же домена
    : 'http://localhost:8000/api/v1';      // открытие admin.html как файла
  var API = localStorage.getItem('ta_api') || DEFAULT_API;
  var TOKEN = localStorage.getItem('ta_token') || '';
  var LOCALE = localStorage.getItem('ta_locale') || 'ru';
  var ME = null;
  var CACHE = {}; // справочники (категории, направления)

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (id) { return document.getElementById(id); };

  /* ---------- API ---------- */
  function api(path, opts) {
    opts = opts || {};
    var headers = { 'Accept': 'application/json', 'X-Locale': LOCALE };
    if (opts.body) headers['Content-Type'] = 'application/json';
    if (TOKEN) headers['Authorization'] = 'Bearer ' + TOKEN;
    return fetch(API + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      if (res.status === 401) { logout(); throw new Error('Сессия истекла'); }
      return res.json().catch(function () { return null; }).then(function (data) {
        if (!res.ok) throw { status: res.status, data: data };
        return data;
      });
    });
  }
  function upload(file) {
    var fd = new FormData(); fd.append('file', file);
    return fetch(API + '/admin/media', { method: 'POST', headers: { 'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/json' }, body: fd })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) throw d; return d; }); })
      .then(function (d) { return d.url; });
  }
  function numOrNull(v) { return v === '' || v == null ? null : parseInt(v, 10); }
  function thumbHtml(url) { return '<span class="up-th" data-url="' + esc(url) + '"><img src="' + esc(url) + '"><i class="up-x">×</i></span>'; }
  function dateRow(d) { d = d || {}; var sd = (d.start_date || '').slice(0, 10), ed = (d.end_date || '').slice(0, 10); return '<div class="drow"><input type="date" data-d="start" value="' + esc(sd) + '"><input type="date" data-d="end" value="' + esc(ed) + '"><input type="number" data-d="seats" placeholder="места" value="' + esc(d.seats == null ? '' : d.seats) + '"><input type="number" data-d="price" placeholder="цена" value="' + esc(d.price_override == null ? '' : d.price_override) + '"><span class="iact del" data-delrow>×</span></div>'; }
  function normalize(r) { return Array.isArray(r) ? r : (r && r.data) ? r.data : []; }
  function t(v) { // значение перевода → строка текущей локали
    if (v == null) return '';
    if (typeof v === 'object') return v[LOCALE] || v.ru || Object.values(v)[0] || '';
    return v;
  }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  function toast(msg, isErr) {
    var x = el('toast'); x.textContent = msg; x.className = 'toast show' + (isErr ? ' err' : '');
    setTimeout(function () { x.className = 'toast' + (isErr ? ' err' : ''); }, 2600);
  }

  /* ---------- AUTH ---------- */
  function login(e) {
    e.preventDefault();
    var err = el('loginErr'); err.classList.add('hidden');
    el('loginBtn').textContent = 'Вход…';
    api('/auth/login', { method: 'POST', body: { email: el('email').value, password: el('password').value } })
      .then(function (r) {
        TOKEN = r.token; localStorage.setItem('ta_token', TOKEN);
        boot();
      })
      .catch(function (e) {
        err.textContent = (e.data && (e.data.message || (e.data.errors && e.data.errors.email && e.data.errors.email[0]))) || 'Не удалось войти';
        err.classList.remove('hidden');
      })
      .finally(function () { el('loginBtn').textContent = 'Войти'; });
  }
  function logout() {
    TOKEN = ''; localStorage.removeItem('ta_token');
    el('app').classList.add('hidden'); el('login').classList.remove('hidden');
  }

  function boot() {
    api('/admin/me').then(function (me) {
      ME = me;
      el('login').classList.add('hidden'); el('app').classList.remove('hidden');
      el('meName').textContent = me.email;
      el('meRole').textContent = (me.roles && me.roles.indexOf('admin') >= 0) ? 'Администратор' : 'Контент-менеджер';
      el('meAv').textContent = (me.email || 'A').trim().slice(0, 2).toUpperCase();
      var isAdmin = me.roles && me.roles.indexOf('admin') >= 0;
      el('nav-staff').style.display = isAdmin ? '' : 'none';
      el('nav-audit').style.display = isAdmin ? '' : 'none';
      // справочники для селектов
      Promise.all([
        api('/admin/categories').catch(function(){return [];}),
        api('/admin/directions').catch(function(){return [];})
      ]).then(function (r) {
        CACHE.categories = normalize(r[0]);
        CACHE.directions = flattenDir(normalize(r[1]));
        api('/admin/tours?per_page=200').then(function (tr) {
          CACHE.tours = normalize(tr).map(function (x) { return { id: x.id, label: t(x.title) }; });
        }).catch(function () { CACHE.tours = []; });
        api('/admin/baikonur/groups').then(function (gr) {
          CACHE.baikonur_groups = normalize(gr).map(function (x) { return { id: x.id, label: t(x.title) }; });
        }).catch(function () { CACHE.baikonur_groups = []; });
        go('dash');
      });
    }).catch(function () { logout(); });
  }
  function flattenDir(tree, out, depth) {
    out = out || []; depth = depth || 0;
    (tree || []).forEach(function (d) {
      out.push({ id: d.id, label: '— '.repeat(depth) + t(d.name) });
      if (d.children) flattenDir(d.children, out, depth + 1);
    });
    return out;
  }

  /* ---------- RESOURCES CONFIG ---------- */
  var LANGS = [['ru', 'Русский'], ['kz', 'Қазақша'], ['en', 'English']];
  function opt(arr) { return arr.map(function (o) { return { v: o[0], l: o[1] }; }); }

  var RES = {
    tours: {
      title: 'Туры', endpoint: '/admin/tours', statusField: 'status',
      cols: [
        { l: 'Тур', g: function (r) { return cellPhoto(firstPhoto(r), t(r.title), sectionLabel(r.section)); } },
        { l: 'Цена', g: function (r) { return '<span class="price">' + fmt(r.price) + ' ' + (r.currency||'₸') + '</span>'; } },
        { l: 'Дней', g: function (r) { return '<span class="muted">' + (r.duration_days||'') + '</span>'; } },
        { l: 'Статус', g: function (r) { return statusBadge(r.status); } }
      ],
      fields: [
        f('title', 'Название тура', 'tr-text', { req: 1 }),
        f('short_description', 'Краткое описание', 'tr-text'),
        f('description', 'Описание', 'tr-textarea'),
        f('section', 'Раздел', 'select', { options: opt([['kazakhstan','По Казахстану'],['foreign','Зарубежные']]), req: 1 }),
        f('trip_type', 'Тип (для Казахстана)', 'select', { options: opt([['','—'],['one_day','Однодневный'],['multi_day','Многодневный']]) }),
        f('program', 'Программа тура (по дням)', 'tr-textarea'),
        f('included', 'Что включено', 'tr-textarea'),
        f('extras', 'Не включено / доп. услуги', 'tr-textarea'),
        f('price', 'Стоимость', 'number', { req: 1 }),
        f('price_individual', 'Цена для индивидуальных', 'number'),
        f('currency', 'Валюта', 'text', { def: 'KZT' }),
        f('duration_days', 'Длительность (дней)', 'number', { req: 1, def: 1 }),
        f('seats', 'Мест в группе', 'number'),
        f('date_mode', 'Даты', 'select', { options: opt([['fixed','С фиксированными датами'],['on_request','Без дат — под запрос']]) }),
        f('dates', 'Даты выездов', 'dates'),
        f('photos', 'Галерея — фотографии', 'photos'),
        f('videos', 'Галерея — видео (по ссылке в строке)', 'lines'),
        f('category_id', 'Категория', 'ref', { ref: 'categories' }),
        f('direction_id', 'Направление', 'ref', { ref: 'directions' }),
        f('status', 'Статус', 'select', { options: opt([['published','Опубликован'],['hidden','Скрыт'],['archived','Архив']]) }),
        f('is_featured', 'На главной', 'toggle'),
        f('booking_enabled', 'Кнопка брони', 'toggle')
      ]
    },
    baikonur: {
      title: 'Байконур', endpoint: '/admin/baikonur', statusField: 'status',
      cols: [
        { l: 'Запуск', g: function (r) { return cellPhoto(firstPhoto(r), t(r.title), t(r.rocket)); } },
        { l: 'Дата', g: function (r) { return '<span class="muted">' + (r.launch_date || '—') + '</span>'; } },
        { l: 'Цена', g: function (r) { return r.price ? fmt(r.price) + ' ₸' : '—'; } },
        { l: 'Статус', g: function (r) { return statusBadge(r.status); } }
      ],
      fields: [
        f('title', 'Название миссии', 'tr-text', { req: 1 }),
        f('group_id', 'Категория тура', 'ref', { ref: 'baikonur_groups' }),
        f('rocket', 'Ракета-носитель', 'tr-text'),
        f('description', 'Описание', 'tr-textarea'),
        f('program', 'Программа', 'tr-textarea'),
        f('conditions', 'Условия бронирования', 'tr-textarea'),
        f('launch_date', 'Дата запуска', 'date'),
        f('launch_time', 'Время', 'text'),
        f('seats', 'Мест', 'number'),
        f('price', 'Цена', 'number'),
        f('price_individual', 'Цена для индивидуальных', 'number'),
        f('currency', 'Валюта', 'text', { def: 'KZT' }),
        f('date_mode', 'Даты', 'select', { options: opt([['fixed','С фиксированными датами'],['on_request','Без дат — под запрос']]) }),
        f('status', 'Статус', 'select', { options: opt([['published','Опубликован'],['scheduled','Запланирован'],['hidden','Скрыт'],['completed','Завершён']]) }),
        f('booking_enabled', 'Кнопка брони', 'toggle'),
        f('photos', 'Галерея — фотографии', 'photos'),
        f('videos', 'Галерея — видео (по ссылке в строке)', 'lines')
      ]
    },
    directions: {
      title: 'Направления', endpoint: '/admin/directions', tree: true,
      cols: [
        { l: 'Название', g: function (r) { return '<b>' + esc(t(r.name)) + '</b>'; } },
        { l: 'Тип', g: function (r) { return '<span class="badge b-gray">' + ({country:'Страна',region:'Регион',city:'Город'}[r.type]||r.type) + '</span>'; } },
        { l: 'Зона', g: function (r) { return r.scope ? '<span class="muted">' + ({domestic:'Казахстан',outbound:'Зарубеж'}[r.scope]) + '</span>' : '—'; } }
      ],
      fields: [
        f('type', 'Тип', 'select', { options: opt([['country','Страна'],['region','Регион'],['city','Город']]), req: 1 }),
        f('parent_id', 'Родитель', 'ref', { ref: 'directions' }),
        f('scope', 'Зона (для стран)', 'select', { options: opt([['','—'],['domestic','Туры по Казахстану'],['outbound','Туры за рубеж']]) }),
        f('name', 'Название', 'tr-text', { req: 1 }),
        f('description', 'Описание', 'tr-textarea'),
        f('is_active', 'Активно', 'toggle', { def: true }),
        f('sort', 'Порядок', 'number')
      ]
    },
    reviews: {
      title: 'Отзывы', endpoint: '/admin/reviews',
      cols: [
        { l: 'Автор', g: function (r) { return '<b>' + esc(r.author_name) + '</b><small class="muted">' + esc(r.country||'') + '</small>'; } },
        { l: 'Тип', g: function (r) { return '<span class="badge b-gray">' + ({text:'Текст',photo:'Фото',video:'Видео'}[r.type]||'Текст') + '</span>'; } },
        { l: 'Оценка', g: function (r) { return '<span style="color:#d9a300">' + '★'.repeat(r.rating||5) + '</span>'; } },
        { l: 'Публикация', g: function (r) { return toggleCell('reviews', r.id, r.is_published, 'publish'); } }
      ],
      fields: [
        f('author_name', 'Автор', 'text', { req: 1 }),
        f('country', 'Страна', 'text'),
        f('avatar', 'Аватар', 'image'),
        f('rating', 'Оценка (1–5)', 'number', { def: 5 }),
        f('type', 'Тип', 'select', { options: opt([['text','Текстовый'],['photo','Фото'],['video','Видео']]) }),
        f('text', 'Текст отзыва', 'tr-textarea', { req: 1 }),
        f('video_url', 'Ссылка на видео', 'text'),
        f('media', 'Фото отзыва', 'photos'),
        f('is_published', 'Опубликован', 'toggle')
      ]
    },
    banners: {
      title: 'Баннеры', endpoint: '/admin/banners',
      cols: [
        { l: 'Баннер', g: function (r) { return cellPhoto(r.image, t(r.title), t(r.subtitle)); } },
        { l: 'Ссылка', g: function (r) { return '<span class="muted">' + esc(r.link||'—') + '</span>'; } },
        { l: 'Период', g: function (r) { return '<span class="muted">' + (r.starts_at||'…') + ' – ' + (r.ends_at||'…') + '</span>'; } },
        { l: 'Показ', g: function (r) { return badgeBool(r.is_active); } }
      ],
      fields: [
        f('title', 'Заголовок', 'tr-text', { req: 1 }),
        f('subtitle', 'Подзаголовок', 'tr-text'),
        f('image', 'Изображение', 'image', { req: 1 }),
        f('link', 'Ссылка перехода', 'text'),
        f('starts_at', 'Начало показа', 'date'),
        f('ends_at', 'Конец показа', 'date'),
        f('is_active', 'Активен', 'toggle', { def: true }),
        f('sort', 'Порядок', 'number')
      ]
    },
    baikonur_groups: {
      title: 'Категории Байконура', endpoint: '/admin/baikonur/groups',
      cols: [
        { l: 'Категория', g: function (r) { return '<b>' + esc(t(r.title)) + '</b>'; } },
        { l: 'Туров', g: function (r) { return '<span class="muted">' + (r.launches_count || 0) + '</span>'; } },
        { l: 'Активна', g: function (r) { return badgeBool(r.is_active); } }
      ],
      fields: [
        f('title', 'Название категории', 'tr-text', { req: 1 }),
        f('is_active', 'Показывать на сайте', 'toggle', { def: true }),
        f('sort', 'Порядок', 'number')
      ]
    },
    albums: {
      title: 'Галерея', endpoint: '/admin/albums',
      cols: [
        { l: 'Альбом', g: function (r) { return cellPhoto(r.cover, t(r.title), t(r.description)); } },
        { l: 'Доступ', g: function (r) { return r.visibility === 'public'
            ? '<span class="badge b-green">На сайте</span>'
            : '<span class="badge b-amber">По ссылке</span>'; } },
        { l: 'Материалов', g: function (r) { return '<span class="muted">' + (r.items_count || 0) + '</span>'; } },
        { l: '', g: function (r) { return '<button class="btn btn-out btn-sm" data-albumopen="' + r.id + '">Содержимое</button>'
            + ' <button class="btn btn-out btn-sm" data-copy="' + esc(r.public_url) + '">Ссылка</button>'; } }
      ],
      fields: [
        f('title', 'Название альбома', 'tr-text', { req: 1 }),
        f('description', 'Описание', 'tr-textarea'),
        f('visibility', 'Доступ', 'select', { req: 1, options: opt([
            ['unlisted', 'Только по ссылке — для отправки клиенту'],
            ['public', 'Показывать в галерее на сайте']]) }),
        f('tour_id', 'Связать с туром (необязательно)', 'ref', { ref: 'tours' }),
        f('sort', 'Порядок', 'number')
      ]
    },
    faqs: {
      title: 'FAQ', endpoint: '/admin/faqs',
      cols: [
        { l: 'Вопрос', g: function (r) { return '<b>' + esc(t(r.question)) + '</b>'; } },
        { l: 'Раздел', g: function (r) { return '<span class="badge b-gray">' + esc(r.group) + '</span>'; } },
        { l: 'Активно', g: function (r) { return badgeBool(r.is_active); } }
      ],
      fields: [
        f('group', 'Раздел', 'select', { options: opt([['baikonur','Байконур'],['general','Общий']]), req: 1 }),
        f('question', 'Вопрос', 'tr-text', { req: 1 }),
        f('answer', 'Ответ', 'tr-textarea', { req: 1 }),
        f('is_active', 'Активно', 'toggle', { def: true }),
        f('sort', 'Порядок', 'number')
      ]
    }
  };

  function f(key, label, type, extra) { var o = { key: key, label: label, type: type }; if (extra) for (var k in extra) o[k] = extra[k]; return o; }
  function fmt(n) { return (n == null ? '' : String(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function firstPhoto(r) { return (Array.isArray(r.photos) && r.photos[0]) || ''; }
  function sectionLabel(s) { return { kazakhstan: 'По Казахстану', foreign: 'Зарубежный', baikonur: 'Байконур' }[s] || ''; }
  function statusBadge(s) { var m = { published: ['b-green', 'Опубликован'], hidden: ['b-gray', 'Скрыт'], archived: ['b-amber', 'Архив'], scheduled: ['b-blue', 'Запланирован'], completed: ['b-teal', 'Завершён'] }; var x = m[s] || ['b-gray', s]; return '<span class="badge ' + x[0] + '">' + x[1] + '</span>'; }
  function badgeBool(b) { return b ? '<span class="badge b-green">Да</span>' : '<span class="badge b-gray">Нет</span>'; }
  function cellPhoto(img, title, sub) {
    return '<div class="tcell">' + (img ? '<img class="thumb" src="' + esc(img) + '">' : '<span class="thumb"></span>') +
      '<div><b>' + esc(title || '—') + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</div></div>';
  }
  function toggleCell(res, id, on, action) { return '<span class="sw ' + (on ? 'on' : '') + '" data-toggle="' + res + '" data-id="' + id + '" data-action="' + (action||'') + '"></span>'; }

  /* ---------- ROUTER ---------- */
  var TITLES = { dash: 'Дашборд', tours: 'Туры', albums: 'Галерея', album: 'Альбом', baikonur_groups: 'Категории Байконура', baikonur_hero: 'Фото Байконура', baikonur: 'Байконур', directions: 'Направления', reviews: 'Отзывы', banners: 'Баннеры', faqs: 'FAQ', leads: 'Заявки', contacts: 'Контакты', seo: 'SEO', staff: 'Сотрудники', audit: 'Журнал действий' };
  function go(p) {
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('active', a.dataset.p === p); });
    el('ptitle').textContent = TITLES[p] || '';
    el('side').classList.remove('open'); el('scrim').classList.remove('on');
    var v = el('view'); v.innerHTML = '<div class="spin">Загрузка…</div>';
    ({ dash: viewDash, leads: viewLeads, contacts: viewContacts, seo: viewSeo, staff: viewStaff, audit: viewAudit, baikonur_hero: viewBaikonurHero }[p] || function () { viewList(p); })(p);
  }

  /* ---------- DASHBOARD ---------- */
  function viewDash() {
    api('/admin/stats').then(function (s) {
      el('c-tours').textContent = s.tours_active || '';
      el('c-leads').textContent = s.leads_new || '';
      var cards = [
        ['Новые заявки', s.leads_new], ['Активные туры', s.tours_active],
        ['Опубликованные отзывы', s.reviews_published], ['Всего заявок', s.leads_total]
      ].map(function (c) { return '<div class="stat"><div class="ico">●</div><b>' + (c[1]||0) + '</b><span>' + c[0] + '</span></div>'; }).join('');
      var rows = (s.recent_leads || []).map(function (l) {
        return '<tr><td><b>' + esc(l.name) + '</b></td><td class="muted">' + esc(l.tour_title||'—') + '</td><td class="muted">' + esc(l.phone) + '</td><td>' + leadStatusBadge(l.status) + '</td></tr>';
      }).join('');
      el('view').innerHTML =
        '<div class="stats">' + cards + '</div>' +
        '<div class="card"><div class="card-h"><h3>Последние заявки</h3><a class="btn btn-out btn-sm" data-go="leads">Все заявки →</a></div>' +
        '<table><thead><tr><th>Клиент</th><th>Тур</th><th>Телефон</th><th>Статус</th></tr></thead><tbody>' + (rows || emptyRow(4)) + '</tbody></table></div>';
    }).catch(showErr);
  }
  function leadStatusBadge(s) { var m = { new: ['b-blue', 'Новая'], in_progress: ['b-amber', 'В работе'], processed: ['b-teal', 'Обработана'], done: ['b-green', 'Завершена'] }; var x = m[s] || ['b-gray', s]; return '<span class="badge ' + x[0] + '">' + x[1] + '</span>'; }




  /* ---------- ШАПКА СТРАНИЦЫ БАЙКОНУРА ---------- */
  function viewBaikonurHero() {
    api('/admin/settings').then(function (r) {
      var map = {}; normalize(r).forEach(function (x) { map[x.key] = x.value; });
      var hero = Array.isArray(map.baikonur_hero) ? map.baikonur_hero : [];

      el('view').innerHTML =
        '<div class="phead"><div class="t"><h2>Фото на странице Байконура</h2>' +
        '<p>Снимок справа от блока «Космос на расстоянии вытянутой руки». Если фото несколько — они сменяются автоматически.</p></div></div>' +
        '<form class="form" id="heroForm">' +
        fieldHtml(f('baikonur_hero', 'Фотографии', 'photos'), { baikonur_hero: hero }) +
        '<div class="form-foot"><button type="submit" class="btn btn-pri">Сохранить</button></div></form>';

      $('#heroForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var urls = [].map.call($('#heroForm').querySelectorAll('.up-th'), function (th) { return th.dataset.url; });
        api('/admin/settings', { method: 'PUT', body: { settings: [
          { key: 'baikonur_hero', value: urls, group: 'baikonur' }
        ] } }).then(function () { toast('Сохранено'); }).catch(function (e) { toast(firstError(e) || 'Ошибка', true); });
      });
    }).catch(showErr);
  }

  /* ---------- ВЫБОР ФОТО ИЗ МЕДИАТЕКИ ---------- */
  /* Один и тот же снимок часто нужен в нескольких турах — берём уже загруженный,
     вместо того чтобы отправлять файл на сервер повторно. */
  function openPicker(container) {
    var multi = container.dataset.multi === '1';
    var box = document.createElement('div');
    box.className = 'pick-bd';
    box.innerHTML = '<div class="pick"><div class="pick-h"><b>Выбор из галереи</b><span class="pick-x">×</span></div>' +
      '<div class="pick-b"><div class="spin">Загрузка…</div></div>' +
      '<div class="pick-f"><span class="muted" id="pick-n">Ничего не выбрано</span>' +
      '<button type="button" class="btn btn-pri btn-sm" id="pick-ok">Добавить</button></div></div>';
    document.body.appendChild(box);

    var chosen = [];
    function close() { box.remove(); }
    box.querySelector('.pick-x').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    api('/admin/media/library').then(function (r) {
      var rows = normalize(r);
      var body = box.querySelector('.pick-b');
      if (!rows.length) {
        body.innerHTML = '<div class="empty">В галерее пока нет загруженных фото.<br>Добавьте их в разделе «Галерея».</div>';
        return;
      }
      body.innerHTML = '<div class="al-grid">' + rows.map(function (i) {
        return '<div class="al-item pick-i" data-url="' + esc(i.url) + '"><img src="' + esc(i.thumb || i.url) + '"></div>';
      }).join('') + '</div>';

      body.querySelectorAll('.pick-i').forEach(function (n) {
        n.addEventListener('click', function () {
          var url = n.dataset.url;
          var at = chosen.indexOf(url);
          if (at >= 0) { chosen.splice(at, 1); n.classList.remove('on'); }
          else {
            if (!multi) { chosen = []; body.querySelectorAll('.pick-i').forEach(function (x) { x.classList.remove('on'); }); }
            chosen.push(url); n.classList.add('on');
          }
          box.querySelector('#pick-n').textContent = chosen.length ? 'Выбрано: ' + chosen.length : 'Ничего не выбрано';
        });
      });
    }).catch(function () { box.querySelector('.pick-b').innerHTML = '<div class="empty">Не удалось загрузить галерею</div>'; });

    box.querySelector('#pick-ok').addEventListener('click', function () {
      var list = container.querySelector('.up-list');
      if (!multi) list.innerHTML = '';
      chosen.forEach(function (u) { list.insertAdjacentHTML('beforeend', thumbHtml(u)); });
      close();
    });
  }

  /* ---------- СОДЕРЖИМОЕ АЛЬБОМА ---------- */
  var openAlbum = null;   // id альбома, открытого на просмотр

  function viewAlbum(id) {
    openAlbum = id;
    el('ptitle').textContent = 'Альбом';
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('active', a.dataset.p === 'albums'); });
    el('view').innerHTML = '<div class="spin">Загрузка…</div>';

    api('/admin/albums/' + id).then(function (a) {
      var isPublic = a.visibility === 'public';
      var items = (a.items || []).map(itemCard).join('');

      el('view').innerHTML =
        '<div class="phead"><div class="t"><h2>' + esc(t(a.title)) + '</h2>' +
          '<p>' + (isPublic ? 'Показывается в галерее на сайте' : 'Открывается только по прямой ссылке') + '</p></div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
            '<button class="btn btn-out" data-back="albums">← К альбомам</button>' +
            '<button class="btn btn-pri" data-copy="' + esc(a.public_url) + '">Скопировать ссылку</button>' +
          '</div></div>' +

        '<div class="card" style="padding:18px 20px;margin-bottom:18px">' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">' +
            '<label class="btn btn-pri">+ Загрузить фото<input type="file" accept="image/*" multiple hidden id="al-img"></label>' +
            '<label class="btn btn-out">+ Загрузить видео<input type="file" accept="video/*" hidden id="al-vid"></label>' +
            '<button class="btn btn-out" id="al-link">+ Видео по ссылке</button>' +
            '<span class="muted" style="font-size:12.5px">Фото — до 20 МБ, уменьшим автоматически. Видеофайл — до 50 МБ; длинные ролики лучше заливать на YouTube и добавлять ссылкой.</span>' +
          '</div>' +
          '<div id="al-progress" class="muted" style="margin-top:10px;font-size:13px"></div>' +
        '</div>' +

        '<div class="card" style="padding:18px 20px"><div class="al-grid" id="al-grid">' +
          (items || '<div class="empty">В альбоме пока пусто</div>') +
        '</div></div>';

      el('al-img').addEventListener('change', function () { uploadItems(this.files, 'image'); });
      el('al-vid').addEventListener('change', function () { uploadItems(this.files, 'video'); });
      // Подпись сохраняется, когда поле теряет фокус — отдельная кнопка не нужна
      el('view').querySelectorAll('[data-cap]').forEach(function (inp) {
        var was = inp.value;
        inp.addEventListener('blur', function () {
          if (inp.value === was) return;
          was = inp.value;
          api('/admin/albums/' + openAlbum + '/items/' + inp.dataset.cap, {
            method: 'PUT', body: { caption: { ru: inp.value } }
          }).then(function () { toast('Описание сохранено'); })
            .catch(function () { toast('Не удалось сохранить описание', true); });
        });
      });

      el('al-link').addEventListener('click', function () {
        var url = prompt('Ссылка на видео (YouTube, Vimeo, Rutube):');
        if (url) addItem({ type: 'video', url: url.trim() });
      });
    }).catch(showErr);
  }

  function itemCard(i) {
    var pic = i.type === 'image' ? (i.thumb || i.url) : (i.thumb || '');
    var cap = (i.caption && typeof i.caption === 'object') ? (i.caption.ru || '') : (i.caption || '');
    return '<div class="al-card" data-item="' + i.id + '">' +
      '<div class="al-item">' +
        (pic ? '<img src="' + esc(pic) + '">' : '<span class="al-vid">▶</span>') +
        (i.type === 'video' ? '<span class="al-tag">видео</span>' : '') +
        '<i class="al-x" data-delitem="' + i.id + '">×</i>' +
      '</div>' +
      '<input class="al-cap" data-cap="' + i.id + '" value="' + esc(cap) + '" placeholder="Описание">' +
      '<button type="button" class="btn btn-out btn-sm al-link" data-copy="' + esc(i.public_url || '') + '">Скопировать ссылку</button>' +
      '</div>';
  }

  /** Последовательная загрузка: параллельная на слабом канале обрывается. */
  function uploadItems(files, type) {
    var list = [].slice.call(files);
    if (!list.length) return;
    var done = 0;
    var pr = el('al-progress');

    function next() {
      if (!list.length) { pr.textContent = 'Загружено: ' + done; viewAlbum(openAlbum); return; }
      var file = list.shift();
      pr.textContent = 'Загружаем ' + file.name + '… (' + (done + 1) + ' из ' + (done + 1 + list.length) + ')';
      var fd = new FormData();
      fd.append('type', type);
      fd.append('file', file);
      fetch(API + '/admin/albums/' + openAlbum + '/items', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/json' },
        body: fd
      }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw d; return d; }); })
        .then(function () { done++; next(); })
        .catch(function (e) { toast(firstError(e) || 'Не удалось загрузить ' + file.name, true); next(); });
    }
    next();
  }

  function addItem(body) {
    api('/admin/albums/' + openAlbum + '/items', { method: 'POST', body: body })
      .then(function () { toast('Добавлено'); viewAlbum(openAlbum); })
      .catch(function (e) { toast(firstError(e) || 'Ошибка', true); });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Ссылка скопирована'); })
        .catch(function () { prompt('Скопируйте ссылку:', text); });
    } else {
      prompt('Скопируйте ссылку:', text);
    }
  }

  /* ---------- GENERIC LIST ---------- */
  function viewList(p) {
    var res = RES[p]; if (!res) { el('view').innerHTML = '<div class="empty">Раздел не найден</div>'; return; }
    api(res.endpoint).then(function (r) {
      var rows = res.tree ? flattenTree(normalize(r)) : normalize(r);
      var head = res.cols.map(function (c) { return '<th>' + c.l + '</th>'; }).join('') + '<th></th>';
      var body = rows.length ? rows.map(function (row) {
        var tds = res.cols.map(function (c) { return '<td>' + c.g(row) + '</td>'; }).join('');
        return '<tr>' + tds + '<td><div class="acts"><span class="iact" data-edit="' + p + '" data-id="' + row.id + '">✎</span><span class="iact del" data-del="' + p + '" data-id="' + row.id + '">🗑</span></div></td></tr>';
      }).join('') : emptyRow(res.cols.length + 1);
      el('view').innerHTML =
        '<div class="phead"><div class="t"><h2>' + res.title + '</h2><p>Управление разделом</p></div><button class="btn btn-pri" data-new="' + p + '">+ Добавить</button></div>' +
        '<div class="card"><table><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>';
    }).catch(showErr);
  }
  function flattenTree(tree, out, depth) {
    out = out || []; depth = depth || 0;
    (tree || []).forEach(function (d) { d._depth = depth; out.push(d); if (d.children) flattenTree(d.children, out, depth + 1); });
    return out;
  }

  /* ---------- GENERIC FORM ---------- */
  function viewForm(p, row) {
    var res = RES[p];
    var langTabs = '<div class="tabs" data-langtabs>' + LANGS.map(function (l, i) { return '<span class="' + (i === 0 ? 'on' : '') + '" data-l="' + l[0] + '">' + l[1] + '</span>'; }).join('') + '</div>';
    var hasTr = res.fields.some(function (fl) { return fl.type.indexOf('tr-') === 0; });
    var body = res.fields.map(function (fl) { return fieldHtml(fl, row); }).join('');
    el('view').innerHTML =
      '<div class="phead"><div class="t"><h2>' + (row ? 'Редактировать' : 'Новый') + ' — ' + res.title + '</h2></div><button class="btn btn-out" data-back="' + p + '">← Назад</button></div>' +
      '<form class="form" id="entityForm">' + (hasTr ? langTabs : '') + '<div class="grid2">' + body + '</div>' +
      '<div class="form-foot"><button type="button" class="btn btn-out" data-back="' + p + '">Отмена</button><button type="submit" class="btn btn-pri">Сохранить</button></div></form>';
    if (hasTr) initLangTabs();
    $('#entityForm').addEventListener('submit', function (e) { e.preventDefault(); saveEntity(p, row); });
  }
  function fieldHtml(fl, row) {
    var v = row ? row[fl.key] : (fl.def !== undefined ? fl.def : '');
    var full = (fl.type === 'tr-textarea' || fl.type === 'photos' || fl.type === 'tr-text' || fl.type === 'dates' || fl.type === 'lines') ? ' style="grid-column:span 2"' : '';
    var inner = '';
    if (fl.type === 'tr-text' || fl.type === 'tr-textarea') {
      inner = LANGS.map(function (l, i) {
        var val = (v && typeof v === 'object') ? (v[l[0]] || '') : (i === 0 ? (v || '') : '');
        if (fl.type === 'tr-textarea') return '<div class="tr tr-' + l[0] + '"' + (i ? ' style="display:none"' : '') + '><textarea data-k="' + fl.key + '" data-l="' + l[0] + '">' + esc(val) + '</textarea></div>';
        return '<div class="tr tr-' + l[0] + '"' + (i ? ' style="display:none"' : '') + '><input data-k="' + fl.key + '" data-l="' + l[0] + '" value="' + esc(val) + '"></div>';
      }).join('');
    } else if (fl.type === 'textarea') {
      inner = '<textarea data-k="' + fl.key + '">' + esc(v) + '</textarea>';
    } else if (fl.type === 'photos' || fl.type === 'image') {
      var multi = fl.type === 'photos';
      var arr = multi ? (Array.isArray(v) ? v : []) : (v ? [v] : []);
      inner = '<div class="up" data-up="' + fl.key + '" data-multi="' + (multi ? 1 : 0) + '"><div class="up-list">' + arr.map(thumbHtml).join('') + '</div>' +
        '<label class="up-btn">+ Загрузить' + (multi ? ' фото' : ' изображение') + '<input type="file" accept="image/*"' + (multi ? ' multiple' : '') + ' hidden></label>' +
        '<button type="button" class="up-btn" data-pick="' + fl.key + '">Выбрать из галереи</button></div>';
    } else if (fl.type === 'lines') {
      inner = '<textarea data-k="' + fl.key + '" data-lines="1" placeholder="https://youtube.com/watch?v=...&#10;https://vimeo.com/...">' + (Array.isArray(v) ? v.join('\n') : '') + '</textarea>';
    } else if (fl.type === 'dates') {
      var rows = Array.isArray(v) ? v : [];
      inner = '<div class="dates" data-datesc>' + rows.map(dateRow).join('') + '<button type="button" class="btn btn-out btn-sm" data-addrow>+ Добавить дату</button></div>';
    } else if (fl.type === 'select') {
      inner = '<select data-k="' + fl.key + '">' + fl.options.map(function (o) { return '<option value="' + o.v + '"' + (String(v) === String(o.v) ? ' selected' : '') + '>' + esc(o.l) + '</option>'; }).join('') + '</select>';
    } else if (fl.type === 'ref') {
      var list = CACHE[fl.ref] || [];
      inner = '<select data-k="' + fl.key + '"><option value="">—</option>' + list.map(function (o) { return '<option value="' + o.id + '"' + (String(v) === String(o.id) ? ' selected' : '') + '>' + esc(o.label || t(o.name)) + '</option>'; }).join('') + '</select>';
    } else if (fl.type === 'toggle') {
      inner = '<div class="row-tg"><span class="sw ' + (v ? 'on' : '') + '" data-k="' + fl.key + '" data-toggle-field="1"></span><span class="muted">' + (v ? 'Включено' : 'Выключено') + '</span></div>';
    } else if (fl.type === 'date') {
      inner = '<input type="date" data-k="' + fl.key + '" value="' + esc(v || '') + '">';
    } else if (fl.type === 'number') {
      inner = '<input type="number" data-k="' + fl.key + '" value="' + esc(v == null ? '' : v) + '">';
    } else {
      inner = '<input data-k="' + fl.key + '" value="' + esc(v == null ? '' : v) + '">';
    }
    return '<div class="fld"' + full + '><label>' + fl.label + (fl.req ? ' *' : '') + '</label>' + inner + '</div>';
  }
  function gather(formEl, res) {
    var data = {};
    formEl.querySelectorAll('[data-k]').forEach(function (inp) {
      var k = inp.dataset.k;
      if (inp.dataset.l) { data[k] = data[k] || {}; data[k][inp.dataset.l] = inp.value; }
      else if (inp.dataset.toggleField) { data[k] = inp.classList.contains('on'); }
      else if (inp.dataset.photos != null || inp.dataset.lines != null) { data[k] = inp.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); }
      else if (inp.type === 'number') { data[k] = inp.value === '' ? null : parseInt(inp.value, 10); }
      else { data[k] = inp.value === '' ? null : inp.value; }
    });
    // загруженные фото / одиночные изображения
    formEl.querySelectorAll('[data-up]').forEach(function (c) {
      var urls = [].map.call(c.querySelectorAll('.up-th'), function (th) { return th.dataset.url; });
      data[c.dataset.up] = c.dataset.multi === '1' ? urls : (urls[0] || null);
    });
    // даты выездов
    var dc = formEl.querySelector('[data-datesc]');
    if (dc) {
      data.dates = [].map.call(dc.querySelectorAll('.drow'), function (r) {
        return {
          start_date: r.querySelector('[data-d="start"]').value || null,
          end_date: r.querySelector('[data-d="end"]').value || null,
          seats: numOrNull(r.querySelector('[data-d="seats"]').value),
          price_override: numOrNull(r.querySelector('[data-d="price"]').value)
        };
      }).filter(function (x) { return x.start_date; });
    }
    return data;
  }
  function saveEntity(p, row) {
    var res = RES[p];
    var data = gather($('#entityForm'), res);
    var path = res.endpoint + (row ? '/' + row.id : '');
    api(path, { method: row ? 'PUT' : 'POST', body: data })
      .then(function () { toast('Сохранено'); go(p); })
      .catch(function (e) { toast(firstError(e) || 'Ошибка сохранения', true); });
  }
  function firstError(e) {
    if (e && e.data) { if (e.data.message && !e.data.errors) return e.data.message; if (e.data.errors) { var k = Object.keys(e.data.errors)[0]; return e.data.errors[k][0]; } }
    return '';
  }

  /* ---------- LEADS ---------- */
  function viewLeads() {
    api('/admin/leads').then(function (r) {
      var rows = normalize(r);
      var body = rows.length ? rows.map(function (l) {
        var sel = ['new', 'in_progress', 'processed', 'done'].map(function (s) { return '<option value="' + s + '"' + (l.status === s ? ' selected' : '') + '>' + ({ new: 'Новая', in_progress: 'В работе', processed: 'Обработана', done: 'Завершена' }[s]) + '</option>'; }).join('');
        return '<tr><td class="muted">' + (l.created_at || '').replace('T', ' ').slice(0, 16) + '</td><td><b>' + esc(l.name) + '</b>' + (l.message ? '<small class="muted">' + esc(l.message) + '</small>' : '') + '</td><td class="muted">' + esc(l.phone) + (l.email ? '<br>' + esc(l.email) : '') + '</td><td>' + esc(l.tour_title || '—') + '</td><td><select data-lead="' + l.id + '">' + sel + '</select></td><td><span class="iact del" data-del="leads" data-id="' + l.id + '">🗑</span></td></tr>';
      }).join('') : emptyRow(6);
      el('view').innerHTML = '<div class="phead"><div class="t"><h2>Заявки</h2><p>Обращения с сайта</p></div></div><div class="card"><table><thead><tr><th>Дата</th><th>Клиент</th><th>Контакты</th><th>Тур</th><th>Статус</th><th></th></tr></thead><tbody>' + body + '</tbody></table></div>';
    }).catch(showErr);
  }

  /* ---------- CONTACTS (settings) ---------- */
  function viewContacts() {
    api('/admin/settings').then(function (r) {
      var s = {}; normalize(r).forEach(function (x) { s[x.key] = x.value; });
      var map = s.map || {};
      function fld(k, lab, val) { return '<div class="fld"><label>' + lab + '</label><input data-s="' + k + '" value="' + esc(val == null ? '' : val) + '"></div>'; }
      el('view').innerHTML =
        '<div class="phead"><div class="t"><h2>Контактные данные</h2><p>Значения подставляются в подвал сайта и на страницу контактов</p></div></div>' +
        '<form class="form" id="setForm"><div class="sechead">Контакты</div><div class="grid2">' +
        fld('phone', 'Телефон', s.phone) + fld('phone2', 'Телефон 2', s.phone2) + fld('email', 'E-mail', s.email) + fld('address', 'Адрес', s.address) + fld('work_hours', 'Часы работы', s.work_hours) +
        '</div><div class="sechead" style="margin-top:14px">Соцсети</div><div class="grid2">' +
        fld('instagram', 'Instagram', s.instagram) + fld('telegram', 'Telegram', s.telegram) + fld('whatsapp', 'WhatsApp', s.whatsapp) +
        '</div><div class="sechead" style="margin-top:14px">Карта</div><div class="grid2">' +
        '<div class="fld"><label>Широта</label><input data-s="map.lat" value="' + esc(map.lat || '') + '"></div><div class="fld"><label>Долгота</label><input data-s="map.lng" value="' + esc(map.lng || '') + '"></div>' +
        '</div><div class="form-foot"><button type="submit" class="btn btn-pri">Сохранить</button></div></form>';
      $('#setForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var groups = { phone: 'contacts', phone2: 'contacts', email: 'contacts', address: 'contacts', work_hours: 'contacts', instagram: 'socials', telegram: 'socials', whatsapp: 'socials' };
        var settings = []; var lat = null, lng = null;
        $('#setForm').querySelectorAll('[data-s]').forEach(function (i) {
          var k = i.dataset.s;
          if (k === 'map.lat') { lat = i.value; return; }
          if (k === 'map.lng') { lng = i.value; return; }
          settings.push({ key: k, value: i.value, group: groups[k] || 'general' });
        });
        settings.push({ key: 'map', value: { lat: parseFloat(lat) || null, lng: parseFloat(lng) || null }, group: 'map' });
        api('/admin/settings', { method: 'PUT', body: { settings: settings } }).then(function () { toast('Настройки сохранены'); }).catch(function (e) { toast(firstError(e) || 'Ошибка', true); });
      });
    }).catch(showErr);
  }

  /* ---------- SEO ---------- */
  function viewSeo() {
    api('/admin/seo').then(function (r) {
      var rows = normalize(r);
      var body = rows.length ? rows.map(function (m) {
        return '<tr><td><b>' + esc(m.page) + '</b></td><td class="muted">' + esc(t(m.title)) + '</td><td class="muted">' + esc(t(m.description)).slice(0, 70) + '</td><td><span class="iact" data-seo="' + esc(m.page) + '">✎</span></td></tr>';
      }).join('') : emptyRow(4);
      el('view')._seo = rows;
      el('view').innerHTML = '<div class="phead"><div class="t"><h2>SEO</h2><p>Мета-данные страниц (по языкам)</p></div></div><div class="card"><table><thead><tr><th>Страница</th><th>Title</th><th>Description</th><th></th></tr></thead><tbody>' + body + '</tbody></table></div>';
    }).catch(showErr);
  }
  function viewSeoForm(page) {
    var rows = el('view')._seo || []; var m = rows.filter(function (x) { return x.page === page; })[0] || { page: page };
    function trf(key, lab, ta) {
      return '<div class="fld" style="grid-column:span 2"><label>' + lab + '</label>' + LANGS.map(function (l, i) {
        var v = (m[key] && m[key][l[0]]) || ''; var input = ta ? '<textarea data-k="' + key + '" data-l="' + l[0] + '">' + esc(v) + '</textarea>' : '<input data-k="' + key + '" data-l="' + l[0] + '" value="' + esc(v) + '">';
        return '<div class="tr tr-' + l[0] + '"' + (i ? ' style="display:none"' : '') + '>' + input + '</div>';
      }).join('') + '</div>';
    }
    el('view').innerHTML = '<div class="phead"><div class="t"><h2>SEO — ' + esc(page) + '</h2></div><button class="btn btn-out" data-go="seo">← Назад</button></div>' +
      '<form class="form" id="seoForm"><div class="tabs" data-langtabs>' + LANGS.map(function (l, i) { return '<span class="' + (i ? '' : 'on') + '" data-l="' + l[0] + '">' + l[1] + '</span>'; }).join('') + '</div>' +
      '<div class="grid2">' + trf('title', 'Title') + trf('description', 'Description', 1) + trf('keywords', 'Ключевые слова') +
      '<div class="fld" style="grid-column:span 2"><label>OG-изображение (ссылка)</label><input data-k="og_image" value="' + esc(m.og_image || '') + '"></div></div>' +
      '<div class="form-foot"><button type="submit" class="btn btn-pri">Сохранить</button></div></form>';
    initLangTabs();
    $('#seoForm').addEventListener('submit', function (e) {
      e.preventDefault(); var data = {}; $('#seoForm').querySelectorAll('[data-k]').forEach(function (i) { if (i.dataset.l) { data[i.dataset.k] = data[i.dataset.k] || {}; data[i.dataset.k][i.dataset.l] = i.value; } else data[i.dataset.k] = i.value; });
      api('/admin/seo/' + encodeURIComponent(page), { method: 'PUT', body: data }).then(function () { toast('SEO сохранено'); go('seo'); }).catch(function (e) { toast(firstError(e) || 'Ошибка', true); });
    });
  }

  /* ---------- STAFF ---------- */
  function viewStaff() {
    api('/admin/staff').then(function (r) {
      var rows = normalize(r);
      var body = rows.map(function (u) {
        return '<tr><td><b>' + esc(u.name) + '</b></td><td class="muted">' + esc(u.email) + '</td><td>' + (u.roles || []).map(function (x) { return '<span class="badge ' + (x === 'admin' ? 'b-blue' : 'b-teal') + '">' + (x === 'admin' ? 'Администратор' : 'Контент-менеджер') + '</span>'; }).join(' ') + '</td><td>' + badgeBool(u.is_active) + '</td></tr>';
      }).join('');
      el('view').innerHTML = '<div class="phead"><div class="t"><h2>Сотрудники и роли</h2><p>Доступ к админке</p></div><button class="btn btn-pri" id="invite">+ Пригласить</button></div>' +
        '<div class="card"><table><thead><tr><th>Имя</th><th>E-mail</th><th>Роль</th><th>Статус</th></tr></thead><tbody>' + (body || emptyRow(4)) + '</tbody></table></div>';
      $('#invite').addEventListener('click', function () {
        el('view').innerHTML = '<div class="phead"><div class="t"><h2>Новый сотрудник</h2></div><button class="btn btn-out" data-go="staff">← Назад</button></div>' +
          '<form class="form" id="stForm"><div class="grid2"><div class="fld"><label>Имя *</label><input data-k="name"></div><div class="fld"><label>E-mail *</label><input data-k="email" type="email"></div><div class="fld"><label>Роль</label><select data-k="role"><option value="content-manager">Контент-менеджер</option><option value="admin">Администратор</option></select></div></div><div class="form-foot"><button type="submit" class="btn btn-pri">Создать</button></div></form>';
        $('#stForm').addEventListener('submit', function (e) {
          e.preventDefault(); var d = {}; $('#stForm').querySelectorAll('[data-k]').forEach(function (i) { d[i.dataset.k] = i.value; });
          api('/admin/staff', { method: 'POST', body: d }).then(function (r) { toast('Сотрудник создан. Пароль: ' + (r.temporary_password || '')); go('staff'); }).catch(function (e) { toast(firstError(e) || 'Ошибка', true); });
        });
      });
    }).catch(showErr);
  }

  /* ---------- AUDIT ---------- */
  function viewAudit() {
    api('/admin/audit-logs').then(function (r) {
      var rows = normalize(r);
      var body = rows.length ? rows.map(function (a) {
        var ev = { created: ['b-green', 'создал'], updated: ['b-amber', 'изменил'], deleted: ['b-red', 'удалил'] }[a.event] || ['b-gray', a.event];
        return '<tr><td class="muted">' + (a.created_at || '').replace('T', ' ').slice(0, 16) + '</td><td><b>' + esc(a.user_name || '—') + '</b></td><td><span class="badge ' + ev[0] + '">' + ev[1] + '</span></td><td>' + esc(a.subject_type) + ' #' + (a.subject_id || '') + '</td></tr>';
      }).join('') : emptyRow(4);
      el('view').innerHTML = '<div class="phead"><div class="t"><h2>Журнал действий</h2><p>История изменений в админке</p></div></div><div class="card"><table><thead><tr><th>Дата</th><th>Сотрудник</th><th>Действие</th><th>Объект</th></tr></thead><tbody>' + body + '</tbody></table></div>';
    }).catch(showErr);
  }

  /* ---------- helpers ---------- */
  function emptyRow(cols) { return '<tr><td colspan="' + cols + '" class="empty">Пока пусто</td></tr>'; }
  function showErr(e) { el('view').innerHTML = '<div class="empty">Не удалось загрузить данные.<br><span class="muted">Проверьте, что сервер API запущен: ' + esc(API) + '</span></div>'; }
  function initLangTabs() {
    document.querySelectorAll('[data-langtabs]').forEach(function (tb) {
      tb.querySelectorAll('span').forEach(function (sp) {
        sp.addEventListener('click', function () {
          tb.querySelectorAll('span').forEach(function (x) { x.classList.remove('on'); }); sp.classList.add('on');
          var lang = sp.dataset.l; var form = tb.closest('form');
          form.querySelectorAll('.tr').forEach(function (d) { d.style.display = d.classList.contains('tr-' + lang) ? '' : 'none'; });
        });
      });
    });
  }

  /* ---------- global events ---------- */
  document.addEventListener('click', function (e) {
    var ux = e.target.closest('.up-x'); if (ux) { ux.closest('.up-th').remove(); return; }
    var ar = e.target.closest('[data-addrow]'); if (ar) { ar.insertAdjacentHTML('beforebegin', dateRow({})); return; }
    var dr = e.target.closest('[data-delrow]'); if (dr) { dr.closest('.drow').remove(); return; }
    var cp = e.target.closest('[data-copy]'); if (cp) { copyText(cp.dataset.copy); return; }
    var pk = e.target.closest('[data-pick]'); if (pk) { openPicker(pk.closest('.up')); return; }
    var ao = e.target.closest('[data-albumopen]'); if (ao) { viewAlbum(ao.dataset.albumopen); return; }
    var di = e.target.closest('[data-delitem]');
    if (di) {
      if (!confirm('Удалить материал?')) return;
      api('/admin/albums/' + openAlbum + '/items/' + di.dataset.delitem, { method: 'DELETE' })
        .then(function () { di.closest('.al-item').remove(); }).catch(function () { toast('Ошибка', true); });
      return;
    }
    var tg = e.target.closest('[data-p],[data-new],[data-edit],[data-del],[data-back],[data-go],[data-seo],[data-toggle],[data-toggle-field]');
    if (!tg) return;
    if (tg.dataset.toggleField != null) { tg.classList.toggle('on'); tg.nextElementSibling && (tg.nextElementSibling.textContent = tg.classList.contains('on') ? 'Включено' : 'Выключено'); return; }
    if (tg.dataset.p) return go(tg.dataset.p);
    if (tg.dataset.go) return go(tg.dataset.go);
    if (tg.dataset.new) return viewForm(tg.dataset.new, null);
    if (tg.dataset.back) return go(tg.dataset.back);
    if (tg.dataset.seo) return viewSeoForm(tg.dataset.seo);
    if (tg.dataset.edit) {
      var res = RES[tg.dataset.edit];
      return api(res.endpoint + '/' + tg.dataset.id).then(function (row) { viewForm(tg.dataset.edit, row.data || row); })
        .catch(function () { // если нет show — берём из списка
          api(res.endpoint).then(function (r) { var rows = res.tree ? flattenTree(normalize(r)) : normalize(r); var row = rows.filter(function (x) { return String(x.id) === String(tg.dataset.id); })[0]; viewForm(tg.dataset.edit, row); });
        });
    }
    if (tg.dataset.del) {
      if (!confirm('Удалить запись?')) return;
      return api(RES[tg.dataset.del] ? RES[tg.dataset.del].endpoint + '/' + tg.dataset.id : '/admin/leads/' + tg.dataset.id, { method: 'DELETE' })
        .then(function () { toast('Удалено'); go(tg.dataset.del); }).catch(function (e) { toast(firstError(e) || 'Ошибка', true); });
    }
    if (tg.dataset.toggle) {
      var resK = tg.dataset.toggle, id = tg.dataset.id, action = tg.dataset.action;
      var url = action === 'publish' ? RES[resK].endpoint + '/' + id + '/publish' : RES[resK].endpoint + '/' + id;
      return api(url, { method: 'PATCH' }).then(function () { tg.classList.toggle('on'); }).catch(function () { toast('Ошибка', true); });
    }
  });
  document.addEventListener('change', function (e) {
    var f = e.target;
    if (f.type === 'file' && f.closest('.up')) {
      var box = f.closest('.up'), list = box.querySelector('.up-list'), multi = box.dataset.multi === '1';
      var files = [].slice.call(f.files); f.value = '';
      files.forEach(function (file) {
        upload(file).then(function (url) { if (!multi) list.innerHTML = ''; list.insertAdjacentHTML('beforeend', thumbHtml(url)); }).catch(function () { toast('Не удалось загрузить', true); });
      });
      return;
    }
    var s = f.closest('[data-lead]');
    if (s) api('/admin/leads/' + s.dataset.lead + '/status', { method: 'PATCH', body: { status: s.value } }).then(function () { toast('Статус обновлён'); el('c-leads') && refreshCounts(); }).catch(function () { toast('Ошибка', true); });
  });
  function refreshCounts() { api('/admin/stats').then(function (s) { el('c-tours').textContent = s.tours_active || ''; el('c-leads').textContent = s.leads_new || ''; }).catch(function(){}); }

  /* lang switch (top) */
  el('langSw').addEventListener('click', function (e) {
    var sp = e.target.closest('span'); if (!sp) return;
    el('langSw').querySelectorAll('span').forEach(function (x) { x.classList.remove('on'); }); sp.classList.add('on');
    LOCALE = sp.dataset.l; localStorage.setItem('ta_locale', LOCALE);
    var active = document.querySelector('#nav a.active'); if (active) go(active.dataset.p);
  });

  /* mobile menu + misc */
  el('menuBtn').addEventListener('click', function () { el('side').classList.add('open'); el('scrim').classList.add('on'); });
  el('scrim').addEventListener('click', function () { el('side').classList.remove('open'); el('scrim').classList.remove('on'); });
  el('logout').addEventListener('click', logout);
  el('loginForm').addEventListener('submit', login);
  el('apiLabel').textContent = API;
  el('apiCfg').addEventListener('click', function (e) { e.preventDefault(); var v = prompt('Адрес API (с /api/v1):', API); if (v) { API = v.replace(/\/$/, ''); localStorage.setItem('ta_api', API); el('apiLabel').textContent = API; } });

  /* старт: если есть токен — входим сразу */
  if (TOKEN) boot();
})();
