<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Contracts;

/**
 * One branded email, built in short blocks. It renders to HTML (the shared layout in
 * Notifications/Views/email.blade.php) and to a plain text fallback with the same words.
 *
 * Other modules build one of these and pass text() and html() to MailSender::send().
 */
final class EmailMessage
{
    /** Logos sent inside each HTML email. The key is the cid used in the template. */
    public const LOGOS = [
        'zppsu-logo' => 'images/brand/email/zppsu-logo.png',
        'drrmo-logo' => 'images/brand/email/drrmo-logo.png',
    ];

    private string $preheader = '';

    private ?string $greeting = null;

    /** @var list<array{type: string, label: string, text: string, url: string, code: string, rows: array<string, string>}> */
    private array $blocks = [];

    public function __construct(public readonly string $subject, public readonly string $heading) {}

    public static function make(string $subject, string $heading): self
    {
        return new self($subject, $heading);
    }

    /** The short line inboxes show next to the subject. */
    public function preheader(string $text): self
    {
        $this->preheader = $text;

        return $this;
    }

    public function greeting(string $name): self
    {
        $this->greeting = "Hello {$name},";

        return $this;
    }

    public function line(string $text): self
    {
        $this->add('line', text: $text);

        return $this;
    }

    /** A one time code in large type. Plain text reads "<label> is <code>". */
    public function code(string $label, string $code): self
    {
        $this->add('code', label: $label, code: $code);

        return $this;
    }

    /** The main action. Use one per email. The HTML also shows the link for copying. */
    public function button(string $label, string $url): self
    {
        $this->add('button', label: $label, url: $url);

        return $this;
    }

    /** @param  array<string, string>  $rows  label => value */
    public function details(array $rows): self
    {
        $this->add('details', rows: $rows);

        return $this;
    }

    /** A boxed note with a small label, such as a reason. */
    public function notice(string $label, string $text): self
    {
        $this->add('notice', label: $label, text: $text);

        return $this;
    }

    /** @param  array<string, string>  $rows */
    private function add(string $type, string $label = '', string $text = '', string $url = '', string $code = '', array $rows = []): void
    {
        $this->blocks[] = ['type' => $type, 'label' => $label, 'text' => $text, 'url' => $url, 'code' => $code, 'rows' => $rows];
    }

    public function html(): string
    {
        return view('eams-notifications::email', [
            'subject' => $this->subject,
            'heading' => $this->heading,
            'preheader' => $this->preheader,
            'greeting' => $this->greeting,
            'blocks' => $this->blocks,
        ])->render();
    }

    public function text(): string
    {
        $parts = $this->greeting !== null ? [$this->greeting] : [];

        foreach ($this->blocks as $b) {
            $parts[] = match ($b['type']) {
                'code' => "{$b['label']} is {$b['code']}",
                'button' => "{$b['label']}:\n{$b['url']}",
                'details' => implode("\n", array_map(fn (string $k, string $v) => "{$k}: {$v}", array_keys($b['rows']), $b['rows'])),
                'notice' => "{$b['label']}: {$b['text']}",
                default => $b['text'],
            };
        }

        $parts[] = "ZPPSU DRRMO\nDisaster Risk Reduction and Management Office\nThis is an automated email. Replies are not read.";

        return implode("\n\n", $parts);
    }
}
