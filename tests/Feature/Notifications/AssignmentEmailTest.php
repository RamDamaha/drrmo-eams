<?php

declare(strict_types=1);

use App\Modules\Access\Enums\Role as RoleCode;
use App\Modules\Events\Models\Assignment;
use App\Modules\Events\Models\DutyType;
use App\Modules\Events\Models\Event;
use App\Modules\Notifications\Contracts\MailSender;
use App\Modules\Notifications\Jobs\SendNotificationEmail;
use App\Modules\Notifications\Models\Notification;
use App\Modules\Personnel\Models\User;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    $this->withHeaders(['Referer' => 'http://localhost', 'X-Requested-With' => 'XMLHttpRequest']);
    $this->seed();
});

function emailReq(Event $event)
{
    return $event->requirements()->create([
        'duty_type_id' => DutyType::query()->firstOrFail()->id, 'role' => 'marshal', 'headcount' => 2,
        'shift_starts_at' => $event->starts_at, 'shift_ends_at' => $event->ends_at,
    ]);
}

it('queues one notification and one email for create, move and cancel', function () {
    Queue::fake();
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $marshal = User::factory()->role(RoleCode::Marshal)->create(['email' => 'mara@example.test']);
    $event = Event::factory()->create();
    $one = emailReq($event);
    $two = emailReq($event);
    $cookies = loginCookies($admin);

    $id = withAuthCookies($cookies)->postJson("/api/requirements/{$one->id}/assignments", ['user_id' => $marshal->id])->assertCreated()->json('data.id');
    withAuthCookies($cookies)->patchJson("/api/assignments/{$id}", ['requirement_id' => $two->id])->assertOk();
    withAuthCookies($cookies)->postJson("/api/assignments/{$id}/cancel", ['reason' => 'Event scope reduced'])->assertOk();

    expect(Notification::query()->orderBy('id')->pluck('type')->all())
        ->toBe(['assignment.created', 'assignment.changed', 'assignment.cancelled'])
        ->and(Notification::query()->where('user_id', $marshal->id)->where('status', 'queued')->count())->toBe(3);
    Queue::assertPushed(SendNotificationEmail::class, 3);
});

it('sends the email with a link and marks the row sent', function () {
    $marshal = User::factory()->role(RoleCode::Marshal)->create(['email' => 'mara@example.test']);
    $event = Event::factory()->create();
    $a = emailReq($event)->assignments()->create(['event_id' => $event->id, 'user_id' => $marshal->id, 'duty_type_id' => DutyType::query()->firstOrFail()->id]);
    $n = Notification::query()->create(['user_id' => $marshal->id, 'assignment_id' => $a->id, 'type' => 'assignment.created']);
    $sent = [];
    app()->instance(MailSender::class, new class($sent) implements MailSender
    {
        public function __construct(public array &$sent) {}

        public function send(string $toEmail, string $toName, string $subject, string $body, ?string $html = null): void
        {
            $this->sent[] = [$toEmail, $body, $html];
        }
    });

    SendNotificationEmail::dispatchSync($n);

    expect($n->fresh()->status)->toBe('sent')->and($n->fresh()->attempts)->toBe(1)
        ->and($sent[0][0])->toBe('mara@example.test')->and($sent[0][1])->toContain('?assignment='.$a->id)
        ->and($sent[0][2])->toContain('You have a new duty')->toContain('?assignment='.$a->id)->toContain('cid:zppsu-logo');
});

it('marks the notification failed after the job gives up', function () {
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $n = Notification::query()->create(['user_id' => $marshal->id, 'type' => 'assignment.created']);
    $job = new SendNotificationEmail($n);

    expect($job->tries)->toBe(3);
    $job->failed(new RuntimeException('SMTP down'));

    expect($n->fresh()->status)->toBe('failed')->and($n->fresh()->last_error)->toBe('SMTP down');
});

it('queues nothing when a non-admin tries to change an assignment', function () {
    Queue::fake();
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $event = Event::factory()->create();
    $req = emailReq($event);
    $a = Assignment::query()->create(['event_id' => $event->id, 'requirement_id' => $req->id, 'user_id' => $marshal->id, 'duty_type_id' => $req->duty_type_id]);
    $cookies = loginCookies($marshal);

    withAuthCookies($cookies)->postJson("/api/requirements/{$req->id}/assignments", ['user_id' => $marshal->id])->assertForbidden();
    withAuthCookies($cookies)->patchJson("/api/assignments/{$a->id}", ['requirement_id' => $req->id])->assertForbidden();
    withAuthCookies($cookies)->postJson("/api/assignments/{$a->id}/cancel", ['reason' => 'No reason really'])->assertForbidden();

    expect(Notification::query()->count())->toBe(0);
    Queue::assertNothingPushed();
});

it('notifies every active assignee once when an event is cancelled', function () {
    Queue::fake();
    $admin = User::factory()->role(RoleCode::Admin)->create();
    $one = User::factory()->role(RoleCode::Marshal)->create();
    $two = User::factory()->role(RoleCode::Marshal)->create();
    $gone = User::factory()->role(RoleCode::Marshal)->create();
    $event = Event::factory()->create(['status' => 'published']);
    $req = emailReq($event);
    foreach ([$one, $two] as $u) {
        $req->assignments()->create(['event_id' => $event->id, 'user_id' => $u->id, 'duty_type_id' => $req->duty_type_id]);
    }
    $req->assignments()->create(['event_id' => $event->id, 'user_id' => $gone->id, 'duty_type_id' => $req->duty_type_id, 'status' => 'cancelled']);

    withAuthCookies(loginCookies($admin))->postJson("/api/events/{$event->id}/cancel")->assertOk();

    expect(Notification::query()->pluck('user_id')->sort()->values()->all())->toBe(collect([$one->id, $two->id])->sort()->values()->all())
        ->and(Notification::query()->where('type', 'assignment.cancelled')->count())->toBe(2);
    Queue::assertPushed(SendNotificationEmail::class, 2);
});

it('does not notify anyone when a non-admin tries to cancel an event', function () {
    Queue::fake();
    $marshal = User::factory()->role(RoleCode::Marshal)->create();
    $event = Event::factory()->create(['status' => 'published']);
    $req = emailReq($event);
    $req->assignments()->create(['event_id' => $event->id, 'user_id' => $marshal->id, 'duty_type_id' => $req->duty_type_id]);

    withAuthCookies(loginCookies($marshal))->postJson("/api/events/{$event->id}/cancel")->assertForbidden();

    expect(Notification::query()->count())->toBe(0);
});
