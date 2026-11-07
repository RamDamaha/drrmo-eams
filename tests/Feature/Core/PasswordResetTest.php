<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Modules\Access\Models\RefreshToken;
use App\Modules\Notifications\Contracts\MailSender;
use App\Modules\Personnel\Enums\AccountStatus;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Models\AuditLog;
use Database\Seeders\PermissionSeeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Tests\Support\FakeMailSender;

// Requests must look like they come from the app (VerifyApiRequestOrigin).
beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->withHeaders(['Referer' => 'http://localhost', 'X-Requested-With' => 'XMLHttpRequest']);
    $this->mail = new FakeMailSender;
    $this->app->instance(MailSender::class, $this->mail);
});

function resetTokenFor(User $user): string
{
    /** @var PasswordBroker $broker */
    $broker = Password::broker();

    return $broker->createToken($user);
}

function resetWith(array $overrides = [])
{
    return test()->postJson('/api/reset-password', array_merge([
        'password' => 'a-new-long-password',
        'password_confirmation' => 'a-new-long-password',
    ], $overrides));
}

it('emails a reset link to an active account through the mail sender', function () {
    $user = User::factory()->create();

    $this->postJson('/api/forgot-password', ['email' => $user->email])
        ->assertOk()
        ->assertJsonPath('message', ForgotPasswordController::MESSAGE);

    expect($this->mail->sent)->toHaveCount(1)
        ->and($this->mail->sent[0]['to'])->toBe($user->email)
        ->and($this->mail->sent[0]['subject'])->toBe('Reset your DRRMO EAMS password')
        ->and($this->mail->sent[0]['body'])->toContain("Hello {$user->name}");
    expect(AuditLog::query()->where('action', 'auth.password_reset_requested')->where('entity_id', $user->id)->value('meta'))
        ->toBe(['sent' => true]);
});

it('gives the same answer for an unknown email and sends nothing', function () {
    $known = User::factory()->create();
    $known = test()->postJson('/api/forgot-password', ['email' => $known->email]);
    $unknown = test()->postJson('/api/forgot-password', ['email' => 'nobody@example.test']);

    expect($unknown->status())->toBe($known->status())->and($unknown->json())->toBe($known->json());
    expect(collect($this->mail->sent)->pluck('to')->all())->not->toContain('nobody@example.test');
});

it('never sends a link to a disabled, pending or rejected account, and answers the same', function (string $kind) {
    $user = match ($kind) {
        'disabled' => User::factory()->disabled()->create(),
        'pending_email' => User::factory()->accountStatus(AccountStatus::PendingEmail)->create(),
        'pending_approval' => User::factory()->accountStatus(AccountStatus::PendingApproval)->create(),
        'rejected' => User::factory()->accountStatus(AccountStatus::Rejected)->create(),
    };

    $this->postJson('/api/forgot-password', ['email' => $user->email])
        ->assertOk()
        ->assertJsonPath('message', ForgotPasswordController::MESSAGE);

    expect($this->mail->sent)->toBe([]);
    expect(AuditLog::query()->where('action', 'auth.password_reset_requested')->value('meta'))->toBe(['sent' => false]);
})->with(['disabled', 'pending_email', 'pending_approval', 'rejected']);

it('keeps the same answer when the email cannot be sent, and logs the failure', function () {
    Log::spy();
    $this->mail->fail = true;
    $user = User::factory()->create();

    $this->postJson('/api/forgot-password', ['email' => $user->email])
        ->assertOk()
        ->assertJsonPath('message', ForgotPasswordController::MESSAGE);

    Log::shouldHaveReceived('error')->withArgs(fn (string $message) => str_starts_with($message, 'Password reset email failed: smtp down'))->once();
    expect(AuditLog::query()->where('action', 'auth.password_reset_requested')->value('meta'))->toBe(['sent' => false]);
});

it('points the emailed link at the reset screen and the link works', function () {
    $user = User::factory()->create();

    $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

    $link = $this->mail->lastLink();
    expect($link)->toStartWith(url('/reset-password').'?token=')
        ->and($link)->toContain('email='.urlencode($user->email));

    parse_str((string) parse_url($link, PHP_URL_QUERY), $query);
    $this->travel(1)->seconds();
    resetWith(['token' => $query['token'], 'email' => $query['email']])->assertOk();
    $this->postJson('/api/login', ['email' => $user->email, 'password' => 'a-new-long-password'])->assertOk();
});

