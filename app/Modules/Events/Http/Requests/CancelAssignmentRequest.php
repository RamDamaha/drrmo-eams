<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Requests;

use App\Modules\Events\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class CancelAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('assign', Event::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['reason' => ['required', 'string', 'min:5', 'max:500']];
    }
}
