<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Auth\AccessTokens;
use App\Auth\AuthCookies;
use App\Auth\RefreshTokens;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\MeResource;
use App\Modules\Personnel\Enums\AccountStatus;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/** Email and password login. Sets the access and refresh cookies (see docs/ARCHITECTURE.md section 3). */
class LoginController
{
    private const MAX_FAILURES = 5;

    public function __invoke(
        LoginRequest $request,
        AuditLogger $audit,
        AccessTokens $accessTokens,
        RefreshTokens $refreshTokens,
        AuthCookies $cookies,
    ): Response {
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

        // An unknown email and a wrong password get the same answer, so nobody can find out which
        // emails have accounts.
        if ($user === null || ! Hash::check($request->string('password')->toString(), $user->password)) {
            RateLimiter::hit($key, 60);

            return $this->invalid();
        }

        // The password was right, so this person owns the account and may be told why it cannot be
        // used yet. Each try still counts toward the throttle.
        if (! $user->canSignIn()) {
            RateLimiter::hit($key, 60);

            return $this->notUsable($user);
        }

        RateLimiter::clear($key);
        $user->forceFill(['last_login_at' => now()])->save();

        // Set the actor for the audit row only. Later requests are signed in by the cookie alone.
        Auth::setUser($user);
        $audit->log('auth.login', $user);
        Auth::forgetUser();

        $response = (new MeResource($user))->response();

        return $cookies->attach(
            $response,
            $accessTokens->issue($user)['token'],
            $refreshTokens->issue($user, $request),
        );
    }

    /** Only called after the password was checked. Says why the account cannot sign in. */
    private function notUsable(User $user): JsonResponse
    {
        [$code, $message] = match (true) {
            $user->isDisabled() => ['account_disabled', 'This account is disabled. Contact the DRRMO office.'],
            $user->account_status === AccountStatus::PendingEmail => ['email_not_confirmed', 'Confirm your email first. Enter the 6 digit code we sent you.'],
            $user->account_status === AccountStatus::PendingApproval => ['awaiting_approval', 'Your account is waiting for admin approval. We will email you when it is approved.'],
            default => ['request_rejected', 'Your access request was not approved. Contact the DRRMO office.'],
        };

        return response()->json(['message' => $message, 'code' => $code], 403);
    }

    private function invalid(): JsonResponse
    {
        return response()->json([
            'message' => 'The email or password is wrong.',
            'code' => 'invalid_credentials',
        ], 422);
    }
}
