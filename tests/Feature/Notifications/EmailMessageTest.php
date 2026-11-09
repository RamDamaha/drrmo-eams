<?php

declare(strict_types=1);

use App\Modules\Notifications\Contracts\EmailMessage;
use App\Modules\Notifications\Services\LogMailSender;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

function sampleEmail(): EmailMessage
{
    return EmailMessage::make('Your code', 'Confirm your email')
        ->preheader('Your code is 123456.')
        ->greeting('Ana <b>Cruz</b>')
        ->line('Enter this code to confirm your email.')
        ->code('Your confirmation code', '123456')
        ->details(['Event' => 'Foundation Day', 'Duty' => 'Crowd control'])
        ->notice('Reason', 'Event scope reduced')
        ->button('Sign in', 'https://eams.example.test/login');
}

it('renders the shared branded layout with every block', function () {
    $html = sampleEmail()->html();

    expect($html)
        ->toContain('<!DOCTYPE html>')
        ->toContain('Confirm your email')
        ->toContain('Your code is 123456.')
        ->toContain('123456')
        ->toContain('Foundation Day')
        ->toContain('Event scope reduced')
        ->toContain('href="https://eams.example.test/login"')
        ->toContain('cid:zppsu-logo')
        ->toContain('cid:drrmo-logo')
        ->toContain('#7d1d23');
});

it('escapes what people typed', function () {
    expect(sampleEmail()->html())->toContain('Ana &lt;b&gt;Cruz&lt;/b&gt;')->not->toContain('Ana <b>Cruz</b>');
});

it('builds a plain text fallback with the same words', function () {
    expect(sampleEmail()->text())
        ->toStartWith('Hello Ana <b>Cruz</b>,')
        ->toContain('Your confirmation code is 123456')
        ->toContain("Event: Foundation Day\nDuty: Crowd control")
        ->toContain('Reason: Event scope reduced')
        ->toContain("Sign in:\nhttps://eams.example.test/login")
        ->toContain('ZPPSU DRRMO')
        ->not->toContain('<table');
});

it('saves an HTML preview with the logos inlined when logging mail', function () {
    Log::spy();
    File::delete(storage_path('logs/mail-preview.html'));
    $message = sampleEmail();

    (new LogMailSender)->send('ana@example.test', 'Ana', $message->subject, $message->text(), $message->html());

    $preview = File::get(storage_path('logs/mail-preview.html'));
    expect($preview)->toContain('data:image/png;base64,')->not->toContain('cid:zppsu-logo');
    File::delete(storage_path('logs/mail-preview.html'));
});
