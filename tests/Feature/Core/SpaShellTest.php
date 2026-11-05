<?php

declare(strict_types=1);

it('serves the React shell on the home page', function () {
    $this->withoutVite()
        ->get('/')
        ->assertOk()
        ->assertSee('<div id="app"></div>', false);
});

it('serves the React shell on deep links so the router can handle them', function () {
    $this->withoutVite()->get('/me/assignments/1')->assertOk();
});

it('does not serve the shell for unknown API paths', function () {
    $this->getJson('/api/does-not-exist')->assertNotFound();
});

it('reports healthy', function () {
    $this->get('/up')->assertOk();
});
