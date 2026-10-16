<?php

namespace Tests\Feature;

use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoteGroupColorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_can_create_folder_with_custom_color(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Test App',
            'color_theme' => 'yellow',
            'public_token' => 'token-test-'.uniqid(),
        ]);

        $response = $this->actingAs($user, 'web')->post("/app/{$app->id}/groups", [
            'name' => 'Proyek Rahasia',
            'color' => '#69D2E7',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('note_groups', [
            'note_app_id' => $app->id,
            'name' => 'Proyek Rahasia',
            'color' => '#69D2E7',
        ]);
    }

    public function test_user_can_update_folder_name_and_color(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Test App',
            'color_theme' => 'yellow',
            'public_token' => 'token-test-'.uniqid(),
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Folder Lama',
            'color' => '#FFDC58',
            'sort_order' => 1,
        ]);

        $response = $this->actingAs($user, 'web')->put("/groups/{$group->id}", [
            'name' => 'Folder Baru Renamed',
            'color' => '#FF8FAB',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('note_groups', [
            'id' => $group->id,
            'name' => 'Folder Baru Renamed',
            'color' => '#FF8FAB',
        ]);
    }
}
