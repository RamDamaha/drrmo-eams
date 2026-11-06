<?php

declare(strict_types=1);

namespace App\Modules\Records\Contracts;

use App\Modules\Personnel\Models\User;
use App\Modules\Records\Enums\ConsentPurpose;

interface ConsentRecorder
{
    /** Write a consent row for this purpose with the current notice version, time and IP. */
    public function give(User $user, ConsentPurpose $purpose, ?string $ipAddress = null): void;
}
