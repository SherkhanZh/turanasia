<?php

namespace Database\Seeders;

use App\Models\BaikonurLaunch;
use App\Models\Banner;
use App\Models\Category;
use App\Models\Direction;
use App\Models\Faq;
use App\Models\Review;
use App\Models\SeoMeta;
use App\Models\Setting;
use App\Models\Tour;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // --- Категории ---
        $eco = Category::create(['slug' => 'eco', 'name' => ['ru' => 'Эко', 'kz' => 'Эко', 'en' => 'Eco'], 'sort' => 1]);
        $classic = Category::create(['slug' => 'classic', 'name' => ['ru' => 'Классический', 'kz' => 'Классикалық', 'en' => 'Classic'], 'sort' => 2]);
        $city = Category::create(['slug' => 'city', 'name' => ['ru' => 'Городской', 'kz' => 'Қалалық', 'en' => 'City'], 'sort' => 3]);

        // --- Направления ---
        $kz = Direction::create([
            'type' => 'country', 'scope' => 'domestic', 'slug' => 'kazakhstan',
            'name' => ['ru' => 'Казахстан', 'kz' => 'Қазақстан', 'en' => 'Kazakhstan'],
            'photos' => ['https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80'],
        ]);
        $almatyReg = Direction::create(['parent_id' => $kz->id, 'type' => 'region', 'slug' => 'almaty-region', 'name' => ['ru' => 'Алматинская область', 'kz' => 'Алматы облысы', 'en' => 'Almaty Region']]);
        $almaty = Direction::create(['parent_id' => $almatyReg->id, 'type' => 'city', 'slug' => 'almaty', 'name' => ['ru' => 'Алматы', 'kz' => 'Алматы', 'en' => 'Almaty']]);
        $astana = Direction::create(['parent_id' => $kz->id, 'type' => 'city', 'slug' => 'astana', 'name' => ['ru' => 'Астана', 'kz' => 'Астана', 'en' => 'Astana']]);

        $uz = Direction::create(['type' => 'country', 'scope' => 'outbound', 'slug' => 'uzbekistan', 'name' => ['ru' => 'Узбекистан', 'kz' => 'Өзбекстан', 'en' => 'Uzbekistan']]);
        Direction::create(['type' => 'country', 'scope' => 'outbound', 'slug' => 'kyrgyzstan', 'name' => ['ru' => 'Кыргызстан', 'kz' => 'Қырғызстан', 'en' => 'Kyrgyzstan']]);

        // --- Туры ---
        $tours = [
            [
                'slug' => 'almaty-kolsai', 'price' => 245000, 'duration_days' => 5, 'cat' => $eco->id, 'dir' => $almaty->id, 'featured' => true,
                'title' => ['ru' => 'Алматы и Кольсайские озёра', 'kz' => 'Алматы және Көлсай көлдері', 'en' => 'Almaty & Kolsai Lakes'],
                'short' => ['ru' => 'Горы, озёра и свежий воздух', 'kz' => 'Таулар, көлдер және таза ауа', 'en' => 'Mountains, lakes and fresh air'],
                'photo' => 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
            ],
            [
                'slug' => 'charyn-canyon', 'price' => 120000, 'duration_days' => 1, 'trip' => 'one_day', 'cat' => $classic->id, 'dir' => $almaty->id, 'featured' => true,
                'title' => ['ru' => 'Приключение в Чарынском каньоне', 'kz' => 'Шарын шатқалындағы шытырман', 'en' => 'Charyn Canyon Adventure'],
                'short' => ['ru' => 'Каньоны, долины и степь', 'kz' => 'Шатқалдар, аңғарлар және дала', 'en' => 'Canyons, valleys and steppe'],
                'photo' => 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=800&q=80',
            ],
            [
                'slug' => 'astana-city', 'price' => 165000, 'duration_days' => 3, 'cat' => $city->id, 'dir' => $astana->id, 'featured' => true,
                'title' => ['ru' => 'Обзорный тур по Астане', 'kz' => 'Астана қаласына шолу туры', 'en' => 'Astana City Tour'],
                'short' => ['ru' => 'Современная архитектура и культура', 'kz' => 'Заманауи сәулет және мәдениет', 'en' => 'Modern architecture and culture'],
                'photo' => 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
            ],
            [
                'slug' => 'uzbekistan-discovery', 'price' => 390000, 'duration_days' => 8, 'section' => 'foreign', 'cat' => $classic->id, 'dir' => $uz->id, 'featured' => false,
                'title' => ['ru' => 'Открытие Узбекистана', 'kz' => 'Өзбекстанды ашу', 'en' => 'Uzbekistan Discovery'],
                'short' => ['ru' => 'Города Великого шёлкового пути', 'kz' => 'Ұлы Жібек жолының қалалары', 'en' => 'Cities of the Silk Road'],
                'photo' => 'https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?auto=format&fit=crop&w=800&q=80',
            ],
        ];

        foreach ($tours as $t) {
            $tour = Tour::create([
                'slug' => $t['slug'],
                'section' => $t['section'] ?? 'kazakhstan',
                'trip_type' => ($t['section'] ?? 'kazakhstan') === 'kazakhstan' ? ($t['trip'] ?? 'multi_day') : null,
                'title' => $t['title'],
                'short_description' => $t['short'],
                'description' => ['ru' => 'Подробное описание тура появится здесь.', 'en' => 'Detailed tour description goes here.'],
                'price' => $t['price'],
                'currency' => 'KZT',
                'duration_days' => $t['duration_days'],
                'seats' => 12,
                'category_id' => $t['cat'],
                'direction_id' => $t['dir'],
                'photos' => [$t['photo']],
                'status' => 'published',
                'is_featured' => $t['featured'],
            ]);

            $tour->dates()->createMany([
                ['start_date' => now()->addMonth()->toDateString(), 'end_date' => now()->addMonth()->addDays($t['duration_days'])->toDateString(), 'seats' => 12],
                ['start_date' => now()->addMonths(2)->toDateString(), 'end_date' => now()->addMonths(2)->addDays($t['duration_days'])->toDateString(), 'seats' => 12],
            ]);
        }

        // --- Байконур (запуски) ---
        BaikonurLaunch::create([
            'slug' => 'soyuz-ms-2026', 'status' => 'published', 'booking_enabled' => true,
            'title' => ['ru' => 'Пилотируемый запуск «Союз МС»', 'en' => 'Soyuz MS Crewed Launch'],
            'rocket' => ['ru' => 'Союз-2.1а', 'en' => 'Soyuz-2.1a'],
            'description' => ['ru' => 'Наблюдение за пилотируемым пуском с космодрома Байконур.', 'en' => 'Watch a crewed launch from the Baikonur Cosmodrome.'],
            'program' => ['ru' => 'Вывоз ракеты, экскурсии по площадкам, наблюдение за пуском.', 'en' => 'Rollout, site tours, launch viewing.'],
            'conditions' => ['ru' => 'Оформление пропусков заранее, паспорт обязателен.', 'en' => 'Passes arranged in advance, passport required.'],
            'launch_date' => now()->addMonths(3)->toDateString(), 'seats' => 20, 'price' => 850000,
            'photos' => ['https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=900&q=80'],
        ]);
        BaikonurLaunch::create([
            'slug' => 'progress-cargo-2026', 'status' => 'scheduled', 'booking_enabled' => true,
            'title' => ['ru' => 'Грузовой запуск «Прогресс»', 'en' => 'Progress Cargo Launch'],
            'rocket' => ['ru' => 'Союз-2.1а', 'en' => 'Soyuz-2.1a'],
            'description' => ['ru' => 'Грузовая миссия снабжения МКС.', 'en' => 'ISS resupply cargo mission.'],
            'launch_date' => now()->addMonths(5)->toDateString(), 'seats' => 15, 'price' => 720000,
            'photos' => ['https://images.unsplash.com/photo-1457364887197-9150188c107b?auto=format&fit=crop&w=900&q=80'],
        ]);

        // --- FAQ Байконур ---
        Faq::create(['group' => 'baikonur', 'sort' => 1,
            'question' => ['ru' => 'Нужны ли пропуска на космодром?', 'en' => 'Are passes required for the cosmodrome?'],
            'answer' => ['ru' => 'Да, пропуска оформляются заранее, нужен действующий паспорт.', 'en' => 'Yes, passes are arranged in advance; a valid passport is required.']]);
        Faq::create(['group' => 'baikonur', 'sort' => 2,
            'question' => ['ru' => 'Можно ли фотографировать запуск?', 'en' => 'Can I photograph the launch?'],
            'answer' => ['ru' => 'Да, на разрешённых точках наблюдения.', 'en' => 'Yes, at the permitted viewing points.']]);

        Setting::put('baikonur_gallery', [
            'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1457364887197-9150188c107b?auto=format&fit=crop&w=900&q=80',
        ], 'general');

        // --- Отзывы ---
        Review::create(['author_name' => 'Мария', 'country' => 'США', 'rating' => 5, 'is_published' => true, 'sort' => 1,
            'text' => ['ru' => 'Поездка была потрясающей! Великолепная природа и отличная организация.', 'en' => 'The trip was absolutely amazing!']]);
        Review::create(['author_name' => 'Дэвид', 'country' => 'Великобритания', 'rating' => 5, 'is_published' => true, 'sort' => 2,
            'text' => ['ru' => 'Чарынский каньон обязателен к посещению! Очень рекомендую.', 'en' => 'Charyn Canyon is a must-see!']]);
        Review::create(['author_name' => 'Айгерим', 'country' => 'Казахстан', 'rating' => 5, 'is_published' => true, 'sort' => 3,
            'text' => ['ru' => 'Профессиональная команда, поедем снова!', 'en' => 'Professional team, will travel again!']]);

        // --- Баннеры ---
        Banner::create(['title' => ['ru' => 'Откройте Казахстан', 'en' => 'Discover Kazakhstan'], 'image' => 'sharyn.png', 'link' => '/tours', 'is_active' => true, 'sort' => 0]);
        Banner::create(['title' => ['ru' => 'Скидка за раннее бронирование', 'en' => 'Early Booking Discount'], 'image' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=70', 'link' => '/offers', 'is_active' => true, 'sort' => 1]);

        // --- Настройки (контакты/соцсети/карта) ---
        Setting::put('phone', '+7 702 123 45 67', 'contacts');
        Setting::put('email', 'info@turan-asia.kz', 'contacts');
        Setting::put('address', 'г. Алматы, пр. Абая 117/6', 'contacts');
        Setting::put('work_hours', 'Пн–Пт: 9:00–18:00', 'contacts');
        Setting::put('instagram', 'https://instagram.com/turanasia.kz', 'socials');
        Setting::put('telegram', 'https://t.me/turanasia', 'socials');
        Setting::put('whatsapp', '+7 702 123 45 67', 'socials');
        Setting::put('map', ['lat' => 43.2450, 'lng' => 76.9400], 'map');

        // --- SEO ---
        SeoMeta::create(['page' => 'home', 'title' => ['ru' => 'Turan Asia — туры по Казахстану', 'en' => 'Turan Asia — tours in Kazakhstan'], 'description' => ['ru' => 'Авторские туры по Казахстану и Центральной Азии.', 'en' => 'Authored tours across Kazakhstan and Central Asia.']]);
        SeoMeta::create(['page' => 'tours', 'title' => ['ru' => 'Туры по Казахстану — каталог', 'en' => 'Tours catalog']]);
        SeoMeta::create(['page' => 'contacts', 'title' => ['ru' => 'Контакты — Turan Asia', 'en' => 'Contacts — Turan Asia']]);
    }
}
