<?php

declare(strict_types=1);

namespace App\Modules\Personnel\Http\Controllers;

use App\Modules\Personnel\Actions\RegistrationService;
use App\Modules\Personnel\Http\Requests\CodeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class VerifyRegistrationController
{
    public function __invoke(CodeRequest $request, RegistrationService $registration): JsonResponse
    {
        $result = $registration->verify(
            Str::lower($request->string('email')->toString()),
            $request->string('code')->toString(),
        );

        return match ($result) {
            'ok' => response()->json(['message' => 'Email confirmed. The DRRMO office will review your request.']),
            'locked' => response()->json([
                'message' => 'Too many wrong codes. Ask for a new code.',
                'code' => 'code_locked',
            ], 422),
            default => response()->json([
                'message' => 'That code is wrong or has expired.',
                'code' => 'invalid_code',
            ], 422),
        };
    }
}
