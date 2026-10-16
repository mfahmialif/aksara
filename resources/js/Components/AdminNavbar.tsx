import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { LayoutDashboard, Sliders, Users, Bell, LogOut, ExternalLink, CheckCircle2, AlertTriangle, X, ClipboardList } from 'lucide-react';
import NeoButton from './UI/NeoButton';

export default function AdminNavbar() {
    const { auth, flash } = usePage<PageProps>().props;
    const admin = auth.admin;
    const [showFlash, setShowFlash] = useState(true);

    useEffect(() => {
        if (flash.success || flash.error) {
            setShowFlash(true);
        }
    }, [flash.success, flash.error]);

    const handleLogout = () => {
        router.post('/admin/logout');
    };

    return (
        <header className="sticky top-0 z-40 bg-[#FFFDF8] border-b-2 border-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-6">
                        <Link href="/admin" className="flex items-center gap-3">
                            <div className="w-10 h-10 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden bg-black p-1">
                                <img src="/logo.png" alt="Aksara Admin" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <span className="font-heading font-black text-lg tracking-tight text-black block leading-none">
                                    AKSARA<span className="text-[#FF6B6B]">ADMIN</span>
                                </span>
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">aksara.barakode.id</span>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center gap-1.5">
                            <Link
                                href="/admin"
                                className="flex items-center gap-1.5 px-3 py-1.5 font-heading font-bold text-xs uppercase tracking-wider text-black border-2 border-transparent hover:border-black hover:bg-[#FFDC58] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <LayoutDashboard className="w-3.5 h-3.5" />
                                Dashboard
                            </Link>
                            <Link
                                href="/admin/settings"
                                className="flex items-center gap-1.5 px-3 py-1.5 font-heading font-bold text-xs uppercase tracking-wider text-black border-2 border-transparent hover:border-black hover:bg-[#A388EE] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <Sliders className="w-3.5 h-3.5" />
                                Batasan File
                            </Link>
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-1.5 px-3 py-1.5 font-heading font-bold text-xs uppercase tracking-wider text-black border-2 border-transparent hover:border-black hover:bg-[#7FBC8C] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <Users className="w-3.5 h-3.5" />
                                Pengguna
                            </Link>
                            <Link
                                href="/admin/reminders"
                                className="flex items-center gap-1.5 px-3 py-1.5 font-heading font-bold text-xs uppercase tracking-wider text-black border-2 border-transparent hover:border-black hover:bg-[#69D2E7] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <Bell className="w-3.5 h-3.5" />
                                Log Pengingat
                            </Link>
                            <Link
                                href="/admin/logs"
                                className="flex items-center gap-1.5 px-3 py-1.5 font-heading font-bold text-xs uppercase tracking-wider text-black border-2 border-transparent hover:border-black hover:bg-[#FF8FAB] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            >
                                <ClipboardList className="w-3.5 h-3.5" />
                                Log Aktivitas Pro
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/app" target="_blank" className="text-xs font-bold flex items-center gap-1 hover:underline">
                            Lihat Web <ExternalLink className="w-3 h-3" />
                        </Link>
                        <div className="hidden sm:block text-right">
                            <p className="text-xs font-black">{admin?.name}</p>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase">{admin?.role}</p>
                        </div>
                        <NeoButton variant="danger" size="sm" onClick={handleLogout}>
                            <LogOut className="w-3.5 h-3.5" />
                            Keluar
                        </NeoButton>
                    </div>
                </div>
            </div>

            {/* Flash Messages Banner - Cleanly aligned with Admin Navbar Container */}
            {((flash.success && showFlash) || (flash.error && showFlash)) && (
                <div className="border-t-2 border-black bg-[#FFFDF8] py-2.5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {flash.success && (
                            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#7FBC8C] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-6 h-6 bg-white border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                        <CheckCircle2 className="w-4 h-4 text-black" />
                                    </div>
                                    <span className="text-sm font-black font-heading uppercase tracking-wide text-black truncate">
                                        {flash.success}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowFlash(false)}
                                    className="p-1 hover:bg-black/10 border border-transparent hover:border-black transition-colors cursor-pointer shrink-0"
                                    title="Tutup pemberitahuan"
                                    aria-label="Tutup"
                                >
                                    <X className="w-4 h-4 text-black" />
                                </button>
                            </div>
                        )}
                        {flash.error && (
                            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#FF6B6B] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-6 h-6 bg-white border border-black flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                        <AlertTriangle className="w-4 h-4 text-black" />
                                    </div>
                                    <span className="text-sm font-black font-heading uppercase tracking-wide text-black truncate">
                                        {flash.error}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowFlash(false)}
                                    className="p-1 hover:bg-black/10 border border-transparent hover:border-black transition-colors cursor-pointer shrink-0"
                                    title="Tutup pemberitahuan"
                                    aria-label="Tutup"
                                >
                                    <X className="w-4 h-4 text-black" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
