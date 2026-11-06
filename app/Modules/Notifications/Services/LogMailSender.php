<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Services;

use App\Modules\Notifications\Contracts\MailSender;
use Illuminate\Support\Facades\Log;

/** Local development: writes the whole message, including any code, to storage/logs/laravel.log. */
class LogMailSender implements MailSender
{
    public function send(string $toEmail, string $toName, string $subject, string $body): void
    {
        Log::info("Mail to {$toName} <{$toEmail}>\nSubject: {$subject}\n\n{$body}");
    }
}
