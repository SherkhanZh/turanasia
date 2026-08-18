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
      'nav.home':'Главная','nav.tours':'Туры по Казахстану','nav.foreign':'Зарубежные туры','nav.baikonur':'Байконур','nav.individual':'Индивидуальные туры','nav.about':'О компании','nav.contacts':'Контакты','nav.cta':'Связаться',
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
      'p.tours.h1':"Туры по Казахстану",
      'p.tours.lead':"Многодневные путешествия и однодневные экскурсии по самым красивым местам страны — в сопровождении местных гидов.",
      'p.for.h1':"Зарубежные групповые туры",
      'p.for.lead':"Готовые программы с фиксированными датами и сопровождением. Присоединяйтесь к группе и путешествуйте без хлопот.",
      'p.baik.h1':"Туры на космодром Байконур",
      'p.baik.lead':"Увидеть настоящий запуск ракеты с первого и крупнейшего космодрома мира. Экскурсии по стартовым площадкам, музей космонавтики и наблюдение за запуском.",
      'p.baik.eyebrow':"Уникальный опыт",
      'p.baik.h2':"Космос на расстоянии вытянутой руки",
      'p.baik.p1':"Байконур — действующий космодром, откуда запускаются пилотируемые и грузовые космические миссии. Мы организуем поездку под ключ: оформление пропусков, проживание, экскурсии и доступ к разрешённой смотровой площадке во время запуска.",
      'p.baik.li1':"Оформление пропусков и сопровождение",
      'p.baik.li2':"Вывоз ракеты на стартовый стол",
      'p.baik.li3':"Посещение музея и Гагаринского старта",
      'p.baik.li4':"Наблюдение за запуском с разрешённой точки",
      'p.baik.next':"Ближайшие запуски",
      'p.baik.cal':"Календарь запусков и туров",
      'p.baik.f_all':"Все",
      'p.baik.f_fixed':"С датами",
      'p.baik.f_req':"Под запрос",
      'p.baik.sort1':"Сначала ближайшие",
      'p.baik.sort2':"Сначала поздние",
      'p.baik.sort3':"Сначала дешевле",
      'p.baik.sort4':"Сначала дороже",
      'p.baik.booknote':"Онлайн-бронирование и оплата появятся на следующем этапе; сейчас бронь оформляется через менеджера.",
      'p.baik.faq':"Частые вопросы",
      'p.baik.gallery':"Галерея",
      'p.baik.q1':"Нужны ли пропуска на космодром?",
      'p.baik.a1':"Да. Пропуска оформляются заранее, нужен действующий паспорт. Все документы готовим мы — от вас потребуются только данные.",
      'p.baik.q2':"Можно ли фотографировать запуск?",
      'p.baik.a2':"Да, на разрешённых точках наблюдения. Профессиональную съёмку согласуем отдельно.",
      'p.baik.q3':"Гарантируется ли, что запуск состоится в дату?",
      'p.baik.a3':"Даты запусков могут сдвигаться по техническим и погодным причинам. Мы заранее предупреждаем и помогаем скорректировать поездку.",
      'p.baik.q4':"Подходит ли тур детям?",
      'p.baik.a4':"Да, но есть ограничения по возрасту на отдельных объектах. Уточняйте у менеджера при бронировании.",
      'p.about.h1':"О компании",
      'p.about.lead':"С 1994 года открываем гостям Казахстан и Центральную Азию.",
      'p.about.eyebrow':"Наша история",
      'p.about.h2':"Эксперты по путешествиям с 1994 года",
      'p.about.p1':"Turan Asia — лицензированный туроператор из Казахстана, основанный в 1994 году. Мы создаём аутентичные путешествия, которые знакомят гостей с природой, культурой и людьми нашей страны.",
      'p.about.p2':"Команда местных экспертов разрабатывает уникальные маршруты: от классических туров по Алматы и Астане до экспедиций в Мангистау и программ на космодроме Байконур.",
      'p.about.p3':"Мы работаем с туристами из Казахстана и других стран, а также с туристическими агентствами и корпоративными клиентами.",
      'p.about.s1':"лет на рынке",
      'p.about.s2':"авторских туров",
      'p.about.s3':"довольных гостей",
      'p.about.s4':"направлений",
      'p.about.lic_h':"Лицензии и членство",
      'p.about.lic_sub':"Работаем официально и по международным стандартам",
      'p.about.iata':"Аккредитованный агент IATA",
      'p.about.tursab':"Член TURSAB",
      'p.about.to':"Лицензия туроператора",
      'p.about.kta':"Казахстанская туристская ассоциация",
      'p.about.kta_sub':"Действительный член",
      'p.about.mice_h':"Корпоративный туризм",
      'p.about.mice_p':"Организуем деловые поездки, конференции, инсентив-туры и тимбилдинги под ключ.",
      'p.about.m1':"Деловые мероприятия и конференции",
      'p.about.m2':"Инсентив-программы для команд",
      'p.about.m3':"Трансферы, отели и кейтеринг",
      'p.about.m4':"Индивидуальное сопровождение",
      'p.about.mice_btn':"Запросить презентацию MICE",
      'p.about.cta_h':"Спланируем ваше путешествие",
      'p.about.cta_p':"Расскажите, куда хотите поехать — подберём маршрут под ваши даты, бюджет и интересы.",
      'p.about.cta_btn':"Связаться с нами",
      'p.cont.h1':"Контакты",
      'p.cont.lead':"Свяжитесь с нами удобным способом — поможем подобрать тур и ответим на любые вопросы.",
      'p.cont.email_sub':"Ответим в течение дня",
      'p.cont.office':"Офис в Алматы",
      'p.cont.addr':"ул. Желтоксан, 111А",
      'p.cont.hours':"Часы работы",
      'p.cont.social':"Мы в соцсетях",
      'p.cont.form_h':"Напишите нам",
      'p.cont.form_p':"Оставьте заявку — менеджер свяжется с вами.",
      'p.cont.f_name':"Имя",
      'p.cont.f_name_ph':"Ваше имя",
      'p.cont.f_phone':"Телефон",
      'p.cont.f_email':"E-mail",
      'p.cont.f_msg':"Сообщение",
      'p.cont.f_msg_ph':"Чем можем помочь?",
      'p.cont.send':"Отправить заявку",
      'p.cont.privacy':"Нажимая «Отправить», вы соглашаетесь с политикой конфиденциальности.",
      'foot.about':'С 1994 года — туроператор по Казахстану и миру.','foot.tours':'Туры','foot.company':'Компания','foot.contacts':'Контакты','foot.menu':'Меню','foot.social':'Мы в соцсетях','foot.kz':'По Казахстану','foot.foreign':'Зарубежные','foot.individual':'Индивидуальные','foot.reviews':'Отзывы','foot.hotels':'Отели','foot.cruises':'Круизы','foot.dests':'Направления','foot.hours':'09:00 – 19:00','foot.addr':'Алматы, ул. Желтоксан, 111а','foot.rights':'© 2026 Turan Asia. Все права защищены.','foot.privacy':'Политика конфиденциальности','foot.terms':'Оферта'
    },
    kz: {
      'nav.home':'Басты бет','nav.tours':'Қазақстан бойынша турлар','nav.foreign':'Шетелдік турлар','nav.baikonur':'Байқоңыр','nav.individual':'Жеке турлар','nav.about':'Компания туралы','nav.contacts':'Байланыс','nav.cta':'Байланысу',
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
      'p.tours.h1':"Қазақстан бойынша турлар",
      'p.tours.lead':"Елдің ең көрікті жерлеріне жергілікті гидтермен бірге көпкүндік саяхаттар мен біркүндік экскурсиялар.",
      'p.for.h1':"Шетелге топтық турлар",
      'p.for.lead':"Белгіленген күндері мен сүйемелдеуі бар дайын бағдарламалар. Топқа қосылып, алаңсыз саяхаттаңыз.",
      'p.baik.h1':"Байқоңыр ғарыш айлағына турлар",
      'p.baik.lead':"Әлемдегі алғашқы әрі ең ірі ғарыш айлағынан зымыранның шынайы ұшырылымын тамашалаңыз. Ғарыш айлағының нысандарына экскурсия, ғарыш музейіне бару және зымыран ұшырылымын бақылау.",
      'p.baik.eyebrow':"Бірегей тәжірибе",
      'p.baik.h2':"Ғарышқа бір қадам жақын",
      'p.baik.p1':"Байқоңыр — пилотты және жүк ғарыш миссиялары жүзеге асырылатын жұмыс істеп тұрған ғарыш айлағы. Біз сапарды толық ұйымдастырамыз: рұқсаттарды рәсімдеу, тұру, экскурсиялар және ұшырылым кезінде рұқсат етілген бақылау орнына бару.",
      'p.baik.li1':"Рұқсаттарды алдын ала рәсімдеу және сүйемелдеу",
      'p.baik.li2':"Зымыранды ұшыру алаңына шығару рәсімін тамашалау",
      'p.baik.li3':"Музей мен Гагарин стартына бару",
      'p.baik.li4':"Ұшырылымды рұқсат етілген бақылау нүктесінен тамашалау",
      'p.baik.next':"Жақын арадағы ұшырылымдар",
      'p.baik.cal':"Ұшырылымдар мен турлар күнтізбесі",
      'p.baik.f_all':"Барлығы",
      'p.baik.f_fixed':"Күндері көрсетілген",
      'p.baik.f_req':"Сұраныс бойынша",
      'p.baik.sort1':"Алдымен жақындары",
      'p.baik.sort2':"Алдымен кейінгілері",
      'p.baik.sort3':"Алдымен арзандары",
      'p.baik.sort4':"Алдымен қымбаттары",
      'p.baik.booknote':"Онлайн брондау мен төлем келесі кезеңде қосылады; қазір брондау менеджер арқылы рәсімделеді.",
      'p.baik.faq':"Жиі қойылатын сұрақтар",
      'p.baik.gallery':"Галерея",
      'p.baik.q1':"Ғарыш айлағына рұқсат қағазы қажет пе?",
      'p.baik.a1':"Иә. Рұқсаттар алдын ала рәсімделеді, қолданыстағы төлқұжат қажет. Барлық құжаттарды біз дайындаймыз — сізден тек деректер қажет.",
      'p.baik.q2':"Ұшырылымды суретке түсіруге бола ма?",
      'p.baik.a2':"Иә, рұқсат етілген бақылау нүктелерінде. Кәсіби түсірілім бөлек келісіледі.",
      'p.baik.q3':"Ұшырылым белгіленген күні өтетініне кепілдік бар ма?",
      'p.baik.a3':"Ұшырылым күндері техникалық және ауа райы себептерімен ауысуы мүмкін. Біз алдын ала хабарлап, сапарды түзетуге көмектесеміз.",
      'p.baik.q4':"Тур балаларға жарамды ма?",
      'p.baik.a4':"Иә, бірақ кейбір нысандарда жас шектеулері бар. Брондау кезінде менеджерден нақтылаңыз.",
      'p.about.h1':"Компания туралы",
      'p.about.lead':"1994 жылдан бері қонақтарға Қазақстан мен Орталық Азияны таныстырып келеміз.",
      'p.about.eyebrow':"Біздің тарихымыз",
      'p.about.h2':"1994 жылдан бері саяхат саласындағы сарапшылар",
      'p.about.p1':"Turan Asia — 1994 жылы құрылған қазақстандық лицензияланған туроператор. Біз қонақтарға еліміздің табиғатын, мәдениеті мен халқын жақынырақ таныстыратын шынайы әрі мазмұнды саяхаттар ұйымдастырамыз.",
      'p.about.p2':"Жергілікті сарапшылар командасы бірегей маршруттар әзірлейді: Алматы мен Астананың классикалық турларынан бастап Маңғыстаудағы экспедициялар мен Байқоңыр ғарыш айлағына арналған бағдарламаларға дейін.",
      'p.about.p3':"Біз Қазақстаннан және шетелден келген туристермен, туристік агенттіктермен және корпоративтік клиенттермен жұмыс істейміз.",
      'p.about.s1':"жыл нарықта",
      'p.about.s2':"авторлық тур",
      'p.about.s3':"риза болған қонақ",
      'p.about.s4':"бағыт",
      'p.about.lic_h':"Лицензиялар мен мүшелік",
      'p.about.lic_sub':"Ресми түрде және халықаралық стандарттарға сай жұмыс істейміз",
      'p.about.iata':"IATA аккредиттелген агенті",
      'p.about.tursab':"TURSAB мүшесі",
      'p.about.to':"Туроператор лицензиясы",
      'p.about.kta':"Қазақстан туристік қауымдастығы",
      'p.about.kta_sub':"Толыққанды мүше",
      'p.about.mice_h':"Корпоративтік туризм",
      'p.about.mice_p':"Іскерлік сапарларды, конференцияларды, инсентив-турлар мен тимбилдингтерді толық ұйымдастырамыз.",
      'p.about.m1':"Іскерлік іс-шаралар мен конференциялар",
      'p.about.m2':"Командаларға арналған инсентив-бағдарламалар",
      'p.about.m3':"Трансферлер, қонақүйлер және кейтеринг",
      'p.about.m4':"Жеке сүйемелдеу",
      'p.about.mice_btn':"MICE презентациясын сұрату",
      'p.about.cta_h':"Саяхатыңызды жоспарлаймыз",
      'p.about.cta_p':"Қайда саяхаттағыңыз келетінін айтыңыз — сапарыңыздың күндеріне, бюджетіңізге және қызығушылықтарыңызға сай маршрут ұсынамыз.",
      'p.about.cta_btn':"Бізбен байланысу",
      'p.cont.h1':"Байланыс",
      'p.cont.lead':"Өзіңізге ыңғайлы тәсілмен хабарласыңыз — тур таңдауға көмектесіп, кез келген сұрағыңызға жауап береміз.",
      'p.cont.email_sub':"Бір күн ішінде жауап береміз",
      'p.cont.office':"Алматыдағы кеңсе",
      'p.cont.addr':"Желтоқсан көшесі, 111А",
      'p.cont.hours':"Жұмыс уақыты",
      'p.cont.social':"Біз әлеуметтік желілердеміз",
      'p.cont.form_h':"Бізге жазыңыз",
      'p.cont.form_p':"Өтінім қалдырыңыз — менеджер сізбен байланысады.",
      'p.cont.f_name':"Аты-жөні",
      'p.cont.f_name_ph':"Атыңызды енгізіңіз",
      'p.cont.f_phone':"Телефон",
      'p.cont.f_email':"E-mail",
      'p.cont.f_msg':"Хабарлама",
      'p.cont.f_msg_ph':"Немен көмектесе аламыз?",
      'p.cont.send':"Өтінім жіберу",
      'p.cont.privacy':"«Жіберу» түймесін басу арқылы сіз құпиялылық саясатымен келісесіз.",
      'foot.about':'1994 жылдан бері — Қазақстан және әлем бойынша туроператор.','foot.tours':'Турлар','foot.company':'Компания','foot.contacts':'Байланыс','foot.menu':'Мәзір','foot.social':'Әлеуметтік желілерде','foot.kz':'Қазақстан бойынша','foot.foreign':'Шетелдік','foot.individual':'Жеке','foot.reviews':'Пікірлер','foot.hotels':'Қонақүйлер','foot.cruises':'Круиздер','foot.dests':'Бағыттар','foot.hours':'09:00 – 19:00','foot.addr':'Алматы, Желтоқсан к-сі, 111а','foot.rights':'© 2026 Turan Asia. Барлық құқықтар қорғалған.','foot.privacy':'Құпиялылық саясаты','foot.terms':'Оферта'
    },
    en: {
      'nav.home':'Home','nav.tours':'Kazakhstan Tours','nav.foreign':'International Tours','nav.baikonur':'Baikonur','nav.individual':'Tailor-made Tours','nav.about':'About Us','nav.contacts':'Contacts','nav.cta':'Contact',
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
      'p.tours.h1':"Tours in Kazakhstan",
      'p.tours.lead':"Multi-day journeys and day trips to the country's most beautiful destinations, accompanied by local guides.",
      'p.for.h1':"Group Tours Abroad",
      'p.for.lead':"Ready-made itineraries with fixed dates and tour assistance. Join a group and enjoy a hassle-free journey.",
      'p.baik.h1':"Baikonur Cosmodrome Tours",
      'p.baik.lead':"Witness a real rocket launch from the world's first and largest spaceport. Explore the launch facilities, visit the Cosmonautics Museum and watch the launch from designated viewing areas.",
      'p.baik.eyebrow':"Unique Experience",
      'p.baik.h2':"Space Within Reach",
      'p.baik.p1':"Baikonur is an active spaceport where crewed and cargo missions are launched. We arrange the entire experience for you, including permits, accommodation, guided tours and access to a designated viewing area during the launch.",
      'p.baik.li1':"Permit arrangements and assistance",
      'p.baik.li2':"Witness the rocket being transported to the launch pad",
      'p.baik.li3':"Visit the Cosmonautics Museum and Gagarin's Start",
      'p.baik.li4':"Watch the launch from a designated viewing area",
      'p.baik.next':"Upcoming Launches",
      'p.baik.cal':"Launch & Tour Calendar",
      'p.baik.f_all':"All",
      'p.baik.f_fixed':"With Dates",
      'p.baik.f_req':"On Request",
      'p.baik.sort1':"Soonest first",
      'p.baik.sort2':"Latest first",
      'p.baik.sort3':"Cheapest first",
      'p.baik.sort4':"Most expensive first",
      'p.baik.booknote':"Online booking and payment are coming in the next phase; for now bookings are handled by a manager.",
      'p.baik.faq':"Frequently Asked Questions",
      'p.baik.gallery':"Gallery",
      'p.baik.q1':"Do I need a permit for the cosmodrome?",
      'p.baik.a1':"Yes. Permits are arranged in advance and a valid passport is required. We prepare all the paperwork — we only need your details.",
      'p.baik.q2':"Can I photograph the launch?",
      'p.baik.a2':"Yes, from the designated viewing areas. Professional filming is arranged separately.",
      'p.baik.q3':"Is the launch date guaranteed?",
      'p.baik.a3':"Launch dates can shift for technical or weather reasons. We notify you in advance and help adjust your trip.",
      'p.baik.q4':"Is the tour suitable for children?",
      'p.baik.a4':"Yes, though some facilities have age restrictions. Please check with your manager when booking.",
      'p.about.h1':"About Us",
      'p.about.lead':"Since 1994, we have been helping guests discover Kazakhstan and Central Asia.",
      'p.about.eyebrow':"Our Story",
      'p.about.h2':"Travel Experts Since 1994",
      'p.about.p1':"Turan Asia is a licensed tour operator from Kazakhstan, founded in 1994. We create authentic travel experiences that introduce guests to the nature, culture and people of our country.",
      'p.about.p2':"Our team of local experts designs unique itineraries, from classic tours of Almaty and Astana to expeditions in Mangystau and experiences at the Baikonur Cosmodrome.",
      'p.about.p3':"We work with travelers from Kazakhstan and around the world, as well as travel agencies and corporate clients.",
      'p.about.s1':"years of experience",
      'p.about.s2':"tailor-made tours",
      'p.about.s3':"happy guests",
      'p.about.s4':"destinations",
      'p.about.lic_h':"Licenses & Memberships",
      'p.about.lic_sub':"Operating officially and in accordance with international standards",
      'p.about.iata':"IATA Accredited Agent",
      'p.about.tursab':"TURSAB Member",
      'p.about.to':"Tour Operator License",
      'p.about.kta':"Kazakhstan Tourism Association",
      'p.about.kta_sub':"Full Member",
      'p.about.mice_h':"Corporate & MICE Travel",
      'p.about.mice_p':"We organize business trips, conferences, incentive tours and team-building events from start to finish.",
      'p.about.m1':"Business events and conferences",
      'p.about.m2':"Incentive programs for teams",
      'p.about.m3':"Transfers, hotels and catering",
      'p.about.m4':"Dedicated support",
      'p.about.mice_btn':"Request the MICE Presentation",
      'p.about.cta_h':"Let's Plan Your Journey",
      'p.about.cta_p':"Tell us where you'd like to go — we'll create an itinerary tailored to your dates, budget and interests.",
      'p.about.cta_btn':"Get in Touch",
      'p.cont.h1':"Contacts",
      'p.cont.lead':"Get in touch in whichever way suits you — we'll help you choose a tour and answer any questions.",
      'p.cont.email_sub':"We'll get back to you within a day",
      'p.cont.office':"Almaty Office",
      'p.cont.addr':"111A Zheltoksan St.",
      'p.cont.hours':"Opening Hours",
      'p.cont.social':"Follow us on social media",
      'p.cont.form_h':"Get in Touch",
      'p.cont.form_p':"Leave a request and our manager will get in touch with you.",
      'p.cont.f_name':"Name",
      'p.cont.f_name_ph':"Your name",
      'p.cont.f_phone':"Phone",
      'p.cont.f_email':"Email",
      'p.cont.f_msg':"Message",
      'p.cont.f_msg_ph':"How can we help?",
      'p.cont.send':"Send request",
      'p.cont.privacy':"By clicking Send you agree to our privacy policy.",
      'foot.about':'Since 1994 — Kazakhstan & Worldwide Tour Operator.','foot.tours':'Tours','foot.company':'Company','foot.contacts':'Contacts','foot.menu':'Menu','foot.social':'Follow us','foot.kz':'In Kazakhstan','foot.foreign':'International','foot.individual':'Tailor-made','foot.reviews':'Reviews','foot.hotels':'Hotels','foot.cruises':'Cruises','foot.dests':'Destinations','foot.hours':'09:00 – 19:00','foot.addr':'Almaty, 111a Zheltoksan St.','foot.rights':'© 2026 Turan Asia. All rights reserved.','foot.privacy':'Privacy Policy','foot.terms':'Offer'
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
    // подсказки в полях формы
    document.querySelectorAll('[data-i18n-ph]').forEach(function (n) {
      var v = dict[n.getAttribute('data-i18n-ph')];
      if (v != null) n.setAttribute('placeholder', v);
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

  var startLang = currentLang();
  applyLang(startLang);

  // Если выбран не русский, сразу отражаем язык в адресе: тогда скопированная
  // из строки браузера ссылка откроется у получателя на том же языке.
  if (startLang !== 'ru') {
    try {
      if (new URLSearchParams(location.search).get('lang') !== startLang) putLangInUrl(startLang);
    } catch (e) {}
  }
})();
