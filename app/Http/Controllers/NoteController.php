<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\Collaborator;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteAttachment;
use App\Models\NoteGroup;
use App\Models\SavedSharedLink;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\UserNoteReminder;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class NoteController extends Controller
{
    public function store(Request $request, $groupId)
    {
        $user = Auth::user();
        $group = NoteGroup::with('app')->findOrFail($groupId);

        if (! $group->app->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin membuat catatan di grup ini.');
        }

        $category = $request->input('category', 'regular');
        $reminderDays = null;
        if ($category === 'task') {
            $reminderDays = $user?->default_reminder_days ?: 1;
        }

        $contentJson = $request->input('content_json');
        if (! $contentJson) {
            $contentJson = json_encode([
                'html' => '<p>Mulai menulis catatan Anda di sini...</p>',
                'checklist' => [],
            ]);
        }

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => $request->input('title', 'Catatan Baru'),
            'category' => $category,
            'content_json' => $contentJson,
            'drawing_data' => $request->input('drawing_data'),
            'deadline_at' => $request->input('deadline_at') ?: ($category === 'task' ? now()->addDays(3)->setHour(23)->setMinute(59) : null),
            'reminder_days_before' => $request->has('reminder_days_before') ? $request->input('reminder_days_before') : $reminderDays,
            'is_public' => false,
            'public_token' => 'note-'.Str::random(24),
            'public_permission' => 'read',
        ]);

        ActivityLogger::log('CREATE_NOTE', "Membuat catatan '{$note->title}' dalam grup '{$group->name}'", $note);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Catatan baru berhasil dibuat!',
                'note' => $note->load(['attachments', 'collaborators.user', 'group']),
            ]);
        }

        if ($request->input('stay') || $request->input('mode') === 'keep' || ! $user) {
            return back()->with('success', 'Catatan baru berhasil dibuat!');
        }

        return redirect()->route('apps.show', [
            'app' => $group->note_app_id,
            'note_id' => $note->id,
        ])->with('success', 'Catatan baru berhasil dibuat!');
    }

    public function show($id, Request $request)
    {
        $user = Auth::user();
        $note = Note::with([
            'group.app.owner',
            'group.app.collaborators.user',
            'group.collaborators.user',
            'attachments',
            'collaborators.user',
        ])->find($id);

        if (! $note) {
            return redirect()->route('apps.index')->with('error', 'Catatan tidak ditemukan atau telah diperbarui.');
        }

        if (! $note->canUserView($user)) {
            abort(403, 'Anda tidak memiliki hak akses ke catatan ini.');
        }

        $group = $note->group;
        $app = $group?->app;

        // 1. If user is owner or app-level collaborator, redirect to full workspace view
        if ($user && $app && ($app->owner_id === $user->id || $app->isCollaborator($user))) {
            return redirect()->route('apps.show', [
                'app' => $app->id,
                'note_id' => $note->id,
            ]);
        }

        // 2. If user is a folder/group-level collaborator, redirect to isolated folder view
        if ($user && $group && $group->isCollaborator($user)) {
            return redirect()->route('groups.show', [
                'group' => $group->id,
                'note_id' => $note->id,
            ]);
        }

        // 3. User is a note-level collaborator only: render isolated single note view!
        $isOwner = $user && $app && $app->owner_id === $user->id;
        $canEdit = $note->canUserEdit($user); // TRUE for note collaborator!
        $isCollaborator = $note->isCollaborator($user);
        $isSaved = $user ? SavedSharedLink::where('user_id', $user->id)->where('item_type', 'note')->where('item_id', $note->id)->exists() : false;
        $userReminder = $user ? UserNoteReminder::where('user_id', $user->id)->where('note_id', $note->id)->first() : null;

        $description = "Catatan '{$note->title}' di Aksara Notes.";
        if (! empty($note->content_json)) {
            $decoded = json_decode($note->content_json, true);
            $html = $decoded['html'] ?? '';
            $cleanText = trim(strip_tags(html_entity_decode((string) $html, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
            if (! empty($cleanText)) {
                $description = Str::limit(preg_replace('/\s+/', ' ', $cleanText), 180);
            }
        }

        $seo = [
            'title' => "{$note->title} — Aksara Notes",
            'description' => $description,
            'image' => url('/og-image.png'),
            'url' => route('notes.show', $note->id),
            'type' => 'article',
        ];

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
            'is_standalone_collab' => true,
            'share_public_token' => $note->public_token,
            'seo' => $seo,
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $note = Note::with('group.app')->findOrFail($id);

        if (! $note->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin mengedit catatan ini.');
        }

        $validated = $request->validate([
            'note_group_id' => 'sometimes|required|exists:note_groups,id',
            'title' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|in:regular,task',
            'content_json' => 'nullable|string',
            'drawing_data' => 'nullable|string',
            'deadline_at' => 'nullable|date',
            'reminder_days_before' => 'nullable|integer|min:0|max:30',
            'is_pinned' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
            'is_public' => 'sometimes|boolean',
            'public_token' => 'sometimes|nullable|string|max:64',
        ]);

        if (isset($validated['note_group_id']) && $validated['note_group_id'] !== $note->note_group_id) {
            $targetGroup = NoteGroup::findOrFail($validated['note_group_id']);
            if (! $targetGroup->canUserEdit($user)) {
                abort(403, 'Anda tidak memiliki izin memindahkan catatan ke folder ini.');
            }
        }

        // If category is regular, clear task deadline & reminder
        if (isset($validated['category']) && $validated['category'] === 'regular') {
            $validated['deadline_at'] = null;
            $validated['reminder_days_before'] = null;
        }

        // If deadline changed, reset reminder_sent_at to allow re-scheduling
        if (array_key_exists('deadline_at', $validated) && $note->deadline_at != $validated['deadline_at']) {
            $validated['reminder_sent_at'] = null;
        }

        if (array_key_exists('is_public', $validated) && $validated['is_public'] && empty($note->public_token)) {
            $validated['public_token'] = 'note-'.Str::lower(Str::random(12));
        }

        $note->update($validated);

        ActivityLogger::log('UPDATE_NOTE', "Memperbarui catatan '{$note->title}'", $note);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Catatan berhasil disimpan.',
                'note' => $note->fresh(['attachments', 'collaborators.user', 'group']),
            ]);
        }

        return back()->with('success', 'Catatan berhasil diperbarui.');
    }

    /**
     * Dedicated endpoint for public sharing and custom shortlink management for Note.
     */
    public function updateSharing($id, Request $request)
    {
        $user = Auth::user();
        $note = Note::with('group.app')->findOrFail($id);

        if (! $user || $note->group->app->owner_id !== $user->id) {
            abort(403, 'Hanya pemilik yang dapat mengubah pengaturan sharing catatan ini.');
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

            // Check uniqueness in notes (excluding current note)
            $existsInNotes = Note::where('public_token', $customSlug)
                ->where('id', '!=', $note->id)
                ->exists();

            // Check uniqueness in note_groups
            $existsInGroups = NoteGroup::where('public_token', $customSlug)->exists();

            // Check uniqueness in note_apps
            $existsInApps = NoteApp::where('public_token', $customSlug)->exists();

            if ($existsInNotes || $existsInGroups || $existsInApps) {
                throw ValidationException::withMessages([
                    'custom_slug' => "Shortlink '{$customSlug}' sudah digunakan. Silakan gunakan shortlink lain.",
                ]);
            }

            $note->public_token = $customSlug;
        } elseif ($isPublic && empty($note->public_token)) {
            $note->public_token = 'note-'.Str::lower(Str::random(12));
        }

        $note->is_public = $isPublic;
        if ($isPublic) {
            $note->public_permission = $request->input('public_permission', $note->public_permission ?: 'read');
        }
        $note->save();

        ActivityLogger::log('UPDATE_NOTE_SHARING', "Memperbarui status sharing publik catatan '{$note->title}' (Publik: ".($isPublic ? 'Ya' : 'Tidak').", Akses: {$note->public_permission}, Shortlink: {$note->public_token})", $note);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'is_public' => $note->is_public,
                'public_permission' => $note->public_permission,
                'public_token' => $note->public_token,
                'share_url' => url('/s/'.$note->public_token),
                'message' => $isPublic
                    ? ($note->public_permission === 'edit'
                        ? 'Catatan dipublikasikan dengan Akses Penuh (Dapat Diedit)!'
                        : 'Catatan dipublikasikan dalam mode Hanya Baca (Read-Only)!')
                    : 'Catatan kini berstatus privat.',
            ]);
        }

        return back()->with('success', $isPublic ? 'Catatan berhasil dipublikasikan!' : 'Catatan kini berstatus privat.');
    }

    public function togglePin(Request $request, $id)
    {
        $user = Auth::user();
        $note = Note::with('group.app')->findOrFail($id);

        if (! $note->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin mengedit catatan ini.');
        }

        $note->is_pinned = ! $note->is_pinned;
        $note->save();

        ActivityLogger::log('PIN_NOTE', ($note->is_pinned ? 'Menyematkan' : 'Melepas sematan')." catatan '{$note->title}'", $note);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'is_pinned' => $note->is_pinned,
                'note' => $note->fresh(['attachments', 'collaborators.user', 'group']),
            ]);
        }

        return back()->with('success', $note->is_pinned ? 'Catatan disematkan.' : 'Sematan catatan dilepas.');
    }

    public function reorder(Request $request)
    {
        $user = Auth::user();
        $validated = $request->validate([
            'notes' => 'required|array',
            'notes.*.id' => 'required|string|exists:notes,id',
            'notes.*.sort_order' => 'required|integer',
            'notes.*.is_pinned' => 'nullable|boolean',
        ]);

        foreach ($validated['notes'] as $item) {
            $note = Note::with('group.app')->find($item['id']);
            if ($note && $note->canUserEdit($user)) {
                $updateData = ['sort_order' => $item['sort_order']];
                if (array_key_exists('is_pinned', $item) && $item['is_pinned'] !== null) {
                    $updateData['is_pinned'] = $item['is_pinned'];
                }
                $note->update($updateData);
            }
        }

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, $id)
    {
        $user = Auth::user();
        $note = Note::with('group.app')->findOrFail($id);

        if (! $note->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin menghapus catatan ini.');
        }

        $appId = $note->group->note_app_id;
        $title = $note->title;

        // Delete attachments files
        foreach ($note->attachments as $attachment) {
            Storage::disk('public')->delete($attachment->file_path);
            $attachment->delete();
        }

        $note->delete();

        ActivityLogger::log('DELETE_NOTE', "Menghapus catatan '{$title}'");

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Catatan "'.$title.'" berhasil dihapus.',
            ]);
        }

        if (! $user) {
            return back()->with('success', 'Catatan "'.$title.'" berhasil dihapus.');
        }

        return redirect()->route('apps.show', $appId)->with('success', 'Catatan "'.$title.'" berhasil dihapus.');
    }

    public function uploadAttachments(Request $request, $id)
    {
        $user = Auth::user();
        $note = Note::with('group.app')->findOrFail($id);

        if (! $note->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin mengunggah file ke catatan ini.');
        }

        // Dynamic System Settings validation
        $settings = SystemSetting::getAll();
        $maxMb = $settings['max_file_size_mb'];
        $maxBytes = $maxMb * 1024 * 1024;
        $maxFiles = $settings['max_files_per_upload'];

        $allowedList = array_map('trim', explode(',', strtolower($settings['allowed_extensions'])));
        $blockedList = array_map('trim', explode(',', strtolower($settings['blocked_extensions'])));

        if (! $request->hasFile('files')) {
            return back()->with('error', 'Tidak ada file yang dipilih untuk diunggah.');
        }

        $uploadedFiles = $request->file('files');
        if (! is_array($uploadedFiles)) {
            $uploadedFiles = [$uploadedFiles];
        }

        if (count($uploadedFiles) > $maxFiles) {
            return back()->with('error', "Maksimal hanya {$maxFiles} file dalam satu kali upload.");
        }

        $savedAttachments = [];
        foreach ($uploadedFiles as $file) {
            $extension = strtolower($file->getClientOriginalExtension());
            $fileSize = $file->getSize();
            $clientName = $file->getClientOriginalName();

            // 1. Check blocked extensions
            if (in_array($extension, $blockedList)) {
                return back()->with('error', "Format file .{$extension} ({$clientName}) dilarang oleh Administrator demi keamanan.");
            }

            // 2. Check allowed extensions (if allowedList is not empty)
            if (! empty($allowedList) && ! in_array($extension, $allowedList)) {
                return back()->with('error', "Format file .{$extension} ({$clientName}) tidak diizinkan. Format yang diizinkan: ".implode(', ', $allowedList));
            }

            // 3. Check file size
            if ($fileSize > $maxBytes) {
                return back()->with('error', "Ukuran file '{$clientName}' ({$fileSize} bytes) melebihi batas maksimal {$maxMb} MB.");
            }

            // Store file
            $path = $file->store("attachments/{$note->id}", 'public');

            $attachment = NoteAttachment::create([
                'note_id' => $note->id,
                'file_name' => $clientName,
                'file_path' => $path,
                'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
                'file_size' => $fileSize,
            ]);

            $savedAttachments[] = $attachment;
        }

        ActivityLogger::log('UPLOAD_ATTACHMENT', 'Mengunggah '.count($savedAttachments)." file lampiran ke catatan '{$note->title}'", $note);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => count($savedAttachments).' file berhasil diunggah.',
                'attachments' => $note->fresh()->attachments,
            ]);
        }

        return back()->with('success', count($savedAttachments).' file berhasil diunggah.');
    }

    public function deleteAttachment(Request $request, $id, $attachmentId)
    {
        $user = Auth::user();
        $note = Note::with('group.app')->findOrFail($id);

        if (! $note->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin menghapus lampiran ini.');
        }

        $attachment = NoteAttachment::where('note_id', $note->id)->where('id', $attachmentId)->firstOrFail();
        $fileName = $attachment->file_name;
        Storage::disk('public')->delete($attachment->file_path);
        $attachment->delete();

        ActivityLogger::log('DELETE_ATTACHMENT', "Menghapus lampiran '{$fileName}' dari catatan '{$note->title}'", $note);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Lampiran berhasil dihapus.',
                'attachments' => $note->fresh()->attachments,
            ]);
        }

        return back()->with('success', 'Lampiran berhasil dihapus.');
    }

    public function addCollaborator(Request $request, $id)
    {
        $user = Auth::user();
        $note = Note::with('group.app')->findOrFail($id);

        if (! $note->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin mengundang kolaborator ke catatan ini.');
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
                'collaboratable_type' => Note::class,
                'collaboratable_id' => $note->id,
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
                'title' => '👥 Undangan Kolaborasi Catatan',
                'message' => $user->name.' mengundang Anda berkolaborasi khusus pada catatan "'.$note->title.'".',
                'type' => 'collaboration',
                'action_url' => route('notes.show', $note->id),
                'read_at' => null,
                'is_archived' => false,
            ]);
        }

        ActivityLogger::log('INVITE_COLLABORATOR', "Mengundang {$validated['email']} sebagai kolaborator catatan '{$note->title}'", $note);

        return back()->with('success', 'Kolaborator khusus catatan ('.$validated['email'].') berhasil ditambahkan!');
    }

    public function removeCollaborator($id, $collabId)
    {
        $user = Auth::user();
        $note = Note::with('group.app')->findOrFail($id);

        if (! $note->canUserEdit($user)) {
            abort(403, 'Anda tidak memiliki izin menghapus kolaborator.');
        }

        $collab = Collaborator::where('collaboratable_type', Note::class)
            ->where('collaboratable_id', $note->id)
            ->where('id', $collabId)
            ->firstOrFail();

        $email = $collab->invited_email;
        $collab->delete();

        ActivityLogger::log('REMOVE_COLLABORATOR', "Menghapus akses kolaborator {$email} dari catatan '{$note->title}'", $note);

        return back()->with('success', 'Kolaborator catatan berhasil dihapus.');
    }

    public function previewAttachment($attachmentId)
    {
        $attachment = NoteAttachment::with('note.group.app')->findOrFail($attachmentId);
        $user = Auth::guard('web')->user();

        if (! $attachment->note || ! $attachment->note->canUserView($user)) {
            abort(403, 'Akses lampiran ditolak.');
        }

        $resolved = $this->resolveAttachmentPath($attachment);

        if (! $resolved) {
            abort(404, 'File lampiran tidak ditemukan di penyimpanan server.');
        }

        $mimeType = $this->resolveMimeType($attachment, $resolved['path'] ?? null);

        if ($resolved['type'] === 'disk') {
            return Storage::disk($resolved['disk'])->response(
                $resolved['path'],
                $attachment->file_name,
                [
                    'Content-Type' => $mimeType,
                    'X-Frame-Options' => 'SAMEORIGIN',
                ]
            );
        }

        return response()->file($resolved['path'], [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="'.str_replace('"', '\"', $attachment->file_name).'"',
            'X-Frame-Options' => 'SAMEORIGIN',
        ]);
    }

    public function downloadAttachment($attachmentId)
    {
        $attachment = NoteAttachment::with('note.group.app')->findOrFail($attachmentId);
        $user = Auth::guard('web')->user();

        if (! $attachment->note || ! $attachment->note->canUserView($user)) {
            abort(403, 'Akses unduhan ditolak.');
        }

        $resolved = $this->resolveAttachmentPath($attachment);

        if (! $resolved) {
            abort(404, 'File lampiran tidak ditemukan di penyimpanan server.');
        }

        $mimeType = $this->resolveMimeType($attachment, $resolved['path'] ?? null);

        if ($resolved['type'] === 'disk') {
            return Storage::disk($resolved['disk'])->download(
                $resolved['path'],
                $attachment->file_name,
                ['Content-Type' => $mimeType]
            );
        }

        return response()->download($resolved['path'], $attachment->file_name, [
            'Content-Type' => $mimeType,
        ]);
    }

    protected function resolveAttachmentPath(NoteAttachment $attachment): ?array
    {
        $rawPath = $attachment->file_path;
        if (empty($rawPath)) {
            return null;
        }

        $cleanPath = ltrim($rawPath, '/');
        $strippedPrefix = preg_replace('#^(public/|storage/)#', '', $cleanPath);

        $candidates = array_unique(array_filter([
            $rawPath,
            $cleanPath,
            $strippedPrefix,
            'attachments/'.$attachment->note_id.'/'.basename($rawPath),
        ]));

        foreach (['public', 'local'] as $disk) {
            foreach ($candidates as $cand) {
                if (Storage::disk($disk)->exists($cand)) {
                    return [
                        'type' => 'disk',
                        'disk' => $disk,
                        'path' => $cand,
                    ];
                }
            }
        }

        $directPaths = [
            storage_path('app/public/'.$rawPath),
            storage_path('app/public/'.$cleanPath),
            storage_path('app/public/'.$strippedPrefix),
            storage_path('app/'.$rawPath),
            storage_path('app/'.$cleanPath),
            public_path('storage/'.$rawPath),
            public_path('storage/'.$cleanPath),
            public_path('storage/'.$strippedPrefix),
            public_path($rawPath),
            public_path($cleanPath),
            storage_path('app/public/attachments/'.$attachment->note_id.'/'.basename($rawPath)),
        ];

        foreach ($directPaths as $dp) {
            if (file_exists($dp) && ! is_dir($dp)) {
                return [
                    'type' => 'file',
                    'path' => $dp,
                ];
            }
        }

        return null;
    }

    protected function resolveMimeType(NoteAttachment $attachment, ?string $filePath = null): string
    {
        $ext = strtolower(pathinfo($attachment->file_name, PATHINFO_EXTENSION));

        $mimeMap = [
            'pdf' => 'application/pdf',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'txt' => 'text/plain',
            'mp4' => 'video/mp4',
            'zip' => 'application/zip',
            'json' => 'application/json',
        ];

        if (isset($mimeMap[$ext])) {
            return $mimeMap[$ext];
        }

        if (! empty($attachment->mime_type) && $attachment->mime_type !== 'application/octet-stream') {
            return $attachment->mime_type;
        }

        if ($filePath && file_exists($filePath)) {
            $detected = @mime_content_type($filePath);
            if ($detected) {
                return $detected;
            }
        }

        return 'application/octet-stream';
    }

    public function setPersonalReminder(Request $request, $id)
    {
        $user = Auth::user();
        $note = Note::with('group.app')->findOrFail($id);

        if (! $note->canUserView($user)) {
            abort(403, 'Anda tidak memiliki akses ke catatan ini.');
        }

        $validated = $request->validate([
            'reminder_days_before' => 'nullable|integer|min:0|max:30',
            'custom_remind_at' => 'nullable|date',
        ]);

        if (! isset($validated['reminder_days_before']) && empty($validated['custom_remind_at'])) {
            return back()->with('error', 'Silakan tentukan waktu pengingat.');
        }

        $reminder = UserNoteReminder::updateOrCreate(
            [
                'user_id' => $user->id,
                'note_id' => $note->id,
            ],
            [
                'reminder_days_before' => $validated['reminder_days_before'] ?? null,
                'custom_remind_at' => $validated['custom_remind_at'] ?? null,
                'reminder_sent_at' => null,
            ]
        );

        ActivityLogger::log('SET_PERSONAL_REMINDER', "Menyetel pengingat pribadi untuk catatan '{$note->title}'", $note);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Pengingat pribadi Anda berhasil disimpan!',
                'reminder' => $reminder,
            ]);
        }

        return back()->with('success', 'Pengingat pribadi Anda berhasil disimpan!');
    }

    public function deletePersonalReminder(Request $request, $id)
    {
        $user = Auth::user();
        $note = Note::findOrFail($id);

        UserNoteReminder::where('user_id', $user->id)
            ->where('note_id', $note->id)
            ->delete();

        ActivityLogger::log('DELETE_PERSONAL_REMINDER', "Menghapus pengingat pribadi untuk catatan '{$note->title}'", $note);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Pengingat pribadi berhasil dibatalkan.',
            ]);
        }

        return back()->with('success', 'Pengingat pribadi berhasil dibatalkan.');
    }

    public function getPersonalReminder(Request $request, $id)
    {
        $user = Auth::user();
        $note = Note::with('group.app')->findOrFail($id);

        if (! $note->canUserView($user)) {
            abort(403, 'Anda tidak memiliki akses ke catatan ini.');
        }

        $reminder = UserNoteReminder::where('user_id', $user->id)
            ->where('note_id', $note->id)
            ->first();

        return response()->json([
            'success' => true,
            'reminder' => $reminder,
        ]);
    }
}
