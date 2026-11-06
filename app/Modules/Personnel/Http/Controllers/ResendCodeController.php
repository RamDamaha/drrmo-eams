<?php

declare(strict_types=1);

namespace App\Modules\Personnel\Http\Controllers;

use App\Modules\Personnel\Actions\RegistrationService;
use App\Modules\Personnel\Http\Requests\ResendCodeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ResendCodeController
{
    public function __invoke(ResendCodeRequest $request, RegistrationService $registration): JsonResponse
    {
        $registration->resend(Str::lower($request->string('email')->toString()));

        return response()->json(['message' => RegisterController::MESSAGE]);
    }
}
