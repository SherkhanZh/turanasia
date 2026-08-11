<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

/**
 * Смена логина и пароля администратора без правки базы руками.
 *
 *   php artisan admin:credentials
 *
 * Пароль вводится скрыто и нигде не остаётся — ни в выводе, ни в истории bash.
 * После смены все ранее выданные токены отзываются, то есть открытые сессии
 * админки разлогиниваются.
 */
class AdminCredentials extends Command
{
    protected $signature = 'admin:credentials';

    protected $description = 'Изменить email (логин) и пароль администратора';

    public function handle(): int
    {
        $admins = User::role('admin')->orderBy('id')->get();

        if ($admins->isEmpty()) {
            $this->warn('Администраторов не найдено — создаём нового.');
            $user = new User(['name' => 'Администратор', 'is_active' => true]);
        } else {
            $choices = $admins->mapWithKeys(fn ($u) => [$u->id => "#{$u->id}  {$u->email}  ({$u->name})"])->all();
            $choices['new'] = 'Создать нового администратора';

            $picked = $this->choice('Кого меняем?', $choices, array_key_first($choices));
            $id = (int) filter_var($picked, FILTER_SANITIZE_NUMBER_INT);

            $user = str_contains($picked, 'Создать')
                ? new User(['name' => 'Администратор', 'is_active' => true])
                : $admins->firstWhere('id', $id);
        }

        $email = $this->ask('Email (он же логин)', $user->email);
        $password = $this->secret('Новый пароль (минимум 10 символов)');
        $confirm = $this->secret('Повторите пароль');

        if ($password !== $confirm) {
            $this->error('Пароли не совпадают. Ничего не изменено.');

            return self::FAILURE;
        }

        $validator = Validator::make(
            ['email' => $email, 'password' => $password],
            [
                'email' => ['required', 'email', 'max:190'],
                'password' => ['required', 'string', 'min:10'],
            ],
            [
                'email.email' => 'Некорректный email.',
                'password.min' => 'Пароль короче 10 символов.',
            ]
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $taken = User::where('email', $email)->where('id', '!=', $user->id ?? 0)->exists();
        if ($taken) {
            $this->error('Этот email уже занят другим пользователем.');

            return self::FAILURE;
        }

        $isNew = ! $user->exists;

        $user->email = $email;
        $user->password = $password;   // хэшируется автоматически (cast 'hashed')
        $user->is_active = true;
        $user->save();

        if ($isNew) {
            $user->assignRole('admin');
        }

        // Отзываем все выданные токены: старые сессии перестают работать
        $revoked = $user->tokens()->delete();

        $this->newLine();
        $this->info(($isNew ? 'Администратор создан: ' : 'Данные обновлены: ').$user->email);
        if ($revoked) {
            $this->line("Отозвано активных сессий: {$revoked}");
        }

        return self::SUCCESS;
    }
}
