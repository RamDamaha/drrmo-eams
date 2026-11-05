<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Access\Models\Role;
use App\Modules\Events\Models\DutyRequirement;
use App\Modules\Events\Models\DutyType;
use App\Modules\Events\Models\Event;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<DutyRequirement> */
class DutyRequirementFactory extends Factory
{
    protected $model = DutyRequirement::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'event_id' => Event::factory(),
            'duty_type_id' => fn () => DutyType::query()->firstOrCreate(['name' => 'Crowd control'])->id,
            'role_id' => fn () => Role::query()->firstOrCreate(
                ['code' => RoleCode::Marshal->value],
                ['name' => RoleCode::Marshal->label()],
            )->id,
            'headcount' => 2,
            'shift_start' => now()->addDays(7)->setTime(7, 0),
            'shift_end' => now()->addDays(7)->setTime(12, 0),
        ];
    }
}
