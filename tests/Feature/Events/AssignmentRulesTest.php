<?php

declare(strict_types=1);

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Events\Models\Assignment;
use App\Modules\Events\Models\DutyType;
use App\Modules\Events\Models\Event;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Models\AuditLog;

beforeEach(function () {
    $this->withHeaders(['Referer' => 'http://localhost', 'X-Requested-With' => 'XMLHttpRequest']);
    $this->seed();
});

function shift(Event $event, array $over = []): array
{
    return [
        'duty_type_id' => DutyType::query()->firstOrFail()->id,
        'role' => 'marshal',
        'headcount' => 1,
        'shift_starts_at' => $event->starts_at,
        'shift_ends_at' => $event->ends_at,
        ...$over,
    ];
}

function assignTo($requirement, User $user, array $over = []): Assignment
{
    return $requirement->assignments()->create(['event_id' => $requirement->event_id, 'user_id' => $user->id, 'duty_type_id' => $requirement->duty_type_id, ...$over]);
}

it('edits an event, audits before and after, and keeps duty shifts inside the new times', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $event = Event::factory()->create(['title' => 'Old title']);
    $event->requirements()->create(shift($event));
    $cookies = loginCookies($admin);
    $payload = fn (array $o = []) => [
        'title' => 'New title', 'event_type' => 'ceremony', 'campus_location_id' => $event->campus_location_id,
        'starts_at' => $event->starts_at->toIso8601String(), 'ends_at' => $event->ends_at->toIso8601String(), ...$o,
    ];

    withAuthCookies($cookies)->putJson("/api/events/{$event->id}", $payload())->assertOk()->assertJsonPath('data.title', 'New title');
    withAuthCookies($cookies)->putJson("/api/events/{$event->id}", $payload(['ends_at' => $event->ends_at->subHour()->toIso8601String()]))
        ->assertUnprocessable()->assertJsonValidationErrors(['starts_at']);

    $log = AuditLog::query()->where('action', 'event.updated')->firstOrFail();
    expect($log->meta['before']['title'])->toBe('Old title')->and($log->meta['after']['title'])->toBe('New title');
});

it('keeps event editing away from non-admins and cancelled events', function () {
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $event = Event::factory()->create(['status' => 'cancelled']);
    $body = ['title' => 'X', 'event_type' => 'ceremony', 'campus_location_id' => $event->campus_location_id,
        'starts_at' => $event->starts_at->toIso8601String(), 'ends_at' => $event->ends_at->toIso8601String()];

    withAuthCookies(loginCookies($marshal))->putJson("/api/events/{$event->id}", $body)->assertForbidden();
    withAuthCookies(loginCookies($admin))->putJson("/api/events/{$event->id}", $body)->assertUnprocessable();
});

it('blocks an overlapping shift and shows it as a conflict in the candidates', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $one = Event::factory()->create(['title' => 'First event']);
    $two = Event::factory()->create(['starts_at' => $one->starts_at->copy()->addHour(), 'ends_at' => $one->ends_at->copy()->addHour()]);
    assignTo($one->requirements()->create(shift($one)), $marshal);
    $second = $two->requirements()->create(shift($two));
    $cookies = loginCookies($admin);

    withAuthCookies($cookies)->getJson("/api/requirements/{$second->id}/candidates")
        ->assertOk()->assertJsonPath('data.0.conflict', 'First event');
    withAuthCookies($cookies)->postJson("/api/requirements/{$second->id}/assignments", ['user_id' => $marshal->id])
        ->assertUnprocessable()->assertJsonValidationErrors(['user_id']);
    expect(Assignment::query()->count())->toBe(1);
});

it('does not count a cancelled assignment as a clash', function () {
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $one = Event::factory()->create();
    $two = Event::factory()->create();
    assignTo($one->requirements()->create(shift($one)), $marshal, ['status' => 'cancelled']);
    $second = $two->requirements()->create(shift($two));

    withAuthCookies(loginCookies($admin))->postJson("/api/requirements/{$second->id}/assignments", ['user_id' => $marshal->id])->assertCreated();
});

it('blocks an inactive person', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $marshal = User::factory()->role(RoleCode::Marshal)->create(['account_status' => 'pending_approval']);
    $event = Event::factory()->create();
    $req = $event->requirements()->create(shift($event));

    withAuthCookies(loginCookies($admin))->postJson("/api/requirements/{$req->id}/assignments", ['user_id' => $marshal->id])->assertUnprocessable();
});

