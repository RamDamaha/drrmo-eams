<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Auth\AccessTokens;
use App\Auth\RefreshTokens;
use App\Http\Requests\ResetPasswordRequest;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/** Sets a new password from an emailed link, then signs the account out everywhere. */
class ResetPasswordController
{
    public function __invoke(
        ResetPasswordRequest $request,
        AuditLogger $audit,
        AccessTokens $accessTokens,
        RefreshTokens $refreshTokens,
    ): JsonResponse {
        $email = Str::lower($request->string('email')->toString());
        $user = User::query()->where('email', $email)->first();

        // A disabled account gets the same answer as a bad link.
        $status = $user === null || $user->isDisabled() ? null : Password::broker()->reset(
            [
                'email' => $email,
                'token' => $request->string('token')->toString(),
                'password' => $request->string('password')->toString(),
            ],
            function (User $user, string $password) use ($accessTokens, $refreshTokens): void {
                $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
                // Sign the account out everywhere, so an old login on a lost phone stops working.
                $refreshTokens->revokeAllFor($user);
                $accessTokens->revokeAllFor($user);
            },
        );

        if ($user === null || $status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'This reset link is not valid or has expired. Ask for a new one.',
                'code' => 'invalid_reset_link',
            ], 422);
        }

        $audit->log('auth.password_reset_completed', $user);

        return response()->json(['message' => 'Your password has been changed. You can sign in now.']);
    }
}
