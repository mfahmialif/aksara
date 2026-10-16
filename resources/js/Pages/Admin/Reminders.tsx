import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Note } from '@/types';
import AdminNavbar from '@/Components/AdminNavbar';
import NeoCard from '@/Components/UI/NeoCard';
import NeoButton from '@/Components/UI/NeoButton';
import { NeoBadge } from '@/Components/UI/NeoInput';
import { Bell, Clock, Calendar, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface RemindersPageProps {
    logs: {
        data: any[];
        links: any[];
        total: number;
    };
    upcoming: Note[];
}

export default function Reminders({ logs, upcoming = [] }: RemindersPageProps) {
    const handleRunRemindersManually = () => {
        // Run scheduler or reload
        router.reload();
    };

    return (
        <div className="min-h-screen bg-[#FFFDF8] flex flex-col font-sans">
            <Head title="Log & Antrean Pengingat (Admin)" />
            <AdminNavbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:py-8 flex-1 w-full space-y-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-black">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <NeoBadge variant="mint">Scheduler & Queue</NeoBadge>
                        </div>
                        <h1 className="text-3xl font-black font-heading uppercase text-black">
                            Monitoring Pengingat Email
                        </h1>
                        <p className="text-xs text-neutral-600 font-medium">
                            Pemantauan riwayat pengiriman notifikasi tenggat waktu tugas dan jadwal antrean pengingat mendatang.
                        </p>
                    </div>

                    <NeoButton variant="yellow" size="sm" onClick={handleRunRemindersManually}>
                        <RefreshCw className="w-3.5 h-3.5" />
                        Segarkan Status
                    </NeoButton>
                </div>

                {/* UPCOMING TASKS QUEUE */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <NeoBadge variant="coral">Antrean Tugas Mendatang ({upcoming.length})</NeoBadge>
                    </div>

                    <div className="border-2 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-[#69D2E7] border-b-2 border-black uppercase font-heading font-black">
                                    <tr>
                                        <th className="p-3">Judul Tugas</th>
                                        <th className="p-3">Pemilik</th>
                                        <th className="p-3">Tenggat Waktu (Deadline)</th>
                                        <th className="p-3 text-center">Jadwal Pengingat</th>
                                        <th className="p-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-black font-medium">
                                    {upcoming.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center text-neutral-500 italic">
                                                Tidak ada tugas yang sedang menunggu pengiriman pengingat.
                                            </td>
                                        </tr>
                                    ) : (
                                        upcoming.map((task) => (
                                            <tr key={task.id} className="hover:bg-neutral-50 transition-colors">
                                                <td className="p-3 font-bold text-black">{task.title}</td>
                                                <td className="p-3 text-neutral-700">
                                                    {task.group?.app?.owner?.name} ({task.group?.app?.owner?.email})
                                                </td>
                                                <td className="p-3 text-rose-700 font-bold">
                                                    {task.deadline_at && new Date(task.deadline_at).toLocaleString('id-ID')}
                                                </td>
                                                <td className="p-3 text-center font-bold">
                                                    {task.reminder_days_before} Hari Sebelumnya
                                                </td>
                                                <td className="p-3 text-center">
                                                    <NeoBadge variant="yellow" className="text-[10px]">
                                                        Dijadwalkan
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

                {/* LOGS TABLE */}
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
            </main>
        </div>
    );
}
