<?php

declare(strict_types=1);

namespace App\Modules\Events\Enums;

enum AssignmentStatus: string
{
    case Assigned = 'assigned';
    case Acknowledged = 'acknowledged';
    case OnDuty = 'on_duty';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case NoShow = 'no_show';
}
