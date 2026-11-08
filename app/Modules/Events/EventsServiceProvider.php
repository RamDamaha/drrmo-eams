<?php

declare(strict_types=1);

namespace App\Modules\Events;

use App\Modules\Events\Console\CompleteEndedEvents;
use App\Modules\Events\Contracts\AssignmentLookup;
use App\Modules\Events\Console\MarkNoShows;
use App\Modules\Events\Models\Event;
use App\Modules\Events\Policies\EventPolicy;
use App\Modules\Events\Services\EloquentAssignmentLookup;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class EventsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AssignmentLookup::class, EloquentAssignmentLookup::class);
    }

    public function boot(): void
    {
        Gate::policy(Event::class, EventPolicy::class);

        if ($this->app->runningInConsole()) {
            $this->commands([MarkNoShows::class, CompleteEndedEvents::class]);
            $this->callAfterResolving(Schedule::class, function (Schedule $schedule) {
                $schedule->command('assignments:mark-no-shows')->everyFiveMinutes();
                $schedule->command('events:complete-ended')->everyFiveMinutes();
            });
        }

        Route::middleware(['api', 'auth:api'])->prefix('api')->group(__DIR__.'/routes.php');
    }
}
