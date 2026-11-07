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
            // assigned, acknowledged, on_duty, completed, cancelled, no_show
            $table->string('status', 20)->default('assigned')->after('duty_type_id');
            $table->dateTime('acknowledged_at')->nullable()->after('status');
            $table->dateTime('cancelled_at')->nullable()->after('acknowledged_at');
            $table->string('cancel_reason', 500)->nullable()->after('cancelled_at');
            $table->string('override_reason', 500)->nullable()->after('cancel_reason');

            $table->index(['user_id', 'status']);
            $table->index(['requirement_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'status']);
            $table->dropIndex(['requirement_id', 'status']);
            $table->dropColumn(['status', 'acknowledged_at', 'cancelled_at', 'cancel_reason', 'override_reason']);
        });
    }
};
