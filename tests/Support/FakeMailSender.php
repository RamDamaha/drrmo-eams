<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Modules\Notifications\Contracts\MailSender;
use RuntimeException;

/** Records every message instead of sending it, so tests can read the code or the link. */
class FakeMailSender implements MailSender
{
    /** @var list<array{to: string, subject: string, body: string}> */
    public array $sent = [];

    public bool $fail = false;

    public function send(string $toEmail, string $toName, string $subject, string $body): void
    {
        if ($this->fail) {
            throw new RuntimeException('smtp down');
        }
        $this->sent[] = ['to' => $toEmail, 'subject' => $subject, 'body' => $body];
    }

    /** The 6 digit sign up code in the last message. */
    public function lastCode(): string
    {
        preg_match('/code is (\d{6})/', (string) end($this->sent)['body'], $m);

        return $m[1];
    }

    /** The reset link in the last message. */
    public function lastLink(): string
    {
        preg_match('#https?://\S+#', (string) end($this->sent)['body'], $m);

        return $m[0];
    }
}
