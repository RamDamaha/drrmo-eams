<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Resources;

use App\Modules\Events\Models\Assignment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Assignment */
class AssignmentResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'user' => $this->whenLoaded('user', fn () => ['id' => $this->user->id, 'name' => $this->user->name]),
            // Filled for "my assignments", where the person needs the event, place, time and duty type.
            'requirement' => $this->whenLoaded('requirement', fn () => [
                'id' => $this->requirement->id,
                'duty_type' => $this->requirement->dutyType->name,
                'shift_start' => $this->requirement->shift_start->toIso8601String(),
                'shift_end' => $this->requirement->shift_end->toIso8601String(),
                'instructions' => $this->requirement->instructions,
                'event' => [
                    'id' => $this->requirement->event->id,
                    'title' => $this->requirement->event->title,
                    'location' => $this->requirement->event->location->name,
                ],
            ]),
        ];
    }
}
