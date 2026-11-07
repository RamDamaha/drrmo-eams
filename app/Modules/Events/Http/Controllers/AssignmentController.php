<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Controllers;

use App\Modules\Events\Http\Requests\StoreAssignmentRequest;
use App\Modules\Events\Http\Resources\AssignmentResource;
use App\Modules\Events\Models\Assignment;
use App\Modules\Events\Models\Event;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

/** Admin assigns marshals and volunteers to an event, each with a task type. */
class AssignmentController
{
    /** Approved marshals and volunteers not yet on this event. */
    public function candidates(Event $event): JsonResponse
    {
        Gate::authorize('assign', Event::class);

        $people = User::query()
            ->with('role:id,code')
            ->where('account_status', 'active')
            ->whereNull('disabled_at')
            ->whereHas('role', fn ($q) => $q->whereIn('code', ['marshal', 'volunteer']))
            ->whereNotIn('id', Assignment::query()->where('event_id', $event->id)->select('user_id'))
            ->orderBy('first_name')->orderBy('last_name')
            ->get();

        return response()->json(['data' => $people->map(fn (User $u) => [
            'id' => $u->id,
            'name' => $u->name,
            'role' => $u->role?->code,
        ])->values()]);
    }

    public function store(StoreAssignmentRequest $request, Event $event, AuditLogger $audit): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $assignment = $event->assignments()->create([...$request->validated(), 'assigned_by' => $actor->id]);
        $audit->log('assignment.created', $assignment, meta: ['event_id' => $event->id, 'user_id' => $assignment->user_id]);

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
