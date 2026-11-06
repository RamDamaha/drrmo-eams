<?php

declare(strict_types=1);

namespace App\Modules\Personnel\Enums;

/** Where an account is in the sign up flow. Only Active accounts can sign in. */
enum AccountStatus: string
{
    case PendingEmail = 'pending_email';
    case PendingApproval = 'pending_approval';
    case Active = 'active';
    case Rejected = 'rejected';
}
