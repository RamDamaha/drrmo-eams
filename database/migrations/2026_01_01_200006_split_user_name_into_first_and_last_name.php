<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Stored in last_name when an old name was a single word. The display name leaves it out. */
    private const NO_LAST_NAME = '-';

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 100)->default('')->after('id');
            $table->string('last_name', 100)->default('')->after('first_name');
        });

        // Split at the last space: "Maria Dela Cruz" becomes "Maria Dela" and "Cruz".
        // A one word name goes to first_name and last_name gets a dash.
        DB::table('users')->select(['id', 'name'])->orderBy('id')->each(function (object $row): void {
            $name = trim((string) preg_replace('/\s+/', ' ', (string) $row->name));
            $cut = strrpos($name, ' ');
            $first = $cut === false ? $name : substr($name, 0, $cut);
            $last = $cut === false ? self::NO_LAST_NAME : substr($name, $cut + 1);

            DB::table('users')->where('id', $row->id)->update([
                'first_name' => mb_substr($first, 0, 100),
                'last_name' => mb_substr($last, 0, 100),
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('name');
        });

        // Both names are required from now on: no default.
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 100)->default(null)->change();
            $table->string('last_name', 100)->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->default('')->after('id');
        });

        DB::table('users')->select(['id', 'first_name', 'last_name'])->orderBy('id')->each(function (object $row): void {
            $last = $row->last_name === self::NO_LAST_NAME ? '' : $row->last_name;

            DB::table('users')->where('id', $row->id)->update([
                'name' => mb_substr(trim($row->first_name.' '.$last), 0, 255),
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name']);
            $table->string('name')->default(null)->change();
        });
    }
};
