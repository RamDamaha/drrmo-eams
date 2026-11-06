<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Requests\ForgotPasswordRequest;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Throwable;

/** Emails a reset link. The answer is the same whether or not the email has an account. */
class ForgotPasswordController
{
    public const MESSAGE = 'If that email has an account, we sent a link to reset the password. Check your inbox.';

    public function __invoke(ForgotPasswordRequest $request, AuditLogger $audit): JsonResponse
    {
        $email = Str::lower($request->string('email')->toString());
        $user = User::query()->where('email', $email)->first();

        if ($user !== null) {
            // Only an active account gets a link. Pending, rejected and disabled accounts never do.
            // The broker also limits one link per minute per account. A mail failure is logged and
            // the answer stays the same, so nobody can tell whether the email has an account.
            $sent = false;
            if ($user->canSignIn()) {
                try {
                    $sent = Password::broker()->sendResetLink(['email' => $email]) === Password::RESET_LINK_SENT;
                } catch (Throwable $e) {
                    Log::error('Password reset email failed: '.$e->getMessage(), ['user_id' => $user->getKey()]);
                }
            }

            $audit->log('auth.password_reset_requested', $user, null, ['sent' => $sent]);
        }

        return response()->json(['message' => self::MESSAGE]);
    }
}
