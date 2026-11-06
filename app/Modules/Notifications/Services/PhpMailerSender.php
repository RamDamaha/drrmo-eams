<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Services;

use App\Modules\Notifications\Contracts\MailSender;
use PHPMailer\PHPMailer\PHPMailer;

/** Sends through SMTP with PHPMailer. Settings come from config/mail.php (MAIL_* in .env). */
class PhpMailerSender implements MailSender
{
    public function send(string $toEmail, string $toName, string $subject, string $body): void
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = (string) config('mail.phpmailer.host');
        $mail->Port = (int) config('mail.phpmailer.port');
        $mail->CharSet = PHPMailer::CHARSET_UTF8;
        $mail->Timeout = 10;

        $username = (string) config('mail.phpmailer.username');
        $mail->SMTPAuth = $username !== '' && $username !== 'null';
        if ($mail->SMTPAuth) {
            $mail->Username = $username;
            $mail->Password = (string) config('mail.phpmailer.password');
        }

        $encryption = (string) config('mail.phpmailer.encryption');
        $mail->SMTPSecure = match ($encryption) {
            'ssl' => PHPMailer::ENCRYPTION_SMTPS,
            'tls' => PHPMailer::ENCRYPTION_STARTTLS,
            default => '',
        };
        $mail->SMTPAutoTLS = $encryption !== '';

        $mail->setFrom((string) config('mail.from.address'), (string) config('mail.from.name'));
        $mail->addAddress($toEmail, $toName);
        $mail->Subject = $subject;
        $mail->Body = $body;
        $mail->isHTML(false);
        $mail->send();
    }
}
