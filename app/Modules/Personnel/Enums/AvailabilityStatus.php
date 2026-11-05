<?php

declare(strict_types=1);

namespace App\Modules\Personnel\Enums;

/** On-call availability. It is not the same as whether the account can log in. */
enum AvailabilityStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
}
