import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import NeoButton from './UI/NeoButton';
import { BookOpen, LogOut, Settings, Sparkles, User as UserIcon, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import DebouncedPrefetchLink from './DebouncedPrefetchLink';

export default function Navbar() {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showFlash, setShowFlash] = useState(true);

    useEffect(() => {
        if (flash.success || flash.error) {
            setShowFlash(true);
        }
    }, [flash.success, flash.error]);

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <header className="sticky top-0 z-40 bg-[#FFFDF8] border-b-2 border-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    <div className="flex items-center gap-6">
                        <Link href={user ? '/app' : '/'} className="flex items-center gap-2.5 group">
                            <div className="w-10 h-10 bg-[#FFDC58] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center group-hover:rotate-6 transition-transform">
                                <BookOpen className="w-5 h-5 text-black" />
                            </div>
                            <span className="font-heading font-black text-xl tracking-tight text-black flex items-center gap-1.5">
                                Catatan<span className="bg-[#A388EE] px-1 border-2 border-black text-sm">PRO</span>
                            </span>
                        </Link>

                        {user && (
                            <nav className="hidden md:flex items-center gap-2">
                                <DebouncedPrefetchLink
                                    href="/app"
                                    className="px-3 py-1.5 font-heading font-bold text-sm text-black border-2 border-transparent hover:border-black hover:bg-[#FFDC58] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    Ruang Kerja
                                </DebouncedPrefetchLink>
                                <DebouncedPrefetchLink
                                    href="/settings/preferences"
                                    className="px-3 py-1.5 font-heading font-bold text-sm text-black border-2 border-transparent hover:border-black hover:bg-[#A388EE] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                >
                                    Preferensi
                                </DebouncedPrefetchLink>
                            </nav>
                        )}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                                >
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-none border border-black bg-amber-100" />
                                    ) : (
                                        <div className="w-7 h-7 bg-[#7FBC8C] border border-black flex items-center justify-center font-black text-xs">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="font-heading font-bold text-sm hidden sm:inline-block max-w-[120px] truncate">
                                        {user.name}
                                    </span>
                                </button>

                                {dropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                                        <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] py-2 z-20">
                                            <div className="px-4 py-2 border-b-2 border-black mb-1 bg-[#F4F0EA]">
                                                <p className="text-xs font-bold text-neutral-600 uppercase">Login Sebagai</p>
                                                <p className="text-sm font-black truncate">{user.name}</p>
                                                <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                                            </div>

                                            <Link
                                                href="/settings/preferences"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-black hover:bg-[#FFDC58] transition-colors"
                                            >
                                                <Settings className="w-4 h-4" />
                                                Preferensi Pengingat
                                            </Link>

                                            <div className="border-t-2 border-black my-1" />

                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Keluar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <a href="/auth/google/redirect">
                                    <NeoButton variant="yellow" size="sm">
                                        <Sparkles className="w-4 h-4" />
                                        Masuk dengan Google
                                    </NeoButton>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Flash Messages Banner - Cleanly aligned with Navbar & Content Container */}
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
