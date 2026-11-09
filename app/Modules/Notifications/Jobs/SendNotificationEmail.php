<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Jobs;

use App\Modules\Notifications\Contracts\MailSender;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

/** Sends one notification email. Retries 3 times, then the row shows as failed. */
class SendNotificationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [30, 120];

    public function __construct(public Notification $notification) {}

    public function handle(MailSender $mail): void
    {
        $n = $this->notification->loadMissing(['user', 'assignment.event', 'assignment.requirement', 'assignment.dutyType']);
        if ($n->status === 'sent' || $n->user === null) {
            return;
        }

        $n->increment('attempts');
        [$subject, $body] = $this->compose($n);
        $mail->send($n->user->email, $n->user->name, $subject, $body);
        $n->update(['status' => 'sent', 'sent_at' => now(), 'last_error' => null]);
    }

    public function failed(Throwable $e): void
    {
        $this->notification->update(['status' => 'failed', 'last_error' => mb_substr($e->getMessage(), 0, 500)]);
    }

    /** @return array{string, string} */
    private function compose(Notification $n): array
    {
        $a = $n->assignment;
        $event = $a?->event?->title ?? 'an event';
        $duty = $a?->dutyType?->name ?? 'a duty';
        $when = $a?->requirement?->shift_starts_at->format('M j, Y g:i A') ?? 'to be confirmed';
        $link = url('/').'?assignment='.($a?->id ?? '');

        $verb = match ($n->type) {
            NotificationType::AssignmentCreated->value => ['New duty assignment', 'You have been assigned to a duty.'],
            NotificationType::AssignmentChanged->value => ['Duty assignment changed', 'Your duty assignment was changed.'],
            default => ['Duty assignment cancelled', 'Your duty assignment was cancelled.'],
        };
        $reason = $n->type === NotificationType::AssignmentCancelled->value && $a?->cancel_reason ? "\nReason: {$a->cancel_reason}" : '';

        $body = "Hello {$n->user?->first_name},\n\n{$verb[1]}\n\nEvent: {$event}\nDuty: {$duty}\nShift: {$when}{$reason}\n\nOpen it here: {$link}\n\nZPPSU DRRMO";

        return [$verb[0].': '.$event, $body];
    }
}
