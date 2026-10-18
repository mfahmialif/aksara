import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import NeoButton from './UI/NeoButton';
import DebouncedPrefetchLink from './DebouncedPrefetchLink';
import {
    FolderKanban, Bell, Sliders, User, LogOut,
    ExternalLink, X, ArrowRight, Sparkles
} from 'lucide-react';
import { lockBodyScroll, unlockBodyScroll } from '@/utils/modalScrollLock';

export default function MobileBottomNav() {
    const { auth, notifications_summary } = usePage<PageProps>().props;
    const url = usePage().url;
    const user = auth?.user;
    const [accountSheetOpen, setAccountSheetOpen] = useState(false);

    useEffect(() => {
        if (accountSheetOpen) {
            lockBodyScroll();
        }
        return () => {
            if (accountSheetOpen) {
                unlockBodyScroll();
            }
        };
    }, [accountSheetOpen]);

    const cleanPath = url.split('?')[0].split('#')[0];

    // Only display for logged-in members, NOT on the landing page
    if (!user || cleanPath === '/' || cleanPath === '') {
        return null;
    }

    const isWorkspaceActive = url === '/app' || (url.startsWith('/app') && !url.includes('settings'));
    const isNotificationsActive = url.startsWith('/notifications');
    const isPreferencesActive = url.startsWith('/settings');

    const unreadCount = notifications_summary?.unread_count ?? 0;

    return (
        <>
            {/* Bottom Nav Bar */}
            <nav
                aria-label="Navigasi Bawah Mobile"
                className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF8] border-t-3 border-black shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)] select-none pb-[env(safe-area-inset-bottom,0px)]"
            >
                <div className="flex items-stretch justify-around h-16">
                    {/* 1. Ruang Kerja */}
                    <DebouncedPrefetchLink
                        href="/app"
                        className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 transition-all relative border-r-2 border-black ${
                            isWorkspaceActive
                                ? 'bg-[#FFDC58] text-black font-black'
                                : 'text-neutral-700 hover:text-black hover:bg-neutral-100 font-bold'
                        }`}
                    >
                        <FolderKanban className={`w-5 h-5 ${isWorkspaceActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'} transition-transform`} />
                        <span className="text-[10px] font-heading mt-1 uppercase tracking-tight leading-none">
                            Ruang Kerja
                        </span>
                        {isWorkspaceActive && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-black" />
                        )}
                    </DebouncedPrefetchLink>

                    {/* 2. Notifikasi */}
                    <DebouncedPrefetchLink
                        href="/notifications"
                        className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 transition-all relative border-r-2 border-black ${
                            isNotificationsActive
                                ? 'bg-[#A388EE] text-black font-black'
                                : 'text-neutral-700 hover:text-black hover:bg-neutral-100 font-bold'
                        }`}
                    >
                        <div className="relative">
                            <Bell className={`w-5 h-5 ${isNotificationsActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'} transition-transform`} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-3 bg-[#FF6B6B] text-black border border-black text-[9px] font-black px-1 min-w-4 h-4 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-heading mt-1 uppercase tracking-tight leading-none">
                            Notifikasi
                        </span>
                        {isNotificationsActive && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-black" />
                        )}
                    </DebouncedPrefetchLink>

                    {/* 3. Preferensi */}
                    <DebouncedPrefetchLink
                        href="/settings/preferences"
                        className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 transition-all relative border-r-2 border-black ${
                            isPreferencesActive
                                ? 'bg-[#7FBC8C] text-black font-black'
                                : 'text-neutral-700 hover:text-black hover:bg-neutral-100 font-bold'
                        }`}
                    >
                        <Sliders className={`w-5 h-5 ${isPreferencesActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'} transition-transform`} />
                        <span className="text-[10px] font-heading mt-1 uppercase tracking-tight leading-none">
                            Preferensi
                        </span>
                        {isPreferencesActive && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-black" />
                        )}
                    </DebouncedPrefetchLink>

                    {/* 4. Akun (Menu Drawer) */}
                    <button
                        type="button"
                        onClick={() => setAccountSheetOpen(true)}
                        className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 transition-all relative cursor-pointer ${
                            accountSheetOpen
                                ? 'bg-[#FF6B6B] text-black font-black'
                                : 'text-neutral-700 hover:text-black hover:bg-neutral-100 font-bold'
                        }`}
                    >
                        <User className={`w-5 h-5 ${accountSheetOpen ? 'stroke-[2.5px] scale-105' : 'stroke-2'} transition-transform`} />
                        <span className="text-[10px] font-heading mt-1 uppercase tracking-tight leading-none">
                            Akun
                        </span>
                        {accountSheetOpen && (
                            <div className="absolute top-0 left-0 right-0 h-1 bg-black" />
                        )}
                    </button>
                </div>
            </nav>

            {/* Account Mobile Drawer / Sheet */}
            {accountSheetOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 z-50 transition-opacity backdrop-blur-[1px]"
                        onClick={() => setAccountSheetOpen(false)}
                    />
                    <div
                        className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFDF8] rounded-t-[24px] border-t-3 border-x-3 border-black shadow-[0_-8px_0px_0px_rgba(0,0,0,1)] p-5 pb-8 overscroll-contain animate-in slide-in-from-bottom duration-200"
                    >
                        {/* Drag indicator pill */}
                        <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-4" />

                        {/* User Header */}
                        <div className="flex items-start justify-between pb-4 mb-4 border-b-2 border-black">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[#FFDC58] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-heading font-black text-xl text-black">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-heading font-black text-base text-black leading-tight">
                                        {user.name}
                                    </h3>
                                    <p className="text-xs font-mono font-bold text-neutral-600 truncate max-w-[200px]">
                                        {user.email}
                                    </p>
                                    <span className="inline-block mt-1 bg-[#7FBC8C] px-1.5 py-0.5 border border-black text-[10px] font-bold">
                                        Akun Member
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAccountSheetOpen(false)}
                                className="p-1.5 bg-white hover:bg-neutral-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                                aria-label="Tutup"
                            >
                                <X className="w-4 h-4 text-black" />
                            </button>
                        </div>

                        {/* Shortcut Navigation */}
                        <div className="space-y-2 mb-5">
                            <DebouncedPrefetchLink
                                href="/"
                                onClick={() => setAccountSheetOpen(false)}
                                className="w-full flex items-center justify-between p-3 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase hover:bg-[#FFDC58] transition-all"
                            >
                                <div className="flex items-center gap-2.5">
                                    <ExternalLink className="w-4 h-4 text-black" />
                                    <span>Halaman Depan (Landing Page)</span>
                                </div>
                                <ArrowRight className="w-4 h-4" />
                            </DebouncedPrefetchLink>

                            <DebouncedPrefetchLink
                                href="/settings/preferences"
                                onClick={() => setAccountSheetOpen(false)}
                                className="w-full flex items-center justify-between p-3 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase hover:bg-[#A388EE] transition-all"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Sliders className="w-4 h-4 text-black" />
                                    <span>Pengaturan Preferensi Pengingat</span>
                                </div>
                                <ArrowRight className="w-4 h-4" />
                            </DebouncedPrefetchLink>

                            <DebouncedPrefetchLink
                                href="/notifications"
                                onClick={() => setAccountSheetOpen(false)}
                                className="w-full flex items-center justify-between p-3 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-heading font-bold text-xs uppercase hover:bg-[#7FBC8C] transition-all"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Bell className="w-4 h-4 text-black" />
                                    <span>Pusat Notifikasi & Pengingat</span>
                                </div>
                                <ArrowRight className="w-4 h-4" />
                            </DebouncedPrefetchLink>
                        </div>

                        {/* Logout Button */}
                        <NeoButton
                            variant="danger"
                            size="md"
                            className="w-full justify-center text-xs uppercase font-heading font-black tracking-wider py-3"
                            onClick={() => {
                                setAccountSheetOpen(false);
                                router.post('/logout');
                            }}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Keluar dari Akun Aksara
                        </NeoButton>
                    </div>
                </>
            )}
        </>
    );
}
