<?php

declare(strict_types=1);

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Events\Models\Assignment;
use App\Modules\Events\Models\CampusLocation;
use App\Modules\Events\Models\DutyRequirement;
use App\Modules\Events\Models\DutyType;
use App\Modules\Events\Models\Event;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Models\AuditLog;

beforeEach(function () {
    $this->withHeaders(['Referer' => 'http://localhost', 'X-Requested-With' => 'XMLHttpRequest']);
    $this->seed();
});

function eventPayload(array $over = []): array
{
    return [
        'title' => 'Foundation Day',
        'event_type' => 'ceremony',
        'campus_location_id' => CampusLocation::query()->firstOrFail()->id,
        'starts_at' => '2026-12-01T07:00:00+08:00',
        'ends_at' => '2026-12-01T17:00:00+08:00',
        ...$over,
    ];
}

it('lets an admin create an event, which then shows in the list and is audited', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $cookies = loginCookies($admin);

    withAuthCookies($cookies)->postJson('/api/events', eventPayload())
        ->assertCreated()
        ->assertJsonPath('data.title', 'Foundation Day')
        ->assertJsonPath('data.status', 'draft');

    expect(Event::query()->first()->starts_at->utc()->format('H:i'))->toBe('23:00')
        ->and(AuditLog::query()->where('action', 'event.created')->count())->toBe(1);

    withAuthCookies($cookies)->getJson('/api/events')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Foundation Day');
});

it('rejects an end before the start and a missing title', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();

    withAuthCookies(loginCookies($admin))->postJson('/api/events', eventPayload([
        'title' => '',
        'ends_at' => '2026-12-01T06:00:00+08:00',
    ]))->assertUnprocessable()->assertJsonValidationErrors(['title', 'ends_at']);
});

it('keeps events and the form lists away from non-admins', function (RoleCode $role) {
    $user = User::factory()->role($role)->create();
    $cookies = loginCookies($user);

    withAuthCookies($cookies)->postJson('/api/events', eventPayload())->assertForbidden();
    withAuthCookies($cookies)->getJson('/api/events')->assertForbidden();
    withAuthCookies($cookies)->getJson('/api/event-lookups')->assertForbidden();
    expect(Event::query()->count())->toBe(0);
})->with([RoleCode::Volunteer, RoleCode::Coordinator]);

it('needs a signed in user', function () {
    $this->postJson('/api/events', eventPayload())->assertUnauthorized();
});

it('gives the admin the campus locations for the form', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();

    withAuthCookies(loginCookies($admin))->getJson('/api/event-lookups')
        ->assertOk()
        ->assertJsonPath('data.locations.0.name', 'Administration building');
});

function requirementPayload(Event $event, array $over = []): array
{
    return [
        'duty_type_id' => DutyType::query()->firstOrFail()->id,
        'role' => 'marshal',
        'headcount' => 2,
        'shift_starts_at' => $event->starts_at->toIso8601String(),
        'shift_ends_at' => $event->ends_at->toIso8601String(),
        ...$over,
    ];
}

it('adds a duty requirement inside the event time and refuses one outside it', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $event = Event::factory()->create();
    $cookies = loginCookies($admin);

    withAuthCookies($cookies)->postJson("/api/events/{$event->id}/requirements", requirementPayload($event, ['team_needed' => 'Fire Suppression', 'instructions' => 'Report at the gate.']))
        ->assertCreated()->assertJsonPath('data.headcount', 2);
    withAuthCookies($cookies)->postJson("/api/events/{$event->id}/requirements", requirementPayload($event, [
        'shift_ends_at' => $event->ends_at->addHour()->toIso8601String(),
    ]))->assertUnprocessable()->assertJsonValidationErrors(['shift_starts_at']);
    withAuthCookies($cookies)->postJson("/api/events/{$event->id}/requirements", requirementPayload($event, ['headcount' => 0]))
        ->assertUnprocessable()->assertJsonValidationErrors(['headcount']);

    expect(DutyRequirement::query()->count())->toBe(1)
        ->and(AuditLog::query()->where('action', 'requirement.created')->count())->toBe(1);
});

