<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Controllers;

use App\Modules\Events\Enums\EventStatus;
use App\Modules\Events\Http\Requests\StoreEventRequest;
use App\Modules\Events\Http\Resources\EventResource;
use App\Modules\Events\Models\Event;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/** Admin screens for events: list and create. */
class EventController
{
    public function index(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Event::class);

        return EventResource::collection(
            Event::query()->with('location')->orderByDesc('starts_at')->paginate(25),
        );
    }

    public function store(StoreEventRequest $request, AuditLogger $audit): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $event = Event::query()->create([...$request->utcData(), 'status' => EventStatus::Draft, 'created_by' => $user->id]);
        $audit->log('event.created', $event);

        return (new EventResource($event->load('location')))->response()->setStatusCode(201);
    }

    public function show(Event $event): EventResource
    {
        Gate::authorize('viewAny', Event::class);

        return new EventResource($event->load(['location', 'assignments' => fn ($q) => $q->with(['user.role', 'dutyType'])->orderBy('id')]));
    }
}
