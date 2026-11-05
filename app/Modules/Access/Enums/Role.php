<?php

declare(strict_types=1);

namespace App\Modules\Access\Enums;

/**
 * Fixed roles. Admin and Director share the admin role for now.
 * To split them later, add a case here, add its row to PermissionMatrix::roles()
 * and its column to the matrix in docs/SECURITY_AND_PRIVACY.md.
 */
enum Role: string
{
    case Admin = 'admin';
    case Marshal = 'marshal';
    case Volunteer = 'volunteer';
    case Coordinator = 'coordinator';

    public function label(): string
    {
        return ucfirst($this->value);
    }
}
