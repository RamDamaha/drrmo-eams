<?php

declare(strict_types=1);

namespace App\Modules\Access\Services;

use App\Modules\Access\Contracts\PermissionChecker;
use App\Modules\Personnel\Models\User;
use Illuminate\Support\Facades\DB;

/** Role-only check. There is no bypass for admins: the admin role simply holds every code. */
class RolePermissionChecker implements PermissionChecker
{
    public function allows(User $user, string $code, ?int $eventId = null): bool
    {
        return DB::table('role_permission')
            ->join('permissions', 'permissions.id', '=', 'role_permission.permission_id')
            ->where('role_permission.role_id', $user->role_id)
            ->where('permissions.code', $code)
            ->exists();
    }
}
