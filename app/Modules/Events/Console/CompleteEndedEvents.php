<?php

declare(strict_types=1);

namespace App\Modules\Events\Console;

use App\Modules\Events\Enums\EventStatus;
use App\Modules\Events\Models\Event;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Console\Command;

/** Published events become completed once they have ended. */
class CompleteEndedEvents extends Command
{
    protected $signature = 'events:complete-ended';

    protected $description = 'Mark published events that have ended as completed';

    public function handle(AuditLogger $audit): int
    {
        $count = 0;
        Event::query()->where('status', EventStatus::Published->value)->where('ends_at', '<', now())
            ->each(function (Event $event) use ($audit, &$count) {
                $event->update(['status' => EventStatus::Completed]);
                $audit->log('event.completed', $event, meta: ['source' => 'system']);
                $count++;
            });

        $this->info("Completed {$count} events.");

        return self::SUCCESS;
    }
}
