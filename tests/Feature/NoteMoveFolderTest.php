<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoteMoveFolderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_can_move_note_to_another_folder(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Kuliah',
            'color_theme' => 'yellow',
            'public_token' => 'token-test-'.uniqid(),
        ]);

        $groupA = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Mata Kuliah A',
            'color' => '#FFDC58',
            'sort_order' => 1,
        ]);

        $groupB = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Mata Kuliah B',
            'color' => '#69D2E7',
            'sort_order' => 2,
        ]);

        $note = Note::create([
            'note_group_id' => $groupA->id,
            'title' => 'Tugas Makalah',
            'category' => 'regular',
            'content_json' => json_encode(['type' => 'text', 'html' => '<p>Isi makalah</p>', 'checklist' => []]),
        ]);

        $response = $this->actingAs($user, 'web')
            ->putJson("/notes/{$note->id}", [
                'note_group_id' => $groupB->id,
                'title' => 'Tugas Makalah',
            ]);

        $response->assertOk();
        $response->assertJson([
            'success' => true,
        ]);

        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'note_group_id' => $groupB->id,
        ]);
    }

    public function test_user_cannot_move_note_to_unauthorized_folder(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $appA = NoteApp::create([
            'owner_id' => $userA->id,
            'name' => 'Kuliah User A',
            'color_theme' => 'yellow',
            'public_token' => 'token-test-'.uniqid(),
        ]);

        $appB = NoteApp::create([
            'owner_id' => $userB->id,
            'name' => 'Kuliah User B',
            'color_theme' => 'yellow',
            'public_token' => 'token-test-'.uniqid(),
        ]);

        $groupA = NoteGroup::create([
            'note_app_id' => $appA->id,
            'name' => 'Folder A',
            'color' => '#FFDC58',
            'sort_order' => 1,
        ]);

        $groupB = NoteGroup::create([
            'note_app_id' => $appB->id,
            'name' => 'Folder B (Milik User B)',
            'color' => '#69D2E7',
            'sort_order' => 1,
            'is_public' => false,
        ]);

        $note = Note::create([
            'note_group_id' => $groupA->id,
            'title' => 'Catatan A',
            'category' => 'regular',
        ]);

        $response = $this->actingAs($userA, 'web')
            ->putJson("/notes/{$note->id}", [
                'note_group_id' => $groupB->id,
            ]);

        $response->assertForbidden();
    }
}
