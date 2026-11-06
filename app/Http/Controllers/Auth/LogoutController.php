<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Auth\AccessTokens;
use App\Auth\AuthCookies;
use App\Auth\RefreshTokens;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ends the sign in on this device: the refresh token family is revoked, the access token is
 * denylisted until it expires, and both cookies are cleared. Works even when the access token
 * has already expired, and when nobody is signed in at all (always 204), so signing out never
 * gets stuck. The cookies are cleared with the same path, SameSite and Secure settings they were
 * set with, which is what makes browsers delete them.
 */
class LogoutController
{
    public function __invoke(
        Request $request,
        AccessTokens $accessTokens,
        RefreshTokens $refreshTokens,
        AuthCookies $cookies,
        AuditLogger $audit,
    ): Response {
        $userId = null;

        $access = $request->cookies->get((string) config('jwt.cookies.access'));
        if (is_string($access) && $access !== '') {
            $claims = $accessTokens->decode($access);
            if ($claims !== null) {
                $accessTokens->deny($claims->jti, $claims->exp);
                $userId = (int) $claims->sub;
            }
        }

        $refresh = $request->cookies->get((string) config('jwt.cookies.refresh'));
        if (is_string($refresh) && $refresh !== '') {
            $userId = $refreshTokens->revokeFamilyOf($refresh) ?? $userId;
        }

        $user = $userId === null ? null : User::query()->find($userId);
        if ($user !== null) {
            // This route has no auth middleware, so name the actor for the audit row by hand.
            Auth::setUser($user);
            $audit->log('auth.logout', $user);
            Auth::forgetUser();
        }

        return $cookies->forget(response()->noContent());
    }
}
