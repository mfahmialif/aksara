import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import confetti from 'canvas-confetti';
import { 
    Home, 
    ArrowLeft, 
    Search, 
    Copy, 
    Check, 
    RefreshCw, 
    AlertTriangle, 
    Lock, 
    ShieldAlert, 
    Clock, 
    Zap, 
    ServerCrash, 
    Sparkles, 
    Wrench, 
    FolderKanban, 
    LogIn 
} from 'lucide-react';
import NeoButton from '@/Components/UI/NeoButton';
import NeoCard from '@/Components/UI/NeoCard';

interface ErrorPageProps {
    status: number;
    message?: string;
}

export default function ErrorPage({ status = 404, message }: ErrorPageProps) {
    const { auth } = usePage<{ auth?: { user?: any; admin?: any } }>().props;
    const [copied, setCopied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [incidentId] = useState(() => 'ERR-' + Math.random().toString(36).substring(2, 9).toUpperCase());
    
    // Interactive mouse tracking for 404 character googly eyes
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const illustrationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!illustrationRef.current) return;
            const rect = illustrationRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;
            const angle = Math.atan2(dy, dx);
            const distance = Math.min(6, Math.hypot(dx, dy) / 25);
            
            setMousePos({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const triggerConfetti = () => {
        try {
            confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFDC58', '#A388EE', '#FF6B6B', '#69D2E7', '#7FBC8C', '#000000'],
                shapes: ['square'],
                scalar: 1.2,
            });
        } catch {
            // Fallback gracefully if confetti fails
        }
    };

    const handleCopyUrl = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCopyIncidentId = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(`${incidentId} - ${status} on ${window.location.href}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleQuickSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/app?q=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    // Configuration for different error codes
    const errorConfigs: Record<number, {
        badge: string;
        badgeColor: string;
        title: string;
        description: string;
        accentColor: string;
        category: string;
    }> = {
        404: {
            badge: 'ERROR 404 • HILANG DARI RADAR',
            badgeColor: 'bg-[#FFDC58]',
            title: 'Catatan Tidak Ditemukan!',
            description: message || 'Ups! Halaman atau catatan yang kamu tuju sepertinya sudah dipindahkan, dihapus, atau tersesat di luar angkasa catatan.',
            accentColor: '#FFDC58',
            category: 'Not Found',
        },
        403: {
            badge: 'ERROR 403 • AKSES DILARANG',
            badgeColor: 'bg-[#FF6B6B] text-white',
            title: 'Area Terkunci Rapat!',
            description: message || 'Kamu tidak memiliki izin untuk membuka catatan atau workspace ini. Hubungi pemilik atau ganti akun yang memiliki hak akses.',
            accentColor: '#FF6B6B',
            category: 'Forbidden',
        },
        401: {
            badge: 'ERROR 401 • BUTUH TIKET MASUK',
            badgeColor: 'bg-[#69D2E7]',
            title: 'Sesi Belum Terautentikasi',
            description: message || 'Catatan atau ruang kerja ini bersifat pribadi. Silakan masuk dengan akun terdaftarmu terlebih dahulu.',
            accentColor: '#69D2E7',
            category: 'Unauthorized',
        },
        419: {
            badge: 'ERROR 419 • WAKTU HABIS',
            badgeColor: 'bg-[#A388EE] text-white',
            title: 'Sesi Halaman Kadaluwarsa',
            description: message || 'Formulir atau token keamanan telah habis masa berlakunya karena tidak ada aktivitas. Silakan muat ulang halaman ini.',
            accentColor: '#A388EE',
            category: 'Page Expired',
        },
        429: {
            badge: 'ERROR 429 • TERLALU NGEBUT',
            badgeColor: 'bg-[#FFA94D]',
            title: 'Pelan-pelan, Kawan!',
            description: message || 'Sistem mendeteksi terlalu banyak permintaan dalam waktu singkat. Ambil nafas sejenak, lalu coba kembali sesaat lagi.',
            accentColor: '#FFA94D',
            category: 'Rate Limited',
        },
        500: {
            badge: 'ERROR 500 • KORSLETING SERVER',
            badgeColor: 'bg-rose-500 text-white',
            title: 'Terjadi Kendala di Dapur Server',
            description: message || 'Aduh! Terjadi kesalahan tak terduga pada sistem backend kami. Tim pengembang telah diberi tahu untuk menanganinya.',
            accentColor: '#EF4444',
            category: 'Server Error',
        },
        503: {
            badge: 'ERROR 503 • SEDANG RENOVASI',
            badgeColor: 'bg-[#7FBC8C]',
            title: 'Aksara Sedang Maintenance',
            description: message || 'Kami sedang melakukan pemeliharaan rutin dan pembaruan sistem agar Aksara semakin ngebut dan andal. Kembali sebentar lagi ya!',
            accentColor: '#7FBC8C',
            category: 'Maintenance',
        },
    };

    const currentError = errorConfigs[status] || {
        badge: `ERROR ${status} • GANGGUAN SISTEM`,
        badgeColor: 'bg-[#FFDC58]',
        title: `Terjadi Kesalahan (${status})`,
        description: message || 'Terjadi kesalahan pada permintaan kamu. Silakan kembali ke beranda atau coba beberapa saat lagi.',
        accentColor: '#FFDC58',
        category: 'System Error',
    };

    const homeUrl = auth?.admin ? '/admin' : (auth?.user ? '/app' : '/');
    const homeLabel = auth?.admin ? 'Kembali ke Admin Panel' : (auth?.user ? 'Buka Workspace Saya' : 'Kembali ke Beranda');

    return (
        <div className="min-h-screen bg-[#FFFDF8] neo-grid-pattern text-slate-900 flex flex-col justify-between selection:bg-[#FFDC58] selection:text-black font-sans relative overflow-x-hidden">
            <Head title={`${status} — ${currentError.title}`} />

            {/* Top Brand Bar */}
            <header className="w-full border-b-2 border-black bg-white/95 backdrop-blur-sm sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center p-1 transition-transform group-hover:-rotate-3">
                            <img src="/logo.png" alt="Aksara" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-heading font-black text-lg text-black uppercase tracking-tight leading-none">Aksara</span>
                            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Catatan & Workspace</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-xs font-bold">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                            <span>HTTP_{status}</span>
                        </div>
                        <Link href={homeUrl}>
                            <NeoButton variant="white" size="sm">
                                <Home className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Beranda</span>
                            </NeoButton>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Interactive Error Stage */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center relative">
                
                {/* Decorative Retro Stickers Scattered in Background */}
                <div className="absolute top-6 left-4 sm:left-12 pointer-events-none select-none hidden md:block">
                    <div className="bg-[#A388EE] text-black font-heading font-black text-xs px-3 py-1.5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rotate-[-6deg] animate-neo-float-slow">
                        ✦ SISTEM AKSARA
                    </div>
                </div>
                <div className="absolute bottom-8 right-6 sm:right-16 pointer-events-none select-none hidden md:block">
                    <div className="bg-[#7FBC8C] text-black font-heading font-black text-xs px-3 py-1.5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rotate-[8deg] animate-neo-float-reverse">
                        ★ CATATAN AMAN
                    </div>
                </div>
                <div className="absolute top-24 right-4 sm:right-20 pointer-events-none select-none hidden lg:block">
                    <div className="bg-[#FF6B6B] text-white font-mono text-xs font-black px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-[12deg] animate-neo-wiggle">
                        {`{ code: ${status} }`}
                    </div>
                </div>

                {/* Central Neo-Brutalism Stage Box */}
                <NeoCard 
                    color="bg-white" 
                    shadowSize="lg" 
                    className="w-full max-w-3xl border-3 border-black p-6 sm:p-10 relative overflow-hidden"
                >
                    {/* Top Caution Bar / Color Ribbon */}
                    <div 
                        className="absolute top-0 left-0 right-0 h-3 border-b-2 border-black"
                        style={{ backgroundColor: currentError.accentColor }}
                    />

                    {/* Status Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 mt-1">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-xs font-black uppercase tracking-wider ${currentError.badgeColor}`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {currentError.badge}
                        </div>
                        <span className="font-mono text-xs font-bold text-neutral-400">
                            INCIDENT: {incidentId}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                        
                        {/* LEFT COLUMN: Dedicated Illustration */}
                        <div className="md:col-span-5 flex flex-col items-center justify-center">
                            
                            {/* SPECIAL 404 ILUSTRASI & ANIMASI MANTAP */}
                            {status === 404 ? (
                                <div 
                                    ref={illustrationRef}
                                    className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center select-none"
                                >
                                    {/* Radar / Scan Ring Pulse */}
                                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-neutral-300 animate-spin" style={{ animationDuration: '24s' }} />
                                    <div className="absolute w-44 h-44 rounded-full bg-[#FFDC58]/20 border-2 border-black/10 animate-neo-pulse-subtle" />

                                    {/* Paper Airplane Flying Around */}
                                    <div className="absolute -top-2 -right-2 z-20 animate-neo-airplane">
                                        <div className="bg-[#69D2E7] p-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rotate-[15deg]">
                                            <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Floating Note Character (Buku Catatan Nyasar) */}
                                    <div className="relative z-10 animate-neo-float">
                                        {/* Tape on top */}
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-[#A388EE]/80 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-[-4deg] z-20 flex items-center justify-center">
                                            <span className="text-[9px] font-mono font-black text-black">HILANG</span>
                                        </div>

                                        {/* Notebook Body */}
                                        <div className="w-36 h-44 bg-[#FFDC58] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-sm p-2 flex flex-col justify-between relative overflow-hidden">
                                            
                                            {/* Spiral Binding Marks */}
                                            <div className="absolute left-1.5 top-0 bottom-0 w-2 flex flex-col justify-around py-2 border-r-2 border-black/20">
                                                {[...Array(6)].map((_, i) => (
                                                    <div key={i} className="w-1.5 h-1.5 bg-black rounded-full" />
                                                ))}
                                            </div>

                                            {/* Inner White Note Page */}
                                            <div className="ml-3 h-full bg-white border-2 border-black p-2 flex flex-col justify-between">
                                                
                                                {/* Header Line */}
                                                <div className="border-b border-neutral-300 pb-1 flex items-center justify-between">
                                                    <span className="text-[8px] font-mono font-bold text-neutral-400">NOTE #404</span>
                                                    <span className="text-[10px]">❓</span>
                                                </div>

                                                {/* Confused Googly Face */}
                                                <div className="flex flex-col items-center justify-center my-auto">
                                                    {/* Googly Eyes Tracking Mouse */}
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        {/* Left Eye */}
                                                        <div className="w-6 h-6 rounded-full bg-white border-2 border-black relative flex items-center justify-center overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                            <div 
                                                                className="w-2.5 h-2.5 rounded-full bg-black transition-transform duration-75"
                                                                style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
                                                            />
                                                        </div>
                                                        {/* Right Eye */}
                                                        <div className="w-6 h-6 rounded-full bg-white border-2 border-black relative flex items-center justify-center overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                            <div 
                                                                className="w-2.5 h-2.5 rounded-full bg-black transition-transform duration-75"
                                                                style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Wobbly Mouth */}
                                                    <div className="w-5 h-1.5 border-b-2 border-black rounded-full" />
                                                    
                                                    {/* Sweat Drop */}
                                                    <span className="text-[10px] absolute -right-0.5 top-8 animate-bounce">💧</span>
                                                </div>

                                                {/* Ruled Lines */}
                                                <div className="space-y-1">
                                                    <div className="h-0.5 bg-neutral-200 w-full" />
                                                    <div className="h-0.5 bg-neutral-200 w-3/4" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Little Dangling Feet */}
                                        <div className="flex justify-around px-8 -mt-1 relative z-0">
                                            <div className="w-3 h-4 bg-black border-2 border-black rounded-b-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
                                            <div className="w-3 h-4 bg-black border-2 border-black rounded-b-md shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
                                        </div>
                                    </div>

                                    {/* Floating Mini Sticky Note Tag */}
                                    <div className="absolute -bottom-2 -left-3 bg-[#FF6B6B] text-white text-[10px] font-mono font-black px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-[-10deg] animate-neo-float-slow">
                                        404: MISSING!
                                    </div>
                                </div>
                            ) : status === 403 ? (
                                /* 403: LOCKED VAULT / BIG NEO PADLOCK */
                                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
                                    <div className="absolute inset-0 bg-[#FF6B6B]/20 rounded-full animate-neo-pulse-subtle" />
                                    <div className="relative z-10 flex flex-col items-center animate-neo-wiggle">
                                        {/* Padlock Shackle */}
                                        <div className="w-20 h-16 border-4 border-black rounded-t-full bg-neutral-200 mb-[-12px]" />
                                        {/* Padlock Body */}
                                        <div className="w-36 h-32 bg-[#FF6B6B] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-3 relative">
                                            <div className="absolute top-1 left-2 flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-black" />
                                                <div className="w-2 h-2 rounded-full bg-black" />
                                            </div>
                                            {/* Keyhole */}
                                            <div className="w-6 h-6 rounded-full bg-black mb-1 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                            </div>
                                            <div className="w-3 h-5 bg-black rounded-b-sm" />
                                            <div className="mt-2 bg-black text-white text-[9px] font-mono font-black px-2 py-0.5 border border-black uppercase">
                                                DIKUNCI
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : status === 401 ? (
                                /* 401: VIP / KEYCARD REQUIRED */
                                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
                                    <div className="w-32 h-44 bg-[#69D2E7] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col justify-between rotate-[-4deg] animate-neo-float">
                                        <div className="w-8 h-2 bg-black rounded-full mx-auto" />
                                        <div className="w-16 h-16 bg-white border-2 border-black mx-auto flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <LogIn className="w-8 h-8 text-black" />
                                        </div>
                                        <div className="bg-white border-2 border-black text-center py-1 font-mono text-[10px] font-black uppercase">
                                            LOGIN DULU
                                        </div>
                                    </div>
                                </div>
                            ) : status === 419 ? (
                                /* 419: EXPIRED CLOCK / HOURGLASS */
                                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
                                    <div className="w-36 h-36 rounded-full bg-[#A388EE] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center p-4 animate-neo-float">
                                        <Clock className="w-14 h-14 text-black animate-spin" style={{ animationDuration: '10s' }} />
                                        <div className="mt-1 bg-black text-white font-mono text-[9px] font-black px-2 py-0.5 border border-black">
                                            TIMEOUT!
                                        </div>
                                    </div>
                                </div>
                            ) : status === 429 ? (
                                /* 429: SPEEDOMETER OVERHEAT */
                                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
                                    <div className="w-40 h-32 bg-[#FFA94D] border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-t-full flex flex-col items-center justify-center p-3 animate-neo-wiggle">
                                        <Zap className="w-12 h-12 text-black mb-1" />
                                        <div className="bg-black text-white font-mono text-[9px] font-black px-2 py-0.5 uppercase">
                                            SPEED LIMIT
                                        </div>
                                    </div>
                                </div>
                            ) : status === 503 ? (
                                /* 503: MAINTENANCE CONE */
                                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
                                    <div className="relative z-10 flex flex-col items-center animate-neo-float">
                                        <div className="w-0 h-0 border-l-[36px] border-l-transparent border-r-[36px] border-r-transparent border-b-[68px] border-b-[#FFA94D] relative">
                                            <div className="absolute top-[28px] -left-[24px] w-[48px] h-[14px] bg-white border-y-2 border-black" />
                                        </div>
                                        <div className="w-28 h-4 bg-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" />
                                        <div className="mt-2 flex items-center gap-1.5 bg-[#7FBC8C] border-2 border-black px-2.5 py-1 font-mono text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <Wrench className="w-3.5 h-3.5" />
                                            <span>MAINTENANCE</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* 500 / DEFAULT: CRASHED SERVER WITH SPARKS */
                                <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center select-none">
                                    <div className="w-36 h-40 bg-neutral-100 border-3 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 flex flex-col justify-between animate-neo-wiggle">
                                        <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                                            <div className="flex gap-1">
                                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                            </div>
                                            <ServerCrash className="w-4 h-4 text-rose-600" />
                                        </div>
                                        <div className="text-center font-mono font-black text-rose-600 text-lg">
                                            x__x
                                        </div>
                                        <div className="bg-black text-white text-center py-1 font-mono text-[10px] font-black uppercase">
                                            SERVER CRASH
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Easter Egg Confetti Button */}
                            <button
                                type="button"
                                onClick={triggerConfetti}
                                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFFDF8] hover:bg-[#FFDC58] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-xs font-heading font-black tracking-wide uppercase cursor-pointer transition-all"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>🎉 Hibur Diri / Konfeti</span>
                            </button>
                        </div>

                        {/* RIGHT COLUMN: Typography, Description & Action Buttons */}
                        <div className="md:col-span-7 flex flex-col text-left">
                            
                            {/* Giant Neo-Brutalism Number */}
                            <div className="flex items-baseline gap-3 mb-2">
                                <span className="font-heading font-black text-5xl sm:text-7xl text-black tracking-tighter drop-shadow-[3px_3px_0px_rgba(0,0,0,0.15)]">
                                    {status}
                                </span>
                                <span className="text-xs font-mono font-black px-2 py-0.5 bg-neutral-100 border-2 border-black uppercase">
                                    {currentError.category}
                                </span>
                            </div>

                            <h1 className="font-heading font-black text-2xl sm:text-3xl text-black leading-tight mb-3">
                                {currentError.title}
                            </h1>

                            <p className="text-neutral-700 text-sm sm:text-base leading-relaxed mb-6 font-medium">
                                {currentError.description}
                            </p>

                            {/* Quick Search Widget specifically on 404 */}
                            {status === 404 && (
                                <form onSubmit={handleQuickSearch} className="mb-6">
                                    <label className="block text-xs font-heading font-bold text-neutral-600 uppercase tracking-wider mb-1.5">
                                        Mau mencari catatan lain?
                                    </label>
                                    <div className="flex items-stretch gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Ketik judul catatan atau ruang kerja..."
                                                className="w-full h-10 px-3 pl-9 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                            />
                                            <Search className="w-4 h-4 text-neutral-400 absolute left-2.5 top-3 pointer-events-none" />
                                        </div>
                                        <NeoButton type="submit" variant="yellow" size="sm">
                                            Cari
                                        </NeoButton>
                                    </div>
                                </form>
                            )}

                            {/* Action Buttons Group */}
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <Link href={homeUrl}>
                                    <NeoButton variant="yellow" size="md">
                                        <FolderKanban className="w-4 h-4" />
                                        <span>{homeLabel}</span>
                                    </NeoButton>
                                </Link>

                                {status === 419 || status === 500 ? (
                                    <NeoButton 
                                        variant="white" 
                                        size="md"
                                        onClick={() => window.location.reload()}
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        <span>Muat Ulang Halaman</span>
                                    </NeoButton>
                                ) : (
                                    <NeoButton 
                                        variant="white" 
                                        size="md"
                                        onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = homeUrl}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Kembali</span>
                                    </NeoButton>
                                )}

                                {status === 401 && (
                                    <Link href="/login">
                                        <NeoButton variant="black" size="md">
                                            <LogIn className="w-4 h-4" />
                                            <span>Masuk Sekarang</span>
                                        </NeoButton>
                                    </Link>
                                )}

                                {status === 404 && (
                                    <button
                                        type="button"
                                        onClick={handleCopyUrl}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs font-heading font-bold uppercase transition-all"
                                        title="Salin tautan ini untuk dilaporkan"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? 'Tersalin!' : 'Salin URL'}</span>
                                    </button>
                                )}
                            </div>

                            {/* Error Incident Reference for 500 / Reporting */}
                            {status >= 500 && (
                                <div className="mt-6 p-3 bg-neutral-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between text-xs font-mono">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-neutral-500 uppercase text-[10px]">Kode Insiden</span>
                                        <span className="font-black text-black">{incidentId}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopyIncidentId}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-black hover:bg-neutral-100 font-bold"
                                    >
                                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                        <span>{copied ? 'Tersalin' : 'Salin Detail'}</span>
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </NeoCard>

                {/* Helpful Quick Navigation Links */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-heading font-bold text-neutral-600">
                    <span>Tautan Berguna:</span>
                    <Link href="/" className="underline hover:text-black hover:bg-[#FFDC58] px-1.5 py-0.5 border border-transparent hover:border-black transition-colors">
                        Beranda
                    </Link>
                    <span>&bull;</span>
                    <Link href="/login" className="underline hover:text-black hover:bg-[#69D2E7] px-1.5 py-0.5 border border-transparent hover:border-black transition-colors">
                        Masuk / Registrasi
                    </Link>
                    <span>&bull;</span>
                    <Link href="/app" className="underline hover:text-black hover:bg-[#A388EE] px-1.5 py-0.5 border border-transparent hover:border-black transition-colors">
                        Workspace Catatan
                    </Link>
                </div>
            </main>

            {/* Neo-Brutalism Minimal Footer */}
            <footer className="w-full border-t-2 border-black bg-white py-4 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                    <p className="font-heading font-black text-black uppercase tracking-tight">
                        Aksara Notes &bull; Neo-Brutalism Architecture
                    </p>
                    <p className="font-mono text-neutral-500">
                        Status: Operational (Ready)
                    </p>
                </div>
            </footer>
        </div>
    );
}
