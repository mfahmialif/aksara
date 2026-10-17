<?php

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\SavedSharedLink;
use App\Models\User;
use App\Models\UserNoteReminder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PublicController extends Controller
{
    /**
     * Check if the incoming request is from a search engine or social media crawler/bot.
     */
    public static function isCrawler(Request $request): bool
    {
        $userAgent = strtolower((string) $request->header('User-Agent', ''));

        if (empty($userAgent)) {
            return false;
        }

        $crawlers = [
            'whatsapp',
            'facebookexternalhit',
            'facebot',
            'twitterbot',
            'telegrambot',
            'linkedinbot',
            'slackbot',
            'discordbot',
            'googlebot',
            'bingbot',
            'applebot',
            'skypeuripreview',
            'pinterest',
            'vkshare',
            'line/',
            'embedly',
            'quora link preview',
            'yahoo! slurp',
        ];

        foreach ($crawlers as $crawler) {
            if (str_contains($userAgent, $crawler)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Helper to enforce member login before viewing any public share links,
     * while allowing social media bots to read OpenGraph tags and remembering
     * intended URL for human visitors.
     */
    private function ensureAuthenticated(Request $request)
    {
        // Allow crawlers/bots to pass through so WhatsApp, Facebook, Telegram can unfurl meta tags
        if (self::isCrawler($request)) {
            return null;
        }

        if (! auth('web')->check()) {
            session()->put('url.intended', $request->fullUrl());

            return redirect()->route('login')->with('info', 'Anda harus login terlebih dahulu untuk mengakses halaman yang dibagikan. Silakan klik tombol di bawah untuk login dengan Google.');
        }

        return null;
    }

    public function welcome()
    {
        $demoUsers = User::where('is_active', true)->limit(5)->get();

        $seo = [
            'title' => 'Aksara Notes — Workspace & Catatan Kolaboratif Modern',
            'description' => 'Aplikasi ruang kerja dan catatan modern bergaya Neo-Brutalism. Catat ide, kelola topik kuliah atau proyek tim, dan bagikan tautan secara instan.',
            'image' => url('/og-image.png'),
            'url' => url('/'),
            'type' => 'website',
        ];
        View::share('seo', $seo);

        return Inertia::render('Public/Welcome', [
            'demo_users' => $demoUsers,
            'seo' => $seo,
        ]);
    }

    public function showPublicApp($slug_token, Request $request)
    {
        $app = NoteApp::where('public_token', $slug_token)
            ->where('is_public', true)
            ->with(['owner', 'collaborators.user'])
            ->firstOrFail();

        $seo = [
            'title' => "{$app->name} — Ruang Kerja Aksara",
            'description' => $app->description ?: "Buka dan jelajahi ruang kerja {$app->name} di Aksara Notes. Kelola topik dan catatan dengan mudah.",
            'image' => url('/og-image.png'),
            'url' => url('/s/'.$slug_token),
            'type' => 'website',
        ];
        View::share('seo', $seo);

        if ($redirect = $this->ensureAuthenticated($request)) {
            return $redirect;
        }

        $groups = $app->groups()->with(['notes' => function ($q) {
            $q->with(['attachments'])
                ->orderByDesc('is_pinned')
                ->orderBy('sort_order', 'asc')
                ->orderByDesc('created_at');
        }])
            ->orderBy('sort_order', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        $selectedNoteId = $request->query('note_id');
        $selectedNote = null;

        if ($selectedNoteId) {
            $selectedNote = Note::with(['attachments', 'group'])->find($selectedNoteId);
        }

        if (! $selectedNote) {
            foreach ($groups as $grp) {
                if ($grp->notes->isNotEmpty()) {
                    $selectedNote = $grp->notes->first();
                    break;
                }
            }
        }

        $user = auth('web')->user();
        $isOwner = $user && $app->owner_id === $user->id;
        $isCollaborator = $app->isCollaborator($user);
        $canEdit = $app->canUserEdit($user);
        $isSaved = $user ? SavedSharedLink::where('user_id', $user->id)->where('item_type', 'app')->where('item_id', $app->id)->exists() : false;

        return Inertia::render('Member/NoteEditor', [
            'app' => $app,
            'groups' => $groups,
            'selected_note' => $selectedNote,
            'is_owner' => $isOwner,
            'is_collaborator' => $isCollaborator,
            'can_edit' => $canEdit,
            'is_saved' => $isSaved,
            'share_item_type' => 'app',
            'share_item_id' => $app->id,
            'share_public_token' => $slug_token,
            'is_public_view' => true,
            'is_group_shared_view' => false,
            'is_single_note_view' => false,
            'seo' => $seo,
        ]);
    }

    public function showPublicGroup($slug_token, Request $request)
    {
        $group = NoteGroup::where('public_token', $slug_token)
            ->where('is_public', true)
            ->with(['app.owner', 'app.collaborators.user', 'notes' => function ($q) {
                $q->with(['attachments'])
                    ->orderByDesc('is_pinned')
                    ->orderBy('sort_order', 'asc')
                    ->orderByDesc('created_at');
            }])
            ->firstOrFail();

        $app = $group->app;
        $appName = $app?->name ?? 'Aksara';
        $seo = [
            'title' => "{$group->name} — {$appName} | Aksara Notes",
            'description' => "Lihat kumpulan catatan topik '{$group->name}' pada ruang kerja {$appName} di Aksara Notes.",
            'image' => url('/og-image.png'),
            'url' => url('/s/'.$slug_token),
            'type' => 'website',
        ];
        View::share('seo', $seo);

        if ($redirect = $this->ensureAuthenticated($request)) {
            return $redirect;
        }

        $user = auth('web')->user();
        $isOwner = $user && $app && $app->owner_id === $user->id;
        $isCollaborator = ($user && $app) ? $app->isCollaborator($user) : false;
        $canEdit = $group->canUserEdit($user);

        $selectedNoteId = $request->query('note_id');
        $selectedNote = null;
        if ($selectedNoteId) {
            $selectedNote = $group->notes->firstWhere('id', $selectedNoteId);
        }
        if (! $selectedNote && $group->notes->isNotEmpty()) {
            $selectedNote = $group->notes->first();
        }

        // Only this specific group is visible in group sharing view
        $groups = collect([$group]);
        $isSaved = $user ? SavedSharedLink::where('user_id', $user->id)->where('item_type', 'group')->where('item_id', $group->id)->exists() : false;

        return Inertia::render('Member/NoteEditor', [
            'app' => $app,
            'groups' => $groups,
            'selected_note' => $selectedNote,
            'selected_group' => $group,
            'is_owner' => $isOwner,
            'is_collaborator' => $isCollaborator,
            'can_edit' => $canEdit,
            'is_saved' => $isSaved,
            'share_item_type' => 'group',
            'share_item_id' => $group->id,
            'share_public_token' => $slug_token,
            'is_public_view' => true,
            'is_group_shared_view' => true,
            'is_single_note_view' => false,
            'seo' => $seo,
        ]);
    }

    public function showPublicNote($slug_token, ?Request $request = null)
    {
        $req = $request ?: request();

        $note = Note::where('public_token', $slug_token)
            ->where('is_public', true)
            ->with(['attachments', 'group.app.owner', 'group.app.collaborators.user'])
            ->firstOrFail();

        $description = "Catatan '{$note->title}' di Aksara Notes.";
        if (! empty($note->content_json)) {
            $decoded = json_decode($note->content_json, true);
            $html = $decoded['html'] ?? '';
            $cleanText = trim(strip_tags(html_entity_decode((string) $html, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
            if (! empty($cleanText)) {
                $description = Str::limit(preg_replace('/\s+/', ' ', $cleanText), 180);
            }
        }

        $imageUrl = url('/og-image.png');
        $imageAttachment = $note->attachments->first(function ($att) {
            return str_starts_with($att->mime_type ?? '', 'image/');
        });
        if ($imageAttachment && ! empty($imageAttachment->file_path)) {
            $imageUrl = url('/storage/'.$imageAttachment->file_path);
        }

        $seo = [
            'title' => "{$note->title} — Aksara Notes",
            'description' => $description,
            'image' => $imageUrl,
            'url' => url('/s/'.$slug_token),
            'type' => 'article',
        ];
        View::share('seo', $seo);

        if ($redirect = $this->ensureAuthenticated($req)) {
            return $redirect;
        }

        $app = $note->group?->app;
        $user = auth('web')->user();
        $isOwner = $user && $app && $app->owner_id === $user->id;
        $isCollaborator = ($user && $app) ? ($app->isCollaborator($user) || $note->isCollaborator($user)) : false;
        $canEdit = $note->canUserEdit($user);
        $isSaved = $user ? SavedSharedLink::where('user_id', $user->id)->where('item_type', 'note')->where('item_id', $note->id)->exists() : false;
        $userReminder = $user ? UserNoteReminder::where('user_id', $user->id)->where('note_id', $note->id)->first() : null;

        // Isolate group so only this note is exposed
        $group = $note->group;
        if ($group) {
            $group->setRelation('notes', collect([$note]));
        }

        return Inertia::render('Public/PublicNote', [
            'note' => $note,
            'app' => $app,
            'groups' => $group ? collect([$group]) : collect([]),
            'user_reminder' => $userReminder,
            'is_saved' => $isSaved,
            'can_edit' => $canEdit,
            'is_owner' => $isOwner,
            'is_collaborator' => $isCollaborator,
            'share_public_token' => $slug_token,
            'seo' => $seo,
        ]);
    }

    /**
     * Universal shortlink resolution: /s/{slug_token}
     * Resolves public workspace, public group/folder, or public note.
     */
    public function showShortlink($slug_token, Request $request)
    {
        // 1. Try finding public workspace
        $app = NoteApp::where('public_token', $slug_token)
            ->where('is_public', true)
            ->first();

        if ($app) {
            return $this->showPublicApp($slug_token, $request);
        }

        // 2. Try finding public group / folder
        $group = NoteGroup::where('public_token', $slug_token)
            ->where('is_public', true)
            ->first();

        if ($group) {
            return $this->showPublicGroup($slug_token, $request);
        }

        // 3. Try finding public note
        $note = Note::where('public_token', $slug_token)
            ->where('is_public', true)
            ->first();

        if ($note) {
            return $this->showPublicNote($slug_token, $request);
        }

        abort(404, 'Tautan publik tidak ditemukan atau konten telah diubah menjadi privat.');
    }

    /**
     * Check if a custom shortlink (slug) is available across apps, groups, and notes.
     */
    public function checkSlugAvailability(Request $request)
    {
        $slug = trim((string) $request->query('slug', ''));
        $currentId = $request->query('current_id');
        $level = $request->query('level', 'app'); // 'app', 'group', or 'note'

        if (empty($slug) || strlen($slug) < 3) {
            return response()->json([
                'available' => false,
                'message' => 'Shortlink minimal 3 karakter.',
            ]);
        }

        if (strlen($slug) > 60) {
            return response()->json([
                'available' => false,
                'message' => 'Shortlink maksimal 60 karakter.',
            ]);
        }

        if (! preg_match('/^[a-zA-Z0-9_-]+$/', $slug)) {
            return response()->json([
                'available' => false,
                'message' => 'Hanya boleh huruf, angka, minus (-) dan garis bawah (_).',
            ]);
        }

        $reserved = ['app', 'note', 'group', 'admin', 'api', 'login', 'logout', 'dashboard', 's', 'settings', 'notifications'];
        if (in_array(strtolower($slug), $reserved, true)) {
            return response()->json([
                'available' => false,
                'message' => 'Kata ini merupakan kata kunci sistem dan tidak dapat digunakan.',
            ]);
        }

        $appsQuery = NoteApp::where('public_token', $slug);
        if ($level === 'app' && $currentId) {
            $appsQuery->where('id', '!=', $currentId);
        }
        $existsInApps = $appsQuery->exists();

        $groupsQuery = NoteGroup::where('public_token', $slug);
        if ($level === 'group' && $currentId) {
            $groupsQuery->where('id', '!=', $currentId);
        }
        $existsInGroups = $groupsQuery->exists();

        $notesQuery = Note::where('public_token', $slug);
        if ($level === 'note' && $currentId) {
            $notesQuery->where('id', '!=', $currentId);
        }
        $existsInNotes = $notesQuery->exists();

        $available = ! $existsInApps && ! $existsInGroups && ! $existsInNotes;

        return response()->json([
            'available' => $available,
            'message' => $available ? 'Shortlink tersedia!' : 'Shortlink ini sudah digunakan. Silakan gunakan shortlink lain.',
        ]);
    }
}
