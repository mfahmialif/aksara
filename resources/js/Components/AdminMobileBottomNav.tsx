import React from 'react';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import DebouncedPrefetchLink from './DebouncedPrefetchLink';
import {
    LayoutDashboard, Settings, Users, Bell, ClipboardList
} from 'lucide-react';

export default function AdminMobileBottomNav() {
    const { auth } = usePage<PageProps>().props;
    const url = usePage().url;
    const admin = auth.admin;

    if (!admin) {
        return null;
    }

    const isDashboardActive = url === '/admin';
    const isSettingsActive = url.startsWith('/admin/settings');
    const isUsersActive = url.startsWith('/admin/users');
    const isRemindersActive = url.startsWith('/admin/reminders');
    const isLogsActive = url.startsWith('/admin/logs');

    return (
        <nav
            aria-label="Navigasi Bawah Admin Mobile"
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF8] border-t-2 border-black shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] select-none pb-[env(safe-area-inset-bottom,0px)]"
        >
            <div className="flex items-stretch justify-around h-15 sm:h-16">
                {/* 1. Dashboard */}
                <DebouncedPrefetchLink
                    href="/admin"
                    className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all relative border-r border-black/40 ${
                        isDashboardActive
                            ? 'bg-[#FFDC58] text-black font-black'
                            : 'text-neutral-700 hover:text-black hover:bg-neutral-100 font-bold'
                    }`}
                >
                    <LayoutDashboard className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${isDashboardActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'} transition-transform`} />
                    <span className="text-[9px] sm:text-[10px] font-heading mt-1 uppercase tracking-tight leading-none text-center">
                        Dashboard
                    </span>
                    {isDashboardActive && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-black" />
                    )}
                </DebouncedPrefetchLink>

                {/* 2. Pengaturan */}
                <DebouncedPrefetchLink
                    href="/admin/settings"
                    className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all relative border-r border-black/40 ${
                        isSettingsActive
                            ? 'bg-[#A388EE] text-black font-black'
                            : 'text-neutral-700 hover:text-black hover:bg-neutral-100 font-bold'
                    }`}
                >
                    <Settings className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${isSettingsActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'} transition-transform`} />
                    <span className="text-[9px] sm:text-[10px] font-heading mt-1 uppercase tracking-tight leading-none text-center">
                        Pengaturan
                    </span>
                    {isSettingsActive && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-black" />
                    )}
                </DebouncedPrefetchLink>

                {/* 3. Pengguna */}
                <DebouncedPrefetchLink
                    href="/admin/users"
                    className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all relative border-r border-black/40 ${
                        isUsersActive
                            ? 'bg-[#7FBC8C] text-black font-black'
                            : 'text-neutral-700 hover:text-black hover:bg-neutral-100 font-bold'
                    }`}
                >
                    <Users className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${isUsersActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'} transition-transform`} />
                    <span className="text-[9px] sm:text-[10px] font-heading mt-1 uppercase tracking-tight leading-none text-center">
                        Pengguna
                    </span>
                    {isUsersActive && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-black" />
                    )}
                </DebouncedPrefetchLink>

                {/* 4. Log Pengingat */}
                <DebouncedPrefetchLink
                    href="/admin/reminders"
                    className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all relative border-r border-black/40 ${
                        isRemindersActive
                            ? 'bg-[#69D2E7] text-black font-black'
                            : 'text-neutral-700 hover:text-black hover:bg-neutral-100 font-bold'
                    }`}
                >
                    <Bell className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${isRemindersActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'} transition-transform`} />
                    <span className="text-[9px] sm:text-[10px] font-heading mt-1 uppercase tracking-tight leading-none text-center">
                        Pengingat
                    </span>
                    {isRemindersActive && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-black" />
                    )}
                </DebouncedPrefetchLink>

                {/* 5. Log Aktivitas Pro */}
                <DebouncedPrefetchLink
                    href="/admin/logs"
                    className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 transition-all relative ${
                        isLogsActive
                            ? 'bg-[#FF8FAB] text-black font-black'
                            : 'text-neutral-700 hover:text-black hover:bg-neutral-100 font-bold'
                    }`}
                >
                    <ClipboardList className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${isLogsActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'} transition-transform`} />
                    <span className="text-[9px] sm:text-[10px] font-heading mt-1 uppercase tracking-tight leading-none text-center">
                        Log Pro
                    </span>
                    {isLogsActive && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-black" />
                    )}
                </DebouncedPrefetchLink>
            </div>
        </nav>
    );
}
