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

  /* ===== Мультиязычность (RU / KZ / EN) =====
     Разметка: data-i18n="ключ" (текст) или data-i18n-html="ключ" (с разметкой).
     Новые строки добавляйте во все три языка. */
  var I18N = {
    ru: {
      'nav.home':'Главная','nav.tours':'Туры по Казахстану','nav.foreign':'Зарубежные туры','nav.baikonur':'Байконур','nav.about':'О компании','nav.contacts':'Контакты','nav.cta':'Связаться',
      'hero.pill':'✦ Год основания 1994','hero.title':'Открываем <em>мир</em> вместе с вами','hero.lead':'От уникальных путешествий по Казахстану до туров под ключ в самые удивительные уголки мира.','hero.btn1':'Смотреть туры','hero.btn2':'Связаться с нами',
      'dest.title':'Куда отправимся','dest.sub':'Выберите формат путешествия','dest.kz_sub':'Многодневные и однодневные','dest.baik_sub':'Запуски ракет','dest.for_sub':'Групповые поездки','dest.ind_sub':'Авторские маршруты',
      'common.soon':'Скоро','common.from':'от','common.more':'Подробнее',
      'pop.title':'Популярные туры','pop.sub':'Готовые маршруты с вылетами круглый год','pop.all':'Все туры →',
      'card.d5':'5 дней · Группа','card.d2':'2 дня · Группа','card.d4':'4 дня · Группа',
      'card.t1':'Алматы и Кольсайские озёра','card.s1':'Горы, озёра и свежий воздух','card.t2':'Приключение в Чарынском каньоне','card.s2':'Каньоны, долины и степь','card.t3':'Экспедиция в Мангистау','card.s3':'Марсианские пейзажи Казахстана',
      'find.title':'Найти свой тур','find.sub':'Подберите тур по направлению, длительности, цене и датам','find.dest':'Направление','find.any_dest':'Любое направление','find.dur':'Длительность','find.any_f':'Любая','find.price':'Цена','find.dates':'Даты','find.any_p':'Любые','find.btn':'Найти туры',
      'cta.title':'Готовы к путешествию?','cta.sub':'Оставьте заявку — подберём идеальный маршрут под ваши даты, бюджет и интересы.','cta.btn':'Оставить заявку',
      'stat.years':'лет на рынке','stat.tours':'уникальных туров','stat.guests':'довольных гостей','stat.dests':'направлений',
      'val.1':'Индивидуальный подход','val.2':'Экспертность','val.3':'Забота о каждом туристе','val.4':'Надёжность и качество',
      'foot.about':'С 1994 года — туроператор по Казахстану и миру.','foot.tours':'Туры','foot.company':'Компания','foot.contacts':'Контакты','foot.menu':'Меню','foot.social':'Мы в соцсетях','foot.kz':'По Казахстану','foot.foreign':'Зарубежные','foot.individual':'Индивидуальные','foot.reviews':'Отзывы','foot.hotels':'Отели','foot.cruises':'Круизы','foot.dests':'Направления','foot.hours':'09:00 – 19:00','foot.addr':'Алматы, ул. Желтоксан, 111а','foot.rights':'© 2026 Turan Asia. Все права защищены.','foot.privacy':'Политика конфиденциальности','foot.terms':'Условия'
    },
    kz: {
      'nav.home':'Басты бет','nav.tours':'Қазақстан бойынша турлар','nav.foreign':'Шетелдік турлар','nav.baikonur':'Байқоңыр','nav.about':'Компания туралы','nav.contacts':'Байланыс','nav.cta':'Байланысу',
      'hero.pill':'✦ 1994 жылдан бері қызмет көрсетеміз','hero.title':'<em>Әлемді</em> бізбен бірге таныңыз','hero.lead':'Қазақстан бойынша бірегей саяхаттардан бастап, әлемнің ең ғажайып бағыттарына дейінгі толық ұйымдастырылған турларды ұсынамыз.','hero.btn1':'Турларды қарау','hero.btn2':'Бізбен байланысу',
      'dest.title':'Қайда барамыз','dest.sub':'Саяхат форматын таңдаңыз','dest.kz_sub':'Көп күндік және бір күндік','dest.baik_sub':'Зымыран ұшырылымдары','dest.for_sub':'Топтық сапарлар','dest.ind_sub':'Авторлық бағыттар',
      'common.soon':'Жақында','common.from':'бастап','common.more':'Толығырақ',
      'pop.title':'Танымал турлар','pop.sub':'Жыл бойы шығатын дайын бағыттар','pop.all':'Барлық турлар →',
      'card.d5':'5 күн · Топ','card.d2':'2 күн · Топ','card.d4':'4 күн · Топ',
      'card.t1':'Алматы және Көлсай көлдері','card.s1':'Таулар, көлдер және таза ауа','card.t2':'Шарын шатқалындағы шытырман','card.s2':'Шатқалдар, аңғарлар және дала','card.t3':'Маңғыстауға экспедиция','card.s3':'Қазақстанның ғаламшарлық ландшафттары',
      'find.title':'Өз туріңізді табыңыз','find.sub':'Бағыт, ұзақтық, баға және күндер бойынша тур таңдаңыз','find.dest':'Бағыт','find.any_dest':'Кез келген бағыт','find.dur':'Ұзақтығы','find.any_f':'Кез келген','find.price':'Бағасы','find.dates':'Күндері','find.any_p':'Кез келген','find.btn':'Турларды табу',
      'cta.title':'Саяхатқа дайынсыз ба?','cta.sub':'Өтінім қалдырыңыз — күндеріңізге, бюджетіңізге және қызығушылығыңызға сай бағыт таңдаймыз.','cta.btn':'Өтінім қалдыру',
      'stat.years':'жыл нарықта','stat.tours':'бірегей тур','stat.guests':'риза қонақ','stat.dests':'бағыт',
      'val.1':'Жеке көзқарас','val.2':'Кәсібилік','val.3':'Әрбір саяхатшыға қамқорлық','val.4':'Сенімділік пен сапа',
      'foot.about':'1994 жылдан бері — Қазақстан және әлем бойынша туроператор.','foot.tours':'Турлар','foot.company':'Компания','foot.contacts':'Байланыс','foot.menu':'Мәзір','foot.social':'Әлеуметтік желілерде','foot.kz':'Қазақстан бойынша','foot.foreign':'Шетелдік','foot.individual':'Жеке','foot.reviews':'Пікірлер','foot.hotels':'Қонақүйлер','foot.cruises':'Круиздер','foot.dests':'Бағыттар','foot.hours':'09:00 – 19:00','foot.addr':'Алматы, Желтоқсан к-сі, 111а','foot.rights':'© 2026 Turan Asia. Барлық құқықтар қорғалған.','foot.privacy':'Құпиялылық саясаты','foot.terms':'Шарттар'
    },
    en: {
      'nav.home':'Home','nav.tours':'Kazakhstan Tours','nav.foreign':'International Tours','nav.baikonur':'Baikonur','nav.about':'About Us','nav.contacts':'Contacts','nav.cta':'Contact',
      'hero.pill':'✦ Established in 1994','hero.title':'Discover the <em>world</em> with us','hero.lead':'From unique journeys across Kazakhstan to tailor-made tours in the most amazing destinations around the world.','hero.btn1':'Browse tours','hero.btn2':'Get in touch',
      'dest.title':'Where to go','dest.sub':'Choose your type of trip','dest.kz_sub':'Multi-day and day trips','dest.baik_sub':'Rocket launches','dest.for_sub':'Group departures','dest.ind_sub':'Tailor-made routes',
      'common.soon':'Coming soon','common.from':'from','common.more':'Details',
      'pop.title':'Popular tours','pop.sub':'Ready-made itineraries, departures year-round','pop.all':'All tours →',
      'card.d5':'5 days · Group','card.d2':'2 days · Group','card.d4':'4 days · Group',
      'card.t1':'Almaty & Kolsai Lakes','card.s1':'Mountains, lakes and fresh air','card.t2':'Charyn Canyon Adventure','card.s2':'Canyons, valleys and steppe','card.t3':'Mangystau Expedition','card.s3':'Martian landscapes of Kazakhstan',
      'find.title':'Find your tour','find.sub':'Search by destination, duration, price and dates','find.dest':'Destination','find.any_dest':'Any destination','find.dur':'Duration','find.any_f':'Any','find.price':'Price','find.dates':'Dates','find.any_p':'Any','find.btn':'Search tours',
      'cta.title':'Ready to travel?','cta.sub':"Send us a request — we'll craft the perfect itinerary for your dates, budget and interests.",'cta.btn':'Send a request',
      'stat.years':'years in business','stat.tours':'unique tours','stat.guests':'happy guests','stat.dests':'destinations',
      'val.1':'Personalized approach','val.2':'Expertise','val.3':'Care for every traveler','val.4':'Reliability and quality',
      'foot.about':'Since 1994 — Kazakhstan & Worldwide Tour Operator.','foot.tours':'Tours','foot.company':'Company','foot.contacts':'Contacts','foot.menu':'Menu','foot.social':'Follow us','foot.kz':'In Kazakhstan','foot.foreign':'International','foot.individual':'Tailor-made','foot.reviews':'Reviews','foot.hotels':'Hotels','foot.cruises':'Cruises','foot.dests':'Destinations','foot.hours':'09:00 – 19:00','foot.addr':'Almaty, 111a Zheltoksan St.','foot.rights':'© 2026 Turan Asia. All rights reserved.','foot.privacy':'Privacy Policy','foot.terms':'Terms'
    }
  };

  function applyLang(lang) {
    var dict = I18N[lang] || I18N.ru;
    document.querySelectorAll('[data-i18n]').forEach(function (n) {
      var v = dict[n.getAttribute('data-i18n')];
      if (v != null) n.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (n) {
      var v = dict[n.getAttribute('data-i18n-html')];
      if (v != null) n.innerHTML = v;
    });
    document.documentElement.setAttribute('lang', lang === 'kz' ? 'kk' : lang);
    document.querySelectorAll('.lang').forEach(function (l) {
      l.querySelectorAll('span').forEach(function (x) {
        x.classList.toggle('on', x.getAttribute('data-l') === lang);
      });
    });
    try { localStorage.setItem('ta-lang', lang); } catch (e) {}
  }

  /** Текущий язык: ?lang= в адресе важнее сохранённого выбора. */
  function currentLang() {
    if (window.TA && TA.lang) return TA.lang();      // страницы с данными из API
    var q = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) {}
    if (q && ['ru', 'kz', 'en'].indexOf(q) >= 0) {
      try { localStorage.setItem('ta-lang', q); } catch (e) {}
      return q;
    }
    try { return localStorage.getItem('ta-lang') || 'ru'; } catch (e) { return 'ru'; }
  }

  /** Прописывает язык в адрес, чтобы ссылку можно было переслать. */
  function putLangInUrl(v) {
    try {
      var u = new URL(location.href);
      u.searchParams.set('lang', v);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) {}
  }

  document.querySelectorAll('.lang').forEach(function (l) {
    l.querySelectorAll('span').forEach(function (s) {
      s.addEventListener('click', function () {
        var v = s.getAttribute('data-l') || 'ru';
        if (v === currentLang()) return;
        try { localStorage.setItem('ta-lang', v); } catch (e) {}
        putLangInUrl(v);
        // Контент туров приходит с сервера на выбранном языке — перезапрашиваем страницу
        if (window.TA && document.querySelector('[data-ta-live]')) { location.reload(); return; }
        applyLang(v);
      });
    });
  });

  applyLang(currentLang());
})();
