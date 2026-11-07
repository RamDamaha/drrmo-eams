<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_duty_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->restrictOnDelete();
            $table->foreignId('duty_type_id')->constrained()->restrictOnDelete();
            $table->string('role', 20); // marshal or volunteer
            $table->string('team_needed', 100)->nullable();
            $table->unsignedSmallInteger('headcount');
            $table->dateTime('shift_starts_at');
            $table->dateTime('shift_ends_at');
            $table->text('instructions')->nullable();
            $table->timestamps();

            $table->index('event_id');
            $table->index(['shift_starts_at', 'shift_ends_at']);
        });

        Schema::table('assignments', function (Blueprint $table) {
            $table->foreignId('requirement_id')->nullable()->after('event_id')
                ->constrained('event_duty_requirements')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('requirement_id');
        });
        Schema::dropIfExists('event_duty_requirements');
    }
};
