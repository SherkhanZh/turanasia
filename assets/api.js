/* Turan Asia — общий клиент публичного API.
   Подключать ДО site.js. Адрес API берётся с текущего домена. */
window.TA = (function () {
  'use strict';

  var BASE = (location.protocol === 'http:' || location.protocol === 'https:')
    ? location.origin + '/api/v1'
    : 'http://localhost:8000/api/v1';   // при открытии файла напрямую

  function lang() {
    try { return localStorage.getItem('ta-lang') || 'ru'; } catch (e) { return 'ru'; }
  }

  function get(path) {
    var sep = path.indexOf('?') >= 0 ? '&' : '?';
    return fetch(BASE + path + sep + 'lang=' + lang(), {
      headers: { 'Accept': 'application/json', 'X-Locale': lang() }
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function list(r) { return Array.isArray(r) ? r : (r && r.data) ? r.data : []; }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /** Текст из БД → безопасный HTML с переносами строк */
  function text(s) {
    return esc(s).replace(/\r?\n/g, '<br>');
  }

  function money(n, cur) {
    if (n == null || n === '') return '';
    var sign = { KZT: '₸', USD: '$', EUR: '€', RUB: '₽' }[cur || 'KZT'] || (cur || '');
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ' + sign;
  }

  var MONTHS = {
    ru: ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
    kz: ['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'],
    en: ['January','February','March','April','May','June','July','August','September','October','November','December']
  };

  function date(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return esc(iso);
    var m = (MONTHS[lang()] || MONTHS.ru)[d.getMonth()];
    return lang() === 'en'
      ? m + ' ' + d.getDate() + ', ' + d.getFullYear()
      : d.getDate() + ' ' + m + ' ' + d.getFullYear();
  }


  /** Текст программы из БД → timeline «по дням» (.prog). Если дней не найдено — обычный абзац. */
  function program(src) {
    if (!src) return '';
    var lines = String(src).split(/\r?\n/);
    // «08.09 День 1. …», «День 2 — …», «Day 3:», «3-күн»
    var re = /^\s*(?:\d{1,2}[.\-\/]\d{1,2}\.?\s*)?(?:день|day|күн)\s*\d+|^\s*\d+\s*[-–—]?\s*күн/i;
    var pre = [], days = [], cur = null;
    lines.forEach(function (ln) {
      var t = ln.trim();
      if (re.test(t)) { cur = { title: t, body: [] }; days.push(cur); }
      else if (!t) { return; }
      else if (cur) { cur.body.push(t); }
      else { pre.push(t); }
    });
    var html = pre.length ? '<p style="color:#475569;margin-bottom:18px">' + esc(pre.join('\n')).replace(/\n/g, '<br>') + '</p>' : '';
    if (days.length < 2) return html || '<p style="color:#475569">' + text(src) + '</p>';
    return html + '<ul class="prog">' + days.map(function (d) {
      return '<li><b>' + esc(d.title) + '</b><p>' + esc(d.body.join('\n')).replace(/\n/g, '<br>') + '</p></li>';
    }).join('') + '</ul>';
  }


  /* ---- Интерфейсные подписи (заголовки разделов, кнопки, подсказки) ---- */
  var T = {
    ru: {
      desc: 'Описание', program: 'Программа тура', included: 'Что включено',
      included_cond: 'Что включено / условия', extras: 'Стоимость и дополнительно',
      dates_near: 'Ближайшие даты', video: 'Видео',
      on_request: 'Даты — под запрос', scheduled: 'По расписанию',
      price_from: 'Стоимость от', per_person: 'за человека', individual: 'Индивидуально',
      f_name: 'Имя', f_name_ph: 'Ваше имя', f_phone: 'Телефон', f_people: 'Количество человек',
      send: 'Оставить заявку', sending: 'Отправляем…', sent: 'Отправлено',
      whatsapp: 'Написать в WhatsApp',
      note: 'Онлайн-оплата и бронирование — скоро. Сейчас заявка обрабатывается менеджером.',
      need_contacts: 'Укажите имя и телефон.',
      sent_ok: 'Заявка отправлена! Менеджер свяжется с вами.',
      send_err: 'Не удалось отправить. Позвоните нам или напишите в WhatsApp.',
      days_short: 'дн.', group_upto: 'Группа до {n} чел.', seats: 'Мест', seats_free: 'Свободно {n} мест',
      cosmodrome: 'Космодром Байконур', more: 'Подробнее',
      loading: 'Загрузка…',
      tour_nf: 'Тур не найден.', tour_err: 'Не удалось загрузить тур.', tour_nospec: 'Тур не указан.',
      launch_nf: 'Запуск не найден.', launch_err: 'Не удалось загрузить запуск.', launch_nospec: 'Запуск не указан.',
      launches_err: 'Не удалось загрузить список запусков.',
      launches_soon: 'Ближайшие запуски скоро появятся.', launches_empty: 'В этой категории пока нет запусков.',
      cat_kz: 'Туры по Казахстану', cat_foreign: 'Зарубежные туры'
    },
    kz: {
      desc: 'Сипаттама', program: 'Тур бағдарламасы', included: 'Бағаға не кіреді',
      included_cond: 'Бағаға не кіреді / шарттар', extras: 'Құны және қосымша',
      dates_near: 'Жақын күндер', video: 'Бейне',
      on_request: 'Күндері — сұраныс бойынша', scheduled: 'Кесте бойынша',
      price_from: 'Құны бастап', per_person: 'бір адамға', individual: 'Жеке',
      f_name: 'Аты-жөні', f_name_ph: 'Сіздің атыңыз', f_phone: 'Телефон', f_people: 'Адам саны',
      send: 'Өтінім қалдыру', sending: 'Жіберілуде…', sent: 'Жіберілді',
      whatsapp: 'WhatsApp-қа жазу',
      note: 'Онлайн төлем және брондау — жақында. Қазір өтінімді менеджер өңдейді.',
      need_contacts: 'Атыңыз бен телефоныңызды көрсетіңіз.',
      sent_ok: 'Өтінім жіберілді! Менеджер сізбен байланысады.',
      send_err: 'Жіберу мүмкін болмады. Бізге қоңырау шалыңыз немесе WhatsApp-қа жазыңыз.',
      days_short: 'күн', group_upto: '{n} адамға дейінгі топ', seats: 'Орын', seats_free: '{n} орын бос',
      cosmodrome: 'Байқоңыр ғарыш айлағы', more: 'Толығырақ',
      loading: 'Жүктелуде…',
      tour_nf: 'Тур табылмады.', tour_err: 'Турды жүктеу мүмкін болмады.', tour_nospec: 'Тур көрсетілмеген.',
      launch_nf: 'Ұшыру табылмады.', launch_err: 'Ұшыруды жүктеу мүмкін болмады.', launch_nospec: 'Ұшыру көрсетілмеген.',
      launches_err: 'Ұшырулар тізімін жүктеу мүмкін болмады.',
      launches_soon: 'Жақын ұшырулар жақында пайда болады.', launches_empty: 'Бұл санатта әзірге ұшырулар жоқ.',
      cat_kz: 'Қазақстан бойынша турлар', cat_foreign: 'Шетелдік турлар'
    },
    en: {
      desc: 'Overview', program: 'Tour programme', included: "What's included",
      included_cond: "What's included / conditions", extras: 'Price & extras',
      dates_near: 'Upcoming dates', video: 'Video',
      on_request: 'Dates — on request', scheduled: 'Scheduled departures',
      price_from: 'Price from', per_person: 'per person', individual: 'Individual',
      f_name: 'Name', f_name_ph: 'Your name', f_phone: 'Phone', f_people: 'Number of travellers',
      send: 'Send request', sending: 'Sending…', sent: 'Sent',
      whatsapp: 'Message us on WhatsApp',
      note: 'Online payment and booking are coming soon. For now your request is handled by a manager.',
      need_contacts: 'Please enter your name and phone.',
      sent_ok: 'Request sent! Our manager will contact you shortly.',
      send_err: 'Could not send. Please call us or write on WhatsApp.',
      days_short: 'days', group_upto: 'Group up to {n} people', seats: 'Seats', seats_free: '{n} seats left',
      cosmodrome: 'Baikonur Cosmodrome', more: 'Details',
      loading: 'Loading…',
      tour_nf: 'Tour not found.', tour_err: 'Could not load the tour.', tour_nospec: 'No tour specified.',
      launch_nf: 'Launch not found.', launch_err: 'Could not load the launch.', launch_nospec: 'No launch specified.',
      launches_err: 'Could not load the launch list.',
      launches_soon: 'Upcoming launches will appear here soon.', launches_empty: 'No launches in this category yet.',
      cat_kz: 'Kazakhstan tours', cat_foreign: 'International tours'
    }
  };

  /** Подпись интерфейса на текущем языке. TA.t('group_upto', {n: 12}) */
  function t(key, vars) {
    var d = T[lang()] || T.ru;
    var v = d[key] != null ? d[key] : (T.ru[key] != null ? T.ru[key] : key);
    if (vars) {
      Object.keys(vars).forEach(function (k) { v = v.replace('{' + k + '}', vars[k]); });
    }
    return v;
  }

  function fail(el, msg) {
    if (el) el.innerHTML = '<div class="empty">' + esc(msg || t('tour_err')) + '</div>';
  }

  return { base: BASE, get: get, list: list, esc: esc, text: text, program: program, money: money, date: date, lang: lang, t: t, fail: fail };
})();
