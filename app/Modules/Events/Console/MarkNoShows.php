<?php

declare(strict_types=1);

namespace App\Modules\Events\Console;

use App\Modules\Events\Enums\AssignmentStatus;
use App\Modules\Events\Models\Assignment;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Console\Command;

/** Duties that never started become no_show once the shift has ended. */
class MarkNoShows extends Command
{
    protected $signature = 'assignments:mark-no-shows';

    protected $description = 'Mark assignments that never started as no show after the shift ends';

    public function handle(AuditLogger $audit): int
    {
        $count = 0;
        Assignment::query()
            ->whereIn('status', [AssignmentStatus::Assigned->value, AssignmentStatus::Acknowledged->value])
            ->whereHas('requirement', fn ($q) => $q->where('shift_ends_at', '<', now()))
            ->whereHas('event', fn ($q) => $q->where('status', 'published'))
            ->each(function (Assignment $assignment) use ($audit, &$count) {
                $before = $assignment->status->value;
                $assignment->update(['status' => AssignmentStatus::NoShow]);
                $audit->log('assignment.no_show', $assignment, meta: ['event_id' => $assignment->event_id, 'before' => ['status' => $before], 'after' => ['status' => 'no_show'], 'source' => 'system']);
                $count++;
            });

        $this->info("Marked {$count} no shows.");

        return self::SUCCESS;
    }
}
