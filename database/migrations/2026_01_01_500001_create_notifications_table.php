<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('assignment_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type', 40);
            $table->string('channel', 20)->default('email');
            $table->string('status', 20)->default('queued');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->dateTime('scheduled_for')->nullable();
            $table->dateTime('sent_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['status', 'scheduled_for']);
            $table->index(['user_id', 'type']);
            $table->index('assignment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
