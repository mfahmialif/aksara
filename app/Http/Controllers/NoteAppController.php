<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\Collaborator;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class NoteAppController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Owned apps
        $myApps = NoteApp::where('owner_id', $user->id)
            ->with(['groups.notes'])
            ->withCount(['groups'])
            ->orderBy('id', 'desc')
            ->get();

        // Shared apps (collaborator on app level)
        $sharedApps = NoteApp::where('owner_id', '!=', $user->id)
            ->whereHas('collaborators', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere('invited_email', $user->email);
            })
            ->with(['owner', 'groups.notes'])
            ->withCount(['groups'])
            ->orderBy('id', 'desc')
            ->get();

        // Standalone shared notes (collaborator on note level ONLY)
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

        return Inertia::render('Member/Workspace', [
            'my_apps' => $myApps,
            'shared_apps' => $sharedApps,
            'standalone_notes' => $standaloneSharedNotes,
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
        ]);

        $app = NoteApp::create([
            'owner_id' => Auth::id(),
            'name' => $validated['name'],
            'color_theme' => $validated['color_theme'],
            'icon' => $validated['icon'] ?? 'Notebook',
            'description' => $validated['description'] ?? null,
            'is_public' => $validated['is_public'] ?? false,
            'public_token' => 'app-'.Str::random(24),
        ]);

        // Create default group
        NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Catatan Utama',
            'sort_order' => 1,
        ]);

        ActivityLogger::log('CREATE_WORKSPACE', "Membuat ruang kerja baru '{$app->name}'", $app);

        return redirect()->route('apps.show', $app->id)->with('success', 'Aplikasi Catatan "'.$app->name.'" berhasil dibuat!');
    }

    public function show($id, Request $request)
    {
        $user = Auth::user();
        $app = NoteApp::with(['owner', 'collaborators.user'])->findOrFail($id);

        if (! $app->canUserView($user)) {
            abort(403, 'Anda tidak memiliki hak akses ke Aplikasi Catatan ini.');
        }

        $groups = NoteGroup::where('note_app_id', $app->id)
            ->with(['notes' => function ($q) {
                $q->with(['attachments'])->orderBy('id', 'desc');
            }])
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
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

        return Inertia::render('Member/NoteEditor', [
            'app' => $app,
            'groups' => $groups,
            'selected_note' => $selectedNote,
            'is_owner' => $isOwner,
            'can_edit' => $canEdit,
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
            'name' => 'required|string|max:100',
            'color_theme' => 'required|in:yellow,purple,mint,coral,sky,pink,orange',
            'icon' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:300',
            'is_public' => 'boolean',
        ]);

        if (empty($app->public_token)) {
            $validated['public_token'] = 'app-'.Str::random(24);
        }

        $app->update($validated);

        ActivityLogger::log('UPDATE_WORKSPACE', "Memperbarui ruang kerja '{$app->name}'", $app);

        return back()->with('success', 'Pengaturan aplikasi catatan berhasil diperbarui.');
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
}
