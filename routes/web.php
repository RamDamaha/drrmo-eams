<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

// Every non-API path returns the React app. React Router handles the rest.
Route::view('/{path?}', 'app')
    ->where('path', '^(?!api|up).*$')
    ->name('spa');
