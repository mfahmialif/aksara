<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\SavedSharedLink;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SavedSharedLinksTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_can_save_public_workspace_link(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Koleksi Kuliah Fisika',
            'color_theme' => 'yellow',
            'is_public' => true,
            'public_token' => 'fisika-kuliah-123',
        ]);

        $response = $this->actingAs($member, 'web')->postJson('/saved-links', [
            'item_type' => 'app',
            'item_id' => $app->id,
            'public_token' => $app->public_token,
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'saved' => true,
        ]);

        $this->assertDatabaseHas('saved_shared_links', [
            'user_id' => $member->id,
            'item_type' => 'app',
            'item_id' => $app->id,
            'note_app_id' => $app->id,
        ]);
    }

    public function test_user_can_save_public_group_and_note_links(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Ruang Kerja Utama',
            'color_theme' => 'purple',
            'is_public' => true,
            'public_token' => 'rk-utama-'.uniqid(),
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Topik Algoritma',
            'is_public' => true,
            'public_token' => 'algo-topic-'.uniqid(),
        ]);

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Catatan Binary Search',
            'is_public' => true,
            'public_token' => 'binary-search-'.uniqid(),
        ]);

        // Save Group
        $respGroup = $this->actingAs($member, 'web')->postJson('/saved-links', [
            'item_type' => 'group',
            'item_id' => $group->id,
        ]);
        $respGroup->assertStatus(200)->assertJson(['success' => true, 'saved' => true]);

        // Save Note
        $respNote = $this->actingAs($member, 'web')->postJson('/saved-links', [
            'item_type' => 'note',
            'item_id' => $note->id,
        ]);
        $respNote->assertStatus(200)->assertJson(['success' => true, 'saved' => true]);

        $this->assertDatabaseHas('saved_shared_links', [
            'user_id' => $member->id,
            'item_type' => 'group',
            'item_id' => $group->id,
        ]);

        $this->assertDatabaseHas('saved_shared_links', [
            'user_id' => $member->id,
            'item_type' => 'note',
            'item_id' => $note->id,
        ]);
    }

    public function test_saved_workspace_appears_in_all_and_saved_tabs(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $ownedApp = NoteApp::create([
            'owner_id' => $member->id,
            'name' => 'Aplikasi Pribadi',
            'color_theme' => 'sky',
        ]);

        $sharedApp = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Aplikasi Komunitas Publik',
            'color_theme' => 'coral',
            'is_public' => true,
            'public_token' => 'komunitas-'.uniqid(),
        ]);

        // Save the shared app
        SavedSharedLink::create([
            'user_id' => $member->id,
            'item_type' => 'app',
            'item_id' => $sharedApp->id,
            'note_app_id' => $sharedApp->id,
            'title' => $sharedApp->name,
            'share_url' => "/s/app/{$sharedApp->public_token}",
        ]);

        // Check tab 'all': should include both owned and saved apps
        $responseAll = $this->actingAs($member, 'web')->get('/app');
        $responseAll->assertStatus(200);
        $responseAll->assertInertia(fn (Assert $page) => $page
            ->component('Member/Workspace', false)
            ->where('counts.all', 2)
            ->where('counts.my_apps', 1)
            ->where('counts.saved', 1)
            ->has('apps.data', 2)
        );

        // Check tab 'saved': should only contain the saved app
        $responseSaved = $this->actingAs($member, 'web')->get('/app?type=saved');
        $responseSaved->assertStatus(200);
        $responseSaved->assertInertia(fn (Assert $page) => $page
            ->component('Member/Workspace', false)
            ->where('filters.type', 'saved')
            ->has('apps.data', 1)
            ->where('apps.data.0.id', $sharedApp->id)
            ->where('apps.data.0.is_saved', true)
        );
    }

    public function test_saved_links_search_functionality(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $savedApp1 = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Machine Learning Dasar',
            'description' => 'Materi Python & ML',
            'color_theme' => 'mint',
            'is_public' => true,
            'public_token' => 'ml-dasar-'.uniqid(),
        ]);

        $savedApp2 = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Desain Grafis UI UX',
            'description' => 'Figma dan Prototipe',
            'color_theme' => 'pink',
            'is_public' => true,
            'public_token' => 'uiux-'.uniqid(),
        ]);

        SavedSharedLink::create([
            'user_id' => $member->id,
            'item_type' => 'app',
            'item_id' => $savedApp1->id,
            'note_app_id' => $savedApp1->id,
            'title' => $savedApp1->name,
            'share_url' => "/s/app/{$savedApp1->public_token}",
        ]);

        SavedSharedLink::create([
            'user_id' => $member->id,
            'item_type' => 'app',
            'item_id' => $savedApp2->id,
            'note_app_id' => $savedApp2->id,
            'title' => $savedApp2->name,
            'share_url' => "/s/app/{$savedApp2->public_token}",
        ]);

        // Search 'Machine' in tab 'all'
        $response = $this->actingAs($member, 'web')->get('/app?search=Machine');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Member/Workspace', false)
            ->has('apps.data', 1)
            ->where('apps.data.0.name', 'Machine Learning Dasar')
        );

        // Search 'Figma' in tab 'saved'
        $responseSaved = $this->actingAs($member, 'web')->get('/app?type=saved&search=Figma');
        $responseSaved->assertStatus(200);
        $responseSaved->assertInertia(fn (Assert $page) => $page
            ->component('Member/Workspace', false)
            ->has('apps.data', 1)
            ->where('apps.data.0.name', 'Desain Grafis UI UX')
        );
    }

    public function test_user_can_unsave_link(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Data Science Project',
            'color_theme' => 'yellow',
            'is_public' => true,
            'public_token' => 'ds-project-'.uniqid(),
        ]);

        SavedSharedLink::create([
            'user_id' => $member->id,
            'item_type' => 'app',
            'item_id' => $app->id,
            'note_app_id' => $app->id,
            'title' => $app->name,
            'share_url' => "/s/app/{$app->public_token}",
        ]);

        $this->assertDatabaseHas('saved_shared_links', [
            'user_id' => $member->id,
            'item_id' => $app->id,
        ]);

        $response = $this->actingAs($member, 'web')->deleteJson('/saved-links', [
            'item_type' => 'app',
            'item_id' => $app->id,
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true, 'saved' => false]);

        $this->assertDatabaseMissing('saved_shared_links', [
            'user_id' => $member->id,
            'item_id' => $app->id,
        ]);
    }

    public function test_public_editor_passes_is_saved_prop(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();

        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Public Knowledge Hub',
            'color_theme' => 'purple',
            'is_public' => true,
            'public_token' => 'knowledge-hub-123',
        ]);

        // Before saving
        $resBefore = $this->actingAs($member, 'web')->get("/s/app/{$app->public_token}");
        $resBefore->assertStatus(200);
        $resBefore->assertInertia(fn (Assert $page) => $page
            ->component('Member/NoteEditor', false)
            ->where('is_saved', false)
            ->where('is_public_view', true)
        );

        // Save
        SavedSharedLink::create([
            'user_id' => $member->id,
            'item_type' => 'app',
            'item_id' => $app->id,
            'note_app_id' => $app->id,
            'title' => $app->name,
            'share_url' => "/s/app/{$app->public_token}",
        ]);

        // After saving
        $resAfter = $this->actingAs($member, 'web')->get("/s/app/{$app->public_token}");
        $resAfter->assertStatus(200);
        $resAfter->assertInertia(fn (Assert $page) => $page
            ->component('Member/NoteEditor', false)
            ->where('is_saved', true)
            ->where('is_public_view', true)
        );
    }
}
