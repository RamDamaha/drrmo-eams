<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dateTime('duty_started_at')->nullable()->after('acknowledged_at');
            $table->dateTime('duty_ended_at')->nullable()->after('duty_started_at');
        });
    }

    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropColumn(['duty_started_at', 'duty_ended_at']);
        });
    }
};
