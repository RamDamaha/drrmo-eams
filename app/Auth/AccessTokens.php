<?php

declare(strict_types=1);

namespace App\Auth;

use App\Modules\Personnel\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;
use stdClass;
use Throwable;

/**
 * Short lived access tokens (JWT, HS256). Sent only in an HttpOnly cookie.
 *
 * A token is refused when its signature, algorithm, key id, issuer or audience is wrong,
 * when it has expired, when its id was denylisted at sign out, or when it was issued
 * before the account was signed out everywhere (password reset).
 */
class AccessTokens
{
    /** @return array{token: string, jti: string, expires_at: int} */
    public function issue(User $user): array
    {
        $now = now()->getTimestamp();
        $jti = (string) Str::uuid();
        $expiresAt = $now + $this->ttl();

        $token = JWT::encode([
            'iss' => config('jwt.issuer'),
            'aud' => config('jwt.audience'),
            'sub' => (string) $user->getKey(),
            'iat' => $now,
            'nbf' => $now,
            'exp' => $expiresAt,
            'jti' => $jti,
        ], $this->secret(), $this->algorithm(), $this->keyId());

        return ['token' => $token, 'jti' => $jti, 'expires_at' => $expiresAt];
    }

    /** The checked claims, or null when the token must not be trusted. */
    public function decode(string $token): ?stdClass
    {
        // A key list by key id: a token without our kid, or signed with another algorithm
        // (including "none"), is rejected by the library. A missing secret throws, on purpose.
        $keys = [$this->keyId() => new Key($this->secret(), $this->algorithm())];

        try {
            // Use the app clock for exp and nbf, the same clock that issued the token.
            JWT::$timestamp = now()->getTimestamp();
            $claims = JWT::decode($token, $keys);
        } catch (Throwable) {
            return null;
        }

        $valid = ($claims->iss ?? null) === config('jwt.issuer')
            && ($claims->aud ?? null) === config('jwt.audience')
            && is_string($claims->sub ?? null) && ctype_digit($claims->sub)
            && is_string($claims->jti ?? null)
            && is_int($claims->iat ?? null) && is_int($claims->exp ?? null);

        if (! $valid || Cache::has($this->denyKey($claims->jti))) {
            return null;
        }

        $revokedAt = Cache::get($this->revokedKey((int) $claims->sub));
        if (is_int($revokedAt) && $claims->iat < $revokedAt) {
            return null;
        }

        return $claims;
    }

    /** Refuse this token id until it would have expired anyway (sign out). */
    public function deny(string $jti, int $expiresAt): void
    {
        $seconds = $expiresAt - now()->getTimestamp();
        if ($seconds > 0) {
            Cache::put($this->denyKey($jti), true, $seconds);
        }
    }

    /** Refuse every access token issued to this user before now (password reset). */
    public function revokeAllFor(User $user): void
    {
        Cache::put($this->revokedKey((int) $user->getKey()), now()->getTimestamp(), $this->ttl() + 60);
    }

    public function ttl(): int
    {
        return (int) config('jwt.access_ttl');
    }

    private function secret(): string
    {
        $secret = (string) config('jwt.secret');
        if (str_starts_with($secret, 'base64:')) {
            $secret = (string) base64_decode(substr($secret, 7), true);
        }

        if (strlen($secret) < 32) {
            throw new RuntimeException('JWT_SECRET is missing or shorter than 32 bytes. Run: php artisan jwt:secret');
        }

        return $secret;
    }

    private function algorithm(): string
    {
        return (string) config('jwt.algorithm');
    }

    private function keyId(): string
    {
        return (string) config('jwt.kid');
    }

    private function denyKey(string $jti): string
    {
        return 'jwt:denied:'.$jti;
    }

    private function revokedKey(int $userId): string
    {
        return 'jwt:revoked-before:'.$userId;
    }
}
