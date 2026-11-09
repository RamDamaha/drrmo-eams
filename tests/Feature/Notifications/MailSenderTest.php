<?php

declare(strict_types=1);

use App\Modules\Notifications\Contracts\MailSender;
use App\Modules\Notifications\Services\LogMailSender;
use App\Modules\Notifications\Services\PhpMailerSender;
use Illuminate\Support\Facades\Log;

it('writes the message to the log when MAIL_MAILER is log', function () {
    config(['mail.default' => 'log', 'mail.phpmailer.host' => 'smtp.example.test']);

    expect(app(MailSender::class))->toBeInstanceOf(LogMailSender::class);
});

it('writes the message to the log when no SMTP host is set', function () {
    config(['mail.default' => 'smtp', 'mail.phpmailer.host' => null]);

    expect(app(MailSender::class))->toBeInstanceOf(LogMailSender::class);
});

it('uses PHPMailer when an SMTP host is set and the app is not testing', function () {
    config(['mail.default' => 'smtp', 'mail.phpmailer.host' => 'smtp.example.test']);
    app()->detectEnvironment(fn () => 'local');

    // Only builds the sender. Nothing is sent.
    expect(app(MailSender::class))->toBeInstanceOf(PhpMailerSender::class);
});

it('never uses the real sender in the testing environment, even when an SMTP host is set', function () {
    config(['mail.default' => 'smtp', 'mail.phpmailer.host' => 'smtp.example.test']);

    expect(app()->environment('testing'))->toBeTrue()
        ->and(app(MailSender::class))->toBeInstanceOf(LogMailSender::class);
});

it('writes the message to the log when MAIL_MAILER is array', function () {
    config(['mail.default' => 'array', 'mail.phpmailer.host' => 'smtp.example.test']);
    app()->detectEnvironment(fn () => 'local');

    expect(app(MailSender::class))->toBeInstanceOf(LogMailSender::class);
});

it('logs the full message including the code', function () {
    Log::spy();

    (new LogMailSender)->send('ana@example.test', 'Ana', 'Your code', 'Your confirmation code is 123456');

    Log::shouldHaveReceived('info')->withArgs(fn (string $message) => str_contains($message, '123456') && str_contains($message, 'ana@example.test'))->once();
});
