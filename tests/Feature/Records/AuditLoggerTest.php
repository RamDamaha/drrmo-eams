<?php

declare(strict_types=1);

use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use App\Modules\Records\Models\AuditLog;

it('writes an audit row for the signed-in user', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    app(AuditLogger::class)->log('person.created', $user, null, ['after' => ['name' => 'Test']]);

    $row = AuditLog::query()->sole();
    expect($row->actor_id)->toBe($user->id)
        ->and($row->action)->toBe('person.created')
        ->and($row->entity)->toBe('user')
        ->and($row->entity_id)->toBe($user->id)
        ->and($row->meta)->toBe(['after' => ['name' => 'Test']]);
});

it('accepts a plain entity name and works without a signed-in user', function () {
    app(AuditLogger::class)->log('records.pruned', 'audit_log', 7);

    $row = AuditLog::query()->sole();
    expect($row->actor_id)->toBeNull()
        ->and($row->entity)->toBe('audit_log')
        ->and($row->entity_id)->toBe(7)
        ->and($row->meta)->toBeNull();
});

it('does not allow audit rows to be changed or deleted', function () {
    app(AuditLogger::class)->log('x.y', 'thing', 1);
    $row = AuditLog::query()->sole();

    expect(fn () => $row->update(['action' => 'other']))->toThrow(LogicException::class);
    expect(fn () => $row->delete())->toThrow(LogicException::class);
    expect(AuditLog::query()->count())->toBe(1);
});
