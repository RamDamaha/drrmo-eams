<?php

declare(strict_types=1);

namespace App\Modules\Records\Contracts;

use Illuminate\Database\Eloquent\Model;

interface AuditLogger
{
    /**
     * Write one audit row for a sensitive action (list in docs/SECURITY_AND_PRIVACY.md section 4).
     *
     * The actor is the signed-in user, or null for system work such as jobs.
     * Pass a model to record its type and id, or a plain entity name with an id.
     *
     * @param  string  $action  Dotted action name, for example `assignment.created`.
     * @param  array<string, mixed>  $meta  Extra detail. For changes use `before` and `after`.
     */
    public function log(string $action, Model|string $entity, ?int $entityId = null, array $meta = []): void;
}
