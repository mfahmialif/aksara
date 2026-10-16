<?php

namespace Tests\Feature;

use App\Models\Collaborator;
use App\Models\NoteApp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WorkspacePaginationAndFilterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test workspace pagination works and limits to 9 items per page with query string.
     */
    public function test_workspace_pagination(): void
    {
        $user = User::factory()->create();

        // Create 15 note apps for this user
        for ($i = 1; $i <= 15; $i++) {
            NoteApp::create([
                'owner_id' => $user->id,
                'name' => "Workspace App {$i}",
                'color_theme' => 'yellow',
                'description' => "Description for app {$i}",
                'public_token' => "token-{$i}-".uniqid(),
            ]);
        }

        // Page 1
        $response = $this->actingAs($user, 'web')->get('/app');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Member/Workspace', false)
            ->has('apps.data', 9)
            ->where('apps.current_page', 1)
            ->where('apps.total', 15)
            ->where('apps.last_page', 2)
            ->where('filters.page', 1)
        );

        // Page 2
        $responsePage2 = $this->actingAs($user, 'web')->get('/app?page=2');
        $responsePage2->assertStatus(200);
        $responsePage2->assertInertia(fn (Assert $page) => $page
            ->component('Member/Workspace', false)
            ->has('apps.data', 6)
            ->where('apps.current_page', 2)
            ->where('filters.page', 2)
        );
    }

    /**
     * Test workspace search filters by name or description.
     */
    public function test_workspace_search(): void
    {
        $user = User::factory()->create();

        NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Belajar Pemrograman Web',
            'color_theme' => 'yellow',
            'description' => 'Materi kuliah semester 4',
            'public_token' => 'token-1-'.uniqid(),
        ]);

        NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Catatan Belanja Harian',
            'color_theme' => 'mint',
            'description' => 'Daftar kebutuhan bulanan',
            'public_token' => 'token-2-'.uniqid(),
        ]);

        // Search for 'Pemrograman'
        $response = $this->actingAs($user, 'web')->get('/app?search=Pemrograman');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Member/Workspace', false)
            ->has('apps.data', 1)
            ->where('apps.data.0.name', 'Belajar Pemrograman Web')
            ->where('filters.search', 'Pemrograman')
        );

        // Search for description 'bulanan'
        $responseDesc = $this->actingAs($user, 'web')->get('/app?search=bulanan');
        $responseDesc->assertStatus(200);
        $responseDesc->assertInertia(fn (Assert $page) => $page
            ->component('Member/Workspace', false)
            ->has('apps.data', 1)
            ->where('apps.data.0.name', 'Catatan Belanja Harian')
            ->where('filters.search', 'bulanan')
        );
    }

    /**
     * Test workspace filter by type (my_apps vs shared).
     */
    public function test_workspace_filter_type(): void
    {
        $owner = User::factory()->create();
        $collaborator = User::factory()->create();

        $ownedApp = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Ruang Pribadi Owner',
            'color_theme' => 'coral',
            'public_token' => 'token-owned-'.uniqid(),
        ]);

        $sharedApp = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Ruang Kerja Bersama',
            'color_theme' => 'purple',
            'public_token' => 'token-shared-'.uniqid(),
        ]);

        Collaborator::create([
            'collaboratable_type' => NoteApp::class,
            'collaboratable_id' => $sharedApp->id,
            'user_id' => $collaborator->id,
            'invited_email' => $collaborator->email,
            'permission' => 'edit',
        ]);

        // Collaborator visits with type=all (should see sharedApp)
        $responseAll = $this->actingAs($collaborator, 'web')->get('/app?type=all');
        $responseAll->assertStatus(200);
        $responseAll->assertInertia(fn (Assert $page) => $page
            ->component('Member/Workspace', false)
            ->has('apps.data', 1)
            ->where('apps.data.0.id', $sharedApp->id)
            ->where('counts.shared', 1)
            ->where('counts.my_apps', 0)
        );

        // Collaborator visits with type=my_apps (should see 0 apps)
        $responseMy = $this->actingAs($collaborator, 'web')->get('/app?type=my_apps');
        $responseMy->assertStatus(200);
        $responseMy->assertInertia(fn (Assert $page) => $page
            ->component('Member/Workspace', false)
            ->has('apps.data', 0)
        );

        // Collaborator visits with type=shared (should see sharedApp)
        $responseShared = $this->actingAs($collaborator, 'web')->get('/app?type=shared');
        $responseShared->assertStatus(200);
        $responseShared->assertInertia(fn (Assert $page) => $page
            ->component('Member/Workspace', false)
            ->has('apps.data', 1)
            ->where('apps.data.0.id', $sharedApp->id)
        );
    }

    /**
     * Test query string is preserved in pagination links.
     */
    public function test_query_string_preserved_in_pagination(): void
    {
        $user = User::factory()->create();

        for ($i = 1; $i <= 12; $i++) {
            NoteApp::create([
                'owner_id' => $user->id,
                'name' => "Modul Belajar {$i}",
                'color_theme' => 'sky',
                'public_token' => "token-modul-{$i}-".uniqid(),
            ]);
        }

        $response = $this->actingAs($user, 'web')->get('/app?type=my_apps&search=Modul');
        $response->assertStatus(200);
        $response->assertInertia(function (Assert $page) {
            $page->component('Member/Workspace', false)
                ->has('apps.links')
                ->where('filters.type', 'my_apps')
                ->where('filters.search', 'Modul');

            // Page 2 link should contain type=my_apps and search=Modul
            $links = $page->toArray()['props']['apps']['links'];
            $page2Link = collect($links)->firstWhere('label', '2');
            $this->assertNotNull($page2Link);
            $this->assertStringContainsString('type=my_apps', $page2Link['url']);
            $this->assertStringContainsString('search=Modul', $page2Link['url']);
            $this->assertStringContainsString('page=2', $page2Link['url']);
        });
    }

    /**
     * Test accessing non-existent app ID redirects gracefully to /app instead of throwing 404.
     */
    public function test_accessing_non_existent_app_id_redirects_gracefully_to_workspace_index(): void
    {
        $user = User::factory()->create();

        // Accessing old integer ID like 13 or invalid UUID
        $response = $this->actingAs($user, 'web')->get('/app/13');

        $response->assertRedirect(route('apps.index'));
        $response->assertSessionHas('error', 'Aplikasi Catatan atau Ruang Kerja tidak ditemukan.');
    }
}
