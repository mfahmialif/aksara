<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteAttachment;
use App\Models\NoteGroup;
use App\Models\ReminderLog;
use App\Models\User;
use App\Models\UserNoteReminder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicNotePersonalReminderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_public_routes_and_share_aliases_work_without_404(): void
    {
        $owner = User::first();
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Public Test App',
            'is_public' => true,
            'public_token' => 'custom-app-token',
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'General Group',
            'sort_order' => 0,
        ]);

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Public Test Note',
            'category' => 'task',
            'is_public' => true,
            'public_token' => 'custom-note-token',
        ]);

        // Unauthenticated visitor is redirected to login page
        $this->get("/s/app/{$app->public_token}")
            ->assertRedirect(route('login'))
            ->assertSessionHas('info');
        $this->assertEquals(url("/s/app/{$app->public_token}"), session('url.intended'));

        $viewer = User::factory()->create();

        // Direct public routes render Member/NoteEditor in read-only mode when authenticated
        $this->actingAs($viewer, 'web')
            ->get("/s/app/{$app->public_token}")
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Member/NoteEditor', false)
                ->where('can_edit', false)
                ->where('is_public_view', true)
            );

        $this->actingAs($viewer, 'web')
            ->get("/s/note/{$note->public_token}")
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Public/PublicNote', false)
                ->where('can_edit', false)
                ->where('is_owner', false)
            );

        // Universal shortlink route
        $this->actingAs($viewer, 'web')
            ->get("/s/{$app->public_token}")
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Member/NoteEditor', false));

        $this->actingAs($viewer, 'web')
            ->get("/s/{$note->public_token}")
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Public/PublicNote', false));

        // Share backward-compatibility aliases
        $this->get("/share/app/{$app->public_token}")
            ->assertRedirect(route('public.app', ['slug_token' => $app->public_token]));

        $this->get("/share/note/{$note->public_token}")
            ->assertRedirect(route('public.note', ['slug_token' => $note->public_token]));
    }

    public function test_public_attachment_preview_and_download_work(): void
    {
        Storage::fake('public');

        $owner = User::first();
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Public App',
            'is_public' => true,
            'public_token' => 'pub-app-xyz',
        ]);
        $group = NoteGroup::create(['note_app_id' => $app->id, 'name' => 'Grp']);
        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Public Note with Attachment',
            'category' => 'regular',
            'is_public' => true,
            'public_token' => 'pub-note-xyz',
        ]);

        $fakeFile = UploadedFile::fake()->image('diagram.png');
        $storedPath = $fakeFile->store("attachments/{$note->id}", 'public');

        $attachment = NoteAttachment::create([
            'note_id' => $note->id,
            'file_name' => 'diagram.png',
            'file_path' => $storedPath,
            'mime_type' => 'image/png',
            'file_size' => 1024,
        ]);

        // Preview
        $previewRes = $this->get("/attachments/{$attachment->id}/preview");
        $previewRes->assertStatus(200);

        // Download
        $downloadRes = $this->get("/attachments/{$attachment->id}/download");
        $downloadRes->assertStatus(200);
        $downloadRes->assertDownload('diagram.png');
    }

    public function test_private_attachment_is_forbidden_for_guests(): void
    {
        Storage::fake('public');

        $owner = User::first();
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Private App',
            'is_public' => false,
            'public_token' => 'priv-app-xyz',
        ]);
        $group = NoteGroup::create(['note_app_id' => $app->id, 'name' => 'Grp']);
        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Private Note',
            'category' => 'regular',
            'is_public' => false,
            'public_token' => 'priv-note-xyz',
        ]);

        $fakeFile = UploadedFile::fake()->create('secret.pdf', 500);
        $storedPath = $fakeFile->store("attachments/{$note->id}", 'public');

        $attachment = NoteAttachment::create([
            'note_id' => $note->id,
            'file_name' => 'secret.pdf',
            'file_path' => $storedPath,
            'mime_type' => 'application/pdf',
            'file_size' => 500,
        ]);

        // Unauthenticated guest cannot view or download
        $this->get("/attachments/{$attachment->id}/preview")->assertStatus(403);
        $this->get("/attachments/{$attachment->id}/download")->assertStatus(403);

        // Authenticated owner can view and download private attachment
        $this->actingAs($owner, 'web');
        $ownerPreview = $this->get("/attachments/{$attachment->id}/preview");
        $ownerPreview->assertStatus(200);
        $ownerPreview->assertHeader('Content-Type', 'application/pdf');

        $ownerDownload = $this->get("/attachments/{$attachment->id}/download");
        $ownerDownload->assertStatus(200);
        $ownerDownload->assertDownload('secret.pdf');

        // Attachment model appended attributes
        $this->assertEquals("/attachments/{$attachment->id}/preview", $attachment->url);
        $this->assertEquals("/attachments/{$attachment->id}/preview", $attachment->preview_url);
        $this->assertEquals("/attachments/{$attachment->id}/download", $attachment->download_url);
        $this->assertTrue($attachment->is_pdf);

        // Storage fallback route
        $storageRes = $this->get("/storage/{$storedPath}");
        $storageRes->assertStatus(200);
    }

    public function test_user_can_set_and_delete_personal_reminder_on_public_note(): void
    {
        $owner = User::first();
        $visitor = User::factory()->create([
            'email' => 'visitor@example.com',
            'name' => 'Visitor User',
        ]);

        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Public Project',
            'is_public' => true,
            'public_token' => 'pub-proj',
        ]);
        $group = NoteGroup::create(['note_app_id' => $app->id, 'name' => 'Tasks']);
        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Deadline Task',
            'category' => 'task',
            'is_public' => true,
            'public_token' => 'task-token-123',
            'deadline_at' => Carbon::now()->addDays(5),
        ]);

        // 1. Guest is redirected
        $guestResponse = $this->postJson("/notes/{$note->id}/personal-reminder", [
            'reminder_days_before' => 2,
        ]);
        $guestResponse->assertStatus(401);

        // 2. Logged-in visitor sets personal reminder
        $authResponse = $this->actingAs($visitor, 'web')
            ->postJson("/notes/{$note->id}/personal-reminder", [
                'reminder_days_before' => 2,
            ]);

        $authResponse->assertStatus(200);
        $authResponse->assertJson([
            'success' => true,
            'message' => 'Pengingat pribadi Anda berhasil disimpan!',
        ]);

        $this->assertDatabaseHas('user_note_reminders', [
            'user_id' => $visitor->id,
            'note_id' => $note->id,
            'reminder_days_before' => 2,
            'reminder_sent_at' => null,
        ]);

        // 2b. Visitor fetches existing personal reminder
        $getResponse = $this->actingAs($visitor, 'web')
            ->getJson("/notes/{$note->id}/personal-reminder");
        $getResponse->assertStatus(200);
        $getResponse->assertJson([
            'success' => true,
            'reminder' => [
                'user_id' => $visitor->id,
                'note_id' => $note->id,
                'reminder_days_before' => 2,
            ],
        ]);

        // 3. Visitor deletes personal reminder
        $deleteResponse = $this->actingAs($visitor, 'web')
            ->deleteJson("/notes/{$note->id}/personal-reminder");

        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('user_note_reminders', [
            'user_id' => $visitor->id,
            'note_id' => $note->id,
        ]);
    }

    public function test_personal_reminder_is_isolated_and_dispatches_notifications_only_to_user(): void
    {
        $owner = User::first();
        $visitor = User::factory()->create([
            'email' => 'visitor-personal@example.com',
            'name' => 'Visitor Personal',
            'is_active' => true,
        ]);

        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Public App Shared',
            'is_public' => true,
            'public_token' => 'public-app-shared',
        ]);
        $group = NoteGroup::create(['note_app_id' => $app->id, 'name' => 'Sprint']);

        // Note deadline is tomorrow
        $deadline = Carbon::now()->addHours(12);

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Critical Release',
            'category' => 'task',
            'deadline_at' => $deadline,
            'reminder_days_before' => null, // Note owner has no reminder
            'reminder_sent_at' => null,
            'is_public' => true,
            'public_token' => 'release-token',
        ]);

        // Visitor sets a personal reminder (1 day before)
        $reminder = UserNoteReminder::create([
            'user_id' => $visitor->id,
            'note_id' => $note->id,
            'reminder_days_before' => 1,
            'reminder_sent_at' => null,
        ]);

        // Run the console command
        $this->artisan('notes:send-reminders')->assertSuccessful();

        // 1. Visitor received AppNotification
        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $visitor->id,
            'type' => 'reminder',
        ]);

        // 2. ReminderLog is logged for visitor
        $this->assertDatabaseHas('reminder_logs', [
            'note_id' => $note->id,
            'recipient_email' => $visitor->email,
            'status' => 'sent',
        ]);

        // 3. UserNoteReminder is marked as sent
        $reminder->refresh();
        $this->assertNotNull($reminder->reminder_sent_at);

        // 4. Note owner did NOT receive personal reminder notification
        $ownerNotification = AppNotification::where('user_id', $owner->id)
            ->where('title', 'like', '%Critical Release%')
            ->first();
        $this->assertNull($ownerNotification);

        // 5. Note's original reminder_sent_at remains NULL
        $note->refresh();
        $this->assertNull($note->reminder_sent_at);
    }
}
