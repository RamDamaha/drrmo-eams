<?php

declare(strict_types=1);

namespace App\Modules\Events\Policies;

use App\Modules\Personnel\Models\User;

/** Who may see and create events. Admins hold both permissions. */
class EventPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('events.view_all');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('events.manage');
    }

    public function assign(User $user): bool
    {
        return $user->hasPermission('assignments.manage');
    }
}
