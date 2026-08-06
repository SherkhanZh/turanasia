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

  function fail(el, msg) {
    if (el) el.innerHTML = '<div class="empty">' + esc(msg || 'Не удалось загрузить данные.') + '</div>';
  }

  return { base: BASE, get: get, list: list, esc: esc, text: text, program: program, money: money, date: date, lang: lang, fail: fail };
})();
