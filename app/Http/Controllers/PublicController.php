<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\NoteApp;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicController extends Controller
{
    public function welcome()
    {
        $demoUsers = User::where('is_active', true)->limit(5)->get();

        return Inertia::render('Public/Welcome', [
            'demo_users' => $demoUsers,
        ]);
    }

    public function showPublicApp($slug_token, Request $request)
    {
        $app = NoteApp::where('public_token', $slug_token)
            ->where('is_public', true)
            ->with(['owner'])
            ->firstOrFail();

        $groups = $app->groups()->with(['notes' => function ($q) {
            $q->with(['attachments'])->orderBy('id', 'desc');
        }])->get();

        $selectedNoteId = $request->query('note_id');
        $selectedNote = null;

        if ($selectedNoteId) {
            $selectedNote = Note::with(['attachments', 'group'])->find($selectedNoteId);
        }

        if (!$selectedNote) {
            foreach ($groups as $grp) {
                if ($grp->notes->isNotEmpty()) {
                    $selectedNote = $grp->notes->first();
                    break;
                }
            }
        }

        return Inertia::render('Public/PublicApp', [
            'app' => $app,
            'groups' => $groups,
            'selected_note' => $selectedNote,
        ]);
    }

    public function showPublicNote($slug_token)
    {
        $note = Note::where('public_token', $slug_token)
            ->where('is_public', true)
            ->with(['attachments', 'group.app.owner'])
            ->firstOrFail();

        return Inertia::render('Public/PublicNote', [
            'note' => $note,
        ]);
    }
}
