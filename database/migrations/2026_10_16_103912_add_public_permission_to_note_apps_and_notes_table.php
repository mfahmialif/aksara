<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('note_apps', function (Blueprint $table) {
            $table->string('public_permission', 20)->default('read')->after('is_public');
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->string('public_permission', 20)->default('read')->after('is_public');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn('public_permission');
        });

        Schema::table('note_apps', function (Blueprint $table) {
            $table->dropColumn('public_permission');
        });
    }
};
