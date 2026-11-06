<?php

declare(strict_types=1);

namespace App\Modules\Personnel\Actions;

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Access\Models\Role;
use App\Modules\Notifications\Contracts\MailSender;
use App\Modules\Personnel\Enums\AccountStatus;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Contracts\AuditLogger;
use App\Modules\Records\Contracts\ConsentRecorder;
use App\Modules\Records\Enums\ConsentPurpose;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * The public "Request access" flow for volunteers: sign up, confirm the email with a 6 digit
 * code, then wait for an admin to approve or reject. Rules are in docs/SECURITY_AND_PRIVACY.md.
 */
class RegistrationService
{
    public const CODE_MINUTES = 10;

    public const MAX_WRONG_TRIES = 5;

    public const RESEND_SECONDS = 60;

    public function __construct(
        private readonly MailSender $mail,
        private readonly AuditLogger $audit,
        private readonly ConsentRecorder $consent,
    ) {}

    /**
     * Create a pending volunteer and email the code. If the email is already taken nothing
     * changes, so the caller can answer the same way and nobody can probe for accounts.
     */
    public function register(string $firstName, string $lastName, string $email, string $password, ?string $ip): void
    {
        if (User::query()->where('email', $email)->exists()) {
            return;
        }

        $user = DB::transaction(function () use ($firstName, $lastName, $email, $password, $ip): User {
            $user = new User(['first_name' => $firstName, 'last_name' => $lastName, 'email' => $email, 'password' => $password]);
            $user->role_id = Role::query()->where('code', RoleCode::Volunteer->value)->value('id');
            $user->account_status = AccountStatus::PendingEmail;
            $user->save();

            $this->consent->give($user, ConsentPurpose::PrivacyNotice, $ip);
            $this->audit->log('registration.requested', $user);

            return $user;
        });

        $this->sendCode($user);
    }

    /** Send a fresh code to an account still waiting to confirm its email. Limited to one a minute. */
    public function resend(string $email): void
    {
        $user = User::query()->where('email', $email)->first();

        if ($user === null || $user->account_status !== AccountStatus::PendingEmail) {
            return;
        }

        if ($user->verification_sent_at?->greaterThan(now()->subSeconds(self::RESEND_SECONDS))) {
            return;
        }

        $this->sendCode($user);
    }

    /**
     * Check the code. On success the account moves to pending_approval.
     *
     * @return 'ok'|'invalid'|'locked' locked means five wrong tries: ask for a new code.
     */
    public function verify(string $email, string $code): string
    {
        return DB::transaction(function () use ($email, $code): string {
            $user = User::query()->where('email', $email)->lockForUpdate()->first();

            if ($user === null || $user->account_status !== AccountStatus::PendingEmail || $user->verification_code_hash === null) {
                return 'invalid';
            }

            if ($user->verification_attempts >= self::MAX_WRONG_TRIES) {
                return 'locked';
            }

            if ($user->verification_expires_at === null || $user->verification_expires_at->isPast()) {
                return 'invalid';
            }

            if (! hash_equals($user->verification_code_hash, $this->hash($user, $code))) {
                $user->forceFill(['verification_attempts' => $user->verification_attempts + 1])->save();

                return $user->verification_attempts >= self::MAX_WRONG_TRIES ? 'locked' : 'invalid';
            }

            $user->forceFill([
                'account_status' => AccountStatus::PendingApproval,
                'email_verified_at' => now(),
                'verification_code_hash' => null,
                'verification_expires_at' => null,
                'verification_attempts' => 0,
            ])->save();

            $this->audit->log('registration.email_verified', $user);

            return 'ok';
        });
    }

    /** Admin approves: the account can sign in from now on. */
    public function approve(User $user, User $admin): void
    {
        $user->forceFill([
            'account_status' => AccountStatus::Active,
            'reviewed_by' => $admin->getKey(),
            'reviewed_at' => now(),
            'rejection_reason' => null,
        ])->save();

        $this->audit->log('registration.approved', $user);
        $this->notify(
            $user,
            'Your DRRMO EAMS access was approved',
            "Hello {$user->name},\n\nThe DRRMO office approved your request. You can now sign in with your email and password.\n\nZPPSU DRRMO",
        );
    }

    /** Admin rejects with a reason. The reason is kept, audited and sent to the person. */
    public function reject(User $user, User $admin, string $reason): void
    {
        $user->forceFill([
            'account_status' => AccountStatus::Rejected,
            'reviewed_by' => $admin->getKey(),
            'reviewed_at' => now(),
            'rejection_reason' => $reason,
        ])->save();

        $this->audit->log('registration.rejected', $user, null, ['reason' => $reason]);
        $this->notify(
            $user,
            'Your DRRMO EAMS access request',
            "Hello {$user->name},\n\nThe DRRMO office could not approve your request.\nReason: {$reason}\n\nIf this is a mistake, please contact the DRRMO office.\n\nZPPSU DRRMO",
        );
    }

    private function sendCode(User $user): void
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'verification_code_hash' => $this->hash($user, $code),
            'verification_expires_at' => now()->addMinutes(self::CODE_MINUTES),
            'verification_attempts' => 0,
            'verification_sent_at' => now(),
        ])->save();

        $this->notify(
            $user,
            'Your DRRMO EAMS confirmation code',
            "Hello {$user->name},\n\nYour confirmation code is {$code}\n\nIt works for ".self::CODE_MINUTES." minutes. If you did not ask for access, ignore this email.\n\nZPPSU DRRMO",
        );
    }

    /** A mail failure must not break the request or reveal anything. The person can ask for a new code. */
    private function notify(User $user, string $subject, string $body): void
    {
        try {
            $this->mail->send($user->email, $user->name, $subject, $body);
        } catch (Throwable $e) {
            Log::error('Registration email failed: '.$e->getMessage(), ['user_id' => $user->getKey()]);
        }
    }

    private function hash(User $user, string $code): string
    {
        return hash_hmac('sha256', $user->email.'|'.$code, (string) config('app.key'));
    }
}
