<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Controllers;

use App\Modules\Access\Models\Role;
use App\Modules\Events\Models\CampusLocation;
use App\Modules\Events\Models\DutyType;
use App\Modules\Events\Models\Event;
use App\Modules\Personnel\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/** Dropdown lists for the event forms. */
class LookupController
{
    public function __invoke(): JsonResponse
    {
        Gate::authorize('update', Event::class);

        return response()->json(['data' => [
            'duty_types' => DutyType::query()->orderBy('name')->get(['id', 'name']),
            'locations' => CampusLocation::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
            'roles' => Role::query()->whereIn('code', ['marshal', 'volunteer'])->orderBy('name')->get(['id', 'code', 'name']),
        ]]);
    }
}
