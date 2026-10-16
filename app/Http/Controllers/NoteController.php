<?php

namespace App\Http\Controllers;

use App\Models\AppNotification;
use App\Models\Collaborator;
use App\Models\Note;
use App\Models\NoteAttachment;
use App\Models\NoteGroup;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
            $reminderDays = $user->default_reminder_days ?: 1;
        }

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => $request->input('title', 'Catatan Baru'),
            'category' => $category,
            'content_json' => json_encode([
                'html' => '<p>Mulai menulis catatan Anda di sini...</p>',
                'checklist' => [],
            ]),
            'drawing_data' => null,
            'deadline_at' => $category === 'task' ? now()->addDays(3)->setHour(23)->setMinute(59) : null,
            'reminder_days_before' => $reminderDays,
            'is_public' => false,
            'public_token' => 'note-'.Str::random(24),
        ]);

        ActivityLogger::log('CREATE_NOTE', "Membuat catatan '{$note->title}' dalam grup '{$group->name}'", $note);

        return redirect()->route('apps.show', [
            'app' => $group->note_app_id,
            'note_id' => $note->id,
        ])->with('success', 'Catatan baru berhasil dibuat!');
    }

    public function show($id)
    {
        $user = Auth::user();
        $note = Note::with(['group.app.owner', 'attachments', 'collaborators.user'])->findOrFail($id);

        if (! $note->canUserView($user)) {
            abort(403, 'Anda tidak memiliki hak akses ke catatan ini.');
        }

        return redirect()->route('apps.show', [
            'app' => $note->group->note_app_id,
            'note_id' => $note->id,
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
            'title' => 'required|string|max:255',
            'category' => 'required|in:regular,task',
            'content_json' => 'nullable|string',
            'drawing_data' => 'nullable|string',
            'deadline_at' => 'nullable|date',
            'reminder_days_before' => 'nullable|integer|min:0|max:30',
            'is_public' => 'boolean',
        ]);

        // If category is regular, clear task deadline & reminder
        if ($validated['category'] === 'regular') {
            $validated['deadline_at'] = null;
            $validated['reminder_days_before'] = null;
        }

        // If deadline changed, reset reminder_sent_at to allow re-scheduling
        if ($note->deadline_at != $validated['deadline_at']) {
            $validated['reminder_sent_at'] = null;
        }

        if (empty($note->public_token)) {
            $validated['public_token'] = 'note-'.Str::random(24);
        }

        $note->update($validated);

        ActivityLogger::log('UPDATE_NOTE', "Memperbarui catatan '{$note->title}'", $note);

        return back()->with('success', 'Catatan berhasil disimpan.');
    }

    public function destroy($id)
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

        return back()->with('success', count($savedAttachments).' file berhasil diunggah.');
    }

    public function deleteAttachment($id, $attachmentId)
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
}
