<?php

use App\Http\Controllers\Api\OnBoardingController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [OnBoardingController::class, 'login']);
Route::post('/register', [OnBoardingController::class, 'register']);
Route::post('/auth/{provider}', [OnBoardingController::class, 'externalAuth']);
Route::post('/password/otp', [OnBoardingController::class, 'requestPasswordOtp']);
Route::post('/password/otp/verify', [OnBoardingController::class, 'verifyPasswordOtp']);
Route::post('/password/reset', [OnBoardingController::class, 'resetPasswordWithOtp']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [OnBoardingController::class, 'user']);
    Route::post('/logout', [OnBoardingController::class, 'logout']);
    Route::get('/dashboard', [OnBoardingController::class, 'dashboard']);
    Route::get('/analytics', [OnBoardingController::class, 'analytics']);
    Route::get('/reports/summary', [OnBoardingController::class, 'reportSummary']);
    Route::post('/imports', [OnBoardingController::class, 'importCsv']);
    Route::get('/exports/{type}', [OnBoardingController::class, 'exportCsv']);
    Route::get('/notifications', [OnBoardingController::class, 'notifications']);
    Route::patch('/notifications/{notification}/read', [OnBoardingController::class, 'markNotificationRead']);
    Route::post('/ai-insights', [OnBoardingController::class, 'aiInsights']);
    Route::get('/settings', [OnBoardingController::class, 'settings']);
    Route::put('/settings/profile', [OnBoardingController::class, 'updateProfile']);
    Route::put('/settings/company', [OnBoardingController::class, 'updateCompany']);
    Route::put('/settings/security', [OnBoardingController::class, 'updateSecurity']);
    Route::patch('/settings/members/{member}/role', [OnBoardingController::class, 'updateMemberRole']);

    foreach (['customers', 'products', 'sales', 'expenses', 'employees'] as $resource) {
        Route::get("/$resource", [OnBoardingController::class, 'index']);
        Route::post("/$resource", [OnBoardingController::class, 'store']);
        Route::put("/$resource/{id}", [OnBoardingController::class, 'update']);
        Route::delete("/$resource/{id}", [OnBoardingController::class, 'destroy']);
    }
});
