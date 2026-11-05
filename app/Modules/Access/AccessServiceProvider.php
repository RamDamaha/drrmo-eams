<?php

declare(strict_types=1);

namespace App\Modules\Access;

use App\Modules\Access\Contracts\PermissionChecker;
use App\Modules\Access\Services\RolePermissionChecker;
use Illuminate\Support\ServiceProvider;

class AccessServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PermissionChecker::class, RolePermissionChecker::class);
    }
}
