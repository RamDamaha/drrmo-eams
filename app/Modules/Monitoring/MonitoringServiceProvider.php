<?php

declare(strict_types=1);

namespace App\Modules\Monitoring;

use App\Modules\Monitoring\Console\AutoEndDuty;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class MonitoringServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([AutoEndDuty::class]);
            $this->callAfterResolving(Schedule::class, function (Schedule $schedule) {
                $schedule->command('monitoring:auto-end-duty')->everyFiveMinutes();
            });
        }

        Route::middleware(['api', 'auth:api'])->prefix('api')->group(__DIR__.'/routes.php');
    }
}
