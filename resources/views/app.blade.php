<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="referrer" content="origin-when-cross-origin">

        @php
            $seoData = $seo ?? ($page['props']['seo'] ?? []);
            $seoTitle = $seoData['title'] ?? (config('app.name', 'Aksara') . ' — Workspace & Catatan Kolaboratif');
            $seoDescription = $seoData['description'] ?? 'Aplikasi ruang kerja dan catatan modern bergaya Neo-Brutalism. Catat ide, kelola topik kuliah atau proyek tim, dan bagikan tautan secara instan.';
            $rawImage = $seoData['image'] ?? url('/og-image.png');
            $rawUrl = $seoData['url'] ?? request()->fullUrl();
            $seoType = $seoData['type'] ?? 'website';
            $siteName = 'Aksara Notes';

            // Ensure HTTPS for production domain
            $isHttps = request()->isSecure() || request()->header('x-forwarded-proto') === 'https' || str_starts_with(config('app.url', ''), 'https://');
            $seoImage = $isHttps ? preg_replace('/^http:/i', 'https:', $rawImage) : $rawImage;
            $seoUrl = $isHttps ? preg_replace('/^http:/i', 'https:', $rawUrl) : $rawUrl;
        @endphp

        <!-- Primary Meta Tags -->
        <title inertia>{{ $seoTitle }}</title>
        <meta name="title" content="{{ $seoTitle }}">
        <meta name="description" content="{{ $seoDescription }}">
        <meta name="keywords" content="aksara notes, workspace, catatan kuliah, neo-brutalism notes, kolaborasi catatan, manajemen tugas">
        <meta name="author" content="Aksara">
        <meta name="theme-color" content="#FFDC58">
        <link rel="canonical" href="{{ $seoUrl }}">

        <!-- Open Graph / Facebook / WhatsApp / LinkedIn / Telegram -->
        <meta property="og:type" content="{{ $seoType }}">
        <meta property="og:url" content="{{ $seoUrl }}">
        <meta property="og:site_name" content="{{ $siteName }}">
        <meta property="og:title" content="{{ $seoTitle }}">
        <meta property="og:description" content="{{ $seoDescription }}">
        <meta property="og:image" content="{{ $seoImage }}">
        <meta property="og:image:secure_url" content="{{ $seoImage }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="{{ $seoTitle }}">

        <!-- Twitter / X -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:url" content="{{ $seoUrl }}">
        <meta name="twitter:title" content="{{ $seoTitle }}">
        <meta name="twitter:description" content="{{ $seoDescription }}">
        <meta name="twitter:image" content="{{ $seoImage }}">

        <link rel="icon" type="image/png" href="/logo.png">
        <link rel="apple-touch-icon" href="/logo.png">

        <!-- Google Fonts: Space Grotesk & Plus Jakarta Sans -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-[#FFFDF8] text-slate-900 selection:bg-[#FFDC58] selection:text-black min-h-screen">
        @inertia
    </body>
</html>
