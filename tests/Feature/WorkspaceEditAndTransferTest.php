<?php

namespace Tests\Feature;

use App\Mail\WorkspaceTransferInvitationMail;
use App\Models\Collaborator;
use App\Models\NoteApp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class WorkspaceEditAndTransferTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_owner_can_update_workspace_settings(): void
    {
        $owner = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Original Name',
            'color_theme' => 'yellow',
            'description' => 'Original Description',
            'topic_label' => 'Topik',
        ]);

        $response = $this->actingAs($owner, 'web')->put("/app/{$app->id}", [
            'name' => 'Updated Workspace Name',
            'color_theme' => 'mint',
            'description' => 'Updated Description',
            'topic_label' => 'Mata Kuliah',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('note_apps', [
            'id' => $app->id,
            'name' => 'Updated Workspace Name',
            'color_theme' => 'mint',
            'description' => 'Updated Description',
            'topic_label' => 'Mata Kuliah',
        ]);
    }

    public function test_non_authorized_user_cannot_update_workspace(): void
    {
        $owner = User::factory()->create();
        $stranger = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Owner Workspace',
            'color_theme' => 'yellow',
        ]);

        $response = $this->actingAs($stranger, 'web')->put("/app/{$app->id}", [
            'name' => 'Hacked Workspace',
            'color_theme' => 'coral',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('note_apps', [
            'id' => $app->id,
            'name' => 'Owner Workspace',
        ]);
    }

    public function test_owner_can_initiate_transfer_ownership_via_email(): void
    {
        Mail::fake();

        $owner = User::factory()->create();
        $targetUser = User::factory()->create(['email' => 'calon.pemilik@example.com']);
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Workspace Riset AI',
            'color_theme' => 'purple',
        ]);

        $response = $this->actingAs($owner, 'web')->post("/app/{$app->id}/transfer-ownership", [
            'email' => 'calon.pemilik@example.com',
        ]);

        $response->assertRedirect();

        // 1. Verify email queued/sent
        Mail::assertSent(WorkspaceTransferInvitationMail::class, function ($mail) use ($app) {
            return $mail->hasTo('calon.pemilik@example.com') && $mail->app->id === $app->id;
        });

        // 2. Verify cache has pending transfer
        $this->assertTrue(Cache::has("workspace_transfer:{$app->id}"));
        $transfer = Cache::get("workspace_transfer:{$app->id}");
        $this->assertEquals('calon.pemilik@example.com', $transfer['target_email']);

        // 3. Verify in-app notification sent to registered target user
        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $targetUser->id,
            'type' => 'workspace_transfer',
        ]);
    }

    public function test_cannot_transfer_workspace_to_self(): void
    {
        $owner = User::factory()->create(['email' => 'owner@example.com']);
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'My Workspace',
            'color_theme' => 'yellow',
        ]);

        $response = $this->actingAs($owner, 'web')->post("/app/{$app->id}/transfer-ownership", [
            'email' => 'owner@example.com',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_guest_is_redirected_to_login_when_accessing_transfer_accept_url(): void
    {
        $owner = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Transfer Project',
            'color_theme' => 'yellow',
        ]);

        $token = 'test-token-12345';
        Cache::put("workspace_transfer:{$app->id}", [
            'app_id' => $app->id,
            'token' => $token,
            'target_email' => 'newowner@example.com',
            'old_owner_id' => $owner->id,
            'old_owner_name' => $owner->name,
            'old_owner_email' => $owner->email,
            'created_at' => now()->toIso8601String(),
        ], now()->addDays(3));

        $url = URL::temporarySignedRoute('apps.transfer.show', now()->addDays(3), [
            'app' => $app->id,
            'token' => $token,
        ]);

        // Unauthenticated request
        $response = $this->get($url);

        $response->assertRedirect(route('login'));
        $intendedUrl = session('url.intended');
        $this->assertNotNull($intendedUrl);
        $this->assertStringContainsString('/transfer-accept', $intendedUrl);
        $this->assertStringContainsString('token='.$token, $intendedUrl);
        $this->assertStringContainsString('signature=', $intendedUrl);
    }

    public function test_candidate_owner_can_accept_transfer_and_become_owner(): void
    {
        $oldOwner = User::factory()->create(['name' => 'Pemilik Lama', 'email' => 'lama@example.com']);
        $newOwner = User::factory()->create(['name' => 'Pemilik Baru', 'email' => 'baru@example.com']);

        $app = NoteApp::create([
            'owner_id' => $oldOwner->id,
            'name' => 'Ruang Kerja Bersama',
            'color_theme' => 'coral',
        ]);

        // Setup candidate as existing collaborator first to test removal
        Collaborator::create([
            'collaboratable_type' => NoteApp::class,
            'collaboratable_id' => $app->id,
            'user_id' => $newOwner->id,
            'invited_email' => 'baru@example.com',
            'permission' => 'edit',
        ]);

        $token = 'secure-token-abcdef';
        Cache::put("workspace_transfer:{$app->id}", [
            'app_id' => $app->id,
            'app_name' => $app->name,
            'token' => $token,
            'target_email' => 'baru@example.com',
            'old_owner_id' => $oldOwner->id,
            'old_owner_name' => $oldOwner->name,
            'old_owner_email' => $oldOwner->email,
            'created_at' => now()->toIso8601String(),
        ], now()->addDays(3));

        $response = $this->actingAs($newOwner, 'web')->post("/app/{$app->id}/transfer-accept", [
            'token' => $token,
        ]);

        $response->assertRedirect(route('apps.show', $app->id));
        $response->assertSessionHas('success');

        // 1. Verify app owner is now newOwner
        $app->refresh();
        $this->assertEquals($newOwner->id, $app->owner_id);

        // 2. Verify old owner is demoted to collaborator with 'edit'
        $this->assertDatabaseHas('collaborators', [
            'collaboratable_type' => NoteApp::class,
            'collaboratable_id' => $app->id,
            'user_id' => $oldOwner->id,
            'permission' => 'edit',
        ]);

        // 3. Verify new owner is removed from collaborators
        $this->assertDatabaseMissing('collaborators', [
            'collaboratable_type' => NoteApp::class,
            'collaboratable_id' => $app->id,
            'user_id' => $newOwner->id,
        ]);

        // 4. Verify cache is cleared
        $this->assertFalse(Cache::has("workspace_transfer:{$app->id}"));

        // 5. Verify celebratory in-app notification
        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $newOwner->id,
            'type' => 'workspace_transfer',
        ]);
    }

    public function test_candidate_owner_can_reject_transfer(): void
    {
        $oldOwner = User::factory()->create();
        $candidate = User::factory()->create(['email' => 'calon@example.com']);

        $app = NoteApp::create([
            'owner_id' => $oldOwner->id,
            'name' => 'Ruang Ditolak',
            'color_theme' => 'sky',
        ]);

        $token = 'reject-token-xyz';
        Cache::put("workspace_transfer:{$app->id}", [
            'app_id' => $app->id,
            'token' => $token,
            'target_email' => 'calon@example.com',
            'old_owner_id' => $oldOwner->id,
            'old_owner_name' => $oldOwner->name,
            'old_owner_email' => $oldOwner->email,
            'created_at' => now()->toIso8601String(),
        ], now()->addDays(3));

        $response = $this->actingAs($candidate, 'web')->post("/app/{$app->id}/transfer-reject", [
            'token' => $token,
        ]);

        $response->assertRedirect(route('apps.index'));
        $this->assertFalse(Cache::has("workspace_transfer:{$app->id}"));

        // App owner should remain oldOwner
        $app->refresh();
        $this->assertEquals($oldOwner->id, $app->owner_id);
    }

    public function test_owner_can_cancel_pending_transfer(): void
    {
        $owner = User::factory()->create();
        $app = NoteApp::create([
            'owner_id' => $owner->id,
            'name' => 'Ruang Dibatalkan',
            'color_theme' => 'yellow',
        ]);

        $token = 'cancel-token-123';
        Cache::put("workspace_transfer:{$app->id}", [
            'app_id' => $app->id,
            'token' => $token,
            'target_email' => 'seseorang@example.com',
            'old_owner_id' => $owner->id,
            'old_owner_name' => $owner->name,
            'old_owner_email' => $owner->email,
            'created_at' => now()->toIso8601String(),
        ], now()->addDays(3));

        $response = $this->actingAs($owner, 'web')->delete("/app/{$app->id}/transfer-ownership");

        $response->assertRedirect();
        $this->assertFalse(Cache::has("workspace_transfer:{$app->id}"));
    }
}