it('allows a full duty only with an override reason and audits it', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    [$a, $b] = User::factory()->role(RoleCode::Marshal)->count(2)->create()->all();
    $event = Event::factory()->create();
    $req = $event->requirements()->create(shift($event));
    $cookies = loginCookies($admin);
    $url = "/api/requirements/{$req->id}/assignments";

    withAuthCookies($cookies)->postJson($url, ['user_id' => $a->id])->assertCreated();
    withAuthCookies($cookies)->postJson($url, ['user_id' => $b->id])->assertUnprocessable()->assertJsonValidationErrors(['override_reason']);
    withAuthCookies($cookies)->postJson($url, ['user_id' => $b->id, 'override_reason' => 'Extra hands needed at the gate'])->assertCreated();

    expect(Assignment::query()->where('user_id', $b->id)->value('override_reason'))->toBe('Extra hands needed at the gate')
        ->and(AuditLog::query()->where('action', 'assignment.created')->get()->last()->meta['override_reason'])->toBe('Extra hands needed at the gate');
});

it('acknowledges once, never for someone else, and repeating it does nothing', function () {
    $mine = User::factory()->role(RoleCode::Marshal)->create();
    $other = User::factory()->role(RoleCode::Marshal)->create();
    $event = Event::factory()->create(['status' => 'published']);
    $assignment = assignTo($event->requirements()->create(shift($event)), $mine);

    withAuthCookies(loginCookies($other))->postJson("/api/me/assignments/{$assignment->id}/acknowledge")->assertForbidden();
    $cookies = loginCookies($mine);
    withAuthCookies($cookies)->postJson("/api/me/assignments/{$assignment->id}/acknowledge")->assertOk()->assertJsonPath('data.status', 'acknowledged');
    $first = $assignment->fresh()->acknowledged_at;
    $assignment->update(['acknowledged_at' => $first->copy()->subHour()]);
    $first = $assignment->fresh()->acknowledged_at;
    withAuthCookies($cookies)->postJson("/api/me/assignments/{$assignment->id}/acknowledge")->assertOk();

    expect($assignment->fresh()->acknowledged_at->equalTo($first))->toBeTrue()
        ->and(AuditLog::query()->where('action', 'assignment.acknowledged')->count())->toBe(1);
});

it('cancels an assignment with a reason, audits it, and refuses on duty ones', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $event = Event::factory()->create();
    $req = $event->requirements()->create(shift($event));
    $assignment = assignTo($req, $marshal);
    $cookies = loginCookies($admin);

    withAuthCookies($cookies)->postJson("/api/assignments/{$assignment->id}/cancel", [])->assertUnprocessable()->assertJsonValidationErrors(['reason']);
    withAuthCookies($cookies)->postJson("/api/assignments/{$assignment->id}/cancel", ['reason' => 'Person is sick'])->assertOk()->assertJsonPath('data.status', 'cancelled');

    $log = AuditLog::query()->where('action', 'assignment.cancelled')->firstOrFail();
    expect($log->meta['before']['status'])->toBe('assigned')->and($log->meta['reason'])->toBe('Person is sick');

    $onDuty = assignTo($req, User::factory()->role(RoleCode::Marshal)->create(), ['status' => 'on_duty']);
    withAuthCookies($cookies)->postJson("/api/assignments/{$onDuty->id}/cancel", ['reason' => 'Changed my mind'])->assertUnprocessable();
});

it('moves a person to another duty of the same event', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $event = Event::factory()->create();
    $one = $event->requirements()->create(shift($event));
    $two = $event->requirements()->create(shift($event, ['headcount' => 3]));
    $assignment = assignTo($one, $marshal, ['status' => 'acknowledged']);

    withAuthCookies(loginCookies($admin))->patchJson("/api/assignments/{$assignment->id}", ['requirement_id' => $two->id])->assertOk();

    expect($assignment->fresh()->requirement_id)->toBe($two->id)->and($assignment->fresh()->status->value)->toBe('assigned')
        ->and(AuditLog::query()->where('action', 'assignment.updated')->count())->toBe(1);
});

