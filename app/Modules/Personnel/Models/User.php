<?php

declare(strict_types=1);

namespace App\Modules\Personnel\Models;

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Access\Models\Role;
use App\Modules\Personnel\Enums\AvailabilityStatus;
use App\Modules\Personnel\Enums\Team;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * @property Team|null $team
 * @property AvailabilityStatus $status
 */
#[Fillable(['name', 'email', 'contact_number', 'role_id', 'department_id', 'team', 'status', 'password'])]
#[Hidden(['password', 'remember_token'])]
#[UseFactory(UserFactory::class)]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'disabled_at' => 'datetime',
            'password' => 'hashed',
            'team' => Team::class,
            'status' => AvailabilityStatus::class,
        ];
    }

    /** @return BelongsTo<Role, $this> */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /** @return BelongsTo<Department, $this> */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /** @return HasMany<EmergencyContact, $this> */
    public function emergencyContacts(): HasMany
    {
        return $this->hasMany(EmergencyContact::class);
    }

    /** @return HasMany<VolunteerStatusLog, $this> */
    public function statusLogs(): HasMany
    {
        return $this->hasMany(VolunteerStatusLog::class);
    }

    /** The role as an enum, or null when the role row is unknown. */
    public function roleCode(): ?RoleCode
    {
        return RoleCode::tryFrom((string) $this->role?->code);
    }

    public function isDisabled(): bool
    {
        return $this->disabled_at !== null;
    }
}
