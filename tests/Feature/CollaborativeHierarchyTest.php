<?php

namespace Tests\Feature;

use App\Models\Collaborator;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CollaborativeHierarchyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_workspace_folder_and_note_collaboration_hierarchy(): void
    {
        $owner = User::factory()->create(['name' => 'Owner Alice', 'email' => 'alice@gmail.com']);
        $appCollab = User::factory()->create(['name' => 'Bob AppCollab', 'email' => 'bob@gmail.com']);
        $groupCollab = User::factory()->create(['name' => 'Charlie GroupCollab', 'email' => 'charlie@gmail.com']);
        $noteCollab = User::factory()->create(['name' => 'Doni NoteCollab', 'email' => 'doni@gmail.com']);
        $stranger = User::factory()->create(['name' => 'Eva Stranger', 'email' => 'eva@gmail.com']);

        // 1. Create Workspace
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Alice Workspace',
            'color_theme' => 'yellow',
            'is_public' => false,
            'public_token' => 'app-secret-1',
        ]);

        // 2. Create Folders
        $groupA = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Folder Alpha',
            'sort_order' => 1,
            'color' => '#FFDC58',
            'is_public' => false,
            'public_token' => 'group-alpha-1',
        ]);

        $groupB = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Folder Beta',
            'sort_order' => 2,
            'color' => '#69D2E7',
            'is_public' => false,
            'public_token' => 'group-beta-1',
        ]);

        // 3. Create Notes
        $noteA1 = Note::create([
            'note_group_id' => $groupA->id,
            'title' => 'Catatan Alpha 1',
            'category' => 'regular',
            'is_public' => false,
            'public_token' => 'note-a1',
        ]);

        $noteA2 = Note::create([
            'note_group_id' => $groupA->id,
            'title' => 'Catatan Alpha 2',
            'category' => 'task',
            'is_public' => false,
            'public_token' => 'note-a2',
        ]);

        $noteB1 = Note::create([
            'note_group_id' => $groupB->id,
            'title' => 'Catatan Beta 1',
            'category' => 'regular',
            'is_public' => false,
            'public_token' => 'note-b1',
        ]);

        // --- A. INVITE COLLABORATORS AT DIFFERENT LEVELS ---

        // Bob: invited at Workspace (App) level
        $this->actingAs($owner, 'web')
            ->post("/app/{$app->id}/collaborators", ['email' => $appCollab->email])
            ->assertRedirect();

        // Charlie: invited at Folder (Group Alpha) level
        $this->actingAs($owner, 'web')
            ->post("/groups/{$groupA->id}/collaborators", ['email' => $groupCollab->email])
            ->assertRedirect();

        // Doni: invited at Note (Note A1) level
        $this->actingAs($owner, 'web')
            ->post("/notes/{$noteA1->id}/collaborators", ['email' => $noteCollab->email])
            ->assertRedirect();

        // --- B. VERIFY INHERITANCE AND ACCESS PERMISSIONS ---

        // 1. Bob (App level):
        // Can edit app, all groups, and all notes
        $this->assertTrue($app->canUserEdit($appCollab));
        $this->assertTrue($groupA->canUserEdit($appCollab));
        $this->assertTrue($groupB->canUserEdit($appCollab));
        $this->assertTrue($noteA1->canUserEdit($appCollab));
        $this->assertTrue($noteB1->canUserEdit($appCollab));

        // When Bob opens /app/{app->id}, he gets full workspace
        $this->actingAs($appCollab, 'web')
            ->get("/app/{$app->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Member/NoteEditor', false)
                ->where('can_edit', true)
                ->where('is_collaborator', true)
            );

        // 2. Charlie (Folder Alpha level):
        // Can edit groupA and noteA1, noteA2, but CANNOT edit app or groupB or noteB1
        $this->assertFalse($app->canUserEdit($groupCollab));
        $this->assertTrue($groupA->canUserEdit($groupCollab));
        $this->assertFalse($groupB->canUserEdit($groupCollab));
        $this->assertTrue($noteA1->canUserEdit($groupCollab));
        $this->assertTrue($noteA2->canUserEdit($groupCollab));
        $this->assertFalse($noteB1->canUserEdit($groupCollab));

        // Charlie CANNOT open full app
        $this->actingAs($groupCollab, 'web')
            ->get("/app/{$app->id}")
            ->assertStatus(403);

        // Charlie CANNOT open groupB
        $this->actingAs($groupCollab, 'web')
            ->get("/groups/{$groupB->id}")
            ->assertStatus(403);

        // Charlie opening /groups/{groupA->id} gets isolated group view with full access
        $this->actingAs($groupCollab, 'web')
            ->get("/groups/{$groupA->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Member/NoteEditor', false)
                ->where('is_group_shared_view', true)
                ->where('can_edit', true)
                ->where('is_collaborator', true)
            );

        // 3. Doni (Note A1 level only):
        // Can edit noteA1 only
        $this->assertFalse($app->canUserEdit($noteCollab));
        $this->assertFalse($groupA->canUserEdit($noteCollab));
        $this->assertTrue($noteA1->canUserEdit($noteCollab));
        $this->assertFalse($noteA2->canUserEdit($noteCollab));

        // Doni opening /notes/{noteA1->id} gets isolated single note view (Public/PublicNote) with full access
        $this->actingAs($noteCollab, 'web')
            ->get("/notes/{$noteA1->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/PublicNote', false)
                ->where('can_edit', true)
                ->where('is_collaborator', true)
            );

        // Doni CANNOT access noteA2
        $this->actingAs($noteCollab, 'web')
            ->get("/notes/{$noteA2->id}")
            ->assertStatus(403);

        // Doni can edit noteA1 content (Full Access)
        $this->actingAs($noteCollab, 'web')
            ->put("/notes/{$noteA1->id}", [
                'title' => 'Catatan Alpha 1 Diupdate Doni',
                'category' => 'regular',
            ])
            ->assertRedirect();
        $this->assertDatabaseHas('notes', [
            'id' => $noteA1->id,
            'title' => 'Catatan Alpha 1 Diupdate Doni',
        ]);

        // Stranger Eva has NO access to anything
        $this->actingAs($stranger, 'web')->get("/app/{$app->id}")->assertStatus(403);
        $this->actingAs($stranger, 'web')->get("/groups/{$groupA->id}")->assertStatus(403);
        $this->actingAs($stranger, 'web')->get("/notes/{$noteA1->id}")->assertStatus(403);

        // --- C. ACTIVE COLLABORATORS API WITH ORIGIN LABELS ---
        // Inspecting active collaborators for Note A1:
        // Should contain Doni (Akses Khusus Catatan Ini), Charlie (Akses Melalui Folder), Bob (Akses Melalui Ruang Kerja)
        $collabResponse = $this->actingAs($owner, 'web')
            ->getJson("/collaborators/note/{$noteA1->id}");

        $collabResponse->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $collabs = $collabResponse->json('collaborators');
        $this->assertCount(3, $collabs);

        $emails = collect($collabs)->pluck('invited_email')->all();
        $this->assertContains('doni@gmail.com', $emails);
        $this->assertContains('charlie@gmail.com', $emails);
        $this->assertContains('bob@gmail.com', $emails);

        // Check origin labels and can_delete flags
        $doniItem = collect($collabs)->firstWhere('invited_email', 'doni@gmail.com');
        $this->assertEquals('Akses Khusus Catatan Ini', $doniItem['origin_label']);
        $this->assertTrue($doniItem['can_delete']);

        $charlieItem = collect($collabs)->firstWhere('invited_email', 'charlie@gmail.com');
        $this->assertStringContainsString('Folder', $charlieItem['origin_label']);
        $this->assertFalse($charlieItem['can_delete']);

        $bobItem = collect($collabs)->firstWhere('invited_email', 'bob@gmail.com');
        $this->assertEquals('Akses Melalui Ruang Kerja', $bobItem['origin_label']);
        $this->assertFalse($bobItem['can_delete']);

        // --- D. REMOVING FOLDER COLLABORATOR ---
        $groupCollabRecord = Collaborator::where('collaboratable_type', NoteGroup::class)
            ->where('collaboratable_id', $groupA->id)
            ->where('invited_email', 'charlie@gmail.com')
            ->first();

        $this->actingAs($owner, 'web')
            ->delete("/groups/{$groupA->id}/collaborators/{$groupCollabRecord->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('collaborators', [
            'id' => $groupCollabRecord->id,
        ]);

        // Charlie no longer has access to groupA
        $this->actingAs($groupCollab, 'web')
            ->get("/groups/{$groupA->id}")
            ->assertStatus(403);
    }
}
