/* Turan Asia — общий клиент публичного API.
   Подключать ДО site.js. Адрес API берётся с текущего домена. */
window.TA = (function () {
  'use strict';

  var BASE = (location.protocol === 'http:' || location.protocol === 'https:')
    ? location.origin + '/api/v1'
    : 'http://localhost:8000/api/v1';   // при открытии файла напрямую

  var LANGS = ['ru', 'kz', 'en'];

  /** Язык страницы: ?lang= в адресе имеет приоритет над сохранённым выбором,
      чтобы ссылку на конкретную языковую версию можно было переслать. */
  function lang() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
    if (q && LANGS.indexOf(q) >= 0) {
      try { localStorage.setItem('ta-lang', q); } catch (e) {}
      return q;
    }
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


  /** Номер дня из заголовка: «День 2», «Day 3:», «3-күн».
      Дата в начале строки («08.09 День 1») не должна приниматься за номер. */
  function dayNumber(title) {
    var s = String(title);
    var m = s.match(/(?:день|day|күн)\s*(\d+)/i) || s.match(/(\d+)\s*[-–—]?\s*күн/i);
    return m ? parseInt(m[1], 10) : null;
  }

  /**
   * Текст программы из БД → timeline «по дням» (.prog), с экскурсиями
   * под своими днями. Если дней не найдено — обычный абзац.
   *
   * Возвращает { html, rest }: rest — экскурсии, которым не нашлось дня.
   * Их нужно показать отдельно, иначе при неразмеченной программе они
   * просто исчезнут со страницы.
   */
  function programWith(src, list) {
    list = (list || []).slice();

    var lines = String(src || '').split(/\r?\n/);
    // «08.09 День 1. …», «День 2 — …», «Day 3:», «3-күн»
    var re = /^\s*(?:\d{1,2}[.\-\/]\d{1,2}\.?\s*)?(?:день|day|күн)\s*\d+|^\s*\d+\s*[-–—]?\s*күн/i;
    var pre = [], days = [], cur = null;

    lines.forEach(function (ln) {
      var s = ln.trim();
      if (re.test(s)) { cur = { title: s, body: [] }; days.push(cur); }
      else if (!s) { return; }
      else if (cur) { cur.body.push(s); }
      else { pre.push(s); }
    });

    var head = pre.length
      ? '<p style="color:#475569;margin-bottom:18px">' + esc(pre.join('\n')).replace(/\n/g, '<br>') + '</p>'
      : '';

    if (!src) head = '';

    if (days.length < 2) {
      return {
        html: head || (src ? '<p style="color:#475569">' + text(src) + '</p>' : ''),
        rest: list
      };
    }

    var used = [];
    var body = days.map(function (d) {
      var num = dayNumber(d.title);
      var mine = num === null ? [] : list.filter(function (e) { return e.day === num; });
      mine.forEach(function (e) { used.push(e); });

      return '<li><b>' + esc(d.title) + '</b>' +
        (d.body.length ? '<p>' + esc(d.body.join('\n')).replace(/\n/g, '<br>') + '</p>' : '') +
        excursions(mine, { hideDay: true }) +
        '</li>';
    }).join('');

    return {
      html: head + '<ul class="prog">' + body + '</ul>',
      rest: list.filter(function (e) { return used.indexOf(e) < 0; })
    };
  }

  /** Программа без экскурсий — прежнее поведение. */
  function program(src) {
    return src ? programWith(src, []).html : '';
  }


  /** Экскурсии тура или запуска Байконура → карточки.
      Цену не показываем: она уже включена в стоимость поездки.
      opts.hideDay — внутри ленты программы номер дня уже стоит в заголовке. */
  function excursions(list, opts) {
    if (!list || !list.length) return '';
    opts = opts || {};

    return '<div class="exc-list">' + list.map(function (e) {
      var pic = (e.photos && e.photos[0]) || '';
      var body = e.short_description || e.description || '';

      // Когда экскурсия расписана по времени, это важнее длительности
      var when = [];
      if (!opts.hideDay && e.day) when.push(t('day_n', { n: e.day }));
      if (e.time) when.push(e.time);
      if (!when.length && e.duration_hours) when.push(e.duration_hours + ' ' + t('hours_short'));

      // data-own-gallery помечает снимок как «не из галереи тура»:
      // без этого просмотрщик тура перехватывал бы клик и ссылка не срабатывала
      var url = 'excursion.html?slug=' + encodeURIComponent(e.slug || '');
      return '<a class="exc" href="' + url + '" data-own-gallery>' +
        (pic ? '<div class="exc-ph"><img src="' + esc(pic) + '" alt="' + esc(e.title) + '" loading="lazy"></div>' : '') +
        '<div class="exc-b"><b>' + esc(e.title) + '</b>' +
        (when.length ? '<span class="exc-h">' + esc(when.join(' · ')) + '</span>' : '') +
        (body ? '<p>' + text(body) + '</p>' : '') +
        '</div></a>';
    }).join('') + '</div>';
  }

  /* ---- Интерфейсные подписи (заголовки разделов, кнопки, подсказки) ---- */
  var T = {
    ru: {
      desc: 'Описание', program: 'Программа тура', included: 'Что включено',
      excursions: 'Экскурсии в программе', hours_short: 'ч', day_n: 'День {n}',
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
      exc_nf: 'Экскурсия не найдена.', exc_err: 'Не удалось загрузить экскурсию.', exc_nospec: 'Экскурсия не указана.',
      exc_program: 'Программа экскурсии', exc_extras: 'Дополнительно', back_to_tour: 'Назад к туру',
      tour_nf: 'Тур не найден.', tour_err: 'Не удалось загрузить тур.', tour_nospec: 'Тур не указан.',
      launch_nf: 'Запуск не найден.', launch_err: 'Не удалось загрузить запуск.', launch_nospec: 'Запуск не указан.',
      launches_err: 'Не удалось загрузить список запусков.',
      launches_soon: 'Ближайшие запуски скоро появятся.', launches_empty: 'В этой категории пока нет запусков.',
      cat_kz: 'Туры по Казахстану', cat_foreign: 'Зарубежные туры',
      gal_empty: "В альбоме пока нет материалов.",
      gal_count: "{n} материалов",
      gal_err: "Не удалось загрузить галерею.",
      gal_nf: "Альбом не найден.",
      gal_tour: "Посмотреть тур",
      gal_cta_h: "Понравилось?",
      gal_cta_p: "Оставьте заявку — подберём маршрут под ваши даты и бюджет.",
      gal_cta_btn: "Оставить заявку",
      gal_album: "Смотреть весь альбом",
      gr_all: "Все туры",
      lb_close: 'Закрыть', lb_prev: 'Предыдущее фото', lb_next: 'Следующее фото'
    },
    kz: {
      desc: 'Сипаттама', program: 'Тур бағдарламасы', included: 'Бағаға не кіреді',
      excursions: 'Бағдарламадағы экскурсиялар', hours_short: 'сағ', day_n: '{n}-күн',
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
      exc_nf: 'Экскурсия табылмады.', exc_err: 'Экскурсияны жүктеу мүмкін болмады.', exc_nospec: 'Экскурсия көрсетілмеген.',
      exc_program: 'Экскурсия бағдарламасы', exc_extras: 'Қосымша', back_to_tour: 'Турға оралу',
      tour_nf: 'Тур табылмады.', tour_err: 'Турды жүктеу мүмкін болмады.', tour_nospec: 'Тур көрсетілмеген.',
      launch_nf: 'Ұшыру табылмады.', launch_err: 'Ұшыруды жүктеу мүмкін болмады.', launch_nospec: 'Ұшыру көрсетілмеген.',
      launches_err: 'Ұшырулар тізімін жүктеу мүмкін болмады.',
      launches_soon: 'Жақын ұшырулар жақында пайда болады.', launches_empty: 'Бұл санатта әзірге ұшырулар жоқ.',
      cat_kz: 'Қазақстан бойынша турлар', cat_foreign: 'Шетелдік турлар',
      gal_empty: "Альбомда әзірге материал жоқ.",
      gal_count: "{n} материал",
      gal_err: "Галереяны жүктеу мүмкін болмады.",
      gal_nf: "Альбом табылмады.",
      gal_tour: "Турды қарау",
      gal_cta_h: "Ұнады ма?",
      gal_cta_p: "Өтінім қалдырыңыз — күндеріңіз бен бюджетіңізге сай бағыт таңдаймыз.",
      gal_cta_btn: "Өтінім қалдыру",
      gal_album: "Бүкіл альбомды қарау",
      gr_all: "Барлық турлар",
      lb_close: 'Жабу', lb_prev: 'Алдыңғы сурет', lb_next: 'Келесі сурет'
    },
    en: {
      desc: 'Overview', program: 'Tour programme', included: "What's included",
      excursions: 'Excursions included', hours_short: 'h', day_n: 'Day {n}',
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
      exc_nf: 'Excursion not found.', exc_err: 'Could not load the excursion.', exc_nospec: 'No excursion specified.',
      exc_program: 'Excursion programme', exc_extras: 'Additional info', back_to_tour: 'Back to the tour',
      tour_nf: 'Tour not found.', tour_err: 'Could not load the tour.', tour_nospec: 'No tour specified.',
      launch_nf: 'Launch not found.', launch_err: 'Could not load the launch.', launch_nospec: 'No launch specified.',
      launches_err: 'Could not load the launch list.',
      launches_soon: 'Upcoming launches will appear here soon.', launches_empty: 'No launches in this category yet.',
      cat_kz: 'Kazakhstan tours', cat_foreign: 'International tours',
      gal_empty: "This album is empty for now.",
      gal_count: "{n} items",
      gal_err: "Could not load the gallery.",
      gal_nf: "Album not found.",
      gal_tour: "View the tour",
      gal_cta_h: "Like what you see?",
      gal_cta_p: "Send a request — we'll build an itinerary for your dates and budget.",
      gal_cta_btn: "Send a request",
      gal_album: "View the whole album",
      gr_all: "All tours",
      lb_close: 'Close', lb_prev: 'Previous photo', lb_next: 'Next photo'
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

  return { langs: LANGS, base: BASE, get: get, list: list, esc: esc, text: text, program: program, programWith: programWith, excursions: excursions, money: money, date: date, lang: lang, t: t, fail: fail };
})();
