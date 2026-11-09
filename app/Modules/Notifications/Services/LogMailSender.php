<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Services;

use App\Modules\Notifications\Contracts\EmailMessage;
use App\Modules\Notifications\Contracts\MailSender;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

/**
 * Local development: writes the whole plain text message, including any code, to
 * storage/logs/laravel.log. The HTML version of the last email goes to
 * storage/logs/mail-preview.html, so it can be opened in a browser.
 */
class LogMailSender implements MailSender
{
    public function send(string $toEmail, string $toName, string $subject, string $body, ?string $html = null): void
    {
        Log::info("Mail to {$toName} <{$toEmail}>\nSubject: {$subject}\n\n{$body}");

        if ($html !== null) {
            File::put(storage_path('logs/mail-preview.html'), $this->inlineLogos($html));
        }
    }

    /** Swap cid: logo links for data URIs so the preview file shows them. */
    private function inlineLogos(string $html): string
    {
        foreach (EmailMessage::LOGOS as $cid => $path) {
            if (is_file(public_path($path))) {
                $html = str_replace("cid:{$cid}", 'data:image/png;base64,'.base64_encode((string) file_get_contents(public_path($path))), $html);
            }
        }

        return $html;
    }
}
