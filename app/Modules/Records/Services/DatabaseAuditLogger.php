<?php

declare(strict_types=1);

namespace App\Modules\Records\Services;

use App\Modules\Records\Contracts\AuditLogger;
use App\Modules\Records\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class DatabaseAuditLogger implements AuditLogger
{
    public function log(string $action, Model|string $entity, ?int $entityId = null, array $meta = []): void
    {
        if ($entity instanceof Model) {
            $entityId ??= is_int($entity->getKey()) ? $entity->getKey() : null;
            $entity = Str::snake(class_basename($entity));
        }

        AuditLog::query()->create([
            'actor_id' => Auth::id(),
            'action' => $action,
            'entity' => $entity,
            'entity_id' => $entityId,
            'meta' => $meta === [] ? null : $meta,
            'ip_address' => request()->ip(),
        ]);
    }
}
