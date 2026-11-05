<?php

declare(strict_types=1);

namespace App\Modules\Personnel\Enums;

enum Team: string
{
    case Security = 'security';
    case Ert = 'ert';
    case FireSuppression = 'fire_suppression';
}
