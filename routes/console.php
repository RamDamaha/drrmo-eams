<?php

declare(strict_types=1);

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

// Writes a new random JWT_SECRET to .env. Changing it signs everyone out.
Artisan::command('jwt:secret {--show : Print the secret instead of writing it} {--force : Replace an existing secret}', function () {
    $secret = 'base64:'.base64_encode(random_bytes(32));

    if ($this->option('show')) {
        $this->line($secret);

        return 0;
    }

    $path = base_path('.env');
    if (! is_file($path)) {
        $this->error('No .env file. Copy .env.example to .env first.');

        return 1;
    }

    $env = (string) file_get_contents($path);
    if (preg_match('/^JWT_SECRET=(.+)$/m', $env) === 1 && ! $this->option('force')) {
        $this->info('JWT_SECRET is already set. Use --force to replace it (this signs everyone out).');

        return 0;
    }

    $line = 'JWT_SECRET='.$secret;
    $env = preg_match('/^JWT_SECRET=.*$/m', $env) === 1
        ? (string) preg_replace('/^JWT_SECRET=.*$/m', $line, $env)
        : rtrim($env).PHP_EOL.$line.PHP_EOL;
    file_put_contents($path, $env);

    $this->info('JWT_SECRET written to .env.');

    return 0;
})->purpose('Generate the secret that signs access tokens');

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
