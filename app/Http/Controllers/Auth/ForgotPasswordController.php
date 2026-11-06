<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Requests\ForgotPasswordRequest;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

/** Emails a reset link. The answer is the same whether or not the email has an account. */
class ForgotPasswordController
{
    public const MESSAGE = 'If that email has an account, we sent a link to reset the password. Check your inbox.';

    public function __invoke(ForgotPasswordRequest $request, AuditLogger $audit): JsonResponse
    {
        $email = Str::lower($request->string('email')->toString());
        $user = User::query()->where('email', $email)->first();

        if ($user !== null) {
            // A disabled account never gets a link. The broker also limits one link per minute per account.
            $sent = $user->canSignIn()
                && Password::broker()->sendResetLink(['email' => $email]) === Password::RESET_LINK_SENT;

            $audit->log('auth.password_reset_requested', $user, null, ['sent' => $sent]);
        }

        return response()->json(['message' => self::MESSAGE]);
    }
}
