<?php

declare(strict_types=1);

namespace App\Modules\Events\Policies;

use App\Modules\Access\Contracts\PermissionChecker;
use App\Modules\Personnel\Models\User;

/** Who may see and change events and their duty requirements. */
class EventPolicy
{
    public function __construct(private readonly PermissionChecker $permissions) {}

    public function viewAny(User $user): bool
    {
        return $this->permissions->allows($user, 'events.view_all');
    }

    public function view(User $user): bool
    {
        return $this->permissions->allows($user, 'events.view_all');
    }

    public function create(User $user): bool
    {
        return $this->permissions->allows($user, 'events.manage');
    }

    public function update(User $user): bool
    {
        return $this->permissions->allows($user, 'events.manage');
    }

    public function assign(User $user): bool
    {
        return $this->permissions->allows($user, 'assignments.manage');
    }
}
