// Turan Asia — общий скрипт сайта
(function () {
  // мобильное меню
  var burger = document.querySelector('.burger');
  var header = document.querySelector('header');
  if (burger && header) {
    burger.addEventListener('click', function () { header.classList.toggle('open'); });
  }

  // тёмная тема
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  if (localStorage.getItem('ta-dark') === '1') document.body.classList.add('dark');
  var navR = document.querySelector('.nav-r');
  if (navR) {
    var tb = document.createElement('button');
    tb.className = 'theme-btn'; tb.type = 'button'; tb.setAttribute('aria-label', 'Переключить тему');
    function syncTheme() {
      var dark = document.body.classList.contains('dark');
      tb.innerHTML = dark ? SUN : MOON;
      tb.classList.toggle('on', dark);
      tb.title = dark ? 'Светлая тема' : 'Тёмная тема';
      tb.setAttribute('aria-pressed', dark ? 'true' : 'false');
    }
    tb.addEventListener('click', function () { var d = document.body.classList.toggle('dark'); localStorage.setItem('ta-dark', d ? '1' : '0'); syncTheme(); });
    navR.insertBefore(tb, navR.firstChild);
    syncTheme();
  }

  // переключатели-сегменты (фильтры, табы): кнопки внутри [data-seg]
  document.querySelectorAll('[data-seg]').forEach(function (group) {
    group.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        group.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        var target = group.getAttribute('data-target');
        var val = b.getAttribute('data-val');
        if (target) filterReviews(target, val);
      });
    });
  });

  // отзывы: показать по типу
  function filterReviews(target, val) {
    document.querySelectorAll(target + ' [data-type]').forEach(function (card) {
      card.style.display = (val === 'all' || card.getAttribute('data-type') === val) ? '' : 'none';
    });
  }

  // переключатель языка (визуальный)
  document.querySelectorAll('.lang').forEach(function (l) {
    l.querySelectorAll('span').forEach(function (s) {
      s.addEventListener('click', function () {
        l.querySelectorAll('span').forEach(function (x) { x.classList.remove('on'); });
        s.classList.add('on');
      });
    });
  });
})();
