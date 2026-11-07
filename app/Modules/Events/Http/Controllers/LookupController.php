<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Controllers;

use App\Modules\Events\Models\CampusLocation;
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
            'locations' => CampusLocation::query()->orderBy('name')->get(['id', 'name']),
        ]]);
    }
}
