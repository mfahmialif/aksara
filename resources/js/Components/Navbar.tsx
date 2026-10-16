import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { PageProps, AppNotification } from '@/types';
import NeoButton from './UI/NeoButton';
import {
    BookOpen, LogOut, Settings, Sparkles, User as UserIcon,
    CheckCircle2, AlertTriangle, X, Bell, Check, Archive, Clock, ExternalLink
} from 'lucide-react';
import DebouncedPrefetchLink from './DebouncedPrefetchLink';

export default function Navbar() {
    const { auth, flash, notifications_summary } = usePage<PageProps>().props;
    const user = auth.user;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [showFlash, setShowFlash] = useState(true);

    useEffect(() => {
        if (flash.success || flash.error) {
            setShowFlash(true);
        }
    }, [flash.success, flash.error]);

    const handleLogout = () => {
        router.post('/logout');
    };

    const handleMarkAsRead = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        router.post(`/notifications/${id}/read`, {}, { preserveScroll: true });
    };

    const handleArchive = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        router.post(`/notifications/${id}/archive`, {}, { preserveScroll: true });
    };

    const handleMarkAllAsRead = () => {
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    };

    const handleNotificationClick = (notif: AppNotification) => {
        if (!notif.read_at) {
            router.post(`/notifications/${notif.id}/read`, {}, { preserveScroll: true });
        }
        setNotifOpen(false);
        if (notif.action_url) {
            router.visit(notif.action_url);
        }
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
                                <DebouncedPrefetchLink
                                    href="/notifications"
                                    className="px-3 py-1.5 font-heading font-bold text-sm text-black border-2 border-transparent hover:border-black hover:bg-[#7FBC8C] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5"
                                >
                                    <Bell className="w-4 h-4" />
                                    Notifikasi
                                    {(notifications_summary?.unread_count ?? 0) > 0 && (
                                        <span className="bg-[#FF6B6B] text-black border border-black font-black text-xs px-1.5 py-0.5">
                                            {notifications_summary?.unread_count}
                                        </span>
                                    )}
                                </DebouncedPrefetchLink>
                            </nav>
                        )}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* Notification Bell Button & Dropdown */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNotifOpen(!notifOpen);
                                            setDropdownOpen(false);
                                        }}
                                        className="relative p-2 bg-white hover:bg-[#FFDC58] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex items-center justify-center"
                                        title="Pusat Pemberitahuan & Pengingat"
                                        aria-label="Notifikasi"
                                    >
                                        <Bell className="w-5 h-5 text-black" />
                                        {(notifications_summary?.unread_count ?? 0) > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-[#FF6B6B] text-black border-2 border-black font-heading font-black text-[11px] min-w-5 h-5 px-1 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                                                {notifications_summary?.unread_count}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notifications Dropdown */}
                                    {notifOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                                            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] py-2 z-20">
                                                {/* Header */}
                                                <div className="px-4 py-2.5 border-b-2 border-black bg-[#FFDC58] flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Bell className="w-4 h-4 text-black" />
                                                        <span className="font-heading font-black text-sm uppercase text-black">
                                                            Notifikasi & Pengingat
                                                        </span>
                                                        {(notifications_summary?.unread_count ?? 0) > 0 && (
                                                            <span className="bg-[#FF6B6B] text-black border border-black text-xs font-black px-1.5 py-0.5">
                                                                {notifications_summary?.unread_count} Baru
                                                            </span>
                                                        )}
                                                    </div>
                                                    {(notifications_summary?.unread_count ?? 0) > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={handleMarkAllAsRead}
                                                            className="text-[11px] font-black underline uppercase hover:text-neutral-700 cursor-pointer"
                                                        >
                                                            Tandai Semua
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Notifications List */}
                                                <div className="max-h-80 overflow-y-auto divide-y-2 divide-black">
                                                    {!notifications_summary?.recent || notifications_summary.recent.length === 0 ? (
                                                        <div className="p-6 text-center text-xs font-bold text-neutral-500">
                                                            Belum ada notifikasi baru saat ini.
                                                        </div>
                                                    ) : (
                                                        notifications_summary.recent.map((notif) => (
                                                            <div
                                                                key={notif.id}
                                                                onClick={() => handleNotificationClick(notif)}
                                                                className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 hover:bg-neutral-50 ${
                                                                    !notif.read_at ? 'bg-[#FFFDF0]' : 'bg-white'
                                                                }`}
                                                            >
                                                                <div className={`w-7 h-7 border border-black flex items-center justify-center shrink-0 mt-0.5 ${
                                                                    notif.type === 'reminder' ? 'bg-[#FF6B6B] text-black' :
                                                                    notif.type === 'collaboration' ? 'bg-[#69D2E7] text-black' :
                                                                    'bg-[#A388EE] text-black'
                                                                }`}>
                                                                    {notif.type === 'reminder' ? (
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                    ) : (
                                                                        <Bell className="w-3.5 h-3.5" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <p className="text-xs font-black text-black truncate font-heading">
                                                                            {notif.title}
                                                                        </p>
                                                                        {!notif.read_at && (
                                                                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-neutral-700 line-clamp-2 mt-0.5 leading-snug">
                                                                        {notif.message}
                                                                    </p>
                                                                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-100 text-[10px] text-neutral-500 font-medium">
                                                                        <span>{new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                            {!notif.read_at && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                                                    className="text-[10px] font-bold hover:underline text-black flex items-center gap-0.5"
                                                                                    title="Tandai sudah dibaca"
                                                                                >
                                                                                    <Check className="w-3 h-3" />
                                                                                    Dibaca
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => handleArchive(notif.id, e)}
                                                                                className="text-[10px] font-bold hover:underline text-neutral-600 flex items-center gap-0.5"
                                                                                title="Arsipkan notifikasi"
                                                                            >
                                                                                <Archive className="w-3 h-3" />
                                                                                Arsip
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                {/* Footer: View All */}
                                                <div className="p-2 border-t-2 border-black bg-[#F4F0EA] text-center">
                                                    <Link
                                                        href="/notifications"
                                                        onClick={() => setNotifOpen(false)}
                                                        className="text-xs font-black uppercase text-black hover:underline flex items-center justify-center gap-1.5 font-heading"
                                                    >
                                                        Buka Arsip & Semua Notifikasi
                                                        <ExternalLink className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Profile Dropdown */}
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
                                                    href="/notifications"
                                                    onClick={() => setDropdownOpen(false)}
                                                    className="flex items-center justify-between px-4 py-2 text-sm font-bold text-black hover:bg-[#FFDC58] transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Bell className="w-4 h-4" />
                                                        Pusat Notifikasi
                                                    </div>
                                                    {(notifications_summary?.unread_count ?? 0) > 0 && (
                                                        <span className="bg-[#FF6B6B] text-black border border-black font-black text-xs px-1.5 py-0.2">
                                                            {notifications_summary?.unread_count}
                                                        </span>
                                                    )}
                                                </Link>

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
