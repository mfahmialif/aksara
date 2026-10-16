import React from 'react';
import { Link } from '@inertiajs/react';
import { AppNotification } from '@/types';
import NeoCard from '@/Components/UI/NeoCard';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { Check, Archive, Trash2, Clock, Users, Bell, ExternalLink } from 'lucide-react';

interface NotificationItemProps {
    notif: AppNotification;
    onMarkAsRead: (id: number) => void;
    onArchive: (id: number) => void;
    onDelete: (id: number) => void;
}

export default function NotificationItem({
    notif,
    onMarkAsRead,
    onArchive,
    onDelete,
}: NotificationItemProps) {
    const isUnread = !notif.read_at;

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

    const typeInfo = getTypeDetails(notif.type);

    return (
        <NeoCard
            color={isUnread ? 'bg-white' : 'bg-[#F9F7F1]'}
            className={`p-4 sm:p-5 transition-all ${
                isUnread ? 'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-90'
            }`}
        >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                    <div
                        className={`w-9 h-9 ${typeInfo.bg} border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0 mt-0.5`}
                    >
                        {typeInfo.icon}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <NeoBadge variant={typeInfo.badge} className="text-[10px] px-1.5 py-0">
                                {typeInfo.label}
                            </NeoBadge>
                            {isUnread && (
                                <span className="inline-block w-2 h-2 rounded-full bg-[#FF6B6B] border border-black" />
                            )}
                            <span className="text-[11px] font-mono text-neutral-500 font-bold">
                                {new Date(notif.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>

                        <h3 className="font-heading font-black text-base text-black leading-snug">
                            {notif.title}
                        </h3>

                        <p className="text-xs sm:text-sm font-medium text-neutral-700 leading-relaxed">
                            {notif.message}
                        </p>

                        {notif.action_url && (
                            <div className="pt-2">
                                <Link
                                    href={notif.action_url}
                                    onClick={() => {
                                        if (isUnread) onMarkAsRead(notif.id);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFDC58] hover:bg-[#ffe270] border-2 border-black font-heading font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                                >
                                    Buka Catatan Terkait
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-200">
                    {isUnread && (
                        <button
                            type="button"
                            onClick={() => onMarkAsRead(notif.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#7FBC8C] border-2 border-black text-xs font-heading font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                            title="Tandai Sudah Dibaca"
                        >
                            <Check className="w-3.5 h-3.5" />
                            <span className="sm:hidden">Baca</span>
                        </button>
                    )}

                    {!notif.archived_at ? (
                        <button
                            type="button"
                            onClick={() => onArchive(notif.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-neutral-100 border-2 border-black text-xs font-heading font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer text-neutral-700"
                            title="Arsipkan Notifikasi"
                        >
                            <Archive className="w-3.5 h-3.5" />
                            <span className="sm:hidden">Arsip</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onDelete(notif.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 border-2 border-black text-xs font-heading font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                            title="Hapus Permanen"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="sm:hidden">Hapus</span>
                        </button>
                    )}
                </div>
            </div>
        </NeoCard>
    );
}
