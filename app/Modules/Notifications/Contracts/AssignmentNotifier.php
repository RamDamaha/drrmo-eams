<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Contracts;

use App\Modules\Events\Models\Assignment;

/** Events calls this after an assignment is created, moved or cancelled. Each call queues one notification and one email. */
interface AssignmentNotifier
{
    public function created(Assignment $assignment): void;

    public function changed(Assignment $assignment): void;

    public function cancelled(Assignment $assignment): void;
}
