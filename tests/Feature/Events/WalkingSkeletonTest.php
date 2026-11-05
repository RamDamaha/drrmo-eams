<?php

declare(strict_types=1);

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Access\Models\Role;
use App\Modules\Events\Models\Assignment;
use App\Modules\Events\Models\CampusLocation;
use App\Modules\Events\Models\DutyRequirement;
use App\Modules\Events\Models\DutyType;
use App\Modules\Events\Models\Event;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Models\AuditLog;
use Database\Seeders\CampusLocationSeeder;
use Database\Seeders\DutyTypeSeeder;
use Database\Seeders\PermissionSeeder;

beforeEach(function () {
    $this->seed([PermissionSeeder::class, DutyTypeSeeder::class, CampusLocationSeeder::class]);
    $this->admin = User::factory()->role(RoleCode::Admin)->create();
    $this->marshal = User::factory()->role(RoleCode::Marshal)->create();
});

function eventPayload(array $overrides = []): array
{
    return [
        'title' => 'Foundation Day',
        'campus_location_id' => CampusLocation::query()->value('id'),
        'starts_at' => '2026-12-01T07:00:00+08:00',
        'ends_at' => '2026-12-01T17:00:00+08:00',
        ...$overrides,
    ];
}

function requirementPayload(array $overrides = []): array
{
    return [
        'duty_type_id' => DutyType::query()->where('name', 'Crowd control')->value('id'),
        'role_id' => Role::query()->where('code', 'marshal')->value('id'),
        'headcount' => 2,
        'shift_start' => '2026-12-01T07:00:00+08:00',
        'shift_end' => '2026-12-01T12:00:00+08:00',
        'instructions' => 'Gather at the main gate',
        ...$overrides,
    ];
}

describe('events (S1.2)', function () {
    it('lets an admin create an event, audits it and lists it', function () {
        $this->actingAs($this->admin)->postJson('/api/events', eventPayload())
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.title', 'Foundation Day');

        $this->getJson('/api/events')->assertOk()->assertJsonCount(1, 'data');
        expect(AuditLog::query()->where('action', 'event.created')->count())->toBe(1);
    });

    it('rejects an event that ends before it starts', function () {
        $this->actingAs($this->admin)
            ->postJson('/api/events', eventPayload(['ends_at' => '2026-12-01T06:00:00+08:00']))
            ->assertUnprocessable()->assertJsonValidationErrors('ends_at');
    });

    it('forbids non-admins from creating or listing events', function (RoleCode $role) {
        $user = User::factory()->role($role)->create();

        $this->actingAs($user)->postJson('/api/events', eventPayload())->assertForbidden();
        $this->getJson('/api/events')->assertForbidden();
        expect(Event::query()->count())->toBe(0);
    })->with([RoleCode::Marshal, RoleCode::Volunteer, RoleCode::Coordinator]);

    it('requires login', function () {
        $this->postJson('/api/events', eventPayload())->assertUnauthorized();
    });
});

describe('requirements (S1.3)', function () {
    it('adds a requirement inside the event time', function () {
        $event = Event::factory()->create(['starts_at' => '2026-11-30T23:00:00Z', 'ends_at' => '2026-12-01T09:00:00Z']);

        $this->actingAs($this->admin)->postJson("/api/events/{$event->id}/requirements", requirementPayload())
            ->assertCreated()
            ->assertJsonPath('data.headcount', 2)
            ->assertJsonPath('data.role', 'marshal');
    });

    it('rejects a shift outside the event time', function () {
        $event = Event::factory()->create(['starts_at' => '2026-11-30T23:00:00Z', 'ends_at' => '2026-12-01T09:00:00Z']);

        $this->actingAs($this->admin)
            ->postJson("/api/events/{$event->id}/requirements", requirementPayload(['shift_end' => '2026-12-02T09:00:00+08:00']))
            ->assertUnprocessable()->assertJsonValidationErrors('shift_start');
    });

    it('rejects a role that does not work in the field', function () {
        $event = Event::factory()->create(['starts_at' => '2026-11-30T23:00:00Z', 'ends_at' => '2026-12-01T09:00:00Z']);

        $this->actingAs($this->admin)
            ->postJson("/api/events/{$event->id}/requirements", requirementPayload(['role_id' => Role::query()->where('code', 'admin')->value('id')]))
            ->assertUnprocessable()->assertJsonValidationErrors('role_id');
    });

    it('forbids a marshal from adding requirements', function () {
        $event = Event::factory()->create();

        $this->actingAs($this->marshal)->postJson("/api/events/{$event->id}/requirements", requirementPayload())->assertForbidden();
    });

    it('shows requirements on the event detail', function () {
        $requirement = DutyRequirement::factory()->create();

        $this->actingAs($this->admin)->getJson("/api/events/{$requirement->event_id}")
            ->assertOk()->assertJsonCount(1, 'data.requirements');
    });
});

