<?php

declare(strict_types=1);

namespace App\Modules\Events;

use App\Modules\Events\Models\Event;
use App\Modules\Events\Policies\EventPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class EventsServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::policy(Event::class, EventPolicy::class);

        Route::middleware(['api', 'auth:api'])->prefix('api')->group(__DIR__.'/routes.php');
    }
}
