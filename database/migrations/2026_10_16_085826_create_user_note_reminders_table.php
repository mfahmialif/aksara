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
        Schema::create('user_note_reminders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('note_id')->constrained('notes')->cascadeOnDelete();
            $table->unsignedInteger('reminder_days_before')->nullable();
            $table->dateTime('custom_remind_at')->nullable();
            $table->dateTime('reminder_sent_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'note_id']);
            $table->index(['reminder_sent_at', 'custom_remind_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_note_reminders');
    }
};
