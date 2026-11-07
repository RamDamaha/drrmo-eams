<?php

declare(strict_types=1);

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Events\Models\CampusLocation;
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
