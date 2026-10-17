<?php

namespace App\Http\Controllers;

use App\Mail\WorkspaceTransferInvitationMail;
use App\Models\AppNotification;
use App\Models\Collaborator;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\SavedSharedLink;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class NoteAppController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $type = $request->query('type', 'all');
        if (! in_array($type, ['all', 'my_apps', 'shared', 'saved'], true)) {
            $type = 'all';
        }
        $search = trim((string) $request->query('search', ''));

        // Precalculate counts for tab badges
        $myAppsCount = NoteApp::where('owner_id', $user->id)->count();
        $sharedAppsCount = NoteApp::where('owner_id', '!=', $user->id)
            ->whereHas('collaborators', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('invited_email', $user->email);
            })->count();
        $savedLinksCount = SavedSharedLink::where('user_id', $user->id)->count();
        $totalCount = $myAppsCount + $sharedAppsCount + $savedLinksCount;

        // Build workspace query based on type filter
        $query = NoteApp::query();

        if ($type === 'my_apps') {
            $query->where('owner_id', $user->id);
        } elseif ($type === 'shared') {
            $query->where('owner_id', '!=', $user->id)
                ->whereHas('collaborators', function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                        ->orWhere('invited_email', $user->email);
                });
        } elseif ($type === 'saved') {
            $query->whereHas('savedByUsers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } else {
            // 'all': owned apps OR collaborator apps OR saved apps
            $query->where(function ($q) use ($user) {
                $q->where('owner_id', $user->id)
                    ->orWhereHas('collaborators', function ($sub) use ($user) {
                        $sub->where('user_id', $user->id)
                            ->orWhere('invited_email', $user->email);
                    })
                    ->orWhereHas('savedByUsers', function ($sub) use ($user) {
                        $sub->where('user_id', $user->id);
                    });
            });
        }

        // Apply search query by name or description
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $apps = $query->with(['owner', 'groups.notes'])
            ->withCount(['groups'])
            ->withExists(['savedByUsers as is_saved' => function ($q) use ($user) {
                $q->where('user_id', $user->id);
            }])
            ->orderBy('id', 'desc')
            ->paginate(9)
            ->withQueryString();

        // Standalone shared notes (collaborator on note level ONLY)
        $standaloneSharedNotes = collect();
        if ($type === 'all' || $type === 'shared') {
            $standaloneSharedNotes = Note::whereHas('collaborators', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('invited_email', $user->email);
            })
                ->whereDoesntHave('group.app.collaborators', function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->orWhere('invited_email', $user->email);
                })
                ->whereHas('group.app', function ($query) use ($user) {
                    $query->where('owner_id', '!=', $user->id);
                })
                ->with(['group.app.owner', 'attachments'])
                ->get();
        }

        // Saved other links (groups and notes saved by public share link)
        $savedOtherLinks = collect();
        if ($type === 'all' || $type === 'saved') {
            $savedOtherQuery = SavedSharedLink::where('user_id', $user->id)
                ->whereIn('item_type', ['group', 'note'])
                ->with(['noteApp.owner']);

            if ($search !== '') {
                $savedOtherQuery->where('title', 'like', "%{$search}%");
            }
            $savedOtherLinks = $savedOtherQuery->get();
        }

        return Inertia::render('Member/Workspace', [
            'apps' => $apps,
            'standalone_notes' => $standaloneSharedNotes,
            'saved_other_links' => $savedOtherLinks,
            'filters' => [
                'type' => $type,
                'search' => $search,
                'page' => (int) $request->query('page', 1),
            ],
            'counts' => [
                'all' => $totalCount,
                'my_apps' => $myAppsCount,
                'shared' => $sharedAppsCount,
                'saved' => $savedLinksCount,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'color_theme' => 'required|in:yellow,purple,mint,coral,sky,pink,orange',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:300',
            'is_public' => 'boolean',
            'topic_label' => 'nullable|string|max:50',
        ]);

        $app = NoteApp::create([
            'owner_id' => Auth::id(),
            'name' => $validated['name'],
            'color_theme' => $validated['color_theme'],
            'icon' => $validated['icon'] ?? 'Notebook',
            'description' => $validated['description'] ?? null,
            'is_public' => $validated['is_public'] ?? false,
            'public_token' => 'app-'.Str::random(24),
            'topic_label' => ! empty($validated['topic_label']) ? trim($validated['topic_label']) : 'Topik',
        ]);

        // Create default group
        NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Catatan Utama',
            'color' => '#FFDC58',
            'sort_order' => 1,
        ]);

        ActivityLogger::log('CREATE_WORKSPACE', "Membuat ruang kerja baru '{$app->name}'", $app);

        return redirect()->route('apps.show', $app->id)->with('success', 'Aplikasi Catatan "'.$app->name.'" berhasil dibuat!');
    }

    public function show($id, Request $request)
    {
        $user = Auth::user();
        $app = NoteApp::with(['owner', 'collaborators.user'])->find($id);

        if (! $app) {
            return redirect()->route('apps.index')->with('error', 'Aplikasi Catatan atau Ruang Kerja tidak ditemukan.');
        }

        if (! $app->canUserView($user)) {
            abort(403, 'Anda tidak memiliki hak akses ke Aplikasi Catatan ini.');
        }

        $groups = NoteGroup::where('note_app_id', $app->id)
            ->with(['notes' => function ($q) {
                $q->with(['attachments'])
                    ->orderByDesc('is_pinned')
                    ->orderBy('sort_order', 'asc')
                    ->orderByDesc('created_at');
            }])
            ->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        // Selected note
        $selectedNoteId = $request->query('note_id');
        $selectedNote = null;

        if ($selectedNoteId) {
            $selectedNote = Note::with(['attachments', 'collaborators.user', 'group'])->find($selectedNoteId);
        }

        if (! $selectedNote) {
            // Find first available note in first group with notes
            foreach ($groups as $grp) {
                if ($grp->notes->isNotEmpty()) {
                    $selectedNote = Note::with(['attachments', 'collaborators.user', 'group'])->find($grp->notes->first()->id);
                    break;
                }
            }
        }

        $isOwner = $app->owner_id === $user->id;
        $canEdit = $app->canUserEdit($user);
        $isSaved = SavedSharedLink::where('user_id', $user->id)
            ->where('item_type', 'app')
            ->where('item_id', $app->id)
            ->exists();

        return Inertia::render('Member/NoteEditor', [
            'app' => $app,
            'groups' => $groups,
            'selected_note' => $selectedNote,
            'is_owner' => $isOwner,
            'can_edit' => $canEdit,
            'is_saved' => $isSaved,
        ]);
    }

    public function update($id, Request $request)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($id);

        if (! $app->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin mengedit Aplikasi ini.');
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'color_theme' => 'sometimes|required|in:yellow,purple,mint,coral,sky,pink,orange',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:300',
            'is_public' => 'sometimes|boolean',
            'public_token' => 'sometimes|nullable|string|max:64',
            'topic_label' => 'sometimes|nullable|string|max:50',
        ]);

        if (array_key_exists('is_public', $validated) && $validated['is_public'] && empty($app->public_token)) {
            $validated['public_token'] = 'app-'.Str::lower(Str::random(12));
        }

        if (array_key_exists('topic_label', $validated)) {
            $validated['topic_label'] = ! empty($validated['topic_label']) ? trim($validated['topic_label']) : 'Topik';
        }

        $app->update($validated);

        ActivityLogger::log('UPDATE_WORKSPACE', "Memperbarui ruang kerja '{$app->name}'", $app);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'app' => $app->fresh(),
                'message' => "Pengaturan ruang kerja '{$app->name}' berhasil diperbarui.",
            ]);
        }

        return back()->with('success', 'Pengaturan aplikasi catatan berhasil diperbarui.');
    }

    /**
     * Dedicated endpoint for public sharing and custom shortlink management for NoteApp.
     */
    public function updateSharing($id, Request $request)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($id);

        if (! $user || $app->owner_id !== $user->id) {
            abort(403, 'Hanya pemilik yang dapat mengubah pengaturan sharing aplikasi ini.');
        }

        $validated = $request->validate([
            'is_public' => 'required|boolean',
            'public_permission' => 'nullable|in:read,edit',
            'custom_slug' => [
                'nullable',
                'string',
                'min:3',
                'max:60',
                'regex:/^[a-zA-Z0-9_-]+$/',
            ],
        ], [
            'custom_slug.min' => 'Shortlink minimal 3 karakter.',
            'custom_slug.max' => 'Shortlink maksimal 60 karakter.',
            'custom_slug.regex' => 'Shortlink hanya boleh memuat huruf, angka, tanda strip (-) dan garis bawah (_).',
        ]);

        $isPublic = (bool) $validated['is_public'];
        $customSlug = isset($validated['custom_slug']) && trim($validated['custom_slug']) !== ''
            ? trim($validated['custom_slug'])
            : null;

        if ($customSlug) {
            $reserved = ['app', 'note', 'admin', 'api', 'login', 'logout', 'dashboard', 's', 'settings', 'notifications'];
            if (in_array(strtolower($customSlug), $reserved, true)) {
                throw ValidationException::withMessages([
                    'custom_slug' => "Shortlink '{$customSlug}' tidak dapat digunakan karena merupakan kata kunci sistem.",
                ]);
            }

            // Check uniqueness in note_apps (excluding current app)
            $existsInApps = NoteApp::where('public_token', $customSlug)
                ->where('id', '!=', $app->id)
                ->exists();

            // Check uniqueness in note_groups
            $existsInGroups = NoteGroup::where('public_token', $customSlug)->exists();

            // Check uniqueness in notes
            $existsInNotes = Note::where('public_token', $customSlug)->exists();

            if ($existsInApps || $existsInGroups || $existsInNotes) {
                throw ValidationException::withMessages([
                    'custom_slug' => "Shortlink '{$customSlug}' sudah digunakan. Silakan gunakan shortlink lain.",
                ]);
            }

            $app->public_token = $customSlug;
        } elseif ($isPublic && empty($app->public_token)) {
            $app->public_token = 'app-'.Str::lower(Str::random(12));
        }

        $app->is_public = $isPublic;
        if ($isPublic) {
            $app->public_permission = $request->input('public_permission', $app->public_permission ?: 'read');
        }
        $app->save();

        ActivityLogger::log('UPDATE_WORKSPACE_SHARING', "Memperbarui status sharing publik ruang kerja '{$app->name}' (Publik: ".($isPublic ? 'Ya' : 'Tidak').", Akses: {$app->public_permission}, Shortlink: {$app->public_token})", $app);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'is_public' => $app->is_public,
                'public_permission' => $app->public_permission,
                'public_token' => $app->public_token,
                'share_url' => url('/s/'.$app->public_token),
                'message' => $isPublic
                    ? ($app->public_permission === 'edit'
                        ? 'Ruang kerja dipublikasikan dengan Akses Penuh (Dapat Diedit)!'
                        : 'Ruang kerja dipublikasikan dalam mode Hanya Baca (Read-Only)!')
                    : 'Ruang kerja kini berstatus privat.',
            ]);
        }

        return back()->with('success', $isPublic ? 'Ruang kerja berhasil dipublikasikan!' : 'Ruang kerja kini berstatus privat.');
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($id);

        if ($app->owner_id !== $user->id) {
            abort(403, 'Hanya pemilik yang dapat menghapus Aplikasi Catatan ini.');
        }

        $name = $app->name;
        $app->delete();

        ActivityLogger::log('DELETE_WORKSPACE', "Menghapus ruang kerja '{$name}'");

        return redirect()->route('apps.index')->with('success', 'Aplikasi "'.$name.'" telah dihapus.');
    }

    public function addCollaborator($id, Request $request)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($id);

        if ($app->owner_id !== $user->id) {
            abort(403, 'Hanya pemilik yang dapat mengundang kolaborator.');
        }

        $validated = $request->validate([
            'email' => 'required|email',
            'permission' => 'nullable|in:edit',
        ]);

        if (strtolower($validated['email']) === strtolower($user->email)) {
            return back()->with('error', 'Anda tidak dapat mengundang diri sendiri.');
        }

        $invitedUser = User::where('email', $validated['email'])->first();

        Collaborator::updateOrCreate(
            [
                'collaboratable_type' => NoteApp::class,
                'collaboratable_id' => $app->id,
                'invited_email' => strtolower($validated['email']),
            ],
            [
                'user_id' => $invitedUser?->id,
                'permission' => 'edit',
            ]
        );

        if ($invitedUser) {
            AppNotification::create([
                'user_id' => $invitedUser->id,
                'title' => '👥 Undangan Kolaborasi Ruang Kerja',
                'message' => $user->name.' mengundang Anda bergabung sebagai kolaborator di Ruang Kerja "'.$app->name.'".',
                'type' => 'collaboration',
                'action_url' => route('apps.show', $app->id),
                'read_at' => null,
                'is_archived' => false,
            ]);
        }

        ActivityLogger::log('INVITE_COLLABORATOR', "Mengundang {$validated['email']} ke ruang kerja '{$app->name}'", $app);

        return back()->with('success', 'Kolaborator '.$validated['email'].' berhasil ditambahkan!');
    }

    public function removeCollaborator($id, $collabId)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($id);

        if ($app->owner_id !== $user->id) {
            abort(403, 'Hanya pemilik yang dapat menghapus kolaborator.');
        }

        $collab = Collaborator::where('collaboratable_type', NoteApp::class)
            ->where('collaboratable_id', $app->id)
            ->where('id', $collabId)
            ->firstOrFail();

        $email = $collab->invited_email;
        $collab->delete();

        ActivityLogger::log('REMOVE_COLLABORATOR', "Menghapus akses kolaborator {$email} dari ruang kerja '{$app->name}'", $app);

        return back()->with('success', 'Kolaborator telah dihapus.');
    }

    /**
     * Send transfer ownership confirmation email to candidate owner.
     */
    public function initiateTransferOwnership($id, Request $request)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($id);

        if ($app->owner_id !== $user->id) {
            abort(403, 'Hanya pemilik sah yang dapat memindahkan kepemilikan ruang kerja ini.');
        }

        $validated = $request->validate([
            'email' => 'required|email|max:191',
        ]);

        $targetEmail = strtolower(trim($validated['email']));

        if ($targetEmail === strtolower($user->email)) {
            throw ValidationException::withMessages([
                'email' => 'Anda tidak dapat memindahkan kepemilikan ke alamat email Anda sendiri.',
            ]);
        }

        $token = Str::random(40);
        $transferData = [
            'app_id' => $app->id,
            'app_name' => $app->name,
            'old_owner_id' => $user->id,
            'old_owner_name' => $user->name,
            'old_owner_email' => $user->email,
            'target_email' => $targetEmail,
            'token' => $token,
            'created_at' => now()->toIso8601String(),
        ];

        // Store in cache for 3 days
        Cache::put("workspace_transfer:{$app->id}", $transferData, now()->addDays(3));
        Cache::put("workspace_transfer_token:{$token}", $app->id, now()->addDays(3));

        $acceptUrl = URL::temporarySignedRoute(
            'apps.transfer.show',
            now()->addDays(3),
            ['app' => $app->id, 'token' => $token]
        );

        // Send email with error suppression to prevent crashes if mail is not configured
        $mailSent = false;
        try {
            SystemSetting::applyMailConfig();
            Mail::to($targetEmail)->send(new WorkspaceTransferInvitationMail($app, $user, $acceptUrl, $targetEmail));
            $mailSent = true;
        } catch (\Throwable $e) {
            Log::warning("Gagal mengirim email transfer workspace: {$e->getMessage()}");
        }

        // If target user already has an account, send in-app notification
        $targetUser = User::where('email', $targetEmail)->first();
        if ($targetUser) {
            AppNotification::create([
                'user_id' => $targetUser->id,
                'title' => '📬 Permintaan Pindah Kepemilikan Ruang Kerja',
                'message' => "{$user->name} ({$user->email}) ingin memindahkan kepemilikan ruang kerja '{$app->name}' kepada Anda.",
                'type' => 'workspace_transfer',
                'action_url' => $acceptUrl,
                'read_at' => null,
                'is_archived' => false,
            ]);
        }

        ActivityLogger::log('INITIATE_WORKSPACE_TRANSFER', "Mengirim permintaan pemindahan kepemilikan ruang kerja '{$app->name}' ke {$targetEmail}", $app);

        $msg = "Email konfirmasi pemindahan kepemilikan berhasil dikirimkan ke {$targetEmail}.";

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => $msg,
                'mail_sent' => $mailSent,
                'pending_transfer' => [
                    'target_email' => $targetEmail,
                    'created_at' => $transferData['created_at'],
                ],
            ]);
        }

        return back()->with('success', $msg);
    }

    /**
     * Cancel an ongoing pending transfer ownership request.
     */
    public function cancelTransferOwnership($id, Request $request)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($id);

        if ($app->owner_id !== $user->id) {
            abort(403, 'Hanya pemilik yang dapat membatalkan pemindahan kepemilikan.');
        }

        $transfer = Cache::get("workspace_transfer:{$app->id}");
        if ($transfer) {
            Cache::forget("workspace_transfer_token:{$transfer['token']}");
            Cache::forget("workspace_transfer:{$app->id}");
        }

        ActivityLogger::log('CANCEL_WORKSPACE_TRANSFER', "Membatalkan permintaan pemindahan kepemilikan ruang kerja '{$app->name}'", $app);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Permintaan pemindahan kepemilikan telah dibatalkan.',
            ]);
        }

        return back()->with('success', 'Permintaan pemindahan kepemilikan telah dibatalkan.');
    }

    /**
     * Check if workspace has pending transfer.
     */
    public function getPendingTransfer($id)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($id);

        if ($app->owner_id !== $user->id) {
            return response()->json(['pending' => false]);
        }

        $transfer = Cache::get("workspace_transfer:{$app->id}");

        return response()->json([
            'pending' => (bool) $transfer,
            'transfer' => $transfer ? [
                'target_email' => $transfer['target_email'],
                'created_at' => $transfer['created_at'],
            ] : null,
        ]);
    }

    /**
     * Show the transfer acceptance confirmation screen.
     */
    public function showTransferAccept($id, Request $request)
    {
        $app = NoteApp::with(['owner'])->findOrFail($id);
        $transfer = Cache::get("workspace_transfer:{$app->id}");
        $token = (string) $request->query('token', '');

        if (! $transfer || empty($token) || ! hash_equals((string) $transfer['token'], $token)) {
            return redirect()->route('welcome')->with('error', 'Tautan pemindahan kepemilikan tidak valid atau telah kedaluwarsa.');
        }

        // Check authentication: if not logged in, redirect to login with intended URL
        if (! Auth::guard('web')->check()) {
            session()->put('url.intended', $request->fullUrl());

            return redirect()->route('login')->with('info', 'Silakan masuk ke akun Anda terlebih dahulu untuk menyetujui pemindahan kepemilikan ruang kerja.');
        }

        $currentUser = Auth::guard('web')->user();

        // If the user is already the owner
        if ($currentUser->id === $app->owner_id) {
            return redirect()->route('apps.show', $app->id)->with('info', 'Anda sudah menjadi pemilik ruang kerja ini.');
        }

        $isEmailMatch = strtolower($currentUser->email) === strtolower($transfer['target_email']);

        $groupsCount = $app->groups()->count();
        $notesCount = Note::whereIn('group_id', $app->groups()->pluck('id'))->count();

        return Inertia::render('Member/Workspace/TransferAccept', [
            'app' => [
                'id' => $app->id,
                'name' => $app->name,
                'color_theme' => $app->color_theme,
                'description' => $app->description,
                'topic_label' => $app->topic_label,
                'groups_count' => $groupsCount,
                'notes_count' => $notesCount,
                'owner' => [
                    'name' => $app->owner?->name ?? 'Pemilik Sebelumnya',
                    'email' => $app->owner?->email ?? '',
                    'avatar' => $app->owner?->avatar ?? null,
                ],
            ],
            'transfer' => [
                'target_email' => $transfer['target_email'],
                'sender_name' => $transfer['old_owner_name'],
                'sender_email' => $transfer['old_owner_email'],
                'created_at' => $transfer['created_at'],
                'token' => $token,
            ],
            'current_user' => [
                'name' => $currentUser->name,
                'email' => $currentUser->email,
            ],
            'is_email_match' => $isEmailMatch,
        ]);
    }

    /**
     * Accept ownership transfer and crown new owner.
     */
    public function acceptTransfer($id, Request $request)
    {
        $currentUser = Auth::guard('web')->user();
        if (! $currentUser) {
            return redirect()->route('login');
        }

        $app = NoteApp::findOrFail($id);
        $transfer = Cache::get("workspace_transfer:{$app->id}");
        $token = (string) $request->input('token', '');

        if (! $transfer || empty($token) || ! hash_equals((string) $transfer['token'], $token)) {
            return redirect()->route('apps.index')->with('error', 'Permintaan pemindahan kepemilikan tidak valid atau telah kedaluwarsa.');
        }

        $oldOwnerId = $app->owner_id;
        $oldOwner = User::find($oldOwnerId);

        // 1. Transfer ownership to new user
        $app->owner_id = $currentUser->id;
        $app->save();

        // 2. Demote previous owner to collaborator (editor) so they retain access
        if ($oldOwner && $oldOwner->id !== $currentUser->id) {
            Collaborator::updateOrCreate(
                [
                    'collaboratable_type' => NoteApp::class,
                    'collaboratable_id' => $app->id,
                    'user_id' => $oldOwner->id,
                ],
                [
                    'invited_email' => strtolower($oldOwner->email),
                    'permission' => 'edit',
                ]
            );
        }

        // 3. Remove new owner from collaborators list if they were previously a collaborator
        Collaborator::where('collaboratable_type', NoteApp::class)
            ->where('collaboratable_id', $app->id)
            ->where(function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)
                    ->orWhere('invited_email', strtolower($currentUser->email));
            })
            ->delete();

        // 4. Clear transfer cache
        Cache::forget("workspace_transfer:{$app->id}");
        Cache::forget("workspace_transfer_token:{$token}");

        // 5. In-app notifications
        if ($oldOwner) {
            AppNotification::create([
                'user_id' => $oldOwner->id,
                'title' => '🔄 Pemindahan Kepemilikan Selesai',
                'message' => "Kepemilikan ruang kerja '{$app->name}' telah resmi dialihkan kepada {$currentUser->name} ({$currentUser->email}). Anda kini terdaftar sebagai kolaborator editor.",
                'type' => 'workspace_transfer',
                'action_url' => route('apps.show', $app->id),
                'read_at' => null,
                'is_archived' => false,
            ]);
        }

        AppNotification::create([
            'user_id' => $currentUser->id,
            'title' => '🎉 Selamat Datang, Pemilik Baru!',
            'message' => "Selamat! Anda sekarang adalah pemilik resmi ruang kerja '{$app->name}'.",
            'type' => 'workspace_transfer',
            'action_url' => route('apps.show', $app->id),
            'read_at' => null,
            'is_archived' => false,
        ]);

        ActivityLogger::log('TRANSFER_OWNERSHIP_COMPLETED', "Kepemilikan ruang kerja '{$app->name}' berhasil dialihkan kepada {$currentUser->name} ({$currentUser->email})", $app);

        return redirect()->route('apps.show', $app->id)->with('success', "🎉 Selamat! Anda telah resmi menjadi pemilik ruang kerja '{$app->name}'.");
    }

    /**
     * Reject ownership transfer.
     */
    public function rejectTransfer($id, Request $request)
    {
        $currentUser = Auth::guard('web')->user();
        $app = NoteApp::findOrFail($id);
        $transfer = Cache::get("workspace_transfer:{$app->id}");
        $token = (string) $request->input('token', '');

        if ($transfer && ! empty($token) && hash_equals((string) $transfer['token'], $token)) {
            Cache::forget("workspace_transfer_token:{$token}");
            Cache::forget("workspace_transfer:{$app->id}");

            if ($oldOwner = User::find($app->owner_id)) {
                AppNotification::create([
                    'user_id' => $oldOwner->id,
                    'title' => '❌ Pemindahan Kepemilikan Ditolak',
                    'message' => ($currentUser?->name ?? 'Calon penerima')." menolak permintaan pemindahan kepemilikan ruang kerja '{$app->name}'.",
                    'type' => 'workspace_transfer',
                    'action_url' => route('apps.show', $app->id),
                    'read_at' => null,
                    'is_archived' => false,
                ]);
            }

            ActivityLogger::log('REJECT_WORKSPACE_TRANSFER', "Menolak pemindahan kepemilikan ruang kerja '{$app->name}'", $app);
        }

        return redirect()->route('apps.index')->with('info', "Anda telah menolak pemindahan kepemilikan ruang kerja '{$app->name}'.");
    }
}
