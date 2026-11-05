<?php

declare(strict_types=1);

namespace App\Modules\Records\Enums;

enum ConsentPurpose: string
{
    case PrivacyNotice = 'privacy_notice';
    case LocationTracking = 'location_tracking';
}
