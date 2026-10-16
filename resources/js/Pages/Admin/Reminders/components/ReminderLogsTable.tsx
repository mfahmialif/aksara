import React from 'react';
import { NeoBadge } from '@/Components/UI/NeoInput';

interface ReminderLogsTableProps {
    logs: {
        data: any[];
        links: any[];
        total: number;
    };
}

export default function ReminderLogsTable({ logs }: ReminderLogsTableProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <NeoBadge variant="mint">Riwayat Pengingat Terkirim ({logs.total})</NeoBadge>
            </div>

            <div className="border-2 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-[#FFDC58] border-b-2 border-black uppercase font-heading font-black">
                            <tr>
                                <th className="p-3">Tugas</th>
                                <th className="p-3">Penerima Email</th>
                                <th className="p-3">Waktu Terkirim</th>
                                <th className="p-3 text-center">Status Pengiriman</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-black font-medium">
                            {logs.data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-4 text-center text-neutral-500 italic">
                                        Belum ada catatan log pengingat.
                                    </td>
                                </tr>
                            ) : (
                                logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="p-3 font-bold text-black">{log.note?.title || 'Catatan'}</td>
                                        <td className="p-3 text-neutral-700">{log.recipient_email}</td>
                                        <td className="p-3 text-neutral-600">
                                            {log.sent_at ? new Date(log.sent_at).toLocaleString('id-ID') : '-'}
                                        </td>
                                        <td className="p-3 text-center">
                                            <NeoBadge variant={log.status === 'sent' ? 'mint' : 'coral'} className="text-[10px]">
                                                {log.status === 'sent' ? 'Terkirim Sukses' : 'Gagal'}
                                            </NeoBadge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
