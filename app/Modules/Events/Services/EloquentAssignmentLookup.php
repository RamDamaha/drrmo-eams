<?php

declare(strict_types=1);

namespace App\Modules\Events\Services;

use App\Modules\Events\Contracts\AssignmentLookup;
use App\Modules\Events\Enums\AssignmentStatus;
use App\Modules\Events\Models\Assignment;
use App\Modules\Records\Contracts\AuditLogger;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class EloquentAssignmentLookup implements AssignmentLookup
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function startBlocker(Assignment $assignment, CarbonInterface $now): ?string
    {
        $assignment->loadMissing(['event', 'requirement']);

        if (! in_array($assignment->status, [AssignmentStatus::Assigned, AssignmentStatus::Acknowledged], true)) {
            return 'This duty cannot be started.';
        }
        if ($assignment->event->status->value !== 'published') {
            return 'This event is not open for duty.';
        }

        $starts = $assignment->requirement !== null ? $assignment->requirement->shift_starts_at : $assignment->event->starts_at;
        $ends = $assignment->requirement !== null ? $assignment->requirement->shift_ends_at : $assignment->event->ends_at;

        if ($now->lt($starts->copy()->subMinutes(self::START_EARLY_MINUTES))) {
            return 'You can start duty 15 minutes before your shift begins.';
        }
        if ($now->gte($ends)) {
            return 'This shift has already ended.';
        }

        return null;
    }

    public function startDuty(Assignment $assignment): Assignment
    {
        $before = $assignment->status->value;
        $assignment->update(['status' => AssignmentStatus::OnDuty, 'duty_started_at' => now()]);
        $this->audit->log('assignment.duty_started', $assignment, meta: ['event_id' => $assignment->event_id, 'before' => ['status' => $before], 'after' => ['status' => 'on_duty']]);

        return $assignment;
    }

    public function endDuty(Assignment $assignment, bool $auto = false): Assignment
    {
        $assignment->update(['status' => AssignmentStatus::Completed, 'duty_ended_at' => now()]);
        $this->audit->log('assignment.duty_ended', $assignment, meta: ['event_id' => $assignment->event_id, 'before' => ['status' => 'on_duty'], 'after' => ['status' => 'completed'], 'source' => $auto ? 'system' : 'user']);

        return $assignment;
    }

    public function dueForAutoEnd(CarbonInterface $now): Collection
    {
        return Assignment::query()
            ->where('status', AssignmentStatus::OnDuty->value)
            ->whereHas('requirement', fn ($q) => $q->where('shift_ends_at', '<=', $now->copy()->subMinutes(self::AUTO_END_MINUTES)))
            ->get();
    }
}
