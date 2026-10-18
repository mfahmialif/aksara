<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_guest_cannot_access_admin_users(): void
    {
        $response = $this->get('/admin/users');
        $response->assertRedirect('/admin/login');
    }

    public function test_admin_can_view_paginated_users_with_stats_and_filters(): void
    {
        $admin = Admin::first();
        $this->assertNotNull($admin);

        // Create 20 sample users to trigger pagination (15 per page)
        User::factory()->count(20)->create();

        $response = $this->actingAs($admin, 'admin')->get('/admin/users');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Users', false)
            ->has('members.data', 15)
            ->where('members.current_page', 1)
            ->has('members.links')
            ->has('stats')
            ->has('filters')
            ->has('admins')
        );
    }

    public function test_admin_can_search_users(): void
    {
        $admin = Admin::first();
        $targetUser = User::factory()->create([
            'name' => 'Budi Doremi Khusus',
            'email' => 'budidoremi@example.com',
        ]);
        User::factory()->count(5)->create();

        $response = $this->actingAs($admin, 'admin')->get('/admin/users?search=Khusus');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Users', false)
            ->where('members.data.0.id', $targetUser->id)
            ->where('filters.search', 'Khusus')
        );
    }

    public function test_admin_can_filter_users_by_status(): void
    {
        $admin = Admin::first();
        User::factory()->create(['name' => 'User Nonaktif', 'is_active' => false]);
        User::factory()->create(['name' => 'User Aktif', 'is_active' => true]);

        $response = $this->actingAs($admin, 'admin')->get('/admin/users?status=inactive');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Users', false)
            ->where('filters.status', 'inactive')
            ->where('members.data.0.is_active', false)
        );
    }

    public function test_admin_can_get_user_details(): void
    {
        $admin = Admin::first();
        $user = User::factory()->create(['name' => 'Member Detail Test']);

        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Workspace Pribadi',
            'color_theme' => 'mint',
        ]);

        $response = $this->actingAs($admin, 'admin')->getJson("/admin/users/{$user->id}/details");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'user' => [
                'id',
                'name',
                'email',
                'note_apps_count',
                'note_apps',
            ],
            'recent_logs',
        ]);
        $response->assertJsonPath('user.name', 'Member Detail Test');
        $response->assertJsonPath('user.note_apps.0.name', 'Workspace Pribadi');
    }

    public function test_admin_can_update_user(): void
    {
        $admin = Admin::first();
        $user = User::factory()->create([
            'name' => 'Nama Lama',
            'email' => 'lama@example.com',
            'is_active' => true,
            'default_reminder_days' => 3,
        ]);

        $response = $this->actingAs($admin, 'admin')->put("/admin/users/{$user->id}", [
            'name' => 'Nama Baru Diedit',
            'email' => 'baru@example.com',
            'is_active' => false,
            'default_reminder_days' => 7,
        ]);

        $response->assertSessionHas('success');

        $user->refresh();
        $this->assertEquals('Nama Baru Diedit', $user->name);
        $this->assertEquals('baru@example.com', $user->email);
        $this->assertFalse($user->is_active);
        $this->assertEquals(7, $user->default_reminder_days);
    }

    public function test_admin_can_toggle_user_status(): void
    {
        $admin = Admin::first();
        $user = User::factory()->create(['is_active' => true]);

        $response = $this->actingAs($admin, 'admin')->post("/admin/users/{$user->id}/toggle-status");
        $response->assertSessionHas('success');

        $user->refresh();
        $this->assertFalse($user->is_active);

        $this->actingAs($admin, 'admin')->post("/admin/users/{$user->id}/toggle-status");
        $user->refresh();
        $this->assertTrue($user->is_active);
    }

    public function test_admin_can_delete_user(): void
    {
        $admin = Admin::first();
        $user = User::factory()->create();

        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Workspace Hapus',
        ]);

        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'Group Hapus',
        ]);

        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Catatan Hapus',
        ]);

        $response = $this->actingAs($admin, 'admin')->delete("/admin/users/{$user->id}");
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('note_apps', ['id' => $app->id]);
        $this->assertDatabaseMissing('note_groups', ['id' => $group->id]);
        $this->assertDatabaseMissing('notes', ['id' => $note->id]);
    }
}
