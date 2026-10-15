<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Collaborator;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteAttachment;
use App\Models\NoteGroup;
use App\Models\ReminderLog;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. System Settings
        SystemSetting::set('max_file_size_mb', 10, 'Ukuran maksimal file lampiran (MB)');
        SystemSetting::set('max_files_per_upload', 5, 'Jumlah file maksimal dalam sekali upload');
        SystemSetting::set('allowed_extensions', 'jpg,jpeg,png,gif,webp,svg,pdf,doc,docx,xls,xlsx,ppt,pptx,zip,txt,mp4', 'Ekstensi file yang diizinkan');
        SystemSetting::set('blocked_extensions', 'exe,sh,bat,cmd,bin,dll,com,vbs', 'Ekstensi file yang diblokir untuk keamanan');

        // 2. Default Admin
        $admin = Admin::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'System Administrator',
                'email' => 'admin@catatan.local',
                'password' => Hash::make('password'),
                'role' => 'superadmin',
                'is_active' => true,
            ]
        );

        // 3. Demo Members
        $userBudi = User::updateOrCreate(
            ['email' => 'budi.santoso@gmail.com'],
            [
                'name' => 'Budi Santoso',
                'google_id' => 'google_demo_1001',
                'avatar' => 'https://api.dicebear.com/7.x/bottts/svg?seed=budi',
                'default_reminder_days' => 1,
                'is_active' => true,
            ]
        );

        $userSiti = User::updateOrCreate(
            ['email' => 'siti.rahma@gmail.com'],
            [
                'name' => 'Siti Rahma',
                'google_id' => 'google_demo_1002',
                'avatar' => 'https://api.dicebear.com/7.x/bottts/svg?seed=siti',
                'default_reminder_days' => 2,
                'is_active' => true,
            ]
        );

        $userDoni = User::updateOrCreate(
            ['email' => 'doni.pratama@gmail.com'],
            [
                'name' => 'Doni Pratama',
                'google_id' => 'google_demo_1003',
                'avatar' => 'https://api.dicebear.com/7.x/bottts/svg?seed=doni',
                'default_reminder_days' => 3,
                'is_active' => true,
            ]
        );

        // 4. Note Apps for Budi
        $appKuliah = NoteApp::create([
            'owner_id' => $userBudi->id,
            'name' => 'Catatan Tugas Kuliah',
            'icon' => 'GraduationCap',
            'color_theme' => 'yellow',
            'description' => 'Kumpulan mata kuliah semester ganjil beserta tugas dan deadline penting.',
            'is_public' => true,
            'public_token' => 'app-kuliah-' . Str::random(12),
        ]);

        $appFreelance = NoteApp::create([
            'owner_id' => $userBudi->id,
            'name' => 'Proyek Freelance',
            'icon' => 'Briefcase',
            'color_theme' => 'mint',
            'description' => 'Manajemen pekerjaan sampingan, deliverable klien, dan catatan teknis.',
            'is_public' => false,
            'public_token' => 'app-freelance-' . Str::random(12),
        ]);

        $appJurnal = NoteApp::create([
            'owner_id' => $userBudi->id,
            'name' => 'Jurnal & Inspirasi Pribadi',
            'icon' => 'BookOpen',
            'color_theme' => 'purple',
            'description' => 'Ide kreatif, buku yang sedang dibaca, dan renungan harian.',
            'is_public' => false,
            'public_token' => 'app-jurnal-' . Str::random(12),
        ]);

        // 5. Groups in App Kuliah
        $groupIndo = NoteGroup::create([
            'note_app_id' => $appKuliah->id,
            'name' => 'Bahasa Indonesia',
            'sort_order' => 1,
        ]);

        $groupInggris = NoteGroup::create([
            'note_app_id' => $appKuliah->id,
            'name' => 'Bahasa Inggris',
            'sort_order' => 2,
        ]);

        $groupArab = NoteGroup::create([
            'note_app_id' => $appKuliah->id,
            'name' => 'Bahasa Arab',
            'sort_order' => 3,
        ]);

        // Groups in App Freelance
        $groupWeb = NoteGroup::create([
            'note_app_id' => $appFreelance->id,
            'name' => 'Website E-Commerce Klien',
            'sort_order' => 1,
        ]);

        // 6. Notes inside Bahasa Indonesia
        $noteMakalah = Note::create([
            'note_group_id' => $groupIndo->id,
            'title' => 'Makalah Analisis Sintaksis Kalimat Majemuk Bertingkat',
            'category' => 'task',
            'deadline_at' => now()->addDays(4)->setHour(23)->setMinute(59),
            'reminder_days_before' => 1,
            'is_public' => true,
            'public_token' => 'note-makalah-' . Str::random(12),
            'content_json' => json_encode([
                'html' => '<h2>Latar Belakang Analisis</h2><p>Penelitian ini membedah struktur klausa utama dan klausa bawahan dalam wacana berita modern. Tujuannya adalah mengidentifikasi konjungsi subordinatif yang paling sering menimbulkan kerancuan makna.</p><blockquote>"Bahasa adalah cermin pikiran yang tertata." - Kridalaksana</blockquote><h3>Poin Pembahasan Inti</h3><ul><li>Identifikasi relasi antar-klausa</li><li>Peran partikel penghubung</li><li>Kaidah ejaan baku EYD V</li></ul>',
                'checklist' => [
                    ['id' => 'chk-1', 'text' => 'Kumpulkan referensi dari jurnal terakreditasi SINTA 2', 'completed' => true],
                    ['id' => 'chk-2', 'text' => 'Buat draf Bab 1 Pendahuluan & Rumusan Masalah', 'completed' => true],
                    ['id' => 'chk-3', 'text' => 'Lakukan wawancara singkat ahli linguistik', 'completed' => false],
                    ['id' => 'chk-4', 'text' => 'Revisi sitasi APA 7th Edition dan daftar pustaka', 'completed' => false],
                    ['id' => 'chk-5', 'text' => 'Submit ke Google Classroom sebelum batas waktu', 'completed' => false],
                ],
            ]),
            'drawing_data' => json_encode([
                'lines' => [
                    ['points' => [['x' => 40, 'y' => 50], ['x' => 120, 'y' => 50], ['x' => 120, 'y' => 100]], 'color' => '#FF6B6B', 'width' => 4],
                    ['points' => [['x' => 120, 'y' => 100], ['x' => 200, 'y' => 100], ['x' => 200, 'y' => 160]], 'color' => '#A388EE', 'width' => 4],
                ],
                'preview' => '',
            ]),
        ]);

        $noteMorfologi = Note::create([
            'note_group_id' => $groupIndo->id,
            'title' => 'Ringkasan Materi Morfologi & Bentuk Terikat',
            'category' => 'regular',
            'is_public' => false,
            'public_token' => 'note-morfologi-' . Str::random(12),
            'content_json' => json_encode([
                'html' => '<h2>Morfem Bebas vs Morfem Terikat</h2><p>Morfem bebas dapat berdiri sendiri sebagai kata mandiri tanpa afiksasi. Contoh: <code>makan</code>, <code>lari</code>, <code>buku</code>.</p><p>Sedangkan morfem terikat seperti <code>ber-</code>, <code>meN-</code>, <code>-wan</code> membutuhkan morfem dasar untuk memiliki makna gramatikal penuh.</p>',
                'checklist' => [
                    ['id' => 'chk-m1', 'text' => 'Pelajari tabel alomorf meN- (mem-, men-, meng-)', 'completed' => true],
                    ['id' => 'chk-m2', 'text' => 'Latihan 15 soal identifikasi morfem zero', 'completed' => true],
                ],
            ]),
        ]);

        // Note in English
        $noteEssay = Note::create([
            'note_group_id' => $groupInggris->id,
            'title' => 'Critical Review: Ethical Implications of Generative AI',
            'category' => 'task',
            'deadline_at' => now()->addDays(2)->setHour(17)->setMinute(0),
            'reminder_days_before' => 2,
            'is_public' => false,
            'public_token' => 'note-essay-' . Str::random(12),
            'content_json' => json_encode([
                'html' => '<h2>Introduction</h2><p>This critical essay examines the copyright controversies surrounding large multimodal models and the economic displacement of junior digital artists.</p><h3>Key Thesis</h3><p>Generative AI does not replace creativity; it transforms the creator from an artisan into a semantic art director.</p>',
                'checklist' => [
                    ['id' => 'chk-e1', 'text' => 'Outline thesis statement and 3 supporting arguments', 'completed' => true],
                    ['id' => 'chk-e2', 'text' => 'Gather quotes from Turing Institute whitepaper', 'completed' => false],
                    ['id' => 'chk-e3', 'text' => 'Run plagiarism checker (Turnitin < 10%)', 'completed' => false],
                ],
            ]),
        ]);

        // Note in Freelance
        $noteSpec = Note::create([
            'note_group_id' => $groupWeb->id,
            'title' => 'Spesifikasi Fitur Checkout & Payment Gateway',
            'category' => 'task',
            'deadline_at' => now()->addDays(7)->setHour(20)->setMinute(0),
            'reminder_days_before' => 1,
            'is_public' => false,
            'public_token' => 'note-spec-' . Str::random(12),
            'content_json' => json_encode([
                'html' => '<h2>Kebutuhan Integrasi Midtrans</h2><p>Sistem harus mendukung snap token, webhook settlement notifikasi, serta auto-cancel transaksi kadaluarsa setelah 24 jam.</p>',
                'checklist' => [
                    ['id' => 'chk-s1', 'text' => 'Setup Midtrans Sandbox Server Key', 'completed' => true],
                    ['id' => 'chk-s2', 'text' => 'Implementasi IPN Webhook verification', 'completed' => false],
                ],
            ]),
        ]);

        // 7. Granular Collaborations
        // App Level Collaboration: Siti Rahma is invited to "Catatan Tugas Kuliah"
        Collaborator::create([
            'collaboratable_type' => NoteApp::class,
            'collaboratable_id' => $appKuliah->id,
            'user_id' => $userSiti->id,
            'invited_email' => $userSiti->email,
            'permission' => 'edit',
        ]);

        // Note Level Collaboration: Doni Pratama is invited ONLY to $noteSpec
        Collaborator::create([
            'collaboratable_type' => Note::class,
            'collaboratable_id' => $noteSpec->id,
            'user_id' => $userDoni->id,
            'invited_email' => $userDoni->email,
            'permission' => 'edit',
        ]);

        // 8. Sample Reminder Log
        ReminderLog::create([
            'note_id' => $noteMakalah->id,
            'recipient_email' => $userBudi->email,
            'status' => 'sent',
            'scheduled_for' => now()->subHours(5),
            'sent_at' => now()->subHours(5),
            'error_message' => null,
        ]);
    }
}
