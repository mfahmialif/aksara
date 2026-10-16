import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AppNotification } from '@/types';
import Navbar from '@/Components/Navbar';
import NeoButton from '@/Components/UI/NeoButton';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoBadge } from '@/Components/UI/NeoInput';
import {
    Bell, Check, Archive, Trash2, Clock, Users,
    FileText, ExternalLink, CheckCheck, ArrowLeft, Calendar
} from 'lucide-react';

interface PaginatedNotifications {
    data: AppNotification[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface NotificationsProps {
    notifications: PaginatedNotifications;
    unread_count: number;
    archived_count: number;
    current_tab: 'unread' | 'archived';
}

export default function Notifications({
    notifications,
    unread_count = 0,
    archived_count = 0,
    current_tab = 'unread',
}: NotificationsProps) {
    const handleMarkAsRead = (id: number) => {
        router.post(`/notifications/${id}/read`, {}, { preserveScroll: true });
    };

    const handleMarkAllAsRead = () => {
        router.post('/notifications/read-all', {}, { preserveScroll: true });
    };

    const handleArchive = (id: number) => {
        router.post(`/notifications/${id}/archive`, {}, { preserveScroll: true });
    };

    const handleDelete = (id: number) => {
        if (confirm('Hapus notifikasi ini secara permanen?')) {
            router.delete(`/notifications/${id}`, { preserveScroll: true });
        }
    };

    const getTypeDetails = (type: string) => {
        switch (type) {
            case 'reminder':
                return {
                    badge: 'coral' as const,
                    label: 'Pengingat Deadline',
                    icon: <Clock className="w-4 h-4 text-black" />,
                    bg: 'bg-[#FF6B6B]',
                };
            case 'collaboration':
                return {
                    badge: 'sky' as const,
                    label: 'Kolaborasi',
                    icon: <Users className="w-4 h-4 text-black" />,
                    bg: 'bg-[#69D2E7]',
                };
            default:
                return {
                    badge: 'yellow' as const,
                    label: 'Sistem',
                    icon: <Bell className="w-4 h-4 text-black" />,
                    bg: 'bg-[#FFDC58]',
                };
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            <Head title="Pusat Notifikasi & Pengingat" />
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b-2 border-black">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                href="/app"
                                className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black gap-1 transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Ruang Kerja
                            </Link>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black font-heading uppercase text-black flex items-center gap-3">
                            <span className="p-2 bg-[#FFDC58] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] inline-flex">
                                <Bell className="w-7 h-7 text-black" />
                            </span>
                            Pusat Notifikasi
                        </h1>
                        <p className="text-sm text-neutral-600 font-medium mt-1">
                            Kelola pengingat deadline tugas, undangan kolaborasi, dan riwayat pemberitahuan Anda.
                        </p>
                    </div>

                    {unread_count > 0 && (
                        <NeoButton
                            variant="white"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="w-full sm:w-auto"
                        >
                            <CheckCheck className="w-4 h-4 mr-1 text-emerald-600" />
                            Tandai Semua Sudah Dibaca
                        </NeoButton>
                    )}
                </div>

                {/* Tabs Bar */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Link
                        href="/notifications?tab=unread"
                        className={`px-4 py-2 font-heading font-black text-sm uppercase tracking-wider border-2 border-black transition-all flex items-center gap-2 ${
                            current_tab === 'unread'
                                ? 'bg-[#FFDC58] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-0.5 translate-y-0.5'
                                : 'bg-white hover:bg-[#FFFDF0] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                    >
                        <span>Belum Dibaca</span>
                        {unread_count > 0 && (
                            <span className="bg-[#FF6B6B] text-black border border-black font-black text-xs px-2 py-0.5">
                                {unread_count}
                            </span>
                        )}
                    </Link>

                    <Link
                        href="/notifications?tab=archived"
                        className={`px-4 py-2 font-heading font-black text-sm uppercase tracking-wider border-2 border-black transition-all flex items-center gap-2 ${
                            current_tab === 'archived'
                                ? 'bg-[#A388EE] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-0.5 translate-y-0.5'
                                : 'bg-white hover:bg-[#FFFDF0] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                    >
                        <Archive className="w-4 h-4" />
                        <span>Arsip & Sudah Dibaca</span>
                        {archived_count > 0 && (
                            <span className="bg-neutral-200 text-black border border-black font-black text-xs px-2 py-0.5">
                                {archived_count}
                            </span>
                        )}
                    </Link>
                </div>

                {/* Notifications List */}
                {notifications.data.length === 0 ? (
                    <NeoCard color="bg-white" className="p-12 text-center max-w-xl mx-auto my-12">
                        <div className="w-16 h-16 bg-[#F4F0EA] border-2 border-black mx-auto flex items-center justify-center mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                            <Bell className="w-8 h-8 text-neutral-400" />
                        </div>
                        <h3 className="font-heading font-black text-lg uppercase mb-1">
                            {current_tab === 'unread' ? 'Tidak Ada Notifikasi Baru' : 'Belum Ada Arsip Notifikasi'}
                        </h3>
                        <p className="text-xs text-neutral-600 font-medium">
                            {current_tab === 'unread'
                                ? 'Semua tugas dan pengingat Anda sudah diperiksa. Kerja bagus!'
                                : 'Notifikasi yang sudah dibaca atau diarsipkan akan muncul di sini.'}
                        </p>
                    </NeoCard>
                ) : (
                    <div className="space-y-4">
                        {notifications.data.map((notif) => {
                            const details = getTypeDetails(notif.type);
                            const isUnread = !notif.read_at;

                            return (
                                <NeoCard
                                    key={notif.id}
                                    color={isUnread ? 'bg-[#FFFDF0]' : 'bg-white'}
                                    shadowSize="md"
                                    className="p-5 transition-all"
                                >
                                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                            <div className={`w-10 h-10 ${details.bg} border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 mt-0.5`}>
                                                {details.icon}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                    <NeoBadge variant={details.badge} className="text-[10px] px-2 py-0.5">
                                                        {details.label}
                                                    </NeoBadge>
                                                    {isUnread ? (
                                                        <span className="text-[10px] font-black uppercase bg-[#FF6B6B] px-1.5 py-0.5 border border-black">
                                                            Baru
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-1">
                                                            <Check className="w-3 h-3 text-emerald-600" />
                                                            Sudah Dibaca
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] text-neutral-500 font-medium ml-auto sm:ml-0">
                                                        {new Date(notif.created_at).toLocaleDateString('id-ID', {
                                                            weekday: 'long',
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </span>
                                                </div>

                                                <h3 className="font-heading font-black text-base text-black mb-1">
                                                    {notif.title}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-neutral-700 font-medium leading-relaxed">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-end sm:self-center shrink-0">
                                            {notif.action_url && (
                                                <Link href={notif.action_url}>
                                                    <NeoButton variant="yellow" size="sm" className="text-xs">
                                                        Buka Tautan
                                                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                                                    </NeoButton>
                                                </Link>
                                            )}

                                            {isUnread && (
                                                <NeoButton
                                                    variant="white"
                                                    size="sm"
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    className="text-xs"
                                                    title="Tandai sudah dibaca"
                                                >
                                                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                                    Dibaca
                                                </NeoButton>
                                            )}

                                            {!notif.is_archived && (
                                                <NeoButton
                                                    variant="white"
                                                    size="sm"
                                                    onClick={() => handleArchive(notif.id)}
                                                    className="text-xs"
                                                    title="Arsipkan notifikasi"
                                                >
                                                    <Archive className="w-3.5 h-3.5 mr-1" />
                                                    Arsip
                                                </NeoButton>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(notif.id)}
                                                className="p-2 bg-white hover:bg-rose-50 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all text-neutral-600 hover:text-rose-600 cursor-pointer"
                                                title="Hapus notifikasi"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </NeoCard>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {notifications.links && notifications.links.length > 3 && (
                    <div className="flex justify-center gap-1.5 mt-8">
                        {notifications.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1.5 text-xs font-heading font-black border-2 border-black transition-all ${
                                    link.active
                                        ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                        : link.url
                                        ? 'bg-white hover:bg-neutral-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-300'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
