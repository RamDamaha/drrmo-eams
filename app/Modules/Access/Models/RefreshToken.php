<?php

declare(strict_types=1);

namespace App\Modules\Access\Models;

use App\Modules\Personnel\Models\User;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A stored refresh token. Only the hash is kept, never the token itself.
 *
 * @property int $id
 * @property int $user_id
 * @property string $token_hash
 * @property string $family_id
 * @property Carbon $expires_at
 * @property Carbon|null $used_at
 * @property Carbon|null $revoked_at
 */
#[Fillable(['user_id', 'token_hash', 'family_id', 'expires_at', 'used_at', 'revoked_at', 'ip_address', 'user_agent'])]
class RefreshToken extends Model
{
    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
