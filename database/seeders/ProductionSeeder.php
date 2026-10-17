<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\SystemSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ProductionSeeder extends Seeder
{
    /**
     * Run the database seeds for production.
     */
    public function run(): void
    {
        // 1. System Settings (Wajib untuk operasional sistem)
        SystemSetting::set('max_file_size_mb', 10, 'Ukuran maksimal file lampiran (MB)');
        SystemSetting::set('max_files_per_upload', 5, 'Jumlah file maksimal dalam sekali upload');
        SystemSetting::set('allowed_extensions', 'jpg,jpeg,png,gif,webp,svg,pdf,doc,docx,xls,xlsx,ppt,pptx,zip,txt,mp4', 'Ekstensi file yang diizinkan');
        SystemSetting::set('blocked_extensions', 'exe,sh,bat,cmd,bin,dll,com,vbs', 'Ekstensi file yang diblokir untuk keamanan');

        // 2. Default Super Admin
        Admin::updateOrCreate(
            ['username' => env('ADMIN_DEFAULT_USERNAME', 'admin')],
            [
                'name' => env('ADMIN_DEFAULT_NAME', 'System Administrator'),
                'email' => env('ADMIN_DEFAULT_EMAIL', 'admin@catatan.local'),
                'password' => Hash::make(env('ADMIN_DEFAULT_PASSWORD', 'password')),
                'role' => 'superadmin',
                'is_active' => true,
            ]
        );
    }
}
