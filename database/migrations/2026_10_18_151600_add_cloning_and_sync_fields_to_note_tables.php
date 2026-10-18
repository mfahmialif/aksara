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
            $table->foreignUuid('cloned_from_id')
                ->nullable()
                ->after('owner_id')
                ->constrained('note_apps')
                ->nullOnDelete();
            $table->unsignedInteger('clone_count')
                ->default(0)
                ->after('color_theme');
        });

        Schema::table('note_groups', function (Blueprint $table) {
            $table->foreignUuid('cloned_from_id')
                ->nullable()
                ->after('note_app_id')
                ->constrained('note_groups')
                ->nullOnDelete();
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->foreignUuid('cloned_from_id')
                ->nullable()
                ->after('note_group_id')
                ->constrained('notes')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cloned_from_id');
        });

        Schema::table('note_groups', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cloned_from_id');
        });

        Schema::table('note_apps', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cloned_from_id');
            $table->dropColumn('clone_count');
        });
    }
};
