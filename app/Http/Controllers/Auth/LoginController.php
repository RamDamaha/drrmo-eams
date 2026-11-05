<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\MeResource;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/** Email and password login with a Sanctum session cookie. */
class LoginController
{
    private const MAX_FAILURES = 5;

    public function __invoke(LoginRequest $request, AuditLogger $audit): JsonResponse
    {
        $email = Str::lower($request->string('email')->toString());
        $key = 'login|'.$email.'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, self::MAX_FAILURES)) {
            // Failures above the throttle limit are a sensitive event (SECURITY_AND_PRIVACY.md section 4).
            $audit->log('auth.login_throttled', 'user', null, ['email' => $email]);

            return response()->json([
                'message' => 'Too many attempts. Try again in a minute.',
                'code' => 'too_many_attempts',
            ], 429)->header('Retry-After', (string) RateLimiter::availableIn($key));
        }

        $user = User::query()->where('email', $email)->first();

        // A disabled account gets the same answer as a wrong password.
        if ($user === null || $user->isDisabled() || ! Auth::guard('web')->attempt(['email' => $email, 'password' => $request->string('password')->toString()])) {
            RateLimiter::hit($key, 60);

            return response()->json([
                'message' => 'The email or password is wrong.',
                'code' => 'invalid_credentials',
            ], 422);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();

        return (new MeResource($user))->response();
    }
}
