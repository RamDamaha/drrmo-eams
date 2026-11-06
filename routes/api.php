<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\MeController;
use App\Http\Controllers\Auth\RefreshController;
use App\Http\Controllers\Auth\ResetPasswordController;
use Illuminate\Support\Facades\Route;

// Core API entry point. Owned by Core.
// Each module registers its own routes from app/Modules/<Module>/routes.php
// through its service provider. Do not add module endpoints here.

Route::post('/login', LoginController::class);
Route::post('/refresh', RefreshController::class)->middleware('throttle:refresh');
// Logout works without a valid access token, so an expired session can always sign out.
Route::post('/logout', LogoutController::class);
Route::post('/forgot-password', ForgotPasswordController::class)->middleware('throttle:forgot-password');
Route::post('/reset-password', ResetPasswordController::class)->middleware('throttle:reset-password');

Route::middleware('auth:api')->group(function () {
    Route::get('/me', MeController::class);
});
