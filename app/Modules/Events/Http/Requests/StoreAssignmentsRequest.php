<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Requests;

use App\Modules\Events\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

/** Checks the policy before validating, so a forbidden user gets 403, not a validation error. */
class StoreAssignmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('assign', Event::class);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'user_ids' => ['required', 'array', 'min:1', 'max:100'],
            'user_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ];
    }
}
