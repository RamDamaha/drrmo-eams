<?php

declare(strict_types=1);

namespace App\Modules\Events\Models;

use App\Modules\Personnel\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assignment extends Model
{
    protected $fillable = ['event_id', 'user_id', 'duty_type_id', 'assigned_by'];

    /** @return BelongsTo<Event, $this> */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<DutyType, $this> */
    public function dutyType(): BelongsTo
    {
        return $this->belongsTo(DutyType::class);
    }
}