it('sends one link a minute per account', function () {
    $user = User::factory()->create();

    $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
    $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
    expect($this->mail->sent)->toHaveCount(1);

    $this->travel(61)->seconds();
    $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
    expect($this->mail->sent)->toHaveCount(2);
});

it('rejects a missing or malformed email', function () {
    $this->postJson('/api/forgot-password', [])->assertStatus(422)->assertJsonValidationErrors('email');
    $this->postJson('/api/forgot-password', ['email' => 'not-an-email'])->assertStatus(422);
});

it('allows 3 forgot password requests per 10 minutes per IP', function () {
    foreach (range(1, 3) as $i) {
        $this->postJson('/api/forgot-password', ['email' => "person{$i}@example.test"])->assertOk();
    }

    $this->postJson('/api/forgot-password', ['email' => 'person4@example.test'])
        ->assertStatus(429)
        ->assertJsonPath('code', 'too_many_attempts');

    $this->travel(11)->minutes();
    $this->postJson('/api/forgot-password', ['email' => 'person5@example.test'])->assertOk();
});

it('sets a new password, signs out every device and writes an audit row', function () {
    $user = User::factory()->create();
    $oldPhone = loginCookies($user);
    $token = resetTokenFor($user);

    $this->travel(1)->seconds();
    resetWith(['token' => $token, 'email' => $user->email])->assertOk();

    $user->refresh();
    expect(Hash::check('a-new-long-password', $user->password))->toBeTrue()
        ->and(RefreshToken::query()->where('user_id', $user->id)->whereNull('revoked_at')->count())->toBe(0)
        ->and(AuditLog::query()->where('action', 'auth.password_reset_completed')->where('entity_id', $user->id)->exists())->toBeTrue();

    // The old phone's access token and refresh token both stop working.
    withAuthCookies($oldPhone)->getJson('/api/me')->assertUnauthorized();
    withAuthCookies($oldPhone)->postJson('/api/refresh')->assertUnauthorized();

    $this->postJson('/api/login', ['email' => $user->email, 'password' => 'a-new-long-password'])->assertOk();
});

it('accepts a link only once', function () {
    $user = User::factory()->create();
    $token = resetTokenFor($user);

    resetWith(['token' => $token, 'email' => $user->email])->assertOk();
    resetWith(['token' => $token, 'email' => $user->email])
        ->assertStatus(422)
        ->assertJsonPath('code', 'invalid_reset_link');
});

it('rejects a wrong token, an unknown email and a disabled account the same way', function () {
    $user = User::factory()->create();
    $disabled = User::factory()->disabled()->create();
    $disabledToken = resetTokenFor($disabled);

    resetWith(['token' => 'wrong', 'email' => $user->email])->assertStatus(422)->assertJsonPath('code', 'invalid_reset_link');
    resetWith(['token' => 'wrong', 'email' => 'nobody@example.test'])->assertStatus(422)->assertJsonPath('code', 'invalid_reset_link');
    resetWith(['token' => $disabledToken, 'email' => $disabled->email])->assertStatus(422)->assertJsonPath('code', 'invalid_reset_link');

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue()
        ->and(Hash::check('password', $disabled->fresh()->password))->toBeTrue();
});

it('rejects a link older than 60 minutes', function () {
    $user = User::factory()->create();
    $token = resetTokenFor($user);

    $this->travel(61)->minutes();

    resetWith(['token' => $token, 'email' => $user->email])->assertStatus(422)->assertJsonPath('code', 'invalid_reset_link');
});

it('needs a password of at least 12 characters, typed twice', function () {
    $user = User::factory()->create();
    $token = resetTokenFor($user);

    resetWith(['token' => $token, 'email' => $user->email, 'password' => 'short-pass1', 'password_confirmation' => 'short-pass1'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('password');
    resetWith(['token' => $token, 'email' => $user->email, 'password_confirmation' => 'something-else-entirely'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('password');
});

it('allows 10 reset attempts per 10 minutes per IP', function () {
    foreach (range(1, 10) as $_) {
        resetWith(['token' => 'wrong', 'email' => 'nobody@example.test'])->assertStatus(422);
    }

    resetWith(['token' => 'wrong', 'email' => 'nobody@example.test'])
        ->assertStatus(429)
        ->assertJsonPath('code', 'too_many_attempts');
});
