<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicSharingAndShortlinkTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test toggling public status on a NoteApp.
     */
    public function test_user_can_toggle_public_for_app(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Workspace Pribadi',
            'color_theme' => 'yellow',
            'is_public' => false,
            'public_token' => null,
        ]);

        // Toggle to public via JSON
        $response = $this->actingAs($user, 'web')->postJson("/app/{$app->id}/share", [
            'is_public' => true,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'is_public' => true,
        ]);

        $app->refresh();
        $this->assertTrue($app->is_public);
        $this->assertNotEmpty($app->public_token);

        // Toggle back to private
        $responsePrivate = $this->actingAs($user, 'web')->postJson("/app/{$app->id}/share", [
            'is_public' => false,
        ]);

        $responsePrivate->assertStatus(200);
        $app->refresh();
        $this->assertFalse($app->is_public);
    }

    /**
     * Test setting custom shortlink for an app.
     */
    public function test_user_can_set_custom_shortlink_for_app(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Belajar Coding',
            'color_theme' => 'mint',
            'is_public' => false,
        ]);

        $customSlug = 'belajar-coding-laravel';

        $response = $this->actingAs($user, 'web')->postJson("/app/{$app->id}/share", [
            'is_public' => true,
            'custom_slug' => $customSlug,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'is_public' => true,
            'public_token' => $customSlug,
        ]);

        $app->refresh();
        $this->assertEquals($customSlug, $app->public_token);
        $this->assertTrue($app->is_public);

        // Universal route /s/{slug} should resolve
        $publicResponse = $this->get("/s/{$customSlug}");
        $publicResponse->assertStatus(200);
    }

    /**
     * Test duplicate shortlink is rejected.
     */
    public function test_duplicate_shortlink_is_rejected(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        NoteApp::create([
            'owner_id' => $user1->id,
            'name' => 'App Satu',
            'color_theme' => 'yellow',
            'public_token' => 'shortlink-keren',
            'is_public' => true,
        ]);

        $app2 = NoteApp::create([
            'owner_id' => $user2->id,
            'name' => 'App Dua',
            'color_theme' => 'sky',
            'is_public' => false,
        ]);

        $response = $this->actingAs($user2, 'web')->postJson("/app/{$app2->id}/share", [
            'is_public' => true,
            'custom_slug' => 'shortlink-keren',
        ]);

        $response->assertStatus(422);
    }

    /**
     * Test toggling public and setting custom shortlink on a Note.
     */
    public function test_user_can_toggle_public_and_set_custom_shortlink_for_note(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Dokumentasi',
            'color_theme' => 'purple',
        ]);
        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'General',
        ]);
        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Catatan Rahasia Sukses',
            'category' => 'regular',
            'is_public' => false,
        ]);

        $customNoteSlug = 'catatan-sukses-2026';

        $response = $this->actingAs($user, 'web')->postJson("/notes/{$note->id}/share", [
            'is_public' => true,
            'custom_slug' => $customNoteSlug,
        ]);

        $response->assertStatus(200);
        $note->refresh();
        $this->assertTrue($note->is_public);
        $this->assertEquals($customNoteSlug, $note->public_token);

        // Universal shortlink resolves note
        $publicResponse = $this->get("/s/{$customNoteSlug}");
        $publicResponse->assertStatus(200);
    }

    /**
     * Test slug availability check endpoint.
     */
    public function test_slug_availability_check(): void
    {
        $user = User::factory()->create();
        NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Taken App',
            'color_theme' => 'yellow',
            'public_token' => 'sudah-ada',
        ]);

        // Taken slug
        $takenResponse = $this->actingAs($user, 'web')->getJson('/share/check-slug?slug=sudah-ada');
        $takenResponse->assertStatus(200);
        $takenResponse->assertJson(['available' => false]);

        // Available slug
        $availResponse = $this->actingAs($user, 'web')->getJson('/share/check-slug?slug=masih-kosong-nih');
        $availResponse->assertStatus(200);
        $availResponse->assertJson(['available' => true]);

        // Reserved slug
        $reservedResponse = $this->actingAs($user, 'web')->getJson('/share/check-slug?slug=admin');
        $reservedResponse->assertStatus(200);
        $reservedResponse->assertJson(['available' => false]);
    }

    /**
     * Test updating public permission to 'edit' or 'read' for workspace and note.
     */
    public function test_user_can_set_public_permission_for_app_and_note(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Collab Board',
            'color_theme' => 'coral',
            'is_public' => true,
            'public_permission' => 'read',
            'public_token' => 'collab-board',
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'General',
        ]);

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Catatan Publik',
            'category' => 'regular',
            'is_public' => true,
            'public_permission' => 'read',
            'public_token' => 'catatan-publik-1',
        ]);

        // 1. Change workspace permission to 'edit'
        $appEditResp = $this->actingAs($user, 'web')->postJson("/app/{$app->id}/share", [
            'is_public' => true,
            'public_permission' => 'edit',
        ]);
        $appEditResp->assertStatus(200);
        $appEditResp->assertJson([
            'success' => true,
            'public_permission' => 'edit',
        ]);
        $this->assertEquals('edit', $app->fresh()->public_permission);

        // 2. Change note permission to 'edit'
        $noteEditResp = $this->actingAs($user, 'web')->postJson("/notes/{$note->id}/share", [
            'is_public' => true,
            'public_permission' => 'edit',
        ]);
        $noteEditResp->assertStatus(200);
        $noteEditResp->assertJson([
            'success' => true,
            'public_permission' => 'edit',
        ]);
        $this->assertEquals('edit', $note->fresh()->public_permission);
    }

    /**
     * Test guest cannot edit in public read-only mode.
     */
    public function test_guest_cannot_edit_when_public_permission_is_read(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Read Only App',
            'color_theme' => 'yellow',
            'is_public' => true,
            'public_permission' => 'read',
            'public_token' => 'read-only-app',
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Folder 1',
        ]);

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Catatan Hanya Baca',
            'category' => 'regular',
            'is_public' => false,
        ]);

        // Guest attempts to create note in read-only app -> 403
        $createResp = $this->postJson("/groups/{$group->id}/notes", [
            'title' => 'Catatan Liar Guest',
        ]);
        $createResp->assertStatus(403);

        // Guest attempts to update note in read-only app -> 403
        $updateResp = $this->putJson("/notes/{$note->id}", [
            'title' => 'Catatan Telah Dihack',
        ]);
        $updateResp->assertStatus(403);

        // Guest attempts to delete note in read-only app -> 403
        $deleteResp = $this->deleteJson("/notes/{$note->id}");
        $deleteResp->assertStatus(403);

        // Guest attempts to add folder in read-only app -> 403
        $folderResp = $this->postJson("/app/{$app->id}/groups", [
            'name' => 'Folder Baru Guest',
        ]);
        $folderResp->assertStatus(403);
    }

    /**
     * Test guest can edit, create, and delete in public edit mode.
     */
    public function test_guest_can_edit_create_and_delete_when_public_permission_is_edit(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Full Access App',
            'color_theme' => 'mint',
            'is_public' => true,
            'public_permission' => 'edit',
            'public_token' => 'full-access-app',
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Folder Bersama',
        ]);

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Catatan Awal',
            'category' => 'regular',
            'is_public' => false,
        ]);

        // 1. Guest can create a new note
        $createResp = $this->postJson("/groups/{$group->id}/notes", [
            'title' => 'Catatan Dibuat Oleh Guest',
            'category' => 'regular',
        ]);
        $createResp->assertStatus(200);
        $this->assertDatabaseHas('notes', [
            'note_group_id' => $group->id,
            'title' => 'Catatan Dibuat Oleh Guest',
        ]);

        // 2. Guest can update an existing note
        $updateResp = $this->putJson("/notes/{$note->id}", [
            'title' => 'Catatan Awal Diedit Guest',
        ]);
        $updateResp->assertStatus(200);
        $this->assertEquals('Catatan Awal Diedit Guest', $note->fresh()->title);

        // 3. Guest can toggle pin
        $pinResp = $this->postJson("/notes/{$note->id}/pin");
        $pinResp->assertStatus(200);
        $this->assertTrue($note->fresh()->is_pinned);

        // 4. Guest can add a folder
        $folderResp = $this->post("/app/{$app->id}/groups", [
            'name' => 'Folder Tambahan Guest',
            'color' => '#69D2E7',
        ]);
        $folderResp->assertStatus(302);
        $this->assertDatabaseHas('note_groups', [
            'note_app_id' => $app->id,
            'name' => 'Folder Tambahan Guest',
        ]);

        // 5. Guest can delete a note (returns 200 or 302 without redirecting to login)
        $deleteResp = $this->deleteJson("/notes/{$note->id}");
        $deleteResp->assertStatus(200);
        $this->assertDatabaseMissing('notes', ['id' => $note->id]);
    }

    /**
     * Test single note public permission edit vs read.
     */
    public function test_single_note_public_permission_edit_vs_read(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Private App Parent',
            'color_theme' => 'purple',
            'is_public' => false,
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Folder Private',
        ]);

        // Note 1: Public Read-Only
        $readNote = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Note Read Only',
            'is_public' => true,
            'public_permission' => 'read',
            'public_token' => 'single-read-note',
        ]);

        // Note 2: Public Editable
        $editNote = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Note Editable',
            'is_public' => true,
            'public_permission' => 'edit',
            'public_token' => 'single-edit-note',
        ]);

        // Unauthenticated visitor is redirected to login with intended URL preserved
        $guestResp = $this->get('/s/single-read-note');
        $guestResp->assertRedirect(route('login'));
        $guestResp->assertSessionHas('info');
        $this->assertEquals(url('/s/single-read-note'), session('url.intended'));

        // Authenticated visitor can view read-only note
        $viewer = User::factory()->create();
        $this->actingAs($viewer, 'web')->get('/s/single-read-note')->assertStatus(200);

        // Visitor cannot edit read-only note -> 403
        $this->putJson("/notes/{$readNote->id}", ['title' => 'Hacked'])->assertStatus(403);

        // Visitor visits editable note -> 200
        $this->get('/s/single-edit-note')->assertStatus(200);

        // Visitor edits editable note -> 200
        $this->putJson("/notes/{$editNote->id}", ['title' => 'Note Edited By Visitor'])->assertStatus(200);
        $this->assertEquals('Note Edited By Visitor', $editNote->fresh()->title);
    }

    /**
     * Test unauthenticated visitor is redirected to login page with session url.intended and redirected back after login.
     */
    public function test_unauthenticated_visitor_redirected_to_login_and_back_after_login(): void
    {
        $owner = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Koleksi Buku',
            'is_public' => true,
            'public_permission' => 'read',
            'public_token' => 'koleksi-buku-2026',
        ]);

        $publicUrl = '/s/koleksi-buku-2026';

        // 1. Unauthenticated visitor visits public workspace
        $guestResponse = $this->get($publicUrl);
        $guestResponse->assertRedirect(route('login'));
        $guestResponse->assertSessionHas('info');
        $this->assertEquals(url($publicUrl), session('url.intended'));

        // 2. Visitor logs in via devLogin
        $visitor = User::factory()->create(['email' => 'visitor@example.com']);
        $loginResponse = $this->post('/auth/dev-login', [
            'email' => $visitor->email,
        ]);

        // Should redirect back to intended public URL
        $loginResponse->assertRedirect(url($publicUrl));

        // 3. Now authenticated, visitor can access the public workspace
        $appResponse = $this->actingAs($visitor, 'web')->get($publicUrl);
        $appResponse->assertStatus(200);
    }

    /**
     * Test toggling public and custom shortlink for NoteGroup (per-group sharing).
     */
    public function test_user_can_toggle_public_and_set_custom_shortlink_for_group(): void
    {
        $owner = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Workspace Proyek',
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Dokumentasi Sprint',
        ]);

        $groupSlug = 'sprint-documentation';

        // Toggle public and set custom shortlink for group
        $response = $this->actingAs($owner, 'web')->postJson("/groups/{$group->id}/share", [
            'is_public' => true,
            'public_permission' => 'edit',
            'custom_slug' => $groupSlug,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'is_public' => true,
            'public_permission' => 'edit',
            'public_token' => $groupSlug,
        ]);

        $group->refresh();
        $this->assertTrue($group->is_public);
        $this->assertEquals('edit', $group->public_permission);
        $this->assertEquals($groupSlug, $group->public_token);

        // Universal route /s/{slug} resolves the group when authenticated
        $viewer = User::factory()->create();
        $groupResponse = $this->actingAs($viewer, 'web')->get("/s/{$groupSlug}");
        $groupResponse->assertStatus(200);
        $groupResponse->assertInertia(fn ($page) => $page
            ->component('Member/NoteEditor', false)
            ->where('is_group_shared_view', true)
            ->where('can_edit', true)
            ->where('selected_group.id', $group->id)
        );
    }

    /**
     * Test per-group sharing isolation and link-centric permission rules.
     */
    public function test_per_group_sharing_scope_and_link_centric_permissions(): void
    {
        $owner = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Aplikasi Multi Folder',
            'is_public' => false, // App itself is private!
        ]);

        // Group A: Shared read-only
        $groupA = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Folder A Publik Read Only',
            'is_public' => true,
            'public_permission' => 'read',
            'public_token' => 'folder-a-read',
        ]);

        $noteA = Note::create([
            'note_group_id' => $groupA->id,
            'title' => 'Catatan di Folder A',
            'category' => 'regular',
        ]);

        // Group B: Private, not shared
        $groupB = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Folder B Privat Rahasia',
            'is_public' => false,
        ]);

        $noteB = Note::create([
            'note_group_id' => $groupB->id,
            'title' => 'Catatan Rahasia B',
            'category' => 'regular',
        ]);

        $viewer = User::factory()->create();

        // 1. Viewer visits Folder A via /s/folder-a-read
        $response = $this->actingAs($viewer, 'web')->get('/s/folder-a-read');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Member/NoteEditor', false)
            ->where('is_group_shared_view', true)
            ->where('can_edit', false)
            ->has('groups', 1) // ONLY Group A is passed to frontend!
            ->where('groups.0.id', $groupA->id)
        );

        // 2. Viewer cannot edit or create notes in Folder A (read-only) -> 403
        $editResp = $this->actingAs($viewer, 'web')->putJson("/notes/{$noteA->id}", [
            'title' => 'Mencoba Edit Folder Read Only',
        ]);
        $editResp->assertStatus(403);

        // 3. Update Folder A to 'edit'
        $groupA->update(['public_permission' => 'edit']);

        // 4. Now viewer visits Folder A and can edit notes in Folder A
        $responseEdit = $this->actingAs($viewer, 'web')->get('/s/folder-a-read');
        $responseEdit->assertStatus(200);
        $responseEdit->assertInertia(fn ($page) => $page
            ->where('can_edit', true)
        );

        $validEditResp = $this->actingAs($viewer, 'web')->putJson("/notes/{$noteA->id}", [
            'title' => 'Berhasil Diedit Pengguna Publik',
        ]);
        $validEditResp->assertStatus(200);
        $this->assertEquals('Berhasil Diedit Pengguna Publik', $noteA->fresh()->title);

        // 5. Notes in Folder B remain completely inaccessible and hidden
        $illegalEditResp = $this->actingAs($viewer, 'web')->putJson("/notes/{$noteB->id}", [
            'title' => 'Mencoba Menyusup ke Folder B',
        ]);
        $illegalEditResp->assertStatus(403);
    }

    /**
     * Test non-owner visitor cannot update sharing configuration (app, group, note) even in edit mode.
     */
    public function test_non_owner_visitor_cannot_update_sharing_configuration(): void
    {
        $owner = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Ruang Kerja Kolaboratif',
            'is_public' => true,
            'public_permission' => 'edit',
            'public_token' => 'collab-open-app',
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Folder Kolaboratif',
            'is_public' => true,
            'public_permission' => 'edit',
            'public_token' => 'collab-open-group',
        ]);

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Catatan Kolaboratif',
            'is_public' => true,
            'public_permission' => 'edit',
            'public_token' => 'collab-open-note',
        ]);

        $visitor = User::factory()->create();

        // 1. Visitor attempts to change app sharing settings -> 403
        $appShareResp = $this->actingAs($visitor, 'web')->postJson("/app/{$app->id}/share", [
            'is_public' => false,
        ]);
        $appShareResp->assertStatus(403);

        // 2. Visitor attempts to change group sharing settings -> 403
        $groupShareResp = $this->actingAs($visitor, 'web')->postJson("/groups/{$group->id}/share", [
            'is_public' => false,
        ]);
        $groupShareResp->assertStatus(403);

        // 3. Visitor attempts to change note sharing settings -> 403
        $noteShareResp = $this->actingAs($visitor, 'web')->postJson("/notes/{$note->id}/share", [
            'is_public' => false,
        ]);
        $noteShareResp->assertStatus(403);
    }

    /**
     * Test member login page renders for guests and redirects for authenticated users.
     */
    public function test_login_page_renders_for_guests_and_redirects_for_authenticated_users(): void
    {
        // 1. Unauthenticated visitor sees login page
        $this->get('/login')
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Public/Login'));

        // 2. Authenticated user visiting /login is redirected to apps.index
        $user = User::factory()->create();
        $this->actingAs($user, 'web')
            ->get('/login')
            ->assertRedirect(route('apps.index'));
    }
}
