<?php

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NoteAppController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\NoteGroupController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\UserSettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// --- Public Routes ---
Route::get('/', [PublicController::class, 'welcome'])->name('welcome');
Route::get('/s/app/{slug_token}', [PublicController::class, 'showPublicApp'])->name('public.app');
Route::get('/s/note/{slug_token}', [PublicController::class, 'showPublicNote'])->name('public.note');

// --- Member Authentication Routes ---
Route::get('/login', fn () => redirect()->route('welcome'))->name('login');
Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle'])->name('auth.google.redirect');
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');
Route::post('/auth/dev-login', [AuthController::class, 'devLogin'])->name('auth.dev-login');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// --- Member Workspace & Settings Routes (Protected by auth:web) ---
Route::middleware(['auth:web'])->group(function () {
    // Level 1: Workspaces
    Route::get('/app', [NoteAppController::class, 'index'])->name('apps.index');
    Route::post('/app', [NoteAppController::class, 'store'])->name('apps.store');
    Route::get('/app/{app}', [NoteAppController::class, 'show'])->name('apps.show');
    Route::put('/app/{app}', [NoteAppController::class, 'update'])->name('apps.update');
    Route::delete('/app/{app}', [NoteAppController::class, 'destroy'])->name('apps.destroy');
    Route::post('/app/{app}/collaborators', [NoteAppController::class, 'addCollaborator'])->name('apps.collaborators.store');
    Route::delete('/app/{app}/collaborators/{collabId}', [NoteAppController::class, 'removeCollaborator'])->name('apps.collaborators.destroy');

    // Level 2: Groups
    Route::post('/app/{app}/groups', [NoteGroupController::class, 'store'])->name('groups.store');
    Route::put('/groups/{group}', [NoteGroupController::class, 'update'])->name('groups.update');
    Route::delete('/groups/{group}', [NoteGroupController::class, 'destroy'])->name('groups.destroy');

    // Level 3: Notes
    Route::post('/groups/{group}/notes', [NoteController::class, 'store'])->name('notes.store');
    Route::get('/notes/{note}', [NoteController::class, 'show'])->name('notes.show');
    Route::put('/notes/{note}', [NoteController::class, 'update'])->name('notes.update');
    Route::delete('/notes/{note}', [NoteController::class, 'destroy'])->name('notes.destroy');

    // Note Attachments
    Route::post('/notes/{note}/attachments', [NoteController::class, 'uploadAttachments'])->name('notes.attachments.store');
    Route::delete('/notes/{note}/attachments/{attachmentId}', [NoteController::class, 'deleteAttachment'])->name('notes.attachments.destroy');

    // Note Granular Collaborators
    Route::post('/notes/{note}/collaborators', [NoteController::class, 'addCollaborator'])->name('notes.collaborators.store');
    Route::delete('/notes/{note}/collaborators/{collabId}', [NoteController::class, 'removeCollaborator'])->name('notes.collaborators.destroy');

    // Preferences
    Route::get('/settings/preferences', [UserSettingsController::class, 'edit'])->name('settings.preferences');
    Route::put('/settings/preferences', [UserSettingsController::class, 'update'])->name('settings.preferences.update');
});

// --- Admin Authentication Routes ---
Route::prefix('admin')->group(function () {
    Route::get('/login', [AdminAuthController::class, 'showLogin'])->name('admin.login');
    Route::post('/login', [AdminAuthController::class, 'login'])->name('admin.login.submit');
    Route::post('/logout', [AdminAuthController::class, 'logout'])->name('admin.logout');

    // Admin Protected Routes
    Route::middleware(['auth:admin'])->group(function () {
        Route::get('/', [AdminDashboardController::class, 'dashboard'])->name('admin.dashboard');
        Route::get('/settings', [AdminDashboardController::class, 'settings'])->name('admin.settings');
        Route::put('/settings', [AdminDashboardController::class, 'updateSettings'])->name('admin.settings.update');
        Route::get('/users', [AdminDashboardController::class, 'users'])->name('admin.users');
        Route::post('/users/{id}/toggle-status', [AdminDashboardController::class, 'toggleUserStatus'])->name('admin.users.toggle');
        Route::post('/admins', [AdminDashboardController::class, 'createAdmin'])->name('admin.admins.store');
        Route::get('/reminders', [AdminDashboardController::class, 'reminders'])->name('admin.reminders');
    });
});
