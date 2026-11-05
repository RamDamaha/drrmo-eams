<?php

declare(strict_types=1);

namespace App\Modules\Events\Models;

use App\Modules\Access\Models\Role;
use App\Modules\Personnel\Enums\Team;
use Carbon\Carbon;
use Database\Factories\DutyRequirementFactory;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One line of "who we need": duty type, role, optional team, headcount and shift.
 *
 * @property Team|null $team_needed
 * @property Carbon $shift_start
 * @property Carbon $shift_end
 */
#[UseFactory(DutyRequirementFactory::class)]
class DutyRequirement extends Model
{
    /** @use HasFactory<DutyRequirementFactory> */
    use HasFactory;

    protected $table = 'event_duty_requirements';

    protected $fillable = ['event_id', 'duty_type_id', 'role_id', 'team_needed', 'headcount', 'shift_start', 'shift_end', 'instructions'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['shift_start' => 'datetime', 'shift_end' => 'datetime', 'team_needed' => Team::class, 'headcount' => 'integer'];
    }

    /** @return BelongsTo<Event, $this> */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /** @return BelongsTo<DutyType, $this> */
    public function dutyType(): BelongsTo
    {
        return $this->belongsTo(DutyType::class);
    }

    /** @return BelongsTo<Role, $this> */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /** @return HasMany<Assignment, $this> */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class, 'requirement_id');
    }
}
