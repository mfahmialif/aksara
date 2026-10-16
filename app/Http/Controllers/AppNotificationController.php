<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AppNotificationController extends Controller
{
    /**
     * Display a listing of member notifications.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $tab = $request->query('tab', 'unread'); // unread | archived

        $baseQuery = AppNotification::where('user_id', $user->id);

        $unreadCount = (clone $baseQuery)->whereNull('read_at')->where('is_archived', false)->count();
        $archivedCount = (clone $baseQuery)->where(function ($q) {
            $q->where('is_archived', true)->orWhereNotNull('read_at');
        })->count();

        if ($tab === 'archived') {
            $notifications = (clone $baseQuery)
                ->where(function ($q) {
                    $q->where('is_archived', true)->orWhereNotNull('read_at');
                })
                ->orderBy('created_at', 'desc')
                ->paginate(15)
                ->withQueryString();
        } else {
            $notifications = (clone $baseQuery)
                ->whereNull('read_at')
                ->where('is_archived', false)
                ->orderBy('created_at', 'desc')
                ->paginate(15)
                ->withQueryString();
        }

        return Inertia::render('App/Notifications', [
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
            'archived_count' => $archivedCount,
            'current_tab' => $tab,
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead($id)
    {
        $notification = AppNotification::where('user_id', Auth::id())->findOrFail($id);
        $notification->markAsRead();

        return back()->with('success', 'Notifikasi ditandai sudah dibaca.');
    }

    /**
     * Mark all unread notifications as read.
     */
    public function markAllAsRead()
    {
        AppNotification::where('user_id', Auth::id())
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back()->with('success', 'Semua notifikasi telah ditandai sudah dibaca.');
    }

    /**
     * Archive a specific notification.
     */
    public function archive($id)
    {
        $notification = AppNotification::where('user_id', Auth::id())->findOrFail($id);
        $notification->archive();

        return back()->with('success', 'Notifikasi berhasil diarsipkan.');
    }

    /**
     * Delete a notification permanently.
     */
    public function destroy($id)
    {
        $notification = AppNotification::where('user_id', Auth::id())->findOrFail($id);
        $notification->delete();

        return back()->with('success', 'Notifikasi berhasil dihapus.');
    }
}
