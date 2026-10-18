<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\AppNotification;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteAttachment;
use App\Models\ReminderLog;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UserNoteReminder;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
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
        $users = User::select('id', 'name', 'email')
            ->where('is_active', true)
            ->orderBy('name')
            ->limit(30)
            ->get();
        $notes = Note::select('id', 'title', 'category')
            ->orderBy('id', 'desc')
            ->limit(20)
            ->get();

        $totalSent = ReminderLog::where('status', 'sent')->count();
        $totalFailed = ReminderLog::where('status', 'failed')->count();
        $pendingTasks = Note::where('category', 'task')
            ->whereNotNull('deadline_at')
            ->whereNotNull('reminder_days_before')
            ->whereNull('reminder_sent_at')
            ->count();
        $pendingPersonal = UserNoteReminder::whereNull('reminder_sent_at')->count();
        $latestLog = ReminderLog::latest('sent_at')->first();

        return Inertia::render('Admin/Settings', [
            'settings' => $settings,
            'users' => $users,
            'notes' => $notes,
            'reminder_stats' => [
                'total_sent' => $totalSent,
                'total_failed' => $totalFailed,
                'pending_tasks' => $pendingTasks,
                'pending_personal' => $pendingPersonal,
                'mail_driver' => config('mail.default', 'log'),
                'mail_from' => config('mail.from.address', 'admin@aksara.barakode.id'),
                'last_run' => $latestLog ? $latestLog->created_at->translatedFormat('d M Y, H:i') : 'Belum ada data',
            ],
        ]);
    }

    public function testReminder(Request $request)
    {
        $validated = $request->validate([
            'recipient_email' => 'required|email',
            'title' => 'required|string|max:150',
            'note_id' => 'nullable|string',
        ]);

        $recipientEmail = $validated['recipient_email'];
        $title = $validated['title'];

        $note = null;
        if (! empty($validated['note_id'])) {
            $note = Note::find($validated['note_id']);
        }
        if (! $note) {
            $note = Note::where('category', 'task')->first() ?: Note::first();
        }

        if (! $note) {
            return back()->with('error', 'Belum ada catatan di database untuk dikaitkan dengan pengingat. Silakan buat minimal satu catatan terlebih dahulu.');
        }

        $now = now();
        $mailStatus = 'sent';
        $errorMessage = null;

        SystemSetting::applyMailConfig();

        // 1. Send test email using Laravel Mail
        try {
            Mail::raw(
                "Halo,\n\nIni adalah pengujian pengingat deadline dari Sistem Aksara Notes (Modul Pengaturan Admin).\n\n"
                ."Judul Tugas/Catatan: {$title}\n"
                .'Waktu Pengujian: '.$now->translatedFormat('d F Y, H:i:s')."\n"
                ."Penerima: {$recipientEmail}\n"
                .'Mail Driver: '.config('mail.default')."\n\n"
                ."Jika Anda menerima email ini, sistem engine pengingat dan mailer berjalan dengan normal.\n\n"
                ."---\nAksara Notes - Neobrutalism System",
                function ($message) use ($recipientEmail, $title) {
                    $message->to($recipientEmail)
                        ->subject("⏰ [TEST PENGINGAT] {$title}");
                }
            );
        } catch (\Throwable $e) {
            $mailStatus = 'failed';
            $errorMessage = $e->getMessage();
        }

        // 2. Create ReminderLog entry
        ReminderLog::create([
            'note_id' => $note->id,
            'recipient_email' => $recipientEmail,
            'status' => $mailStatus,
            'scheduled_for' => $now,
            'sent_at' => $mailStatus === 'sent' ? $now : null,
            'error_message' => $errorMessage,
        ]);

        // 3. Create In-App Notification if user exists
        $user = User::where('email', $recipientEmail)->first();
        if ($user) {
            AppNotification::create([
                'user_id' => $user->id,
                'title' => '⏰ [TEST] Pengingat Catatan: '.$title,
                'message' => 'Notifikasi uji coba pengingat dari Admin untuk catatan "'.$title.'". Sistem pengingat berfungsi dengan baik.',
                'type' => 'reminder',
                'action_url' => route('notes.show', $note->id),
                'read_at' => null,
                'is_archived' => false,
            ]);
        }

        ActivityLogger::log('TEST_REMINDER', "Menguji pengiriman notifikasi pengingat ke {$recipientEmail} (Status: {$mailStatus})", $note, [
            'status' => $mailStatus,
            'error' => $errorMessage,
        ]);

        if ($mailStatus === 'failed') {
            return back()->with('error', "Gagal mengirim pengingat ke {$recipientEmail}: {$errorMessage}");
        }

        return back()->with('success', "Test pengingat berhasil diproses ke {$recipientEmail}! Log pengingat dan notifikasi in-app telah dicatat.");
    }

    public function runReminders()
    {
        try {
            Artisan::call('notes:send-reminders');
            $output = Artisan::output();

            ActivityLogger::log('RUN_REMINDERS_ENGINE', 'Menjalankan engine pengecekan pengingat secara manual dari Pengaturan Admin');

            $cleanOutput = trim($output) ?: 'Pengecekan pengingat selesai tanpa catatan jatuh tempo.';

            return back()->with('success', "Engine pengingat berhasil dijalankan! Hasil: {$cleanOutput}");
        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal menjalankan engine pengingat: '.$e->getMessage());
        }
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

        ActivityLogger::log('UPDATE_SETTINGS', 'Memperbarui pengaturan batasan ukuran file dan ekstensi keamanan sistem', null, $validated);

        return back()->with('success', 'Pengaturan batasan file berhasil diperbarui.');
    }

    public function updateMailSettings(Request $request)
    {
        $validated = $request->validate([
            'mail_mailer' => 'required|in:smtp,log',
            'mail_host' => 'nullable|string|max:191',
            'mail_port' => 'nullable|integer|min:1|max:65535',
            'mail_encryption' => 'nullable|in:tls,ssl,none',
            'mail_username' => 'nullable|string|max:191',
            'mail_password' => 'nullable|string|max:191',
            'mail_from_address' => 'required|email|max:191',
            'mail_from_name' => 'required|string|max:100',
        ]);

        SystemSetting::set('mail_mailer', $validated['mail_mailer'], 'Default Mail Driver');
        SystemSetting::set('mail_host', $validated['mail_host'] ?? '', 'SMTP Host Server');
        SystemSetting::set('mail_port', (string) ($validated['mail_port'] ?? 587), 'SMTP Port');
        SystemSetting::set('mail_encryption', $validated['mail_encryption'] ?? 'tls', 'SMTP Encryption');
        SystemSetting::set('mail_username', $validated['mail_username'] ?? '', 'SMTP Username');
        if (isset($validated['mail_password']) && $validated['mail_password'] !== '') {
            SystemSetting::set('mail_password', $validated['mail_password'], 'SMTP Password / App Password');
        }
        SystemSetting::set('mail_from_address', $validated['mail_from_address'], 'Default Sender Email');
        SystemSetting::set('mail_from_name', $validated['mail_from_name'], 'Default Sender Name');

        SystemSetting::applyMailConfig();
        $this->syncMailToEnv($validated);

        ActivityLogger::log('UPDATE_MAIL_SETTINGS', 'Memperbarui konfigurasi SMTP & Mailer server', null, [
            'mail_mailer' => $validated['mail_mailer'],
            'mail_host' => $validated['mail_host'] ?? '',
            'mail_port' => $validated['mail_port'] ?? '',
            'mail_encryption' => $validated['mail_encryption'] ?? '',
            'mail_username' => $validated['mail_username'] ?? '',
            'mail_from_address' => $validated['mail_from_address'],
            'mail_from_name' => $validated['mail_from_name'],
        ]);

        return back()->with('success', 'Konfigurasi SMTP berhasil disimpan dan langsung diterapkan ke sistem mailer!');
    }

    private function syncMailToEnv(array $values): void
    {
        $envPath = base_path('.env');
        if (! file_exists($envPath) || ! is_writable($envPath)) {
            return;
        }

        try {
            $envContent = file_get_contents($envPath);

            $mapping = [
                'MAIL_MAILER' => $values['mail_mailer'] ?? 'smtp',
                'MAIL_HOST' => $values['mail_host'] ?? '',
                'MAIL_PORT' => $values['mail_port'] ?? '587',
                'MAIL_USERNAME' => $values['mail_username'] ?? '',
                'MAIL_ENCRYPTION' => ($values['mail_encryption'] ?? 'tls') === 'none' ? 'null' : ($values['mail_encryption'] ?? 'tls'),
                'MAIL_FROM_ADDRESS' => '"'.($values['mail_from_address'] ?? 'no-reply@aksara.local').'"',
                'MAIL_FROM_NAME' => '"'.($values['mail_from_name'] ?? 'Aksara Notes').'"',
            ];

            if (! empty($values['mail_password'])) {
                $mapping['MAIL_PASSWORD'] = '"'.$values['mail_password'].'"';
            }

            foreach ($mapping as $key => $val) {
                if (preg_match("/^{$key}=.*/m", $envContent)) {
                    $envContent = preg_replace("/^{$key}=.*/m", "{$key}={$val}", $envContent);
                } else {
                    $envContent .= "\n{$key}={$val}";
                }
            }

            file_put_contents($envPath, $envContent);
        } catch (\Throwable $e) {
            // Silently ignore if file permission issues arise
        }
    }

    public function users(Request $request)
    {
        $query = User::withCount('noteApps');

        // Search by name, email, or google_id
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('google_id', 'like', "%{$search}%");
            });
        }

        // Filter by status (all, active, inactive)
        if ($request->filled('status') && in_array($request->status, ['active', 'inactive'], true)) {
            $query->where('is_active', $request->status === 'active');
        }

        // Sorting
        $sort = $request->input('sort', 'latest');
        match ($sort) {
            'oldest' => $query->orderBy('created_at', 'asc'),
            'name_asc' => $query->orderBy('name', 'asc'),
            'name_desc' => $query->orderBy('name', 'desc'),
            'most_workspaces' => $query->orderBy('note_apps_count', 'desc')->orderBy('created_at', 'desc'),
            default => $query->orderBy('created_at', 'desc'),
        };

        $members = $query->paginate(15)->withQueryString();
        $admins = Admin::orderBy('id', 'desc')->get();

        $stats = [
            'total_members' => User::count(),
            'active_members' => User::where('is_active', true)->count(),
            'inactive_members' => User::where('is_active', false)->count(),
        ];

        return Inertia::render('Admin/Users', [
            'members' => $members,
            'admins' => $admins,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
                'sort' => $sort,
            ],
        ]);
    }

    public function getUserDetails($id)
    {
        $user = User::withCount(['noteApps', 'collaborations', 'savedSharedLinks'])
            ->with(['noteApps' => function ($q) {
                $q->withCount('groups')->orderBy('created_at', 'desc')->limit(10);
            }])
            ->findOrFail($id);

        $recentLogs = ActivityLog::where(function ($q) use ($user) {
            $q->where(function ($sub) use ($user) {
                $sub->where('causer_type', User::class)
                    ->where('causer_id', $user->id);
            })->orWhere(function ($sub) use ($user) {
                $sub->where('entity_type', User::class)
                    ->where('entity_id', $user->id);
            });
        })
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'user' => $user,
            'recent_logs' => $recentLogs,
        ]);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,'.$user->id,
            'is_active' => 'required|boolean',
            'default_reminder_days' => 'required|integer|min:0|max:30',
        ]);

        $user->update($validated);

        ActivityLogger::log('UPDATE_USER', "Memperbarui data profil pengguna {$user->name} ({$user->email}) oleh Administrator", $user, $validated);

        return back()->with('success', "Data pengguna {$user->name} berhasil diperbarui.");
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        $name = $user->name;
        $email = $user->email;

        // Clean up physical files of user's notes attachments
        $workspaceIds = NoteApp::where('owner_id', $user->id)->pluck('id');
        $noteIds = Note::whereHas('group', function ($q) use ($workspaceIds) {
            $q->whereIn('note_app_id', $workspaceIds);
        })->pluck('id');

        $attachments = NoteAttachment::whereIn('note_id', $noteIds)->get();
        foreach ($attachments as $attachment) {
            if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
                Storage::disk('public')->delete($attachment->file_path);
            }
        }

        $user->delete();

        ActivityLogger::log('DELETE_USER', "Menghapus akun pengguna {$name} ({$email}) beserta seluruh data ruang kerja oleh Administrator", null);

        return back()->with('success', "Pengguna {$name} dan seluruh data terkait berhasil dihapus.");
    }

    public function toggleUserStatus($id)
    {
        $user = User::findOrFail($id);
        $user->is_active = ! $user->is_active;
        $user->save();

        $status = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        ActivityLogger::log('TOGGLE_USER_STATUS', "Mengubah status akun pengguna {$user->name} ({$user->email}) menjadi {$status}", $user);

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

        $admin = Admin::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => true,
        ]);

        ActivityLogger::log('CREATE_ADMIN', "Mendaftarkan administrator baru: {$admin->username} ({$admin->name}) dengan hak akses {$admin->role}", $admin);

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

    /**
     * Display Activity Logs Pro for Admin Monitoring.
     */
    public function logs(Request $request)
    {
        $query = ActivityLog::query();

        // Filter by role
        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('causer_role', $request->role);
        }

        // Filter by action group
        if ($request->filled('action') && $request->action !== 'all') {
            $query->where('action', 'like', "%{$request->action}%");
        }

        // Search in description, causer_name, ip_address
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('causer_name', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(25)->withQueryString();

        $stats = [
            'total_logs' => ActivityLog::count(),
            'member_logs' => ActivityLog::where('causer_role', 'member')->count(),
            'admin_logs' => ActivityLog::where('causer_role', 'admin')->count(),
            'system_logs' => ActivityLog::where('causer_role', 'system')->count(),
        ];

        return Inertia::render('Admin/Logs', [
            'logs' => $logs,
            'stats' => $stats,
            'filters' => [
                'search' => $request->search ?? '',
                'role' => $request->role ?? 'all',
                'action' => $request->action ?? 'all',
            ],
        ]);
    }

    /**
     * Clear old activity logs.
     */
    public function clearLogs()
    {
        ActivityLog::truncate();

        ActivityLogger::log('CLEAR_LOGS', 'Membersihkan seluruh riwayat log aktivitas sistem.');

        return back()->with('success', 'Seluruh riwayat log aktivitas berhasil dibersihkan.');
    }
}
