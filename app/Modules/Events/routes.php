<?php

declare(strict_types=1);

use App\Modules\Events\Http\Controllers\AssignmentController;
use App\Modules\Events\Http\Controllers\EventController;
use App\Modules\Events\Http\Controllers\LookupController;
use App\Modules\Events\Http\Controllers\RequirementController;
use Illuminate\Support\Facades\Route;

Route::get('/event-lookups', LookupController::class);

Route::get('/events', [EventController::class, 'index']);
Route::post('/events', [EventController::class, 'store']);
Route::get('/events/{event}', [EventController::class, 'show']);
Route::post('/events/{event}/requirements', [RequirementController::class, 'store']);

Route::get('/requirements/{requirement}/candidates', [AssignmentController::class, 'candidates']);
Route::post('/requirements/{requirement}/assignments', [AssignmentController::class, 'store']);

Route::get('/me/assignments', [AssignmentController::class, 'mine']);
