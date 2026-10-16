import React from 'react';
import { Link, router } from '@inertiajs/react';
import MemberLayout from '@/Layouts/MemberLayout';
import NeoButton from '@/Components/UI/NeoButton';
import { Bell, CheckCheck, ArrowLeft, Archive } from 'lucide-react';
import { NotificationsProps } from './types';
import NotificationItem from './components/NotificationItem';

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

    return (
        <MemberLayout title="Pusat Notifikasi & Pengingat">
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
                        Daftar lengkap pemberitahuan pengingat deadline dan aktivitas kolaborasi catatan Anda.
                    </p>
                </div>

                {unread_count > 0 && current_tab === 'unread' && (
                    <NeoButton
                        variant="yellow"
                        size="md"
                        onClick={handleMarkAllAsRead}
                        className="w-full sm:w-auto justify-center"
                    >
                        <CheckCheck className="w-4 h-4 mr-1.5" />
                        Tandai Semua Dibaca
                    </NeoButton>
                )}
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex border-b-2 border-black mb-6">
                <Link
                    href="/notifications?tab=unread"
                    className={`flex items-center gap-2 px-5 py-3 font-heading font-black text-sm uppercase border-t-2 border-l-2 border-r-2 border-black -mb-[2px] transition-all ${
                        current_tab === 'unread'
                            ? 'bg-[#FFDC58] shadow-[2px_-2px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white hover:bg-neutral-50 text-neutral-600'
                    }`}
                >
                    <Bell className="w-4 h-4" />
                    <span>Aktif & Belum Dibaca</span>
                    {unread_count > 0 && (
                        <span className="bg-[#FF6B6B] text-black border border-black text-xs font-black px-1.5 py-0.2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            {unread_count}
                        </span>
                    )}
                </Link>

                <Link
                    href="/notifications?tab=archived"
                    className={`flex items-center gap-2 px-5 py-3 font-heading font-black text-sm uppercase border-t-2 border-l-2 border-r-2 border-black -mb-[2px] transition-all ${
                        current_tab === 'archived'
                            ? 'bg-[#A388EE] shadow-[2px_-2px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white hover:bg-neutral-50 text-neutral-600'
                    }`}
                >
                    <Archive className="w-4 h-4" />
                    <span>Arsip Notifikasi</span>
                    {archived_count > 0 && (
                        <span className="bg-[#FFFDF8] text-black border border-black text-xs font-black px-1.5 py-0.2">
                            {archived_count}
                        </span>
                    )}
                </Link>
            </div>

            {/* NOTIFICATIONS LIST */}
            <div className="space-y-3">
                {notifications.data.length === 0 ? (
                    <div className="border-2 border-black bg-white p-12 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="w-16 h-16 bg-[#FFFDF8] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-neutral-400" />
                        </div>
                        <h3 className="font-heading font-black text-lg uppercase text-black mb-1">
                            {current_tab === 'unread' ? 'Kotak Notifikasi Bersih!' : 'Belum Ada Arsip Notifikasi'}
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-600 font-medium max-w-sm mx-auto">
                            {current_tab === 'unread'
                                ? 'Anda telah membaca semua pemberitahuan dan pengingat deadline tugas.'
                                : 'Notifikasi yang telah diarsipkan akan tersimpan di sini.'}
                        </p>
                    </div>
                ) : (
                    notifications.data.map((notif) => (
                        <NotificationItem
                            key={notif.id}
                            notif={notif}
                            onMarkAsRead={handleMarkAsRead}
                            onArchive={handleArchive}
                            onDelete={handleDelete}
                        />
                    ))
                )}
            </div>

            {/* PAGINATION */}
            {notifications.last_page > 1 && (
                <div className="mt-8 p-4 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-bold text-neutral-600 font-mono">
                        Menampilkan {notifications.data.length} dari total {notifications.total} pemberitahuan
                    </span>
                    <div className="flex items-center gap-1.5">
                        {notifications.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`px-3 py-1.5 text-xs font-heading font-bold border-2 border-black transition-all ${
                                    link.active
                                        ? 'bg-[#FFDC58] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                        : !link.url
                                        ? 'bg-neutral-100 text-neutral-400 opacity-60 cursor-not-allowed'
                                        : 'bg-white hover:bg-neutral-100'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </MemberLayout>
    );
}
