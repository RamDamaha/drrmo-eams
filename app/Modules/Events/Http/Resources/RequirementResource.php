<?php

declare(strict_types=1);

namespace App\Modules\Events\Http\Resources;

use App\Modules\Events\Models\DutyRequirement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DutyRequirement */
class RequirementResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event_id' => $this->event_id,
            'duty_type' => $this->whenLoaded('dutyType', fn () => ['id' => $this->dutyType->id, 'name' => $this->dutyType->name]),
            'role' => $this->whenLoaded('role', fn () => $this->role->code),
            'team_needed' => $this->team_needed?->value,
            'headcount' => $this->headcount,
            'shift_start' => $this->shift_start->toIso8601String(),
            'shift_end' => $this->shift_end->toIso8601String(),
            'instructions' => $this->instructions,
            'assigned_count' => $this->whenCounted('assignments'),
            'assignments' => AssignmentResource::collection($this->whenLoaded('assignments')),
        ];
    }
}
