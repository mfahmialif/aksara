<?php

namespace App\Http\Controllers;

use App\Mail\WorkspaceTransferInvitationMail;
use App\Models\AppNotification;
use App\Models\Collaborator;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteAttachment;
use App\Models\NoteGroup;
use App\Models\SavedSharedLink;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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
        $sharedGroupsCount = NoteGroup::whereHas('collaborators', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->orWhere('invited_email', $user->email);
        })
            ->whereDoesntHave('app.collaborators', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('invited_email', $user->email);
            })
            ->whereHas('app', function ($query) use ($user) {
                $query->where('owner_id', '!=', $user->id);
            })->count();
        $sharedNotesCount = Note::whereHas('collaborators', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->orWhere('invited_email', $user->email);
        })
            ->whereDoesntHave('group.collaborators', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('invited_email', $user->email);
            })
            ->whereDoesntHave('group.app.collaborators', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('invited_email', $user->email);
            })
            ->whereHas('group.app', function ($query) use ($user) {
                $query->where('owner_id', '!=', $user->id);
            })->count();
        $totalSharedCount = $sharedAppsCount + $sharedGroupsCount + $sharedNotesCount;
        $savedLinksCount = SavedSharedLink::where('user_id', $user->id)->count();
        $totalCount = $myAppsCount + $totalSharedCount + $savedLinksCount;

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

        $apps = $query->with(['owner', 'groups.notes', 'clonedFrom:id,name,owner_id'])
            ->withCount(['groups', 'clones as active_clones_count'])
            ->withExists(['savedByUsers as is_saved' => function ($q) use ($user) {
                $q->where('user_id', $user->id);
            }])
            ->orderBy('id', 'desc')
            ->paginate(9)
            ->withQueryString();

        // Standalone shared folders/groups (collaborator on folder level ONLY)
        $standaloneSharedGroups = collect();
        if ($type === 'all' || $type === 'shared') {
            $standaloneSharedGroups = NoteGroup::whereHas('collaborators', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('invited_email', $user->email);
            })
                ->whereDoesntHave('app.collaborators', function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->orWhere('invited_email', $user->email);
                })
                ->whereHas('app', function ($query) use ($user) {
                    $query->where('owner_id', '!=', $user->id);
                })
                ->with(['app.owner', 'notes'])
                ->withCount(['notes'])
                ->get();
        }

        // Standalone shared notes (collaborator on note level ONLY)
        $standaloneSharedNotes = collect();
        if ($type === 'all' || $type === 'shared') {
            $standaloneSharedNotes = Note::whereHas('collaborators', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('invited_email', $user->email);
            })
                ->whereDoesntHave('group.collaborators', function ($query) use ($user) {
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
            'standalone_groups' => $standaloneSharedGroups,
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
                'shared' => $totalSharedCount,
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
        $isCollaborator = $app->isCollaborator($user);
        $canEdit = $app->canUserEdit($user);
        $isSaved = SavedSharedLink::where('user_id', $user->id)
            ->where('item_type', 'app')
            ->where('item_id', $app->id)
            ->exists();

        $app->loadCount(['clones as active_clones_count']);
        $app->load(['clonedFrom:id,name,owner_id']);

        return Inertia::render('Member/NoteEditor', [
            'app' => $app,
            'groups' => $groups,
            'selected_note' => $selectedNote,
            'is_owner' => $isOwner,
            'is_collaborator' => $isCollaborator,
            'can_edit' => $canEdit,
            'is_saved' => $isSaved,
        ]);
    }

    public function update($id, Request $request)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($id);

        if (! $user || ! $app->isOwnerOrCollaborator($user)) {
            abort(403, 'Pengaturan ruang kerja hanya dapat diakses oleh pemilik atau kolaborator.');
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
        $app->collaborators()->delete();
        $app->delete();

        ActivityLogger::log('DELETE_WORKSPACE', "Menghapus ruang kerja '{$name}'");

        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Ruang kerja "'.$name.'" telah dihapus.',
                'redirect' => route('apps.index'),
            ]);
        }

        return redirect()->to(route('apps.index'), 303)->with('success', 'Ruang kerja "'.$name.'" telah dihapus.');
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

    public function getCollaborators($type, $id)
    {
        $user = Auth::user();
        if (! in_array($type, ['app', 'group', 'note'], true)) {
            abort(400, 'Tipe kolaborator tidak valid.');
        }

        if ($type === 'app') {
            $item = NoteApp::with('collaborators.user')->findOrFail($id);
            if (! $item->canUserView($user)) {
                abort(403);
            }
            $collabs = $item->getActiveCollaboratorsWithOrigin();
        } elseif ($type === 'group') {
            $item = NoteGroup::with(['collaborators.user', 'app.collaborators.user'])->findOrFail($id);
            if (! $item->canUserView($user)) {
                abort(403);
            }
            $collabs = $item->getActiveCollaboratorsWithOrigin();
        } else {
            $item = Note::with(['collaborators.user', 'group.collaborators.user', 'group.app.collaborators.user'])->findOrFail($id);
            if (! $item->canUserView($user)) {
                abort(403);
            }
            $collabs = $item->getActiveCollaboratorsWithOrigin();
        }

        return response()->json([
            'success' => true,
            'collaborators' => $collabs,
        ]);
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
        $notesCount = Note::whereIn('note_group_id', $app->groups()->pluck('id'))->count();

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

    /**
     * Duplicate a workspace and all its topics, notes, checklist, and attachments.
     */
    public function duplicate(Request $request, $id)
    {
        $user = Auth::user();
        if (! $user) {
            abort(401);
        }

        $sourceApp = NoteApp::with(['groups.notes.attachments'])->findOrFail($id);

        $isOwner = $sourceApp->owner_id === $user->id;
        $isCollaborator = $sourceApp->isCollaborator($user);
        $isSaved = SavedSharedLink::where('user_id', $user->id)->where('item_type', 'app')->where('item_id', $sourceApp->id)->exists();
        if (! $isOwner && ! $isCollaborator && ! $isSaved && ! $sourceApp->is_public) {
            abort(403, 'Anda tidak memiliki izin untuk menduplikat ruang kerja ini.');
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:100',
        ]);

        $newName = ! empty($validated['name']) ? trim($validated['name']) : ($sourceApp->name.' - Duplikat');

        $newApp = DB::transaction(function () use ($sourceApp, $user, $newName) {
            $sourceApp->increment('clone_count');

            $app = NoteApp::create([
                'owner_id' => $user->id,
                'cloned_from_id' => $sourceApp->id,
                'name' => $newName,
                'icon' => $sourceApp->icon,
                'color_theme' => $sourceApp->color_theme,
                'description' => $sourceApp->description,
                'topic_label' => $sourceApp->topic_label,
                'is_public' => false,
            ]);

            foreach ($sourceApp->groups as $group) {
                $newGroup = NoteGroup::create([
                    'note_app_id' => $app->id,
                    'cloned_from_id' => $group->id,
                    'name' => $group->name,
                    'color' => $group->color,
                    'sort_order' => $group->sort_order,
                    'is_public' => false,
                ]);

                foreach ($group->notes as $note) {
                    $newNote = Note::create([
                        'note_group_id' => $newGroup->id,
                        'cloned_from_id' => $note->id,
                        'title' => $note->title,
                        'category' => $note->category,
                        'content_json' => $note->content_json,
                        'drawing_data' => $note->drawing_data,
                        'deadline_at' => $note->deadline_at,
                        'reminder_days_before' => $note->reminder_days_before,
                        'is_pinned' => $note->is_pinned,
                        'sort_order' => $note->sort_order,
                        'is_public' => false,
                    ]);

                    foreach ($note->attachments as $attachment) {
                        NoteAttachment::create([
                            'note_id' => $newNote->id,
                            'file_name' => $attachment->file_name,
                            'file_path' => $attachment->file_path,
                            'mime_type' => $attachment->mime_type,
                            'file_size' => $attachment->file_size,
                        ]);
                    }
                }
            }

            return $app;
        });

        ActivityLogger::log('DUPLICATE_WORKSPACE', "Menduplikasi ruang kerja '{$sourceApp->name}' menjadi '{$newApp->name}'", $newApp);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Ruang kerja '{$newApp->name}' berhasil diduplikat!",
                'app' => $newApp,
                'redirect' => route('apps.show', $newApp->id),
            ]);
        }

        return redirect()->route('apps.show', $newApp->id)->with('success', "Ruang kerja '{$newApp->name}' berhasil diduplikat!");
    }

    /**
     * Get active clones list for the master workspace owner.
     */
    public function getClones(Request $request, $id)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($id);

        if ($app->owner_id !== $user->id) {
            abort(403, 'Hanya pemilik yang dapat melihat daftar duplikat.');
        }

        $activeClones = NoteApp::where('cloned_from_id', $app->id)
            ->with(['owner:id,name,email,avatar'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($clone) => [
                'id' => $clone->id,
                'name' => $clone->name,
                'created_at' => $clone->created_at->translatedFormat('d M Y, H:i'),
                'owner' => [
                    'id' => $clone->owner->id,
                    'name' => $clone->owner->name,
                    'email' => $clone->owner->email,
                    'avatar' => $clone->owner->avatar,
                ],
            ]);

        return response()->json([
            'success' => true,
            'total_clones' => (int) $app->clone_count,
            'active_count' => $activeClones->count(),
            'clones' => $activeClones,
        ]);
    }

    /**
     * Get synchronization candidate targets strictly scoped to the current user.
     */
    public function getSyncTargets(Request $request, $id)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($id);

        $targets = collect();

        // 1. If current app was cloned from a master app
        if ($app->cloned_from_id) {
            $master = NoteApp::find($app->cloned_from_id);
            if ($master && ($master->owner_id === $user->id || $master->is_public || $master->canUserView($user))) {
                $targets->push([
                    'id' => $master->id,
                    'name' => $master->name,
                    'is_master' => true,
                    'is_duplicate' => false,
                    'can_edit' => $master->canUserEdit($user),
                    'created_at' => $master->created_at->translatedFormat('d M Y, H:i'),
                    'updated_at' => $master->updated_at->translatedFormat('d M Y, H:i'),
                ]);
            }

            // Sibling clones owned by THIS user only
            $siblings = NoteApp::where('cloned_from_id', $app->cloned_from_id)
                ->where('owner_id', $user->id)
                ->where('id', '!=', $app->id)
                ->orderByDesc('updated_at')
                ->get();

            foreach ($siblings as $sib) {
                $targets->push([
                    'id' => $sib->id,
                    'name' => $sib->name,
                    'is_master' => false,
                    'is_duplicate' => true,
                    'can_edit' => true,
                    'created_at' => $sib->created_at->translatedFormat('d M Y, H:i'),
                    'updated_at' => $sib->updated_at->translatedFormat('d M Y, H:i'),
                ]);
            }
        }

        // 2. Clones of THIS app owned by THIS user only
        $myClones = NoteApp::where('cloned_from_id', $app->id)
            ->where('owner_id', $user->id)
            ->where('id', '!=', $app->id)
            ->orderByDesc('updated_at')
            ->get();

        foreach ($myClones as $clone) {
            if (! $targets->contains('id', $clone->id)) {
                $targets->push([
                    'id' => $clone->id,
                    'name' => $clone->name,
                    'is_master' => false,
                    'is_duplicate' => true,
                    'can_edit' => true,
                    'created_at' => $clone->created_at->translatedFormat('d M Y, H:i'),
                    'updated_at' => $clone->updated_at->translatedFormat('d M Y, H:i'),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'current_app' => [
                'id' => $app->id,
                'name' => $app->name,
                'is_duplicate' => (bool) $app->cloned_from_id,
            ],
            'targets' => $targets->values(),
        ]);
    }

    /**
     * Compute note-level diff between source and target workspace.
     */
    public function getSyncDiff(Request $request, $id)
    {
        $user = Auth::user();
        $validated = $request->validate([
            'source_app_id' => 'required|uuid',
            'target_app_id' => 'required|uuid',
        ]);

        $sourceApp = NoteApp::with(['groups.notes'])->find($validated['source_app_id']);
        $targetApp = NoteApp::with(['groups.notes'])->find($validated['target_app_id']);

        if (! $sourceApp) {
            return response()->json([
                'success' => false,
                'message' => 'Ruang kerja asal tidak ditemukan atau sudah dihapus.',
            ], 404);
        }

        if (! $targetApp) {
            return response()->json([
                'success' => false,
                'message' => 'Ruang kerja tujuan tidak ditemukan.',
            ], 404);
        }

        if (! $sourceApp->canUserView($user)) {
            abort(403, 'Anda tidak memiliki akses ke ruang kerja sumber.');
        }
        if (! $targetApp->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki hak edit pada ruang kerja target.');
        }

        $allSourceNotes = $sourceApp->groups->flatMap(function ($g) {
            return $g->notes->map(function ($n) use ($g) {
                $n->group_name = $g->name;

                return $n;
            });
        });

        $allTargetNotes = $targetApp->groups->flatMap(function ($g) {
            return $g->notes->map(function ($n) use ($g) {
                $n->group_name = $g->name;

                return $n;
            });
        });

        $diffItems = [];
        $matchedTargetIds = [];

        foreach ($allSourceNotes as $sNote) {
            $candidateTargets = $allTargetNotes->filter(function ($tNote) use ($matchedTargetIds) {
                return ! in_array($tNote->id, $matchedTargetIds, true);
            });

            // 1. Strict Lineage Match via cloned_from_id
            $twin = $candidateTargets->first(function ($tNote) use ($sNote) {
                if ($tNote->cloned_from_id && $tNote->cloned_from_id === $sNote->id) {
                    return true;
                }
                if ($sNote->cloned_from_id && $sNote->cloned_from_id === $tNote->id) {
                    return true;
                }
                if ($sNote->cloned_from_id && $tNote->cloned_from_id && $sNote->cloned_from_id === $tNote->cloned_from_id) {
                    return true;
                }

                return false;
            });

            // 2. If no lineage match, match by same group + same title + identical content
            if (! $twin) {
                $twin = $candidateTargets->first(function ($tNote) use ($sNote) {
                    $sameGroup = mb_strtolower(trim($tNote->group_name)) === mb_strtolower(trim($sNote->group_name));
                    $sameTitle = mb_strtolower(trim($tNote->title)) === mb_strtolower(trim($sNote->title));
                    if (! $sameGroup || ! $sameTitle) {
                        return false;
                    }

                    return $this->normalizeContent($sNote->content_json) === $this->normalizeContent($tNote->content_json)
                        && $this->normalizeDrawing($sNote->drawing_data) === $this->normalizeDrawing($tNote->drawing_data);
                });
            }

            // 3. Fallback: match by same group + same title
            if (! $twin) {
                $twin = $candidateTargets->first(function ($tNote) use ($sNote) {
                    return mb_strtolower(trim($tNote->group_name)) === mb_strtolower(trim($sNote->group_name))
                        && mb_strtolower(trim($tNote->title)) === mb_strtolower(trim($sNote->title));
                });
            }

            $sPreview = '';
            if (! empty($sNote->content_json)) {
                $decoded = json_decode($sNote->content_json, true);
                $html = is_array($decoded) && isset($decoded['html']) ? $decoded['html'] : $sNote->content_json;
                $sPreview = mb_substr(trim(strip_tags($html)), 0, 100);
            }

            if (! $twin) {
                $diffItems[] = [
                    'source_note_id' => $sNote->id,
                    'target_note_id' => null,
                    'group_name' => $sNote->group_name,
                    'target_group_name' => null,
                    'source_title' => $sNote->title,
                    'target_title' => null,
                    'status' => 'new',
                    'source_preview' => $sPreview,
                    'target_preview' => null,
                    'source_updated_at' => $sNote->updated_at->translatedFormat('d M Y, H:i'),
                    'target_updated_at' => null,
                    'default_action' => 'add',
                ];
            } else {
                $matchedTargetIds[] = $twin->id;

                $tPreview = '';
                if (! empty($twin->content_json)) {
                    $decoded = json_decode($twin->content_json, true);
                    $html = is_array($decoded) && isset($decoded['html']) ? $decoded['html'] : $twin->content_json;
                    $tPreview = mb_substr(trim(strip_tags($html)), 0, 100);
                }

                $isDiff = (trim($sNote->title) !== trim($twin->title))
                    || ($sNote->category !== $twin->category)
                    || ($this->normalizeContent($sNote->content_json) !== $this->normalizeContent($twin->content_json))
                    || ($this->normalizeDrawing($sNote->drawing_data) !== $this->normalizeDrawing($twin->drawing_data))
                    || ($sNote->deadline_at?->timestamp !== $twin->deadline_at?->timestamp);

                $diffItems[] = [
                    'source_note_id' => $sNote->id,
                    'target_note_id' => $twin->id,
                    'group_name' => $sNote->group_name,
                    'target_group_name' => $twin->group_name,
                    'source_title' => $sNote->title,
                    'target_title' => $twin->title,
                    'status' => $isDiff ? 'modified' : 'identical',
                    'source_preview' => $sPreview,
                    'target_preview' => $tPreview,
                    'source_updated_at' => $sNote->updated_at->translatedFormat('d M Y, H:i'),
                    'target_updated_at' => $twin->updated_at->translatedFormat('d M Y, H:i'),
                    'default_action' => $isDiff ? 'overwrite' : 'skip',
                ];
            }
        }

        foreach ($allTargetNotes as $tNote) {
            if (! in_array($tNote->id, $matchedTargetIds, true)) {
                $tPreview = '';
                if (! empty($tNote->content_json)) {
                    $decoded = json_decode($tNote->content_json, true);
                    $html = is_array($decoded) && isset($decoded['html']) ? $decoded['html'] : $tNote->content_json;
                    $tPreview = mb_substr(trim(strip_tags($html)), 0, 100);
                }

                $diffItems[] = [
                    'source_note_id' => null,
                    'target_note_id' => $tNote->id,
                    'group_name' => null,
                    'target_group_name' => $tNote->group_name,
                    'source_title' => null,
                    'target_title' => $tNote->title,
                    'status' => 'target_only',
                    'source_preview' => null,
                    'target_preview' => $tPreview,
                    'source_updated_at' => null,
                    'target_updated_at' => $tNote->updated_at->translatedFormat('d M Y, H:i'),
                    'default_action' => 'skip',
                ];
            }
        }

        return response()->json([
            'success' => true,
            'source_app' => [
                'id' => $sourceApp->id,
                'name' => $sourceApp->name,
            ],
            'target_app' => [
                'id' => $targetApp->id,
                'name' => $targetApp->name,
            ],
            'diff' => $diffItems,
        ]);
    }

    /**
     * Apply sync merge actions to target workspace.
     */
    public function applySync(Request $request, $id)
    {
        $user = Auth::user();
        $validated = $request->validate([
            'source_app_id' => 'required|uuid',
            'target_app_id' => 'required|uuid',
            'actions' => 'required|array',
            'actions.*.source_note_id' => 'nullable|uuid',
            'actions.*.target_note_id' => 'nullable|uuid',
            'actions.*.action' => 'required|in:add,overwrite,create_new,skip',
        ]);

        $sourceApp = NoteApp::with(['groups.notes.attachments'])->find($validated['source_app_id']);
        $targetApp = NoteApp::with(['groups.notes'])->find($validated['target_app_id']);

        if (! $sourceApp) {
            return response()->json([
                'success' => false,
                'message' => 'Ruang kerja asal tidak ditemukan atau sudah dihapus.',
            ], 404);
        }

        if (! $targetApp) {
            return response()->json([
                'success' => false,
                'message' => 'Ruang kerja tujuan tidak ditemukan.',
            ], 404);
        }

        if (! $sourceApp->canUserView($user)) {
            abort(403, 'Akses ruang kerja sumber ditolak.');
        }
        if (! $targetApp->canUserEdit($user)) {
            abort(403, 'Akses edit ruang kerja target ditolak.');
        }

        $appliedCount = 0;

        DB::transaction(function () use ($validated, $targetApp, &$appliedCount) {
            foreach ($validated['actions'] as $item) {
                $action = $item['action'] ?? 'skip';
                if ($action === 'skip') {
                    continue;
                }

                $sNoteId = $item['source_note_id'] ?? null;
                $tNoteId = $item['target_note_id'] ?? null;

                $srcNote = $sNoteId ? Note::with(['group', 'attachments'])->find($sNoteId) : null;
                $targetNote = $tNoteId ? Note::find($tNoteId) : null;

                if ($action === 'add' && $srcNote) {
                    $targetGroup = $targetApp->groups()->where(function ($q) use ($srcNote) {
                        $q->where('cloned_from_id', $srcNote->note_group_id)
                            ->orWhere('name', $srcNote->group->name);
                    })->first();

                    if (! $targetGroup) {
                        $targetGroup = NoteGroup::create([
                            'note_app_id' => $targetApp->id,
                            'cloned_from_id' => $srcNote->note_group_id,
                            'name' => $srcNote->group->name,
                            'color' => $srcNote->group->color,
                            'sort_order' => $srcNote->group->sort_order,
                        ]);
                    }

                    $newNote = Note::create([
                        'note_group_id' => $targetGroup->id,
                        'cloned_from_id' => $srcNote->id,
                        'title' => $srcNote->title,
                        'category' => $srcNote->category,
                        'content_json' => $srcNote->content_json,
                        'drawing_data' => $srcNote->drawing_data,
                        'deadline_at' => $srcNote->deadline_at,
                        'reminder_days_before' => $srcNote->reminder_days_before,
                        'is_pinned' => $srcNote->is_pinned,
                        'sort_order' => $srcNote->sort_order,
                    ]);

                    foreach ($srcNote->attachments as $att) {
                        NoteAttachment::create([
                            'note_id' => $newNote->id,
                            'file_name' => $att->file_name,
                            'file_path' => $att->file_path,
                            'mime_type' => $att->mime_type,
                            'file_size' => $att->file_size,
                        ]);
                    }

                    $appliedCount++;
                } elseif ($action === 'overwrite' && $targetNote && $srcNote) {
                    $targetNote->update([
                        'cloned_from_id' => $srcNote->id,
                        'title' => $srcNote->title,
                        'category' => $srcNote->category,
                        'content_json' => $srcNote->content_json,
                        'drawing_data' => $srcNote->drawing_data,
                        'deadline_at' => $srcNote->deadline_at,
                        'reminder_days_before' => $srcNote->reminder_days_before,
                    ]);
                    $appliedCount++;
                } elseif ($action === 'create_new' && $srcNote) {
                    $targetGroup = $targetApp->groups()->where(function ($q) use ($srcNote) {
                        $q->where('cloned_from_id', $srcNote->note_group_id)
                            ->orWhere('name', $srcNote->group->name);
                    })->first();

                    if (! $targetGroup) {
                        $targetGroup = NoteGroup::create([
                            'note_app_id' => $targetApp->id,
                            'cloned_from_id' => $srcNote->note_group_id,
                            'name' => $srcNote->group->name,
                            'color' => $srcNote->group->color,
                            'sort_order' => $srcNote->group->sort_order,
                        ]);
                    }

                    $newNote = Note::create([
                        'note_group_id' => $targetGroup->id,
                        'cloned_from_id' => $srcNote->id,
                        'title' => $srcNote->title.' (Salinan Sync)',
                        'category' => $srcNote->category,
                        'content_json' => $srcNote->content_json,
                        'drawing_data' => $srcNote->drawing_data,
                        'deadline_at' => $srcNote->deadline_at,
                        'reminder_days_before' => $srcNote->reminder_days_before,
                        'is_pinned' => false,
                        'sort_order' => $srcNote->sort_order,
                    ]);

                    $appliedCount++;
                }
            }

            $targetApp->touch();
        });

        ActivityLogger::log('SYNC_WORKSPACE', "Menerapkan sinkronisasi dari '{$sourceApp->name}' ke '{$targetApp->name}' ({$appliedCount} catatan diperbarui)", $targetApp);

        return response()->json([
            'success' => true,
            'message' => "Sinkronisasi berhasil! {$appliedCount} catatan diperbarui.",
            'applied_count' => $appliedCount,
        ]);
    }

    /**
     * Normalize content_json string to compare logically identical notes.
     */
    protected function normalizeContent(?string $contentJson): string
    {
        if (empty($contentJson)) {
            return '';
        }

        $decoded = json_decode($contentJson, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            if (isset($decoded['html']) && is_string($decoded['html'])) {
                $html = str_replace(["\r\n", "\r"], "\n", $decoded['html']);
                $html = preg_replace('/\s+/', ' ', $html);
                $html = trim($html);
                if (in_array($html, ['<p><br></p>', '<p></p>', '<p><br/></p>'], true)) {
                    $html = '';
                }
                $decoded['html'] = $html;
            }
            if (isset($decoded['checklist']) && is_array($decoded['checklist'])) {
                $decoded['checklist'] = array_values($decoded['checklist']);
            }
            ksort($decoded);

            return json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        $raw = str_replace(["\r\n", "\r"], "\n", $contentJson);

        return trim(preg_replace('/\s+/', ' ', $raw));
    }

    /**
     * Normalize drawing_data string for comparison.
     */
    protected function normalizeDrawing(?string $drawingData): string
    {
        if (empty($drawingData)) {
            return '';
        }

        $decoded = json_decode($drawingData, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            if (isset($decoded['lines']) && empty($decoded['lines']) && empty($decoded['preview'])) {
                return '';
            }
            ksort($decoded);

            return json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        return trim($drawingData);
    }
}
