<?php

declare(strict_types=1);

namespace App\Modules\Notifications;

use App\Modules\Notifications\Console\SendShiftReminders;
use App\Modules\Notifications\Contracts\AssignmentNotifier;
use App\Modules\Notifications\Contracts\MailSender;
use App\Modules\Notifications\Models\Notification;
use App\Modules\Notifications\Policies\NotificationPolicy;
use App\Modules\Notifications\Services\LogMailSender;
use App\Modules\Notifications\Services\PhpMailerSender;
use App\Modules\Notifications\Services\QueuedAssignmentNotifier;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class NotificationsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(AssignmentNotifier::class, QueuedAssignmentNotifier::class);
        $this->app->bind(MailSender::class, function (): MailSender {
            $host = (string) config('mail.phpmailer.host');
            $logOnly = config('mail.default') === 'log' || $host === '';

            return $logOnly ? new LogMailSender : new PhpMailerSender;
        });
    }

    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__.'/Views', 'eams-notifications');
        Gate::policy(Notification::class, NotificationPolicy::class);
        if ($this->app->runningInConsole()) {
            $this->commands([SendShiftReminders::class]);
            $this->callAfterResolving(Schedule::class, fn (Schedule $schedule) => $schedule->command('notifications:send-reminders')->everyFiveMinutes());
        }
        Route::middleware(['api', 'auth:api'])->prefix('api')->group(__DIR__.'/routes.php');
    }
}
