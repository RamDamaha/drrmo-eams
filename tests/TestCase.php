<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Testing\TestResponse;

abstract class TestCase extends BaseTestCase
{
    /**
     * The access and refresh cookies set by a response, keyed by cookie name.
     *
     * @return array<string, string>
     */
    public function authCookiesFrom(TestResponse $response): array
    {
        $cookies = [];
        foreach ([config('jwt.cookies.access'), config('jwt.cookies.refresh')] as $name) {
            $cookie = $response->getCookie((string) $name, false);
            if ($cookie !== null) {
                $cookies[(string) $name] = (string) $cookie->getValue();
            }
        }

        return $cookies;
    }

    /**
     * Send exactly these auth cookies with the next requests, like one browser would.
     *
     * @param  array<string, string>  $cookies
     */
    public function withAuthCookies(array $cookies): static
    {
        // JSON test requests only send cookies with credentials on, like fetch with credentials.
        $this->withCredentials = true;
        $this->defaultCookies = [];
        $this->unencryptedCookies = $cookies;

        return $this;
    }
}
