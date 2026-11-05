<?php

declare(strict_types=1);

namespace App\Modules\Access\Contracts;

use App\Modules\Personnel\Models\User;

interface PermissionChecker
{
    /**
     * True when the user's role holds the permission code.
     * Time-limited grants are added in story S2.6. The optional event id is for event-scoped grants.
     */
    public function allows(User $user, string $code, ?int $eventId = null): bool;
}
