<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Controllers;

use App\Modules\Events\Enums\AssignmentStatus;
use App\Modules\Events\Models\Assignment;
use App\Modules\Events\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/** Admin dashboard: what is happening today and who needs a nudge. */
class DashboardController
{
    public function __invoke(): JsonResponse
    {
        Gate::authorize('viewAny', Event::class);

        $now = now();
        $events = Event::query()->with('location:id,name')->withCount(['assignments as people_count' => fn ($q) => $q->live()])
            ->where('status', 'published')
            ->where('starts_at', '<=', $now->copy()->endOfDay())
            ->where('ends_at', '>=', $now->copy()->startOfDay())
            ->orderBy('starts_at')->get();

        $base = fn () => Assignment::query()
            ->with(['user:id,first_name,last_name', 'event:id,title', 'requirement:id,shift_starts_at,shift_ends_at'])
            ->whereHas('event', fn ($q) => $q->where('status', 'published'))
            ->whereHas('requirement', fn ($q) => $q->where('shift_ends_at', '>', $now));

        $row = fn (Assignment $a) => [
            'id' => $a->id,
            'person' => $a->user->name,
            'event' => ['id' => $a->event->id, 'title' => $a->event->title],
            'starts_at' => $a->requirement?->shift_starts_at->toIso8601String(),
        ];

        $unacknowledged = $base()->where('status', AssignmentStatus::Assigned->value)->get()->sortBy('requirement.shift_starts_at')->values();
        $late = $base()->whereIn('status', [AssignmentStatus::Assigned->value, AssignmentStatus::Acknowledged->value])
            ->whereHas('requirement', fn ($q) => $q->where('shift_starts_at', '<=', $now->copy()->subMinutes(30)))
            ->get()->sortBy('requirement.shift_starts_at')->values();

        return response()->json(['data' => [
            'today_events' => $events->map(fn (Event $e) => [
                'id' => $e->id,
                'title' => $e->title,
                'location' => $e->location?->name,
                'starts_at' => $e->starts_at->toIso8601String(),
                'ends_at' => $e->ends_at->toIso8601String(),
                'people_count' => $e->people_count,
            ])->values(),
            'unacknowledged' => $unacknowledged->map($row)->values(),
            'not_on_duty' => $late->map($row)->values(),
        ]]);
    }
}
