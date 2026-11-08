<?php

declare(strict_types=1);

use App\Modules\Monitoring\Http\Controllers\DutyController;
use Illuminate\Support\Facades\Route;

Route::post('/me/assignments/{assignment}/start-duty', [DutyController::class, 'start']);
Route::post('/me/assignments/{assignment}/end-duty', [DutyController::class, 'end']);
