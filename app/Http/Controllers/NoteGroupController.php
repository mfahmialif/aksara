<?php

namespace App\Http\Controllers;

use App\Models\NoteApp;
use App\Models\NoteGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NoteGroupController extends Controller
{
    public function store(Request $request, $appId)
    {
        $user = Auth::user();
        $app = NoteApp::findOrFail($appId);

        if (!$app->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin menambah grup di aplikasi ini.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $maxOrder = NoteGroup::where('note_app_id', $app->id)->max('sort_order') ?? 0;

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => $validated['name'],
            'sort_order' => $maxOrder + 1,
        ]);

        return back()->with('success', 'Grup "' . $group->name . '" berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $group = NoteGroup::with('app')->findOrFail($id);

        if (!$group->app->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin mengedit grup ini.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $group->update($validated);

        return back()->with('success', 'Nama grup berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $group = NoteGroup::with('app')->findOrFail($id);

        if (!$group->app->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin menghapus grup ini.');
        }

        $name = $group->name;
        $group->delete();

        return back()->with('success', 'Grup "' . $name . '" berhasil dihapus.');
    }
}
