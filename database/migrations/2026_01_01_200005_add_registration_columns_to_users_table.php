<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // pending_email, pending_approval, active or rejected. Existing rows are active.
            $table->string('account_status', 20)->default('active')->after('status');
            // Email confirmation code. Only a hash is stored.
            $table->string('verification_code_hash', 64)->nullable();
            $table->timestamp('verification_expires_at')->nullable();
            $table->unsignedTinyInteger('verification_attempts')->default(0);
            $table->timestamp('verification_sent_at')->nullable();
            // Admin decision on a sign up request.
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('rejection_reason', 500)->nullable();

            $table->index(['account_status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['account_status', 'created_at']);
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn([
                'account_status', 'verification_code_hash', 'verification_expires_at',
                'verification_attempts', 'verification_sent_at', 'reviewed_at', 'rejection_reason',
            ]);
        });
    }
};
