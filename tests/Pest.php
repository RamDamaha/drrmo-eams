<?php

declare(strict_types=1);

use App\Modules\Personnel\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Sign in through the API and return the auth cookies the browser would keep.
 *
 * @return array<string, string>
 */
function loginCookies(User $user, string $password = 'password'): array
{
    $response = test()->withAuthCookies([])->postJson('/api/login', ['email' => $user->email, 'password' => $password]);
    $response->assertOk();

    return test()->authCookiesFrom($response);
}

/** @param  array<string, string>  $cookies */
function withAuthCookies(array $cookies): TestCase
{
    return test()->withAuthCookies($cookies);
}

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');
