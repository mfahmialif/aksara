<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\Collaborator;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\SavedSharedLink;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class NoteGroupController extends Controller
{
    public function store(Request $request, $appId)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($appId);

        if (! $app->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin menambah grup di aplikasi ini.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'color' => 'nullable|string|max:30',
        ]);

        $maxOrder = NoteGroup::where('note_app_id', $app->id)->max('sort_order') ?? 0;

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => $validated['name'],
            'color' => $validated['color'] ?? '#FFDC58',
            'sort_order' => $maxOrder + 1,
        ]);

        $group->setRelation('notes', collect());

        ActivityLogger::log('CREATE_GROUP', "Membuat folder '{$group->name}' dalam ruang kerja '{$app->name}'", $group);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Folder "'.$group->name.'" berhasil ditambahkan.',
                'group' => $group,
            ]);
        }

        if (Auth::check()) {
            return redirect()->route('apps.show', $app->id)->with('success', 'Folder "'.$group->name.'" berhasil ditambahkan.');
        }

        return redirect()->route('public.app', $app->public_token)->with('success', 'Folder "'.$group->name.'" berhasil ditambahkan.');
    }

    public function reorder(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate([
            'groups' => 'required|array',
            'groups.*.id' => 'required|string|exists:note_groups,id',
            'groups.*.sort_order' => 'required|integer',
        ]);

        foreach ($validated['groups'] as $item) {
            $group = NoteGroup::with('app')->find($item['id']);
            if ($group && $group->app->canUserEdit($user)) {
                $group->update(['sort_order' => $item['sort_order']]);
            }
        }

        return response()->json(['success' => true]);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $group = NoteGroup::with('app')->findOrFail($id);

        if (! $group->app->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin mengedit grup ini.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'color' => 'nullable|string|max:30',
        ]);

        $group->update($validated);

        ActivityLogger::log('UPDATE_GROUP', "Memperbarui folder '{$group->name}' dalam ruang kerja '{$group->app->name}'", $group);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Folder berhasil diperbarui.',
                'group' => $group,
            ]);
        }

        if (Auth::check()) {
            return redirect()->route('apps.show', $group->note_app_id)->with('success', 'Folder berhasil diperbarui.');
        }

        return redirect()->route('public.app', $group->app->public_token)->with('success', 'Folder berhasil diperbarui.');
    }

    public function destroy(Request $request, $id)
    {
        $user = Auth::user();
        $group = NoteGroup::with('app')->findOrFail($id);

        if (! $group->app->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin menghapus grup ini.');
        }

        $appId = $group->note_app_id;
        $name = $group->name;
        $publicToken = $group->app->public_token;
        $group->delete();

        ActivityLogger::log('DELETE_GROUP', "Menghapus folder '{$name}'", $group);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Grup "'.$name.'" berhasil dihapus.',
            ]);
        }

        if (Auth::check()) {
            return redirect()->route('apps.show', $appId)->with('success', 'Grup "'.$name.'" berhasil dihapus.');
        }

        return redirect()->route('public.app', $publicToken)->with('success', 'Grup "'.$name.'" berhasil dihapus.');
    }

    /**
     * Dedicated endpoint for public sharing and custom shortlink management for NoteGroup.
     */
    public function updateSharing($id, Request $request)
    {
        $user = Auth::user();
        $group = NoteGroup::with('app')->findOrFail($id);

        if (! $user || $group->app->owner_id !== $user->id) {
            abort(403, 'Hanya pemilik yang dapat mengubah pengaturan sharing folder ini.');
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
            $reserved = ['app', 'note', 'group', 'admin', 'api', 'login', 'logout', 'dashboard', 's', 'settings', 'notifications'];
            if (in_array(strtolower($customSlug), $reserved, true)) {
                throw ValidationException::withMessages([
                    'custom_slug' => "Shortlink '{$customSlug}' tidak dapat digunakan karena merupakan kata kunci sistem.",
                ]);
            }

            // Check uniqueness across apps, groups, and notes
            $existsInApps = NoteApp::where('public_token', $customSlug)->exists();
            $existsInGroups = NoteGroup::where('public_token', $customSlug)
                ->where('id', '!=', $group->id)
                ->exists();
            $existsInNotes = Note::where('public_token', $customSlug)->exists();

            if ($existsInApps || $existsInGroups || $existsInNotes) {
                throw ValidationException::withMessages([
                    'custom_slug' => "Shortlink '{$customSlug}' sudah digunakan. Silakan gunakan shortlink lain.",
                ]);
            }

            $group->public_token = $customSlug;
        } elseif ($isPublic && empty($group->public_token)) {
            $group->public_token = 'folder-'.Str::lower(Str::random(12));
        }

        $group->is_public = $isPublic;
        if ($isPublic) {
            $group->public_permission = $request->input('public_permission', $group->public_permission ?: 'read');
        }
        $group->save();

        ActivityLogger::log('UPDATE_GROUP_SHARING', "Memperbarui status sharing publik folder '{$group->name}' (Publik: ".($isPublic ? 'Ya' : 'Tidak').", Akses: {$group->public_permission}, Shortlink: {$group->public_token})", $group);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'is_public' => $group->is_public,
                'public_permission' => $group->public_permission,
                'public_token' => $group->public_token,
                'share_url' => url('/s/'.$group->public_token),
                'message' => $isPublic
                    ? ($group->public_permission === 'edit'
                        ? 'Folder dipublikasikan dengan Akses Penuh (Dapat Diedit)!'
                        : 'Folder dipublikasikan dalam mode Hanya Baca (Read-Only)!')
                    : 'Folder kini berstatus privat.',
            ]);
        }

        return back()->with('success', $isPublic ? 'Folder berhasil dipublikasikan!' : 'Folder kini berstatus privat.');
    }

    public function show($id, Request $request)
    {
        $user = Auth::user();
        $group = NoteGroup::with([
            'app.owner',
            'app.collaborators.user',
            'collaborators.user',
            'notes' => function ($q) {
                $q->with(['attachments', 'collaborators.user'])
                    ->orderByDesc('is_pinned')
                    ->orderBy('sort_order', 'asc')
                    ->orderByDesc('created_at');
            },
        ])->findOrFail($id);

        if (! $group->canUserView($user)) {
            abort(403, 'Anda tidak memiliki hak akses ke Folder ini.');
        }

        $app = $group->app;

        // If user is owner or app-level collaborator, redirect to full workspace view
        if ($user && $app && ($app->owner_id === $user->id || $app->isCollaborator($user))) {
            return redirect()->route('apps.show', [
                'app' => $app->id,
                'group_id' => $group->id,
                'note_id' => $request->query('note_id'),
            ]);
        }

        // Selected note inside this group
        $selectedNoteId = $request->query('note_id');
        $selectedNote = null;
        if ($selectedNoteId) {
            $selectedNote = $group->notes->firstWhere('id', $selectedNoteId);
        }
        if (! $selectedNote && $group->notes->isNotEmpty()) {
            $selectedNote = $group->notes->first();
        }

        $canEdit = $group->canUserEdit($user);
        $isCollaborator = $group->isCollaborator($user);
        $isSaved = $user ? SavedSharedLink::where('user_id', $user->id)->where('item_type', 'group')->where('item_id', $group->id)->exists() : false;

        return Inertia::render('Member/NoteEditor', [
            'app' => $app,
            'groups' => collect([$group]),
            'selected_group' => $group,
            'selected_note' => $selectedNote,
            'is_owner' => false,
            'is_collaborator' => $isCollaborator,
            'can_edit' => $canEdit,
            'is_saved' => $isSaved,
            'is_public_view' => false,
            'is_group_shared_view' => true,
            'is_single_note_view' => false,
            'share_item_type' => 'group',
            'share_item_id' => $group->id,
            'share_public_token' => $group->public_token,
        ]);
    }

    public function addCollaborator(Request $request, $id)
    {
        $user = Auth::user();
        $group = NoteGroup::with('app')->findOrFail($id);

        if (! $group->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin mengundang kolaborator ke folder ini.');
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
                'collaboratable_type' => NoteGroup::class,
                'collaboratable_id' => $group->id,
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
                'title' => '👥 Undangan Kolaborasi Folder',
                'message' => $user->name.' mengundang Anda berkolaborasi pada folder "'.$group->name.'".',
                'type' => 'collaboration',
                'action_url' => route('groups.show', $group->id),
                'read_at' => null,
                'is_archived' => false,
            ]);
        }

        ActivityLogger::log('INVITE_COLLABORATOR', "Mengundang {$validated['email']} sebagai kolaborator folder '{$group->name}'", $group);

        return back()->with('success', 'Kolaborator folder ('.$validated['email'].') berhasil ditambahkan!');
    }

    public function removeCollaborator($id, $collabId)
    {
        $user = Auth::user();
        $group = NoteGroup::with('app')->findOrFail($id);

        if (! $group->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin menghapus kolaborator.');
        }

        $collab = Collaborator::where('collaboratable_type', NoteGroup::class)
            ->where('collaboratable_id', $group->id)
            ->where('id', $collabId)
            ->firstOrFail();

        $email = $collab->invited_email;
        $collab->delete();

        ActivityLogger::log('REMOVE_COLLABORATOR', "Menghapus akses kolaborator {$email} dari folder '{$group->name}'", $group);

        return back()->with('success', 'Kolaborator folder berhasil dihapus.');
    }
}
