<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkspaceDuplicateAndSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_can_duplicate_workspace_with_all_groups_and_notes(): void
    {
        $owner = User::factory()->create();
        $user = User::factory()->create();

        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'MMPI ONLINE',
            'color_theme' => 'yellow',
            'is_public' => true,
            'public_permission' => 'edit',
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Psikodiagnostik',
            'color' => '#FFDC58',
        ]);

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Skala Validitas',
            'content_json' => json_encode(['html' => '<p>Skala L, F, K...</p>']),
            'category' => 'regular',
        ]);

        $response = $this->actingAs($user, 'web')->postJson("/app/{$app->id}/duplicate", [
            'name' => 'MMPI ONLINE - PUNYAKU',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);

        $duplicatedAppId = $response->json('app.id');
        $this->assertNotNull($duplicatedAppId);

        $this->assertDatabaseHas('note_apps', [
            'id' => $duplicatedAppId,
            'owner_id' => $user->id,
            'name' => 'MMPI ONLINE - PUNYAKU',
            'cloned_from_id' => $app->id,
        ]);

        $this->assertDatabaseHas('note_groups', [
            'note_app_id' => $duplicatedAppId,
            'name' => 'Psikodiagnostik',
            'cloned_from_id' => $group->id,
        ]);

        $this->assertDatabaseHas('notes', [
            'title' => 'Skala Validitas',
            'cloned_from_id' => $note->id,
        ]);

        $app->refresh();
        $this->assertEquals(1, $app->clone_count);
    }

    public function test_owner_can_see_active_clones_and_deleted_clones_are_omitted(): void
    {
        $owner = User::factory()->create(['name' => 'Dr. Master']);
        $user1 = User::factory()->create(['name' => 'Mahasiswa 1']);
        $user2 = User::factory()->create(['name' => 'Mahasiswa 2']);

        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Master App',
            'color_theme' => 'yellow',
            'is_public' => true,
        ]);

        // User 1 duplicates
        $this->actingAs($user1, 'web')->postJson("/app/{$app->id}/duplicate", [
            'name' => 'Clone 1',
        ]);

        // User 2 duplicates
        $res2 = $this->actingAs($user2, 'web')->postJson("/app/{$app->id}/duplicate", [
            'name' => 'Clone 2',
        ]);
        $clone2Id = $res2->json('app.id');

        // Owner checks active clones
        $response = $this->actingAs($owner, 'web')->getJson("/app/{$app->id}/clones");
        $response->assertOk();
        $clones = $response->json('clones');
        $this->assertCount(2, $clones);

        // User 2 deletes their clone
        $this->actingAs($user2, 'web')->deleteJson("/app/{$clone2Id}");

        // Owner checks clones again -> only 1 active clone remains
        $responseAfterDelete = $this->actingAs($owner, 'web')->getJson("/app/{$app->id}/clones");
        $responseAfterDelete->assertOk();
        $clonesAfter = $responseAfterDelete->json('clones');
        $this->assertCount(1, $clonesAfter);
        $this->assertEquals('Clone 1', $clonesAfter[0]['name']);

        // Lifetime clone count on master remains 2
        $app->refresh();
        $this->assertEquals(2, $app->clone_count);
    }

    public function test_sync_targets_are_strictly_isolated_to_logged_in_user(): void
    {
        $owner = User::factory()->create();
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $masterApp = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Public Master',
            'color_theme' => 'yellow',
            'is_public' => true,
        ]);

        // User A duplicates twice
        $this->actingAs($userA, 'web')->postJson("/app/{$masterApp->id}/duplicate", [
            'name' => 'User A Copy 1',
        ]);
        $resA2 = $this->actingAs($userA, 'web')->postJson("/app/{$masterApp->id}/duplicate", [
            'name' => 'User A Copy 2',
        ]);
        $copyA2Id = $resA2->json('app.id');

        // User B duplicates once
        $this->actingAs($userB, 'web')->postJson("/app/{$masterApp->id}/duplicate", [
            'name' => 'User B Copy Secret',
        ]);

        // User A requests sync targets for their Copy 2
        $response = $this->actingAs($userA, 'web')->getJson("/app/{$copyA2Id}/sync-targets");
        $response->assertOk();
        $targets = $response->json('targets');

        // Targets should include Master App and User A's Copy 1
        $targetNames = array_column($targets, 'name');
        $this->assertContains('Public Master', $targetNames);
        $this->assertContains('User A Copy 1', $targetNames);

        // User B's copy must NEVER appear for User A
        $this->assertNotContains('User B Copy Secret', $targetNames);
    }

    public function test_sync_diff_and_apply_actions(): void
    {
        $owner = User::factory()->create();
        $user = User::factory()->create();

        $masterApp = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Master App',
            'color_theme' => 'yellow',
            'is_public' => true,
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $masterApp->id,
            'name' => 'Bab 1',
            'color' => '#FFDC58',
        ]);

        $note1 = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Catatan 1',
            'content_json' => json_encode(['html' => '<p>Versi awal</p>']),
            'category' => 'regular',
        ]);

        // User duplicates
        $duplicateRes = $this->actingAs($user, 'web')->postJson("/app/{$masterApp->id}/duplicate", [
            'name' => 'User Copy',
        ]);
        $userAppId = $duplicateRes->json('app.id');

        // Master modifies Note 1
        $note1->update(['content_json' => json_encode(['html' => '<p>Versi diperbarui master!</p>'])]);

        // Master adds Note 2
        $note2 = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Catatan 2',
            'content_json' => json_encode(['html' => '<p>Catatan baru di master</p>']),
            'category' => 'regular',
        ]);

        // User checks diff pulling from master into user copy
        $diffRes = $this->actingAs($user, 'web')->postJson("/app/{$userAppId}/sync-diff", [
            'source_app_id' => $masterApp->id,
            'target_app_id' => $userAppId,
        ]);

        $diffRes->assertOk();
        $diffItems = $diffRes->json('diff');

        // Diff should contain 2 items: Catatan 1 (modified) and Catatan 2 (new)
        $this->assertCount(2, $diffItems);

        // Find diff item for note1 and note2
        $note1Diff = collect($diffItems)->firstWhere('source_note_id', $note1->id);
        $note2Diff = collect($diffItems)->firstWhere('source_note_id', $note2->id);

        $this->assertEquals('modified', $note1Diff['status']);
        $this->assertEquals('new', $note2Diff['status']);

        // Apply sync: 'create_new' for Note 1, 'add' for Note 2
        $applyRes = $this->actingAs($user, 'web')->postJson("/app/{$userAppId}/sync-apply", [
            'source_app_id' => $masterApp->id,
            'target_app_id' => $userAppId,
            'actions' => [
                [
                    'source_note_id' => $note1->id,
                    'target_note_id' => $note1Diff['target_note_id'],
                    'action' => 'create_new',
                ],
                [
                    'source_note_id' => $note2->id,
                    'target_note_id' => null,
                    'action' => 'add',
                ],
            ],
        ]);

        $applyRes->assertOk();
        $applyRes->assertJsonPath('success', true);

        // In user copy:
        // Group 'Bab 1' should now have:
        // 1. Original User Copy of Catatan 1 ("Versi awal")
        // 2. Created new clone of Note 1 ("Catatan 1 (Salinan Sync)" with "Versi diperbarui master!")
        // 3. New Note 2 ("Catatan 2" with "Catatan baru di master")
        $userNotes = Note::whereHas('group', function ($q) use ($userAppId) {
            $q->where('note_app_id', $userAppId);
        })->get();

        $this->assertCount(3, $userNotes);

        $titles = $userNotes->pluck('title')->toArray();
        $this->assertContains('Catatan 1', $titles);
        $this->assertContains('Catatan 1 (Salinan Sync)', $titles);
        $this->assertContains('Catatan 2', $titles);
    }
}
