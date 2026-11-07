<?php

declare(strict_types=1);

use App\Modules\Events\Http\Controllers\EventController;
use App\Modules\Events\Http\Controllers\LookupController;
use Illuminate\Support\Facades\Route;

Route::get('/event-lookups', LookupController::class);

Route::get('/events', [EventController::class, 'index']);
Route::post('/events', [EventController::class, 'store']);
