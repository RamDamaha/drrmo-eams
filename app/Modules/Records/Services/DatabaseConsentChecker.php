<?php

declare(strict_types=1);

namespace App\Modules\Records\Services;

use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\ConsentChecker;
use App\Modules\Records\Enums\ConsentPurpose;
use App\Modules\Records\Models\ConsentRecord;

class DatabaseConsentChecker implements ConsentChecker
{
    public function has(User $user, ConsentPurpose $purpose): bool
    {
        $latest = ConsentRecord::query()
            ->where('user_id', $user->getKey())
            ->where('purpose', $purpose->value)
            ->latest('consented_at')
            ->latest('id')
            ->first();

        return $latest !== null && $latest->withdrawn_at === null;
    }
}
