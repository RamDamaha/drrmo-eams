<?php

declare(strict_types=1);

// Cookie based JWT auth. See docs/ARCHITECTURE.md section 3 and docs/SECURITY_AND_PRIVACY.md.
// Both tokens travel only in HttpOnly cookies, so page scripts never see them.

return [
    // At least 32 random bytes, base64 encoded. Generate with: php artisan jwt:secret
    'secret' => env('JWT_SECRET'),

    // Key id written in the token header, so the secret can be rotated later.
    'kid' => env('JWT_KID', 'v1'),

    'algorithm' => 'HS256',

    'issuer' => env('JWT_ISSUER', env('APP_URL', 'http://localhost')),
    'audience' => env('JWT_AUDIENCE', env('APP_URL', 'http://localhost')),

    // Seconds an access token is valid.
    'access_ttl' => (int) env('JWT_ACCESS_TTL', 900),

    // Days a refresh token is valid. Each refresh replaces it with a new one.
    'refresh_ttl_days' => (int) env('JWT_REFRESH_TTL_DAYS', 7),

    // Seconds after a refresh token is used in which a second use counts as two open tabs,
    // not as theft. After this window a second use revokes the whole token family.
    'reuse_grace' => (int) env('JWT_REUSE_GRACE', 30),

    'cookies' => [
        'access' => 'drrmo_access',
        'refresh' => 'drrmo_refresh',
        'path' => '/api',
        // Must be true in production (HTTPS). Browsers drop Secure cookies on plain http://localhost.
        'secure' => (bool) env('JWT_SECURE_COOKIES', env('APP_ENV') === 'production'),
        'same_site' => 'lax',
    ],

    // Origins allowed to make state changing API calls (CSRF check). Comma separated.
    'allowed_origins' => array_values(array_filter(array_map(
        static fn (string $origin): string => rtrim(trim($origin), '/'),
        explode(',', (string) env('AUTH_ALLOWED_ORIGINS', env('APP_URL', 'http://localhost'))),
    ))),
];
