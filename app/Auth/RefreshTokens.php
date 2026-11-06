<?php

declare(strict_types=1);

namespace App\Auth;

use App\Modules\Access\Models\RefreshToken;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Rotating refresh tokens. Each one works once: a refresh marks it used and issues the next
 * one in the same family. Using an old token again (after a short grace for two open tabs)
 * means it was copied, so the whole family is revoked and the event is audited.
 */
class RefreshTokens
{
    public function __construct(private readonly AuditLogger $audit) {}

    /** A new token for a fresh sign in, or the next token in an existing family. */
    public function issue(User $user, Request $request, ?string $familyId = null): string
    {
        $plain = Str::random(64);

        RefreshToken::query()->create([
            'user_id' => $user->getKey(),
            'token_hash' => $this->hash($plain),
            'family_id' => $familyId ?? (string) Str::uuid(),
            'expires_at' => now()->addDays((int) config('jwt.refresh_ttl_days')),
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 250, ''),
        ]);

        return $plain;
    }

    /**
     * Swap a refresh token for the next one.
     *
     * @return array{0: User, 1: string}|null The user and the new token, or null to sign out.
     */
    public function rotate(string $plain, Request $request): ?array
    {
        return DB::transaction(function () use ($plain, $request): ?array {
            $token = RefreshToken::query()->where('token_hash', $this->hash($plain))->lockForUpdate()->first();

            if ($token === null || $token->revoked_at !== null || $token->expires_at->isPast()) {
                return null;
            }

            $user = $token->user;
            if ($user === null || $user->isDisabled()) {
                $this->revokeFamily($token->family_id);

                return null;
            }

            if ($token->used_at !== null) {
                // Two tabs refreshing at the same moment both send the same token. Allow that briefly.
                if ($token->used_at->greaterThan(now()->subSeconds((int) config('jwt.reuse_grace')))) {
                    return [$user, $this->issue($user, $request, $token->family_id)];
                }

                $this->revokeFamily($token->family_id);
                $this->audit->log('auth.token_reuse_detected', $user, null, ['family_id' => $token->family_id]);

                return null;
            }

            $token->forceFill(['used_at' => now()])->save();

            return [$user, $this->issue($user, $request, $token->family_id)];
        });
    }

    /** Revoke the family of this token (sign out on this device). Returns the user id, if known. */
    public function revokeFamilyOf(string $plain): ?int
    {
        $token = RefreshToken::query()->where('token_hash', $this->hash($plain))->first();
        if ($token === null) {
            return null;
        }

        $this->revokeFamily($token->family_id);

        return $token->user_id;
    }

    /** Revoke every refresh token of a user (password reset, account disabled). */
    public function revokeAllFor(User $user): void
    {
        RefreshToken::query()
            ->where('user_id', $user->getKey())
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    private function revokeFamily(string $familyId): void
    {
        RefreshToken::query()
            ->where('family_id', $familyId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    private function hash(string $plain): string
    {
        return hash('sha256', $plain);
    }
}
