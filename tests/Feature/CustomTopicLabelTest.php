<?php

namespace Tests\Feature;

use App\Models\NoteApp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomTopicLabelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_can_create_app_with_custom_topic_label(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'web')->post('/app', [
            'name' => 'Kuliah Semester 5',
            'description' => 'Koleksi catatan perkuliahan',
            'color_theme' => 'yellow',
            'topic_label' => 'Mata Kuliah',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('note_apps', [
            'name' => 'Kuliah Semester 5',
            'owner_id' => $user->id,
            'topic_label' => 'Mata Kuliah',
        ]);
    }

    public function test_app_defaults_to_topik_when_topic_label_is_not_provided(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'web')->post('/app', [
            'name' => 'Ruang Kerja Default',
            'description' => 'Tanpa custom topic label',
            'color_theme' => 'purple',
        ]);

        $response->assertRedirect();
        $app = NoteApp::where('name', 'Ruang Kerja Default')->first();
        $this->assertNotNull($app);
        $this->assertEquals('Topik', $app->topic_label);
    }

    public function test_owner_can_update_topic_label_via_json_request(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Proyek Startup',
            'color_theme' => 'yellow',
            'topic_label' => 'Topik',
        ]);

        $response = $this->actingAs($user, 'web')->putJson("/app/{$app->id}", [
            'name' => 'Proyek Startup',
            'description' => 'Catatan proyek',
            'topic_label' => 'Modul',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'app' => [
                'topic_label' => 'Modul',
            ],
        ]);

        $app->refresh();
        $this->assertEquals('Modul', $app->topic_label);
    }

    public function test_public_shared_app_provides_custom_topic_label_to_authenticated_viewer(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();

        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Silabus Pemrograman',
            'color_theme' => 'mint',
            'is_public' => true,
            'public_token' => 'custom-term-slug',
            'public_permission' => 'readonly',
            'topic_label' => 'Bab',
        ]);

        $response = $this->actingAs($viewer, 'web')->get('/s/app/custom-term-slug');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Member/NoteEditor', false)
            ->has('app')
            ->where('app.topic_label', 'Bab')
        );
    }
}
