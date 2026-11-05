<?php

declare(strict_types=1);

use App\Modules\Access\AccessServiceProvider;
use App\Modules\Events\EventsServiceProvider;
use App\Modules\Records\RecordsServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    AccessServiceProvider::class,
    RecordsServiceProvider::class,
    EventsServiceProvider::class,
];
