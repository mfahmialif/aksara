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
        // 1. Note Apps (Workspace level)
        Schema::create('note_apps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('owner_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('icon')->nullable()->default('notebook');
            $table->string('color_theme')->default('yellow'); // yellow, purple, mint, coral, sky, pink
            $table->text('description')->nullable();
            $table->boolean('is_public')->default(false);
            $table->string('public_token', 64)->nullable()->unique();
            $table->timestamps();
        });

        // 2. Note Groups (Topic / Course folders)
        Schema::create('note_groups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('note_app_id')->constrained('note_apps')->cascadeOnDelete();
            $table->string('name');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // 3. Notes (Note items)
        Schema::create('notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('note_group_id')->constrained('note_groups')->cascadeOnDelete();
            $table->string('title')->default('Catatan Tanpa Judul');
            $table->enum('category', ['regular', 'task'])->default('regular');
            $table->longText('content_json')->nullable(); // Rich text & interactive checklist JSON/HTML
            $table->longText('drawing_data')->nullable(); // Canvas sketch JSON / Base64 / SVG
            $table->dateTime('deadline_at')->nullable();
            $table->unsignedInteger('reminder_days_before')->nullable();
            $table->dateTime('reminder_sent_at')->nullable();
            $table->boolean('is_public')->default(false);
            $table->string('public_token', 64)->nullable()->unique();
            $table->timestamps();
        });

        // 4. Attachments
        Schema::create('note_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('note_id')->constrained('notes')->cascadeOnDelete();
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type');
            $table->unsignedBigInteger('file_size'); // bytes
            $table->timestamps();
        });

        // 5. Collaborators (Granular: NoteApp or Note)
        Schema::create('collaborators', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuidMorphs('collaboratable'); // collaboratable_type ('App\Models\NoteApp' or 'App\Models\Note') & collaboratable_id
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('invited_email');
            $table->string('permission')->default('edit');
            $table->timestamps();

            $table->unique(['collaboratable_type', 'collaboratable_id', 'invited_email'], 'collab_unique_invite');
        });

        // 6. Reminder Logs
        Schema::create('reminder_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('note_id')->constrained('notes')->cascadeOnDelete();
            $table->string('recipient_email');
            $table->string('status')->default('sent'); // sent, failed
            $table->dateTime('scheduled_for');
            $table->dateTime('sent_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reminder_logs');
        Schema::dropIfExists('collaborators');
        Schema::dropIfExists('note_attachments');
        Schema::dropIfExists('notes');
        Schema::dropIfExists('note_groups');
        Schema::dropIfExists('note_apps');
    }
};
