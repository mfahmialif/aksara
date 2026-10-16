<?php

namespace App\Http\Middleware;

use App\Models\AppNotification;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user('web') ? [
                    'id' => $request->user('web')->id,
                    'name' => $request->user('web')->name,
                    'email' => $request->user('web')->email,
                    'avatar' => $request->user('web')->avatar,
                    'default_reminder_days' => $request->user('web')->default_reminder_days,
                ] : null,
                'admin' => $request->user('admin') ? [
                    'id' => $request->user('admin')->id,
                    'name' => $request->user('admin')->name,
                    'username' => $request->user('admin')->username,
                    'email' => $request->user('admin')->email,
                    'role' => $request->user('admin')->role,
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'notifications_summary' => $request->user('web') ? [
                'unread_count' => AppNotification::where('user_id', $request->user('web')->id)
                    ->whereNull('read_at')
                    ->where('is_archived', false)
                    ->count(),
                'recent' => AppNotification::where('user_id', $request->user('web')->id)
                    ->where('is_archived', false)
                    ->orderBy('created_at', 'desc')
                    ->limit(6)
                    ->get(),
            ] : null,
            'system_settings' => SystemSetting::getAll(),
        ];
    }
}
