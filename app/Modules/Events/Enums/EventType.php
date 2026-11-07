<?php

declare(strict_types=1);

namespace App\Modules\Events\Enums;

enum EventType: string
{
    case Academic = 'academic';
    case Ceremony = 'ceremony';
    case Sports = 'sports';
    case Cultural = 'cultural';
    case Drill = 'drill';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Academic => 'Academic',
            self::Ceremony => 'Ceremony',
            self::Sports => 'Sports',
            self::Cultural => 'Cultural',
            self::Drill => 'Drill',
            self::Other => 'Other',
        };
    }
}
