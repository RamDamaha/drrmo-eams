<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#b91c1c">
    <title>{{ config('app.name') }}</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app/main.tsx'])
</head>
<body class="bg-gray-50 text-gray-900 antialiased">
    <div id="app"></div>
</body>
</html>
