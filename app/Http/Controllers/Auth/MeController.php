<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Resources\MeResource;
use App\Modules\Personnel\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** The signed-in user. Every signed-in user may read their own record, so no policy is needed beyond auth. */
class MeController
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return (new MeResource($user))->response();
    }
}
