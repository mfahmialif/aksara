<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\SavedSharedLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SavedLinkController extends Controller
{
    /**
     * Save a public shared link to the user's workspace.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_type' => 'required|in:app,group,note',
            'item_id' => 'nullable|string',
            'public_token' => 'nullable|string|max:64',
            'share_url' => 'nullable|string|max:255',
        ]);

        $user = Auth::user();
        $itemType = $validated['item_type'];
        $itemId = $validated['item_id'] ?? null;
        $token = $validated['public_token'] ?? null;

        $noteAppId = null;
        $title = 'Tautan Dibagikan';
        $finalToken = $token;

        if ($itemType === 'app') {
            $app = NoteApp::where(function ($q) use ($itemId, $token) {
                if ($itemId) {
                    $q->where('id', $itemId);
                }
                if ($token) {
                    $q->orWhere('public_token', $token);
                }
            })->where('is_public', true)->first();

            if (! $app) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ruang kerja publik tidak ditemukan atau telah dijadikan privat.',
                ], 404);
            }

            $itemId = $app->id;
            $noteAppId = $app->id;
            $title = $app->name;
            $finalToken = $app->public_token;
            $shareUrl = $validated['share_url'] ?? route('public.app', ['slug_token' => $finalToken], false);
        } elseif ($itemType === 'group') {
            $group = NoteGroup::where(function ($q) use ($itemId, $token) {
                if ($itemId) {
                    $q->where('id', $itemId);
                }
                if ($token) {
                    $q->orWhere('public_token', $token);
                }
            })->where('is_public', true)->with('app')->first();

            if (! $group) {
                return response()->json([
                    'success' => false,
                    'message' => 'Topik publik tidak ditemukan atau telah dijadikan privat.',
                ], 404);
            }

            $itemId = $group->id;
            $noteAppId = $group->note_app_id;
            $title = $group->name;
            $finalToken = $group->public_token;
            $shareUrl = $validated['share_url'] ?? route('public.group', ['slug_token' => $finalToken], false);
        } else {
            // Note
            $note = Note::where(function ($q) use ($itemId, $token) {
                if ($itemId) {
                    $q->where('id', $itemId);
                }
                if ($token) {
                    $q->orWhere('public_token', $token);
                }
            })->where('is_public', true)->with('group.app')->first();

            if (! $note) {
                return response()->json([
                    'success' => false,
                    'message' => 'Catatan publik tidak ditemukan atau telah dijadikan privat.',
                ], 404);
            }

            $itemId = $note->id;
            $noteAppId = $note->group?->note_app_id;
            $title = $note->title;
            $finalToken = $note->public_token;
            $shareUrl = $validated['share_url'] ?? route('public.note', ['slug_token' => $finalToken], false);
        }

        $saved = SavedSharedLink::updateOrCreate(
            [
                'user_id' => $user->id,
                'item_type' => $itemType,
                'item_id' => $itemId,
            ],
            [
                'note_app_id' => $noteAppId,
                'title' => $title,
                'share_url' => $shareUrl,
                'public_token' => $finalToken,
            ]
        );

        return response()->json([
            'success' => true,
            'saved' => true,
            'item' => $saved,
            'message' => "Link \"{$title}\" berhasil disimpan ke Ruang Kerja!",
        ]);
    }

    /**
     * Remove a saved link.
     */
    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'item_type' => 'required|in:app,group,note',
            'item_id' => 'required|string',
        ]);

        $user = Auth::user();
        $itemType = $validated['item_type'];
        $itemId = $validated['item_id'];

        $deleted = SavedSharedLink::where('user_id', $user->id)
            ->where('item_type', $itemType)
            ->where(function ($q) use ($itemId) {
                $q->where('item_id', $itemId)
                    ->orWhere('public_token', $itemId);
            })
            ->delete();

        return response()->json([
            'success' => true,
            'saved' => false,
            'deleted_count' => $deleted,
            'message' => 'Link berhasil dihapus dari daftar simpanan.',
        ]);
    }

    /**
     * Check if a specific link is saved by the authenticated user.
     */
    public function status(Request $request)
    {
        $user = Auth::user();
        $itemType = $request->query('item_type');
        $itemId = $request->query('item_id');
        $token = $request->query('public_token');

        if (! $user || ! $itemType) {
            return response()->json(['saved' => false]);
        }

        $isSaved = SavedSharedLink::where('user_id', $user->id)
            ->where('item_type', $itemType)
            ->where(function ($q) use ($itemId, $token) {
                if ($itemId) {
                    $q->where('item_id', $itemId);
                }
                if ($token) {
                    $q->orWhere('public_token', $token);
                }
            })
            ->exists();

        return response()->json(['saved' => $isSaved]);
    }
}
