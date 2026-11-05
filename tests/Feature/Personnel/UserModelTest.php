<?php

declare(strict_types=1);

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Personnel\Enums\AvailabilityStatus;
use App\Modules\Personnel\Models\Department;
use App\Modules\Personnel\Models\EmergencyContact;
use App\Modules\Personnel\Models\User;
use App\Modules\Personnel\Models\VolunteerStatusLog;
use Illuminate\Database\QueryException;

it('creates a user with a role and fake example.test email', function () {
    $user = User::factory()->role(RoleCode::Marshal)->create();

    expect($user->roleCode())->toBe(RoleCode::Marshal)
        ->and($user->email)->toEndWith('@example.test')
        ->and($user->status)->toBe(AvailabilityStatus::Active)
        ->and($user->isDisabled())->toBeFalse();
});

it('hides the password and remember token when serialised', function () {
    $array = User::factory()->create()->toArray();

    expect($array)->not->toHaveKeys(['password', 'remember_token']);
});

it('keeps emails unique', function () {
    User::factory()->create(['email' => 'same@example.test']);

    expect(fn () => User::factory()->create(['email' => 'same@example.test']))
        ->toThrow(QueryException::class);
});

it('links department, emergency contacts and status history', function () {
    $department = Department::query()->create(['name' => 'Test Department']);
    $user = User::factory()->create(['department_id' => $department->id]);
    $admin = User::factory()->role(RoleCode::Admin)->create();

    EmergencyContact::query()->create([
        'user_id' => $user->id, 'name' => 'Pat Example', 'relationship' => 'Sibling', 'phone' => '09000000000',
    ]);
    VolunteerStatusLog::query()->create([
        'user_id' => $user->id,
        'old_status' => AvailabilityStatus::Active,
        'new_status' => AvailabilityStatus::Inactive,
        'reason' => 'Exam week',
        'changed_by' => $admin->id,
    ]);

    expect($user->department->is($department))->toBeTrue()
        ->and($user->emergencyContacts)->toHaveCount(1)
        ->and($user->statusLogs->first()->changedBy->is($admin))->toBeTrue()
        ->and($user->statusLogs->first()->new_status)->toBe(AvailabilityStatus::Inactive);
});
