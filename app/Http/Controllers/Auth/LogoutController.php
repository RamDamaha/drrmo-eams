<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Auth\AccessTokens;
use App\Auth\AuthCookies;
use App\Auth\RefreshTokens;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ends the sign in on this device: the refresh token family is revoked, the access token is
 * denylisted until it expires, and both cookies are cleared. Works even when the access token
 * has already expired, so signing out never gets stuck.
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

        if ($userId !== null) {
            $audit->log('auth.logout', 'user', $userId);
        }

        return $cookies->forget(response()->noContent());
    }
}
