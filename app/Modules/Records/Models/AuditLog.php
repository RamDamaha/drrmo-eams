<?php

declare(strict_types=1);

namespace App\Modules\Records\Models;

use App\Modules\Personnel\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/** Insert only. Updates and deletes are blocked here and have no route. */
class AuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['actor_id', 'action', 'entity', 'entity_id', 'meta', 'ip_address'];

    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Audit rows cannot be changed.'));
        static::deleting(fn () => throw new LogicException('Audit rows cannot be deleted.'));
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['meta' => 'array'];
    }

    /** @return BelongsTo<User, $this> */
    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
