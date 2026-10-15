import React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Shield, LayoutDashboard, Sliders, Users, Bell, LogOut, ExternalLink } from 'lucide-react';
import NeoButton from './UI/NeoButton';

export default function AdminNavbar() {
    const { auth, flash } = usePage<PageProps>().props;
    const admin = auth.admin;

    const handleLogout = () => {
        router.post('/admin/logout');
    };

    return (
        <header className="sticky top-0 z-40 bg-[#FFFDF8] border-b-2 border-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-6">
                        <Link href="/admin" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-[#FF6B6B] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="font-heading font-black text-lg tracking-tight text-black block leading-none">
                                    ADMIN<span className="text-[#FF6B6B]">CONSOLE</span>
                                </span>
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Internal Portal</span>
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

            {flash.success && (
                <div className="bg-[#7FBC8C] border-t-2 border-b-2 border-black px-4 py-2 text-black text-sm font-bold">
                    {flash.success}
                </div>
            )}
            {flash.error && (
                <div className="bg-[#FF6B6B] border-t-2 border-b-2 border-black px-4 py-2 text-black text-sm font-bold">
                    {flash.error}
                </div>
            )}
        </header>
    );
}
