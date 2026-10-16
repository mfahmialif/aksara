<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\ReminderLog;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminSettingsAndReminderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_guest_cannot_access_admin_settings(): void
    {
        $response = $this->get('/admin/settings');
        $response->assertRedirect('/admin/login');
    }

    public function test_admin_can_access_modul_pengaturan_with_stats(): void
    {
        $admin = Admin::first();
        $this->assertNotNull($admin);

        $response = $this->actingAs($admin, 'admin')->get('/admin/settings');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Settings', false)
            ->has('settings')
            ->has('reminder_stats')
            ->has('users')
            ->has('notes')
            ->where('reminder_stats.mail_driver', config('mail.default'))
        );
    }

    public function test_admin_can_send_test_reminder(): void
    {
        $admin = Admin::first();
        $user = User::factory()->create(['email' => 'test-recipient@example.com']);

        $app = NoteApp::create([
            'owner_id' => $user->id,
            'name' => 'Test App',
        ]);
        $group = NoteGroup::create([
            'note_app_id' => $app->id,
            'name' => 'General',
        ]);
        $note = Note::create([
            'note_group_id' => $group->id,
            'title' => 'Deadline Tugas Testing',
            'category' => 'task',
        ]);

        $response = $this->actingAs($admin, 'admin')->post('/admin/settings/test-reminder', [
            'recipient_email' => $user->email,
            'title' => '⏰ [Uji Coba] Deadline Submission',
            'note_id' => $note->id,
        ]);

        $response->assertSessionHas('success');

        // Verify ReminderLog was created
        $this->assertDatabaseHas('reminder_logs', [
            'recipient_email' => $user->email,
            'note_id' => $note->id,
            'status' => 'sent',
        ]);

        // Verify In-App Notification was created for recipient user
        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $user->id,
            'type' => 'reminder',
        ]);
    }

    public function test_admin_can_run_reminder_engine_manually(): void
    {
        $admin = Admin::first();

        $response = $this->actingAs($admin, 'admin')->post('/admin/settings/run-reminders');

        $response->assertSessionHas('success');
    }

    public function test_admin_can_update_file_settings(): void
    {
        $admin = Admin::first();

        $response = $this->actingAs($admin, 'admin')->put('/admin/settings', [
            'max_file_size_mb' => 25,
            'max_files_per_upload' => 10,
            'allowed_extensions' => 'png,jpg,pdf,docx,zip',
            'blocked_extensions' => 'exe,sh,bat,cmd,bin',
        ]);

        $response->assertSessionHas('success');

        $this->assertEquals(25, SystemSetting::get('max_file_size_mb'));
        $this->assertEquals(10, SystemSetting::get('max_files_per_upload'));
        $this->assertEquals('png,jpg,pdf,docx,zip', SystemSetting::get('allowed_extensions'));
    }

    public function test_admin_can_update_mail_settings(): void
    {
        $admin = Admin::first();

        $response = $this->actingAs($admin, 'admin')->put('/admin/settings/mail', [
            'mail_mailer' => 'smtp',
            'mail_host' => 'smtp.gmail.com',
            'mail_port' => 587,
            'mail_encryption' => 'tls',
            'mail_username' => 'aksara.admin@gmail.com',
            'mail_password' => 'abcd efgh ijkl mnop',
            'mail_from_address' => 'aksara.admin@gmail.com',
            'mail_from_name' => 'Aksara Admin System',
        ]);

        $response->assertSessionHas('success');

        $this->assertEquals('smtp', SystemSetting::get('mail_mailer'));
        $this->assertEquals('smtp.gmail.com', SystemSetting::get('mail_host'));
        $this->assertEquals('587', SystemSetting::get('mail_port'));
        $this->assertEquals('tls', SystemSetting::get('mail_encryption'));
        $this->assertEquals('aksara.admin@gmail.com', SystemSetting::get('mail_username'));
        $this->assertEquals('abcd efgh ijkl mnop', SystemSetting::get('mail_password'));
        $this->assertEquals('aksara.admin@gmail.com', SystemSetting::get('mail_from_address'));
        $this->assertEquals('Aksara Admin System', SystemSetting::get('mail_from_name'));

        // Verify config override was applied
        $this->assertEquals('smtp', config('mail.default'));
        $this->assertEquals('smtp.gmail.com', config('mail.mailers.smtp.host'));
        $this->assertEquals(587, config('mail.mailers.smtp.port'));
        $this->assertEquals('tls', config('mail.mailers.smtp.encryption'));

        // Verify ActivityLog was recorded
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'UPDATE_MAIL_SETTINGS',
        ]);
    }

    public function test_mail_settings_validation(): void
    {
        $admin = Admin::first();

        $response = $this->actingAs($admin, 'admin')->put('/admin/settings/mail', [
            'mail_mailer' => 'invalid_mailer',
            'mail_port' => 999999,
            'mail_from_address' => 'not-an-email',
            'mail_from_name' => '',
        ]);

        $response->assertSessionHasErrors(['mail_mailer', 'mail_port', 'mail_from_address', 'mail_from_name']);
    }
}
