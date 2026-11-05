<?php

declare(strict_types=1);

namespace App\Modules\Events\Models;

use App\Modules\Events\Enums\AssignmentStatus;
use App\Modules\Personnel\Models\User;
use Database\Factories\AssignmentFactory;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property AssignmentStatus $status
 */
#[UseFactory(AssignmentFactory::class)]
class Assignment extends Model
{
    /** @use HasFactory<AssignmentFactory> */
    use HasFactory;

    protected $fillable = ['requirement_id', 'user_id', 'status', 'assigned_by', 'assigned_at', 'acknowledged_at', 'override_reason'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => AssignmentStatus::class,
            'assigned_at' => 'datetime',
            'acknowledged_at' => 'datetime',
            'duty_started_at' => 'datetime',
            'duty_ended_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<DutyRequirement, $this> */
    public function requirement(): BelongsTo
    {
        return $this->belongsTo(DutyRequirement::class, 'requirement_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
