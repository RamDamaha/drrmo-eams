<?php

declare(strict_types=1);

namespace App\Providers;

use App\Auth\AccessTokens;
use App\Auth\JwtGuard;
use App\Modules\Personnel\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Auth::extend('jwt', function (Application $app, string $name, array $config): JwtGuard {
            $guard = new JwtGuard(
                Auth::createUserProvider($config['provider'] ?? null) ?? throw new RuntimeException('No user provider for the jwt guard.'),
                $app->make(Request::class),
                $app->make(AccessTokens::class),
            );
            $app->refresh('request', $guard, 'setRequest');

            return $guard;
        });

        // Rate limits from docs/SECURITY_AND_PRIVACY.md section 6.
        RateLimiter::for('refresh', fn (Request $request) => Limit::perMinute(30)->by((string) $request->ip()));

        RateLimiter::for('register', fn (Request $request) => Limit::perHour(5)
            ->by((string) $request->ip())
            ->response(fn () => $this->tooManyAttempts()));

        RateLimiter::for('register-verify', fn (Request $request) => Limit::perMinutes(10, 10)
            ->by((string) $request->ip())
            ->response(fn () => $this->tooManyAttempts()));

        RateLimiter::for('register-resend', fn (Request $request) => Limit::perMinutes(10, 3)
            ->by((string) $request->ip())
            ->response(fn () => $this->tooManyAttempts()));

        RateLimiter::for('forgot-password', fn (Request $request) => Limit::perMinutes(10, 3)
            ->by((string) $request->ip())
            ->response(fn () => $this->tooManyAttempts()));

        RateLimiter::for('reset-password', fn (Request $request) => Limit::perMinutes(10, 10)
            ->by((string) $request->ip())
            ->response(fn () => $this->tooManyAttempts()));

        // The emailed link opens the React screen, which posts to /api/reset-password.
        ResetPassword::createUrlUsing(fn (User $user, string $token): string => url('/reset-password').'?'.http_build_query([
            'token' => $token,
            'email' => $user->email,
        ]));
    }

    private function tooManyAttempts(): JsonResponse
    {
        return response()->json([
            'message' => 'Too many attempts. Wait a few minutes and try again.',
            'code' => 'too_many_attempts',
        ], 429);
    }
}
