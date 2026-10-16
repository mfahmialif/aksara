<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Collaborator;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CollaborativeNoteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test 1: Autentikasi Terpisah
     * Member guest cannot access /app and is redirected.
     * Admin has separate auth guard and login.
     */
    public function test_authentication_separation(): void
    {
        // Unauthenticated guest accessing /app is redirected to login/welcome
        $response = $this->get('/app');
        $response->assertRedirect('/login');

        // Unauthenticated guest accessing /admin is redirected to admin/login
        $adminProtected = $this->get('/admin');
        $adminProtected->assertRedirect('/admin/login');

        // Member login
        $user = User::first();
        $this->assertNotNull($user);

        $memberResponse = $this->actingAs($user, 'web')->get('/app');
        $memberResponse->assertStatus(200);

        // Admin login
        $admin = Admin::first();
        $this->assertNotNull($admin);

        $adminResponse = $this->actingAs($admin, 'admin')->get('/admin');
        $adminResponse->assertStatus(200);
    }

    /**
     * Test 2: Default & Override Pengingat (Acceptance Criteria 2)
     */
    public function test_default_and_override_reminder(): void
    {
        $user = User::where('email', 'budi.santoso@gmail.com')->first();
        $this->actingAs($user, 'web');

        // Update default reminder from 1 to 3
        $updatePref = $this->put('/settings/preferences', [
            'name' => 'Budi Santoso',
            'default_reminder_days' => 3,
        ]);
        $updatePref->assertSessionHasNoErrors();
        $user->refresh();
        $this->assertEquals(3, $user->default_reminder_days);

        // Create new task note in first group
        $group = NoteGroup::first();
        $createTask = $this->post("/groups/{$group->id}/notes", [
            'category' => 'task',
            'title' => 'Tugas Matematika',
        ]);
        $createTask->assertRedirect();

        $newTask = Note::where('title', 'Tugas Matematika')->first();
        $this->assertNotNull($newTask);
        $this->assertEquals(3, $newTask->reminder_days_before);

        // Override reminder for this specific task to 5
        $overrideResponse = $this->put("/notes/{$newTask->id}", [
            'title' => 'Tugas Matematika',
            'category' => 'task',
            'deadline_at' => now()->addDays(10)->format('Y-m-d H:i:s'),
            'reminder_days_before' => 5,
        ]);
        $overrideResponse->assertSessionHasNoErrors();

        $newTask->refresh();
        $this->assertEquals(5, $newTask->reminder_days_before);

        // Global default remains 3
        $user->refresh();
        $this->assertEquals(3, $user->default_reminder_days);
    }

    /**
     * Test 3: Isolasi Kolaborasi & Publikasi (Acceptance Criteria 3)
     */
    public function test_collaboration_and_publication_isolation(): void
    {
        $owner = User::where('email', 'budi.santoso@gmail.com')->first();
        $collaborator = User::where('email', 'doni.pratama@gmail.com')->first();

        // Find a note owned by Budi in a private app
        $app = NoteApp::where('owner_id', $owner->id)->where('is_public', false)->first();
        $group = $app->groups()->first();
        $note = Note::where('note_group_id', $group->id)->first();

        // Share only this specific note with Doni
        Collaborator::updateOrCreate([
            'collaboratable_type' => Note::class,
            'collaboratable_id' => $note->id,
            'invited_email' => $collaborator->email,
        ], [
            'user_id' => $collaborator->id,
            'permission' => 'edit',
        ]);

        // Doni can access the note
        $noteResponse = $this->actingAs($collaborator, 'web')->get("/notes/{$note->id}");
        $noteResponse->assertRedirect();

        // Doni CANNOT access the parent NoteApp
        $appResponse = $this->actingAs($collaborator, 'web')->get("/app/{$app->id}");
        $appResponse->assertStatus(403);

        // Public note view works in read-only mode
        $publicNote = Note::where('is_public', true)->first();
        $this->assertNotNull($publicNote);

        $publicResponse = $this->get("/s/note/{$publicNote->public_token}");
        $publicResponse->assertStatus(200);
    }

    /**
     * Test 4: Kepatuhan Batas File Admin (Acceptance Criteria 4)
     */
    public function test_admin_file_restrictions(): void
    {
        Storage::fake('public');
        $user = User::where('email', 'budi.santoso@gmail.com')->first();
        $this->actingAs($user, 'web');

        $note = Note::first();

        // Set admin policy: max size 5 MB and blocked extension includes zip
        SystemSetting::set('max_file_size_mb', 5);
        SystemSetting::set('blocked_extensions', 'exe,sh,bat,zip');

        // Attempt to upload a .zip file (blocked)
        $zipFile = UploadedFile::fake()->create('project.zip', 100);
        $zipResponse = $this->post("/notes/{$note->id}/attachments", [
            'files' => [$zipFile],
        ]);
        $zipResponse->assertSessionHas('error');

        // Attempt to upload file exceeding 5 MB
        $largeFile = UploadedFile::fake()->create('huge_document.pdf', 6 * 1024); // 6MB
        $largeResponse = $this->post("/notes/{$note->id}/attachments", [
            'files' => [$largeFile],
        ]);
        $largeResponse->assertSessionHas('error');

        // Allowed file under 5 MB
        $validFile = UploadedFile::fake()->create('diagram.png', 500); // 500KB
        $validResponse = $this->post("/notes/{$note->id}/attachments", [
            'files' => [$validFile],
        ]);
        $validResponse->assertSessionHas('success');
    }

    /**
     * Test 6: Google OAuth Redirect and Simulated Consent Flow
     */
    public function test_google_oauth_redirect_and_consent_login(): void
    {
        // 1. Redirect to Google without keys routes to consent screen
        $redirectResponse = $this->get('/auth/google/redirect');
        $redirectResponse->assertRedirect(route('auth.google.consent'));

        // 2. Consent page renders
        $consentResponse = $this->get('/auth/google/consent');
        $consentResponse->assertStatus(200);

        // 3. User selects an existing account to log in
        $existingUser = User::first();
        $loginResponse = $this->post('/auth/google/consent', [
            'user_id' => $existingUser->id,
        ]);
        $loginResponse->assertRedirect(route('apps.index'));
        $this->assertAuthenticatedAs($existingUser, 'web');

        // Logout
        $this->post('/logout');
        $this->assertGuest('web');

        // 4. User logs in with a new custom Google email
        $newLoginResponse = $this->post('/auth/google/consent', [
            'name' => 'Fauzi Rahmat',
            'email' => 'fauzi@example.com',
        ]);
        $newLoginResponse->assertRedirect(route('apps.index'));
        $this->assertAuthenticated('web');
        $this->assertDatabaseHas('users', ['email' => 'fauzi@example.com']);

        // 5. Direct admin login URL remains valid
        $adminLoginResponse = $this->get('/admin/login');
        $adminLoginResponse->assertStatus(200);
    }
}
