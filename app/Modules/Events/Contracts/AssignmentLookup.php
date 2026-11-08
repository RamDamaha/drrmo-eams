<?php

declare(strict_types=1);

namespace App\Modules\Events\Contracts;

use App\Modules\Events\Models\Assignment;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/** What Monitoring may do with assignments. Monitoring never writes the assignments table itself. */
interface AssignmentLookup
{
    /** Minutes before the shift start when duty may be started. */
    public const START_EARLY_MINUTES = 15;

    /** Minutes after the shift end when an open duty is ended by the system. */
    public const AUTO_END_MINUTES = 30;

    /** Why this assignment cannot start duty at this time, or null when it can. */
    public function startBlocker(Assignment $assignment, CarbonInterface $now): ?string;

    public function startDuty(Assignment $assignment): Assignment;

    /** Set completed and duty_ended_at. $auto marks a system end for the audit trail. */
    public function endDuty(Assignment $assignment, bool $auto = false): Assignment;

    /** @return Collection<int, Assignment> On duty assignments whose shift ended long enough ago. */
    public function dueForAutoEnd(CarbonInterface $now): Collection;
}
