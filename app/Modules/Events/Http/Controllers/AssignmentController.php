<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Controllers;

use App\Modules\Events\Enums\AssignmentStatus;
use App\Modules\Events\Http\Requests\StoreAssignmentsRequest;
use App\Modules\Events\Http\Resources\AssignmentResource;
use App\Modules\Events\Models\Assignment;
use App\Modules\Events\Models\DutyRequirement;
use App\Modules\Events\Models\Event;
use App\Modules\Personnel\Enums\AvailabilityStatus;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/** Assigning people to a requirement (admin) and listing my own assignments (any field role). */
class AssignmentController
{
    /** Active people with the needed role (and team, when one is needed). */
    public function candidates(DutyRequirement $requirement): JsonResponse
    {
        Gate::authorize('assign', Event::class);

        $users = User::query()
            ->where('role_id', $requirement->role_id)
            ->where('status', AvailabilityStatus::Active->value)
            ->whereNull('disabled_at')
            ->when($requirement->team_needed, fn ($q, $team) => $q->where('team', $team->value))
            ->whereNotIn('id', $requirement->assignments()->select('user_id'))
            ->orderBy('name')
            ->get(['id', 'name', 'team']);

        return response()->json(['data' => $users->map(fn (User $u) => [
            'id' => $u->id, 'name' => $u->name, 'team' => $u->team?->value,
        ])->values()]);
    }

    public function store(StoreAssignmentsRequest $request, DutyRequirement $requirement, AuditLogger $audit): JsonResponse
    {
        Gate::authorize('assign', Event::class);

        /** @var User $admin */
        $admin = $request->user();
        /** @var list<int> $ids */
        $ids = $request->validated('user_ids');

        $users = User::query()->whereIn('id', $ids)->get();
        $wrongRole = $users->first(fn (User $u) => $u->role_id !== $requirement->role_id
            || $u->status !== AvailabilityStatus::Active
            || $u->isDisabled());

        if ($wrongRole !== null) {
            throw ValidationException::withMessages([
                'user_ids' => ['Only active people with the needed role can be assigned.'],
            ]);
        }

        if ($requirement->assignments()->whereIn('user_id', $ids)->exists()) {
            throw ValidationException::withMessages(['user_ids' => ['Someone is already assigned to this requirement.']]);
        }

        $created = DB::transaction(function () use ($users, $requirement, $admin, $audit) {
            return $users->map(function (User $user) use ($requirement, $admin, $audit) {
                $assignment = Assignment::query()->create([
                    'requirement_id' => $requirement->id,
                    'user_id' => $user->id,
                    'status' => AssignmentStatus::Assigned,
                    'assigned_by' => $admin->id,
                    'assigned_at' => now(),
                ]);
                $audit->log('assignment.created', $assignment, null, ['user_id' => $user->id]);

                return $assignment->load('user');
            });
        });

        return AssignmentResource::collection($created)->response()->setStatusCode(201);
    }

    public function mine(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewOwnList', Assignment::class);

        /** @var User $user */
        $user = $request->user();

        return AssignmentResource::collection(
            Assignment::query()
                ->where('user_id', $user->id)
                ->whereNot('status', AssignmentStatus::Cancelled->value)
                ->with('requirement.dutyType', 'requirement.event.location')
                ->join('event_duty_requirements', 'event_duty_requirements.id', '=', 'assignments.requirement_id')
                ->orderBy('event_duty_requirements.shift_start')
                ->select('assignments.*')
                ->paginate(25),
        );
    }
}
