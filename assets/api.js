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

  function fail(el, msg) {
    if (el) el.innerHTML = '<div class="empty">' + esc(msg || 'Не удалось загрузить данные.') + '</div>';
  }

  return { base: BASE, get: get, list: list, esc: esc, text: text, money: money, date: date, lang: lang, fail: fail };
})();
