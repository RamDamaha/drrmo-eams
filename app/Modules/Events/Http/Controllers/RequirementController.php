<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Controllers;

use App\Modules\Events\Http\Requests\StoreRequirementRequest;
use App\Modules\Events\Http\Resources\RequirementResource;
use App\Modules\Events\Models\Event;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/** Adds a duty requirement (who is needed, when) to an event. */
class RequirementController
{
    public function store(StoreRequirementRequest $request, Event $event, AuditLogger $audit): JsonResponse
    {
        Gate::authorize('update', Event::class);

        $requirement = $event->requirements()->create($request->utcData());
        $audit->log('requirement.created', $requirement);

        return (new RequirementResource($requirement->load(['dutyType', 'role'])))->response()->setStatusCode(201);
    }
}
