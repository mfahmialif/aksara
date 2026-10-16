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
        // 1. Indexes on note_apps for fast owner listing, sorting, and search
        Schema::table('note_apps', function (Blueprint $table) {
            $table->index(['owner_id', 'id'], 'idx_note_apps_owner_id_id');
            $table->index('name', 'idx_note_apps_name');
            $table->index('is_public', 'idx_note_apps_is_public');
        });

        // 2. Indexes on note_groups for fast ordered group fetching
        Schema::table('note_groups', function (Blueprint $table) {
            $table->index(['note_app_id', 'sort_order', 'id'], 'idx_note_groups_app_sort_id');
        });

        // 3. Indexes on notes for fast pinned sorting, deadline checking, and title search
        Schema::table('notes', function (Blueprint $table) {
            $table->index(['note_group_id', 'is_pinned', 'sort_order', 'id'], 'idx_notes_group_pinned_sort_id');
            $table->index(['category', 'deadline_at', 'reminder_sent_at'], 'idx_notes_task_reminder');
            $table->index('title', 'idx_notes_title');
        });

        // 4. Index on collaborators for fast invited_email lookups
        Schema::table('collaborators', function (Blueprint $table) {
            $table->index('invited_email', 'idx_collaborators_invited_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('collaborators', function (Blueprint $table) {
            $table->dropIndex('idx_collaborators_invited_email');
        });

        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex('idx_notes_group_pinned_sort_id');
            $table->dropIndex('idx_notes_task_reminder');
            $table->dropIndex('idx_notes_title');
        });

        Schema::table('note_groups', function (Blueprint $table) {
            $table->dropIndex('idx_note_groups_app_sort_id');
        });

        Schema::table('note_apps', function (Blueprint $table) {
            $table->dropIndex('idx_note_apps_owner_id_id');
            $table->dropIndex('idx_note_apps_name');
            $table->dropIndex('idx_note_apps_is_public');
        });
    }
};
