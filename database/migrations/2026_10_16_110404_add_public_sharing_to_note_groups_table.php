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
        Schema::table('note_groups', function (Blueprint $table) {
            $table->boolean('is_public')->default(false)->after('sort_order');
            $table->string('public_permission', 20)->default('read')->after('is_public');
            $table->string('public_token', 64)->nullable()->unique()->after('public_permission');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('note_groups', function (Blueprint $table) {
            $table->dropColumn(['is_public', 'public_permission', 'public_token']);
        });
    }
};