describe('assignments (S1.4)', function () {
    it('lists only active people with the needed role', function () {
        $requirement = DutyRequirement::factory()->create();
        $ok = User::factory()->role(RoleCode::Marshal)->create();
        User::factory()->role(RoleCode::Marshal)->inactive()->create();
        User::factory()->role(RoleCode::Marshal)->disabled()->create();
        User::factory()->role(RoleCode::Volunteer)->create();

        $ids = collect($this->actingAs($this->admin)->getJson("/api/requirements/{$requirement->id}/candidates")
            ->assertOk()->json('data'))->pluck('id')->all();

        expect($ids)->toContain($ok->id, $this->marshal->id)->and($ids)->toHaveCount(2);
    });

    it('assigns people, writes an audit row per person', function () {
        $requirement = DutyRequirement::factory()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/requirements/{$requirement->id}/assignments", ['user_ids' => [$this->marshal->id]])
            ->assertCreated()->assertJsonPath('data.0.status', 'assigned');

        $assignment = Assignment::query()->sole();
        expect($assignment->assigned_by)->toBe($this->admin->id)
            ->and(AuditLog::query()->where('action', 'assignment.created')->count())->toBe(1);
    });

    it('blocks a volunteer for a marshal requirement, an inactive person and a double assignment', function () {
        $requirement = DutyRequirement::factory()->create();
        $volunteer = User::factory()->role(RoleCode::Volunteer)->create();
        $inactive = User::factory()->role(RoleCode::Marshal)->inactive()->create();

        $this->actingAs($this->admin);
        $this->postJson("/api/requirements/{$requirement->id}/assignments", ['user_ids' => [$volunteer->id]])->assertUnprocessable();
        $this->postJson("/api/requirements/{$requirement->id}/assignments", ['user_ids' => [$inactive->id]])->assertUnprocessable();

        $this->postJson("/api/requirements/{$requirement->id}/assignments", ['user_ids' => [$this->marshal->id]])->assertCreated();
        $this->postJson("/api/requirements/{$requirement->id}/assignments", ['user_ids' => [$this->marshal->id]])->assertUnprocessable();
        expect(Assignment::query()->count())->toBe(1);
    });

    it('forbids non-admins from viewing candidates or assigning', function () {
        $requirement = DutyRequirement::factory()->create();

        $this->actingAs($this->marshal);
        $this->getJson("/api/requirements/{$requirement->id}/candidates")->assertForbidden();
        $this->postJson("/api/requirements/{$requirement->id}/assignments", ['user_ids' => [$this->marshal->id]])->assertForbidden();
        expect(Assignment::query()->count())->toBe(0);
    });
});

describe('my assignments (S1.5)', function () {
    it('shows a person their own duty with event, place, time and duty type', function () {
        $requirement = DutyRequirement::factory()->create();
        Assignment::factory()->create(['requirement_id' => $requirement->id, 'user_id' => $this->marshal->id]);

        $this->actingAs($this->marshal)->getJson('/api/me/assignments')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.requirement.duty_type', 'Crowd control')
            ->assertJsonPath('data.0.requirement.event.location', 'Test location');
    });

    it('never shows another person assignment', function () {
        $other = User::factory()->role(RoleCode::Marshal)->create();
        Assignment::factory()->create(['user_id' => $other->id]);
        Assignment::factory()->create(['user_id' => $this->marshal->id]);

        $ids = collect($this->actingAs($this->marshal)->getJson('/api/me/assignments')->json('data'))->pluck('id');
        expect($ids)->toHaveCount(1);

        $this->actingAs($other)->getJson('/api/me/assignments')->assertJsonCount(1, 'data');
    });

    it('is not available to a coordinator', function () {
        $this->actingAs(User::factory()->role(RoleCode::Coordinator)->create())
            ->getJson('/api/me/assignments')->assertForbidden();
    });
});
