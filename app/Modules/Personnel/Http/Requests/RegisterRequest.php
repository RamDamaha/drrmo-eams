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

    /** Names are trimmed before the rules run, so "  " counts as empty. */
    protected function prepareForValidation(): void
    {
        foreach (['first_name', 'last_name'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => trim($this->input($field))]);
            }
        }
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'confirmed', 'max:255', Password::min(ResetPasswordRequest::MIN_LENGTH)],
            'privacy_consent' => ['accepted'],
        ];
    }
}
