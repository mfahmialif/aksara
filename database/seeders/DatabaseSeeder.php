<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Selalu jalankan seeder wajib (System Settings & Super Admin)
        $this->call(ProductionSeeder::class);

        // 2. Jika bukan di production (misal: local, dev, testing), masukkan data dummy
        if (! app()->environment('production')) {
            $this->call(DevelopmentSeeder::class);
        }
    }
}
