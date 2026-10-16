import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import DebouncedPrefetchLink from './DebouncedPrefetchLink';
import {
    LayoutDashboard, Settings, Users, Bell, LogOut,
    ClipboardList
} from 'lucide-react';
import NeoButton from './UI/NeoButton';
import AdminMobileBottomNav from './AdminMobileBottomNav';
import FlashAlertBanner from './UI/FlashAlertBanner';

export default function AdminNavbar() {
    const { auth, flash } = usePage<PageProps>().props;
    const url = usePage().url;
    const admin = auth.admin;

    const handleLogout = () => {
        router.post('/admin/logout');
    };

    const isDashboard = url === '/admin';
    const isSettings = url.startsWith('/admin/settings');
    const isUsers = url.startsWith('/admin/users');
    const isReminders = url.startsWith('/admin/reminders');
    const isLogs = url.startsWith('/admin/logs');

    return (
        <>
            <header className="sticky top-0 z-40 bg-[#FFFDF8] border-b-2 border-black">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
                        {/* Brand & Desktop Navigation */}
                        <div className="flex items-center gap-3 lg:gap-6 min-w-0">
                            <DebouncedPrefetchLink href="/admin" className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden bg-black p-1">
                                    <img src="/logo.png" alt="Aksara Admin" className="w-full h-full object-contain" />
                                </div>
                                <div className="min-w-0">
                                    <span className="font-heading font-black text-base sm:text-lg tracking-tight text-black block leading-none truncate">
                                        AKSARA<span className="text-[#FF6B6B]">ADMIN</span>
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono hidden xs:block">
                                        aksara.barakode.id
                                    </span>
                                </div>
                            </DebouncedPrefetchLink>

                            <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 overflow-x-auto py-1">
                                <DebouncedPrefetchLink
                                    href="/admin"
                                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 font-heading font-black text-xs uppercase tracking-wider text-black border-2 transition-all whitespace-nowrap ${
                                        isDashboard
                                            ? 'bg-[#FFDC58] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                            : 'border-transparent hover:border-black hover:bg-[#FFDC58] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                                    <span>Dashboard</span>
                                </DebouncedPrefetchLink>

                                <DebouncedPrefetchLink
                                    href="/admin/settings"
                                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 font-heading font-black text-xs uppercase tracking-wider text-black border-2 transition-all whitespace-nowrap ${
                                        isSettings
                                            ? 'bg-[#A388EE] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                            : 'border-transparent hover:border-black hover:bg-[#A388EE] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                                >
                                    <Settings className="w-3.5 h-3.5 shrink-0" />
                                    <span>Pengaturan</span>
                                </DebouncedPrefetchLink>

                                <DebouncedPrefetchLink
                                    href="/admin/users"
                                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 font-heading font-black text-xs uppercase tracking-wider text-black border-2 transition-all whitespace-nowrap ${
                                        isUsers
                                            ? 'bg-[#7FBC8C] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                            : 'border-transparent hover:border-black hover:bg-[#7FBC8C] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                                >
                                    <Users className="w-3.5 h-3.5 shrink-0" />
                                    <span>Pengguna</span>
                                </DebouncedPrefetchLink>

                                <DebouncedPrefetchLink
                                    href="/admin/reminders"
                                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 font-heading font-black text-xs uppercase tracking-wider text-black border-2 transition-all whitespace-nowrap ${
                                        isReminders
                                            ? 'bg-[#69D2E7] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                            : 'border-transparent hover:border-black hover:bg-[#69D2E7] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                                >
                                    <Bell className="w-3.5 h-3.5 shrink-0" />
                                    <span>Log Pengingat</span>
                                </DebouncedPrefetchLink>

                                <DebouncedPrefetchLink
                                    href="/admin/logs"
                                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 font-heading font-black text-xs uppercase tracking-wider text-black border-2 transition-all whitespace-nowrap ${
                                        isLogs
                                            ? 'bg-[#FF8FAB] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                            : 'border-transparent hover:border-black hover:bg-[#FF8FAB] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                                >
                                    <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                                    <span>Log Aktivitas Pro</span>
                                </DebouncedPrefetchLink>
                            </nav>
                        </div>

                        {/* Right: Admin Profile & Logout */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-heading font-black text-black text-xs shrink-0 select-none">
                                    {admin?.name?.charAt(0).toUpperCase() || 'A'}
                                </div>
                                <div className="hidden sm:block text-right">
                                    <p className="text-xs font-heading font-black text-black leading-tight truncate max-w-[150px]">
                                        {admin?.name}
                                    </p>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                                        {admin?.role || 'Admin'}
                                    </p>
                                </div>
                            </div>

                            <NeoButton
                                variant="danger"
                                size="sm"
                                onClick={handleLogout}
                                className="cursor-pointer shrink-0"
                                title="Keluar dari Panel Admin"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Keluar</span>
                            </NeoButton>
                        </div>
                    </div>
                </div>

                {/* Flash Messages Banner */}
                <FlashAlertBanner success={flash.success} error={flash.error} />
            </header>

            {/* Mobile Bottom Navigation Bar */}
            <AdminMobileBottomNav />
        </>
    );
}
