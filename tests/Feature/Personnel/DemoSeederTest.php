<?php

declare(strict_types=1);

use App\Modules\Personnel\Models\User;
use Database\Seeders\DemoSeeder;

it('creates four fake people with example.test emails and can run twice', function () {
    $this->seed(DemoSeeder::class);
    $this->seed(DemoSeeder::class);

    expect(User::query()->count())->toBe(4)
        ->and(User::query()->where('email', 'not like', '%@example.test')->count())->toBe(0);
});
