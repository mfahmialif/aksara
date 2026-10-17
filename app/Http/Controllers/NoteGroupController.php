<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

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
}
