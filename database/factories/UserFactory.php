<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Access\Models\Role;
use App\Modules\Personnel\Enums\AvailabilityStatus;
use App\Modules\Personnel\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Fake people only. Emails always end in @example.test.
 *
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->userName().'@example.test',
            'contact_number' => '09'.fake()->numerify('#########'),
            'role_id' => fn () => Role::query()->firstOrCreate(
                ['code' => RoleCode::Volunteer->value],
                ['name' => RoleCode::Volunteer->label()],
            )->id,
            'status' => AvailabilityStatus::Active,
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    public function role(RoleCode $role): static
    {
        return $this->state(fn () => [
            'role_id' => Role::query()->firstOrCreate(
                ['code' => $role->value],
                ['name' => $role->label()],
            )->id,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['status' => AvailabilityStatus::Inactive]);
    }

    public function disabled(): static
    {
        return $this->state(fn () => ['disabled_at' => now()]);
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['email_verified_at' => null]);
    }
}
