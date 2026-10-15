<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteAttachment;
use App\Models\ReminderLog;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function dashboard()
    {
        $totalMembers = User::count();
        $activeMembers = User::where('is_active', true)->count();
        $totalApps = NoteApp::count();
        $totalNotes = Note::count();
        $totalTasks = Note::where('category', 'task')->count();

        $storageBytes = NoteAttachment::sum('file_size') ?: 0;
        $storageMb = round($storageBytes / (1024 * 1024), 2);

        $totalRemindersSent = ReminderLog::where('status', 'sent')->count();
        $pendingReminders = Note::where('category', 'task')
            ->whereNotNull('deadline_at')
            ->whereNotNull('reminder_days_before')
            ->whereNull('reminder_sent_at')
            ->count();

        $recentReminders = ReminderLog::with('note')
            ->orderBy('id', 'desc')
            ->limit(8)
            ->get();

        $recentMembers = User::orderBy('id', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'metrics' => [
                'total_members' => $totalMembers,
                'active_members' => $activeMembers,
                'total_apps' => $totalApps,
                'total_notes' => $totalNotes,
                'total_tasks' => $totalTasks,
                'storage_mb' => $storageMb,
                'total_reminders_sent' => $totalRemindersSent,
                'pending_reminders' => $pendingReminders,
            ],
            'recent_reminders' => $recentReminders,
            'recent_members' => $recentMembers,
        ]);
    }

    public function settings()
    {
        $settings = SystemSetting::getAll();

        return Inertia::render('Admin/Settings', [
            'settings' => $settings,
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'max_file_size_mb' => 'required|integer|min:1|max:100',
            'max_files_per_upload' => 'required|integer|min:1|max:20',
            'allowed_extensions' => 'required|string',
            'blocked_extensions' => 'required|string',
        ]);

        SystemSetting::set('max_file_size_mb', $validated['max_file_size_mb'], 'Ukuran maksimal per file (MB)');
        SystemSetting::set('max_files_per_upload', $validated['max_files_per_upload'], 'Jumlah maksimal file per upload');
        SystemSetting::set('allowed_extensions', strtolower(trim($validated['allowed_extensions'])), 'Ekstensi diizinkan');
        SystemSetting::set('blocked_extensions', strtolower(trim($validated['blocked_extensions'])), 'Ekstensi diblokir');

        return back()->with('success', 'Pengaturan batasan file berhasil diperbarui.');
    }

    public function users()
    {
        $members = User::withCount('noteApps')->orderBy('id', 'desc')->get();
        $admins = Admin::orderBy('id', 'desc')->get();

        return Inertia::render('Admin/Users', [
            'members' => $members,
            'admins' => $admins,
        ]);
    }

    public function toggleUserStatus($id)
    {
        $user = User::findOrFail($id);
        $user->is_active = ! $user->is_active;
        $user->save();

        $status = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Status akun {$user->name} berhasil {$status}.");
    }

    public function createAdmin(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|alpha_dash|unique:admins,username',
            'email' => 'required|email|unique:admins,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,superadmin',
        ]);

        Admin::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => true,
        ]);

        return back()->with('success', 'Admin baru berhasil didaftarkan.');
    }

    public function reminders()
    {
        $logs = ReminderLog::with(['note.group.app'])
            ->orderBy('id', 'desc')
            ->paginate(20);

        $upcomingTasks = Note::where('category', 'task')
            ->whereNotNull('deadline_at')
            ->whereNotNull('reminder_days_before')
            ->whereNull('reminder_sent_at')
            ->with(['group.app.owner'])
            ->orderBy('deadline_at', 'asc')
            ->limit(10)
            ->get();

        return Inertia::render('Admin/Reminders', [
            'logs' => $logs,
            'upcoming' => $upcomingTasks,
        ]);
    }
}
