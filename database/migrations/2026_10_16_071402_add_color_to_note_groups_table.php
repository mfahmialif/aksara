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
            $table->string('color', 30)->nullable()->default('#FFDC58')->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('note_groups', function (Blueprint $table) {
            $table->dropColumn('color');
        });
    }
};
