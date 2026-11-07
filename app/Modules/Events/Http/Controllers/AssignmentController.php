<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Controllers;

use App\Modules\Events\Http\Requests\StoreAssignmentRequest;
use App\Modules\Events\Http\Resources\AssignmentResource;
use App\Modules\Events\Models\Assignment;
use App\Modules\Events\Models\DutyRequirement;
use App\Modules\Events\Models\Event;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

/** Admin assigns marshals and volunteers to an event, each with a task type. */
class AssignmentController
{
    /** Approved people with the role this duty needs, not yet on the event. */
    public function candidates(DutyRequirement $requirement): JsonResponse
    {
        Gate::authorize('assign', Event::class);

        $people = User::query()
            ->with('role:id,code')
            ->where('account_status', 'active')
            ->whereNull('disabled_at')
            ->whereHas('role', fn ($q) => $q->where('code', $requirement->role))
            ->whereNotIn('id', Assignment::query()->where('event_id', $requirement->event_id)->select('user_id'))
            ->orderBy('first_name')->orderBy('last_name')
            ->get();

        return response()->json(['data' => $people->map(fn (User $u) => [
            'id' => $u->id,
            'name' => $u->name,
            'role' => $u->role?->code,
        ])->values()]);
    }

    public function store(StoreAssignmentRequest $request, DutyRequirement $requirement, AuditLogger $audit): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $assignment = $requirement->assignments()->create([
            'event_id' => $requirement->event_id,
            'user_id' => $request->validated('user_id'),
            'duty_type_id' => $requirement->duty_type_id,
            'assigned_by' => $actor->id,
        ]);
        $audit->log('assignment.created', $assignment, meta: ['event_id' => $requirement->event_id, 'requirement_id' => $requirement->id, 'user_id' => $assignment->user_id]);

        return (new AssignmentResource($assignment->load(['user.role', 'dutyType'])))->response()->setStatusCode(201);
    }

    public function destroy(Assignment $assignment, AuditLogger $audit): Response
    {
        Gate::authorize('assign', Event::class);

        $audit->log('assignment.deleted', $assignment, meta: ['event_id' => $assignment->event_id, 'user_id' => $assignment->user_id]);
        $assignment->delete();

        return response()->noContent();
    }
}
