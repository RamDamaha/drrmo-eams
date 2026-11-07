<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Requests;

use App\Modules\Events\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/** Checks the policy first, so a forbidden user gets 403, not a validation error. */
class StoreAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('assign', Event::class);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        /** @var Event $event */
        $event = $this->route('event');

        return [
            // Only approved marshals and volunteers who are not yet on this event.
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')->where(
                fn ($q) => $q->where('account_status', 'active')->whereNull('disabled_at')
                    ->whereIn('role_id', fn ($r) => $r->select('id')->from('roles')->whereIn('code', ['marshal', 'volunteer'])),
            ), Rule::unique('assignments', 'user_id')->where('event_id', $event->id)],
            'duty_type_id' => ['required', 'integer', 'exists:duty_types,id'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['user_id.unique' => 'This person is already assigned to the event.'];
    }
}
