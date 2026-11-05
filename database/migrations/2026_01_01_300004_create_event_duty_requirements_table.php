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
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('duty_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('role_id')->constrained()->restrictOnDelete();
            $table->string('team_needed', 32)->nullable();
            $table->unsignedSmallInteger('headcount');
            $table->timestamp('shift_start');
            $table->timestamp('shift_end');
            $table->text('instructions')->nullable();
            $table->timestamps();

            $table->index(['shift_start', 'shift_end']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_duty_requirements');
    }
};
