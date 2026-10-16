<?php

use App\Http\Controllers\Admin\AdminAuthController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\AppNotificationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NoteAppController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\NoteGroupController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\SavedLinkController;
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
Route::get('/s/group/{slug_token}', [PublicController::class, 'showPublicGroup'])->name('public.group');
Route::get('/s/note/{slug_token}', [PublicController::class, 'showPublicNote'])->name('public.note');
Route::get('/s/{slug_token}', [PublicController::class, 'showShortlink'])->name('public.shortlink');
Route::get('/share/app/{slug_token}', fn ($slug_token) => redirect()->route('public.app', ['slug_token' => $slug_token] + request()->query()));
Route::get('/share/group/{slug_token}', fn ($slug_token) => redirect()->route('public.group', ['slug_token' => $slug_token] + request()->query()));
Route::get('/share/note/{slug_token}', fn ($slug_token) => redirect()->route('public.note', ['slug_token' => $slug_token] + request()->query()));

// Attachments View & Download (Public or authorized access)
Route::get('/attachments/{attachment}/preview', [NoteController::class, 'previewAttachment'])->name('attachments.preview');
Route::get('/attachments/{attachment}/download', [NoteController::class, 'downloadAttachment'])->name('attachments.download');

// --- Member Authentication Routes ---
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::get('/auth/google/redirect', [AuthController::class, 'redirectToGoogle'])->name('auth.google.redirect');
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('auth.google.callback');
Route::post('/auth/dev-login', [AuthController::class, 'devLogin'])->name('auth.dev-login');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// --- Note & Group Operations (Authorized via canUserEdit / canUserView in controllers) ---
// Groups
Route::post('/app/{app}/groups', [NoteGroupController::class, 'store'])->name('groups.store');
Route::put('/groups/{group}', [NoteGroupController::class, 'update'])->name('groups.update');
Route::delete('/groups/{group}', [NoteGroupController::class, 'destroy'])->name('groups.destroy');

// Notes
Route::post('/notes/reorder', [NoteController::class, 'reorder'])->name('notes.reorder');
Route::post('/groups/{group}/notes', [NoteController::class, 'store'])->name('notes.store');
Route::get('/notes/{note}', [NoteController::class, 'show'])->name('notes.show');
Route::put('/notes/{note}', [NoteController::class, 'update'])->name('notes.update');
Route::post('/notes/{note}/pin', [NoteController::class, 'togglePin'])->name('notes.pin');
Route::delete('/notes/{note}', [NoteController::class, 'destroy'])->name('notes.destroy');

// Note Attachments
Route::post('/notes/{note}/attachments', [NoteController::class, 'uploadAttachments'])->name('notes.attachments.store');
Route::delete('/notes/{note}/attachments/{attachmentId}', [NoteController::class, 'deleteAttachment'])->name('notes.attachments.destroy');

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

    // Sharing & Custom Shortlink
    Route::post('/app/{app}/share', [NoteAppController::class, 'updateSharing'])->name('apps.share.update');
    Route::post('/groups/{group}/share', [NoteGroupController::class, 'updateSharing'])->name('groups.share.update');
    Route::post('/notes/{note}/share', [NoteController::class, 'updateSharing'])->name('notes.share.update');
    Route::get('/share/check-slug', [PublicController::class, 'checkSlugAvailability'])->name('share.check-slug');

    // Note Granular Collaborators
    Route::post('/notes/{note}/collaborators', [NoteController::class, 'addCollaborator'])->name('notes.collaborators.store');
    Route::delete('/notes/{note}/collaborators/{collabId}', [NoteController::class, 'removeCollaborator'])->name('notes.collaborators.destroy');

    // Personal Reminders
    Route::get('/notes/{note}/personal-reminder', [NoteController::class, 'getPersonalReminder'])->name('notes.personal-reminder.show');
    Route::post('/notes/{note}/personal-reminder', [NoteController::class, 'setPersonalReminder'])->name('notes.personal-reminder.store');
    Route::delete('/notes/{note}/personal-reminder', [NoteController::class, 'deletePersonalReminder'])->name('notes.personal-reminder.destroy');

    // Saved Shared Links (Bookmarks)
    Route::post('/saved-links', [SavedLinkController::class, 'store'])->name('saved-links.store');
    Route::delete('/saved-links', [SavedLinkController::class, 'destroy'])->name('saved-links.destroy');
    Route::get('/saved-links/status', [SavedLinkController::class, 'status'])->name('saved-links.status');

    // Preferences
    Route::get('/settings/preferences', [UserSettingsController::class, 'edit'])->name('settings.preferences');
    Route::put('/settings/preferences', [UserSettingsController::class, 'update'])->name('settings.preferences.update');

    // In-App Notifications Pro
    Route::get('/notifications', [AppNotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [AppNotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [AppNotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::post('/notifications/{id}/archive', [AppNotificationController::class, 'archive'])->name('notifications.archive');
    Route::delete('/notifications/{id}', [AppNotificationController::class, 'destroy'])->name('notifications.destroy');
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
        Route::put('/settings/mail', [AdminDashboardController::class, 'updateMailSettings'])->name('admin.settings.mail.update');
        Route::post('/settings/test-reminder', [AdminDashboardController::class, 'testReminder'])->name('admin.settings.test-reminder');
        Route::post('/settings/run-reminders', [AdminDashboardController::class, 'runReminders'])->name('admin.settings.run-reminders');
        Route::get('/users', [AdminDashboardController::class, 'users'])->name('admin.users');
        Route::post('/users/{id}/toggle-status', [AdminDashboardController::class, 'toggleUserStatus'])->name('admin.users.toggle');
        Route::post('/admins', [AdminDashboardController::class, 'createAdmin'])->name('admin.admins.store');
        Route::get('/reminders', [AdminDashboardController::class, 'reminders'])->name('admin.reminders');
        Route::get('/logs', [AdminDashboardController::class, 'logs'])->name('admin.logs');
        Route::delete('/logs/clear', [AdminDashboardController::class, 'clearLogs'])->name('admin.logs.clear');
    });
});
