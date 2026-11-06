<?php

declare(strict_types=1);

namespace App\Modules\Personnel\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResendCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['email' => ['required', 'string', 'email', 'max:255']];
    }
}
