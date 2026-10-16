import React from 'react';
import { Link } from '@inertiajs/react';
import { NeoBadge } from '@/Components/UI/NeoInput';

interface RecentRemindersCardProps {
    reminders: any[];
}

export default function RecentRemindersCard({ reminders = [] }: RecentRemindersCardProps) {
    return (
        <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-black">
                <h3 className="font-heading font-black text-sm uppercase tracking-wide">
                    Riwayat Pengiriman Pengingat
                </h3>
                <Link href="/admin/reminders" className="text-xs font-bold text-neutral-700 hover:underline">
                    Lihat Semua
                </Link>
            </div>

            {reminders.length === 0 ? (
                <p className="text-xs text-neutral-400 italic py-4">Belum ada aktivitas pengiriman pengingat.</p>
            ) : (
                <div className="space-y-2">
                    {reminders.map((log) => (
                        <div
                            key={log.id}
                            className="flex items-center justify-between p-2.5 bg-[#FFFDF8] border border-black text-xs font-medium"
                        >
                            <div className="overflow-hidden mr-2">
                                <p className="font-bold truncate text-black">{log.note?.title || 'Tugas'}</p>
                                <p className="text-[10px] text-neutral-500 truncate">Kepada: {log.recipient_email}</p>
                            </div>
                            <NeoBadge variant={log.status === 'sent' ? 'mint' : 'coral'} className="text-[9px]">
                                {log.status}
                            </NeoBadge>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
