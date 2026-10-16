<?php

namespace Database\Seeders;

use App\Models\Collaborator;
use App\Models\Note;
use App\Models\NoteApp;
use App\Models\NoteGroup;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class LargeTestingDataSeeder extends Seeder
{
    /**
     * Run the database seeds for user sei180508@gmail.com with thousands of notes.
     */
    public function run(): void
    {
        $targetEmail = 'sei180508@gmail.com';

        // 1. Ensure target user exists
        $user = User::firstOrCreate(
            ['email' => $targetEmail],
            [
                'name' => 'Sei',
                'google_id' => '105732866091601824901',
                'avatar' => 'https://lh3.googleusercontent.com/a/ACg8ocJejTYUv4mKCUD9HBK6yBRHRbtPeCiPVU37aqYvAQoyzPmlm_I=s96-c',
                'default_reminder_days' => 1,
                'is_active' => true,
            ]
        );

        // Get another user for collaborative shares
        $collaboratorUser = User::where('email', '!=', $targetEmail)->first();
        if (! $collaboratorUser) {
            $collaboratorUser = User::create([
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@gmail.com',
                'google_id' => 'google_demo_1001',
                'avatar' => 'https://api.dicebear.com/7.x/bottts/svg?seed=budi',
                'default_reminder_days' => 1,
                'is_active' => true,
            ]);
        }

        $themes = ['yellow', 'purple', 'mint', 'coral', 'sky', 'pink', 'orange'];

        $appTemplates = [
            ['name' => 'Skripsi & Tugas Akhir', 'desc' => 'Riset, draft bab 1-5, referensi jurnal IEEE/ACM, dan revisi dosen pembimbing.'],
            ['name' => 'Sistem Basis Data Lanjut', 'desc' => 'Materi query optimization, indexing B-Tree, partisi sharding, dan transaksi ACID.'],
            ['name' => 'Rekayasa Perangkat Lunak', 'desc' => 'Dokumentasi SRS, class diagram, design pattern (GoF), clean architecture, dan testing.'],
            ['name' => 'Kecerdasan Buatan & ML', 'desc' => 'Algoritma machine learning, neural networks, PyTorch, dan prompt engineering LLM.'],
            ['name' => 'Jaringan Komputer & Cloud', 'desc' => 'Konfigurasi Docker, Kubernetes, AWS infrastructure, subnetting, dan DevOps pipeline.'],
            ['name' => 'Pengembangan Web Modern', 'desc' => 'Fullstack development dengan Laravel 11, Inertia.js v2, React, dan Tailwind CSS v4.'],
            ['name' => 'Pemrograman Bergerak (Mobile)', 'desc' => 'Aplikasi Android & iOS menggunakan React Native dan Flutter, state management, dan offline sync.'],
            ['name' => 'Algoritma & Struktur Data', 'desc' => 'Latihan dynamic programming, graph traversal, DFS/BFS, binary search, dan LeetCode.'],
            ['name' => 'Proyek Startup Aksara', 'desc' => 'Roadmap produk, user feedback, sprint backlog agile, dan metrik retensi pengguna.'],
            ['name' => 'Catatan Keuangan & Budget', 'desc' => 'Pencatatan cashflow bulanan, alokasi investasi, portofolio reksadana, dan dana darurat.'],
            ['name' => 'Rencana Karir & Portfolio Tech', 'desc' => 'Curriculum Vitae ATS-friendly, persiapan technical interview, dan portofolio GitHub.'],
            ['name' => 'Ringkasan Buku & Literatur', 'desc' => 'Intisari buku non-fiksi: Atomic Habits, Clean Code, Designing Data-Intensive Apps.'],
            ['name' => 'Ide Konten Tech & Edukasi', 'desc' => 'Draft thread Twitter/X, tutorial LinkedIn, artikel Medium, dan materi presentasi tech talk.'],
            ['name' => 'Desain UI/UX & Design System', 'desc' => 'Komponen neobrutalism, palet warna, tipografi, wireframe Figma, dan accessibility (a11y).'],
            ['name' => 'Sertifikasi AWS Solutions Architect', 'desc' => 'Kumpulan rangkuman domain IAM, VPC, S3, RDS, DynamoDB, dan latihan soal ujian.'],
            ['name' => 'Catatan Organisasi & Kepanitiaan', 'desc' => 'Notulensi rapat koordinasi, rundown acara seminar nasional, dan timeline kepanitiaan.'],
            ['name' => 'Program Fitness & Nutrisi Sehat', 'desc' => 'Jadwal workout mingguan, progressive overload log, target asupan kalori dan protein harian.'],
            ['name' => 'Resep Masakan & Meal Prep', 'desc' => 'Koleksi resep masakan rumahan praktis, resep sehat hemat anak kost, dan tips grocery.'],
            ['name' => 'Jurnal Refleksi & Self-Growth 2026', 'desc' => 'Catatan rasa syukur harian, evaluasi mingguan, resolusi kuartal, dan mindful thinking.'],
            ['name' => 'Cheat Sheet & Kode Snippet', 'desc' => 'Snippet regex berguna, CLI commands Linux/Git, Docker compose template, dan bash script.'],
            ['name' => 'Belajar Bahasa Asing (EN & JP)', 'desc' => 'Kosakata JLPT N3, tata bahasa kanji, vocabulary IELTS band 7.5, dan listening practice.'],
            ['name' => 'Proyek IoT & Mikrokontroler', 'desc' => 'Proyek sensor ESP32, komunikasi MQTT, dashboard sensor web, dan smart home monitoring.'],
            ['name' => 'Keamanan Siber & Ethical Hacking', 'desc' => 'Analisis kerentanan OWASP Top 10, SQL Injection prevention, XSS mitigation, dan audit lab.'],
            ['name' => 'Manajemen Waktu & Produktivitas', 'desc' => 'Implementasi metode Pomodoro, time blocking, Eisenhower matrix, dan habit tracker.'],
            ['name' => 'Investasi Saham & Pasar Modal', 'desc' => 'Analisis fundamental laporan keuangan emiten, analisis teknikal MACD, dan dividen investing.'],
            ['name' => 'Rencana Liburan & Itinerary Wisata', 'desc' => 'Rute trip eksplorasi alam, estimasi budget perjalanan, akomodasi, dan packing checklist.'],
            ['name' => 'Koleksi Podcast & Catatan Webinar', 'desc' => 'Catatan penting dari podcast Endgame, Lex Fridman, dan webinar teknologi terkini.'],
            ['name' => 'Eksperimen Prompt Engineering', 'desc' => 'Struktur prompt chain-of-thought, few-shot prompting, evaluasi respons AI Gemini.'],
            ['name' => 'Latihan Soal Competitive Coding', 'desc' => 'Pembahasan problem Codeforces, HackerRank, dan trik optimasi time/space complexity.'],
            ['name' => 'Setup Dev Tools & Dotfiles', 'desc' => 'Konfigurasi VS Code / Cursor, Neovim lua config, terminal Oh My Zsh, dan git alias.'],
        ];

        $now = Carbon::now();

        $this->command?->info("Memulai pembuatan data workspace untuk {$targetEmail}...");

        $createdAppIds = [];
        $createdGroups = [];

        // 2. Create 30 NoteApps
        foreach ($appTemplates as $idx => $tmpl) {
            $theme = $themes[$idx % count($themes)];
            $isPublic = ($idx % 5 === 0);

            $app = NoteApp::create([
                'owner_id' => $user->id,
                'name' => $tmpl['name'],
                'color_theme' => $theme,
                'icon' => 'Notebook',
                'description' => $tmpl['desc'],
                'is_public' => $isPublic,
                'public_token' => 'app-sei-'.Str::random(24),
                'created_at' => $now->copy()->subMinutes($idx * 15),
                'updated_at' => $now->copy()->subMinutes($idx * 5),
            ]);

            $createdAppIds[] = $app->id;

            // 3. Create 3-5 groups per app
            $groupNames = [
                'Catatan Utama & Inti',
                'Materi Perkuliahan / Teori',
                'Praktikum & Implementasi Koding',
                'Checklist Tugas & Deadline',
                'Referensi & Bahan Bacaan Tambahan',
            ];

            foreach ($groupNames as $gIdx => $gName) {
                $group = NoteGroup::create([
                    'note_app_id' => $app->id,
                    'name' => $gName,
                    'sort_order' => $gIdx + 1,
                    'created_at' => $now->copy()->subMinutes($idx * 10),
                    'updated_at' => $now->copy()->subMinutes($idx * 10),
                ]);

                $createdGroups[] = [
                    'id' => $group->id,
                    'app_name' => $tmpl['name'],
                    'group_name' => $gName,
                ];
            }
        }

        // 4. Create 3 Shared Workspaces where Sei is a Collaborator
        $sharedTemplates = [
            ['name' => 'Proyek Kolaborasi Antar Kampus', 'desc' => 'Inisiatif riset gabungan kecerdasan buatan dan NLP bersama mahasiswa luar kampus.'],
            ['name' => 'Panitia Hackathon Nasional 2026', 'desc' => 'Ruang koordinasi divisi teknis, web platform penjurian, dan logistik acara.'],
            ['name' => 'Studi Independen Bersertifikat (SIB)', 'desc' => 'Modul pembelajaran bareng industri, laporan berkala mingguan, dan mentoring.'],
        ];

        foreach ($sharedTemplates as $sIdx => $sTmpl) {
            $sharedApp = NoteApp::create([
                'owner_id' => $collaboratorUser->id,
                'name' => $sTmpl['name'],
                'color_theme' => $themes[($sIdx + 1) % count($themes)],
                'icon' => 'Users',
                'description' => $sTmpl['desc'],
                'is_public' => false,
                'public_token' => 'app-collab-sei-'.Str::random(24),
                'created_at' => $now->copy()->subHours(2),
                'updated_at' => $now->copy()->subHours(1),
            ]);

            Collaborator::create([
                'collaboratable_type' => NoteApp::class,
                'collaboratable_id' => $sharedApp->id,
                'user_id' => $user->id,
                'invited_email' => $user->email,
                'permission' => 'edit',
            ]);

            // Add 2 groups for each shared app
            foreach (['Koordinasi Tim', 'Tugas Kolaboratif'] as $sgIdx => $sgName) {
                $group = NoteGroup::create([
                    'note_app_id' => $sharedApp->id,
                    'name' => $sgName,
                    'sort_order' => $sgIdx + 1,
                ]);

                $createdGroups[] = [
                    'id' => $group->id,
                    'app_name' => $sTmpl['name'],
                    'group_name' => $sgName,
                ];
            }
        }

        $this->command?->info('Berhasil membuat '.count($createdAppIds).' workspace pribadi dan 3 workspace kolaborasi.');
        $this->command?->info('Menyiapkan ribuan catatan (notes) secara batch...');

        // 5. Generate 1,500+ realistic notes across all created groups
        $totalNotesTarget = 1500;
        $totalGroups = count($createdGroups);

        $titlesPool = [
            'Rangkuman Konsep Fundamental',
            'Analisis Performa Sistem & Benchmark',
            'Checklist Persiapan Ujian Tengah Semester',
            'Implementasi Cache Redis pada Backend',
            'Panduan Troubleshooting Error 500 & Logging',
            'Desain Skema Database Relasional',
            'Studi Kasus Keamanan Token JWT & Refresh Flow',
            'Review Kode dan Standar Clean Architecture',
            'Pencatatan Hasil Pengujian Beban (Load Test)',
            'Catatan Diskusi Bersama Dosen Pembimbing',
            'Eksperimen Indexing B-Tree vs Hash Index',
            'Daftar Pustaka Jurnal Internasional Terindeks',
            'Spesifikasi API Endpoint & Kontrak Swagger',
            'Checklist Deployment ke VPS & Setup Nginx',
            'Refactoring Komponen React dengan Custom Hook',
            'Evaluasi Metrik Akurasi Model Klasifikasi',
            'Langkah Migrasi Data & Seeding Tanpa Downtime',
            'Catatan Retrospektif Sprint Mingguan',
            'Tips Mengatasi N+1 Query Problem di Eloquent',
            'Panduan Desain Neobrutalism UI Aksara',
            'Checklist Dokumen Portofolio Pekerjaan',
            'Rangkuman Bab Metodologi Penelitian',
            'Strategi Backup Database Otomatis Harian',
            'Kompilasi Shortcut Keyboard Produktivitas',
            'Eksperimen WebSocket Realtime Notification',
        ];

        $notesBatch = [];
        $notesCount = 0;

        for ($i = 1; $i <= $totalNotesTarget; $i++) {
            $groupInfo = $createdGroups[($i - 1) % $totalGroups];
            $groupId = $groupInfo['id'];
            $baseTitle = $titlesPool[($i - 1) % count($titlesPool)];
            $title = "{$baseTitle} #{$i}";

            $isTask = ($i % 3 === 0);
            $category = $isTask ? 'task' : 'regular';
            $isPinned = ($i % 15 === 0); // ~100 pinned notes for testing pin feature!
            $sortOrder = ($i % 50);

            // Realistic Rich Text & Interactive Checklist
            $contentJson = json_encode([
                'html' => "<p>Ini adalah catatan nomor <strong>#{$i}</strong> di dalam grup <em>{$groupInfo['group_name']}</em>.</p><p>Pembahasan mencakup optimasi arsitektur sistem, efisiensi pembacaan data, serta manajemen tugas harian yang terstruktur.</p>",
                'checklist' => [
                    ['id' => 'chk-'.Str::random(6), 'text' => "Review materi {$baseTitle}", 'completed' => ($i % 2 === 0)],
                    ['id' => 'chk-'.Str::random(6), 'text' => 'Tulis rangkuman dan diagram alur', 'completed' => ($i % 4 === 0)],
                    ['id' => 'chk-'.Str::random(6), 'text' => 'Uji coba implementasi pada lingkungan lokal', 'completed' => false],
                ],
            ]);

            $deadline = null;
            $reminderDays = null;
            if ($isTask) {
                // Mix of past, today, and future deadlines
                $dayOffset = ($i % 20) - 5; // between -5 days and +14 days
                $deadline = $now->copy()->addDays($dayOffset)->setHour(17)->setMinute(0);
                $reminderDays = 1;
            }

            $notesBatch[] = [
                'id' => (string) Str::uuid(),
                'note_group_id' => $groupId,
                'title' => $title,
                'category' => $category,
                'content_json' => $contentJson,
                'drawing_data' => null,
                'deadline_at' => $deadline ? $deadline->toDateTimeString() : null,
                'reminder_days_before' => $reminderDays,
                'reminder_sent_at' => null,
                'is_pinned' => $isPinned ? 1 : 0,
                'sort_order' => $sortOrder,
                'is_public' => ($i % 25 === 0) ? 1 : 0,
                'public_token' => 'note-sei-'.Str::random(24)."-{$i}",
                'created_at' => $now->copy()->subMinutes($i * 3)->toDateTimeString(),
                'updated_at' => $now->copy()->subMinutes($i)->toDateTimeString(),
            ];

            // Insert in chunks of 250 for maximum MySQL insert speed
            if (count($notesBatch) >= 250) {
                Note::insert($notesBatch);
                $notesCount += count($notesBatch);
                $this->command?->info("Disimpan {$notesCount} / {$totalNotesTarget} catatan...");
                $notesBatch = [];
            }
        }

        if (! empty($notesBatch)) {
            Note::insert($notesBatch);
            $notesCount += count($notesBatch);
            $notesBatch = [];
        }

        // 6. Create 2 Standalone Shared Notes (Granular note-level shares)
        $standaloneNote1 = Note::create([
            'note_group_id' => $createdGroups[0]['id'],
            'title' => 'Catatan Rahasia Proyek Khusus (Dibagikan Mandiri)',
            'category' => 'task',
            'content_json' => json_encode([
                'html' => '<p>Catatan kolaborasi level catatan langsung dibagikan oleh rekan kerja tanpa membagikan keseluruhan workspace.</p>',
                'checklist' => [
                    ['id' => 'chk-std-1', 'text' => 'Konfirmasi akses dokumen', 'completed' => true],
                    ['id' => 'chk-std-2', 'text' => 'Tinjau lampiran dan revisi bab 2', 'completed' => false],
                ],
            ]),
            'deadline_at' => $now->copy()->addDays(2),
            'reminder_days_before' => 1,
            'is_pinned' => 1,
            'sort_order' => 1,
            'public_token' => 'note-std-sei-'.Str::random(24),
        ]);

        Collaborator::create([
            'collaboratable_type' => Note::class,
            'collaboratable_id' => $standaloneNote1->id,
            'user_id' => $user->id,
            'invited_email' => $user->email,
            'permission' => 'edit',
        ]);

        $this->command?->info("SELESAI! Total {$notesCount} catatan telah berhasil diisi ke akun {$targetEmail}.");
    }
}
