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
        // 1. In-App Notifications for Members
        Schema::create('app_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('reminder'); // reminder, collaboration, task, system
            $table->string('action_url')->nullable();
            $table->dateTime('read_at')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'read_at', 'is_archived']);
        });

        // 2. Activity Logs Pro for Admin Monitoring
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->nullableMorphs('causer'); // causer_type ('App\Models\User' or 'App\Models\Admin') & causer_id
            $table->string('causer_name')->default('System');
            $table->string('causer_role')->default('system'); // member, admin, system
            $table->string('action'); // LOGIN, LOGOUT, CREATE_WORKSPACE, UPDATE_WORKSPACE, DELETE_WORKSPACE, CREATE_NOTE, UPDATE_NOTE, DELETE_NOTE, UPLOAD_ATTACHMENT, DELETE_ATTACHMENT, INVITE_COLLABORATOR, REMOVE_COLLABORATOR, SEND_REMINDER, UPDATE_SETTINGS, TOGGLE_USER_STATUS
            $table->string('entity_type')->nullable(); // Note, NoteApp, SystemSetting, User
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->text('description');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->json('properties')->nullable();
            $table->timestamps();

            $table->index(['created_at', 'action', 'causer_role']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('app_notifications');
    }
};
