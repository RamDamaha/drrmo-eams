<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Requests;

use App\Modules\Events\Models\Event;
use App\Modules\Personnel\Enums\Team;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/** Checks the policy before validating, so a forbidden user gets 403, not a validation error. */
class StoreRequirementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', Event::class);
    }

    /**
     * Validated input with the date fields converted to UTC.
     * Without this, a time sent as "07:00+08:00" would be stored as 07:00 and read back as UTC.
     *
     * @return array<string, mixed>
     */
    public function utcData(): array
    {
        $data = $this->validated();
        foreach (['shift_start', 'shift_end'] as $key) {
            $data[$key] = CarbonImmutable::parse((string) $data[$key])->utc();
        }

        return $data;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'duty_type_id' => ['required', 'integer', 'exists:duty_types,id'],
            // Only roles that work in the field can be needed.
            'role_id' => ['required', 'integer', Rule::exists('roles', 'id')->whereIn('code', ['marshal', 'volunteer'])],
            'team_needed' => ['nullable', Rule::enum(Team::class)],
            'headcount' => ['required', 'integer', 'min:1', 'max:500'],
            'shift_start' => ['required', 'date'],
            'shift_end' => ['required', 'date', 'after:shift_start'],
            'instructions' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * The shift must sit inside the event time.
     *
     * @return list<callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            /** @var Event $event */
            $event = $this->route('event');

            if ($validator->errors()->hasAny(['shift_start', 'shift_end'])) {
                return;
            }

            $start = CarbonImmutable::parse((string) $this->input('shift_start'));
            $end = CarbonImmutable::parse((string) $this->input('shift_end'));

            if ($start->lt($event->starts_at) || $end->gt($event->ends_at)) {
                $validator->errors()->add('shift_start', 'The shift must be inside the event time.');
            }
        }];
    }
}
