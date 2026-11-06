<?php

declare(strict_types=1);
use App\Modules\Personnel\Models\User;

/**
 * The public cookie notice (resources/js/pages/CookieNotice.tsx) names the cookies and how long
 * they live. These tests keep it in step with the server settings, so the notice cannot say
 * something that is no longer true.
 */
function cookieNoticeSource(): string
{
    return (string) file_get_contents(base_path('resources/js/pages/CookieNotice.tsx'));
}

it('names every cookie the server sets', function () {
    $source = cookieNoticeSource();

    foreach ([
        config('jwt.cookies.access'),
        config('jwt.cookies.refresh'),
        config('session.cookie'),
        'XSRF-TOKEN',
    ] as $name) {
        expect($source)->toContain("name: '{$name}'");
    }
});

it('states the real lifetimes', function () {
    $source = cookieNoticeSource();

    $accessMinutes = (int) config('jwt.access_ttl') / 60;
    $refreshDays = (int) config('jwt.refresh_ttl_days');
    $sessionHours = (int) config('session.lifetime') / 60;

    expect($source)
        ->toContain("lifetime: '{$accessMinutes} minutes'")
        ->toContain("lifetime: '{$refreshDays} days'")
        ->toContain("lifetime: '{$sessionHours} hours'");
});

it('sets only the cookies the notice lists when a page opens', function () {
    $response = $this->get('/login');

    $names = collect($response->headers->getCookies())->map(fn ($cookie) => $cookie->getName())->sort()->values()->all();

    expect($names)->toBe(collect([config('session.cookie'), 'XSRF-TOKEN'])->sort()->values()->all());
});

it('sets only the two sign in cookies on top of those when someone signs in', function () {
    $user = User::factory()->create();
    $this->withHeaders(['Referer' => 'http://localhost', 'X-Requested-With' => 'XMLHttpRequest']);

    $response = $this->withAuthCookies([])->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])->assertOk();

    $names = collect($response->headers->getCookies())->map(fn ($cookie) => $cookie->getName())->sort()->values()->all();

    expect($names)->toBe(collect([config('jwt.cookies.access'), config('jwt.cookies.refresh')])->sort()->values()->all());
});

it('serves the notice page to anyone, signed in or not', function () {
    $this->get('/cookies')->assertOk();
});
