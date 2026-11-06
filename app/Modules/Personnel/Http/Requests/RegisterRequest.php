<?php

declare(strict_types=1);

namespace App\Modules\Personnel\Http\Requests;

use App\Http\Requests\ResetPasswordRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'confirmed', 'max:255', Password::min(ResetPasswordRequest::MIN_LENGTH)],
            'privacy_consent' => ['accepted'],
        ];
    }
}
