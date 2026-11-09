<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Contracts;

interface MailSender
{
    /**
     * Send one email. $body is the plain text version. $html, when given, is the branded
     * version (build both with EmailMessage). Throws when it cannot be sent.
     *
     * Other modules use this contract and never talk to PHPMailer directly.
     */
    public function send(string $toEmail, string $toName, string $subject, string $body, ?string $html = null): void;
}
