<?php

declare(strict_types=1);

namespace App\Modules\Personnel\Policies;

use App\Modules\Personnel\Models\User;

class UserPolicy
{
    /** Listing, approving and rejecting sign up requests. */
    public function reviewRegistrations(User $actor): bool
    {
        return $actor->hasPermission('registrations.review');
    }
}
