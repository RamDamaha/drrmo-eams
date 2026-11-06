<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Modules\Access\Models\RefreshToken;
use App\Modules\Personnel\Models\User;
use App\Modules\Records\Models\AuditLog;
use Database\Seeders\PermissionSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

// Requests must look like they come from the app (VerifyApiRequestOrigin).
beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    $this->withHeaders(['Referer' => 'http://localhost', 'X-Requested-With' => 'XMLHttpRequest']);
    Notification::fake();
});

function resetWith(array $overrides = [])
{
    return test()->postJson('/api/reset-password', array_merge([
        'password' => 'a-new-long-password',
        'password_confirmation' => 'a-new-long-password',
    ], $overrides));
}

it('sends a reset link to an existing account', function () {
    $user = User::factory()->create();

    $this->postJson('/api/forgot-password', ['email' => $user->email])
        ->assertOk()
        ->assertJsonPath('message', ForgotPasswordController::MESSAGE);

    Notification::assertSentTo($user, ResetPassword::class);
    expect(AuditLog::query()->where('action', 'auth.password_reset_requested')->where('entity_id', $user->id)->value('meta'))
        ->toBe(['sent' => true]);
});

it('gives the same answer for an unknown email and sends nothing', function () {
    $this->postJson('/api/forgot-password', ['email' => 'nobody@example.test'])
        ->assertOk()
        ->assertJsonPath('message', ForgotPasswordController::MESSAGE);

    Notification::assertNothingSent();
});

it('never sends a link to a disabled account', function () {
    $user = User::factory()->disabled()->create();

    $this->postJson('/api/forgot-password', ['email' => $user->email])
        ->assertOk()
        ->assertJsonPath('message', ForgotPasswordController::MESSAGE);

    Notification::assertNothingSent();
    expect(AuditLog::query()->where('action', 'auth.password_reset_requested')->value('meta'))->toBe(['sent' => false]);
});

it('points the emailed link at the reset screen', function () {
    $user = User::factory()->create();

    $this->postJson('/api/forgot-password', ['email' => $user->email])->assertOk();

    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user) {
        $url = $notification->toMail($user)->actionUrl;

        return str_starts_with($url, url('/reset-password').'?token='.$notification->token)
            && str_contains($url, 'email='.urlencode($user->email));
    });
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
    $token = Password::broker()->createToken($user);

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
    $token = Password::broker()->createToken($user);

    resetWith(['token' => $token, 'email' => $user->email])->assertOk();
    resetWith(['token' => $token, 'email' => $user->email])
        ->assertStatus(422)
        ->assertJsonPath('code', 'invalid_reset_link');
});

it('rejects a wrong token, an unknown email and a disabled account the same way', function () {
    $user = User::factory()->create();
    $disabled = User::factory()->disabled()->create();
    $disabledToken = Password::broker()->createToken($disabled);

    resetWith(['token' => 'wrong', 'email' => $user->email])->assertStatus(422)->assertJsonPath('code', 'invalid_reset_link');
    resetWith(['token' => 'wrong', 'email' => 'nobody@example.test'])->assertStatus(422)->assertJsonPath('code', 'invalid_reset_link');
    resetWith(['token' => $disabledToken, 'email' => $disabled->email])->assertStatus(422)->assertJsonPath('code', 'invalid_reset_link');

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue()
        ->and(Hash::check('password', $disabled->fresh()->password))->toBeTrue();
});

it('rejects a link older than 60 minutes', function () {
    $user = User::factory()->create();
    $token = Password::broker()->createToken($user);

    $this->travel(61)->minutes();

    resetWith(['token' => $token, 'email' => $user->email])->assertStatus(422)->assertJsonPath('code', 'invalid_reset_link');
});

it('needs a password of at least 12 characters, typed twice', function () {
    $user = User::factory()->create();
    $token = Password::broker()->createToken($user);

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
