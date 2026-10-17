<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') — Aksara Notes</title>

    <link rel="icon" type="image/png" href="/logo.png">
    <link rel="apple-touch-icon" href="/logo.png">

    <!-- Google Fonts: Space Grotesk & Plus Jakarta Sans -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&display=swap" rel="stylesheet">

    @vite(['resources/css/app.css'])

    <style>
        body {
            background-color: #FFFDF8;
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            color: #111111;
        }
        .font-heading {
            font-family: 'Space Grotesk', system-ui, sans-serif;
        }
        .neo-box-main {
            background-color: #ffffff;
            border: 3px solid #000000;
            box-shadow: 6px 6px 0px 0px #000000;
        }
        .neo-btn-main {
            border: 2px solid #000000;
            box-shadow: 4px 4px 0px 0px #000000;
            font-weight: 800;
            transition: all 150ms ease-out;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        .neo-btn-main:hover {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0px 0px #000000;
        }
        .neo-btn-main:active {
            transform: translate(4px, 4px);
            box-shadow: 0px 0px 0px 0px #000000;
        }
        @keyframes bladeFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes bladeAirplane {
            0%, 100% { transform: translate(0, 0) rotate(-6deg); }
            50% { transform: translate(15px, -6px) rotate(3deg); }
        }
        .animate-blade-float {
            animation: bladeFloat 3.5s ease-in-out infinite;
        }
        .animate-blade-airplane {
            animation: bladeAirplane 5s ease-in-out infinite;
        }
    </style>
</head>
<body class="min-h-screen bg-[#FFFDF8] neo-grid-pattern flex flex-col justify-between selection:bg-[#FFDC58] selection:text-black">
    
    <!-- Top Header -->
    <header class="w-full border-b-2 border-black bg-white/95 backdrop-blur-sm sticky top-0 z-30">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <a href="{{ url('/') }}" class="flex items-center gap-2.5">
                <div class="w-9 h-9 bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center p-1">
                    <img src="/logo.png" alt="Aksara" class="w-full h-full object-contain">
                </div>
                <div class="flex flex-col">
                    <span class="font-heading font-black text-lg text-black uppercase tracking-tight leading-none">Aksara</span>
                    <span class="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Catatan & Workspace</span>
                </div>
            </a>

            <div class="flex items-center gap-2">
                <div class="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-xs font-bold">
                    <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    <span>HTTP_@yield('code')</span>
                </div>
                <a href="{{ url('/') }}" class="neo-btn-main bg-white hover:bg-neutral-100 text-black px-3 py-1.5 text-xs font-heading uppercase">
                    <span>Beranda</span>
                </a>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center relative">
        <div class="neo-box-main w-full max-w-3xl p-6 sm:p-10 relative overflow-hidden bg-white">
            <!-- Accent Top Ribbon -->
            <div class="absolute top-0 left-0 right-0 h-3 border-b-2 border-black" style="background-color: @yield('accent', '#FFDC58');"></div>

            <!-- Status Pill -->
            <div class="flex items-center justify-between mb-6 mt-1">
                <div class="inline-flex items-center gap-2 px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-xs font-black uppercase tracking-wider" style="background-color: @yield('badge-bg', '#FFDC58'); color: @yield('badge-color', '#000000');">
                    <span>@yield('badge')</span>
                </div>
                <span class="font-mono text-xs font-bold text-neutral-400">
                    HTTP_STATUS_@yield('code')
                </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <!-- Left: Illustration -->
                <div class="md:col-span-5 flex flex-col items-center justify-center select-none">
                    @yield('illustration')
                </div>

                <!-- Right: Description & Actions -->
                <div class="md:col-span-7 flex flex-col text-left">
                    <div class="flex items-baseline gap-3 mb-2">
                        <span class="font-heading font-black text-5xl sm:text-7xl text-black tracking-tighter">
                            @yield('code')
                        </span>
                        <span class="text-xs font-mono font-black px-2 py-0.5 bg-neutral-100 border-2 border-black uppercase">
                            @yield('category')
                        </span>
                    </div>

                    <h1 class="font-heading font-black text-2xl sm:text-3xl text-black leading-tight mb-3">
                        @yield('message-title')
                    </h1>

                    <p class="text-neutral-700 text-sm sm:text-base leading-relaxed mb-6 font-medium">
                        @yield('message')
                    </p>

                    <!-- Action Buttons -->
                    <div class="flex flex-wrap items-center gap-3 pt-2">
                        <a href="{{ auth()->check() ? route('apps.index') : url('/') }}" class="neo-btn-main bg-[#FFDC58] hover:bg-[#ffe580] text-black px-4 py-2.5 text-sm uppercase">
                            <span>{{ auth()->check() ? 'Buka Workspace Saya' : 'Kembali ke Beranda' }}</span>
                        </a>

                        <button onclick="window.history.length > 1 ? window.history.back() : window.location.href='{{ url('/') }}'" class="neo-btn-main bg-white hover:bg-neutral-100 text-black px-4 py-2.5 text-sm uppercase">
                            <span>Kembali</span>
                        </button>

                        @yield('extra-actions')
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="w-full border-t-2 border-black bg-white py-4 px-4 sm:px-6">
        <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <p class="font-heading font-black text-black uppercase tracking-tight">
                Aksara Notes &bull; Neo-Brutalism Architecture
            </p>
            <p class="font-mono text-neutral-500">
                Status: Operational (Ready)
            </p>
        </div>
    </footer>
</body>
</html>
