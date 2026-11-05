<?php

declare(strict_types=1);

namespace App\Modules\Records\Contracts;

use App\Modules\Personnel\Models\User;
use App\Modules\Records\Enums\ConsentPurpose;

interface ConsentChecker
{
    /** True when the user has given consent for this purpose and has not withdrawn it. */
    public function has(User $user, ConsentPurpose $purpose): bool;
}
