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
        Schema::create('saved_shared_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('item_type', ['app', 'group', 'note']);
            $table->uuid('item_id');
            $table->foreignUuid('note_app_id')->nullable()->constrained('note_apps')->cascadeOnDelete();
            $table->string('title')->nullable();
            $table->string('share_url');
            $table->string('public_token', 64)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'item_type', 'item_id']);
            $table->index(['user_id', 'item_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('saved_shared_links');
    }
};
