<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Policies;

use App\Modules\Personnel\Models\User;

/** Only admins read the notification log and retry failed sends. */
class NotificationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('notifications.view');
    }

    public function retry(User $user): bool
    {
        return $user->hasPermission('notifications.view');
    }
}
