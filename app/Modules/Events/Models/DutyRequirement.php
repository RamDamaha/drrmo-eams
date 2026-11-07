<?php

declare(strict_types=1);

namespace App\Modules\Events\Models;

use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property CarbonImmutable|Carbon $shift_starts_at
 * @property CarbonImmutable|Carbon $shift_ends_at
 */
class DutyRequirement extends Model
{
    protected $table = 'event_duty_requirements';

    protected $fillable = ['event_id', 'duty_type_id', 'role', 'team_needed', 'headcount', 'shift_starts_at', 'shift_ends_at', 'instructions'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['shift_starts_at' => 'datetime', 'shift_ends_at' => 'datetime', 'headcount' => 'integer'];
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

    /** @return HasMany<Assignment, $this> */
    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class, 'requirement_id');
    }
}
