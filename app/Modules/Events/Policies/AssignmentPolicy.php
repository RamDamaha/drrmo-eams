<?php

declare(strict_types=1);

namespace App\Modules\Events\Policies;

use App\Modules\Access\Contracts\PermissionChecker;
use App\Modules\Events\Models\Assignment;
use App\Modules\Personnel\Models\User;

/** People see only their own assignments. */
class AssignmentPolicy
{
    public function __construct(private readonly PermissionChecker $permissions) {}

    public function viewOwnList(User $user): bool
    {
        return $this->permissions->allows($user, 'assignments.own');
    }

    public function view(User $user, Assignment $assignment): bool
    {
        return $assignment->user_id === $user->id && $this->permissions->allows($user, 'assignments.own');
    }
}
