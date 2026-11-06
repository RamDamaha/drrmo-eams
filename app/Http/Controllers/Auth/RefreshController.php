<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Auth\AccessTokens;
use App\Auth\AuthCookies;
use App\Auth\RefreshTokens;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Swaps the refresh cookie for a new access token and a new refresh token. */
class RefreshController
{
    public function __invoke(
        Request $request,
        AccessTokens $accessTokens,
        RefreshTokens $refreshTokens,
        AuthCookies $cookies,
    ): Response {
        $plain = $request->cookies->get((string) config('jwt.cookies.refresh'));
        $result = is_string($plain) && $plain !== '' ? $refreshTokens->rotate($plain, $request) : null;

        if ($result === null) {
            return $cookies->forget(response()->json([
                'message' => 'Your session has ended. Sign in again.',
                'code' => 'session_ended',
            ], 401));
        }

        [$user, $nextRefreshToken] = $result;

        return $cookies->attach(response()->noContent(), $accessTokens->issue($user)['token'], $nextRefreshToken);
    }
}
