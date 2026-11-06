<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CSRF protection for cookie auth. A state changing API call must carry
 * `X-Requested-With: XMLHttpRequest` (another site cannot add it without a CORS preflight we never
 * allow) and come from one of our own origins. Cookies are also SameSite=Lax.
 */
class VerifyApiRequestOrigin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (in_array($request->getMethod(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        $origin = $this->originOf($request);

        if ($request->header('X-Requested-With') !== 'XMLHttpRequest'
            || $origin === null
            || ! in_array($origin, (array) config('jwt.allowed_origins'), true)) {
            return response()->json([
                'message' => 'This request was blocked because it did not come from the app.',
                'code' => 'bad_origin',
            ], 403);
        }

        return $next($request);
    }

    private function originOf(Request $request): ?string
    {
        $origin = $request->headers->get('Origin');
        if (is_string($origin) && $origin !== '' && $origin !== 'null') {
            return rtrim($origin, '/');
        }

        $referer = $request->headers->get('Referer');
        if (! is_string($referer) || $referer === '') {
            return null;
        }

        $parts = parse_url($referer);
        if (! is_array($parts) || ! isset($parts['scheme'], $parts['host'])) {
            return null;
        }

        return $parts['scheme'].'://'.$parts['host'].(isset($parts['port']) ? ':'.$parts['port'] : '');
    }
}
