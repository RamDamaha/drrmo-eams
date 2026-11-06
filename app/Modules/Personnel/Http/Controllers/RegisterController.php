<?php

declare(strict_types=1);

namespace App\Modules\Personnel\Http\Controllers;

use App\Modules\Personnel\Actions\RegistrationService;
use App\Modules\Personnel\Http\Requests\RegisterRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

/** Public request access. The answer is the same whether or not the email is already used. */
class RegisterController
{
    public const MESSAGE = 'If this email can be used, we sent a 6 digit code. Enter it to confirm your email.';

    public function __invoke(RegisterRequest $request, RegistrationService $registration): JsonResponse
    {
        $registration->register(
            $request->string('first_name')->toString(),
            $request->string('last_name')->toString(),
            Str::lower($request->string('email')->toString()),
            $request->string('password')->toString(),
            $request->ip(),
        );

        return response()->json(['message' => self::MESSAGE], 202);
    }
}
