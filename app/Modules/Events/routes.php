<?php

declare(strict_types=1);

use App\Modules\Events\Http\Controllers\AssignmentController;
use App\Modules\Events\Http\Controllers\EventController;
use App\Modules\Events\Http\Controllers\LookupController;
use App\Modules\Events\Http\Controllers\MyAssignmentController;
use App\Modules\Events\Http\Controllers\RequirementController;
use Illuminate\Support\Facades\Route;

Route::get('/event-lookups', LookupController::class);

Route::get('/events', [EventController::class, 'index']);
Route::post('/events', [EventController::class, 'store']);
Route::get('/events/{event}', [EventController::class, 'show']);
Route::post('/events/{event}/publish', [EventController::class, 'publish']);
Route::post('/events/{event}/cancel', [EventController::class, 'cancel']);
Route::post('/events/{event}/requirements', [RequirementController::class, 'store']);
Route::delete('/requirements/{requirement}', [RequirementController::class, 'destroy']);
Route::get('/requirements/{requirement}/candidates', [AssignmentController::class, 'candidates']);
Route::post('/requirements/{requirement}/assignments', [AssignmentController::class, 'store']);
Route::delete('/assignments/{assignment}', [AssignmentController::class, 'destroy']);
Route::get('/me/assignments', MyAssignmentController::class);
