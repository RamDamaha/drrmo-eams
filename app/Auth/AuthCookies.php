<?php

declare(strict_types=1);

namespace App\Auth;

use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Response;

/** Writes and clears the two auth cookies. HttpOnly and SameSite=Lax always; Secure in production. */
class AuthCookies
{
    public function attach(Response $response, string $accessToken, string $refreshToken): Response
    {
        $response->headers->setCookie($this->make(
            (string) config('jwt.cookies.access'),
            $accessToken,
            now()->addSeconds((int) config('jwt.access_ttl'))->getTimestamp(),
        ));
        $response->headers->setCookie($this->make(
            (string) config('jwt.cookies.refresh'),
            $refreshToken,
            now()->addDays((int) config('jwt.refresh_ttl_days'))->getTimestamp(),
        ));

        return $response;
    }

    public function forget(Response $response): Response
    {
        foreach ([config('jwt.cookies.access'), config('jwt.cookies.refresh')] as $name) {
            $response->headers->setCookie($this->make((string) $name, '', 1));
        }

        return $response;
    }

    private function make(string $name, string $value, int $expiresAt): Cookie
    {
        return Cookie::create(
            name: $name,
            value: $value,
            expire: $expiresAt,
            path: (string) config('jwt.cookies.path'),
            domain: null,
            secure: (bool) config('jwt.cookies.secure'),
            httpOnly: true,
            raw: false,
            sameSite: (string) config('jwt.cookies.same_site'),
        );
    }
}
