<?php

declare(strict_types=1);

namespace App\Auth;

use App\Modules\Personnel\Models\User;
use Illuminate\Auth\GuardHelpers;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Http\Request;

/** Reads the access token from its HttpOnly cookie. Used by every `auth:api` route. */
class JwtGuard implements Guard
{
    use GuardHelpers;

    // True when the user came from a token, so a new request reads its own token again.
    private bool $fromToken = false;

    public function __construct(
        UserProvider $provider,
        private Request $request,
        private readonly AccessTokens $tokens,
    ) {
        $this->provider = $provider;
    }

    public function user(): ?Authenticatable
    {
        if ($this->user !== null) {
            return $this->user;
        }

        $token = $this->request->cookies->get((string) config('jwt.cookies.access'));
        if (! is_string($token) || $token === '') {
            return null;
        }

        $claims = $this->tokens->decode($token);
        if ($claims === null) {
            return null;
        }

        $user = $this->provider->retrieveById((int) $claims->sub);
        // A disabled account loses access at once, even with a token that has not expired.
        if (! $user instanceof User || ! $user->canSignIn()) {
            return null;
        }

        $this->fromToken = true;

        return $this->user = $user;
    }

    /** @param  array<string, mixed>  $credentials */
    public function validate(array $credentials = []): bool
    {
        // Passwords are checked in LoginController, never through this guard.
        return false;
    }

    public function setRequest(Request $request): static
    {
        $this->request = $request;
        if ($this->fromToken) {
            $this->user = null;
            $this->fromToken = false;
        }

        return $this;
    }
}
