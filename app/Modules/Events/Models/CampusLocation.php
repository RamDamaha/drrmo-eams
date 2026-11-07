<?php

declare(strict_types=1);

namespace App\Modules\Events\Models;

use Illuminate\Database\Eloquent\Model;

class CampusLocation extends Model
{
    protected $fillable = ['name', 'latitude', 'longitude'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['latitude' => 'float', 'longitude' => 'float'];
    }
}
