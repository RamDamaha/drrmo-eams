<?php

declare(strict_types=1);

namespace App\Modules\Personnel;

use App\Modules\Personnel\Models\User;
use App\Modules\Personnel\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class PersonnelServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);

        // The api group adds the origin check. Routes inside decide their own auth.
        Route::prefix('api')->middleware('api')->group(__DIR__.'/routes.php');
    }
}