it('fills a requirement with people of the right role until it is full', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $marshals = User::factory()->role(RoleCode::Marshal)->count(2)->create();
    $volunteer = User::factory()->role(RoleCode::Volunteer)->create();
    $event = Event::factory()->create();
    $cookies = loginCookies($admin);
    $requirement = $event->requirements()->create(requirementPayload($event, ['headcount' => 1]));
    $url = "/api/requirements/{$requirement->id}/assignments";

    withAuthCookies($cookies)->getJson("/api/requirements/{$requirement->id}/candidates")
        ->assertOk()->assertJsonCount(2, 'data');
    withAuthCookies($cookies)->postJson($url, ['user_id' => $volunteer->id])->assertUnprocessable();
    withAuthCookies($cookies)->postJson($url, ['user_id' => $marshals[0]->id])->assertCreated();
    withAuthCookies($cookies)->postJson($url, ['user_id' => $marshals[1]->id])->assertUnprocessable();

    withAuthCookies($cookies)->getJson("/api/events/{$event->id}")
        ->assertOk()->assertJsonCount(1, 'data.requirements.0.assignments');
    expect(AuditLog::query()->where('action', 'assignment.created')->count())->toBe(1);
});

it('refuses a duplicate person, removes an assignment and keeps a filled requirement undeletable', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $event = Event::factory()->create();
    $cookies = loginCookies($admin);
    $requirement = $event->requirements()->create(requirementPayload($event));
    $url = "/api/requirements/{$requirement->id}/assignments";

    $id = withAuthCookies($cookies)->postJson($url, ['user_id' => $marshal->id])->json('data.id');
    withAuthCookies($cookies)->postJson($url, ['user_id' => $marshal->id])->assertUnprocessable();
    withAuthCookies($cookies)->deleteJson("/api/requirements/{$requirement->id}")->assertUnprocessable();

    withAuthCookies($cookies)->deleteJson("/api/assignments/{$id}")->assertNoContent();
    withAuthCookies($cookies)->deleteJson("/api/requirements/{$requirement->id}")->assertNoContent();
    expect(Assignment::query()->count())->toBe(0)->and(DutyRequirement::query()->count())->toBe(0);
});

it('keeps requirements and assigning away from non-admins', function () {
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $event = Event::factory()->create();
    $requirement = $event->requirements()->create(requirementPayload($event));
    $cookies = loginCookies($marshal);

    withAuthCookies($cookies)->postJson("/api/events/{$event->id}/requirements", requirementPayload($event))->assertForbidden();
    withAuthCookies($cookies)->deleteJson("/api/requirements/{$requirement->id}")->assertForbidden();
    withAuthCookies($cookies)->postJson("/api/requirements/{$requirement->id}/assignments", ['user_id' => $marshal->id])->assertForbidden();
    withAuthCookies($cookies)->getJson("/api/requirements/{$requirement->id}/candidates")->assertForbidden();
    withAuthCookies($cookies)->getJson("/api/events/{$event->id}")->assertForbidden();
    withAuthCookies($cookies)->postJson("/api/events/{$event->id}/publish")->assertForbidden();
    withAuthCookies($cookies)->postJson("/api/events/{$event->id}/cancel")->assertForbidden();
});

it('publishes a draft event and cancels it, with audit rows', function () {
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $event = Event::factory()->create(['status' => 'draft']);
    $cookies = loginCookies($admin);

    withAuthCookies($cookies)->postJson("/api/events/{$event->id}/publish")->assertOk()->assertJsonPath('data.status', 'published');
    withAuthCookies($cookies)->postJson("/api/events/{$event->id}/publish")->assertUnprocessable();
    withAuthCookies($cookies)->postJson("/api/events/{$event->id}/cancel")->assertOk()->assertJsonPath('data.status', 'cancelled');
    withAuthCookies($cookies)->postJson("/api/events/{$event->id}/cancel")->assertUnprocessable();

    expect(AuditLog::query()->whereIn('action', ['event.published', 'event.cancelled'])->count())->toBe(2);
});

it('shows a person only their own duties on published events', function () {
    $one = User::factory()->role(RoleCode::Marshal)->create();
    $two = User::factory()->role(RoleCode::Volunteer)->create();
    $published = Event::factory()->create(['status' => 'published']);
    $draft = Event::factory()->create(['status' => 'draft']);
    foreach ([[$published, $one], [$published, $two], [$draft, $one]] as [$event, $user]) {
        $req = $event->requirements()->create(requirementPayload($event, ['role' => $user->role->code]));
        $req->assignments()->create(['event_id' => $event->id, 'user_id' => $user->id, 'duty_type_id' => $req->duty_type_id]);
    }

    withAuthCookies(loginCookies($one))->getJson('/api/me/assignments')
        ->assertOk()->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.event.id', $published->id);
    withAuthCookies(loginCookies($two))->getJson('/api/me/assignments')
        ->assertOk()->assertJsonCount(1, 'data');
});

it('keeps my assignments away from signed out visitors', function () {
    $this->getJson('/api/me/assignments')->assertUnauthorized();
});
