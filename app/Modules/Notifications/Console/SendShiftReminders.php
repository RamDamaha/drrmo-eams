<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Console;

use App\Modules\Events\Enums\AssignmentStatus;
use App\Modules\Events\Models\Assignment;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Jobs\SendNotificationEmail;
use App\Modules\Notifications\Models\Notification;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

/**
 * Queues the two shift reminders: 6:00 PM (Manila) the evening before, and 1 hour before.
 * Each assignment gets each reminder once, and never after it is cancelled.
 */
class SendShiftReminders extends Command
{
    protected $signature = 'notifications:send-reminders';

    protected $description = 'Queue the evening-before and 1-hour shift reminder emails';

    public function handle(): int
    {
        $now = CarbonImmutable::now();
        $count = 0;

        Assignment::query()
            ->with('requirement')
            ->whereIn('status', [AssignmentStatus::Assigned->value, AssignmentStatus::Acknowledged->value])
            ->whereHas('event', fn ($q) => $q->where('status', 'published'))
            ->whereHas('user', fn ($q) => $q->whereNull('disabled_at'))
            ->whereHas('requirement', fn ($q) => $q->where('shift_starts_at', '>', $now)->where('shift_starts_at', '<=', $now->addDays(2)))
            ->each(function (Assignment $a) use ($now, &$count) {
                $start = CarbonImmutable::instance($a->requirement->shift_starts_at);
                $evening = $start->setTimezone('Asia/Manila')->subDay()->setTime(18, 0);
                $hour = $start->subHour();

                // The evening note is skipped once the 1 hour note is due, so nobody gets two at once.
                if ($now >= $evening && $now < $hour) {
                    $count += $this->queue($a, NotificationType::ReminderEvening);
                }
                if ($now >= $hour) {
                    $count += $this->queue($a, NotificationType::ReminderHour);
                }
            });

        $this->info("Queued {$count} reminders.");

        return self::SUCCESS;
    }

    private function queue(Assignment $a, NotificationType $type): int
    {
        $row = Notification::query()->firstOrCreate(['assignment_id' => $a->id, 'user_id' => $a->user_id, 'type' => $type->value], ['status' => 'queued']);
        if (! $row->wasRecentlyCreated) {
            return 0;
        }
        SendNotificationEmail::dispatch($row);

        return 1;
    }
}
