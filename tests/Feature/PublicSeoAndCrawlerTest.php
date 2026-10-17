<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicSeoAndCrawlerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_whatsapp_crawler_receives_rich_og_tags_without_login_redirect(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Kuliah Kedokteran Gigi',
            'is_public' => true,
            'public_token' => 'med-workspace',
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Anatomi Gigi',
            'is_public' => true,
            'public_token' => 'anatomi-1',
        ]);

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Struktur Rahang Bawah',
            'content_json' => json_encode(['html' => '<p>Pembahasan detail mengenai persarafan mandibularis dan struktur gigi molar.</p>']),
            'is_public' => true,
            'public_token' => 'mmpi1',
        ]);

        // WhatsApp User Agent crawler request to shortlink /s/mmpi1
        $response = $this->withHeaders([
            'User-Agent' => 'WhatsApp/2.24.5.77 A',
        ])->get('/s/mmpi1');

        $response->assertOk();
        $response->assertSee('<meta property="og:site_name" content="Aksara Notes">', false);
        $response->assertSee('Struktur Rahang Bawah — Aksara Notes', false);
        $response->assertSee('persarafan mandibularis', false);
        $response->assertSee('<meta property="og:image"', false);
    }

    public function test_human_browser_is_redirected_to_login_for_public_note(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Work',
            'is_public' => true,
            'public_token' => 'work-app',
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Tasks',
            'is_public' => true,
            'public_token' => 'tasks-group',
        ]);

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Secret Plan',
            'is_public' => true,
            'public_token' => 'plan1',
        ]);

        // Regular browser User Agent
        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ])->get('/s/plan1');

        $response->assertRedirect(route('login'));
    }

    public function test_crawler_can_unfurl_public_workspace_og_tags(): void
    {
        $user = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Psikotes & MMPI',
            'description' => 'Panduan lengkap tes inventori kepribadian multifasik.',
            'is_public' => true,
            'public_token' => 'mmpi-app',
        ]);

        // Facebook crawler
        $response = $this->withHeaders([
            'User-Agent' => 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        ])->get('/s/mmpi-app');

        $response->assertOk();
        $response->assertSee('Psikotes &amp; MMPI — Ruang Kerja Aksara', false);
        $response->assertSee('Panduan lengkap tes inventori kepribadian', false);
        $response->assertSee('<meta property="og:image"', false);
    }

    public function test_welcome_page_has_valid_og_meta_tags(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertSee('<meta property="og:site_name" content="Aksara Notes">', false);
        $response->assertSee('<meta name="twitter:card" content="summary_large_image">', false);
        $response->assertSee('og-image.png', false);
    }
}
