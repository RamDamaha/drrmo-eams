<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Controllers;

use App\Modules\Events\Http\Requests\StoreRequirementRequest;
use App\Modules\Events\Http\Resources\RequirementResource;
use App\Modules\Events\Models\DutyRequirement;
use App\Modules\Events\Models\Event;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

/** Admin adds and removes duty requirements on an event. */
class RequirementController
{
    public function store(StoreRequirementRequest $request, Event $event, AuditLogger $audit): JsonResponse
    {
        $requirement = $event->requirements()->create($request->utcData());
        $audit->log('requirement.created', $requirement, meta: ['event_id' => $event->id]);

        return (new RequirementResource($requirement->load(['dutyType', 'assignments'])))->response()->setStatusCode(201);
    }

    public function destroy(DutyRequirement $requirement, AuditLogger $audit): Response|JsonResponse
    {
        Gate::authorize('create', Event::class);

        if ($requirement->assignments()->exists()) {
            return response()->json(['message' => 'Remove the assigned people first.'], 422);
        }
        $audit->log('requirement.deleted', $requirement, meta: ['event_id' => $requirement->event_id]);
        $requirement->delete();

        return response()->noContent();
    }
}
