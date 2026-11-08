<?php

declare(strict_types=1);

namespace App\Modules\Monitoring\Console;

use App\Modules\Events\Contracts\AssignmentLookup;
use Illuminate\Console\Command;

/** Ends duties still open 30 minutes after the shift end. */
class AutoEndDuty extends Command
{
    protected $signature = 'monitoring:auto-end-duty';

    protected $description = 'End duties still open 30 minutes after the shift end';

    public function handle(AssignmentLookup $lookup): int
    {
        $due = $lookup->dueForAutoEnd(now());
        $due->each(fn ($assignment) => $lookup->endDuty($assignment, auto: true));
        $this->info("Auto ended {$due->count()} duties.");

        return self::SUCCESS;
    }
}
