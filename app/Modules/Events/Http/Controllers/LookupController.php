<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Controllers;

use App\Modules\Events\Enums\EventType;
use App\Modules\Events\Models\CampusLocation;
use App\Modules\Events\Models\DutyType;
use App\Modules\Events\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/** Dropdown lists for the event form. */
class LookupController
{
    public function __invoke(): JsonResponse
    {
        Gate::authorize('create', Event::class);

        return response()->json(['data' => [
            'event_types' => array_map(fn (EventType $t) => ['value' => $t->value, 'label' => $t->label()], EventType::cases()),
            'task_types' => DutyType::query()->orderBy('name')->get(['id', 'name']),
            'locations' => CampusLocation::query()->orderBy('name')->get(['id', 'name']),
        ]]);
    }
}