it('keeps assignment changes away from non-admins', function () {
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $event = Event::factory()->create();
    $req = $event->requirements()->create(shift($event));
    $assignment = assignTo($req, $marshal);
    $cookies = loginCookies($marshal);

    withAuthCookies($cookies)->patchJson("/api/assignments/{$assignment->id}", ['requirement_id' => $req->id])->assertForbidden();
    withAuthCookies($cookies)->postJson("/api/assignments/{$assignment->id}/cancel", ['reason' => 'No reason really'])->assertForbidden();
    withAuthCookies($cookies)->postJson("/api/assignments/{$assignment->id}/no-show")->assertForbidden();
    withAuthCookies($cookies)->getJson('/api/dashboard')->assertForbidden();
});

it('marks assignments that never started as no show after the shift ends', function () {
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $other = User::factory()->role(RoleCode::Marshal)->create();
    $past = Event::factory()->create(['status' => 'published', 'starts_at' => now()->subDay(), 'ends_at' => now()->subDay()->addHours(4)]);
    $future = Event::factory()->create(['status' => 'published']);
    $missed = assignTo($past->requirements()->create(shift($past)), $marshal);
    $upcoming = assignTo($future->requirements()->create(shift($future)), $other);
    $worked = assignTo($past->requirements()->create(shift($past)), $other, ['status' => 'completed']);

    $this->artisan('assignments:mark-no-shows')->assertSuccessful();

    expect($missed->fresh()->status->value)->toBe('no_show')
        ->and($upcoming->fresh()->status->value)->toBe('assigned')
        ->and($worked->fresh()->status->value)->toBe('completed')
        ->and(AuditLog::query()->where('action', 'assignment.no_show')->count())->toBe(1);
});

it('lets an admin mark a no show only after the shift has started', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $started = Event::factory()->create(['starts_at' => now()->subHour(), 'ends_at' => now()->addHours(3)]);
    $later = Event::factory()->create();
    $a = assignTo($started->requirements()->create(shift($started)), $marshal);
    $b = assignTo($later->requirements()->create(shift($later)), $marshal);
    $cookies = loginCookies($admin);

    withAuthCookies($cookies)->postJson("/api/assignments/{$b->id}/no-show")->assertUnprocessable();
    withAuthCookies($cookies)->postJson("/api/assignments/{$a->id}/no-show")->assertOk()->assertJsonPath('data.status', 'no_show');
});

it('shows the admin dashboard with today, unacknowledged and late people', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $late = User::factory()->role(RoleCode::Marshal)->create();
    $fresh = User::factory()->role(RoleCode::Marshal)->create();
    $event = Event::factory()->create(['status' => 'published', 'starts_at' => now()->subHour(), 'ends_at' => now()->addHours(5)]);
    $req = $event->requirements()->create(shift($event, ['headcount' => 2]));
    assignTo($req, $late);
    assignTo($req, $fresh, ['status' => 'acknowledged', 'acknowledged_at' => now()]);

    withAuthCookies(loginCookies($admin))->getJson('/api/dashboard')->assertOk()
        ->assertJsonCount(1, 'data.today_events')
        ->assertJsonPath('data.today_events.0.people_count', 2)
        ->assertJsonCount(1, 'data.unacknowledged')
        ->assertJsonCount(2, 'data.not_on_duty');
});

it('gives coordinators read only notices for their department or campus wide', function () {
    $coordinator = User::factory()->role(RoleCode::Coordinator)->create();
    $volunteer = User::factory()->role(RoleCode::Volunteer)->create();
    Event::factory()->create(['status' => 'published', 'title' => 'Campus wide']);
    $draft = Event::factory()->create(['status' => 'draft']);
    $deptId = $coordinator->department_id;
    $mine = Event::factory()->create(['status' => 'published', 'department_id' => $deptId, 'title' => 'Mine']);

    $response = withAuthCookies(loginCookies($coordinator))->getJson('/api/me/event-notices')->assertOk();
    $titles = collect($response->json('data'))->pluck('title');
    expect($titles)->toContain('Campus wide')->not->toContain($draft->title);
    if ($deptId !== null) {
        expect($titles)->toContain('Mine');
    }
    withAuthCookies(loginCookies($volunteer))->getJson('/api/me/event-notices')->assertForbidden();
});
