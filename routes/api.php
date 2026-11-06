<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\MeController;
use App\Http\Controllers\Auth\ResetPasswordController;
use Illuminate\Support\Facades\Route;

// Core API entry point. Owned by Core.
// Each module registers its own routes from app/Modules/<Module>/routes.php
// through its service provider. Do not add module endpoints here.

Route::post('/login', LoginController::class);
Route::post('/forgot-password', ForgotPasswordController::class)->middleware('throttle:forgot-password');
Route::post('/reset-password', ResetPasswordController::class)->middleware('throttle:reset-password');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', LogoutController::class);
    Route::get('/me', MeController::class);
});
