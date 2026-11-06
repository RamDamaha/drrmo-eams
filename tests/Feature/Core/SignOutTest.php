<?php

declare(strict_types=1);

use App\Modules\Access\Models\RefreshToken;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Models\AuditLog;
use Symfony\Component\HttpFoundation\Cookie;

beforeEach(function () {
    $this->withHeaders(['Referer' => 'http://localhost', 'X-Requested-With' => 'XMLHttpRequest']);
});

/** @return list<string> */
function authCookieNames(): array
{
    return [(string) config('jwt.cookies.access'), (string) config('jwt.cookies.refresh')];
}

it('clears both cookies with the same attributes they were set with, so browsers delete them', function () {
    $user = User::factory()->create();
    $login = test()->withAuthCookies([])->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])->assertOk();
    $cookies = test()->authCookiesFrom($login);

    $logout = test()->withAuthCookies($cookies)->postJson('/api/logout')->assertNoContent();

    foreach (authCookieNames() as $name) {
        /** @var Cookie $set */
        $set = $login->getCookie($name, false);
        /** @var Cookie $cleared */
        $cleared = $logout->getCookie($name, false);

        expect($cleared->getValue())->toBe('')
            ->and($cleared->getExpiresTime())->toBeLessThan(time())
            ->and($cleared->getPath())->toBe($set->getPath())
            ->and($cleared->getDomain())->toBe($set->getDomain())
            ->and($cleared->getSameSite())->toBe($set->getSameSite())
            ->and($cleared->isSecure())->toBe($set->isSecure())
            ->and($cleared->isHttpOnly())->toBeTrue();
    }
});

it('is idempotent: signing out twice, or with no cookies at all, still answers 204', function () {
    $user = User::factory()->create();
    $cookies = loginCookies($user);

    withAuthCookies($cookies)->postJson('/api/logout')->assertNoContent();
    $again = withAuthCookies($cookies)->postJson('/api/logout')->assertNoContent();
    $nobody = withAuthCookies([])->postJson('/api/logout')->assertNoContent();

    foreach ([$again, $nobody] as $response) {
        foreach (authCookieNames() as $name) {
            expect($response->getCookie($name, false)?->getValue())->toBe('');
        }
    }
    // Only the first call had someone to sign out.
    expect(AuditLog::query()->where('action', 'auth.logout')->count())->toBe(1);
});

it('audits the sign out with the user as actor', function () {
    $user = User::factory()->create();

    withAuthCookies(loginCookies($user))->postJson('/api/logout')->assertNoContent();

    $row = AuditLog::query()->where('action', 'auth.logout')->firstOrFail();
    expect($row->actor_id)->toBe($user->id)->and($row->entity_id)->toBe($user->id);
});

it('signs out with only the refresh cookie when the access token is gone', function () {
    $user = User::factory()->create();
    $cookies = loginCookies($user);
    $refreshOnly = [(string) config('jwt.cookies.refresh') => $cookies[(string) config('jwt.cookies.refresh')]];

    withAuthCookies($refreshOnly)->postJson('/api/logout')->assertNoContent();

    expect(RefreshToken::query()->whereNull('revoked_at')->count())->toBe(0);
    withAuthCookies($cookies)->postJson('/api/refresh')->assertUnauthorized();
    expect(AuditLog::query()->where('action', 'auth.logout')->where('actor_id', $user->id)->exists())->toBeTrue();
});

it('revokes every token of the sign in, even ones that were already rotated', function () {
    $user = User::factory()->create();
    $cookies = loginCookies($user);

    $rotated = withAuthCookies($cookies)->postJson('/api/refresh')->assertNoContent();
    $newCookies = test()->authCookiesFrom($rotated);
    expect(RefreshToken::query()->count())->toBe(2);

    withAuthCookies($newCookies)->postJson('/api/logout')->assertNoContent();

    expect(RefreshToken::query()->whereNull('revoked_at')->count())->toBe(0);
    // The old, already used cookie cannot sign anyone in either.
    withAuthCookies($cookies)->postJson('/api/refresh')->assertUnauthorized();
});

it('does not log a different device out', function () {
    $user = User::factory()->create();
    $phone = loginCookies($user);
    $laptop = loginCookies($user);

    withAuthCookies($phone)->postJson('/api/logout')->assertNoContent();

    withAuthCookies($laptop)->getJson('/api/me')->assertOk();
    withAuthCookies($phone)->getJson('/api/me')->assertUnauthorized();
});

it('never lets browsers or proxies keep API answers', function () {
    $user = User::factory()->create();
    $cookies = loginCookies($user);

    foreach ([
        withAuthCookies($cookies)->getJson('/api/me'),
        withAuthCookies($cookies)->postJson('/api/logout'),
        withAuthCookies([])->getJson('/api/me'),
    ] as $response) {
        expect((string) $response->headers->get('Cache-Control'))->toContain('no-store')->toContain('private');
    }
});
