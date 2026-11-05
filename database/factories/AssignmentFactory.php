<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Events\Enums\AssignmentStatus;
use App\Modules\Events\Models\Assignment;
use App\Modules\Events\Models\DutyRequirement;
use App\Modules\Personnel\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Assignment> */
class AssignmentFactory extends Factory
{
    protected $model = Assignment::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'requirement_id' => DutyRequirement::factory(),
            'user_id' => User::factory(),
            'status' => AssignmentStatus::Assigned,
            'assigned_at' => now(),
        ];
    }
}
