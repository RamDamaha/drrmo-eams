<?php

declare(strict_types=1);

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Access\Models\Permission;
use App\Modules\Access\Models\Role;
use Database\Seeders\PermissionSeeder;

/**
 * Reads the permission matrix table from the docs.
 *
 * @return array<string, array{grantable: bool, roles: list<string>}>
 */
function docsMatrix(): array
{
    $text = (string) file_get_contents(base_path('docs/SECURITY_AND_PRIVACY.md'));
    $section = explode('## 2.', explode('## 1. Permission matrix', $text)[1])[0];
    $roles = [RoleCode::Admin, RoleCode::Marshal, RoleCode::Volunteer, RoleCode::Coordinator];
    $matrix = [];

    foreach (explode("\n", $section) as $line) {
        if (! preg_match('/^\| `([a-z_.]+)` \|/', $line, $m)) {
            continue;
        }
        // Drop the empty strings before the first and after the last pipe.
        $cells = array_map('trim', array_slice(explode('|', trim($line)), 1, -1));
        // cells: code, what it allows, admin, marshal, volunteer, coordinator, grantable
        $held = [];
        foreach ($roles as $i => $role) {
            if (str_contains($cells[2 + $i], '✓')) {
                $held[] = $role->value;
            }
        }
        $matrix[$m[1]] = ['grantable' => str_contains($cells[6], '✓'), 'roles' => $held];
    }

    return $matrix;
}

beforeEach(fn () => $this->seed(PermissionSeeder::class));

it('seeds the four roles', function () {
    expect(Role::query()->pluck('code')->sort()->values()->all())
        ->toBe(['admin', 'coordinator', 'marshal', 'volunteer']);
});

it('seeds exactly the permissions listed in the docs', function () {
    $docs = docsMatrix();

    expect($docs)->not->toBeEmpty();
    expect(Permission::query()->pluck('code')->sort()->values()->all())
        ->toBe(collect($docs)->keys()->sort()->values()->all());
});

it('gives every role the permissions the docs say', function () {
    foreach (docsMatrix() as $code => $def) {
        $holders = Permission::query()->where('code', $code)->firstOrFail()
            ->roles()->pluck('code')->sort()->values()->all();

        expect($holders)->toBe(collect($def['roles'])->sort()->values()->all(), "roles for {$code}");
    }
});

it('marks grantable permissions as the docs say', function () {
    foreach (docsMatrix() as $code => $def) {
        expect(Permission::query()->where('code', $code)->value('grantable'))
            ->toBe($def['grantable'], "grantable for {$code}");
    }
});

it('can run the seeder twice without duplicates', function () {
    $this->seed(PermissionSeeder::class);

    expect(Role::query()->count())->toBe(4);
    expect(Permission::query()->count())->toBe(count(docsMatrix()));
});

it('keeps the coordinator out of field permissions', function () {
    $codes = Role::query()->where('code', 'coordinator')->firstOrFail()->permissions()->pluck('code')->all();

    expect($codes)->not->toContain('assignments.own', 'location.send_own', 'location.view');
});
